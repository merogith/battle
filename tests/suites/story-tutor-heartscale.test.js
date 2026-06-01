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
  // Precondition (M1): fail LOUDLY if the learnset is thin — a silent `return` here
  // would let this Bug-B regression test pass vacuously if the offline index failed
  // to load. With data/move-tags.json present, Garchomp always has natural+learnt.
  assert.ok(ls.natural.length && ls.learnt.length,
    'precondition: Garchomp learnset is populated (offline index loaded)');
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
  assert.ok(ls.learnt.length && ls.awakened.length,
    'precondition: Garchomp has learnt + awakened moves (offline index loaded)');
  const lrn = ls.learnt[0];
  const awk = ls.awakened[0];
  primeAtCity(4, 3);
  const pool = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(pool.has(lrn), 'C4 shows Learnt (in-stage — a scale could waive its cost)');
  assert.ok(!pool.has(awk), 'C4 with a scale still hides Awakened (no bypass to Guru tier)');
});

// T1 (fail-safe): the teachable acceptance set (_txMoveTier1Cache) is filled by the
// async tutor render. If a teach is attempted before it resolves (or after a fetch
// error), the gate must REJECT, never fall open — otherwise an off-stage move could
// be bought during the render window. Below Guru, a cold cache rejects ALL teaches,
// even an in-stage Natural move (the render simply isn't ready yet).
test('T1: a cold move-acceptance cache fails SAFE — no teach slips through', { timeout: 8000 }, async () => {
  primeAtCity(0, 0); // C0 = Inner (tutor stage 0 < 2)
  ST.sm.gold = 99999; // ensure the GATE, not the gold check, is what blocks
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Dragon Claw', 'Dragon Tail'] } }];
  // 'Outrage' is a Natural move for Garchomp → normally teachable at C0. With the
  // acceptance cache cold, even this allowed move must be rejected (fail safe).
  ST.txClearMoveAcceptance();
  const before = ST.sm.team[0].build.m.slice();
  await eng.window.StoryMode.tutorChangeMove(0, before.length, 'Outrage');
  assert.deepEqual(ST.sm.team[0].build.m, before,
    'cold acceptance cache must reject the teach (fail safe), leaving the moveset unchanged');
});
