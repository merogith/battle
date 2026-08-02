// The draft pool's "species clause" must hold at the SPECIES level, not the forme level.
//
// buildDraftPoolsForCurrentSettings carried the comment "Species clause: ensure no
// duplicate species across the combined draft pool" but implemented it as
// `[...new Set(eligible)]`, which only dedupes forme NAMES. Alternate formes are distinct
// strings, so Arceus-Fire / Arceus-Water / Arceus-Steel read as three species: 86 species
// carry more than one forme in the pool (145 surplus entries) and a single draft could
// legitimately offer three Rotoms or four Deoxys. Arceus and Silvally alone contributed 36
// of those entries, which also skewed how often the legendary band surfaced those two.
//
// dedupeBySpecies keeps ONE forme per species, chosen at random so every typing stays
// reachable across rolls.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let w;
before(async () => { ({ window: w } = await loadEngine()); });

const familyOf = (n) =>
  w.eval(`(function(){ const bs = baseStats[${JSON.stringify(n)}]; return (bs && bs.baseSpecies) || ${JSON.stringify(n)}; })()`);

describe('dedupeBySpecies', () => {
  it('collapses every forme family to a single entry', () => {
    const pool = Array.from(w.eval('getDraftPool([1,2,3,4,5,6,7,8,9], null)'));
    const deduped = Array.from(w.eval('dedupeBySpecies(getDraftPool([1,2,3,4,5,6,7,8,9], null))'));
    const families = new Set(pool.map(familyOf));
    assert.equal(deduped.length, families.size,
      `expected one entry per species (${families.size}), got ${deduped.length}`);
    assert.ok(deduped.length < pool.length, 'the pool had duplicate species to collapse');
  });

  it('leaves no two entries sharing a species', () => {
    const deduped = Array.from(w.eval('dedupeBySpecies(getDraftPool([1,2,3,4,5,6,7,8,9], null))'));
    const seen = new Map();
    const dupes = [];
    for (const n of deduped) {
      const fam = familyOf(n);
      if (seen.has(fam)) dupes.push(`${seen.get(fam)} + ${n} (both ${fam})`);
      seen.set(fam, n);
    }
    assert.deepEqual(dupes, [], dupes.join('\n'));
  });

  it('keeps every family represented — nothing is dropped', () => {
    const pool = Array.from(w.eval('getDraftPool([1,2,3,4,5,6,7,8,9], null)'));
    const deduped = Array.from(w.eval('dedupeBySpecies(getDraftPool([1,2,3,4,5,6,7,8,9], null))'));
    const before = new Set(pool.map(familyOf));
    const after = new Set(deduped.map(familyOf));
    const lost = [...before].filter((f) => !after.has(f));
    assert.deepEqual(lost, [], `species dropped entirely: ${lost.join(', ')}`);
  });

  it('every forme of a multi-forme species stays reachable across rolls', () => {
    // Arceus has 18 formes; over many rolls the picked one must vary, or a whole typing
    // would be unreachable rather than merely capped at one slot per draft.
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
      const picked = Array.from(w.eval('dedupeBySpecies(getDraftPool([1,2,3,4,5,6,7,8,9], null))'))
        .find((n) => familyOf(n) === 'Arceus');
      if (picked) seen.add(picked);
      if (seen.size > 3) break;
    }
    assert.ok(seen.size > 1, `Arceus always resolved to the same forme (${[...seen].join(', ')})`);
  });

  it('a single-forme species is passed through untouched', () => {
    const out = Array.from(w.eval(`dedupeBySpecies(['Pikachu','Snorlax','Garchomp'])`));
    assert.deepEqual(out.sort(), ['Garchomp', 'Pikachu', 'Snorlax']);
  });
});
