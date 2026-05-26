#!/usr/bin/env node
// One-shot generator for data/op-abilities.json — the species→3-OP-abilities map
// surfaced as "Awaken" picks in the Battle Dojo at City 6+ (sm.badges >= 6).
//
// Inputs:  data/species.json, data/abilities.json, data/moves.json, data/builds.csv
// Output:  data/op-abilities.json
//
// Rules (from approved plan /root/.claude/plans/deep-dive-to-this-luminous-platypus.md):
//   - Drop Mega/Primal/Gmax/Eternamax/Ultra formes.
//   - Skip species whose current ability pool (species.json slots 0/1/H + CSV-build
//     ability column) has > 5 distinct entries.
//   - Each output triple is 3 abilities from the curated 30, no duplicates,
//     no overlap with the species' existing ability pool.
//   - -ate / Skill Link / Strong Jaw / Mega Launcher / Punk Rock are only
//     picked when the species' CSV move pool includes a move that benefits.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPECIES_PATH   = path.join(ROOT, 'data', 'species.json');
const ABILITIES_PATH = path.join(ROOT, 'data', 'abilities.json');
const MOVES_PATH     = path.join(ROOT, 'data', 'moves.json');
const BUILDS_PATH    = path.join(ROOT, 'data', 'builds.csv');
const OUT_PATH       = path.join(ROOT, 'data', 'op-abilities.json');

// ─── The curated 30 OP abilities ─────────────────────────────────────────────
const OP_30 = [
  // Stat multipliers
  'Huge Power', 'Pure Power', 'Sheer Force', 'Adaptability', 'Tough Claws',
  // Type conversion
  'Protean', 'Pixilate', 'Aerilate', 'Refrigerate', 'Galvanize',
  // Defensive walls
  'Wonder Guard', 'Multiscale', 'Magic Guard', 'Magic Bounce',
  // Speed control
  'Speed Boost', 'Swift Swim', 'Chlorophyll', 'Sand Rush',
  // Weather setters
  'Drizzle', 'Drought', 'Sand Stream', 'Snow Warning',
  // Terrain setters
  'Electric Surge', 'Grassy Surge',
  // Damage amplifiers
  'Skill Link', 'Strong Jaw', 'Mega Launcher', 'Punk Rock',
  // KO snowball + utility
  'Beast Boost', 'Regenerator',
];
console.assert(OP_30.length === 30, 'OP_30 must contain exactly 30 abilities');

// ─── Load data ───────────────────────────────────────────────────────────────
const speciesAll   = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'));
const abilitiesAll = JSON.parse(fs.readFileSync(ABILITIES_PATH, 'utf8'));
const movesAll     = JSON.parse(fs.readFileSync(MOVES_PATH, 'utf8'));
const buildsCsv    = fs.readFileSync(BUILDS_PATH, 'utf8');

// Use gen 9 as the canonical/most-complete set
const SPECIES   = speciesAll['9'];
const ABILITIES = abilitiesAll['9'];
const MOVES     = movesAll['9'];

const KEY = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Validate all 30 OP abilities exist in abilities.json
for (const ab of OP_30) {
  if (!ABILITIES[KEY(ab)]) {
    console.error(`FATAL: OP ability "${ab}" not found in abilities.json gen 9.`);
    process.exit(1);
  }
}

// ─── Parse builds.csv: per-species set of abilities and moves ────────────────
const lines = buildsCsv.split(/\r?\n/);
const header = lines[0].replace(/^﻿/, '').split(',');
const idx = (col) => header.indexOf(col);
const COL = {
  name: idx('name'), ability: idx('ability'),
  m1: idx('move1'), m2: idx('move2'), m3: idx('move3'), m4: idx('move4'),
};
const csvAbilitiesByMon = new Map();   // monName -> Set<string>
const csvMovesByMon     = new Map();   // monName -> Set<string>

for (let i = 1; i < lines.length; i++) {
  const ln = lines[i];
  if (!ln) continue;
  const cells = ln.split(',');
  const name = cells[COL.name];
  if (!name) continue;
  const ab = cells[COL.ability];
  if (ab && ab.trim()) {
    if (!csvAbilitiesByMon.has(name)) csvAbilitiesByMon.set(name, new Set());
    csvAbilitiesByMon.get(name).add(ab.trim());
  }
  const moveSlots = [cells[COL.m1], cells[COL.m2], cells[COL.m3], cells[COL.m4]];
  for (const slot of moveSlots) {
    if (!slot) continue;
    for (const m of slot.split('/')) {
      const t = m.trim();
      if (!t || t === 'Tackle') continue; // Tackle is the default-fill stub
      if (!csvMovesByMon.has(name)) csvMovesByMon.set(name, new Set());
      csvMovesByMon.get(name).add(t);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isExcludedForme(entry) {
  const f = entry.forme || '';
  // Match Mega/Gmax/Primal/Eternamax/Ultra anywhere in the forme tag
  // (e.g. "Mega-Y", "Original-Mega", "Rapid-Strike-Gmax", "Low-Key-Gmax")
  return /\b(Mega|Primal|Gmax|Eternamax|Ultra)\b/i.test(f);
}

function currentAbilityPool(displayName, entry) {
  // Mirrors battle.html's _tutorGetPoolForMon: species.json slots + CSV abilities.
  // Walks base species + changesFrom like the runtime does.
  const set = new Set();
  const collectFromEntry = (e) => {
    if (!e || !e.abilities) return;
    for (const k of Object.keys(e.abilities)) {
      const a = e.abilities[k];
      if (a) set.add(a);
    }
  };
  collectFromEntry(entry);

  const csvAdd = (n) => {
    if (csvAbilitiesByMon.has(n)) csvAbilitiesByMon.get(n).forEach(a => set.add(a));
  };
  csvAdd(displayName);
  if (entry.baseSpecies && entry.baseSpecies !== displayName) {
    csvAdd(entry.baseSpecies);
    // Also collect base species' slot abilities
    const baseKey = KEY(entry.baseSpecies);
    if (SPECIES[baseKey]) collectFromEntry(SPECIES[baseKey]);
  }
  if (entry.changesFrom && entry.changesFrom !== displayName) {
    csvAdd(entry.changesFrom);
    const cfKey = KEY(entry.changesFrom);
    if (SPECIES[cfKey]) collectFromEntry(SPECIES[cfKey]);
  }
  return set;
}

function speciesMovePool(displayName, entry) {
  const set = new Set();
  if (csvMovesByMon.has(displayName)) csvMovesByMon.get(displayName).forEach(m => set.add(m));
  if (entry.baseSpecies && csvMovesByMon.has(entry.baseSpecies)) {
    csvMovesByMon.get(entry.baseSpecies).forEach(m => set.add(m));
  }
  if (entry.changesFrom && csvMovesByMon.has(entry.changesFrom)) {
    csvMovesByMon.get(entry.changesFrom).forEach(m => set.add(m));
  }
  return set;
}

function hasMoveMatching(movePool, predicate) {
  for (const m of movePool) {
    const md = MOVES[KEY(m)];
    if (md && predicate(md)) return true;
  }
  return false;
}
const hasNormalDamaging = (mp) => hasMoveMatching(mp, md => md.type === 'Normal' && md.category !== 'Status' && (md.basePower | 0) > 0);
const hasBitingMove     = (mp) => hasMoveMatching(mp, md => md.flags && md.flags.bite);
const hasPulseMove      = (mp) => hasMoveMatching(mp, md => md.flags && md.flags.pulse);
const hasSoundMove      = (mp) => hasMoveMatching(mp, md => md.flags && md.flags.sound);
const hasMultiHitMove   = (mp) => hasMoveMatching(mp, md => Array.isArray(md.multihit) || md.multihit === 2 || md.multihit === 3 || md.multihit === 5);
const hasContactMove    = (mp) => hasMoveMatching(mp, md => md.flags && md.flags.contact && md.category !== 'Status');

// ─── Fit scoring ─────────────────────────────────────────────────────────────
// Scoring philosophy: type/role fit beats generic baselines. The 30 OPs are
// spread across roles so any mon gets 3 *thematically different* picks
// (offense + defense + utility / weather), not three flavors of the same boost.
function scoreAbility(ability, entry, movePool) {
  const types = entry.types || [];
  const bs = entry.baseStats || {};
  const atk = bs.atk | 0, spa = bs.spa | 0, hp = bs.hp | 0, spe = bs.spe | 0, def = bs.def | 0, spd = bs.spd | 0;
  const bst = atk + spa + hp + spe + def + spd;
  const physical = atk >= spa;
  const special  = spa >  atk;
  const bulky    = (hp + def + spd) >= 240;
  const frail    = (hp + def + spd) <  200;
  let score = 0;

  switch (ability) {
    // — Stat multipliers —
    case 'Huge Power':
      // The headline doubler. Reserve for physical mons whose attack is
      // BELOW average — they benefit most. Already-strong attackers don't need it.
      if (!physical) return 0;
      if (atk <= 90) score += 9;
      else if (atk <= 110) score += 6;
      else score += 3;
      break;
    case 'Pure Power':
      // Identical effect to Huge Power. Scored just below to break ties so
      // both don't end up in the same triple — see dedup pass below.
      if (!physical) return 0;
      if (atk <= 90) score += 8;
      else if (atk <= 110) score += 5;
      else score += 2;
      break;
    case 'Tough Claws':
      if (!physical) return 0;
      if (hasContactMove(movePool)) score += 7;
      else score += 2;
      break;
    case 'Sheer Force':
      score += 4;
      if (atk >= 100 || spa >= 100) score += 2;
      break;
    case 'Adaptability':
      score += 4;
      if (atk >= 100 || spa >= 100) score += 2;
      break;

    // — Type conversion (-ate / Protean) —
    case 'Protean':
      if (atk + spa < 160) return 0; // useless on pure tanks
      score += 5;
      if (spe >= 90) score += 2;
      break;
    case 'Pixilate':
      if (!hasNormalDamaging(movePool)) return 0;
      if (types.includes('Fairy')) score += 8;
      else if (types.includes('Normal')) score += 6;
      else return 0; // off-theme — skip rather than fill
      break;
    case 'Aerilate':
      if (!hasNormalDamaging(movePool)) return 0;
      if (types.includes('Flying')) score += 8;
      else if (types.includes('Normal')) score += 6;
      else return 0;
      break;
    case 'Refrigerate':
      if (!hasNormalDamaging(movePool)) return 0;
      if (types.includes('Ice')) score += 8;
      else if (types.includes('Normal')) score += 6;
      else return 0;
      break;
    case 'Galvanize':
      if (!hasNormalDamaging(movePool)) return 0;
      if (types.includes('Electric')) score += 8;
      else if (types.includes('Normal')) score += 6;
      else return 0;
      break;

    // — Defensive walls —
    case 'Wonder Guard':
      // Only for very frail mons — they need the immunity most. Cap at 3 baseline
      // so it doesn't blanket every entry.
      if (frail && bst < 400) score += 7;
      else if (frail) score += 4;
      else return 0;
      break;
    case 'Multiscale':
      if (hp >= 100) score += 7;
      else if (hp >= 80) score += 5;
      else if (hp >= 60) score += 2;
      else return 0;
      break;
    case 'Magic Guard':
      score += 5;
      if (hp <= 70) score += 2;
      break;
    case 'Magic Bounce':
      if (bulky) score += 6;
      else score += 3;
      break;

    // — Speed control —
    case 'Speed Boost':
      if (spe <= 60) score += 7;
      else if (spe <= 90) score += 5;
      else score += 2;
      break;
    case 'Swift Swim':
      if (types.includes('Water')) score += 7;
      else return 0;
      break;
    case 'Chlorophyll':
      if (types.includes('Grass')) score += 7;
      else return 0;
      break;
    case 'Sand Rush':
      if (types.includes('Ground') || types.includes('Rock') || types.includes('Steel')) score += 6;
      else return 0;
      break;

    // — Weather setters — bias toward the type that benefits AND off-type that wants the weather —
    case 'Drizzle':
      if (types.includes('Water')) score += 7;
      else if (types.includes('Fire')) return 0; // hostile to type
      else score += 2;
      break;
    case 'Drought':
      if (types.includes('Fire')) score += 7;
      else if (types.includes('Water') || types.includes('Ice')) return 0;
      else score += 2;
      break;
    case 'Sand Stream':
      if (types.includes('Ground') || types.includes('Rock') || types.includes('Steel')) score += 7;
      else return 0;
      break;
    case 'Snow Warning':
      if (types.includes('Ice')) score += 7;
      else return 0;
      break;

    // — Terrain setters —
    case 'Electric Surge':
      if (types.includes('Electric')) score += 7;
      else return 0;
      break;
    case 'Grassy Surge':
      if (types.includes('Grass')) score += 7;
      else return 0;
      break;

    // — Damage amplifiers (move-gated) —
    case 'Skill Link':
      if (hasMultiHitMove(movePool)) score += 7; else return 0;
      break;
    case 'Strong Jaw':
      if (hasBitingMove(movePool)) score += 7; else return 0;
      break;
    case 'Mega Launcher':
      if (hasPulseMove(movePool)) score += 7; else return 0;
      break;
    case 'Punk Rock':
      if (hasSoundMove(movePool)) score += 7; else return 0;
      break;

    // — KO snowball + utility —
    case 'Beast Boost':
      score += 4;
      if (bst >= 540) score += 2;
      break;
    case 'Regenerator':
      if (bulky) score += 6;
      else score += 3;
      break;
  }
  return score;
}

// ─── Hand-curated overrides for thematic flavor ──────────────────────────────
const HAND_OVERRIDES = {
  // Kanto starters & their evos
  'Venusaur':    ['Huge Power', 'Drought', 'Magic Guard'],
  'Charizard':   ['Drought', 'Tough Claws', 'Adaptability'],
  'Blastoise':   ['Drizzle', 'Mega Launcher', 'Multiscale'],
  // Pseudo-legendaries — give them broken signatures
  'Dragonite':   ['Adaptability', 'Multiscale', 'Aerilate'],   // already has Multiscale legally — overlap filter will drop it
  'Tyranitar':   ['Sand Rush', 'Tough Claws', 'Adaptability'],
  'Salamence':   ['Aerilate', 'Adaptability', 'Tough Claws'],
  'Metagross':   ['Tough Claws', 'Adaptability', 'Magic Guard'],
  'Garchomp':    ['Sand Rush', 'Tough Claws', 'Sheer Force'],
  'Hydreigon':   ['Adaptability', 'Mega Launcher', 'Magic Guard'],
  'Goodra':      ['Drizzle', 'Adaptability', 'Regenerator'],
  'Kommo-o':     ['Punk Rock', 'Adaptability', 'Sheer Force'],
  'Dragapult':   ['Adaptability', 'Magic Guard', 'Speed Boost'],
  // Pikachu line
  'Pikachu':     ['Galvanize', 'Speed Boost', 'Magic Guard'],
  'Raichu':      ['Electric Surge', 'Galvanize', 'Speed Boost'],
  // Eeveelutions
  'Sylveon':     ['Pixilate', 'Magic Bounce', 'Adaptability'],
  'Vaporeon':    ['Drizzle', 'Adaptability', 'Regenerator'],
  'Jolteon':     ['Electric Surge', 'Galvanize', 'Magic Guard'],
  'Flareon':     ['Drought', 'Tough Claws', 'Adaptability'],
  'Espeon':      ['Magic Bounce', 'Speed Boost', 'Magic Guard'],
  'Umbreon':     ['Magic Bounce', 'Regenerator', 'Magic Guard'],
  'Leafeon':     ['Chlorophyll', 'Grassy Surge', 'Tough Claws'],
  'Glaceon':     ['Snow Warning', 'Refrigerate', 'Adaptability'],
  // Iconic legendaries
  'Mewtwo':      ['Magic Guard', 'Adaptability', 'Speed Boost'],
  'Mew':         ['Protean', 'Magic Guard', 'Adaptability'],
  'Rayquaza':    ['Aerilate', 'Adaptability', 'Tough Claws'],
  'Arceus':      ['Adaptability', 'Magic Guard', 'Multiscale'],
  // Memes & fan favorites
  'Magikarp':    ['Huge Power', 'Speed Boost', 'Adaptability'],
  'Shedinja':    ['Magic Guard', 'Magic Bounce', 'Speed Boost'], // already has Wonder Guard legally
  'Sunkern':     ['Huge Power', 'Chlorophyll', 'Speed Boost'],
  'Smeargle':    ['Magic Guard', 'Speed Boost', 'Protean'],
  'Ditto':       ['Magic Guard', 'Speed Boost', 'Adaptability'],
};

// ─── Generate ────────────────────────────────────────────────────────────────
const output = {};
let processed = 0, skippedForme = 0, skippedVaried = 0, fullyAssigned = 0, underfilled = 0;

const sortedKeys = Object.keys(SPECIES).sort();
for (const speciesKey of sortedKeys) {
  const entry = SPECIES[speciesKey];
  if (!entry || !entry.name) continue;
  processed++;

  if (isExcludedForme(entry)) { skippedForme++; continue; }

  const displayName = entry.name;
  const currentPool = currentAbilityPool(displayName, entry);
  // legalSlots = the species' own legal abilities (slots 0/1/H). The loadout
  // editor shows these PLUS the Awaken picks — it does NOT show the off-format
  // abilities that appear only in CSV builds — so the Awaken target must be
  // sized against the legal slot count, not the (CSV-inflated) currentPool, or
  // a mon like Garchomp (2 legal slots, several CSV abilities) lands at 6.
  const legalSlots = new Set(Object.values(entry.abilities || {}).filter(Boolean));

  // Awaken now applies to EVERY species (no >5-ability skip) — illegal-but-
  // fitting abilities, unlocked in the Dojo at City 6+. Give enough picks to
  // bring legal slots + Awaken to at least 7 options, with a floor of 4 so
  // ability-rich mons still receive a meaningful, diverse Awaken selection.
  const TARGET = Math.max(4, 7 - Math.min(legalSlots.size, 3));

  const movePool = speciesMovePool(displayName, entry);

  // Score each OP candidate, exclude ones already in the current pool
  const scored = [];
  for (const ab of OP_30) {
    if (currentPool.has(ab)) continue;
    const s = scoreAbility(ab, entry, movePool);
    if (s > 0) scored.push({ ab, s });
  }
  // Sort by score desc, then alpha for deterministic output
  scored.sort((a, b) => b.s - a.s || a.ab.localeCompare(b.ab));

  // Bucket-based picker that enforces variety across roles. Without this,
  // physical attackers stack Huge Power + Pure Power + Tough Claws — three
  // versions of the same buff. We pick at most one from each role bucket.
  const ROLE = {
    'Huge Power': 'multiplier', 'Pure Power': 'multiplier',
    'Sheer Force': 'multiplier', 'Adaptability': 'multiplier',
    'Tough Claws': 'multiplier',
    'Protean': 'conversion',
    'Pixilate': 'conversion', 'Aerilate': 'conversion',
    'Refrigerate': 'conversion', 'Galvanize': 'conversion',
    'Wonder Guard': 'defense', 'Multiscale': 'defense',
    'Magic Guard': 'defense', 'Magic Bounce': 'defense',
    'Speed Boost': 'speed', 'Swift Swim': 'speed',
    'Chlorophyll': 'speed', 'Sand Rush': 'speed',
    'Drizzle': 'weather', 'Drought': 'weather',
    'Sand Stream': 'weather', 'Snow Warning': 'weather',
    'Electric Surge': 'terrain', 'Grassy Surge': 'terrain',
    'Skill Link': 'amp', 'Strong Jaw': 'amp',
    'Mega Launcher': 'amp', 'Punk Rock': 'amp',
    'Beast Boost': 'utility', 'Regenerator': 'utility',
  };
  // First pass: one per role for thematic spread (offense / defense / speed /
  // weather / terrain / amp / utility) — keeps a mon's Awaken set diverse
  // rather than three flavours of the same boost.
  const usedRoles = new Set();
  let picks = [];
  for (const x of scored) {
    if (picks.length >= TARGET) break;
    const role = ROLE[x.ab];
    if (usedRoles.has(role)) continue;
    picks.push(x.ab);
    usedRoles.add(role);
  }
  // Second pass: once every role is represented, fill toward TARGET from the
  // remaining positive-fit picks (allows a second pick from a role).
  if (picks.length < TARGET) {
    for (const x of scored) {
      if (picks.length >= TARGET) break;
      if (!picks.includes(x.ab)) picks.push(x.ab);
    }
  }

  // Apply hand-curated override (drops any picks already in current pool / off-list)
  if (HAND_OVERRIDES[displayName]) {
    const filtered = HAND_OVERRIDES[displayName].filter(a => !currentPool.has(a) && OP_30.includes(a));
    // Top up with the bucket-picked list if override has < TARGET valid entries
    for (const ab of picks) {
      if (filtered.length >= TARGET) break;
      if (!filtered.includes(ab)) filtered.push(ab);
    }
    picks = filtered.slice(0, TARGET);
  }

  // Final fill — pad toward TARGET from the curated 30 (universals first,
  // then anything left) so every mon reaches its target Awaken count even if
  // few abilities scored a positive thematic fit.
  if (picks.length < TARGET) {
    const fillOrder = ['Regenerator', 'Magic Guard', 'Adaptability', 'Sheer Force',
                       'Magic Bounce', 'Beast Boost', 'Multiscale', 'Protean',
                       'Speed Boost', 'Tough Claws', 'Sand Rush', 'Drought', 'Drizzle'];
    for (const u of fillOrder) {
      if (picks.length >= TARGET) break;
      if (!picks.includes(u) && !currentPool.has(u)) picks.push(u);
    }
    for (const u of OP_30) {
      if (picks.length >= TARGET) break;
      if (!picks.includes(u) && !currentPool.has(u)) picks.push(u);
    }
    underfilled++;
  }

  if (picks.length) {
    output[displayName] = picks;
    fullyAssigned++;
  }
}

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');

console.log(`[gen-op-abilities] processed ${processed} species`);
console.log(`  skipped (Mega/Gmax/Primal/Eternamax/Ultra forme): ${skippedForme}`);
console.log(`  skipped (already has >5 current abilities):      ${skippedVaried}`);
console.log(`  assigned (4-6 Awaken picks → 7+ total):          ${fullyAssigned}`);
console.log(`  underfilled (filled with universals):            ${underfilled}`);
console.log(`  output:  ${OUT_PATH}`);
