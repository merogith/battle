// Phase 2b — targeted learnset augmentation of the archetype generator. Species with
// a THIN CSV move union (single-set / LC mons) get their legal learnset folded into
// _designedCsvMovePool so makeDesignedBuild can build a second role; well-covered
// species (union >= threshold) are left untouched. The offline move-tag index loads
// async, so this test polls window.MOVE_TAG_INDEX before asserting.
// Run: node --test tests/suites/story-generator-augment.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const W = E.window;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait for the offline move-tag index to load (populated by loadGameData's async
// fetch of data/move-tags.json; __testReady only awaits baseStats + movesDB).
let indexReady = false;
for (let i = 0; i < 100; i++) {
  const idx = W.MOVE_TAG_INDEX;
  if (idx && idx.species && Object.keys(idx.species).length > 0 && Array.isArray(idx.moves) && idx.moves.length) { indexReady = true; break; }
  await sleep(100);
}

test('move-tag index is available (precondition)', () => {
  assert.ok(indexReady, 'MOVE_TAG_INDEX loaded within the poll window');
  assert.equal(typeof W._designedCsvMovePool, 'function', '_designedCsvMovePool reachable');
});

test('thin-CSV species get their pool augmented from the learnset', () => {
  if (!indexReady) return; // guarded by the precondition test above
  // Sunkern: a classic single-set LC mon (~5 CSV moves) — should be augmented well
  // past the threshold so the generator can pick a wall vs an attacker set.
  const sunkern = W._designedCsvMovePool('Sunkern');
  assert.ok(sunkern.length >= 20, `Sunkern pool augmented from learnset (got ${sunkern.length})`);
});

test('well-covered species are left untouched (no over-augmentation)', () => {
  if (!indexReady) return;
  // These already have a rich CSV union (>= threshold); the pool must stay CSV-only,
  // i.e. NOT balloon to the full learnset. A well-covered mon's pool is well under its
  // ~90-100-move full legal learnset.
  for (const nm of ['Garchomp', 'Blissey']) {
    const pool = W._designedCsvMovePool(nm);
    assert.ok(pool.length > 0, `${nm} has a CSV pool`);
    assert.ok(pool.length < 80, `${nm} pool stays CSV-scoped, not full-learnset (got ${pool.length})`);
  }
});
