// Guards data/builds/custom.json — the project-owned overlay that scripts/generate_builds.js
// merges into data/builds.csv.
//
// Two claims need holding. (1) The "mirrorFormes" entries assert that a forme is mechanically
// identical to its base forme, which is what makes copying the base's Smogon sets onto it
// honest rather than invented; if a future dex revision splits them, the copy becomes wrong.
// (2) The authored sets are hand-picked, so their moves/abilities must stay legal for the
// species that carries them.
//
// Both exist because getDraftPool reads csvBuilds keys: a species with no row in builds.csv
// is never drafted, which is what kept several Mega Evolutions unreachable.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { loadEngine } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CUSTOM = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'builds', 'custom.json'), 'utf8'));
const CSV = fs.readFileSync(path.join(ROOT, 'data', 'builds.csv'), 'utf8');
const CSV_NAMES = new Set(CSV.split('\n').slice(1).map((l) => l.split(',')[0]).filter(Boolean));
const gens = new Generations(Dex);

let w;
before(async () => { ({ window: w } = await loadEngine()); });

describe('custom build overlay — mirrored formes', () => {
  const pairs = Object.entries(CUSTOM.mirrorFormes || {});

  it('declares at least one mirror', () => {
    assert.ok(pairs.length > 0);
  });

  it('every mirrored forme is mechanically identical to its base forme', () => {
    const mismatched = [];
    for (const [forme, base] of pairs) {
      const f = Dex.species.get(forme);
      const b = Dex.species.get(base);
      assert.ok(f.exists, `${forme} is not a real species`);
      assert.ok(b.exists, `${base} is not a real species`);
      if (JSON.stringify(f.baseStats) !== JSON.stringify(b.baseStats)) mismatched.push(`${forme}: base stats differ from ${base}`);
      if (f.types.join('/') !== b.types.join('/')) mismatched.push(`${forme}: typing differs from ${base}`);
      if (JSON.stringify(f.abilities) !== JSON.stringify(b.abilities)) mismatched.push(`${forme}: abilities differ from ${base}`);
    }
    assert.deepEqual(mismatched, [], mismatched.join('\n'));
  });

  it('every mirrored forme reached builds.csv', () => {
    const missing = pairs.map(([forme]) => forme).filter((n) => !CSV_NAMES.has(n));
    assert.deepEqual(missing, [], `run scripts/generate_builds.js — missing: ${missing.join(', ')}`);
  });
});

describe('custom build overlay — authored sets', () => {
  const authored = [];
  for (const [gen, byName] of Object.entries(CUSTOM.sets || {})) {
    for (const [name, tiers] of Object.entries(byName)) {
      for (const [format, roles] of Object.entries(tiers)) {
        for (const [role, set] of Object.entries(roles)) authored.push({ gen: Number(gen), name, format, role, set });
      }
    }
  }

  it('declares at least one authored set', () => {
    assert.ok(authored.length > 0);
  });

  it('every authored move is in the species learnset for that gen', async () => {
    const illegal = [];
    for (const { gen, name, role, set } of authored) {
      const g = gens.get(gen);
      const learnset = await g.learnsets.get(name);
      assert.ok(learnset && learnset.learnset, `no learnset for ${name} in gen ${gen}`);
      // Move slots may hold a single move or an array of alternatives.
      for (const slot of set.moves) {
        for (const move of (Array.isArray(slot) ? slot : [slot])) {
          const id = Dex.moves.get(move).id;
          if (!learnset.learnset[id]) illegal.push(`${name} (${role}): ${move}`);
        }
      }
    }
    assert.deepEqual(illegal, [], illegal.join('\n'));
  });

  it('every authored ability is legal for the species', () => {
    const illegal = [];
    for (const { name, role, set } of authored) {
      if (!set.ability) continue;
      const legal = Object.values(Dex.species.get(name).abilities);
      for (const a of (Array.isArray(set.ability) ? set.ability : [set.ability])) {
        if (!legal.includes(a)) illegal.push(`${name} (${role}): ${a} — legal: ${legal.join(', ')}`);
      }
    }
    assert.deepEqual(illegal, [], illegal.join('\n'));
  });

  it('EV spreads stay within the 510 budget', () => {
    const over = [];
    for (const { name, role, set } of authored) {
      const spreads = Array.isArray(set.evs) ? set.evs : [set.evs || {}];
      for (const evs of spreads) {
        const total = Object.values(evs).reduce((a, b) => a + b, 0);
        if (total > 510) over.push(`${name} (${role}): ${total} EVs`);
        for (const [stat, v] of Object.entries(evs)) {
          if (v > 252) over.push(`${name} (${role}): ${stat}=${v} exceeds 252`);
        }
      }
    }
    assert.deepEqual(over, []);
  });

  it('every authored species reached builds.csv', () => {
    const missing = [...new Set(authored.map((a) => a.name))].filter((n) => !CSV_NAMES.has(n));
    assert.deepEqual(missing, [], `run scripts/generate_builds.js — missing: ${missing.join(', ')}`);
  });
});

describe('the overlay makes the previously-unreachable megas draftable', () => {
  it('each overlaid species is offered by getDraftPool', () => {
    const pool = new Set(Array.from(w.eval('getDraftPool([1,2,3,4,5,6,7,8,9], null)')));
    const names = [
      ...Object.keys(CUSTOM.mirrorFormes || {}),
      ...Object.values(CUSTOM.sets || {}).flatMap((byName) => Object.keys(byName)),
    ];
    const absent = names.filter((n) => !pool.has(n));
    assert.deepEqual(absent, [], `still undraftable: ${absent.join(', ')}`);
  });

  it('every mega-capable species is now draftable', () => {
    const pool = new Set(Array.from(w.eval('getDraftPool([1,2,3,4,5,6,7,8,9], null)')));
    const species = Array.from(w.eval('Array.from(MEGA_SPECIES)'));
    // Rayquaza is in the pool like any other mon; Crucibelle is a CAP with no baseStats row.
    const absent = species.filter((n) => n !== 'Crucibelle' && !pool.has(n));
    assert.deepEqual(absent, [], `mega species that can never be drafted: ${absent.join(', ')}`);
  });
});
