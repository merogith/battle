// In-house engine oracle for the differential battle harness.
//
// Drives battle.html (headless, via the jsdom harness) through the SAME scripted
// singles battle as showdown-oracle.mjs and returns a trace in the same
// normalized shape, so diff.mjs can compare them turn-by-turn.
//
// Stage 0: read-only with respect to game behaviour — this only *observes* the
// engine through the existing test harness; it changes no engine code.

import { loadEngine } from '../helpers/load-engine.js';

const FULL_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const ZERO_EVS = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

function specToMkMon(spec) {
  return {
    species: spec.species,
    moves: (spec.moves || []).slice(0, 4),
    item: spec.item || null,
    ability: spec.ability || null,
    nature: spec.nature || 'Hardy',
    ivs: { ...FULL_IVS, ...(spec.ivs || {}) },
    evs: { ...ZERO_EVS, ...(spec.evs || {}) },
  };
}

// in-house status codes (BRN/PSN/TOX/PAR/SLP/FRZ) -> Showdown ids (brn/psn/tox/par/slp/frz)
function normStatus(s) { return String(s || '').toLowerCase(); }

function snapMon(mon) {
  if (!mon) return { hp: null, maxhp: null, status: '', boosts: {}, charging: null, invulnerable: false, fainted: true };
  const st = mon.stages || mon.boosts || {};
  return {
    hp: mon.currentHp,
    maxhp: mon.maxHp,
    status: normStatus(mon.status),
    boosts: {
      atk: st.atk || 0, def: st.def || 0, spa: st.spa || 0, spd: st.spd || 0,
      spe: st.spe || 0, accuracy: st.acc || st.accuracy || 0, evasion: st.eva || st.evasion || 0,
    },
    charging: (mon.volatile && mon.volatile.charging) || null,
    invulnerable: !!(mon.volatile && mon.volatile.invulnerable),
    fainted: (mon.currentHp | 0) <= 0,
  };
}

function parseChoice(c) {
  const s = String(c || 'move 1').trim();
  const sw = s.match(/^switch\s+(\d+)$/i);
  if (sw) return { kind: 'switch', slot: +sw[1] - 1 };
  const mv = s.match(/^move\s+(\d+)/i);
  if (mv) return { kind: 'move', slot: +mv[1] - 1 };
  return { kind: 'move', slot: 0 };
}

/**
 * Run a scripted singles battle through the in-house engine.
 * Same option/return shape as runShowdownBattle (see showdown-oracle.mjs).
 */
export async function runInhouseBattle(opts) {
  const { team1, team2, choices1 = [], choices2 = [], seed = 0 } = opts;
  // The engine prints story/data warnings via console.log during its (cached) first
  // boot. Silence those so they don't pollute the divergence report.
  const _origLog = console.log;
  console.log = () => {};
  let E;
  try { E = await loadEngine(); } finally { console.log = _origLog; }
  const { engine, window } = E;

  E.reset();
  if (seed != null) E.seedRng(seed);

  const p1mons = team1.map(s => E.mkMon(specToMkMon(s)));
  const p2mons = team2.map(s => E.mkMon(specToMkMon(s)));

  engine.state.playerParty = p1mons;
  engine.state.foeParty = p2mons;
  engine.state.pActive = p1mons[0];
  engine.state.fActive = p2mons[0];
  engine.state.mode = 'pve';
  engine.state.turnNumber = 0;
  engine.state.isOver = false;
  engine.state.isLocked = false;

  // Full neutral field-state, mirroring startBattle (battle.html:17317-17321) +
  // the sports. CRITICAL: the bare harness reset() omits state.magicRoom, which
  // would leave it `undefined` and make `_defItemActive` (magicRoom === 0) FALSE —
  // silently suppressing every held-item effect (Air Balloon, Choice Band, Life
  // Orb, berries, Rocky Helmet, …) and producing false divergences.
  engine.state.weather = null; engine.state.weatherTurns = 0;
  engine.state.terrain = null; engine.state.terrainTurns = 0;
  engine.state.trickRoom = 0;
  engine.state.gravity = 0;
  engine.state.magicRoom = 0;
  engine.state.mudSport = 0;
  engine.state.waterSport = 0;
  // Fuller side-state (screens / hazards / Wish / Tailwind), matching launchBattle.
  const freshSide = () => ({
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0,
    auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0, tailwind: 0, luckychant: 0,
  });
  engine.state.pSide = freshSide();
  engine.state.fSide = freshSide();

  const turns = [];
  const maxT = Math.max(choices1.length, choices2.length, 1);
  for (let t = 0; t < maxT; t++) {
    if (engine.state.isOver) break;
    const p = parseChoice(choices1[t]);
    const f = parseChoice(choices2[t]);
    if (f.kind === 'move') engine.setForcedFoeMoveSlot(f.slot);

    // Names of the actives at turn START, to map "<name> used …" log lines to a
    // slot for the move-order check (order tests never switch, so this is stable).
    const p1Name = engine.state.pActive && engine.state.pActive.name;
    const p2Name = engine.state.fActive && engine.state.fActive.name;

    const startLog = E.logs.length;
    try {
      if (p.kind === 'switch') await window.playTurn(null, p.slot);
      else await window.playTurn(p.slot, null);
    } catch (err) {
      turns.push({ n: t + 1, logs: [`__ENGINE_THREW__: ${err && err.message}`], order: [], end: snapEnd(engine), threw: true });
      break;
    }
    const logs = E.logs.slice(startLog).map(x => x.text);
    const order = [];
    for (const line of logs) {
      const m = /^(.+?) used /.exec(line);
      if (!m) continue;
      if (m[1] === p1Name) order.push('p1a');
      else if (m[1] === p2Name) order.push('p2a');
    }
    turns.push({ n: t + 1, logs, order, end: snapEnd(engine) });
    if (engine.state.isOver) break;
  }

  const winner = computeWinner(engine.state);
  return { turns, winner };
}

function snapEnd(engine) {
  return { p1a: snapMon(engine.state.pActive), p2a: snapMon(engine.state.fActive) };
}

function computeWinner(state) {
  const alive = (party) => (party || []).some(m => m && (m.currentHp | 0) > 0);
  const p1 = alive(state.playerParty);
  const p2 = alive(state.foeParty);
  if (p1 && !p2) return 'P1';
  if (p2 && !p1) return 'P2';
  return null;
}
