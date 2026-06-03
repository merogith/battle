// Guards the species-grade override cleanup (mid-2026). Four invariants:
//   1. G1 is the legendary / pseudo-legendary tier ONLY — no non-legendary reaches G1,
//      even when @pkmn/dex is stubbed (this harness) or mid-load. (baseStats.legendary +
//      capped non-legendary branches in _computeMonGrade.)
//   2. 3-stage lines ladder G4 -> G3 -> G2 (middle G3, final G2) so evolving lifts grade.
//   3. G2 overrides are item-independent (always-on ability) + curated exceptions; the
//      retired Eviolite / weather / pre-evo / gimmick promotions now grade naturally.
//   4. High-BST non-legendary finals (Lapras, Snorlax, Slaking, Charizard, …) land at G2,
//      never G1 — the old BST>=530 fallback leak is closed.
// See _GRADE1_OVERRIDE / _GRADE2_OVERRIDE / _computeMonGrade in battle.html.
// NOTE: the harness stubs the dex (species.get -> null), so getMonGrade here runs the
// BST-band fallback. Assertions below hold under BOTH the fallback and the real dex path;
// cases where they would diverge (e.g. Clefairy 323 -> G4 here vs G3 in-browser) are not
// asserted by exact grade, only by the "not G1" / lift invariants.
// Run: node --test tests/suites/story-grade-overrides.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const g = (n) => W.getMonGrade(n, W.getBST(n));

test('former non-legendary G1 overrides are no longer G1', () => {
  for (const n of ['Azumarill', 'Amoonguss', 'Chansey', 'Wishiwashi']) {
    assert.notEqual(g(n), 1, `${n} must not sit in the legendary (G1) tier`);
  }
});

test('high-BST non-legendary finals cap at G2 (BST>=530 fallback leak closed)', () => {
  for (const n of ['Lapras', 'Snorlax', 'Slaking', 'Charizard', 'Gyarados', 'Archeops', 'Blissey']) {
    assert.equal(g(n), 2, `${n} (non-legendary final) caps at G2, not G1`);
  }
});

test('legendaries / mythicals stay G1 even with the dex stubbed', () => {
  // baseStats.legendary is stamped from species.json tags, so these resolve without @pkmn/dex.
  for (const n of ['Mewtwo', 'Rayquaza', 'Giratina', 'Mew', 'Koraidon']) {
    assert.equal(g(n), 1, `${n} (legendary) is grade 1`);
  }
  // Low-BST legendaries/mythicals are kept at G1 by maintainer call — being a
  // legendary outranks raw BST (Phione 480, Terapagos base 450 / 700 in form).
  for (const n of ['Phione', 'Terapagos']) {
    assert.equal(g(n), 1, `${n} is grade 1 (legendary tier, low BST notwithstanding)`);
  }
  // Pseudo-legendaries (hardcoded set) are G1 too.
  for (const n of ['Dragonite', 'Garchomp', 'Tyranitar', 'Dragapult']) {
    assert.equal(g(n), 1, `${n} (pseudo) is grade 1`);
  }
});

test('3-stage line: Duskull -> Dusclops -> Dusknoir ladders, evolving lifts grade', () => {
  assert.equal(g('Dusclops'), 3, 'Dusclops (3-stage middle) is G3');
  assert.equal(g('Dusknoir'), 2, 'Dusknoir (final) is G2');
  assert.ok(g('Dusclops') > g('Dusknoir'), 'evolving Dusclops -> Dusknoir lifts the grade');
});

test('curated G2 overrides hold (item-independent threats + named exceptions)', () => {
  for (const n of ['Medicham', 'Diggersby', 'Shedinja', 'Ditto', 'Rhydon', 'Azumarill', 'Amoonguss', 'Wishiwashi']) {
    assert.equal(g(n), 2, `${n} is grade 2`);
  }
  assert.equal(g('Muk'), 2, 'Muk is naturally G2 (needs no override)');
});

test('retired overrides now grade naturally (no longer pinned to G2)', () => {
  assert.equal(g('Cosmog'), 4, 'Cosmog (BST 200 blob) grades to G4');
  assert.equal(g('Cosmoem'), 3, 'Cosmoem grades to G3');
  assert.equal(g('Pachirisu'), 3, 'Pachirisu grades to G3');
  assert.equal(g('Murkrow'), 3, 'Murkrow grades to G3');
  assert.equal(g('Smeargle'), 4, 'Smeargle grades to G4');
  assert.equal(g('Chansey'), 3, 'Chansey (3-stage middle) grades to G3');
});
