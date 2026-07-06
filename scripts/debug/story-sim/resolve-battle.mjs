// Headless CPU-vs-CPU battle resolver for the Story Simulator.
//
// Runs a full multi-mon battle with the REAL game AI on BOTH sides, headless and
// deterministic — the keystone the whole Story Sim rests on. It observes the shipped
// engine through the jsdom harness and forks NO engine logic.
//
// Fidelity design (verified against battle.html):
//   - playTurn(pMoveIndex, pSwitchIndex): the PLAYER action is passed in; the FOE action is
//     assembled internally via aiDecision()/getBestMove()/aiChooseGimmick() reading global
//     `state`. Those are window.* bindings, which the harness STUBS for determinism — we
//     restore the REAL implementations (captured on engine.*) so the foe plays for real.
//   - PLAYER decisions reuse the SAME real AI via the in-repo perspective-swap precedent
//     (`_pvpBuildTimeoutAction`, battle.html ~24691): swap fActive/pActive/foeParty/
//     playerParty (+fSide/pSide for hazard fidelity), call aiDecision() (proactive switch),
//     else getBestMove()+aiChooseGimmick(); restore in `finally`. This gives the player the
//     foe's competent switching/gimmick logic — no forked AI, and fixes the move-only bias.
//   - SKILL PINNING: aiResolveDifficulty reads the global window.StoryMode.state.storyDifficulty.
//     We pin the PLAYER to 'hard' by set/restoring that global around the player's decision,
//     then let playTurn resolve the FOE at the real story difficulty.
//   - On a player faint with bench left, checkFaints() calls window.openParty(true) and WAITS
//     for UI input. Headless, we drive the replacement via selectPartyMember(idx,true) — the
//     exact function the UI button calls.
//
// Determinism: verified byte-identical for repeated same-seed runs.

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
// Restore the real AI onto the window bindings that playTurn reads, replacing harness stubs.
// Idempotent; safe to call every battle. (Foe items are controlled per-battle, not here.)
export function restoreRealAI(E) {
  const { engine, window } = E;
  if (engine.aiDecision) window.aiDecision = engine.aiDecision;
  if (engine.getBestMove) window.getBestMove = engine.getBestMove;
  if (engine.aiChooseGimmick) window.aiChooseGimmick = engine.aiChooseGimmick;
  // CRITICAL: in mode='story' the engine's own victory path (showEndScreen -> victory overlay ->
  // onBattleEnd) fires when a battle ends and awards coins / advances eventIndex+badges — which
  // would DOUBLE-COUNT against the Story Sim's own advance (and its async overlay wobbles gold on
  // the first run of a process). Stub the victory-UI + onBattleEnd to no-ops so the sim's run loop
  // is the sole authority on rewards/advancement. checkFaints sets state.isOver BEFORE calling
  // these, so the resolver still detects battle end correctly.
  window.showEndScreen = () => {};
  window.showVictoryOverlay = () => {};
  window.onBattleEnd = () => {};
  _aiRestored = true;
}

function smHandle(window) {
  try { return window.StoryMode && window.StoryMode.state; } catch (e) { return null; }
}

// Build the PLAYER's action for this turn using the real AI via perspective-swap, pinned to
// 'hard' skill. Mirrors _pvpBuildTimeoutAction. Returns { moveIndex, switchIndex } for playTurn;
// sets state.p1GimmickIntent as a side-effect (survives the swap restore — it's a scalar).
function buildPlayerAction(E, { playerSkill = 'hard' } = {}) {
  const { window } = E;
  const st = window.__engine ? window.__engine.state : E.engine.state;
  const state = E.engine.state;
  const sm = smHandle(window);
  const _savedDiff = sm ? sm.storyDifficulty : undefined;
  if (sm && playerSkill) sm.storyDifficulty = playerSkill; // pin player band

  const _fa = state.fActive, _pa = state.pActive, _fp = state.foeParty, _pp = state.playerParty;
  const _fs = state.fSide, _ps = state.pSide;
  // aiDecision reads/writes the shared scratch field state._aiLastSwitchTurn (the foe's switch
  // history). Swap in the PLAYER's own history so the foe's recent switches don't suppress the
  // player's "_justSwitched" check (and vice-versa) — a fidelity fix over the raw pvp precedent.
  const _foeSwitchTurn = state._aiLastSwitchTurn;
  state._aiLastSwitchTurn = (state._playerAiLastSwitchTurn === undefined) ? -99 : state._playerAiLastSwitchTurn;
  state.fActive = _pa; state.pActive = _fa;
  state.foeParty = _pp; state.playerParty = _fp;
  state.fSide = _ps; state.pSide = _fs; // swap sides too (hazard fidelity)
  try {
    let switchIdx = null;
    try { switchIdx = window.aiDecision(); } catch (e) { switchIdx = null; }
    if (switchIdx !== null && switchIdx !== undefined) {
      state._playerAiLastSwitchTurn = state.turnNumber; // record player's own switch
      try { window.clearGimmickIntent && window.clearGimmickIntent(true); } catch (e) {}
      return { moveIndex: null, switchIndex: switchIdx };
    }
    let pMove = null;
    try { pMove = window.getBestMove(state.fActive, state.pActive); } catch (e) { pMove = null; }
    let _aiG = null;
    try { _aiG = window.aiChooseGimmick(state.fActive, state.pActive); } catch (e) { _aiG = null; }
    const _aiSlot = state.foeParty.indexOf(state.fActive);
    state.p1GimmickIntent = (_aiG && _aiSlot >= 0) ? { kind: _aiG, slot: _aiSlot } : null;
    const active = state.fActive;
    let mi = 0;
    if (pMove && Array.isArray(active.moves)) {
      const i = active.moves.indexOf(pMove);
      mi = i >= 0 ? i : 0;
    }
    return { moveIndex: mi, switchIndex: null };
  } finally {
    state.fActive = _fa; state.pActive = _pa;
    state.foeParty = _fp; state.playerParty = _pp;
    state.fSide = _fs; state.pSide = _ps;
    state._aiLastSwitchTurn = _foeSwitchTurn; // restore the foe's switch history
    if (sm) sm.storyDifficulty = _savedDiff; // restore foe band before playTurn
  }
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
 * @param {object[]|object} team1  player specs, OR { mons: prebuiltMons } to skip building
 * @param {object[]|object} team2  foe specs, OR { mons: prebuiltMons }
 * @param {object} opts     { seed, mode='pve', maxTurns=150, foeStoryItems=false,
 *                            playerSkill='hard', storyContext=null }
 * @returns {object} outcome telemetry
 */
export async function resolveBattle(E, team1, team2, opts = {}) {
  const { engine, window } = E;
  const {
    seed = 0, mode = 'pve', maxTurns = 150, foeStoryItems = false,
    playerSkill = 'hard', storyContext = null,
  } = opts;
  if (!_aiRestored) restoreRealAI(E);

  E.reset();
  if (seed != null) E.seedRng(seed);

  // Accept prebuilt mons (Story Sim passes real rollTrainerTeam output) or specs.
  const buildTeam = (t) => Array.isArray(t)
    ? t.map(s => E.mkMon(specToMkMon(s)))
    : (t && Array.isArray(t.mons) ? t.mons : []);
  const p1 = buildTeam(team1);
  const p2 = buildTeam(team2);
  if (!p1.length || !p2.length) throw new Error('resolveBattle: both teams must be non-empty');

  const st = engine.state;
  st.playerParty = p1;
  st.foeParty = p2;
  st.pActive = p1[0];
  st.fActive = p2[0];
  st.mode = mode;
  st.turnNumber = 0;
  st.isOver = false;
  st.isLocked = false;
  st.weather = null; st.weatherTurns = 0;
  st.terrain = null; st.terrainTurns = 0;
  st.trickRoom = 0; st.gravity = 0; st.magicRoom = 0; st.mudSport = 0; st.waterSport = 0;
  st.pSide = freshSide();
  st.fSide = freshSide();
  st.pendingEoT = false; st.residualPhaseComplete = false;
  st.p1GimmickIntent = null; st.p2GimmickIntent = null;
  st._aiLastSwitchTurn = undefined; st._playerAiLastSwitchTurn = undefined;

  // Story context: foe items + difficulty scaling need mode='story' and sm fields set.
  const sm = smHandle(window);
  const _smSaved = sm ? {
    active: sm.active, storyDifficulty: sm.storyDifficulty,
  } : null;
  if (storyContext && sm) {
    if (storyContext.storyDifficulty) sm.storyDifficulty = storyContext.storyDifficulty;
    if (storyContext.active !== undefined) sm.active = storyContext.active;
    if (storyContext.foeStoryInv !== undefined) st.foeStoryInv = storyContext.foeStoryInv;
    st.foeStoryItemUsedThisTurn = false;
    st.foeStoryItemUsesThisBattle = 0;
  }
  // Per-battle foe-item control: real impl when opted in AND we have story context, else stub.
  window.tryFoeStoryBattleItem =
    (foeStoryItems && typeof engine.tryFoeStoryBattleItem === 'function')
      ? engine.tryFoeStoryBattleItem
      : () => false;
  try {
    if (window.settings) window.settings.storyBattleItems = !!foeStoryItems;
    if (engine.settings) engine.settings.storyBattleItems = !!foeStoryItems;
  } catch (e) {}

  if (typeof window.applySwitchInAbilities === 'function') {
    try { window.applySwitchInAbilities(st.pActive, st.fActive); } catch (e) {}
    try { window.applySwitchInAbilities(st.fActive, st.pActive); } catch (e) {}
  }

  let turns = 0;
  let threw = null;
  let lastProgress = 0; // turn index of last HP change; stall breaker
  let prevHpSum = survivingHpPct(st.playerParty) + survivingHpPct(st.foeParty);
  const startLog = E.logs.length;

  for (turns = 0; turns < maxTurns; turns++) {
    if (st.isOver) break;
    if (aliveCount(st.playerParty) === 0 || aliveCount(st.foeParty) === 0) break;

    const action = buildPlayerAction(E, { playerSkill });
    try {
      await window.playTurn(action.moveIndex, action.switchIndex);
    } catch (err) {
      threw = (err && err.message) || String(err);
      break;
    }

    // Drive any pending player forced-switch(es). checkFaints() opened the party modal and is
    // waiting; selectPartyMember(idx,true) performs the switch + its own faint/residual chain.
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
      try { await window.selectPartyMember(idx >= 0 ? idx : st.playerParty.indexOf(survivors[0]), true); }
      catch (e) { break; }
    }

    // Stall breaker: if neither side's total HP fraction changed for 12 turns, call it a stall
    // (PP-stall / recover loops / mutual immunity). Cheaper than waiting for maxTurns.
    const hpSum = survivingHpPct(st.playerParty) + survivingHpPct(st.foeParty);
    if (Math.abs(hpSum - prevHpSum) > 1e-6) { lastProgress = turns; prevHpSum = hpSum; }
    else if (turns - lastProgress >= 12) { break; }
  }

  if (_smSaved && sm) { sm.active = _smSaved.active; sm.storyDifficulty = _smSaved.storyDifficulty; }

  const logs = E.logs.slice(startLog).map(x => x.text);
  const pAlive = aliveCount(st.playerParty);
  const fAlive = aliveCount(st.foeParty);
  const stalled = turns >= maxTurns || (pAlive > 0 && fAlive > 0);
  let winner = null;
  if (pAlive > 0 && fAlive === 0) winner = 'player';
  else if (fAlive > 0 && pAlive === 0) winner = 'foe';
  else if (pAlive === 0 && fAlive === 0) winner = 'draw';

  return {
    winner,
    result: winner === 'player' ? 'win' : winner === 'foe' ? 'loss' : (winner || 'stall'),
    turns,
    stalled: !winner && (turns >= maxTurns || (pAlive > 0 && fAlive > 0)),
    threw,
    pAlive, fAlive,
    pStartCount: p1.length, fStartCount: p2.length,
    pFaints: p1.length - pAlive,
    fFaints: p2.length - fAlive,
    pHpRemainingPct: survivingHpPct(st.playerParty),
    fHpRemainingPct: survivingHpPct(st.foeParty),
    logTail: logs.slice(-6),
  };
}
