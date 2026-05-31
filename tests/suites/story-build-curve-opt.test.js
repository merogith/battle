// Verifies the optimization gradients (story build sheets, Phase 1e):
// city sets the parity ceiling (what's available), difficulty sets how often a
// trainer applies it. Probabilities of keeping the OPTIMIZED nature/ability/moves.
// Run: node --test tests/suites/story-build-curve-opt.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

test('nature opt: neutral C0-1, ramps C2-4, all-best C5+', () => {
  assert.equal(ST.storyNatureOptChance(0, 0), 0, 'C0 neutral');
  assert.equal(ST.storyNatureOptChance(1, 0), 0, 'C1 neutral');
  assert.ok(ST.storyNatureOptChance(2, 0) > 0 && ST.storyNatureOptChance(2, 0) < 1, 'C2 partial');
  assert.ok(ST.storyNatureOptChance(3, 0) > ST.storyNatureOptChance(2, 0), 'C3 > C2');
  assert.equal(ST.storyNatureOptChance(5, 0), 1, 'C5 all-best');
  assert.equal(ST.storyNatureOptChance(8, 0), 1, 'late all-best');
});

test('ability opt: no-opt C0-2, ramps C3-5, optimized C6+', () => {
  for (const c of [0, 1, 2]) assert.equal(ST.storyAbilityOptChance(c, 0), 0, `C${c} no-opt`);
  assert.ok(ST.storyAbilityOptChance(3, 0) > 0 && ST.storyAbilityOptChance(3, 0) < 1, 'C3 partial');
  assert.ok(ST.storyAbilityOptChance(4, 0) > ST.storyAbilityOptChance(3, 0), 'C4 > C3');
  assert.equal(ST.storyAbilityOptChance(6, 0), 1, 'C6 optimized');
});

test('move opt: L1 C0-3, some L2 C4-5, full C6+', () => {
  for (const c of [0, 1, 2, 3]) assert.equal(ST.storyMoveOptChance(c, 0), 0, `C${c} L1`);
  assert.ok(ST.storyMoveOptChance(4, 0) > 0 && ST.storyMoveOptChance(4, 0) < 1, 'C4 some L2');
  assert.ok(ST.storyMoveOptChance(5, 0) > ST.storyMoveOptChance(4, 0), 'C5 > C4');
  assert.equal(ST.storyMoveOptChance(6, 0), 1, 'C6 full');
});

test('difficulty raises the apply-probability at the same city', () => {
  // At a mid city, a leader (diff 2) optimizes more often than a basic (diff 0).
  assert.ok(ST.storyNatureOptChance(3, 2) > ST.storyNatureOptChance(3, 0), 'nature: leader > basic @C3');
  assert.ok(ST.storyAbilityOptChance(4, 2) > ST.storyAbilityOptChance(4, 0), 'ability: leader > basic @C4');
  assert.ok(ST.storyMoveOptChance(5, 2) > ST.storyMoveOptChance(5, 0), 'moves: leader > basic @C5');
  // Probabilities never exceed 1.
  for (const c of [5, 6, 7, 8]) assert.ok(ST.storyNatureOptChance(c, 2) <= 1, `clamped <=1 @C${c}`);
});

test('foe item tier = parity Dojo clock (Phase 3: foe never leads the player)', () => {
  // Aligned to the player's Battle-Dojo clock (NPC_STAGE_CITY.dojo=[2,5,8]):
  // none C0-1 · berries C2-4 (White Belt) · staples C5-7 (Black Belt) · best C8-9
  // (Grandmaster). Previously each tier opened ONE city early for foes.
  for (const c of [0, 1]) assert.equal(ST.storyFoeItemTier(c), 0, `C${c} none (Dojo not open)`);
  for (const c of [2, 3, 4]) assert.equal(ST.storyFoeItemTier(c), 1, `C${c} berries (White Belt)`);
  for (const c of [5, 6, 7]) assert.equal(ST.storyFoeItemTier(c), 2, `C${c} staples (Black Belt)`);
  for (const c of [8, 9]) assert.equal(ST.storyFoeItemTier(c), 3, `C${c} best (Grandmaster)`);
  assert.equal(ST.storyFoeItemTier(-1), 3, 'frontier/generator = full');
});

test('all opt gradients are monotonic non-decreasing with city', () => {
  for (const fn of ['storyNatureOptChance', 'storyAbilityOptChance', 'storyMoveOptChance']) {
    let prev = -1;
    for (let c = 0; c <= 9; c++) { const v = ST[fn](c, 0); assert.ok(v >= prev - 1e-9, `${fn} C${c} ${v} >= ${prev}`); prev = v; }
  }
});
