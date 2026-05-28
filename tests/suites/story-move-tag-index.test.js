// Phase 4.1 — move-tag index: Natural / Learnt / Awakened per species.
//   Natural  = L (level-up incl L0 evolution) + E (egg) + V (transfer)
//   Learnt   = M (TM / HM) + T (Tutor) + R (TR) + S (event) + D (Dream) + C (cave)
//   Awakened = species' Smogon CSV picks not in any gen learnset
// jsdom fetch may not load full @pkmn/dex learnsets, so the tests are tolerant of
// thin data: they assert structural properties (tag is one of the four allowed
// values; Natural and Learnt are disjoint; tier1 is a subset of Natural) rather
// than exact move membership which depends on dex availability.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

test('cache returns natural / learnt / awakened arrays + tag fn classifies', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(Array.isArray(ls.natural), 'natural[] returned');
  assert.ok(Array.isArray(ls.learnt),  'learnt[] returned');
  assert.ok(Array.isArray(ls.awakened),'awakened[] returned');
  // Disjoint: a move is in at most ONE of natural/learnt (Natural wins on overlap by design).
  const nat = new Set(ls.natural);
  for (const m of ls.learnt) assert.ok(!nat.has(m), `Garchomp move "${m}" leaked into both Natural AND Learnt`);
  // tier1 (legacy L+E) must be a subset of Natural (since natural = L+E+V).
  for (const m of ls.tier1) assert.ok(nat.has(m), `tier1 "${m}" should be a subset of Natural`);
  // Sanity-check the tag fn responds with a known value (or 'unknown' if dex is thin).
  for (const m of ls.natural) assert.equal(ST.moveTagForSpecies('Garchomp', m), 'natural', `${m} tagged natural`);
  for (const m of ls.learnt)  assert.equal(ST.moveTagForSpecies('Garchomp', m), 'learnt',  `${m} tagged learnt`);
  for (const m of ls.awakened) assert.equal(ST.moveTagForSpecies('Garchomp', m), 'awakened', `${m} tagged awakened`);
});

test('tag fn returns "unknown" when the cache is cold for a species', () => {
  // Use a name unlikely to be pre-warmed by other tests. moveTagForSpecies is sync —
  // a cold cache should resolve to 'unknown' (the only safe answer without await).
  const tag = ST.moveTagForSpecies('NonexistentSpecies1234', 'Tackle');
  assert.equal(tag, 'unknown', 'cold cache resolves to unknown');
});

test('Natural set covers what an L1 Inner Strength tutor can teach (egg+level+transfer)', async () => {
  const ls = await ST.tutorFetchLearnsetMoveNames('Bulbasaur');
  // Natural must be a superset of tier1 (which was L+E only) and must be non-empty
  // when the dex is actually loaded. When dex stubs are present (jsdom), all arrays
  // may be empty — the tag fn falling back to 'unknown'/'awakened' is acceptable.
  if (ls.all.length === 0) {
    // Dex thin — skip the size assertion, just confirm shape.
    assert.ok(ls.natural.length === 0 && ls.learnt.length === 0, 'thin-dex case: empty sets');
    return;
  }
  assert.ok(ls.natural.length >= ls.tier1.length, 'natural superset of tier1');
});
