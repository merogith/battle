#!/usr/bin/env node
/*
 * Autopilot play-tester — drives battle.html in real headless Chromium like a human QA tester.
 *
 * Boots the dev server, plays the main flows (main menu → settings → new adventure →
 * trainer creation → starter → city navigation → a hand-driven battle → story progression →
 * training facilities → catch/PC/shops → collection), screenshots every screen, captures every
 * console/page error, and writes a transcript + findings to agent-state/playtest/.
 *
 * Real Chromium is resolved from the on-disk Playwright build (the matching build number is not
 * downloadable in this sandbox, but an existing build runs fine via executablePath).
 *
 * Usage:  node scripts/debug/autopilot.mjs
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(ROOT, 'agent-state', 'playtest');
const SHOTS = join(OUT, 'screens');
const PORT = Number(process.env.PORT || 5179);
const URL = `http://localhost:${PORT}/battle.html`;

function resolveChrome() {
  if (process.env.PW_CHROME && existsSync(process.env.PW_CHROME)) return process.env.PW_CHROME;
  const candidates = [
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  // Fall back to any chromium-*/chrome-linux/chrome under /opt/pw-browsers.
  try {
    const { readdirSync } = require('node:fs');
    for (const d of readdirSync('/opt/pw-browsers')) {
      const p = `/opt/pw-browsers/${d}/chrome-linux/chrome`;
      if (existsSync(p)) return p;
    }
  } catch {}
  return null;
}

mkdirSync(SHOTS, { recursive: true });

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright not installed.'); process.exit(2); }

const CHROME = resolveChrome();
if (!CHROME) { console.error('No Chromium binary found under /opt/pw-browsers'); process.exit(2); }

// ---- transcript / findings plumbing -------------------------------------------------
const transcript = [];
const findings = [];
const errors = [];          // {t, kind, text}
let errMark = 0;
let shotN = 0;

const stamp = () => new Date().toISOString().slice(11, 19);
function log(s) { const line = `[${stamp()}] ${s}`; transcript.push(line); console.log(line); }
function phase(s) { const line = `\n══════ ${s} ══════`; transcript.push(line); console.log(line); }
function finding(sev, area, title, detail = '') {
  findings.push({ sev, area, title, detail });
  const line = `   ⚑ [${sev}] ${area} — ${title}${detail ? ' :: ' + detail : ''}`;
  transcript.push(line); console.log(line);
}
function newErrors() { const e = errors.slice(errMark); errMark = errors.length; return e; }

// ---- page helpers -------------------------------------------------------------------
// All DOM reads return a JSON *string* and are JSON.parsed here. This sidesteps a
// Playwright object-serializer bug ("Right-hand side of 'instanceof' is not an object")
// triggered when this page is in context — strings round-trip fine, objects do not.
async function read(page, fn, arg) {
  const raw = await page.evaluate(fn, arg);
  try { return JSON.parse(raw); } catch { return raw; }
}

async function shot(page, label) {
  shotN++;
  const name = `${String(shotN).padStart(2, '0')}-${label}.png`;
  await page.screenshot({ path: join(SHOTS, name) }).catch(() => {});
  log(`   📸 ${name}`);
  return name;
}

async function snapshotUI(page) {
  return read(page, () => {
    function vis(el) {
      try {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0.01;
      } catch (e) { return false; }
    }
    const seen = {}; const buttons = [];
    const all = document.querySelectorAll('button,[role=button]');
    for (let i = 0; i < all.length; i++) {
      if (!vis(all[i])) continue;
      const t = (all[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (t && !seen[t]) { seen[t] = 1; buttons.push(t.slice(0, 46)); }
    }
    let modalOpen = false; const modals = document.querySelectorAll('.modal,[role=dialog],[id^=modal-]');
    for (let j = 0; j < modals.length; j++) { if (vis(modals[j])) { modalOpen = true; break; } }
    const snippet = (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    return JSON.stringify({ buttons, modalOpen, snippet });
  });
}

async function story(page) {
  return read(page, () => {
    try {
      const s = window.StoryMode && window.StoryMode.state;
      if (!s) return JSON.stringify(null);
      const team = Array.isArray(s.team) ? s.team : [];
      return JSON.stringify({
        active: !!s.active,
        eventIndex: s.eventIndex ?? null,
        badges: s.badges ?? null,
        gold: s.gold ?? s.money ?? null,
        cityIndex: s.cityIndex ?? s.city ?? null,
        difficulty: s.storyDifficulty ?? null,
        teamLen: team.length,
        team: team.map(p => (p && (p.species || p.name || p.id)) || '?').slice(0, 6),
        teamHp: team.map(p => p && (p.curHP ?? p.hp ?? null)).slice(0, 6),
        pcLen: Array.isArray(s.pcBox) ? s.pcBox.length : (Array.isArray(s.pc) ? s.pc.length : null),
        balls: s.balls || s.inventoryBalls || null,
        partyCap: s.partyCap ?? s.maxPartySize ?? null,
        unlocked: s.unlockedGimmicks ? Array.from(s.unlockedGimmicks) : null,
        rivalName: s.rivalName ?? null,
      });
    } catch (e) { return JSON.stringify({ err: String(e && e.message) }); }
  });
}

// Battle state is read from the DOM, not window.state — the engine's `state` is a closure
// variable, unreachable from the page context. The visible FIGHT button + battle-log tail
// are the reliable signals.
async function battleSnap(page) {
  return read(page, () => {
    function vis(el) { if (!el) return false; try { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; } catch (e) { return false; } }
    const fightBtn = document.querySelector('[data-cmd="fight"]');
    const moveMenu = document.getElementById('move-menu');
    const moveBtns = document.querySelectorAll('#move-menu .battle-btn-move');
    const logEl = document.getElementById('battle-log');
    const endDesc = document.getElementById('end-desc');
    let usable = 0;
    for (let i = 0; i < moveBtns.length; i++) { if (!moveBtns[i].disabled && vis(moveBtns[i])) usable++; }
    return JSON.stringify({
      fightVisible: vis(fightBtn),
      moveMenuVisible: vis(moveMenu),
      usableMoves: usable,
      logTail: logEl ? (logEl.innerText || '').replace(/\s+/g, ' ').trim().slice(-200) : '',
      endVisible: vis(endDesc),
    });
  });
}

async function waitForBattle(page, timeout = 9000) {
  const t = Date.now();
  while (Date.now() - t < timeout) {
    const s = await battleSnap(page);
    if (s.fightVisible || s.endVisible) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

async function clickText(page, text, { timeout = 4000 } = {}) {
  const sel = `button:has-text("${text.replace(/"/g, '\\"')}"), [role=button]:has-text("${text.replace(/"/g, '\\"')}")`;
  try {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded({ timeout: 800 }).catch(() => {});
      await loc.click({ timeout });
      await page.waitForTimeout(420);
      return true;
    }
  } catch (e) { log(`   (clickText "${text}" failed: ${String(e.message).split('\n')[0]})`); }
  return false;
}

async function clickSel(page, sel, { timeout = 4000, settle = 420 } = {}) {
  try {
    const loc = page.locator(sel).first();
    if (await loc.count()) { await loc.click({ timeout }); await page.waitForTimeout(settle); return true; }
  } catch (e) { log(`   (clickSel ${sel} failed: ${String(e.message).split('\n')[0]})`); }
  return false;
}

// dismiss any single visible modal via a close affordance.
// NB: deliberately NOT including "Continue" — it matches "Continue Run" on the story
// menu and wrongly fires a resume ("No active battle to continue").
async function dismissModal(page) {
  for (const t of ['Got it', 'Okay', 'OK', 'Close', 'Dismiss', 'Skip', '×']) {
    if (await clickText(page, t, { timeout: 1000 })) { return t; }
  }
  if (await clickSel(page, '.modal-close, [aria-label="Close"], .close-btn', { timeout: 800 })) return 'closeIcon';
  return null;
}

// Wait until the boot data-load overlay is gone AND StoryMode is live.
async function waitReady(page, { timeout = 45000 } = {}) {
  const start = Date.now();
  let last = '';
  while (Date.now() - start < timeout) {
    const r = await read(page, () => {
      const o = document.getElementById('app-loading-overlay');
      let loading = false;
      if (o) { try { loading = !o.classList.contains('hidden') && getComputedStyle(o).display !== 'none' && o.getBoundingClientRect().height > 0; } catch (e) {} }
      const txt = ((document.getElementById('app-loading-text') || {}).textContent || '').trim();
      return JSON.stringify({ loading, txt: txt.slice(0, 50), ready: (typeof window.StoryMode === 'object') });
    });
    if (r.txt && r.txt !== last) { log(`   …loading: ${r.txt}`); last = r.txt; }
    if (!r.loading && r.ready) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

// Navigate via a button click if possible, else fall back to calling a StoryMode method
// by name, so a flaky/obscured button doesn't abort the session. Returns 'click'|'api'|false.
async function nav(page, { text, sel, api, verify }) {
  if (sel && await clickSel(page, sel, { timeout: 2000 })) { if (!verify || await verify(page)) return 'click'; }
  if (text && await clickText(page, text, { timeout: 2000 })) { if (!verify || await verify(page)) return 'click'; }
  if (api) {
    const res = await page.evaluate((name) => {
      try { if (window.StoryMode && typeof window.StoryMode[name] === 'function') { window.StoryMode[name](); return 'ok'; } return 'nofn'; } catch (e) { return 'err:' + (e && e.message); }
    }, api);
    await page.waitForTimeout(600);
    if (res === 'ok') { if (!verify || await verify(page)) return 'api'; }
    else log(`   (nav StoryMode.${api} → ${res})`);
  }
  return false;
}

async function setFastMode(page) {
  await page.evaluate(() => {
    try {
      if (window.settings) { window.settings.animations = false; window.settings.moveSfx = false; window.settings.catchAnims = false; }
    } catch (e) {}
  });
}

// Drive one battle by hand: FIGHT → first usable move, handle forced switches, until over.
// Progress is judged by the #battle-log tail changing; the FIGHT button vanishing for a
// sustained stretch means the battle ended / transitioned back to the story.
async function playBattleManually(page, { maxTurns = 60, label = 'battle' } = {}) {
  let lastLog = '', stall = 0, shots = 0, noFight = 0;
  for (let i = 0; i < maxTurns; i++) {
    const s = await battleSnap(page);
    if (s.endVisible) { log('   battle end screen shown'); return 'end-screen'; }

    if (s.fightVisible) {
      noFight = 0;
      if (shots < 3) { await shot(page, `${label}-t${i}`); shots++; }
      if (!s.moveMenuVisible) await clickSel(page, '[data-cmd="fight"]', { timeout: 2500, settle: 350 });
      const moved = await clickSel(page, '#move-menu .battle-btn-move:not([disabled])', { timeout: 2500, settle: 300 });
      if (!moved) await clickSel(page, '#move-menu button:not([disabled])', { timeout: 1500, settle: 300 }); // PP-out/struggle/locked
    } else {
      noFight++;
      // forced switch after a faint?
      const sw = await clickSel(page, '#modal-party button:has-text("Switch"):not([disabled]), button:has-text("Switch"):not([disabled])', { timeout: 900 });
      if (sw) { log('   forced switch → sent next mon'); noFight = 0; }
      else { await clickText(page, 'Continue', { timeout: 500 }); }
      if (noFight >= 8) { log('   FIGHT not offered for 8 polls — battle ended/transitioned'); return 'ended'; }
    }

    await page.waitForTimeout(650);
    const s2 = await battleSnap(page);
    if (s2.logTail && s2.logTail === lastLog) stall++; else { stall = 0; lastLog = s2.logTail; }
    if (stall >= 8) { log(`   ⚠ battle log unchanged for 8 polls — stalled. tail="…${lastLog.slice(-90)}"`); return 'stall'; }
  }
  return 'maxturns';
}

async function autoWin(page) {
  const ok = await page.evaluate(() => {
    try { if (typeof window.__devAutoWinBattle === 'function') { window.__devAutoWinBattle(); return true; } } catch (e) {}
    return false;
  });
  await page.waitForTimeout(700);
  return ok;
}

async function battleActive(page) {
  const s = await battleSnap(page);
  return !!(s && s.fightVisible);
}

// ---- main ---------------------------------------------------------------------------
log(`Autopilot start. Chrome: ${CHROME}`);
const server = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.cjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const cleanup = () => { try { server.kill(); } catch {} };
process.on('exit', cleanup);
await new Promise(r => setTimeout(r, 1400));

let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 430, height: 850 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errors.push({ t: stamp(), kind: 'pageerror', text: String(e && e.message || e).split('\n')[0] }));
  page.on('console', m => { if (m.type() === 'error') errors.push({ t: stamp(), kind: 'console.error', text: m.text().slice(0, 300) }); });

  // ===== PHASE 0: Boot =====
  phase('PHASE 0 — Boot & main menu');
  let gotoOK = false;
  for (let i = 0; i < 25; i++) { try { await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 }); gotoOK = true; break; } catch { await page.waitForTimeout(500); } }
  log(`goto ${URL}: ${gotoOK ? 'ok' : 'FAILED'}`);
  // clean slate so we get the new-adventure path, not a resume/confirm
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  const t0 = Date.now();
  const ready = await waitReady(page);
  log(`Boot ready: ${ready} in ${Date.now() - t0}ms`);
  if (!ready) finding('P1', 'boot', 'Game did not reach a ready state within 45s', 'app-loading-overlay never cleared or StoryMode never defined');
  if (Date.now() - t0 > 8000) finding('P3', 'boot', `Boot/data-load took ${Date.now() - t0}ms after reload`, 'multi-second "Loading move sets" overlay on a warm reload');
  const bootErr = newErrors();
  log(`Boot console/page errors: ${bootErr.length}`);
  if (bootErr.length) finding('P2', 'boot', `${bootErr.length} error(s) logged during boot`, bootErr.slice(0, 6).map(e => e.text).join(' | '));
  await setFastMode(page);
  // clear the persistent "Add to Home Screen" tip — it overlaps modal content at the bottom
  if (await clickSel(page, '#pwa-hint-dismiss', { timeout: 1500 })) log('   dismissed Add-to-Home-Screen tip banner');
  await shot(page, 'mainmenu');
  const menu = await snapshotUI(page);
  log(`Main-menu buttons: ${menu.buttons.join(' | ')}`);
  if (!menu.buttons.some(b => /story/i.test(b))) finding('P0', 'menu', 'No Story Mode entry visible on main menu');

  // ===== PHASE 1: Settings audit =====
  phase('PHASE 1 — Settings screen');
  if (await clickText(page, '⚙', { timeout: 2000 }) || await clickSel(page, '[onclick*="modal-settings"]', { timeout: 2000 })) {
    await page.waitForTimeout(500); await shot(page, 'settings');
    const s = await snapshotUI(page);
    log(`Settings controls: ${s.buttons.slice(0, 24).join(' | ')}`);
    const hasMotion = /motion|animation/i.test(s.snippet);
    if (!hasMotion) finding('P2', 'settings', 'No visible animation/reduced-motion toggle label found in Settings text');
    await dismissModal(page);
  } else { finding('P2', 'menu', 'Could not open Settings (⚙) from main menu'); }

  // ===== PHASE 2: Story menu =====
  phase('PHASE 2 — Story menu');
  const toStory = await nav(page, {
    text: 'Story Mode', api: 'showMenu',
    verify: async (p) => { const u = await snapshotUI(p); return u.buttons.some(b => /New Adventure|Continue Run|Pokédex/i.test(b)); },
  });
  log(`Open story menu: ${toStory}`);
  if (!toStory) finding('P1', 'nav', 'Could not reach the Story menu from main menu');
  await shot(page, 'story-menu');
  const sm = await snapshotUI(page);
  log(`Story-menu buttons: ${sm.buttons.join(' | ')}`);

  // ===== PHASE 3: Trainer creation =====
  phase('PHASE 3 — New Adventure / trainer creation');
  const toCreate = await nav(page, {
    text: 'New Adventure', api: 'openTrainerCreate',
    verify: async (p) => (await p.locator('#story-create-begin').count()) > 0,
  });
  log(`Open trainer create: ${toCreate}`);
  if (!toCreate) finding('P1', 'nav', 'Could not open trainer creation (New Adventure)');
  await page.waitForTimeout(500); await shot(page, 'trainer-create');
  const tc = await snapshotUI(page);
  log(`Trainer-create controls: ${tc.buttons.slice(0, 30).join(' | ')}`);
  // exercise difficulty / sprite cycling
  await page.evaluate(() => { try { window.StoryMode.trainerCreateSetDifficulty && window.StoryMode.trainerCreateSetDifficulty('normal'); } catch (e) {} });
  await clickSel(page, '[onclick*="trainerCreateRandomSprite"]', { timeout: 1500 });
  await shot(page, 'trainer-create-sprite');
  // A trainer name is REQUIRED — without it Begin is gated ("Pick a trainer name to continue").
  const nameFilled = await page.fill('#story-create-name', 'AutoTester').then(() => true).catch(() => false);
  log(`Trainer name filled: ${nameFilled}`);
  await page.waitForTimeout(300);
  // Begin!
  const began = await nav(page, { sel: '#story-create-begin', text: 'Begin Adventure', api: 'confirmTrainerAndStart' });
  log(`Begin Adventure: ${began}`);
  await page.waitForTimeout(1500);
  await dismissModal(page); // confirm-overwrite / intro dialogue (never "Continue")
  await page.waitForTimeout(1200);
  await shot(page, 'after-begin');

  // ===== PHASE 4: Cold-open intro → first city =====
  phase('PHASE 4 — Cold-open intro & first city');
  let st = await story(page);
  if (!st || !st.active) finding('P1', 'story-start', 'Story run not active after Begin Adventure', JSON.stringify(st));
  log(`Story state: ${JSON.stringify(st)}`);
  // The run opens on a narration overlay with a single "Begin →" button — click it to walk in.
  let introDone = false;
  for (let k = 0; k < 5; k++) {
    if (await clickText(page, 'Begin →', { timeout: 900 }) || await clickText(page, 'Walk in', { timeout: 500 })) { introDone = true; log('   advanced cold-open intro'); break; }
    await page.waitForTimeout(500);
  }
  if (!introDone) log('   (no cold-open "Begin →" found — may already be past it)');
  await page.waitForTimeout(1000);
  await shot(page, 'city-0');
  const cityUI = await snapshotUI(page);
  log(`City facilities/buttons: ${cityUI.buttons.join(' | ')}`);

  // ===== PHASE 5: Professor / starter =====
  phase('PHASE 5 — Professor & starter');
  // The cold-open usually lands directly at the Professor's starter pick; otherwise open it.
  let profUp = (await page.locator('.prof-pick-card').count()) > 0;
  if (!profUp) { await nav(page, { text: 'Professor', sel: '[onclick*="enterProfessor"]', api: 'enterProfessor' }); await page.waitForTimeout(700); profUp = (await page.locator('.prof-pick-card').count()) > 0; }
  log(`Professor starter cards present: ${profUp}`);
  await shot(page, 'professor');
  const teamBefore = (await story(page))?.teamLen ?? 0;
  if (profUp) {
    await clickSel(page, '.prof-pick-card .draft-card-sprite', { timeout: 2000 }) || await clickSel(page, '.prof-pick-card', { timeout: 1500 });
    await page.waitForTimeout(400);
    const acc = await clickSel(page, '#prof-accept-btn:not([disabled])', { timeout: 2000 })
      || await page.evaluate(() => { try { window.StoryMode.profAccept(); return true; } catch (e) { return false; } });
    log(`Starter accepted: ${acc}`);
  } else {
    finding('P1', 'professor', 'Professor starter selection did not appear after the cold-open intro');
  }
  await page.waitForTimeout(1000); await dismissModal(page); await page.waitForTimeout(600);
  await shot(page, 'after-starter');
  const teamAfter = (await story(page))?.teamLen ?? 0;
  const starterSpecies = (await story(page))?.team ?? [];
  log(`Team size ${teamBefore} → ${teamAfter} ${JSON.stringify(starterSpecies)}`);
  if (teamAfter <= teamBefore) finding('P1', 'professor', 'Team did not grow after starter selection', `before=${teamBefore} after=${teamAfter}`);

  // back to city if we're in a sub-screen
  await clickText(page, 'Back to City', { timeout: 1500 });

  // ===== PHASE 6: First battle (hand-driven) =====
  phase('PHASE 6 — First battle (hand-driven)');
  const evtBefore = (await story(page))?.eventIndex ?? null;
  const startedBattle = await clickSel(page, '[onclick*="proceedToNextBattle"]', { timeout: 2500 });
  if (!startedBattle) await page.evaluate(() => { try { window.StoryMode.proceedToNextBattle && window.StoryMode.proceedToNextBattle(); } catch (e) {} });
  await page.waitForTimeout(1400);
  // tap through any pre-battle dialogue (story intro / "<rival> wants to battle!")
  for (let k = 0; k < 6 && !(await battleActive(page)); k++) {
    if (!(await clickText(page, 'Continue', { timeout: 500 }) || await clickText(page, 'Next', { timeout: 400 }))) {
      await page.mouse.click(215, 720); // tap-to-advance
    }
    await page.waitForTimeout(500);
  }
  const inBattle = await waitForBattle(page, 6000);
  if (inBattle) {
    await shot(page, 'battle-start');
    log(`Battle active: ${JSON.stringify(await battleSnap(page))}`);
    const result = await playBattleManually(page, { label: 'b1' });
    log(`Hand-driven battle result: ${result}`);
    await page.waitForTimeout(900);
    await clickText(page, 'Continue', { timeout: 1200 }) || await dismissModal(page); // win/loss screen
    await page.waitForTimeout(700);
    await shot(page, 'battle-end');
    if (result === 'stall') finding('P0', 'battle', 'First battle stalled — turn loop made no progress (possible soft-lock)');
  } else {
    finding('P1', 'battle', 'Could not enter the first battle', JSON.stringify(await battleSnap(page)));
  }
  const evtAfter = (await story(page))?.eventIndex ?? null;
  log(`eventIndex ${evtBefore} → ${evtAfter}`);

  // ===== PHASE 7: Story progression via auto-win =====
  phase('PHASE 7 — Story progression (auto-win march)');
  let prevEvt = (await story(page))?.eventIndex ?? -1;
  let prevBadges = (await story(page))?.badges ?? 0;
  let stalls = 0;
  for (let step = 0; step < 25; step++) {
    // resolve any in-progress battle first
    if (await battleActive(page)) { await autoWin(page); await page.waitForTimeout(700); }
    // advance toward the next battle (button, else API)
    const adv = await clickSel(page, '[onclick*="proceedToNextBattle"]', { timeout: 1200 });
    if (!adv) await page.evaluate(() => { try { window.StoryMode.proceedToNextBattle && window.StoryMode.proceedToNextBattle(); } catch (e) {} });
    await page.waitForTimeout(900);
    // tap through pre-battle dialogue; auto-win once a battle materializes
    for (let k = 0; k < 7; k++) {
      if (await battleActive(page)) { await autoWin(page); await page.waitForTimeout(700); break; }
      if (!(await clickText(page, 'Continue', { timeout: 350 }) || await clickText(page, 'Next', { timeout: 250 }))) await page.mouse.click(215, 720);
      await page.waitForTimeout(380);
    }
    await clickText(page, 'Continue', { timeout: 400 }); // clear post-battle result
    await page.waitForTimeout(300);
    const s2 = await story(page);
    const evt = s2?.eventIndex ?? -1;
    const badges = s2?.badges ?? 0;
    if (badges > prevBadges) { log(`🏅 Badge earned: ${prevBadges} → ${badges} (event ${evt})`); await shot(page, `badge-${badges}`); prevBadges = badges; }
    if (s2?.unlocked && s2.unlocked.length) log(`   unlocks: ${s2.unlocked.join(',')}`);
    if (evt === prevEvt) { stalls++; } else { stalls = 0; if (step % 3 === 0) await shot(page, `progress-evt${evt}`); }
    prevEvt = evt;
    if (step % 5 === 0) log(`   progress: event=${evt} badges=${badges} team=${s2?.teamLen} pc=${s2?.pcLen} gold=${s2?.gold}`);
    if (stalls >= 4) { finding('P2', 'progression', `Auto-win march stalled at eventIndex ${evt}`, 'no advance in 4 steps — could be a non-battle gate or a soft-lock'); break; }
  }
  const sEnd = await story(page);
  log(`Progression reached: ${JSON.stringify(sEnd)}`);
  await shot(page, 'progression-end');

  // ===== PHASE 8: Training & city facilities tour =====
  phase('PHASE 8 — Facilities tour');
  // make sure we're in a city
  await clickText(page, 'Back to City', { timeout: 1200 });
  const facilityProbes = [
    ['Poké Center / heal', 'enterPokemonCenter'],
    ['Shop / Mart', 'enterShop'],
    ['Move Tutor', 'enterTutor'],
    ['EV Trainer', 'enterEVTrainer'],
    ['Evolution Lab', 'enterEvolutionLab'],
    ['Daycare', 'enterDaycare'],
    ['Safari Zone', 'enterSafariZone'],
    ['PC / box', 'pcSwitchTab'],
  ];
  for (const [label, method] of facilityProbes) {
    const before = newErrors().length; // flush
    const opened = await page.evaluate((m) => {
      try { if (window.StoryMode && typeof window.StoryMode[m] === 'function') { window.StoryMode[m](); return true; } } catch (e) { return 'err:' + (e && e.message); }
      return false;
    }, method);
    await page.waitForTimeout(700);
    if (opened === true) {
      await shot(page, `facility-${method}`);
      const errs = newErrors();
      if (errs.length) finding('P2', 'facility', `${label} (${method}) threw ${errs.length} error(s)`, errs.slice(0, 3).map(e => e.text).join(' | '));
      else log(`   ${label} (${method}) opened cleanly`);
      await clickText(page, 'Back to City', { timeout: 1000 }) || await dismissModal(page);
    } else if (typeof opened === 'string') {
      finding('P2', 'facility', `${label} (${method}) raised: ${opened}`);
    } else {
      log(`   ${label} (${method}) not available here`);
    }
    await page.waitForTimeout(300);
  }

  // ===== PHASE 9: Collection / Pokédex =====
  phase('PHASE 9 — Collection / Pokédex');
  const colOpened = await page.evaluate(() => { try { window.StoryMode.openCollection && window.StoryMode.openCollection('pokedex'); return true; } catch (e) { return 'err:' + (e && e.message); } });
  await page.waitForTimeout(800);
  if (colOpened === true) { await shot(page, 'collection-pokedex'); const e = newErrors(); if (e.length) finding('P2', 'collection', `Pokédex threw ${e.length} error(s)`, e.slice(0, 3).map(x => x.text).join(' | ')); }
  else if (typeof colOpened === 'string') finding('P2', 'collection', `openCollection raised: ${colOpened}`);
  await dismissModal(page);

  // ===== wrap up =====
  phase('WRAP-UP');
  const allErr = errors;
  log(`Total console/page errors across session: ${allErr.length}`);
  log(`Total findings: ${findings.length}`);
  await shot(page, 'final');

  // write artifacts
  const summary = {
    generatedAt: new Date().toISOString(),
    chrome: CHROME,
    screenshots: shotN,
    errorCount: allErr.length,
    findings,
    storyEnd: sEnd,
    errors: allErr.slice(0, 80),
  };
  writeFileSync(join(OUT, 'autopilot-findings.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(OUT, 'autopilot-transcript.txt'), transcript.join('\n'));
  log(`Wrote agent-state/playtest/autopilot-findings.json and autopilot-transcript.txt`);

  await browser.close();
} catch (e) {
  console.error('AUTOPILOT CRASHED:', e && e.stack || e);
  writeFileSync(join(OUT, 'autopilot-transcript.txt'), transcript.join('\n') + '\n\nCRASH: ' + (e && e.stack || e));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  cleanup();
}
