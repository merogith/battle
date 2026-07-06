// Self-verifying test for the headless Story Simulator (scripts/debug/story-sim/*).
//
// Locks in the properties the whole sweep depends on, so a future change to battle.html or the
// sim can't silently regress them:
//   1. A full run's telemetry satisfies the structural invariants (checkRun).
//   2. Same (seed,difficulty,policy,item) reproduces byte-identically (checkDeterminism).
//   3. The engine's own victory path stays suppressed — the sim is the sole reward authority
//      (gold == startGold + sum of stage awards, no double-count).
//   4. The mid-run sm save shape serializes and round-trips at the current SAVE_VER.
//
// Uses the fast `casual` policy (walls early) for the repeated-run checks to keep wall-time low.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { runStory } from '../../scripts/debug/story-sim/story-run.mjs';
import { checkRun, checkDeterminism } from '../../scripts/debug/story-sim/invariants.mjs';

let E;
async function engine() {
  if (E) return E;
  const _l = console.log; console.log = () => {};
  E = await loadEngine();
  console.log = _l;
  return E;
}

test('full run satisfies structural invariants', async () => {
  const e = await engine();
  const rec = await runStory(e, { seed: 3, difficulty: 'normal', policy: 'recommended', itemMode: 'off' });
  const violations = checkRun(rec);
  assert.deepEqual(violations, [], 'invariant violations: ' + JSON.stringify(violations, null, 2));
  assert.ok(rec.battles > 5, `expected a multi-battle run, got ${rec.battles}`);
  assert.ok(rec.badges >= 1, `recommended/normal should earn badges, got ${rec.badges}`);
});

test('same inputs reproduce byte-identically (determinism)', async () => {
  const e = await engine();
  const a = await runStory(e, { seed: 5, difficulty: 'normal', policy: 'casual', itemMode: 'off' });
  const b = await runStory(e, { seed: 5, difficulty: 'normal', policy: 'casual', itemMode: 'off' });
  assert.deepEqual(checkDeterminism(a, b), [], 'run was non-deterministic');
});

test('gold accounting closes — sim is the sole reward authority', async () => {
  const e = await engine();
  const rec = await runStory(e, { seed: 8, difficulty: 'normal', policy: 'recommended', itemMode: 'off' });
  const battles = rec.stages.filter(s => s.kind === 'battle');
  const sumAward = battles.reduce((a, s) => a + (s.goldAwarded || 0), 0);
  const spent = rec.agent.goldSpent | 0;
  // final = start + battle awards - agent spend. If the engine's own onBattleEnd leaked, awards
  // would roughly double and this would fail.
  assert.equal(rec.gold, rec.startGold + sumAward - spent,
    `gold accounting mismatch: final ${rec.gold} != start ${rec.startGold} + awards ${sumAward} - spent ${spent}`);
});

test('mid-run sm save shape round-trips at current SAVE_VER', async () => {
  const e = await engine();
  await runStory(e, { seed: 2, difficulty: 'normal', policy: 'casual', itemMode: 'off' });
  const sm = e.window.__storySim.sm;
  const SAVE_VER = e.window.__STORY_SAVE_VER | 0;
  const round = JSON.parse(JSON.stringify(sm)); // the pbs_story_save serialization shape
  assert.equal(round.version, SAVE_VER, `sm.version ${round.version} != SAVE_VER ${SAVE_VER}`);
  assert.ok(Array.isArray(round.team), 'team survives serialization');
  assert.equal(round.gold, sm.gold, 'gold survives serialization');
  assert.equal(round.badges, sm.badges, 'badges survive serialization');
});
