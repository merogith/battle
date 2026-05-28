// Verifies the trainer grade-availability matrix (Sheet 4 −/o/+, Phase 1d-ii):
// difficulty ladder layered on the existing ramp. Forbidden grades drop to 0,
// "high" grades favoured over "some", renormalized to 100.
// Run: node --test tests/suites/story-build-curve-grade-trainer.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

const KEYS = ['g1', 'g2', 'g3', 'g4'];
const sumW = (gw) => KEYS.reduce((s, k) => s + (gw[k] || 0), 0);
// Higher = stronger grade mix (G1 weighted most).
const strength = (gw) => (gw.g1 || 0) * 4 + (gw.g2 || 0) * 3 + (gw.g3 || 0) * 2 + (gw.g4 || 0) * 1;

test('grade profiles match the approved matrix', () => {
  // Spread the engine-realm array into a local one so deepStrictEqual compares
  // values, not the cross-realm Array.prototype reference.
  const prof = (e) => [...ST.trainerGradeProfile(e)];
  assert.deepEqual(prof('Basic Trainer'), [0, 0, 1, 2]);
  assert.deepEqual(prof('Gym Trainer 1'), [0, 1, 2, 1]);
  assert.deepEqual(prof('Elite Trainer'), [0, 1, 2, 1]);
  assert.deepEqual(prof('Gym Leader 4'), [0, 2, 1, 0]);
  assert.deepEqual(prof('Rival'), [0, 2, 1, 0]);
  assert.deepEqual(prof('Champion'), [1, 2, 1, 0]);
  assert.deepEqual(prof('E2'), [1, 2, 1, 0]);
});

test('matrix forbids the right grades and renormalizes to 100', () => {
  const base = { g1: 10, g2: 20, g3: 35, g4: 35 };
  const basic = ST.applyTrainerGradeMatrix(base, 'Basic Trainer');
  assert.equal(basic.g1 | 0, 0, 'basic: G1 forbidden');
  assert.equal(basic.g2 | 0, 0, 'basic: G2 forbidden');
  assert.ok(Math.abs(sumW(basic) - 100) < 0.01, 'basic sums to 100');

  const leader = ST.applyTrainerGradeMatrix(base, 'Gym Leader 4');
  assert.equal(leader.g1 | 0, 0, 'leader: G1 forbidden');
  assert.equal(leader.g4 | 0, 0, 'leader: G4 forbidden');
  assert.ok(leader.g2 > leader.g3, 'leader: G2 (high) > G3 (some)');

  const champ = ST.applyTrainerGradeMatrix(base, 'Champion');
  assert.ok(champ.g1 > 0, 'champion: G1 allowed');
  assert.equal(champ.g4 | 0, 0, 'champion: G4 forbidden');
});

test('difficulty ladder: E4 > leader > gym > basic by grade strength', () => {
  const base = { g1: 10, g2: 20, g3: 35, g4: 35 };
  const basic = strength(ST.applyTrainerGradeMatrix(base, 'Basic Trainer'));
  const gym = strength(ST.applyTrainerGradeMatrix(base, 'Gym Trainer 1'));
  const leader = strength(ST.applyTrainerGradeMatrix(base, 'Gym Leader 4'));
  const e4 = strength(ST.applyTrainerGradeMatrix(base, 'E2'));
  assert.ok(basic < gym, `basic ${basic.toFixed(0)} < gym ${gym.toFixed(0)}`);
  assert.ok(gym < leader, `gym ${gym.toFixed(0)} < leader ${leader.toFixed(0)}`);
  assert.ok(leader < e4, `leader ${leader.toFixed(0)} < e4 ${e4.toFixed(0)}`);
});

test('"high" grade is favoured ~2.5x over "some" within a profile', () => {
  // Gym/elite profile [0,1,2,1] on a flat base: G3 (high) should dominate G2/G4 (some).
  const flat = { g1: 25, g2: 25, g3: 25, g4: 25 };
  const gym = ST.applyTrainerGradeMatrix(flat, 'Elite Trainer');
  assert.ok(Math.abs(gym.g3 / gym.g2 - 2.5) < 0.2, `G3/G2 ratio ${(gym.g3 / gym.g2).toFixed(2)} ~ 2.5`);
  assert.ok(Math.abs(gym.g3 / gym.g4 - 2.5) < 0.2, `G3/G4 ratio ${(gym.g3 / gym.g4).toFixed(2)} ~ 2.5`);
});

test('mask that would zero everything falls back to the ramped base', () => {
  // Intro Rival case: pure-G4 base vs a G4-forbidden leader profile.
  const pureG4 = { g1: 0, g2: 0, g3: 0, g4: 100 };
  const out = ST.applyTrainerGradeMatrix(pureG4, 'Rival');
  assert.deepEqual(out, pureG4, 'kept the base unchanged (no valid grade survived)');
});

test('city rise: G2 share for a leader grows as the ramped base strengthens', () => {
  // Simulate early (G3/G4 only) vs late (G1/G2 present) ramped bases for a leader.
  const early = ST.applyTrainerGradeMatrix({ g1: 0, g2: 5, g3: 40, g4: 55 }, 'Gym Leader 4');
  const late = ST.applyTrainerGradeMatrix({ g1: 20, g2: 35, g3: 30, g4: 15 }, 'Gym Leader 4');
  assert.ok(late.g2 > early.g2, `late G2 ${late.g2.toFixed(0)} > early G2 ${early.g2.toFixed(0)}`);
});
