// gen-move-tag-index.mjs — precompute the per-species move-tag index OFFLINE.
//
// WHY: at runtime battle.html classifies every (species, move) pair as
//   natural (L/E/V) · learnt (M/T/R/S/D/C) · awakened (off-legal CSV)
// by fetching @pkmn/dex learnsets from a CDN. When that fetch is cold/blocked
// the classifier returns empty and BOTH the foe move-gate and the player tutor
// gate silently no-op (everyone keeps full Smogon movesets). This script reads
// the LOCAL @pkmn/dex (already in node_modules) and emits data/move-tags.json so
// the gate is deterministic and offline-safe. The CDN path stays only as a
// last-resort fallback for species missing from the index.
//
// Output shape (compact, integer-indexed move table to keep the file small):
//   { _gen, moves: ["Earthquake", ...], species: { "Garchomp": { n:[idx...], l:[idx...] } } }
//   n = Natural (level-up + egg + transfer), l = Learnt (TM/HM/tutor/TR/event/…).
//   Awakened is still derived at runtime from the CSV pool (no learnset needed).
//
// Mirrors battle.html _tutorSpeciesKeysForLearnset + _tutorFetchLearnsetMoveNames:
//   - species keys = self + baseSpecies + changesFrom + prevo chain (species.json
//     fields AND @pkmn/dex prevo walking), so evolutions inherit pre-evo moves;
//   - learnsets unioned across gens 4-9 (gen-9 default-Dex hides isNonstandard
//     "Past" moves like Hidden Power / Return);
//   - Natural wins on method overlap;
//   - filtered to moves implemented in data/moves.json gen-9 (== implementedMoveNames).
//
// Run: node scripts/build/gen-move-tag-index.mjs

import { Dex } from '@pkmn/dex';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const speciesJSON = JSON.parse(readFileSync(join(ROOT, 'data', 'species.json'), 'utf8'))['9'] || {};
const movesJSON = JSON.parse(readFileSync(join(ROOT, 'data', 'moves.json'), 'utf8'))['9'] || {};

// implementedMoveNames equivalent: the set of move DISPLAY names shipped in gen-9.
const implementedMoveNames = new Set();
for (const k in movesJSON) { const m = movesJSON[k]; if (m && m.name) implementedMoveNames.add(m.name); }

// Build display-name → species.json entry, for prevo/baseSpecies walking that
// mirrors the runtime's baseStats lookups (which are keyed by display name).
const byDisplay = new Map();
for (const k in speciesJSON) {
    const s = speciesJSON[k];
    if (s && s.name && s.baseStats && s.num > 0) byDisplay.set(s.name, s);
}

// Mirror _tutorSpeciesKeysForLearnset(monName).
function speciesKeysFor(name) {
    const keys = [];
    const add = (n) => { if (n && typeof n === 'string' && !keys.includes(n)) keys.push(n); };
    add(name);
    const s = byDisplay.get(name);
    if (s) {
        add(s.baseSpecies);
        add(s.changesFrom);
        const seen = new Set();
        let cur = s.prevo;
        while (cur && !seen.has(cur)) { seen.add(cur); add(cur); const p = byDisplay.get(cur); cur = p && p.prevo ? p.prevo : null; }
    }
    // @pkmn/dex prevo walking (the comprehensive source the runtime also uses).
    const walkDex = (start) => {
        const seen = new Set();
        let nm = start;
        while (nm && !seen.has(nm)) {
            seen.add(nm); add(nm);
            let sp = null; try { sp = Dex.species.get(nm); } catch (e) {}
            nm = sp && sp.exists && sp.prevo ? sp.prevo : null;
        }
    };
    walkDex(name);
    if (s && s.baseSpecies && s.baseSpecies !== name) walkDex(s.baseSpecies);
    if (s && s.changesFrom && s.changesFrom !== name && s.changesFrom !== s.baseSpecies) walkDex(s.changesFrom);
    return keys;
}

// Cache learnset lookups by (gen, speciesName) — prevos are shared across many mons.
const GENS = [4, 5, 6, 7, 8, 9];
const dexByGen = new Map(GENS.map(g => [g, g === 9 ? Dex : Dex.forGen(g)]));
const lsCache = new Map(); // `${g}|${name}` → learnset object|null
async function getLearnset(g, name) {
    const key = g + '|' + name;
    if (lsCache.has(key)) return lsCache.get(key);
    let ls = null;
    try { const D = dexByGen.get(g); const r = await D.learnsets.get(name); ls = (r && r.learnset) ? r.learnset : null; } catch (e) { ls = null; }
    lsCache.set(key, ls);
    return ls;
}

// Move display-name table (interned) → index.
const moveList = [];
const moveIdx = new Map();
function internMove(displayName) {
    let i = moveIdx.get(displayName);
    if (i === undefined) { i = moveList.length; moveList.push(displayName); moveIdx.set(displayName, i); }
    return i;
}

async function tagsForSpecies(name) {
    const keys = speciesKeysFor(name);
    const idMethods = new Map(); // moveId → Set(method letters)
    for (const g of GENS) {
        for (const nm of keys) {
            const ls = await getLearnset(g, nm);
            if (!ls) continue;
            for (const id of Object.keys(ls)) {
                let set = idMethods.get(id);
                if (!set) { set = new Set(); idMethods.set(id, set); }
                const codes = ls[id];
                if (Array.isArray(codes)) for (const c of codes) { if (typeof c === 'string' && c.length > 1) set.add(c[1]); }
            }
        }
    }
    const natural = new Set();
    const learnt = new Set();
    for (const [id, methods] of idMethods) {
        let mv = null; try { mv = Dex.moves.get(id); } catch (e) {}
        if (!mv || mv.exists === false || !mv.name) continue;
        if (!implementedMoveNames.has(mv.name)) continue; // == _tutorMoveAllowedStrict implemented-check
        const isNatural = methods.has('L') || methods.has('E') || methods.has('V');
        const isLearnt = methods.has('M') || methods.has('T') || methods.has('R') || methods.has('S') || methods.has('D') || methods.has('C');
        if (isNatural) natural.add(mv.name);          // Natural wins on overlap
        else if (isLearnt) learnt.add(mv.name);
    }
    return { natural, learnt };
}

const out = { _gen: 9, _generated: new Date().toISOString().slice(0, 10), moves: [], species: {} };
const names = [...byDisplay.keys()].sort();
let done = 0, withTags = 0;
for (const name of names) {
    const { natural, learnt } = await tagsForSpecies(name);
    if (natural.size || learnt.size) {
        out.species[name] = {
            n: [...natural].map(internMove).sort((a, b) => a - b),
            l: [...learnt].map(internMove).sort((a, b) => a - b),
        };
        withTags++;
    }
    if (++done % 200 === 0) process.stderr.write(`  ...${done}/${names.length}\n`);
}
out.moves = moveList;

writeFileSync(join(ROOT, 'data', 'move-tags.json'), JSON.stringify(out));
process.stderr.write(`Done: ${withTags}/${names.length} species tagged, ${moveList.length} distinct moves, ` +
    `${(JSON.stringify(out).length / 1024 / 1024).toFixed(2)} MB.\n`);
