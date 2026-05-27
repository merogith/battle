// Verifies the wild + professor grade curves (story build sheets, Phase 1d-i).
// Both are explicit per-city tables. Wild stays catch-and-train (G4-heavy, G2
// tail opens C5); professor rides the same weak-early curve (pure G4 at C0).
// The trainer grade merge is covered separately.
// Run: node --test tests/suites/story-build-curve-grade.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const sumW = (gw) => (gw.g1 | 0) + (gw.g2 | 0) + (gw.g3 | 0) + (gw.g4 | 0);

// Spec tables (Sheet 5).
const WILD = [
  { g3: 0, g4: 100 }, { g3: 0, g4: 100 }, { g3: 0, g4: 100 },
  { g3: 10, g4: 90 }, { g3: 20, g4: 80 },
  { g2: 10, g3: 30, g4: 60 }, { g2: 15, g3: 40, g4: 45 }, { g2: 20, g3: 50, g4: 30 },
];
const PROF = [
  { g4: 100 }, { g3: 20, g4: 80 }, { g3: 40, g4: 60 }, { g3: 60, g4: 40 },
  { g2: 20, g3: 60, g4: 20 }, { g2: 50, g3: 50 }, { g2: 70, g3: 30 },
];

test('wild grade matches the Sheet 5 city table exactly', () => {
  for (let c = 0; c < WILD.length; c++) {
    const gw = ST.wildGradeWeightsForCity(c);
    for (const g of ['g1', 'g2', 'g3', 'g4']) {
      assert.equal(gw[g] | 0, WILD[c][g] | 0, `wild C${c} ${g}`);
    }
    assert.equal(sumW(gw), 100, `wild C${c} sums to 100`);
  }
});

test('wild stays G4-heavy: pure G4 through C2, G2 tail only from C5', () => {
  for (let c = 0; c <= 2; c++) assert.equal(ST.wildGradeWeightsForCity(c).g4, 100, `C${c} pure G4`);
  for (let c = 0; c <= 4; c++) assert.equal(ST.wildGradeWeightsForCity(c).g2 | 0, 0, `C${c} no G2`);
  assert.ok(ST.wildGradeWeightsForCity(5).g2 > 0, 'C5 opens the G2 tail');
  // G1 never appears on routes (Safari is the dedicated G1 path).
  for (let c = 0; c < WILD.length; c++) assert.equal(ST.wildGradeWeightsForCity(c).g1 | 0, 0, `C${c} no G1`);
});

test('professor grade matches the Sheet 5 city table (C0-C6)', () => {
  const ROLLS = ST.PROF_ROLLS;
  for (let c = 0; c < PROF.length; c++) {
    for (const g of ['g1', 'g2', 'g3', 'g4']) {
      assert.equal(ROLLS[c][g] | 0, PROF[c][g] | 0, `prof C${c} ${g}`);
    }
    assert.equal(sumW(ROLLS[c]), 100, `prof C${c} sums to 100`);
  }
});

test('professor C0 is pure G4 and the G2 tail opens at C4', () => {
  const R = ST.PROF_ROLLS;
  assert.equal(R[0].g4, 100, 'C0 pure G4');
  assert.equal(R[3].g2 | 0, 0, 'C3 no G2');
  assert.ok(R[4].g2 > 0, 'C4 opens G2');
  assert.ok(R[6].g2 > R[4].g2, 'G2 share grows C4 -> C6');
});

test('both curves monotonically strengthen with city (G4 share falls)', () => {
  let pw = 101;
  for (let c = 0; c < WILD.length; c++) { const v = ST.wildGradeWeightsForCity(c).g4 | 0; assert.ok(v <= pw, `wild G4 C${c} ${v} <= ${pw}`); pw = v; }
  let pp = 101;
  for (let c = 0; c < PROF.length; c++) { const v = ST.PROF_ROLLS[c].g4 | 0; assert.ok(v <= pp, `prof G4 C${c} ${v} <= ${pp}`); pp = v; }
});
