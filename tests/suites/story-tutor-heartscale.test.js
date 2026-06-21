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
const bp = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return md ? (md.pow | 0) : 0; };
// Resolve a city at the given tutor stage so tests don't hardcode the threshold cities.
function cityAtTutorStage(stage) {
  for (let c = 0; c <= 12; c++) { if ((ST.npcStageForCity('tutor', c) | 0) === stage) return c; }
  return 0;
}

test('Heart Scale no longer unlocks the full pool at Inner Strength (C0)', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  // Precondition (M1): fail LOUDLY if the learnset is thin — a silent `return` here
  // would let this Bug-B regression test pass vacuously if the offline index failed
  // to load. With data/move-tags.json present, Garchomp always has natural+learnt.
  assert.ok(ls.natural.length && ls.learnt.length,
    'precondition: Garchomp learnset is populated (offline index loaded)');
  // At C0 the per-city BP cap (≤40) applies, so pick a Natural move that is actually
  // teachable there, plus a Learnt (TM) move that must stay hidden until Guru.
  const nat = ls.natural.find(m => bp(m) <= 40) || ls.natural[0];
  const lrn = ls.learnt[0];

  // No scale: Natural-only at Inner (C0).
  primeAtCity(0, 0);
  const noScale = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(noScale.has(nat) && !noScale.has(lrn), 'C0 without scale: Natural(≤40) only, no Learnt');

  // WITH 5 scales held: the staged pool MUST be identical — no bypass.
  primeAtCity(0, 5);
  const withScale = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(withScale.has(nat), 'Inner with scale still shows Natural');
  assert.ok(!withScale.has(lrn), 'Inner with scale must STILL hide Learnt (no bypass)');
  assert.equal(withScale.size, noScale.size, 'holding a Heart Scale does not change the staged pool size');
});

test('Learnt/TM moves unlock at Guru, not Expert (user staging model)', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(ls.learnt.length && ls.awakened.length,
    'precondition: Garchomp has learnt + awakened moves (offline index loaded)');
  const lrn = ls.learnt[0];
  const awk = ls.awakened[0];
  // Expert (L2): ALL Natural, but NO Learnt/TM and NO Awakened yet.
  primeAtCity(cityAtTutorStage(1), 3);
  const expert = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(!expert.has(lrn), 'Expert hides Learnt/TM (it unlocks at Guru)');
  assert.ok(!expert.has(awk), 'Expert hides Awakened');
  // Guru (L3): + Learnt + Awakened (the full pool).
  primeAtCity(cityAtTutorStage(2), 3);
  const guru = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(guru.has(lrn), 'Guru shows Learnt/TM');
  assert.ok(guru.has(awk), 'Guru shows Awakened (full pool)');
});

// T1 (fail-safe): the teachable acceptance set (_txMoveTier1Cache) is filled by the
// async tutor render. If a teach is attempted before it resolves (or after a fetch
// error), the gate must REJECT, never fall open — otherwise an off-stage move could
// be bought during the render window. Below Guru, a cold cache rejects ALL teaches,
// even an in-stage Natural move (the render simply isn't ready yet).
test('T1: a cold move-acceptance cache fails SAFE — no teach slips through', { timeout: 8000 }, async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  const inStage = ls.natural.find(m => bp(m) <= 75 && m !== 'Dragon Claw') || 'Bulldoze';
  primeAtCity(cityAtTutorStage(0), 0); // Inner (tutor stage 0 < 2)
  ST.sm.gold = 99999; // ensure the GATE, not the gold check, is what blocks
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Dragon Claw', 'Swords Dance'] } }];
  // `inStage` is a Natural move ≤75 → normally teachable at Inner. With the acceptance
  // cache cold (async render not resolved / fetch errored), the gate must reject it.
  ST.txClearMoveAcceptance();
  const before = ST.sm.team[0].build.m.slice();
  await eng.window.StoryMode.tutorChangeMove(0, before.length, inStage);
  assert.deepEqual(ST.sm.team[0].build.m, before,
    'cold acceptance cache must reject the teach (fail safe), leaving the moveset unchanged');
});

test('Player per-city cap: Natural moves gate by the city cap (40 → 80 → ∞)', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  // Mid-BP Natural (41–80): hidden at C0 (cap 40), shown at C3 (cap 80).
  const midNat = ls.natural.find(m => bp(m) > 40 && bp(m) <= 80);
  // High-BP Natural (>80): hidden at C3 (cap 80), shown at C5 (cap lifts to ∞).
  const highNat = ls.natural.find(m => bp(m) > 80); // e.g. Outrage (120)
  assert.ok(highNat, 'precondition: Garchomp has a >80-BP Natural move');
  primeAtCity(0, 0); // C0 cap 40
  const c0 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  if (midNat) assert.ok(!c0.has(midNat), `C0 (cap 40) hides ${midNat}`);
  assert.ok(!c0.has(highNat), `C0 (cap 40) hides ${highNat}`);
  primeAtCity(3, 0); // C3 cap 80
  const c3 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  if (midNat) assert.ok(c3.has(midNat), `C3 (cap 80) shows mid-BP ${midNat}`);
  assert.ok(!c3.has(highNat), `C3 (cap 80) still hides ${highNat}`);
  primeAtCity(5, 0); // C5 cap lifts
  const c5 = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(c5.has(highNat), `C5 (cap lifts) shows ${highNat}`);
});

test('Barren-species floor: Beldum still gets a Natural move at Inner', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Beldum');
  assert.ok(ls.natural.length, 'precondition: Beldum has ≥1 Natural move');
  // Beldum's only Natural move is Take Down (90) — over the Inner cap. The floor must
  // still surface it so the picker is never empty for a movepool-barren species.
  primeAtCity(cityAtTutorStage(0), 0);
  const pool = await ST.tutorGetStagedMovePoolAsync('Beldum', []);
  assert.ok(pool.length >= 1, 'Beldum has ≥1 staged move at Inner (floor), not an empty pool');
  const lowestNat = [...ls.natural].sort((a, b) => bp(a) - bp(b))[0];
  assert.ok(pool.includes(lowestNat), `floor surfaces Beldum's lowest-BP Natural (${lowestNat})`);
});
