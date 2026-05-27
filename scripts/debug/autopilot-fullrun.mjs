#!/usr/bin/env node
/*
 * Full-run autopilot — plays Story Mode toward the END (League → Hall of Fame →
 * Mystery Figure → post-game) in real headless Chromium via a generic "event pump"
 * that classifies each screen and acts. Dev auto-win is used (god-mode allowed).
 *
 * Two passes:
 *   A) fresh run, pump the early/mid game as far as it reliably goes (tests events).
 *   B) seed the end-game (seedDebugMysteryLegendGate → 8 badges / full party / Champion's
 *      Hall) and pump to beat Champion → Rival → Hall of Fame → Mystery Figure → post-game.
 *
 * Injects an anime.js stub at init so battles render under the CDN-blocked sandbox.
 * Screenshots + transcript + findings → agent-state/playtest/fullrun*.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'agent-state', 'playtest');
const SHOTS = join(OUT, 'fullrun');
const PORT = Number(process.env.PORT || 5182);
const URL = `http://localhost:${PORT}/battle.html`;
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'].find(existsSync);
mkdirSync(SHOTS, { recursive: true });
const { chromium } = await import('playwright');

const transcript = [], findings = [], errors = [];
let errMark = 0, shotN = 0;
const stamp = () => new Date().toISOString().slice(11, 19);
const log = s => { const l = `[${stamp()}] ${s}`; transcript.push(l); console.log(l); };
const phase = s => { const l = `\n══ ${s} ══`; transcript.push(l); console.log(l); };
const finding = (sev, area, title, detail = '') => { findings.push({ sev, area, title, detail }); const l = `   ⚑ [${sev}] ${area} — ${title}${detail ? ' :: ' + detail : ''}`; transcript.push(l); console.log(l); };
const newErrors = () => { const e = errors.slice(errMark); errMark = errors.length; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ANIME_STUB = () => {
  const inst = { finished: Promise.resolve(), pause() {}, restart() {}, play() {}, reverse() {}, seek() {}, add() { return inst; } };
  const fn = () => inst;
  fn.set = () => {}; fn.remove = () => {}; fn.running = []; fn.stagger = v => v;
  fn.timeline = () => ({ add: () => ({ add: () => ({}), finished: Promise.resolve() }), finished: Promise.resolve(), pause() {} });
  fn.random = a => a; fn.path = () => () => 0; fn.setDashoffset = () => 0; fn.bezier = () => () => 0; fn.easings = {}; fn.suspendWhenDocumentHidden = false;
  window.anime = fn;
};

const read = async (page, fn) => { try { return JSON.parse(await page.evaluate(fn)); } catch (e) { return null; } };
async function shot(page, label) { shotN++; const n = `${String(shotN).padStart(3, '0')}-${label}.png`; await page.screenshot({ path: join(SHOTS, n) }).catch(() => {}); log(`   📸 ${n}`); return n; }
async function clickText(page, t, timeout = 900) { try { const l = page.locator(`button:has-text(${JSON.stringify(t)}), [role=button]:has-text(${JSON.stringify(t)})`).filter({ visible: true }).first(); if (await l.count()) { await l.click({ timeout }); await sleep(220); return true; } } catch (e) {} return false; }
async function clickSel(page, sel, timeout = 1500) { try { const l = page.locator(sel).filter({ visible: true }).first(); if (await l.count()) { await l.click({ timeout }); await sleep(220); return true; } } catch (e) {} return false; }
async function api(page, name, ...args) { return page.evaluate(({ n, a }) => { try { if (window.StoryMode && typeof window.StoryMode[n] === 'function') { window.StoryMode[n](...a); return 'ok'; } return 'nofn'; } catch (e) { return 'err:' + (e && e.message); } }, { n: name, a: args }); }
// Click the first VISIBLE button whose text matches `reSrc`, calling .click() directly in the
// DOM. Bypasses Playwright actionability checks, which silently time out on the animated
// cold-open / narration overlays ("Continue →", "Step into the chamber →", "Got it ▶▶").
async function forceClick(page, reSrc) {
  const r = await page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const vis = el => { try { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0.05; } catch (e) { return false; } };
    const btns = [...document.querySelectorAll('button,[role=button]')].filter(vis);
    const b = btns.find(x => re.test((x.textContent || '').replace(/\s+/g, ' ').trim()));
    if (b) { b.click(); return (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30); }
    return null;
  }, reSrc).catch(() => null);
  if (r) await sleep(250);
  return r;
}

async function classify(page) {
  return read(page, () => {
    const vis = el => { if (!el) return false; try { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; } catch (e) { return false; } };
    const scr = id => { const e = document.getElementById(id); return !!(e && !e.classList.contains('hidden') && vis(e)); };
    const st = window.state || {};
    const sm = (window.StoryMode && window.StoryMode.state) || {};
    const btns = [...document.querySelectorAll('button')].filter(vis).map(b => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const has = re => btns.some(t => re.test(t));
    const endTitle = document.getElementById('end-title');
    const fightBtn = document.querySelector('[data-cmd="fight"]');
    return JSON.stringify({
      eventIndex: sm.eventIndex ?? null, badges: sm.badges ?? null, gold: sm.gold ?? sm.money ?? null,
      teamLen: Array.isArray(sm.team) ? sm.team.length : null,
      unlocked: sm.unlockedGimmicks ? Array.from(sm.unlockedGimmicks) : [],
      battleActive: !st.isOver && (!!st.fActive || (fightBtn && vis(fightBtn))),
      endScreen: vis(endTitle), endTitle: endTitle ? (endTitle.innerText || '').slice(0, 28) : '',
      catchScreen: scr('screen-story-catch') && document.querySelectorAll('#story-catch-body button:not([disabled])').length > 0,
      professorCards: document.querySelectorAll('.prof-pick-card').length,
      cityScreen: scr('screen-story-city'),
      cityName: ((document.querySelector('#screen-story-city .story-screen-head-text') || {}).textContent || '').trim(),
      hof: /hall of fame/i.test((document.body.innerText || '').slice(0, 120)) || /HALL OF FAME/.test(endTitle && endTitle.innerText || ''),
      coldOpen: has(/Begin\s*→|Walk in/),
      infoModal: has(/Got it/),
      mysteryFight: has(/Mystery|Confront|Face the|The Figure|Begin the/),
      advanceBtn: btns.find(t => /^(Continue|Got it|Okay|OK|Next|Begin\s*→|Claim|Proceed|Onward|Take|Confront|Face|Confirm)/i.test(t)) || null,
      hasProfessorAction: has(/Pick Your Starter|Professor/),
      leaveCity: has(/Leave City|Continue Route/), gymBattle: has(/Gym Battle|Enter the Gym|Enter the Pokémon League|Victory Road|Pre-League|Enter Victory/),
      swapPicker: document.querySelectorAll('[onclick*="profSwap"], .prof-swap-slot').length,
    });
  });
}

async function autoWin(page) {
  await page.evaluate(() => { try { window.__devAutoWinBattle && window.__devAutoWinBattle(); } catch (e) {} });
  await sleep(650);
  if (!(await forceClick(page, '^Continue|→|Next'))) await api(page, 'afterBattleReturn');
  await sleep(600);
}

async function handleCatch(page) {
  await shot(page, 'catch');
  const threw = await clickSel(page, '#story-catch-body button:not([disabled])', 1500);
  if (!threw) await api(page, 'catchThrow', 'poke');
  await sleep(1100);
  for (let i = 0; i < 4; i++) {
    if (await clickText(page, 'Continue')) break;
    if (await api(page, 'catchContinue') === 'ok') break;
    if (await clickText(page, 'Send to PC') || await api(page, 'catchResolveSendToPC') === 'ok') break;
    await sleep(350);
  }
  await sleep(500);
}

async function pickStarter(page, tag) {
  await shot(page, `professor-${tag}`);
  await clickSel(page, '.prof-pick-card .draft-card-sprite', 1500) || await clickSel(page, '.prof-pick-card', 1200);
  await sleep(350);
  await clickSel(page, '#prof-accept-btn:not([disabled])', 1500) || await api(page, 'profAccept');
  await sleep(700);
  // mystery-mode legendary offer → a swap picker may appear (replace a party slot / send to PC)
  const c = await classify(page);
  if (c && c.swapPicker) { await clickSel(page, '[onclick*="profSwap"], .prof-swap-slot', 1200); await sleep(400); }
  await clickText(page, 'Continue');
  await sleep(300);
}

// One action given the current classification. Returns a short tag of what it did.
async function pumpStep(page, c, tag) {
  // One-time info/tutorial bulletins (Fatigue, mechanics-unlock) overlay everything — clear first.
  if (c.infoModal) { (await forceClick(page, 'Got it')) || await forceClick(page, '^OK$'); await sleep(250); return 'gotit'; }
  if (c.professorCards) { await pickStarter(page, tag); return 'starter'; }
  if (c.battleActive) { await autoWin(page); return 'autowin'; }
  if (c.hof) { await shot(page, 'hall-of-fame'); (await forceClick(page, 'Continue|→')) || await api(page, 'continuePostGame'); await sleep(700); return 'hof'; }
  if (c.endScreen) { (await forceClick(page, '^Continue|→|Next')) || await api(page, 'afterBattleReturn'); await sleep(400); return 'endscreen'; }
  if (c.catchScreen) { await handleCatch(page); return 'catch'; }
  if (c.cityScreen) {
    if (c.teamLen === 0) { await forceClick(page, '^OK$'); (await forceClick(page, 'Pick Your Starter|Professor')) || await api(page, 'enterProfessor'); await sleep(600); return 'enter-prof'; }
    if (c.gymBattle) { (await forceClick(page, 'Gym Battle|Enter the Gym|Enter the Pokémon League|Victory Road|Pre-League')) || await api(page, 'proceedToNextBattle'); await sleep(600); return 'gym'; }
    (await forceClick(page, 'Leave City|Continue Route|Enter the City|→')) || await api(page, 'proceedToNextBattle'); await sleep(600); return 'leave-city';
  }
  if (c.coldOpen) { const r = await forceClick(page, 'Begin\\s*→|Walk in'); return 'coldopen:' + (r || ''); }
  // narration / pre-battle / generic advance — click the primary advance/"→" button via the DOM
  const adv = await forceClick(page, 'Step into|Enter the|Stride|Walk in|→|^Continue|^Onward|^Proceed|^Begin|^Claim|Confront|Face the|^Take|^Fight');
  if (adv) return 'advance:' + adv.slice(0, 18);
  if (await api(page, 'proceedToNextBattle') === 'ok') return 'api-proceed';
  await page.mouse.click(215, 740).catch(() => {});
  return 'tap';
}

async function runPump(page, maxTicks, tag) {
  let prevEvt = -99, stall = 0, lastCity = '', lastBadges = -1, lastUnlocked = '', battleShots = 0;
  for (let tick = 0; tick < maxTicks; tick++) {
    const c = await classify(page);
    if (!c) { await sleep(500); continue; }
    const errs = newErrors();
    if (errs.length) finding('P2', 'runtime', `${errs.length} JS error(s) @evt ${c.eventIndex} (${tag})`, errs.slice(0, 3).map(e => e.text).join(' | '));
    if (c.badges !== lastBadges && c.badges != null) { log(`🏅 badges ${lastBadges} → ${c.badges} @evt ${c.eventIndex}`); await shot(page, `${tag}-badge-${c.badges}`); lastBadges = c.badges; }
    const us = (c.unlocked || []).join(',');
    if (us !== lastUnlocked) { log(`🔓 unlocked: [${us}] @evt ${c.eventIndex}`); lastUnlocked = us; }
    if (c.cityScreen && c.cityName && c.cityName !== lastCity) { log(`🏙  ${c.cityName} @evt ${c.eventIndex} (team ${c.teamLen}, ${c.gold}G)`); await shot(page, `${tag}-city-${c.eventIndex}`); lastCity = c.cityName; }
    if (c.battleActive && battleShots < 8) { await shot(page, `${tag}-battle-evt${c.eventIndex}`); battleShots++; }
    if (c.hof) { log('🏆 HALL OF FAME reached'); }

    const did = await pumpStep(page, c, tag);
    const c2 = await classify(page);
    if (c2 && c2.eventIndex === prevEvt && c.eventIndex === prevEvt && did !== 'starter') stall++; else stall = 0;
    prevEvt = c2 ? c2.eventIndex : prevEvt;
    if ((tick % 12) === 0) log(`  …${tag} tick ${tick}: evt=${c.eventIndex} badges=${c.badges} team=${c.teamLen} gold=${c.gold} → ${did}`);
    if (stall >= 12) {
      finding('P2', 'progression', `${tag} pump stalled at eventIndex ${c.eventIndex}`, `last=${did} screen=${JSON.stringify({ city: c.cityScreen, end: c.endScreen, catch: c.catchScreen, battle: c.battleActive, adv: c.advanceBtn, gym: c.gymBattle })}`);
      await shot(page, `${tag}-STALL-evt${c.eventIndex}`);
      await api(page, 'afterBattleReturn'); await api(page, 'proceedToNextBattle'); await clickText(page, 'Continue'); await clickText(page, 'OK'); await sleep(700);
      const c3 = await classify(page);
      if (c3 && c3.eventIndex === c.eventIndex) { log(`  hard stall at evt ${c.eventIndex} (${tag}) — stopping this pump`); return c3; }
      stall = 0;
    }
    await sleep(480);
  }
  return classify(page);
}

async function waitReady(page) {
  for (let i = 0; i < 120; i++) {
    const r = await read(page, () => { const o = document.getElementById('app-loading-overlay'); const l = o && !o.classList.contains('hidden') && getComputedStyle(o).display !== 'none'; return JSON.stringify({ loading: !!l, ready: typeof window.StoryMode === 'object' }); });
    if (r && !r.loading && r.ready) return true;
    await sleep(300);
  }
  return false;
}
async function startNewRun(page) {
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.evaluate(() => { try { window.settings.animations = false; window.settings.moveSfx = false; window.settings.catchAnims = false; } catch (e) {} });
  await page.evaluate(() => { try { document.getElementById('pwa-hint-dismiss')?.click(); } catch (e) {} });
  await api(page, 'showMenu'); await sleep(500);
  await api(page, 'openTrainerCreate'); await sleep(500);
  await page.fill('#story-create-name', 'Pilot').catch(() => {}); await sleep(200);
  await api(page, 'confirmTrainerAndStart'); await sleep(1400);
  await clickText(page, 'Begin →', 2000); await sleep(900);
}

// ===================================================================================
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const cleanup = () => { try { server.kill(); } catch {} };
process.on('exit', cleanup);
await sleep(1400);

let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 430, height: 850 }, deviceScaleFactor: 2 });
  await page.addInitScript(ANIME_STUB);
  page.on('pageerror', e => errors.push({ t: stamp(), kind: 'pageerror', text: String(e && e.message || e).split('\n')[0] }));
  page.on('console', m => { if (m.type() === 'error') { const tx = m.text(); if (!/ERR_CERT_AUTHORITY_INVALID|Failed to load resource/.test(tx)) errors.push({ t: stamp(), kind: 'console', text: tx.slice(0, 200) }); } });

  phase('PASS A — fresh run, play early/mid game');
  for (let i = 0; i < 25; i++) { try { await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 }); break; } catch { await sleep(500); } }
  await startNewRun(page);
  const aEnd = await runPump(page, 210, 'A');
  log(`PASS A end: ${JSON.stringify(aEnd)}`);
  await shot(page, 'passA-end');

  phase('PASS B — beat the Champion (seedStoryChampionWeakTestFromUrl)');
  log(`seed champion → ${await api(page, 'seedStoryChampionWeakTestFromUrl')}`);
  await sleep(1600); await shot(page, 'B-champion-seeded');
  const bEnd = await runPump(page, 55, 'B');
  log(`PASS B end (champion): ${JSON.stringify(bEnd)}`);
  await shot(page, 'B-champion-end');

  phase('PASS C — Hall of Fame → Mystery Figure → post-game (seedDebugPostHofClimax)');
  log(`seed post-HoF climax → ${await api(page, 'seedDebugPostHofClimax')}`);
  await sleep(1600); await shot(page, 'C-posthof-seeded');
  const cEndPass = await runPump(page, 80, 'C');
  log(`PASS C end (mystery/post-game): ${JSON.stringify(cEndPass)}`);
  await shot(page, 'C-end');

  phase('EXTRA — Mystery legend gate + HoF preview');
  for (const [fn, label] of [['seedDebugMysteryLegendGate', 'mystery-legend-gate'], ['previewHallOfFame', 'hof-preview']]) {
    const r = await api(page, fn); await sleep(1400);
    if (r === 'ok') { await shot(page, `seed-${label}`); const cc = await classify(page); if (cc && cc.battleActive) { await autoWin(page); await shot(page, `seed-${label}-won`); } const e = newErrors(); if (e.length) finding('P2', 'late-game', `${label} threw ${e.length} error(s)`, e.slice(0, 2).map(x => x.text).join(' | ')); else log(`   ${label} clean`); for (let i = 0; i < 5; i++) { if (!(await clickText(page, 'Got it') || await clickText(page, 'Continue') || await clickText(page, 'OK'))) break; await sleep(400); } }
    else log(`   ${fn} → ${r}`);
    await sleep(500);
  }

  phase('WRAP-UP');
  const cFinal = await classify(page);
  log(`FINAL: ${JSON.stringify(cFinal)}`);
  log(`real JS errors (excl. CDN noise): ${errors.length} · findings: ${findings.length} · screenshots: ${shotN}`);
  await shot(page, 'final');
  writeFileSync(join(OUT, 'fullrun-findings.json'), JSON.stringify({ generatedAt: new Date().toISOString(), screenshots: shotN, errorCount: errors.length, findings, passAEnd: aEnd, passBEnd: bEnd, passCEnd: cEndPass, finalState: cFinal, errors: errors.slice(0, 100) }, null, 2));
  writeFileSync(join(OUT, 'fullrun-transcript.txt'), transcript.join('\n'));
  log('wrote fullrun-findings.json + fullrun-transcript.txt');
  await browser.close();
} catch (e) {
  console.error('FULLRUN CRASH:', e && e.stack || e);
  writeFileSync(join(OUT, 'fullrun-transcript.txt'), transcript.join('\n') + '\n\nCRASH: ' + (e && e.stack || e));
  process.exitCode = 1;
} finally { if (browser) await browser.close().catch(() => {}); cleanup(); }
