// Story difficulty economy + team-quality locks.
//
// Guards the difficulty retune (2026-06): the per-tier economy knobs must stay
// MONOTONIC across difficulty (no inversions, which is what bit us before), and the
// grade-weight transform must skew the foe pool the right direction per tier.
//
// Run: node --test tests/suites/story-difficulty-economy.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__storyTest;

// Difficulty order from gentlest to harshest.
const ORDER = ['veryeasy', 'easy', 'normal', 'hard', 'challenge'];

function withDiff(diff, fn) {
  const prev = E.sm.storyDifficulty;
  E.sm.storyDifficulty = diff;
  try { return fn(); } finally { E.sm.storyDifficulty = prev; }
}

test('foe stat multiplier is strictly increasing with difficulty', () => {
  const mults = ORDER.map(d => E.foeDifficultyMult(d));
  assert.deepEqual(mults, [0.70, 0.85, 1.00, 1.15, 1.40]);
  for (let i = 1; i < mults.length; i++) {
    assert.ok(mults[i] > mults[i - 1], `foe mult must rise: ${ORDER[i-1]}(${mults[i-1]}) -> ${ORDER[i]}(${mults[i]})`);
  }
  assert.equal(E.foeDifficultyMult('normal'), 1.00, 'Normal stays the neutral 1.00 baseline');
});

test('starting-gold bonus is monotonic NON-increasing (no inversion)', () => {
  const bonuses = ORDER.map(d => E.storyStartingGoldBonus(d));
  assert.deepEqual(bonuses, [8000, 4000, 2500, 1000, 0]);
  for (let i = 1; i < bonuses.length; i++) {
    assert.ok(bonuses[i] <= bonuses[i - 1], `start gold must not rise toward harder: ${ORDER[i-1]} -> ${ORDER[i]}`);
  }
  // The two formerly-inverted facts, pinned explicitly:
  assert.ok(E.storyStartingGoldBonus('challenge') < E.storyStartingGoldBonus('hard'),
    'Very Hard must NOT out-gift Hard');
  assert.equal(E.storyStartingGoldBonus('challenge'), 0, 'hardcore Kaizo gets zero head-start');
});

test('coin reward multiplier: gentler pays more, Very Hard is taxed below Hard', () => {
  const mults = ORDER.map(d => withDiff(d, () => E.storyDifficultyCoinMult()));
  assert.deepEqual(mults, [1.60, 1.50, 1.30, 1.00, 0.90]);
  for (let i = 1; i < mults.length; i++) {
    assert.ok(mults[i] <= mults[i - 1], `coin mult must not rise toward harder: ${ORDER[i-1]} -> ${ORDER[i]}`);
  }
  // The formerly-inverted fact (challenge 1.10 > hard 1.00), now fixed:
  assert.ok(withDiff('challenge', () => E.storyDifficultyCoinMult())
          < withDiff('hard', () => E.storyDifficultyCoinMult()),
    'Very Hard must pay LESS than Hard (hardcore tax)');
  assert.equal(withDiff('normal', () => E.storyDifficultyCoinMult()), 1.30, 'Normal coin mult unchanged');
});

test('grade-weight transform: Very Easy skews weaker than Easy; kaizo tiers skew stronger', () => {
  // Even base spread across the four grades so the transform direction is visible.
  const base = () => ({ g1: 100, g2: 100, g3: 100, g4: 100 });
  const share = (o, k) => o[k] / (o.g1 + o.g2 + o.g3 + o.g4);

  const g1Share = (diff) => withDiff(diff, () => share(E.applyDifficultyToGradeWeights(base()), 'g1'));
  const g4Share = (diff) => withDiff(diff, () => share(E.applyDifficultyToGradeWeights(base()), 'g4'));

  // Normal is the untouched baseline reference.
  const normG1 = g1Share('normal');
  const normG4 = g4Share('normal');

  // Very Easy pushes MORE weak (g4) mons and FEWER top-tier (g1) than Easy.
  assert.ok(g4Share('veryeasy') > g4Share('easy'), 'Very Easy must field more g4 than Easy');
  assert.ok(g1Share('veryeasy') < g1Share('easy'), 'Very Easy must field fewer g1 than Easy');
  assert.ok(g1Share('easy') < normG1, 'Easy still leans weaker than Normal on g1');

  // Kaizo tiers push MORE top-tier and FEWER weak than Normal, escalating Hard -> Very Hard.
  assert.ok(g1Share('hard') > normG1, 'Hard fields more g1 than Normal');
  assert.ok(g1Share('challenge') > g1Share('hard'), 'Very Hard fields more g1 than Hard');
  assert.ok(g4Share('challenge') < normG4, 'Very Hard fields fewer g4 than Normal');
});
