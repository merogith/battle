// ml/engine-host.mjs — Stage 1 of the RL roadmap (the "unlock").
//
// Boots the real battle engine headlessly and drives a full Quick-Battle (pve)
// to completion, one decision at a time, with a *pluggable* player policy. The
// opponent is the engine's OWN rule-based AI (getBestMove / aiDecision), so this
// is a faithful game — not a toy.
//
// This is the piece every later stage (the Python Gym env, PPO training,
// self-play) sits on top of. It exposes a tiny, RL-shaped surface:
//
//   const host = await createHost();
//   const obs = await host.reset({ seed: 0, partySize: 3 });   // start a battle
//   host.legalActions();                                       // which actions are allowed now
//   const { observation, reward, done, info } = await host.step(action);
//
// WHY a separate file from tests/helpers/load-engine.js:
//   load-engine.js is the unit-test harness. It (a) stubs the AI to a fixed move
//   so damage tests are deterministic, and (b) its runTurn() resets to a 1-mon
//   party every turn. We want the OPPOSITE: the real AI, and a *persistent*
//   multi-mon battle. We still REUSE load-engine.js to boot jsdom + load data
//   (the expensive part), then undo the AI stubs below.

import { loadEngine } from '../tests/helpers/load-engine.js';

// Action encoding (kept deliberately tiny for Stage 1):
//   0..3                      -> use move slot 0..3
//   4..(4 + benchSize - 1)    -> switch to the Nth *other* party slot
// Illegal actions (0-PP moves, fainted/active switch targets) are reported by
// legalActions() so a learner can mask them. partySize is capped at 6 so the
// action space has a fixed width of 4 + 5 = 9 (you can never switch to the slot
// that is already active, so at most partySize-1 switch targets).
export const MAX_PARTY = 6;
export const NUM_MOVE_ACTIONS = 4;
export const NUM_SWITCH_ACTIONS = MAX_PARTY - 1; // 5
export const ACTION_DIM = NUM_MOVE_ACTIONS + NUM_SWITCH_ACTIONS; // 9

const STATUS_CODES = { null: 0, BRN: 1, PSN: 2, TOX: 3, PAR: 4, SLP: 5, FRZ: 6 };
const WEATHER_CODES = { null: 0, sun: 1, rain: 2, sand: 3, hail: 4, snow: 4 };

function statusCode(s) { return STATUS_CODES[s] ?? 0; }

export async function createHost() {
  const eng = await loadEngine();
  const { window, engine } = eng;

  // --- Restore the REAL AI as the opponent --------------------------------
  // load-engine.js stubbed window.aiDecision / window.getBestMove for unit
  // tests. window.__engine captured the genuine functions at definition time
  // (battle.html ~69811), so we can point the globals that playTurn() reads
  // back at them. We leave aiChooseGimmick stubbed (null) so Stage 1 has no
  // Mega/Tera/Dynamax branches — that complexity arrives in Stage 3.
  if (engine.getBestMove) window.getBestMove = engine.getBestMove;
  if (engine.aiDecision) window.aiDecision = engine.aiDecision;
  window.aiChooseGimmick = () => null;

  const state = () => engine.state;

  // Determine whether the human side currently owes a forced replacement
  // (its active fainted but it still has a live benched mon). After a faint the
  // engine calls openParty(true) and keeps state.isLocked = true, waiting for
  // selectPartyMember(idx, true).
  function needsForcedSwitch() {
    const s = state();
    if (!s || s.isOver) return false;
    const a = s.pActive;
    return !!a && a.currentHp <= 0 && s.playerParty.some((m) => m && m.currentHp > 0);
  }

  function liveBenchIndices() {
    const s = state();
    const out = [];
    s.playerParty.forEach((m, i) => {
      if (m && m.currentHp > 0 && m !== s.pActive) out.push(i);
    });
    return out;
  }

  // Resolve any pending forced switches with the given chooser. chooser(indices)
  // -> one index from `indices`. Used both during a normal step (after our move
  // KO'd us / we got KO'd) and is exposed so a policy can pick the replacement.
  async function resolveForcedSwitches(chooser) {
    let guard = 0;
    while (needsForcedSwitch()) {
      if (guard++ > 24) throw new Error('forced-switch loop did not settle');
      const indices = liveBenchIndices();
      if (!indices.length) break;
      const pick = chooser ? chooser(indices) : indices[0];
      const idx = indices.includes(pick) ? pick : indices[0];
      await window.selectPartyMember(idx, true);
    }
  }

  // --- Observation --------------------------------------------------------
  // A compact, fixed-width numeric vector. Stage 1 keeps it small and readable
  // on purpose; Stage 3 swaps in embeddings for species/move/ability IDs.
  function encodeMon(m, includeMoves) {
    if (!m) return new Array(includeMoves ? 8 + 4 * 2 : 8).fill(0);
    const v = [
      Math.max(0, m.currentHp) / (m.maxHp || 1), // hp fraction
      statusCode(m.status) / 6,
      (m.stages?.atk ?? 0) / 6,
      (m.stages?.def ?? 0) / 6,
      (m.stages?.spa ?? 0) / 6,
      (m.stages?.spd ?? 0) / 6,
      (m.stages?.spe ?? 0) / 6,
      m.currentHp > 0 ? 1 : 0, // alive flag
    ];
    if (includeMoves) {
      for (let i = 0; i < 4; i++) {
        const mv = m.moves && m.moves[i];
        v.push(mv ? (mv.pow || 0) / 250 : 0);
        v.push(mv ? (mv.pp > 0 ? 1 : 0) : 0);
      }
    }
    return v;
  }

  function observe() {
    const s = state();
    if (!s) return [];
    const obs = [];
    // Active mons (with their move power/PP).
    obs.push(...encodeMon(s.pActive, true));
    obs.push(...encodeMon(s.fActive, true));
    // Bench: hp + alive for up to MAX_PARTY-1 slots each side. The foe's bench
    // is partially observable in a real game, but for Stage 1 we expose it so
    // the plumbing is easy to validate; Stage 3 will mask the hidden info.
    const pBench = s.playerParty.filter((m) => m !== s.pActive);
    const fBench = s.foeParty.filter((m) => m !== s.fActive);
    for (let i = 0; i < MAX_PARTY - 1; i++) {
      const pm = pBench[i];
      obs.push(pm ? Math.max(0, pm.currentHp) / (pm.maxHp || 1) : 0, pm && pm.currentHp > 0 ? 1 : 0);
      const fm = fBench[i];
      obs.push(fm ? Math.max(0, fm.currentHp) / (fm.maxHp || 1) : 0, fm && fm.currentHp > 0 ? 1 : 0);
    }
    // Field.
    obs.push((WEATHER_CODES[s.weather] ?? 0) / 4);
    obs.push(Math.min(1, (s.turnNumber || 0) / 50));
    return obs;
  }

  // Width of observe()'s vector — handy for the Python side's observation_space.
  const OBS_DIM = (() => {
    const perActive = 8 + 4 * 2; // 16
    const bench = (MAX_PARTY - 1) * 2 * 2; // both sides
    return perActive * 2 + bench + 2;
  })();

  // --- Legal action mask --------------------------------------------------
  function legalActions() {
    const s = state();
    const mask = new Array(ACTION_DIM).fill(0);
    if (!s || s.isOver || !s.pActive) return mask;
    const a = s.pActive;
    // Moves: legal if the slot exists and has PP. (Struggle, choice-lock, and
    // disable edge-cases are handled by the engine itself — an illegal pick
    // there degrades gracefully rather than crashing.)
    for (let i = 0; i < NUM_MOVE_ACTIONS; i++) {
      const mv = a.moves && a.moves[i];
      if (mv && mv.pp > 0) mask[i] = 1;
    }
    // If no move has PP, allow move slot 0 anyway (engine will use Struggle).
    if (!mask.slice(0, NUM_MOVE_ACTIONS).includes(1) && a.moves && a.moves.length) mask[0] = 1;
    // Switches: legal if the corresponding *other* live party slot exists.
    const live = liveBenchIndices();
    for (let i = 0; i < NUM_SWITCH_ACTIONS; i++) {
      if (live[i] !== undefined) mask[NUM_MOVE_ACTIONS + i] = 1;
    }
    return mask;
  }

  // Map a switch action (4..8) to the actual party index it refers to.
  function switchActionToPartyIndex(action) {
    const live = liveBenchIndices();
    return live[action - NUM_MOVE_ACTIONS];
  }

  // --- Battle setup -------------------------------------------------------
  async function reset({ seed = 0, partySize = 3, aiProfile = 'balanced' } = {}) {
    eng.seedRng(seed >>> 0);
    // Configure a random-team Quick Battle.
    engine.settings.quickTeamSource = 'random';
    engine.settings.partySize = partySize;
    engine.settings.aiProfile = aiProfile;
    engine.settings.animations = false;
    // party-size-select is the source of truth updateMechanics() reads; drive it
    // like a real player would so startQuickBattle honours partySize.
    try {
      const sel = window.document.getElementById('party-size-select');
      if (sel) sel.value = String(partySize);
    } catch (e) {}
    await window.startQuickBattle();
    const s = state();
    if (!s || !s.pActive || !s.fActive) throw new Error('reset: battle did not start');
    return observe();
  }

  // --- One decision -------------------------------------------------------
  // `action` is 0..ACTION_DIM-1. `switchChooser` (optional) decides forced
  // replacements; defaults to "first live bench mon".
  async function step(action, { switchChooser } = {}) {
    const s = state();
    if (!s || s.isOver) {
      return { observation: observe(), reward: 0, done: true, info: { reason: 'already-over' } };
    }
    const before = scoreSide(s);

    let moveIndex = null;
    let switchIndex = null;
    if (action < NUM_MOVE_ACTIONS) {
      moveIndex = action;
    } else {
      switchIndex = switchActionToPartyIndex(action);
      if (switchIndex === undefined) moveIndex = 0; // illegal switch -> safe move
    }

    await window.playTurn(moveIndex, switchIndex);
    // Our active may have fainted mid/end of turn — owe a replacement.
    await resolveForcedSwitches(switchChooser ? (idxs) => switchChooser(idxs, observe()) : null);

    const after = scoreSide(s);
    const done = !!s.isOver;
    const reward = shapedReward(before, after, done, s);
    return {
      observation: observe(),
      reward,
      done,
      info: { turn: s.turnNumber, won: done ? playerWon(s) : null },
    };
  }

  // Simple potential: (player live HP fraction summed) - (foe live HP fraction
  // summed). Reward = change in that potential, plus a terminal win/loss bonus.
  // This gives dense early signal (chip damage) that tapers to win/loss.
  function scoreSide(s) {
    const sum = (party) => party.reduce((t, m) => t + (m ? Math.max(0, m.currentHp) / (m.maxHp || 1) : 0), 0);
    return { p: sum(s.playerParty), f: sum(s.foeParty) };
  }
  function shapedReward(before, after, done, s) {
    const dmgDealt = before.f - after.f; // foe lost HP -> good
    const dmgTaken = before.p - after.p; // we lost HP -> bad
    let r = 0.5 * dmgDealt - 0.5 * dmgTaken;
    if (done) r += playerWon(s) ? 1 : -1;
    return r;
  }
  function playerWon(s) {
    return s.playerParty.some((m) => m && m.currentHp > 0) && !s.foeParty.some((m) => m && m.currentHp > 0);
  }

  return {
    window,
    engine,
    reset,
    step,
    observe,
    legalActions,
    needsForcedSwitch,
    liveBenchIndices,
    resolveForcedSwitches,
    playerWon: () => playerWon(state()),
    isOver: () => !!(state() && state().isOver),
    state,
    ACTION_DIM,
    OBS_DIM,
  };
}
