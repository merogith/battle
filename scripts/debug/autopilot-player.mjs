#!/usr/bin/env node
/*
 * Real-player autopilot — plays Story Mode like a competent human, NO dev auto-win.
 *
 *  • Battles are played turn-by-turn: best move is chosen with the engine's own
 *    getBestMove(pActive, fActive); switches in a fresh mon on faint; uses a battle
 *    form (mega/tera/dynamax/z) when one is available.
 *  • Between cities it TRAINS: evolves eligible team members and applies an EV preset
 *    at the EV Trainer, asserting the change actually took (species / EVs mutated).
 *  • Catches wilds to fill the party.
 *
 * Goal = play to win and surface BALANCE / BUG / DESIGN / VISUAL feedback (where a real
 * player would lose, stall, or hit something broken). Injects an anime.js stub so battles
 * render under the CDN-blocked sandbox (anime.js is CDN-only — PLAYTEST_REPORT P1-3).
 *
 * Artifacts → agent-state/playtest/player*.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'agent-state', 'playtest');
const SHOTS = join(OUT, 'player');
const PORT = Number(process.env.PORT || 5183);
const URL = `http://localhost:${PORT}/battle.html`;
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'].find(existsSync);
mkdirSync(SHOTS, { recursive: true });
const { chromium } = await import('playwright');

const transcript = [], findings = [], errors = [], battleLog = [];
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
async function api(page, name, ...args) { return page.evaluate(({ n, a }) => { try { if (window.StoryMode && typeof window.StoryMode[n] === 'function') { window.StoryMode[n](...a); return 'ok'; } return 'nofn'; } catch (e) { return 'err:' + (e && e.message); } }, { n: name, a: args }); }
async function forceClick(page, reSrc) {
  const r = await page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const vis = el => { try { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0.05; } catch (e) { return false; } };
    const b = [...document.querySelectorAll('button,[role=button]')].filter(vis).find(x => re.test((x.textContent || '').replace(/\s+/g, ' ').trim()));
    if (b) { b.click(); return (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30); }
    return null;
  }, reSrc).catch(() => null);
  if (r) await sleep(220);
  return r;
}

async function classify(page) {
  return read(page, () => {
    const vis = el => { if (!el) return false; try { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; } catch (e) { return false; } };
    const scr = id => { const e = document.getElementById(id); return !!(e && !e.classList.contains('hidden') && vis(e)); };
    const st = window.state || {}; const sm = (window.StoryMode && window.StoryMode.state) || {};
    const btns = [...document.querySelectorAll('button')].filter(vis).map(b => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const has = re => btns.some(t => re.test(t));
    const endTitle = document.getElementById('end-title');
    return JSON.stringify({
      eventIndex: sm.eventIndex ?? null, badges: sm.badges ?? null, gold: sm.gold ?? null,
      teamLen: Array.isArray(sm.team) ? sm.team.length : null,
      unlocked: sm.unlockedGimmicks ? Array.from(sm.unlockedGimmicks) : [],
      battleActive: !st.isOver && !!st.fActive,
      endScreen: vis(endTitle), endTitle: endTitle ? (endTitle.innerText || '').slice(0, 24) : '',
      gameOver: /GAME OVER|DEFEAT|FORFEIT/i.test(endTitle && endTitle.innerText || ''),
      catchScreen: scr('screen-story-catch') && document.querySelectorAll('#story-catch-body button:not([disabled])').length > 0,
      professorCards: document.querySelectorAll('.prof-pick-card').length,
      cityScreen: scr('screen-story-city'),
      cityName: ((document.querySelector('#screen-story-city .story-screen-head-text') || {}).textContent || '').trim(),
      hof: /hall of fame/i.test((document.body.innerText || '').slice(0, 120)),
      transition: /Battle starting|Now arriving|stepped out of the grass|sent out|VS\b/i.test((document.body.innerText || '').slice(0, 240)),
      bodyHash: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90),
      infoModal: has(/Got it/),
      gymBattle: has(/Gym Battle|Enter the Gym|Enter the Pokémon League|Victory Road|Pre-League/),
    });
  });
}

// Read the live battle state for hand-play decisions.
async function battleState(page) {
  return read(page, () => {
    const st = window.state || {};
    const moninfo = m => m ? { name: m.species || m.name, hp: m.curHP, max: m.maxHP, lvl: m.level || m.lvl, t1: m.type1, t2: m.type2, fainted: (m.curHP <= 0) } : null;
    const party = Array.isArray(st.playerParty) ? st.playerParty : [];
    return JSON.stringify({
      isOver: !!st.isOver, turn: st.turnNumber ?? null,
      p: moninfo(st.pActive), f: moninfo(st.fActive),
      partyAlive: party.filter(m => m && m.curHP > 0).length, partyLen: party.length,
      foeAlive: Array.isArray(st.foeParty) ? st.foeParty.filter(m => m && m.curHP > 0).length : null,
      moveMenuOpen: !!(document.getElementById('move-menu') && getComputedStyle(document.getElementById('move-menu')).display !== 'none' && !document.getElementById('move-menu').classList.contains('hidden')),
    });
  });
}

// Choose + commit the best move via the engine's own AI; returns a tag.
async function chooseAndAttack(page) {
  // open the FIGHT menu
  await page.evaluate(() => { try { if (window.showMoves) window.showMoves(); } catch (e) {} });
  await sleep(300);
  // try to queue a battle form (mega/tera/dynamax/z) if a toggle is offered — exercises those buttons
  await page.evaluate(() => {
    try {
      const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none'; };
      const g = [...document.querySelectorAll('#move-menu button, #command-menu button, .gimmick-btn, [data-gimmick]')].filter(vis)
        .find(b => /\b(MEGA|TERA|DYNAMAX|G-?MAX|Z-?MOVE|Z-)\b/i.test((b.textContent || '') + (b.getAttribute('data-gimmick') || '')) && !b.disabled);
      if (g) g.click();
    } catch (e) {}
  });
  // pick the best move slot with the real AI, click that move button
  const r = await page.evaluate(() => {
    const st = window.state; if (!st || st.isOver || !st.pActive || !st.fActive) return 'no-battle';
    const mon = st.pActive, foe = st.fActive; let idx = -1;
    try { const mv = window.getBestMove(mon, foe); if (mv && Array.isArray(mon.moves)) idx = mon.moves.indexOf(mv); } catch (e) {}
    if (idx < 0 && Array.isArray(mon.moves)) idx = mon.moves.findIndex(m => m && (m.pp === undefined || m.pp > 0));
    if (idx < 0) idx = 0;
    const btns = document.querySelectorAll('#move-menu .battle-btn-move');
    if (btns[idx]) { btns[idx].click(); return 'move:' + idx + ':' + ((mon.moves[idx] && mon.moves[idx].name) || '?'); }
    if (btns[0]) { btns[0].click(); return 'move:0:fallback'; }
    return 'no-move-btn';
  });
  return r;
}

async function forcedSwitch(page) {
  // party modal up after a faint — send the first alive non-active mon
  const r = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => /Switch/i.test(b.textContent || '') && !b.disabled);
    if (btns[0]) { btns[0].click(); return 'switched'; }
    return 'no-switch';
  });
  await sleep(400);
  return r;
}

// Play one full battle by hand. Returns 'win' | 'loss' | 'timeout'.
async function playBattleByHand(page, label) {
  let lastTurn = -1, stall = 0, shots = 0;
  for (let i = 0; i < 80; i++) {
    const bs = await battleState(page);
    if (!bs) { await sleep(400); continue; }
    if (bs.isOver) {
      const c = await classify(page);
      const won = !c.gameOver;
      battleLog.push({ label, result: won ? 'win' : 'loss', turns: bs.turn, p: bs.p, f: bs.f });
      return won ? 'win' : 'loss';
    }
    if (shots < 3 && bs.p && bs.f) { await shot(page, `${label}-t${bs.turn}`); shots++; }
    // forced switch (active fainted but battle not over)
    if (bs.p && bs.p.fainted && bs.partyAlive > 0) { await page.evaluate(() => { try { window.openParty(true); } catch (e) {} }); await sleep(300); await forcedSwitch(page); continue; }
    // our turn?
    const did = await chooseAndAttack(page);
    await sleep(700);
    // advance through turn resolution / between-turn prompts
    await forceClick(page, '^Continue|→|Next');
    const after = await battleState(page);
    if (after && after.turn === lastTurn) stall++; else { stall = 0; lastTurn = after && after.turn; }
    if (stall >= 8) { battleLog.push({ label, result: 'timeout', turns: lastTurn }); return 'timeout'; }
    await sleep(350);
  }
  battleLog.push({ label, result: 'timeout', turns: lastTurn });
  return 'timeout';
}

async function handleCatch(page) {
  await page.evaluate(() => { const b = document.querySelector('#story-catch-body button:not([disabled])'); if (b) b.click(); });
  await sleep(1000);
  for (let i = 0; i < 4; i++) { if (await forceClick(page, '^Continue|→') || await api(page, 'catchContinue') === 'ok') break; if (await forceClick(page, 'Send to PC') || await api(page, 'catchResolveSendToPC') === 'ok') break; await sleep(300); }
  await sleep(400);
}

async function pickStarter(page) {
  await shot(page, 'professor');
  await page.evaluate(() => { const c = document.querySelector('.prof-pick-card .draft-card-sprite') || document.querySelector('.prof-pick-card'); if (c) c.click(); });
  await sleep(300);
  await forceClick(page, 'Choose This|Take ') || await api(page, 'profAccept');
  await sleep(700);
  const sw = await page.evaluate(() => document.querySelectorAll('[onclick*="profSwap"], .prof-swap-slot').length);
  if (sw) { await page.evaluate(() => { const s = document.querySelector('[onclick*="profSwap"], .prof-swap-slot'); if (s) s.click(); }); await sleep(400); }
  await forceClick(page, '^Continue|→');
}

// Visit EV Trainer + Evolution Lab; apply an action and VERIFY it took. Returns notes.
async function trainTeam(page) {
  const before = await read(page, () => { const t = (window.StoryMode.state.team || []); return JSON.stringify(t.map(m => ({ sp: m.species || m.name, evs: m.evs ? Object.values(m.evs).reduce((a, b) => a + (b || 0), 0) : 0 }))); });
  if (!before || !before.length) return;
  // Evolution Lab — evolve the first eligible mon
  const ev = await api(page, 'enterEvolutionLab'); await sleep(700);
  if (ev === 'ok') {
    await shot(page, 'evolab');
    const clicked = await forceClick(page, '^Evolve|Evolve →|Evolve!');
    await sleep(900);
    await forceClick(page, '^Continue|→|OK');
    const after = await read(page, () => JSON.stringify((window.StoryMode.state.team || []).map(m => m.species || m.name)));
    if (clicked && after) {
      const changed = after.some((sp, i) => before[i] && sp !== before[i].sp);
      if (changed) log(`   ✅ evolution applied: ${JSON.stringify(before.map(b => b.sp))} → ${JSON.stringify(after)}`);
      else finding('P2', 'training', 'Evolution Lab: clicked Evolve but no team species changed', `${JSON.stringify(before.map(b => b.sp))}`);
    }
    await api(page, 'enterCity'); await sleep(400);
  }
  // EV Trainer — apply a preset to the lead and verify EVs grew
  const evt = await api(page, 'enterEVTrainer'); await sleep(700);
  if (evt === 'ok') {
    await shot(page, 'evtrainer');
    const clicked = await forceClick(page, 'Apply|Preset|Train|Bulky|Offensive|Fast|\\+');
    await sleep(800);
    await forceClick(page, '^Continue|→|OK|Confirm');
    const after = await read(page, () => JSON.stringify((window.StoryMode.state.team || []).map(m => m.evs ? Object.values(m.evs).reduce((a, b) => a + (b || 0), 0) : 0)));
    if (clicked && after) {
      const grew = after.some((tot, i) => before[i] && tot > before[i].evs);
      if (grew) log(`   ✅ EV preset applied: totals ${JSON.stringify(before.map(b => b.evs))} → ${JSON.stringify(after)}`);
      else finding('P2', 'training', 'EV Trainer: clicked apply but no EV total changed', `${JSON.stringify(before.map(b => b.evs))} → ${JSON.stringify(after)}`);
    }
    await api(page, 'enterCity'); await sleep(400);
  }
}

async function waitReady(page) { for (let i = 0; i < 120; i++) { const r = await read(page, () => { const o = document.getElementById('app-loading-overlay'); const l = o && !o.classList.contains('hidden') && getComputedStyle(o).display !== 'none'; return JSON.stringify({ loading: !!l, ready: typeof window.StoryMode === 'object' }); }); if (r && !r.loading && r.ready) return true; await sleep(300); } return false; }
async function startNewRun(page) {
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.evaluate(() => { try { window.settings.animations = false; window.settings.moveSfx = false; window.settings.catchAnims = false; } catch (e) {} });
  await page.evaluate(() => { try { document.getElementById('pwa-hint-dismiss')?.click(); } catch (e) {} });
  await api(page, 'showMenu'); await sleep(400);
  await api(page, 'openTrainerCreate'); await sleep(400);
  await page.fill('#story-create-name', 'Ace').catch(() => {}); await sleep(150);
  await api(page, 'confirmTrainerAndStart'); await sleep(1300);
  await forceClick(page, 'Begin\\s*→|Walk in'); await sleep(800);
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

  phase('REAL-PLAYER RUN — hand-played battles, training, evolution (no auto-win)');
  for (let i = 0; i < 25; i++) { try { await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 }); break; } catch { await sleep(500); } }
  await startNewRun(page);

  let prevEvt = -99, prevSig = '', stall = 0, lastCity = '', lastBadges = -1, lastUnlocked = '', losses = 0, trainedCities = {};
  for (let tick = 0; tick < 320; tick++) {
    const c = await classify(page);
    if (!c) { await sleep(400); continue; }
    const errs = newErrors();
    if (errs.length) finding('P2', 'runtime', `${errs.length} JS error(s) @evt ${c.eventIndex}`, errs.slice(0, 2).map(e => e.text).join(' | '));
    if (c.badges !== lastBadges && c.badges != null) { log(`🏅 badges ${lastBadges} → ${c.badges} @evt ${c.eventIndex}`); await shot(page, `badge-${c.badges}`); lastBadges = c.badges; }
    const us = (c.unlocked || []).join(','); if (us !== lastUnlocked) { log(`🔓 unlocked: [${us}] @evt ${c.eventIndex} (badges ${c.badges})`); lastUnlocked = us; }
    if (c.cityScreen && c.cityName && c.cityName !== lastCity) {
      log(`🏙  ${c.cityName} @evt ${c.eventIndex} · team ${c.teamLen} · ${c.gold}G · badges ${c.badges}`);
      await shot(page, `city-${c.eventIndex}`); lastCity = c.cityName;
      // train once per city (evolve + EV)
      if (c.teamLen > 0 && !trainedCities[c.cityName]) { trainedCities[c.cityName] = 1; await trainTeam(page); }
    }

    if (c.infoModal) { await forceClick(page, 'Got it') || await forceClick(page, '^OK$'); await sleep(200); }
    else if (c.professorCards) { await pickStarter(page); }
    else if (c.battleActive) {
      const isGym = /Gym Leader|Champion|Mystery|E[1-4]|Elite/i.test(JSON.stringify(c));
      await shot(page, `battle-evt${c.eventIndex}`);
      const res = await playBattleByHand(page, `evt${c.eventIndex}`);
      log(`   ⚔ battle @evt ${c.eventIndex}: ${res}`);
      if (res === 'loss') { losses++; finding('P1', 'balance', `Lost a hand-played battle @evt ${c.eventIndex} (badges ${c.badges})`, 'team underpowered or fight overtuned for this point'); await shot(page, `LOSS-evt${c.eventIndex}`); }
      await sleep(600); await forceClick(page, '^Continue|→|Next');
    }
    else if (c.transition) { await sleep(1100); /* "Battle starting…" / arrival — auto-advances; just wait */ }
    else if (c.endScreen) { await forceClick(page, '^Continue|→|Next') || await api(page, 'afterBattleReturn'); }
    else if (c.catchScreen) { await handleCatch(page); }
    else if (c.hof) { log('🏆 HALL OF FAME — beat the League by hand'); await shot(page, 'hall-of-fame'); await forceClick(page, 'Continue|→') || await api(page, 'continuePostGame'); await sleep(600); }
    else if (c.cityScreen) {
      if (c.teamLen === 0) { await forceClick(page, '^OK$'); await forceClick(page, 'Pick Your Starter|Professor') || await api(page, 'enterProfessor'); }
      else if (c.gymBattle) { await forceClick(page, 'Gym Battle|Enter the Gym|Enter the Pokémon League|Victory Road|Pre-League') || await api(page, 'proceedToNextBattle'); }
      else { await forceClick(page, 'Leave City|Continue Route|→') || await api(page, 'proceedToNextBattle'); }
    }
    else { await forceClick(page, 'Step into|Enter the|→|^Continue|^Begin|Onward|Proceed|Claim|Confront') || (await api(page, 'proceedToNextBattle') === 'ok') || await page.mouse.click(215, 740).catch(() => {}); }

    const c2 = await classify(page);
    const sig = c2 ? `${c2.eventIndex}|${c2.battleActive}|${c2.bodyHash}` : '';
    if (sig && sig === prevSig && !(c2 && (c2.battleActive || c2.transition))) stall++; else stall = 0;
    prevSig = sig; prevEvt = c2 ? c2.eventIndex : prevEvt;
    if ((tick % 15) === 0) log(`  …tick ${tick}: evt=${c.eventIndex} badges=${c.badges} team=${c.teamLen} gold=${c.gold} losses=${losses}`);
    if (c.hof) { log('reached HoF — main goal met'); break; }
    if (losses >= 5) { finding('P1', 'balance', 'Aborted: 5+ hand-played losses', 'difficulty likely overtuned for a no-grind competent player, or team-build/training loop insufficient'); break; }
    if (stall >= 16) { finding('P2', 'progression', `Real-player pump stalled at eventIndex ${c.eventIndex}`, JSON.stringify({ city: c.cityScreen, battle: c.battleActive, end: c.endScreen, catch: c.catchScreen, body: c.bodyHash })); await shot(page, `STALL-evt${c.eventIndex}`); await forceClick(page, 'Continue|Leave City|Got it|→|Step into|Begin'); if (c.cityScreen) await api(page, 'proceedToNextBattle'); await sleep(800); const c3 = await classify(page); if (c3 && `${c3.eventIndex}|${c3.battleActive}|${c3.bodyHash}` === sig) { log(`hard stall @evt ${c.eventIndex}`); break; } stall = 0; }
    await sleep(450);
  }

  phase('WRAP-UP');
  const cFinal = await classify(page);
  log(`FINAL: ${JSON.stringify(cFinal)}`);
  const wins = battleLog.filter(b => b.result === 'win').length, losses2 = battleLog.filter(b => b.result === 'loss').length, to = battleLog.filter(b => b.result === 'timeout').length;
  log(`battles: ${battleLog.length} (win ${wins} / loss ${losses2} / timeout ${to})`);
  log(`real JS errors (excl. CDN noise): ${errors.length} · findings: ${findings.length}`);
  await shot(page, 'final');
  writeFileSync(join(OUT, 'player-findings.json'), JSON.stringify({ generatedAt: new Date().toISOString(), screenshots: shotN, errorCount: errors.length, findings, finalState: cFinal, battleLog, errors: errors.slice(0, 80) }, null, 2));
  writeFileSync(join(OUT, 'player-transcript.txt'), transcript.join('\n'));
  log('wrote player-findings.json + player-transcript.txt');
  await browser.close();
} catch (e) {
  console.error('PLAYER CRASH:', e && e.stack || e);
  writeFileSync(join(OUT, 'player-transcript.txt'), transcript.join('\n') + '\n\nCRASH: ' + (e && e.stack || e));
  process.exitCode = 1;
} finally { if (browser) await browser.close().catch(() => {}); cleanup(); }
