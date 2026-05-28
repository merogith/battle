#!/usr/bin/env node
/**
 * Human-like Story Mode playthrough in a REAL headless browser.
 *
 * Boots dev-server.cjs, launches Chromium via Playwright, then plays Story Mode
 * the way a person would: clicks STORY MODE, creates a trainer, picks a starter,
 * and walks the full event timeline (cities, facilities, battles, Hall of Fame,
 * post-HoF Mystery / Crucible / Boss Arc). Battle progression uses the engine's
 * own onBattleEnd() so the run always completes; an optional --real-battles=N
 * actually clicks moves for the first N fights to exercise the battle UI.
 *
 * At every screen it captures: a screenshot, the StoryMode engine state, any
 * page/console errors (network/cert noise filtered out), and a DOM text scan for
 * human-noticeable glitches (undefined / NaN / [object Object] / unresolved
 * ${...}/{{...}} templates / "Infinity" etc.).
 *
 * Output:
 *   screenshots/playthrough/NN-label.png
 *   agent-state/playthrough/findings.json   (structured)
 *   agent-state/playthrough/trace.txt       (event-by-event)
 *
 * Run:  node scripts/debug/story-playthrough.mjs [--real-battles=1] [--max-iters=400]
 * Requires a Chromium binary (Playwright's, or PLAYWRIGHT_BROWSERS_PATH).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SHOTS = join(ROOT, 'screenshots', 'playthrough');
const OUTDIR = join(ROOT, 'agent-state', 'playthrough');
const PORT = Number(process.env.PORT || 5178);
const URL = `http://localhost:${PORT}/battle.html`;

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const hit = argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const REAL_BATTLES = Number(flag('real-battles', '0'));
const MAX_ITERS = Number(flag('max-iters', '400'));
const SHOT_EVERY = argv.includes('--shot-every');

mkdirSync(SHOTS, { recursive: true });
mkdirSync(OUTDIR, { recursive: true });

// ---- find a usable Chromium binary (Playwright's pinned one may be missing) ----
function findChromium() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean);
  for (const base of roots) {
    if (!existsSync(base)) continue;
    let dirs;
    try { dirs = readdirSync(base); } catch { continue; }
    // Prefer full chromium over headless_shell (renders the same, more complete).
    const ordered = dirs.filter(d => /^chromium-\d/.test(d)).concat(dirs.filter(d => /^chromium_headless_shell-\d/.test(d)));
    for (const d of ordered) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        const p = join(base, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return undefined; // let Playwright try its default
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(3, '0');

// ---- findings ----
const findings = [];
const trace = [];
function record(severity, area, msg, ctx) {
  findings.push({ severity, area, msg, ctx: ctx || null, t: Date.now() });
  const tag = severity.toUpperCase().padEnd(5);
  console.log(`[${tag}] ${area}: ${msg}${ctx ? '  ' + JSON.stringify(ctx) : ''}`);
}

// Network/cert noise that the sandbox's policy produces — never a game bug.
const NOISE = [
  /ERR_CERT_AUTHORITY_INVALID/i, /net::ERR_/i, /Failed to load resource/i,
  /localStorage is not available/i, /supabase/i, /online-pvp/i,
  /Failed to register a ServiceWorker/i, /manifest/i, /favicon/i,
  /the server responded with a status of/i,
];
const isNoise = s => NOISE.some(re => re.test(s));

async function main() {
  const exe = findChromium();
  console.log('Chromium:', exe || '(playwright default)');
  const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await sleep(1300);

  let browser, chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.error('playwright not installed'); server.kill(); process.exit(2); }

  let n = 0;
  try {
    browser = await chromium.launch({ executablePath: exe });
    const page = await browser.newPage({ viewport: { width: 430, height: 880 } }); // phone portrait
    page.setDefaultTimeout(4000); // never let a locator block for 30s

    page.on('pageerror', e => { const s = String(e && e.stack || e); if (!isNoise(s)) record('error', 'pageerror', s.split('\n')[0], { stack: s.split('\n').slice(1, 4).join(' | ') }); });
    page.on('console', m => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      const s = m.text();
      if (isNoise(s)) return;
      record(m.type() === 'error' ? 'error' : 'warn', `console.${m.type()}`, s.slice(0, 300));
    });

    // ---------- DOM/state helpers (run in page context) ----------
    const getState = () => page.evaluate(() => {
      const s = window.StoryMode && window.StoryMode.state;
      if (!s) return null;
      let ev = null;
      try { ev = window.STORY_EVENTS_RAW && window.STORY_EVENTS_RAW[s.eventIndex]; } catch {}
      return {
        active: !!s.active, eventIndex: s.eventIndex | 0, badges: s.badges | 0,
        gold: s.gold | 0, teamLen: (s.team || []).length,
        team: (s.team || []).map(m => m && (m.species || m.name)),
        pcLen: (s.pcBox || []).length,
        balls: s.balls || null,
        eventType: ev ? ev[1] : null, eventName: ev ? ev[2] : null, eventId: ev ? ev[0] : null,
        eventsTotal: (window.STORY_EVENTS_RAW || []).length,
        actions: ev ? (ev[5] || null) : null,
      };
    });

    // Scan only *visible* text for human-noticeable glitches.
    const scanDom = (label) => page.evaluate((label) => {
      const out = [];
      const seen = new Set();
      const BAD = [
        { re: /\bundefined\b/, name: 'undefined' },
        { re: /\bNaN\b/, name: 'NaN' },
        { re: /\[object (Object|Promise|HTML[A-Za-z]*Element)\]/, name: 'object-tostring' },
        { re: /\$\{[^}]*\}/, name: 'unresolved-template-literal' },
        { re: /\{\{[^}]*\}\}/, name: 'unresolved-handlebars' },
        { re: /\bInfinity\b/, name: 'Infinity' },
        { re: /\bnull\b(?!\s*pointer)/, name: 'null-text' },
      ];
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        const st = getComputedStyle(el);
        return st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0';
      };
      // Walk text nodes within visible, non-script elements.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const txt = (node.nodeValue || '').trim();
        if (!txt || txt.length < 2) continue;
        const el = node.parentElement;
        if (!el || /SCRIPT|STYLE|NOSCRIPT/.test(el.tagName)) continue;
        if (!isVisible(el)) continue;
        for (const b of BAD) {
          if (b.re.test(txt)) {
            const key = b.name + '|' + txt.slice(0, 60);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ kind: b.name, text: txt.slice(0, 100), where: el.id || el.className || el.tagName });
          }
        }
      }
      // Broken images: visible <img> that finished loading at 0×0. Only same-origin
      // (local sprite) failures count — external CDN blocks are environment noise.
      for (const img of document.querySelectorAll('img')) {
        if (!isVisible(img)) continue;
        if (!img.complete || img.naturalWidth > 0) continue;
        const src = img.currentSrc || img.src || '';
        if (!src || /^data:/.test(src)) continue;
        let sameOrigin = false;
        try { sameOrigin = new URL(src, location.href).origin === location.origin; } catch {}
        if (!sameOrigin) continue;
        const rel = src.replace(location.origin, '');
        const key = 'broken-image|' + rel;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ kind: 'broken-image', text: rel.slice(0, 100), where: img.id || img.alt || img.className || 'img' });
      }
      return out;
    }, label);

    const shot = async (label) => {
      n++;
      const f = join(SHOTS, `${pad(n)}-${label}`.replace(/[^a-z0-9._-]/gi, '_') + '.png');
      try { await page.screenshot({ path: f, fullPage: false }); } catch {}
      return f;
    };

    const capture = async (label, ctx) => {
      await sleep(550); // let crossfade transitions settle so shots aren't mid-animation
      const anomalies = await scanDom(label);
      for (const a of anomalies) {
        record('bug', `dom.${a.kind}`, `"${a.text}" in <${a.where}>`, { label, ...(ctx || {}) });
      }
      if (SHOT_EVERY || true) await shot(label);
    };

    // Evaluate-based click: matches the first VISIBLE button/clickable whose text
    // contains `text`, and clicks it in-page. Avoids Playwright actionability hangs
    // on animating/scrolling buttons.
    // Case-insensitive (CSS text-transform makes rendered labels differ from raw
    // textContent, e.g. "◆ Story Mode" → "STORY MODE"). Among visible matches,
    // click the one on the topmost layer (highest z-index, then last in DOM) so
    // full-screen overlays/tips appended to <body> win over stale buttons beneath.
    const clickText = (text) => page.evaluate((text) => {
      const want = text.toLowerCase();
      const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false; const st = getComputedStyle(el); return st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0'; };
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const zOf = (el) => { let z = 0, n = el; while (n && n !== document.body) { const v = parseInt(getComputedStyle(n).zIndex, 10); if (!isNaN(v)) z = Math.max(z, v); n = n.parentElement; } return z; };
      const els = [...document.querySelectorAll('button, [role=button], [onclick]')]
        .filter(el => vis(el) && norm(el.textContent).includes(want));
      if (!els.length) return false;
      els.sort((a, b) => zOf(a) - zOf(b)); // ascending; take the topmost
      els[els.length - 1].click();
      return true;
    }, text);
    const clickSel = (sel) => page.evaluate((sel) => { const el = document.querySelector(sel); if (el) { el.click(); return true; } return false; }, sel);
    // Dismiss anything blocking the real screen, the way a player clicks through:
    //  - showGameAlert tips render as .modal → closed by Escape (global handler)
    //  - cold-open / city-arrival / storyline screens are custom z-9998 overlays
    //    with "Begin →" / "Enter the City →" buttons.
    const dismissOverlays = async () => {
      for (let pass = 0; pass < 6; pass++) {
        let did = false;
        if ((await clickText('Begin →')) || (await clickText('Enter the City')) || (await clickText('Walk in')) || (await clickText('Set out'))) { did = true; await sleep(360); }
        const nModal = await page.evaluate(() => document.querySelectorAll('.modal:not(.hidden)').length).catch(() => 0);
        if (nModal) { await page.keyboard.press('Escape'); await sleep(260); did = true; }
        if (!did) break;
      }
    };

    // The post-battle VICTORY overlay (showVictoryOverlay) is a z-9999
    // role=dialog that advances the story via its callback when dismissed
    // (Enter / Escape / click, or a 6s auto-close). Tap Enter to advance
    // promptly — the way a player taps "Continue →" — so the next scene
    // renders on its own instead of under a stale reward overlay.
    const dismissVictory = async () => {
      const present = await page.evaluate(() => {
        return [...document.querySelectorAll('[role=dialog][aria-modal="true"]')].some(d => {
          const r = d.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && /victory/i.test(d.textContent || '');
        });
      }).catch(() => false);
      if (present) { await page.keyboard.press('Enter'); await sleep(550); return true; }
      return false;
    };

    const callSM = (method, ...args) => page.evaluate(({ method, args }) => {
      try {
        const fn = window.StoryMode && window.StoryMode[method];
        if (typeof fn !== 'function') return { ok: false, err: 'no method ' + method };
        const r = fn.apply(window.StoryMode, args);
        return { ok: true, r: (r && typeof r === 'object') ? '[obj]' : r };
      } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
    }, { method, args });

    // ---------------- BOOT ----------------
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await sleep(2600); // data load
    await clickText('OK'); // dismiss "Add to Home Screen" tip
    await sleep(300);
    await capture('menu');

    if (!(await clickText('STORY MODE'))) record('error', 'menu', 'No STORY MODE button found');
    await sleep(700);
    await capture('story-landing');

    // Story landing → NEW ADVENTURE opens the trainer-creation screen.
    if (!(await clickText('NEW ADVENTURE'))) record('error', 'menu', 'No NEW ADVENTURE button found');
    await sleep(900);
    await capture('trainer-create');

    // Trainer creation: name + defaults, then Begin.
    await page.fill('#story-create-name', 'TESTER', { timeout: 4000 }).catch(() => record('warn', 'create', 'name input not fillable'));
    await sleep(200);
    await capture('trainer-create-named');
    let begun = await clickSel('#story-create-begin');
    if (!begun) begun = await clickText('Begin Adventure');
    if (!begun) { const r = await callSM('confirmTrainerAndStart'); begun = r.ok; if (!r.ok) record('error', 'create', 'confirmTrainerAndStart failed: ' + r.err); }
    await sleep(1300);
    await capture('storyline-reveal');

    // Storyline-reveal + City0 cold-open intros sit before the real city UI.
    await dismissOverlays();
    await capture('story-begin');

    let st = await getState();
    if (!st) { record('error', 'create', 'StoryMode.state null after begin — cannot play'); }
    else record('info', 'progress', `Run started: gold=${st.gold} eventIdx=${st.eventIndex} events=${st.eventsTotal}`);

    // ---------------- helpers for the loop ----------------
    const pickStarterViaProfessor = async (ctx) => {
      await dismissOverlays();
      await callSM('enterProfessor');
      await sleep(700);
      await dismissOverlays();
      await capture('professor', ctx);
      // Prefer clicking a real choice card; fall back to the API.
      const before = (await getState())?.teamLen || 0;
      const r1 = await callSM('profSelectChoice', 0);
      await sleep(400);
      await capture('professor-choice', ctx);
      const r2 = await callSM('profAccept');
      await sleep(800);
      const after = (await getState())?.teamLen || 0;
      if (after <= before) record('error', 'starter', `Starter not added (team ${before}->${after})`, { ...ctx, r1, r2 });
      else record('info', 'starter', `Starter accepted (team ${before}->${after})`, ctx);
      await capture('after-starter', ctx);
    };

    const facilitiesSeen = new Set();
    const tryFacility = async (method, label, ctx) => {
      if (facilitiesSeen.has(method)) return;
      const r = await callSM(method);
      if (!r.ok) { if (!/no method/.test(r.err)) record('warn', `facility.${label}`, r.err, ctx); return; }
      facilitiesSeen.add(method);
      await sleep(650);
      await dismissOverlays();
      await capture(`facility-${label}`, ctx);
      await callSM('enterCity'); // return to city
      await sleep(450);
      await dismissOverlays();
    };

    const exerciseCity = async (ctx) => {
      // Visit each facility offered by this city once across the run.
      const map = [
        ['enterShop', 'mart'], ['enterPokemonCenter', 'center'], ['enterTutor', 'tutor'],
        ['enterEvolutionLab', 'evolab'], ['enterEVTrainer', 'evtrainer'], ['enterArtifactHall', 'artifact'],
        ['enterColress', 'colress'], ['enterFanClub', 'fanclub'], ['enterCasino', 'casino'],
        ['enterSafariZone', 'safari'], ['enterCrucible', 'crucible'],
      ];
      for (const [m, lbl] of map) {
        if (ctx.actions && Array.isArray(ctx.actions)) {
          // only attempt facilities that look offered, but always try center/mart
        }
        await tryFacility(m === 'enterShop' ? 'enterShop' : m, lbl, ctx);
      }
    };

    const forceWin = async (ctx) => {
      const r = await callSM('onBattleEnd', true, `Victory: ${ctx.eventName}`, '');
      if (!r.ok) { record('error', 'battle.forceWin', r.err, ctx); return false; }
      await sleep(700);
      await dismissVictory(); // tap "Continue →" so the next scene isn't drawn under the reward overlay
      return true;
    };

    const playRealBattle = async (ctx) => {
      // Click FIGHT → first move, loop until battle resolves or stalls.
      record('info', 'battle.real', `Playing battle by clicking: ${ctx.eventName}`, ctx);
      const startIdx = ctx.eventIndex;
      // Clear the battle-intro card AND any lingering start-of-game cold-open
      // (their button is "Continue →", which dismissOverlays doesn't click) and
      // wait for the command menu — otherwise the turn loop sees no menu, never
      // acts, and bails to a force-win. This is the step a human does by hand.
      for (let w = 0; w < 14; w++) {
        const cmd = await page.locator('#command-menu:not(.hidden)').count().catch(() => 0);
        if (cmd) break;
        if (!(await clickText('Continue'))) { await page.locator('#battle-log').click({ timeout: 500 }).catch(() => {}); }
        await sleep(650);
      }
      let turns = 0;
      const t0 = Date.now();
      while (turns < 60 && Date.now() - t0 < 90000) {
        const s = await getState();
        if (!s || s.eventIndex !== startIdx || s.eventType !== 'Battle') break; // battle ended
        const cmdVisible = await page.locator('#command-menu:not(.hidden)').count().catch(() => 0);
        if (cmdVisible) {
          await page.evaluate(() => window.showMoves && window.showMoves());
          await sleep(350);
          if (turns < 4) await shot(`battle-turn${turns}`);
          const moveBtn = page.locator('#move-menu button:not([disabled])').first();
          if (await moveBtn.count()) { await moveBtn.click({ timeout: 2000 }).catch(() => {}); }
          else { await page.evaluate(() => window.runAway && window.runAway()); }
          turns++;
          await sleep(1400);
        } else {
          // animation / forced switch / faint prompt / between-turn "Continue" — try to advance
          if (!(await clickText('Continue'))) { await page.locator('#battle-log').click({ timeout: 800 }).catch(() => {}); }
          await sleep(900);
          // forced switch?
          const partyVisible = await page.locator('#party-screen:not(.hidden), .party-overlay:not(.hidden)').count().catch(() => 0);
          if (partyVisible) { await page.locator('.party-slot, [data-party-index]').first().click({ timeout: 1500 }).catch(() => {}); await sleep(900); }
          const idle = (Date.now() - t0);
          if (idle > 12000 && turns === 0) break; // never got a turn — bail to force-win
        }
      }
      const s = await getState();
      if (s && s.eventIndex === startIdx && s.eventType === 'Battle') {
        record('warn', 'battle.real.stall', `Real battle didn't resolve in ${turns} turns; force-winning`, ctx);
        return forceWin(ctx);
      }
      await capture('battle-victory', ctx);
      await dismissVictory();
      record('info', 'battle.real.done', `Real battle resolved in ${turns} turns`, ctx);
      return true;
    };

    // ---------------- MAIN LOOP ----------------
    let prev = null, stuck = 0, realBattlesPlayed = 0;
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      st = await getState();
      if (!st) { record('error', 'loop', 'state null'); break; }
      if (!st.active) { record('info', 'progress', `Run inactive at iter ${iter} (idx=${st.eventIndex})`); break; }
      const ctx = { iter, eventIndex: st.eventIndex, type: st.eventType, eventName: st.eventName, badges: st.badges };
      trace.push(`iter=${iter} idx=${st.eventIndex} type=${st.eventType} name=${st.eventName} badges=${st.badges} team=${st.teamLen} pc=${st.pcLen} gold=${st.gold}`);
      await dismissOverlays();

      if (st.eventType === 'City') {
        await capture(`city-${st.eventName}`, ctx);
        if (st.teamLen === 0) {
          await pickStarterViaProfessor(ctx);
        } else {
          await exerciseCity({ ...ctx, actions: st.actions });
          // top up toward party cap via Professor if available
          const cap = Math.min(6, 2 + st.badges);
          if (st.actions && st.actions.includes('Professor') && st.teamLen < cap) {
            for (let k = st.teamLen; k < cap; k++) {
              await callSM('enterProfessor'); await sleep(250);
              await callSM('profSelectChoice', 0); await sleep(150);
              await callSM('profAccept'); await sleep(300);
            }
          }
        }
        // post-HoF hub guard
        if (st.badges >= 8 && st.eventName === 'City9') {
          const cleared = await page.evaluate(() => { const s = window.StoryMode.state; return !!(s.gymCleared && s.gymCleared[8]); });
          if (cleared) { record('info', 'progress', 'Reached post-HoF hub (City9) — main story cleared.'); break; }
        }
        const r = await callSM('proceedToNextBattle');
        if (!r.ok) { record('error', 'proceedToNextBattle', r.err, ctx); break; }
        await sleep(1100); // battle intro (real setTimeout)
        const s2 = await getState();
        if (s2 && s2.eventType === 'Battle') {
          await capture(`battle-intro-${s2.eventName}`, { ...ctx, battle: s2.eventName });
          if (realBattlesPlayed < REAL_BATTLES) { await playRealBattle({ ...ctx, eventIndex: s2.eventIndex, eventName: s2.eventName, eventType: 'Battle' }); realBattlesPlayed++; }
          else if (!(await forceWin({ ...ctx, eventName: s2.eventName }))) break;
        } else if (s2 && s2.eventType === 'Hall of Fame') {
          record('info', 'progress', `Reached Hall of Fame after city iter ${iter}`);
        }
        await sleep(700);
      } else if (st.eventType === 'Battle') {
        await capture(`battle-intro-${st.eventName}`, ctx);
        if (realBattlesPlayed < REAL_BATTLES) { await playRealBattle(ctx); realBattlesPlayed++; }
        else if (!(await forceWin(ctx))) break;
        await sleep(700);
      } else if (st.eventType === 'Hall of Fame') {
        await capture('hall-of-fame', ctx);
        record('info', 'progress', 'Reached Hall of Fame — main story beaten!');
        break;
      } else {
        record('warn', 'loop.unknownType', `Unknown event type "${st.eventType}" at idx ${st.eventIndex}`, ctx);
        await page.evaluate(() => { const s = window.StoryMode.state; s.eventIndex = Math.min((window.STORY_EVENTS_RAW || []).length - 1, (s.eventIndex | 0) + 1); });
      }

      const cur = await getState();
      if (prev && cur && cur.eventIndex === prev.eventIndex && cur.teamLen === prev.teamLen && cur.badges === prev.badges) {
        if (++stuck >= 4) { record('error', 'loop.stuck', `Stuck at idx=${cur.eventIndex} (${cur.eventName}) for 4 iters`, ctx); break; }
      } else stuck = 0;
      prev = cur;
    }

    // ---------------- POST-HOF ----------------
    record('info', 'progress', 'Entering post-HoF phase');
    await dismissVictory(); // clear any lingering Champion/HoF reward overlay first
    await callSM('continuePostGame'); await sleep(1200);
    await dismissVictory();
    await capture('posthof-after-continue');
    const sm = await getState();
    const src = await page.evaluate(() => window.StoryMode.state.crucibleBattleSource || null);
    if (src === 'postHofMystery') { await callSM('onBattleEnd', true, 'Mystery cleared', ''); await sleep(900); await dismissVictory(); await capture('posthof-mystery-cleared'); }
    await callSM('enterCrucible'); await sleep(700); await capture('crucible');
    await callSM('crucibleMysteryFight'); await sleep(700);
    await callSM('leaveCrucible'); await sleep(400);
    await callSM('enterFrontierHub'); await sleep(700); await capture('frontier-hub');
    await callSM('frontierStartRun'); await sleep(700); await capture('frontier-run');
    await callSM('frontierSurrender'); await sleep(500);

    // PC / collection edge captures
    await callSM('enterPokemonCenter'); await sleep(600); await capture('posthof-center');
    await callSM('openCollection'); await sleep(600); await capture('collection');

    const finalState = await getState();
    record('info', 'final', `Final: idx=${finalState?.eventIndex} badges=${finalState?.badges} gold=${finalState?.gold} team=${JSON.stringify(finalState?.team)}`);

  } catch (e) {
    record('error', 'harness', String(e && e.stack || e).split('\n').slice(0, 3).join(' | '));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  // ---------------- WRITE REPORT ----------------
  const counts = findings.reduce((a, f) => (a[f.severity] = (a[f.severity] || 0) + 1, a), {});
  writeFileSync(join(OUTDIR, 'findings.json'), JSON.stringify({ counts, findings }, null, 2));
  writeFileSync(join(OUTDIR, 'trace.txt'), trace.join('\n'));
  console.log('\n========== SUMMARY ==========');
  console.log('counts:', JSON.stringify(counts));
  console.log('screenshots:', SHOTS);
  console.log('findings:', join(OUTDIR, 'findings.json'));
}

main();
