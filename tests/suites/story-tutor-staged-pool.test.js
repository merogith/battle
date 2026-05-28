// Phase 4.2: 3-stage Move Tutor — Inner Strength (Natural only) at C0-C3, Expert
// (+Learnt) at C4-C6, Guru (+Awakened) at C7+. Verifies:
//   • the staged pool's contents grow as the tutor levels up,
//   • _moveCostForStage by-tag returns 1000 / 2500 / 5000 per Natural / Learnt /
//     Awakened (independent of tutor stage), and matches the no-arg legacy
//     behavior (stage's CEILING) so existing UI text stays consistent.
//   • npcStageName('tutor', s) returns Inner Strength / Expert / Guru.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

function primeAtCity(city) {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm.badges = 0;
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === city) { idx = ei; break; }
  }
  ST.sm.eventIndex = idx;
}

test('Move Tutor: 3 stages — Inner Strength → Expert → Guru', () => {
  assert.equal(ST.npcStageName('tutor', 0), 'Inner Strength');
  assert.equal(ST.npcStageName('tutor', 1), 'Expert');
  assert.equal(ST.npcStageName('tutor', 2), 'Guru');
  // Thresholds: C0 stage 0, C4 stage 1, C7 stage 2.
  assert.equal(ST.npcStageForCity('tutor', 0), 0);
  assert.equal(ST.npcStageForCity('tutor', 3), 0);
  assert.equal(ST.npcStageForCity('tutor', 4), 1);
  assert.equal(ST.npcStageForCity('tutor', 6), 1);
  assert.equal(ST.npcStageForCity('tutor', 7), 2);
});

test('_moveCostForStage by tag — Natural 1000 / Learnt 2500 / Awakened 5000', () => {
  assert.equal(ST.moveCostForStage('natural'),  1000, 'Natural always 1000G regardless of tutor stage');
  assert.equal(ST.moveCostForStage('learnt'),   2500, 'Learnt always 2500G');
  assert.equal(ST.moveCostForStage('awakened'), 5000, 'Awakened always 5000G');
});

test('_moveCostForStage no-arg returns the tutor stage ceiling for that city', () => {
  primeAtCity(0);
  assert.equal(ST.moveCostForStage(), 1000, 'C0: Inner Strength ceiling = 1000');
  primeAtCity(4);
  assert.equal(ST.moveCostForStage(), 2500, 'C4: Expert ceiling = 2500');
  primeAtCity(7);
  assert.equal(ST.moveCostForStage(), 5000, 'C7: Guru ceiling = 5000');
});

test('staged pool: L1 Inner Strength rejects Learnt + Awakened moves end-to-end', async () => {
  // Warm the cache for Garchomp + verify the ACTUAL gating function (not a helper).
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  if (!ls.natural.length || !ls.learnt.length || !ls.awakened.length) {
    // jsdom thin-dex case — nothing to assert.
    return;
  }
  const nat = ls.natural[0];
  const lrn = ls.learnt[0];
  const awk = ls.awakened[0];
  // L1 Inner Strength (C0): only Natural in the pool. Pre-fix bug: syncMoves was
  // unioned unconditionally, so any Smogon Learnt move slipped through. The
  // regression test pins the actual function — if syncMoves leaks again, this fails.
  primeAtCity(0);
  const poolL1 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(poolL1.has(nat), `L1 pool includes Natural "${nat}"`);
  assert.ok(!poolL1.has(lrn), `L1 pool must NOT include Learnt "${lrn}"`);
  assert.ok(!poolL1.has(awk), `L1 pool must NOT include Awakened "${awk}"`);
  // L2 Expert (C4): Natural + Learnt; Awakened still blocked.
  primeAtCity(4);
  const poolL2 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(poolL2.has(nat), 'L2 includes Natural');
  assert.ok(poolL2.has(lrn), 'L2 includes Learnt');
  assert.ok(!poolL2.has(awk), 'L2 still blocks Awakened');
  // L3 Guru (C7): everything.
  primeAtCity(7);
  const poolL3 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(poolL3.has(nat) && poolL3.has(lrn) && poolL3.has(awk), 'L3 unlocks all three tags');
});

test('staged pool: currentMoves stay teachable even when tagged above the current stage', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  if (!ls.awakened.length) return;
  const awk = ls.awakened[0];
  // At L1 the awakened move is NORMALLY blocked, but it must remain selectable when
  // it's already equipped (the player can't have a move stripped at a tutor visit).
  primeAtCity(0);
  const poolL1WithEquipped = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', [awk]));
  assert.ok(poolL1WithEquipped.has(awk), 'equipped Awakened move stays selectable at L1');
});
