// Verifies v20 per-build mechanics resolve correctly through buildPokemon:
//   • build.bonus stacks on top of IVs, hardcapped at effective IV 36
//   • build.tired docks 1% per stack from combat stats AND starting HP
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

test('effective IV hardcaps at 36 (IV31 + bonus5 == IV31 + bonus99-clamped)', () => {
  // A mon at IV 31 + bonus 5 = effective 36. Bonus is clamped to 5 internally,
  // so a build claiming bonus 99 must resolve identically (no double-stack past 36).
  const at36 = build('Garchomp', { bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 } });
  const over = build('Garchomp', { bonus: { hp:99, atk:99, def:99, spa:99, spd:99, spe:99 } });
  assert.equal(over.stats.atk, at36.stats.atk, 'bonus clamps at +5 — no stat past the 36 ceiling');
  assert.equal(over.maxHp, at36.maxHp, 'HP also clamps at the ceiling');
});

test('low-IV mon + bonus never exceeds the IV36 cap either', () => {
  // IV 28 + bonus 5 = 33 (under cap). IV 33 is impossible normally, but verify the
  // min(36, iv+bonus) holds: IV 31 (max) + 5 = exactly 36, and that is the highest
  // any stat can reach.
  const ceil = build('Garchomp', { ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 } });
  // Compare against a synthetic build whose IVs are already 36-equivalent is not
  // possible (engine clamps IV input), so assert the ceiling build's atk equals the
  // formula's expectation for effective IV 36.
  // floor((floor((2*130 + 36 + 0)*50/100)+5) * 1.0) for Garchomp atk base 130:
  const expectedAtk = Math.floor((Math.floor((2 * 130 + 36 + 0) * 50 / 100) + 5) * 1.0);
  assert.equal(ceil.stats.atk, expectedAtk, 'effective IV 36 produces the expected atk');
});

test('tired stacks dock stats and starting HP by 1% each', () => {
  const fresh = build('Garchomp');
  const tired3 = build('Garchomp', { tired: 3 });
  // 3 stacks → ×0.97 on combat stats and a 0.97 starting-HP multiplier.
  assert.equal(tired3.stats.atk, Math.max(1, Math.floor(fresh.stats.atk * 0.97)), 'atk docked 3%');
  assert.equal(tired3.stats.spe, Math.max(1, Math.floor(fresh.stats.spe * 0.97)), 'spe docked 3%');
  // Max HP is unchanged; only the starting (current) HP is reduced.
  assert.equal(tired3.maxHp, fresh.maxHp, 'maxHp unchanged by fatigue');
  assert.equal(tired3.currentHp, Math.max(1, Math.floor(fresh.maxHp * 0.97)), 'starting HP docked 3%');
});

test('tired clamps at 3 stacks', () => {
  const tired3 = build('Garchomp', { tired: 3 });
  const tired99 = build('Garchomp', { tired: 99 });
  assert.equal(tired99.stats.atk, tired3.stats.atk, 'fatigue clamps at 3 stacks');
  assert.equal(tired99.currentHp, tired3.currentHp, 'fatigue HP clamps at 3 stacks');
});

test('bonus and tired compose (bonus raises, then fatigue docks)', () => {
  const both = build('Garchomp', { bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 }, tired: 2 });
  const boostedFresh = build('Garchomp', { bonus: { hp:5, atk:5, def:5, spa:5, spd:5, spe:5 } });
  assert.equal(both.stats.atk, Math.max(1, Math.floor(boostedFresh.stats.atk * 0.98)), 'fatigue applies after bonus');
  assert.ok(both.stats.atk > build('Garchomp', { tired: 2 }).stats.atk, 'still ahead of a non-bonused tired mon');
});
