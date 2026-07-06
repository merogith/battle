// Headless CPU-vs-CPU battle resolver for the Story Simulator (Phase 1).
//
// The differential harness (tests/differential/inhouse-oracle.mjs) drives a *scripted*
// single-mon battle with a forced foe move. This resolver instead runs a full multi-mon
// battle with the REAL game AI on BOTH sides, so the outcome is a genuine measurement of
// how the shipped engine plays the matchup — the keystone the whole Story Sim rests on.
//
// Key mechanics (verified against battle.html):
//   - playTurn(pMoveIndex, pSwitchIndex): the PLAYER action is passed in; the FOE action is
//     assembled internally via aiDecision()/getBestMove()/aiChooseGimmick() reading global
//     `state`. Those are the window.* bindings, which the jsdom harness STUBS for
//     determinism — we restore the REAL implementations (captured on engine.*) so the foe
//     plays for real.
//   - On a player faint with bench left, checkFaints() calls window.openParty(true) and
//     WAITS for UI input. Headless, we drive the replacement ourselves via
//     selectPartyMember(idx, true) — the exact function the UI button calls.
//   - Player move/switch choice reuses engine.getBestMove / engine.aiBestSwitch so the
//     player side is the same competent evaluator as the foe (run at 'hard' skill upstream).
//
// Stage 1 scope: read-only w.r.t. engine behaviour — observes through the harness, forks
// no engine logic. Player VOLUNTARY switching is not yet modeled (forced-on-faint only);
// the foe does switch proactively, so this is a conservative (slightly player-unfavourable)
// first read. Tracked as a Phase-2 refinement in docs/STORY_MODE_TESTING_STRATEGY.md.

import { loadEngine } from '../../../tests/helpers/load-engine.js';

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

function freshSide() {
  return {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0,
    auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0, tailwind: 0, luckychant: 0,
  };
}

let _aiRestored = false;
// Restore the real AI onto the window bindings that playTurn reads, replacing the harness
// stubs. Idempotent; call once after loadEngine.
function restoreRealAI(E, { foeStoryItems = false } = {}) {
  const { engine, window } = E;
  if (engine.aiDecision) window.aiDecision = engine.aiDecision;
  if (engine.getBestMove) window.getBestMove = engine.getBestMove;
  if (engine.aiChooseGimmick) window.aiChooseGimmick = engine.aiChooseGimmick;
  // Foe battle items are gated on settings.storyBattleItems and state.mode==='story'.
  // Leave the harness's no-op unless a caller opts into faithful foe items.
  if (foeStoryItems && typeof engine.tryFoeStoryBattleItem === 'function') {
    window.tryFoeStoryBattleItem = engine.tryFoeStoryBattleItem;
  }
  _aiRestored = true;
}

function aliveCount(party) { return (party || []).filter(m => m && (m.currentHp | 0) > 0).length; }
function survivingHpPct(party) {
  const mons = (party || []).filter(Boolean);
  if (!mons.length) return 0;
  let cur = 0, max = 0;
  for (const m of mons) { cur += Math.max(0, m.currentHp | 0); max += (m.maxHp | 0); }
  return max ? cur / max : 0;
}

/**
 * Resolve one full battle, both sides driven by the real AI.
 *
 * @param {object} E        loaded engine handle (from loadEngine)
 * @param {object[]} team1  player specs (species/moves/item/ability/nature/ivs/evs)
 * @param {object[]} team2  foe specs
 * @param {object} opts     { seed, mode='pve', maxTurns=300, foeStoryItems=false }
 * @returns {object} outcome telemetry
 */
export async function resolveBattle(E, team1, team2, opts = {}) {
  const { engine, window } = E;
  const { seed = 0, mode = 'pve', maxTurns = 300, foeStoryItems = false } = opts;
  if (!_aiRestored) restoreRealAI(E, { foeStoryItems });

  E.reset();
  if (seed != null) E.seedRng(seed);

  const p1 = team1.map(s => E.mkMon(specToMkMon(s)));
  const p2 = team2.map(s => E.mkMon(specToMkMon(s)));

  const st = engine.state;
  st.playerParty = p1;
  st.foeParty = p2;
  st.pActive = p1[0];
  st.fActive = p2[0];
  st.mode = mode;
  st.turnNumber = 0;
  st.isOver = false;
  st.isLocked = false;
  // Full neutral field-state (mirrors inhouse-oracle: bare reset() omits magicRoom etc.,
  // which would silently suppress every held-item effect).
  st.weather = null; st.weatherTurns = 0;
  st.terrain = null; st.terrainTurns = 0;
  st.trickRoom = 0; st.gravity = 0; st.magicRoom = 0; st.mudSport = 0; st.waterSport = 0;
  st.pSide = freshSide();
  st.fSide = freshSide();
  st.pendingEoT = false; st.residualPhaseComplete = false;
  st.p1GimmickIntent = null; st.p2GimmickIntent = null;

  if (typeof window.applySwitchInAbilities === 'function') {
    try { window.applySwitchInAbilities(st.pActive, st.fActive); } catch (e) {}
    try { window.applySwitchInAbilities(st.fActive, st.pActive); } catch (e) {}
  }

  let turns = 0;
  let threw = null;
  const startLog = E.logs.length;

  for (turns = 0; turns < maxTurns; turns++) {
    if (st.isOver) break;
    if (aliveCount(st.playerParty) === 0 || aliveCount(st.foeParty) === 0) break;

    // Player action: real evaluator, pointed at the player's active. (Move-only for now.)
    let moveIdx = 0;
    try {
      const best = window.getBestMove(st.pActive, st.fActive);
      if (best && Array.isArray(st.pActive.moves)) {
        const i = st.pActive.moves.indexOf(best);
        moveIdx = i >= 0 ? i : 0;
      }
    } catch (e) { moveIdx = 0; }

    try {
      await window.playTurn(moveIdx, null);
    } catch (err) {
      threw = (err && err.message) || String(err);
      break;
    }

    // Drive any pending player forced-switch(es). checkFaints() opened the party modal and
    // is waiting; selectPartyMember(idx,true) performs the switch + its own faint/residual
    // chain. Loop in case the replacement also faints (hazards / residual).
    let guard = 0;
    while (!st.isOver
           && st.pActive && (st.pActive.currentHp | 0) <= 0
           && aliveCount(st.playerParty) > 0
           && guard++ < 8) {
      const survivors = st.playerParty.filter(m => m && (m.currentHp | 0) > 0);
      if (!survivors.length) break;
      let pick = survivors[0];
      try { pick = window.aiBestSwitch ? (window.aiBestSwitch(survivors, st.fActive) || survivors[0]) : survivors[0]; }
      catch (e) { pick = survivors[0]; }
      const idx = st.playerParty.indexOf(pick);
      try {
        await window.selectPartyMember(idx >= 0 ? idx : st.playerParty.indexOf(survivors[0]), true);
      } catch (e) { break; }
    }
  }

  const logs = E.logs.slice(startLog).map(x => x.text);
  const pAlive = aliveCount(st.playerParty);
  const fAlive = aliveCount(st.foeParty);
  let winner = null;
  if (pAlive > 0 && fAlive === 0) winner = 'player';
  else if (fAlive > 0 && pAlive === 0) winner = 'foe';
  else if (pAlive === 0 && fAlive === 0) winner = 'draw';

  return {
    winner,
    result: winner === 'player' ? 'win' : winner === 'foe' ? 'loss' : (turns >= maxTurns ? 'stall' : (winner || 'stall')),
    turns,
    stalled: turns >= maxTurns,
    threw,
    pAlive, fAlive,
    pStartCount: team1.length, fStartCount: team2.length,
    pFaints: team1.length - pAlive,
    fFaints: team2.length - fAlive,
    pHpRemainingPct: survivingHpPct(st.playerParty),
    fHpRemainingPct: survivingHpPct(st.foeParty),
    logTail: logs.slice(-6),
  };
}

export { restoreRealAI };
