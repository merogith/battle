// Verifies the city-curve IV bands (story build sheets, Phase 1b):
//   trainers  : tight band climbing with city, shifted up by difficulty
//   wild/prof : "0..cap" band whose floor rises with city
// Run: node --test tests/suites/story-build-curve-iv.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0, team: [],
    settings: { enabledGens: GENS.slice() },
    unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {},
  }, extra);
}
setSm();

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
function sample(kind, city, diff, ace, n = 600) {
  let min = 99, max = -1, sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    const ivs = ST.rollCityIVs(kind, city, diff, ace);
    for (const s of STATS) { const v = ivs[s]; if (v < min) min = v; if (v > max) max = v; sum += v; cnt++; }
  }
  return { min, max, mean: sum / cnt };
}

// Spec bands (per-stat [min,max]) indexed by city.
const TRAINER = [[0, 0], [0, 5], [5, 10], [10, 15], [15, 20], [20, 25], [25, 31], [31, 31]];
const WILDPROF = [[0, 10], [0, 20], [0, 31], [5, 31], [10, 31], [15, 31], [20, 31], [25, 31]];

test('trainer IV band stays within the city curve (basic, diff 0)', () => {
  for (let c = 0; c < TRAINER.length; c++) {
    const [lo, hi] = TRAINER[c];
    const s = sample('trainer', c, 0, false);
    assert.ok(s.min >= lo, `C${c} min ${s.min} >= ${lo}`);
    assert.ok(s.max <= hi, `C${c} max ${s.max} <= ${hi}`);
  }
});

test('trainer IV mean rises monotonically with city', () => {
  let prev = -1;
  for (let c = 0; c < TRAINER.length; c++) {
    const m = sample('trainer', c, 0, false).mean;
    assert.ok(m >= prev - 0.01, `C${c} mean ${m.toFixed(1)} >= prev ${prev.toFixed(1)}`);
    prev = m;
  }
});

test('difficulty shifts the trainer band up by city-steps', () => {
  // A gym leader (diff 2) at C2 lands in the basic trainer's C4 band.
  const leaderC2 = sample('trainer', 2, 2, false);
  const [lo, hi] = TRAINER[4];
  assert.ok(leaderC2.min >= lo && leaderC2.max <= hi, `leader@C2 ${leaderC2.min}-${leaderC2.max} within C4 ${lo}-${hi}`);
  // And a leader out-rolls a basic at the same city.
  const basicC2 = sample('trainer', 2, 0, false);
  assert.ok(leaderC2.mean > basicC2.mean, `leader ${leaderC2.mean.toFixed(1)} > basic ${basicC2.mean.toFixed(1)} @C2`);
});

test('wild/prof IV band stays within the city curve, floor rises with city', () => {
  for (let c = 0; c < WILDPROF.length; c++) {
    const [lo, hi] = WILDPROF[c];
    const s = sample('wildprof', c, 0, false);
    assert.ok(s.min >= lo, `C${c} min ${s.min} >= ${lo}`);
    assert.ok(s.max <= hi, `C${c} max ${s.max} <= ${hi}`);
  }
});

test('signature ace floors at the band midpoint', () => {
  // Trainer C4 band [15,20] → ace floor at midpoint (~18).
  const ace = sample('trainer', 4, 0, true);
  assert.ok(ace.min >= 17, `ace C4 min ${ace.min} >= 17 (midpoint of 15-20)`);
});

test('trainer difficulty step mapping (basic 0 · gym/elite 1 · leader/rival/E4 2)', () => {
  assert.equal(ST.trainerDifficultyStep('Basic Trainer'), 0);
  assert.equal(ST.trainerDifficultyStep('Gym Trainer 1'), 1);
  assert.equal(ST.trainerDifficultyStep('Gym Trainer 2'), 1);
  assert.equal(ST.trainerDifficultyStep('Elite Trainer'), 1);
  assert.equal(ST.trainerDifficultyStep('Gym Leader 3'), 2);
  assert.equal(ST.trainerDifficultyStep('Rival'), 2);
  assert.equal(ST.trainerDifficultyStep('Champion'), 2);
  assert.equal(ST.trainerDifficultyStep('E1'), 2);
});
