#!/usr/bin/env node
/*
 * Full-run autopilot — plays Story Mode from start to END (League → Hall of Fame →
 * Mystery Figure) in real headless Chromium, using a generic "event pump" that classifies
 * each screen and takes the right action, plus dev auto-win (god-mode allowed).
 *
 * It injects an anime.js stub at init so the offline/CDN-blocked sandbox can still render
 * battles (anime.js is CDN-only — see PLAYTEST_REPORT P1-3). After the main march it also
 * exercises the late-game debug seeders (Champion, Mystery legend gate, post-HoF climax).
 *
 * Screenshots + transcript + findings → agent-state/playtest/.
 * Usage: node scripts/debug/autopilot-fullrun.mjs
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
async function clickText(page, t, timeout = 900) { try { const l = page.locator(`button:has-text(${JSON.stringify(t)}), [role=button]:has-text(${JSON.stringify(t)})`).first(); if (await l.count()) { await l.click({ timeout }); await sleep(250); return true; } } catch (e) {} return false; }
async function clickSel(page, sel, timeout = 1500) { try { const l = page.locator(sel).first(); if (await l.count()) { await l.click({ timeout }); await sleep(250); return true; } } catch (e) {} return false; }
async function api(page, name, ...args) { return page.evaluate(({ n, a }) => { try { if (window.StoryMode && typeof window.StoryMode[n] === 'function') { window.StoryMode[n](...a); return 'ok'; } return 'nofn'; } catch (e) { return 'err:' + (e && e.message); } }, { n: name, a: args }); }

async function classify(page) {
  return read(page, () => {
    const vis = el => { if (!el) return false; try { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; } catch (e) { return false; } };
    const scr = id => { const e = document.getElementById(id); return !!(e && !e.classList.contains('hidden') && vis(e)); };
    const st = window.state || {};
    const sm = (window.StoryMode && window.StoryMode.state) || {};
    const btns = [...document.querySelectorAll('button')].filter(vis).map(b => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const has = re => btns.some(t => re.test(t));
    const endTitle = document.getElementById('end-title');
    return JSON.stringify({
      eventIndex: sm.eventIndex ?? null, badges: sm.badges ?? null, gold: sm.gold ?? sm.money ?? null,
      teamLen: Array.isArray(sm.team) ? sm.team.length : null,
      unlocked: sm.unlockedGimmicks ? Array.from(sm.unlockedGimmicks) : [],
      battleActive: !st.isOver && (!!st.fActive || has(/^FIGHT$/i) || !!document.querySelector('[data-cmd="fight"]') && vis(document.querySelector('[data-cmd="fight"]'))),
      endScreen: vis(endTitle), endTitle: endTitle ? (endTitle.innerText || '').slice(0, 30) : '',
      catchScreen: scr('screen-story-catch'),
      professorCards: document.querySelectorAll('.prof-pick-card').length,
      cityScreen: scr('screen-story-city'),
      cityName: (document.querySelector('#screen-story-city .story-screen-head-text') || {}).textContent || '',
      hof: scr('screen-end') && /hall of fame|champion/i.test((endTitle && endTitle.innerText || '') + (document.body.innerText || '').slice(0, 60)),
      coldOpen: has(/Begin\s*→|Walk in/),
      advanceBtn: btns.find(t => /^(Continue|Got it|Okay|OK|Next|Begin\s*→|Claim|Proceed|Onward|To the)/i.test(t)) || null,
      leaveCity: has(/Leave City/), gymBattle: has(/Gym Battle|Enter the Gym|Enter the Pokémon League|Victory Road|Pre-League|Enter Victory/),
      mysteryReady: has(/Mystery|Confront|The Figure|Face/),
    });
  });
}

async function handleCatch(page) {
  await shot(page, 'catch');
  // throw the first enabled ball (top = Poké Ball); tutorial throw is guaranteed
  const threw = await clickSel(page, '#story-catch-body button:not([disabled])', 1500);
  if (!threw) { await api(page, 'catchThrow', 'poke'); }
  await sleep(1200);
  // resolve: continue / send-to-PC if party full / swap
  for (let i = 0; i < 4; i++) {
    if (await clickText(page, 'Continue')) break;
    const r = await api(page, 'catchContinue');
    if (r === 'ok') break;
    if (await clickText(page, 'Send to PC') || await api(page, 'catchResolveSendToPC') === 'ok') break;
    await sleep(400);
  }
  await sleep(600);
}

async function pickStarter(page) {
  await shot(page, 'professor');
  await clickSel(page, '.prof-pick-card .draft-card-sprite', 1500) || await clickSel(page, '.prof-pick-card', 1200);
  await sleep(400);
  await clickSel(page, '#prof-accept-btn:not([disabled])', 1500) || await api(page, 'profAccept');
  await sleep(800);
}

async function autoWin(page) {
  await page.evaluate(() => { try { window.__devAutoWinBattle && window.__devAutoWinBattle(); } catch (e) {} });
  await sleep(700);
  // return from the VICTORY end screen into the story flow
  if (!(await clickText(page, 'Continue'))) await api(page, 'afterBattleReturn');
  await sleep(700);
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

  phase('BOOT + NEW RUN');
  for (let i = 0; i < 25; i++) { try { await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 }); break; } catch { await sleep(500); } }
  await startNewRun(page);
  let c = await classify(page);
  log(`start: ${JSON.stringify(c)}`);

  phase('EVENT PUMP → play to the end');
  let prevEvt = -99, stall = 0, lastCity = '', lastBadges = -1, lastUnlocked = '', battleShots = 0;
  for (let tick = 0; tick < 220; tick++) {
    c = await classify(page);
    if (!c) { log('classify failed; retry'); await sleep(600); continue; }
    const errs = newErrors();
    if (errs.length) finding('P2', 'runtime', `${errs.length} JS error(s) near eventIndex ${c.eventIndex}`, errs.slice(0, 3).map(e => e.text).join(' | '));

    if (c.badges !== lastBadges && c.badges != null) { log(`🏅 badges ${lastBadges} → ${c.badges} @evt ${c.eventIndex}`); await shot(page, `badge-${c.badges}`); lastBadges = c.badges; }
    const unlockedStr = (c.unlocked || []).join(',');
    if (unlockedStr !== lastUnlocked) { log(`🔓 mechanics unlocked: [${unlockedStr}] @evt ${c.eventIndex}`); lastUnlocked = unlockedStr; }
    if (c.cityScreen && c.cityName && c.cityName !== lastCity) { log(`🏙  ${c.cityName} @evt ${c.eventIndex}`); await shot(page, `city-${c.eventIndex}-${c.cityName.replace(/\W+/g, '')}`); lastCity = c.cityName; }

    let acted = true;
    if (c.professorCards) { log(`  professor @evt ${c.eventIndex}`); await pickStarter(page); }
    else if (c.battleActive) { if (battleShots < 6) { await shot(page, `battle-evt${c.eventIndex}`); battleShots++; } await autoWin(page); }
    else if (c.hof) { log('  🏆 HALL OF FAME'); await shot(page, 'hall-of-fame'); await clickText(page, 'Continue') || await api(page, 'continuePostGame'); await sleep(800); }
    else if (c.endScreen) { await clickText(page, 'Continue') || await api(page, 'afterBattleReturn'); await sleep(500); }
    else if (c.catchScreen) { log(`  catch @evt ${c.eventIndex}`); await handleCatch(page); }
    else if (c.cityScreen) { if (c.gymBattle) { await clickText(page, 'Gym Battle') || await clickText(page, 'Enter the Gym') || await clickText(page, 'Enter the Pokémon League') || await api(page, 'proceedToNextBattle'); } else { await clickText(page, 'Leave City') || await api(page, 'proceedToNextBattle'); } await sleep(700); }
    else if (c.coldOpen) { await clickText(page, 'Begin →') || await clickText(page, 'Walk in'); }
    else if (c.advanceBtn) { await clickText(page, c.advanceBtn); }
    else { acted = await api(page, 'proceedToNextBattle') === 'ok'; if (!acted) { await page.mouse.click(215, 740).catch(() => {}); } }

    const c2 = await classify(page);
    if (c2 && c2.eventIndex === prevEvt && c.eventIndex === prevEvt) stall++; else stall = 0;
    prevEvt = c2 ? c2.eventIndex : prevEvt;
    if ((tick % 10) === 0) log(`  …tick ${tick}: evt=${c.eventIndex} badges=${c.badges} team=${c.teamLen} gold=${c.gold}`);

    if (stall >= 10) {
      finding('P2', 'progression', `Pump stalled at eventIndex ${c.eventIndex}`, `screen=${JSON.stringify({ city: c.cityScreen, end: c.endScreen, catch: c.catchScreen, battle: c.battleActive, adv: c.advanceBtn })}`);
      await shot(page, `STALL-evt${c.eventIndex}`);
      // escalate: try every advance path
      await api(page, 'afterBattleReturn'); await api(page, 'proceedToNextBattle'); await clickText(page, 'Continue'); await clickText(page, 'Leave City'); await sleep(800);
      const c3 = await classify(page);
      if (c3 && c3.eventIndex === c.eventIndex) { log(`  hard stall — giving up the legit march at evt ${c.eventIndex}`); break; }
      stall = 0;
    }
    // reached the final event (Mystery Figure is the last array index) and beat it
    if (c.eventIndex != null && c.eventIndex >= 66 && !c.battleActive && !c.endScreen) { log('  reached final event region'); await shot(page, 'final-event'); }
    await sleep(550);
  }
  const cEnd = await classify(page);
  log(`MARCH END: ${JSON.stringify(cEnd)}`);
  await shot(page, 'march-end');

  // ===== Late-game set-pieces via debug seeders (god-mode test entry points) =====
  phase('LATE-GAME SEEDERS (Champion / Mystery legend gate / post-HoF climax)');
  const seeders = [
    ['seedStoryChampionWeakTestFromUrl', 'champion'],
    ['seedDebugMysteryLegendGate', 'mystery-legend-gate'],
    ['seedDebugPostHofClimax', 'post-hof-climax'],
    ['previewHallOfFame', 'hall-of-fame-preview'],
  ];
  for (const [fn, label] of seeders) {
    const before = newErrors().length;
    const r = await api(page, fn);
    await sleep(1500);
    if (r === 'ok') {
      await shot(page, `seed-${label}`);
      const errs = newErrors();
      if (errs.length) finding('P2', 'late-game', `${label} seeder threw ${errs.length} error(s)`, errs.slice(0, 3).map(e => e.text).join(' | '));
      else log(`   seeder ${fn} (${label}) ran clean`);
      // if it dropped us into a battle, win it
      const cc = await classify(page);
      if (cc && cc.battleActive) { log(`   → ${label} battle, auto-winning`); await autoWin(page); await shot(page, `seed-${label}-won`); }
      // tap through any resulting dialogue
      for (let i = 0; i < 6; i++) { if (!(await clickText(page, 'Continue') || await clickText(page, 'Begin →') || await clickText(page, 'OK'))) break; await sleep(500); }
    } else { log(`   seeder ${fn} → ${r}`); }
    await sleep(600);
  }

  phase('WRAP-UP');
  const cFinal = await classify(page);
  log(`FINAL STATE: ${JSON.stringify(cFinal)}`);
  log(`real JS errors (excl. CDN cert noise): ${errors.length}`);
  log(`findings: ${findings.length}`);
  await shot(page, 'final');
  writeFileSync(join(OUT, 'fullrun-findings.json'), JSON.stringify({ generatedAt: new Date().toISOString(), screenshots: shotN, errorCount: errors.length, findings, finalState: cFinal, errors: errors.slice(0, 100) }, null, 2));
  writeFileSync(join(OUT, 'fullrun-transcript.txt'), transcript.join('\n'));
  log('wrote fullrun-findings.json + fullrun-transcript.txt');
  await browser.close();
} catch (e) {
  console.error('FULLRUN CRASH:', e && e.stack || e);
  writeFileSync(join(OUT, 'fullrun-transcript.txt'), transcript.join('\n') + '\n\nCRASH: ' + (e && e.stack || e));
  process.exitCode = 1;
} finally { if (browser) await browser.close().catch(() => {}); cleanup(); }
