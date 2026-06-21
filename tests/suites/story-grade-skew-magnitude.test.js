// System C (1.6.0) — enemy grade-skew magnitude.
//
// applyStoryProgressToGradeWeights() shifts foe grade weights toward the strongest tier
// as the run progresses. 1.6.0 bumps the bias k: City4–6 phase 0.30→0.42, City6+/league
// phase 0.40→0.55 (+ the post-GL6 ramp). The skew multiplies the EXISTING weight, so a
// grade at 0% stays 0% with no extra code ("if 0% chance, don't change").
//   node --test tests/suites/story-grade-skew-magnitude.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const ST = (await loadEngine()).window.__storyTest;
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg} (got ${a}, want ${b})`);

// Row boundaries (battle.html): AFTER_GL2 = 11, GL4 = 24, GL6 = 38. The post-GL6 ramp
// (+0.0048/row, cap +0.14) only applies on rows STRICTLY past GL6, so row 38 is exactly
// the base GL6 k. Pick interior rows so the test is independent of the exact boundaries.
const ROW_GL4 = 30; // 24 ≤ 30 < 38  → GL4 phase
const ROW_GL6 = 38; // == GL6        → base GL6 k, no ramp

test('GL4 phase (City 4–6) skews g1 by 1+0.42 and g4 by 1-0.42', () => {
  ST.sm.active = true;
  const out = ST.applyStoryProgressToGradeWeights({ g1: 25, g2: 25, g3: 25, g4: 25 }, ROW_GL4);
  near(out.g1, 25 * (1 + 0.42), 'g1 amplified by k=0.42');
  near(out.g2, 25 * (1 + 0.42 * 0.70), 'g2 amplified by 0.7·k');
  near(out.g3, 25 * (1 - 0.42 * 0.40), 'g3 reduced by 0.4·k');
  near(out.g4, 25 * (1 - 0.42), 'g4 reduced by k');
});

test('GL6 phase (City 6+, league) skews g1 by 1+0.55 and g4 by 1-0.55', () => {
  ST.sm.active = true;
  const out = ST.applyStoryProgressToGradeWeights({ g1: 25, g2: 25, g3: 25, g4: 25 }, ROW_GL6);
  near(out.g1, 25 * (1 + 0.55), 'g1 amplified by k=0.55');
  near(out.g4, 25 * (1 - 0.55), 'g4 reduced by k=0.55 (stays positive — 0.45)');
  assert.ok(out.g4 > 0, 'g4 factor stays positive at the strongest skew');
});

test('GL6 phase is a STRONGER skew toward g1 than the GL4 phase', () => {
  ST.sm.active = true;
  const flat = { g1: 25, g2: 25, g3: 25, g4: 25 };
  const gl4 = ST.applyStoryProgressToGradeWeights({ ...flat }, ROW_GL4);
  const gl6 = ST.applyStoryProgressToGradeWeights({ ...flat }, ROW_GL6);
  assert.ok(gl6.g1 > gl4.g1, 'City6+ leans harder into g1 than City4–6');
  assert.ok(gl6.g4 < gl4.g4, 'City6+ suppresses g4 more than City4–6');
});

test('0%-grade preservation: a grade at 0 stays exactly 0 at every phase (no new code)', () => {
  ST.sm.active = true;
  for (const row of [12, ROW_GL4, ROW_GL6, 50]) {
    const out = ST.applyStoryProgressToGradeWeights({ g1: 0, g2: 50, g3: 50, g4: 0 }, row);
    assert.equal(out.g1, 0, `row ${row}: g1 absent → stays 0 (skew never invents a grade)`);
    assert.equal(out.g4, 0, `row ${row}: g4 absent → stays 0`);
  }
});

test('the post-GL6 ramp adds a small per-row increment, capped', () => {
  ST.sm.active = true;
  const flat = { g1: 25, g2: 25, g3: 25, g4: 25 };
  const atGl6 = ST.applyStoryProgressToGradeWeights({ ...flat }, 38).g1; // base 0.55
  const past = ST.applyStoryProgressToGradeWeights({ ...flat }, 48).g1;  // +10 rows of ramp
  assert.ok(past > atGl6, 'further into the post-game, the g1 pressure keeps climbing');
  const farPast = ST.applyStoryProgressToGradeWeights({ ...flat }, 200).g1; // ramp capped
  near(farPast, 25 * (1 + 0.55 + 0.14), 'ramp is capped at +0.14 over the GL6 base');
});
