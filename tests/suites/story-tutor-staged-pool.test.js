// 3-stage Move Tutor (user model, tutor:[0,2,5]) — Inner Strength (Natural ≤75) at
// C0-C1, Unleashed (ALL Natural, no TMs) at C2-C4, Guru (+Learnt +Awakened) at C5+. Verifies:
//   • the staged pool's contents grow as the tutor levels up,
//   • _moveCostForStage by-tag returns 1000 / 2500 / 5000 per Natural / Learnt /
//     Awakened (independent of tutor stage), and matches the no-arg legacy
//     behavior (stage's CEILING) so existing UI text stays consistent.
//   • npcStageName('tutor', s) returns Inner Strength / Unleashed / Guru.
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
const bp = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return md ? (md.pow | 0) : 0; };
function cityAtTutorStage(stage) {
  for (let c = 0; c <= 12; c++) { if ((ST.npcStageForCity('tutor', c) | 0) === stage) return c; }
  return 0;
}

test('Move Tutor: 3 stages — Inner Strength → Unleashed → Guru', () => {
  assert.equal(ST.npcStageName('tutor', 0), 'Inner Strength');
  assert.equal(ST.npcStageName('tutor', 1), 'Unleashed');
  assert.equal(ST.npcStageName('tutor', 2), 'Guru');
  // Thresholds tutor:[0,2,5] — Inner C0-1, Unleashed C2-4, Guru C5+.
  assert.equal(ST.npcStageForCity('tutor', 0), 0);
  assert.equal(ST.npcStageForCity('tutor', 1), 0);
  assert.equal(ST.npcStageForCity('tutor', 2), 1);
  assert.equal(ST.npcStageForCity('tutor', 4), 1);
  assert.equal(ST.npcStageForCity('tutor', 5), 2);
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
  assert.equal(ST.moveCostForStage(), 2500, 'C4: Unleashed ceiling = 2500');
  primeAtCity(7);
  assert.equal(ST.moveCostForStage(), 5000, 'C7: Guru ceiling = 5000');
});

test('staged pool: Inner→Unleashed→Guru unlock ladder (user model) end-to-end', async () => {
  // Warm the cache for Garchomp + verify the ACTUAL gating function (not a helper).
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(ls.natural.length && ls.learnt.length && ls.awakened.length, 'precondition: all buckets populated (offline index)');
  const nat = ls.natural.find(m => bp(m) <= 75) || ls.natural[0]; // Inner-teachable Natural (≤75)
  const lrn = ls.learnt[0];
  const awk = ls.awakened[0];
  // L1 Inner Strength: Natural ≤75 only — no Learnt, no Awakened. Pre-fix bug: syncMoves
  // was unioned unconditionally, so any Smogon Learnt move slipped through. This pins the
  // actual function — if syncMoves leaks again (or the BP cap regresses), it fails.
  primeAtCity(cityAtTutorStage(0));
  const poolL1 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(poolL1.has(nat), `L1 includes a ≤75 Natural "${nat}"`);
  assert.ok(!poolL1.has(lrn), `L1 must NOT include Learnt "${lrn}"`);
  assert.ok(!poolL1.has(awk), `L1 must NOT include Awakened "${awk}"`);
  // L2 Unleashed: ALL Natural, but still NO Learnt/TM and NO Awakened (TMs wait for Guru).
  primeAtCity(cityAtTutorStage(1));
  const poolL2 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(poolL2.has(nat), 'L2 includes Natural');
  assert.ok(!poolL2.has(lrn), 'L2 still blocks Learnt/TM (unlocks at Guru)');
  assert.ok(!poolL2.has(awk), 'L2 still blocks Awakened');
  // L3 Guru: everything.
  primeAtCity(cityAtTutorStage(2));
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
