// Verifies the signature-scaling rules (Phase 3.3): a gen-illegal signature
// devolves to the nearest gen-legal form in its line (Magnezone -> Magneton);
// a signature stronger than the row's grade ceiling devolves to fit (Venusaur
// -> Ivysaur/Bulbasaur) instead of being dropped. Multiset support (Lance x3
// Dragonite) is pre-existing engine behavior (_sigMult / _canUse).
// Run: node --test tests/suites/story-signature-rules.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

test('gen-illegal signature devolves to a gen-legal form in its line', () => {
  const gen1 = new Set([1]);
  assert.equal(ST.genLegalEvoLineForm('Magnezone', gen1), 'Magneton', 'Magnezone (g4) -> Magneton (g1) in a gen-1 run');
  assert.equal(ST.genLegalEvoLineForm('Magnemite', gen1), 'Magnemite', 'already-legal form passes through');
  assert.equal(ST.genLegalEvoLineForm('Magnezone', new Set([1, 4])), 'Magnezone', 'own gen enabled -> itself');
  // A line with no member in the enabled gens returns null (caller uses later fallbacks).
  assert.equal(ST.genLegalEvoLineForm('Lucario', gen1), null, 'no gen-1 form in the Riolu/Lucario line');
});

test('signature scales down by grade rather than being dropped', () => {
  // Ceiling 4 = only G4 authorized -> Venusaur devolves all the way to its base form.
  assert.equal(ST.devolveSigToGradeCeiling('Venusaur', 4), 'Bulbasaur', 'ceil G4 -> Bulbasaur');
  // Ceiling 3 -> devolves to a weaker-but-not-base form (fits, not the full evolution).
  const c3 = ST.devolveSigToGradeCeiling('Venusaur', 3);
  assert.ok(['Ivysaur', 'Bulbasaur'].includes(c3), `ceil G3 devolves Venusaur, got ${c3}`);
  assert.notEqual(c3, 'Venusaur', 'Venusaur is too strong for a G3 ceiling');
  // A ceiling it already satisfies leaves it unchanged.
  assert.equal(ST.devolveSigToGradeCeiling('Venusaur', 1), 'Venusaur', 'ceil G1 (all allowed) -> unchanged');
});

test('filterSigsByGradeCeiling scales every sig, dropping none', () => {
  const ceil = ST.storySigGradeCeiling({ g3: 50, g4: 50 }); // no g1/g2 present -> ceiling 3
  assert.equal(ceil, 3, 'g3/g4-only row -> ceiling 3');
  const out = ST.filterSigsByGradeCeiling(['Venusaur', 'Charizard'], ceil);
  assert.equal(out.length, 2, 'both sigs survive (devolved), none dropped');
  assert.ok(!out.includes('Venusaur'), 'Venusaur (G2) was scaled below the G3 ceiling');
});
