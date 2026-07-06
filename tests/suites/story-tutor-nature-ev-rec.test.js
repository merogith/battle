// Role-anchored nature + EV-spread recommendations (Feature 3).
//
// The best-fit archetype (deterministic, highest-weight eligible) drives:
//   • the top "Recommended" nature in the Nature Rater, matching the role chip
//   • the "Recommended · <role>" spread card in the EV Trainer
// Both reuse the same _txBestArchetypeFor basis as the Fast-Build, so a mon's
// surfaced role, recommended nature, and recommended EVs always agree.
//
//   node --test tests/suites/story-tutor-nature-ev-rec.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

const has = (n) => ST.baseStats && ST.baseStats[n];
const PHYS_FAST = ['Garchomp', 'Dragapult', 'Weavile'].find(has); // physical, fast → sweeper-ish
const SPEC = ['Alakazam', 'Gengar', 'Chandelure'].find(has);      // special attacker

test('best-fit archetype: physical fast mon → physical nature + offense/speed EVs', () => {
  assert.ok(PHYS_FAST, 'have a physical-fast fixture');
  const ba = w._txBestArchetypeFor(PHYS_FAST, null);
  assert.ok(ba && ba.archetype, 'an archetype was chosen');
  assert.equal(ba.physical, true, 'classified physical');
  // physical natures raise Atk
  const mods = ST.natureModifiers();
  assert.equal(mods[ba.nature] && mods[ba.nature].up, 'atk', `${ba.nature} raises Atk`);
  // max_offense_speed spread → 252 Atk, 252 Spe
  assert.equal(ba.evs.atk, 252, 'Atk maxed');
  assert.equal(ba.evs.spe, 252, 'Spe maxed');
});

test('best-fit archetype is deterministic (same answer twice)', () => {
  const a = w._txBestArchetypeFor(PHYS_FAST, null);
  const b = w._txBestArchetypeFor(PHYS_FAST, null);
  assert.equal(a.nature, b.nature);
  assert.equal(a.evShape, b.evShape);
});

test('special attacker gets a special nature (raises SpA, not Atk)', () => {
  assert.ok(SPEC, 'have a special fixture');
  const ba = w._txBestArchetypeFor(SPEC, null);
  const mods = ST.natureModifiers();
  assert.equal(mods[ba.nature] && mods[ba.nature].up, 'spa', `${ba.nature} raises SpA`);
});

test('Nature Rater surfaces the role-anchored nature FIRST as "Recommended"', () => {
  const mon = { type1: 'Dragon', type2: 'Ground', stats: { atk: 130, def: 95, spa: 80, spd: 85, spe: 102 } };
  const build = { m: [], n: 'Hardy', a: 'Rough Skin' }; // Hardy = neutral, so a rec exists
  const nats = Object.keys(ST.natureModifiers());
  const recs = ST.txNatureRecsByPurpose(nats, mon, build, PHYS_FAST);
  assert.ok(recs.length, 'nature recs returned');
  assert.equal(recs[0].purpose, 'Recommended', 'first rec is the role-anchored one');
  const ba = w._txBestArchetypeFor(PHYS_FAST, mon);
  assert.equal(recs[0].nature, ba.nature, 'recommended nature matches the best-fit archetype');
});

test('EV Trainer recommended preset carries the role label + archetype spread', () => {
  const preset = w._evTrainerRecPreset(PHYS_FAST);
  assert.ok(preset && preset.id === 'rec-role', 'a recommended preset exists');
  assert.match(preset.label, /Recommended/, 'labelled Recommended');
  const ba = w._txBestArchetypeFor(PHYS_FAST, null);
  assert.deepEqual(
    { hp: preset.evs.hp | 0, atk: preset.evs.atk | 0, def: preset.evs.def | 0, spa: preset.evs.spa | 0, spd: preset.evs.spd | 0, spe: preset.evs.spe | 0 },
    { hp: ba.evs.hp | 0, atk: ba.evs.atk | 0, def: ba.evs.def | 0, spa: ba.evs.spa | 0, spd: ba.evs.spd | 0, spe: ba.evs.spe | 0 },
    'preset spread == archetype spread',
  );
});
