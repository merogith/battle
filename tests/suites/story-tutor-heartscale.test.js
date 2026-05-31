// Phase 2 (BUG B fix): a Heart Scale is a FREE-TEACH voucher, not a gate bypass.
// Pre-fix, _tutorGetStagedMovePoolAsync returned the FULL pool the instant a scale
// was held (and the first tutor visit at C0 grants one), collapsing the 3-stage
// ladder. Now the staged pool is the same whether or not a scale is held — the
// scale only waives the gold cost of an IN-stage teach.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

function primeAtCity(city, scales) {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm.badges = 0;
  ST.sm.inventory = Object.assign(ST.sm.inventory || {}, { heartScale: scales | 0 });
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === city) { idx = ei; break; }
  }
  ST.sm.eventIndex = idx;
}

test('Heart Scale no longer unlocks the full pool at Inner Strength (C0)', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  if (!ls.natural.length || !ls.learnt.length) return; // thin-dex guard
  const nat = ls.natural[0];
  const lrn = ls.learnt[0];

  // No scale: Natural-only at C0.
  primeAtCity(0, 0);
  const noScale = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(noScale.has(nat) && !noScale.has(lrn), 'C0 without scale: Natural only');

  // WITH 5 scales held: the staged pool MUST be identical — no bypass.
  primeAtCity(0, 5);
  const withScale = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(withScale.has(nat), 'C0 with scale still shows Natural');
  assert.ok(!withScale.has(lrn), 'C0 with scale must STILL hide Learnt (no bypass)');
  assert.equal(withScale.size, noScale.size, 'holding a Heart Scale does not change the staged pool size');
});

test('Heart Scale within stage: Expert (C4) shows Learnt with or without a scale', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  if (!ls.learnt.length || !ls.awakened.length) return;
  const lrn = ls.learnt[0];
  const awk = ls.awakened[0];
  primeAtCity(4, 3);
  const pool = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(pool.has(lrn), 'C4 shows Learnt (in-stage — a scale could waive its cost)');
  assert.ok(!pool.has(awk), 'C4 with a scale still hides Awakened (no bypass to Guru tier)');
});
