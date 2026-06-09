// Covers _getEvoChainForward — the forward evolution-chain walker that powers the
// Evolution Tutor's "Further evolutions — preview only" cards. It returns the
// depth-≥2 descendants of a mon (the steps BEYOND the immediate next evolution),
// so the player can compare a whole line's base stats before committing step one.
// Asserts: depth/viaPrevo tracking, branch handling, immediate-evo exclusion, and
// clean termination on finals (cycle guard → no infinite loop).
//
// The @pkmn/dex evolution graph isn't loaded in the headless harness (getPssDex →
// stubbed null), so we install a minimal Dex.species.get returning the .evos shape
// the walker reads — same approach as tests/integration/evolab-pc-evolution.test.js.
//
// Run: node --test tests/suites/story-evo-chain-forward.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

// Small evolution graph. Species names all exist in data/species.json so the
// walker's baseStats[name] gen/exists lookups resolve.
const EVOS = {
  Charmander: ['Charmeleon'], Charmeleon: ['Charizard'], Charizard: [],
  Wurmple: ['Silcoon', 'Cascoon'], Silcoon: ['Beautifly'], Cascoon: ['Dustox'],
  Beautifly: [], Dustox: [],
  Eevee: ['Vaporeon', 'Jolteon', 'Flareon', 'Espeon', 'Umbreon', 'Leafeon', 'Glaceon', 'Sylveon'],
  Mewtwo: [],
};
W.pkmn.dex.Dex.species.get = (n) => ({ name: n, evos: EVOS[n] || [], baseSpecies: n });

const allGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const chain = ST._getEvoChainForward;

test('_getEvoChainForward export exists', () => {
  assert.equal(typeof chain, 'function', '__storyTest._getEvoChainForward must be exposed');
});

test('3-stage line: Charmander previews Charizard at depth 2 via Charmeleon', () => {
  const c = chain('Charmander', allGens);
  const charizard = c.find(e => e.name === 'Charizard');
  assert.ok(charizard, 'Charizard must be previewed');
  assert.equal(charizard.depth, 2, 'Charizard is two steps from Charmander');
  assert.equal(charizard.viaPrevo, 'Charmeleon', 'preview names the immediate prevo');
  assert.ok(charizard.exists, 'real species → exists');
  assert.ok(!c.some(e => e.name === 'Charmeleon'), 'immediate evo (depth 1) is excluded — rendered as an action card elsewhere');
});

test('branching line: Wurmple previews both Beautifly and Dustox', () => {
  // Spread into a Node-realm array — the walker returns a jsdom-realm array, so
  // deepStrictEqual on it would fail the cross-realm prototype check.
  const names = [...chain('Wurmple', allGens)].map(e => e.name).sort();
  assert.deepEqual(names, ['Beautifly', 'Dustox'], 'both branch finals previewed, neither immediate evo');
});

test('all-immediate line: Eevee → empty forward chain', () => {
  assert.equal(chain('Eevee', allGens).length, 0, 'eeveelutions are all immediate (depth 1) → nothing further to preview');
});

test('final-stage mon terminates with no entries (no loop)', () => {
  assert.equal(chain('Charizard', allGens).length, 0);
  assert.equal(chain('Mewtwo', allGens).length, 0);
});

test('gen gating surfaced via inGen flag', () => {
  const c = chain('Charmander', [1]);
  const charizard = c.find(e => e.name === 'Charizard');
  assert.ok(charizard);
  assert.equal(typeof charizard.inGen, 'boolean', 'inGen lets the card flag a gen-disabled target');
});
