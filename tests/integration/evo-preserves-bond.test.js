import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Verify: evolving a mon does NOT reset its camp-bonding relationship.
// slot.bonds (the per-path counters) and therefore the derived +5% buff
// (relationshipStatMult) must survive the species swap untouched, alongside
// the IV/EV/item/ability/move carry-over the evolve flow already does.

const eng = await loadEngine();
const W = eng.window;
const S = W.__story;
const ST = W.__storyTest;

test('evolution preserves slot.bonds and the derived relationship buff', async () => {
  const sm = S.sm;
  const build = S.makeBuild('Bulbasaur');
  build.n = 'Hardy';                               // neutral nature → flat threshold 5
  build.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  build.evs = { hp: 0, atk: 0, def: 0, spa: 100, spd: 0, spe: 0 };
  // praise mastered (atk path), nurture partway (spa path, not mastered)
  const slot = { name: 'Bulbasaur', id: 'team-1', nickname: 'Bud', build,
                 bonds: { praise: 5, nurture: 2, discipline: 0, intimidate: 0, mimicry: 0, devotion: 0 } };
  sm.team = [slot];
  sm.pcBox = [];

  const before = { ...ST.relationshipStatMult(slot) };
  assert.equal(before.atk, 1.05, 'precondition: praise mastered → atk ×1.05');
  assert.equal(before.spa, 1,    'precondition: nurture not yet mastered → spa ×1');

  const ok = await S.applyEvolution('team-1', 'Ivysaur');
  assert.equal(ok, true, 'evolution succeeds');

  const evolved = sm.team[0];
  assert.equal(evolved.name, 'Ivysaur', 'species changed');
  assert.deepEqual(evolved.bonds, slot.bonds, 'bond counters carried through evolution intact');
  assert.deepEqual({ ...ST.relationshipStatMult(evolved) }, before,
    'the derived +5% relationship buff is identical after evolution');
  assert.equal(evolved.build.ivs.atk, 31, 'IVs carried through');
  assert.equal(evolved.build.evs.spa, 100, 'EVs carried through');
});

test('evolution keeps the held item, including Eviolite (NFE-gated, never illegal)', async () => {
  const sm = S.sm;
  const build = S.makeBuild('Bulbasaur');
  build.i = 'Eviolite';
  sm.team = [{ name: 'Bulbasaur', id: 'team-evi', build }];
  sm.pcBox = [];

  const ok = await S.applyEvolution('team-evi', 'Ivysaur');
  assert.equal(ok, true, 'evolution succeeds');
  assert.equal(sm.team[0].build.i, 'Eviolite',
    'held item carries through evolution unchanged (Eviolite no longer stripped)');
});
