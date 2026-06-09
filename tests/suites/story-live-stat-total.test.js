// Locks _storyLiveStatTotal (the read-only roster-card stat sum) 1:1 to the engine's
// canonical buildPokemon stat math. The helper deliberately re-expresses the Lv50
// formula WITHOUT mutating the build or constructing moves/ability (so it's cheap to
// call per-card across a 30-mon PC box) — this suite is the guard that the two never
// drift: for a spread of builds, _storyLiveStatTotal(slot) must equal the sum of
// buildPokemon(name, build).maxHp + .stats.* . If a future edit to buildPokemon's
// formula isn't mirrored into the helper, these fail.
//
// Run: node --test tests/suites/story-live-stat-total.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.engine;
const liveTotal = E._storyLiveStatTotal;
const buildPokemon = E.buildPokemon;

const clone = (o) => JSON.parse(JSON.stringify(o));
const sumBuilt = (mon) => mon.maxHp + mon.stats.atk + mon.stats.def + mon.stats.spa + mon.stats.spd + mon.stats.spe;

// Varied IV/EV/nature/bonus/expShareLevels + the Shedinja HP=1 case + an EV over-cap
// (>510) case that exercises the rescale path. Each must match buildPokemon exactly.
const CASES = [
  { name: 'Garchomp',  build: { m: ['Earthquake'], n: 'Jolly',   a: 'Rough Skin',   i: 'Life Orb', ivs: { hp:31,atk:31,def:31,spa:31,spd:31,spe:31 }, evs: { hp:0,atk:252,def:0,spa:0,spd:4,spe:252 } } },
  { name: 'Eevee',     build: { m: ['Tackle'],     n: 'Hardy',    a: 'Adaptability', ivs: { hp:20,atk:15,def:10,spa:5,spd:0,spe:31 }, evs: {} } },
  { name: 'Blissey',   build: { m: ['Tackle'],     n: 'Bold',     ivs: {}, evs: { hp:252,def:252,spd:4 } } },
  { name: 'Shedinja',  build: { m: ['Tackle'],     n: 'Adamant',  ivs: {}, evs: { atk:252,spe:252 } } },
  { name: 'Pikachu',   build: { m: ['Tackle'],     n: 'Timid',    ivs: { hp:25,atk:0,def:0,spa:31,spd:0,spe:31 }, evs: { spa:252,spe:252 }, bonus: { hp:10,atk:0,def:0,spa:10,spd:0,spe:10 }, expShareLevels: 3 } },
  { name: 'Snorlax',   build: { m: ['Tackle'],     n: 'Careful',  ivs: {}, evs: { hp:252,atk:252,def:252,spa:252,spd:252,spe:252 } } },
];

test('_storyLiveStatTotal export exists', () => {
  assert.equal(typeof liveTotal, 'function', '__engine._storyLiveStatTotal must be exposed');
});

for (const c of CASES) {
  test(`live total matches buildPokemon sum — ${c.name}`, () => {
    const slot = { name: c.name, build: clone(c.build) };
    const built = buildPokemon(c.name, clone(c.build));
    assert.equal(liveTotal(slot), sumBuilt(built), `${c.name}: helper must equal buildPokemon`);
  });
}

test('eggs / unknown species / null → 0', () => {
  assert.equal(liveTotal({ isEgg: true, name: 'Garchomp' }), 0);
  assert.equal(liveTotal({ name: 'NotARealMon___', build: {} }), 0);
  assert.equal(liveTotal(null), 0);
  assert.equal(liveTotal({}), 0);
});

test('read-only — does not mutate the slot build (no EV clamp / move pad)', () => {
  const build = { m: ['Earthquake'], n: 'Jolly', ivs: { hp:31,atk:31,def:31,spa:31,spd:31,spe:31 }, evs: { atk: 300 } };
  const slot = { name: 'Garchomp', build };
  const before = JSON.stringify(build);
  liveTotal(slot);
  assert.equal(JSON.stringify(build), before, 'helper must not mutate build.evs / build.m');
});
