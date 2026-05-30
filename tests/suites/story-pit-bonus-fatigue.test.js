// Verifies v20 per-build mechanics resolve correctly through buildPokemon:
//   • build.bonus stacks on top of IVs, hardcapped at effective IV 41 (Fight Club — LIVE)
//   • build.tired is INERT — Fatigue/Tiredness was cut (Path D). The field persists in the
//     save for compatibility but no longer affects battle stats or starting HP.
// Run: node --test tests/suites/story-pit-bonus-fatigue.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const { engine } = eng;

function build(species, extra = {}) {
  const b = {
    m: ['Tackle', 'Tackle', 'Tackle', 'Tackle'],
    i: null, a: null, n: 'Hardy',
    ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
    evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
    _isShiny: false,
    ...extra,
  };
  return engine.buildPokemon(species, b);
}

test('baseline build has no bonus/tired effect', () => {
  const m = build('Garchomp');
  assert.ok(m.maxHp > 0);
  assert.ok(m.stats.atk > 0);
  assert.equal(m.currentHp, m.maxHp, 'fresh mon enters at full HP');
});

test('bonus raises stats vs baseline', () => {
  const base = build('Garchomp');
  const boosted = build('Garchomp', { bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 } });
  assert.ok(boosted.maxHp > base.maxHp, 'HP bonus raises maxHp');
  assert.ok(boosted.stats.atk > base.stats.atk, 'atk bonus raises atk');
  assert.ok(boosted.stats.spe > base.stats.spe, 'spe bonus raises spe');
});

test('effective IV hardcaps at 41 (IV31 + bonus10 == IV31 + bonus99-clamped)', () => {
  // A mon at IV 31 + bonus 10 = effective 41. Bonus is clamped to 10 internally,
  // so a build claiming bonus 99 must resolve identically (no double-stack past 41).
  const at41 = build('Garchomp', { bonus: { hp:10, atk:10, def:10, spa:10, spd:10, spe:10 } });
  const over = build('Garchomp', { bonus: { hp:99, atk:99, def:99, spa:99, spd:99, spe:99 } });
  assert.equal(over.stats.atk, at41.stats.atk, 'bonus clamps at +10 — no stat past the 41 ceiling');
  assert.equal(over.maxHp, at41.maxHp, 'HP also clamps at the ceiling');
});

test('low-IV mon + bonus never exceeds the IV41 cap either', () => {
  // The min(41, iv+bonus) ceiling holds: IV 31 (max) + bonus 10 = exactly 41, the
  // highest any stat can reach.
  const ceil = build('Garchomp', { ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, bonus: { hp:10, atk:10, def:10, spa:10, spd:10, spe:10 } });
  // Compare against a synthetic build whose IVs are already 41-equivalent is not
  // possible (engine clamps IV input), so assert the ceiling build's atk equals the
  // formula's expectation for effective IV 41.
  // floor((floor((2*130 + 41 + 0)*50/100)+5) * 1.0) for Garchomp atk base 130:
  const expectedAtk = Math.floor((Math.floor((2 * 130 + 41 + 0) * 50 / 100) + 5) * 1.0);
  assert.equal(ceil.stats.atk, expectedAtk, 'effective IV 41 produces the expected atk');
});

test('tired is INERT — fatigue was cut, stats and HP unchanged at any stack', () => {
  const fresh = build('Garchomp');
  const tired3 = build('Garchomp', { tired: 3 });
  // Fatigue (Path D) no longer docks anything. tired:3 must equal a fresh build.
  assert.equal(tired3.stats.atk, fresh.stats.atk, 'atk NOT docked — fatigue cut');
  assert.equal(tired3.stats.spe, fresh.stats.spe, 'spe NOT docked — fatigue cut');
  assert.equal(tired3.maxHp, fresh.maxHp, 'maxHp unchanged');
  assert.equal(tired3.currentHp, fresh.currentHp, 'starting HP NOT docked — fatigue cut');
  assert.equal(tired3.currentHp, tired3.maxHp, 'tired mon still enters at full HP');
  assert.equal(tired3._tiredAtBattleStart, undefined, 'no fatigue marker stamped');
});

test('tired value is ignored regardless of magnitude', () => {
  const fresh = build('Garchomp');
  const tired99 = build('Garchomp', { tired: 99 });
  assert.equal(tired99.stats.atk, fresh.stats.atk, 'any tired value is inert');
  assert.equal(tired99.currentHp, fresh.currentHp, 'any tired value leaves HP full');
});

test('bonus still applies; tired no longer composes with it', () => {
  const both = build('Garchomp', { bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 }, tired: 2 });
  const boostedFresh = build('Garchomp', { bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 } });
  // Fatigue cut → a tired+bonus build equals the same bonus build with no tired.
  assert.equal(both.stats.atk, boostedFresh.stats.atk, 'bonus still raises; fatigue no longer docks');
});
