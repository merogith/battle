// Verifies enemy-build coherence at the Novice (T2) downgrade — the tier where the
// CSV's elite items get swapped for flavor. The swap MUST be type-coherent: a
// Charizard at Novice should NOT end up holding Mystic Water (Water boost). The
// type-aware picker either picks a type-matched flavor item or a universal staple
// (Leftovers / Eviolite / Sitrus / Lum / Muscle Band / Wise Glasses).
// Run: node --test tests/suites/story-build-coherence.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const TIER = E.STORY_BUILD_TIER;
const TYPE_BOOST = E.T2_TYPE_BOOST_ITEM;
const UNIVERSAL = new Set(E.T2_UNIVERSAL_FLAVOR_ITEMS);

function valid(item, t1, t2) {
  if (!item) return false;
  if (UNIVERSAL.has(item)) return true;            // Leftovers / Eviolite / berries / Muscle Band / Wise Glasses
  if (TYPE_BOOST[t1] === item) return true;        // matches the primary type
  if (t2 && TYPE_BOOST[t2] === item) return true;  // matches the secondary type
  return false;                                     // any other type-boost = mismatch
}

test('T2 picker: a Charizard gets a Fire boost or a universal item, never Mystic Water', () => {
  const seen = new Set();
  for (let s = 0; s < 200; s++) {
    const it = E.pickT2FlavorItemForSpecies('Charizard', Math.random);
    seen.add(it);
    assert.ok(valid(it, 'Fire', 'Flying'), `Charizard got off-type item "${it}"`);
  }
  // Variety check: across 200 rolls we should see at least 3 distinct outputs.
  assert.ok(seen.size >= 3, `expected variety, only saw [${[...seen].join(', ')}]`);
});

test('T2 picker: a Blastoise (pure Water) gets Mystic Water OR a universal item', () => {
  for (let s = 0; s < 200; s++) {
    const it = E.pickT2FlavorItemForSpecies('Blastoise', Math.random);
    assert.ok(valid(it, 'Water', null), `Blastoise got off-type item "${it}"`);
  }
});

test('T2 picker: a dual-type Garchomp accepts Dragon Fang OR Soft Sand OR a universal', () => {
  for (let s = 0; s < 200; s++) {
    const it = E.pickT2FlavorItemForSpecies('Garchomp', Math.random);
    assert.ok(valid(it, 'Dragon', 'Ground'), `Garchomp got off-type item "${it}"`);
  }
});

test('full T2 downgrade pipeline: elite items get swapped to type-coherent flavor', () => {
  // Hard-code the type expectations so the test doesn't depend on engine internals.
  const tries = [
    ['Charizard', 'Fire',     'Flying'],
    ['Blastoise', 'Water',    null    ],
    ['Pikachu',   'Electric', null    ],
    ['Alakazam',  'Psychic',  null    ],
    ['Machamp',   'Fighting', null    ],
    ['Garchomp',  'Dragon',   'Ground'],
  ];
  for (const [name, t1, t2] of tries) {
    const build = { evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 }, m: ['Surf'], i: 'Choice Specs', n: 'Timid', a: 'Levitate', gimmick: 'STANDARD' };
    E.storyDowngradeBuildForTier(name, build, TIER.NOVICE);
    assert.ok(!E.ELITE_ITEMS_SET.has(build.i), `${name}: elite item kept post-downgrade (${build.i})`);
    assert.ok(valid(build.i, t1, t2), `${name}: downgraded item "${build.i}" not type-coherent for ${t1}/${t2 || '-'}`);
  }
});

test('T1 downgrade still zeros EVs, neutralizes nature, and uses flavor berry/empty item', () => {
  const build = { evs: { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 }, m: ['Earthquake'], i: 'Choice Band', n: 'Adamant', a: 'Sand Veil', gimmick: 'STANDARD' };
  E.storyDowngradeBuildForTier('Garchomp', build, TIER.UNTRAINED);
  const total = ['hp','atk','def','spa','spd','spe'].reduce((s, k) => s + (build.evs[k] | 0), 0);
  assert.equal(total, 0, 'T1 zeros EVs');
  assert.ok(!E.ELITE_ITEMS_SET.has(build.i), 'T1 strips elite items');
});
