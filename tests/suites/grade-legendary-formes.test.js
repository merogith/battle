// Legendary / mythical / UB / Paradox status must follow a Pokemon into its alternate
// formes.
//
// Only the BASE entry in data/species.json carries the `tags` array — Arceus-Fire,
// Zacian-Crowned, Necrozma-Ultra, Zygarde-Complete and 60-odd others have none of their
// own. getMonGrade reads that flag to decide the G1 (legendary) band, so without an
// inheritance step the STRONGER forme graded BELOW its base: Necrozma-Ultra (754 BST) sat
// in G2 next to ordinary Pokemon while Necrozma (600) was G1, and the eight highest-BST
// entries in the whole G2 draft pool were legendary formes.
//
// G2 is the band the story leans on hardest, so this decided which Pokemon a mid-run
// player could meet. These tests pin the inheritance and the controls around it.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPECIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'species.json'), 'utf8'))['9'];
const LEGENDARY_TAGS = new Set(['Mythical', 'Restricted Legendary', 'Sub-Legendary', 'Ultra Beast', 'Paradox']);
const hasTag = (e) => Array.isArray(e && e.tags) && e.tags.some((t) => LEGENDARY_TAGS.has(t));

const byName = {};
for (const e of Object.values(SPECIES)) if (e && e.name) byName[e.name] = e;

// Formes with no tags of their own whose base species is tagged.
const INHERITING_FORMES = [];
for (const e of Object.values(SPECIES)) {
  if (!e || !e.baseStats || !e.num || e.num <= 0 || !e.baseSpecies || hasTag(e)) continue;
  if (hasTag(byName[e.baseSpecies])) INHERITING_FORMES.push(e.name);
}

let w;
before(async () => { ({ window: w } = await loadEngine()); });

const grade = (n) => w.eval(`getMonGrade(${JSON.stringify(n)}, getBST(${JSON.stringify(n)}))`);
const isFlagged = (n) => w.eval(`!!(baseStats[${JSON.stringify(n)}] && baseStats[${JSON.stringify(n)}].legendary)`);

describe('legendary tier follows a species into its formes', () => {
  it('there are formes to check', () => {
    assert.ok(INHERITING_FORMES.length > 50, `expected the full forme set, got ${INHERITING_FORMES.length}`);
  });

  it('every tagless forme of a tagged species is flagged legendary', () => {
    const missed = INHERITING_FORMES.filter((n) => w.eval(`!!baseStats[${JSON.stringify(n)}]`) && !isFlagged(n));
    assert.deepEqual(missed, [], `formes not inheriting their base's tier: ${missed.join(', ')}`);
  });

  it('a forme never grades below its base species', () => {
    const inverted = [];
    for (const name of INHERITING_FORMES) {
      const base = SPECIES[Object.keys(SPECIES).find((k) => SPECIES[k].name === name)].baseSpecies;
      if (!w.eval(`!!baseStats[${JSON.stringify(name)}]`) || !w.eval(`!!baseStats[${JSON.stringify(base)}]`)) continue;
      // Lower grade number = stronger band, so the forme's grade must not exceed the base's.
      if (grade(name) > grade(base)) inverted.push(`${name} G${grade(name)} < ${base} G${grade(base)}`);
    }
    assert.deepEqual(inverted, [], inverted.join('\n'));
  });

  it('the headline offenders are G1 alongside their base', () => {
    for (const [base, forme] of [
      ['Arceus', 'Arceus-Fire'], ['Zacian', 'Zacian-Crowned'], ['Necrozma', 'Necrozma-Ultra'],
      ['Zygarde', 'Zygarde-Complete'], ['Calyrex', 'Calyrex-Shadow'], ['Magearna', 'Magearna-Original'],
      ['Kyurem', 'Kyurem-Black'], ['Deoxys', 'Deoxys-Attack'],
    ]) {
      assert.equal(grade(base), 1, `${base} should be G1`);
      assert.equal(grade(forme), 1, `${forme} should be G1 like ${base}`);
    }
  });
});

describe('the inheritance does not over-reach', () => {
  it('ordinary species keep their grade', () => {
    // Naturally-G2 finals, pseudo-legendaries (already G1 by their own rule), and basics.
    assert.equal(grade('Clefable'), 2);
    assert.equal(grade('Garchomp'), 1);   // pseudo-legendary
    assert.equal(grade('Pikachu'), 4);
    assert.equal(grade('Bulbasaur'), 4);
  });

  it('legendary PRE-EVOS stay in the weak bands', () => {
    // Cosmog / Type: Null are deliberately-weak blobs: they have evos, so _computeMonGrade
    // grades them by stage/BST regardless of the legendary flag.
    assert.ok(grade('Cosmog') >= 3, `Cosmog should stay weak, got G${grade('Cosmog')}`);
    assert.ok(grade('Type: Null') >= 2, `Type: Null should stay capped, got G${grade('Type: Null')}`);
  });

  it('no legendary FINAL is left in the G2 draft pool', () => {
    // Legendary pre-evos (Type: Null → Silvally, Cosmog → …) are deliberately excluded:
    // _computeMonGrade caps anything with an evolution at G2 regardless of the flag,
    // because those formes are weak on purpose. Only finals belong in the G1 band.
    const pool = Array.from(w.eval('getDraftPool([1,2,3,4,5,6,7,8,9], null)'));
    const hasEvos = (n) => w.eval(`!!(baseStats[${JSON.stringify(n)}] && baseStats[${JSON.stringify(n)}].evos && baseStats[${JSON.stringify(n)}].evos.length)`);
    const leaked = pool.filter((n) => grade(n) === 2 && isFlagged(n) && !hasEvos(n));
    assert.deepEqual(leaked, [], `legendary finals still sitting in G2: ${leaked.join(', ')}`);
  });
});

describe('Paradox Pokemon missing their upstream tag', () => {
  // Four Indigo Disk Paradox mons ship without the `Paradox` tag in the Showdown species
  // export while their nine siblings carry it — identical 590 BST, different band.
  // _GRADE1_OVERRIDE pins them; this fails if the upstream data is fixed and the override
  // becomes redundant, or if a new sibling shows up untagged.
  const PARADOX_590 = ['Gouging Fire', 'Raging Bolt', 'Iron Crown', 'Iron Boulder',
    'Walking Wake', 'Iron Leaves', 'Roaring Moon', 'Iron Valiant'];

  it('all 590-BST Paradox Pokemon share one grade', () => {
    const grades = PARADOX_590.map((n) => `${n}=G${grade(n)}`);
    const distinct = new Set(PARADOX_590.map(grade));
    assert.equal(distinct.size, 1, `Paradox siblings disagree: ${grades.join(', ')}`);
    assert.equal([...distinct][0], 1, 'Paradox Pokemon belong in G1');
  });
});
