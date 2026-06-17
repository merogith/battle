// AI difficulty-selection suite: exercises the difficulty -> decision-QUALITY coupling added in
// 2026-06 (aiResolveDifficulty / aiSelectScoredMove softmax temperature + anti-panic-switch
// hysteresis + difficulty-scaled player-action prediction).
//
// Design under test:
//   - Very Hard (challenge, temp 0) selects the strictly best-scored move (perfect play).
//   - Very Easy (temp 1.6) samples weaker moves a meaningful fraction of the time (human-like),
//     but the best move remains the modal pick.
//   - The guaranteed-KO floor is honoured at EVERY difficulty: a free KO is never passed up.
//   - Selection is deterministic under a seeded RNG (closes the old bare-Math.random replay gap).
//   - aiDecision's anti-panic-switch hysteresis suppresses a second soft (walled) pivot in a row.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

function freshSide() {
  return {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false,
    reflect: 0, lightScreen: 0, auroraVeil: 0, safeguard: 0, tailwind: 0, mist: 0, luckychant: 0,
  };
}

function setState(eng, { fActive, pActive, foeParty, playerParty, weather = null, trickRoom = 0, mode = 'pve', turnNumber = 3 }) {
  eng.engine.state = {
    mode, turnNumber, score: 0,
    playerParty: playerParty || [pActive],
    foeParty: foeParty || [fActive],
    pActive, fActive,
    isOver: false, isLocked: false,
    weather, weatherTurns: weather ? 5 : 0, terrain: null, terrainTurns: 0, trickRoom,
    fieldLastMove: null,
    pSide: freshSide(), fSide: freshSide(),
    currentPlayer: 1, p1Action: null, p2Action: null,
  };
}

// Force the active story difficulty band that aiResolveDifficulty() reads. We also enable the
// seeded story RNG (sm.runSeed) so aiSelectScoredMove's softmax draws are reproducible — without a
// runSeed, storyRngNext falls back to native Math.random and selection isn't deterministic.
function setDifficulty(eng, band) {
  const sm = eng.window.StoryMode && eng.window.StoryMode.state;
  assert.ok(sm, 'harness should expose StoryMode.state');
  sm.active = true;
  sm.storyDifficulty = band;
}
function clearDifficulty(eng) {
  if (eng.window.StoryMode && eng.window.StoryMode.state) eng.window.StoryMode.state.active = false;
}
// Re-seed the story RNG so the next storyRngNext() sequence is reproducible.
function seedRng(eng, seed) {
  const sm = eng.window.StoryMode.state;
  sm.runSeed = seed >>> 0;
  sm._strngState = null;
}

// Sample getBestMove N times, re-seeding the story RNG per call so draws are reproducible but
// varied; return the move-name distribution.
function sampleMoves(eng, attacker, defender, n) {
  const counts = {};
  for (let i = 0; i < n; i++) {
    seedRng(eng, (i + 1) * 2654435761);
    const mv = eng.engine.getBestMove(attacker, defender);
    counts[mv.name] = (counts[mv.name] || 0) + 1;
  }
  return counts;
}
function modal(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

test('Very Hard (challenge) is strict argmax — same best move every roll', async () => {
  const eng = await loadEngine();
  const { mkMon } = eng;
  // Bulky target so there is NO guaranteed KO (otherwise the KO-floor, not the temperature, decides).
  const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Pound', 'Quick Attack', 'Tackle'] });
  const target = mkMon({ species: 'Venusaur', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  setState(eng, { fActive: attacker, pActive: target });
  setDifficulty(eng, 'challenge');
  const counts = sampleMoves(eng, attacker, target, 40);
  assert.equal(Object.keys(counts).length, 1, `challenge should never deviate, saw: ${JSON.stringify(counts)}`);
  assert.equal(Object.keys(counts)[0], 'Flamethrower', 'super-effective STAB is the strict argmax');
});

test('Very Easy samples weaker moves, but the best move stays modal', async () => {
  const eng = await loadEngine();
  const { mkMon } = eng;
  const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Pound', 'Quick Attack', 'Tackle'] });
  const target = mkMon({ species: 'Venusaur', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  setState(eng, { fActive: attacker, pActive: target });
  setDifficulty(eng, 'veryeasy');
  const counts = sampleMoves(eng, attacker, target, 60);
  assert.ok(Object.keys(counts).length > 1, `very easy should mix in weaker moves, saw only: ${JSON.stringify(counts)}`);
  assert.equal(modal(counts), 'Flamethrower', `best move should remain most common, saw: ${JSON.stringify(counts)}`);
  // The best move is clearly preferred (modal + a healthy plurality) but far from automatic — the
  // exact sub-optimal rate is scenario-dependent and maintainer-tunable via AI_DIFFICULTY_PARAMS.
  assert.ok(counts['Flamethrower'] / 60 >= 0.30, `best move should be a clear plurality, saw: ${JSON.stringify(counts)}`);
});

test('Guaranteed-KO floor: even Very Easy never passes up a free KO', async () => {
  const eng = await loadEngine();
  const { mkMon } = eng;
  // Paras is Bug/Grass (4x weak to Fire) and frail — Flamethrower is a guaranteed KO while the
  // Normal-type filler moves are not. The KO floor must override the high temperature.
  const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Pound', 'Quick Attack', 'Tackle'] });
  const target = mkMon({ species: 'Paras', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  setState(eng, { fActive: attacker, pActive: target });
  setDifficulty(eng, 'veryeasy');
  const counts = sampleMoves(eng, attacker, target, 40);
  assert.equal(Object.keys(counts).length, 1, `a guaranteed KO must never be skipped, saw: ${JSON.stringify(counts)}`);
  assert.equal(Object.keys(counts)[0], 'Flamethrower', 'the KO move is taken regardless of difficulty');
});

test('Selection is deterministic under a seeded RNG (replay integrity)', async () => {
  const eng = await loadEngine();
  const { mkMon } = eng;
  setDifficulty(eng, 'normal');
  // getBestMove accumulates state on the mon objects, so a faithful "same inputs + same seed"
  // check rebuilds fresh combatants and re-seeds the story RNG before each choice.
  const choose = (seed) => {
    const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Pound', 'Quick Attack', 'Tackle'] });
    const target = mkMon({ species: 'Venusaur', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
    setState(eng, { fActive: attacker, pActive: target });
    seedRng(eng, seed);
    return eng.engine.getBestMove(attacker, target).name;
  };
  for (const seed of [1, 7, 42, 12345, 9999]) {
    assert.equal(choose(seed), choose(seed), `seed ${seed} must reproduce the same AI choice`);
  }
});

test('Non-story modes fall back to a fixed strong band (no crash, argmax-leaning)', async () => {
  const eng = await loadEngine();
  const { mkMon } = eng;
  const attacker = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Pound', 'Quick Attack', 'Tackle'] });
  const target = mkMon({ species: 'Venusaur', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  setState(eng, { fActive: attacker, pActive: target, mode: 'pve' });
  clearDifficulty(eng);
  const counts = sampleMoves(eng, attacker, target, 40);
  assert.equal(modal(counts), 'Flamethrower', `fixed 'hard' band should play strongly, saw: ${JSON.stringify(counts)}`);
});

test('Anti-panic-switch: a second soft (walled) pivot in a row is suppressed', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  eng.window.Math.random = () => 0;
  // Foe active barely dents a huge wall (walled), but is faster and untouched (not about to die),
  // and the bench has a hard counter — so a single switch is warranted, a back-to-back one is panic.
  const foeActive = mkMon({ species: 'Caterpie', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  const foeBench = mkMon({ species: 'Charizard', moves: ['Flamethrower', 'Flamethrower', 'Flamethrower', 'Flamethrower'] });
  const wall = mkMon({ species: 'Steelix', moves: ['Iron Defense', 'Iron Defense', 'Iron Defense', 'Iron Defense'] });
  setState(eng, { fActive: foeActive, pActive: wall, foeParty: [foeActive, foeBench], playerParty: [wall], turnNumber: 5 });

  // Baseline: no recent switch -> the AI pivots to its counter.
  delete engine.state._aiLastSwitchTurn;
  const sw = engine.aiDecision();
  assert.equal(typeof sw, 'number', `expected a switch index from a walled matchup, got ${sw}`);
  assert.equal(sw, 1, 'should pivot to the Charizard counter on the bench');
  // The decision records the switch turn so the hysteresis can see it next turn.
  assert.equal(engine.state._aiLastSwitchTurn, 5, 'switch turn should be recorded for hysteresis');

  // Now simulate "we switched last turn": the same soft trigger must be held.
  engine.state._aiLastSwitchTurn = engine.state.turnNumber - 1;
  const held = engine.aiDecision();
  assert.equal(held, null, 'a back-to-back walled pivot should be suppressed (anti-panic-switch)');
});
