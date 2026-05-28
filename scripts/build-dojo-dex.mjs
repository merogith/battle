#!/usr/bin/env node
// Build the "Dojo Dex" — per-species moves (by source) + abilities (Basic /
// Hidden / Awakened) for every non-excluded species. Two artefacts:
//   • docs/dojo-dex/dex.json — full machine-readable record
//   • docs/dojo-dex/README.md + gen{1..9}.md — human-browsable summary
//
// Source taxonomy for moves comes from @pkmn/data learnset codes:
//   L = Level-up · M = TM/HM/TR · E = Egg · T = Tutor · S = Event · V = Transfer
//
// Awakened classification mirrors the runtime _dojoAbilityUnlockStage:
//   • Curated picks from data/op-abilities.json (gen-op-abilities.mjs author).
//   • Off-legal Smogon picks — abilities present in the species' CSV builds
//     that aren't in the species' legal slot set (0/1/H).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'dojo-dex');
fs.mkdirSync(OUT_DIR, { recursive: true });

const speciesAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'species.json'), 'utf8'));
const opAbilities = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'op-abilities.json'), 'utf8'));
const buildsCsv = fs.readFileSync(path.join(ROOT, 'data', 'builds.csv'), 'utf8');

const SPECIES = speciesAll['9'];
const KEY = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const gens = new Generations(Dex);
const g9 = gens.get(9);

// ─── Forme filter — mirrors gen-op-abilities.mjs ─────────────────────────────
const EXCLUDE_FORME = /\b(Mega|Primal|Gmax|Eternamax|Ultra)\b/i;
function isExcludedForme(entry) {
  return EXCLUDE_FORME.test(entry.forme || '');
}

// ─── Parse builds.csv: per-display-name aggregated moves + abilities + formats ─
const lines = buildsCsv.split(/\r?\n/);
const header = lines[0].replace(/^﻿/, '').split(',');
const idx = (c) => header.indexOf(c);
const COL = {
  name: idx('name'), ability: idx('ability'), gen: idx('gen'),
  format: idx('format'), category: idx('category'),
  m1: idx('move1'), m2: idx('move2'), m3: idx('move3'), m4: idx('move4'),
};

// monName -> { abilities:Set<string>, movesByFormat:Map<format,Set<string>> }
const csv = new Map();
for (let i = 1; i < lines.length; i++) {
  const ln = lines[i]; if (!ln) continue;
  const cells = ln.split(',');
  const name = cells[COL.name]; if (!name) continue;
  const fmt = cells[COL.format] || '';
  const ab = (cells[COL.ability] || '').trim();
  if (!csv.has(name)) csv.set(name, { abilities: new Set(), movesByFormat: new Map() });
  const rec = csv.get(name);
  // ability cell may be pipe-separated alternatives — keep each as a candidate.
  if (ab) for (const a of ab.split('|')) { const t = a.trim(); if (t) rec.abilities.add(t); }
  if (!rec.movesByFormat.has(fmt)) rec.movesByFormat.set(fmt, new Set());
  const mset = rec.movesByFormat.get(fmt);
  for (const slot of [cells[COL.m1], cells[COL.m2], cells[COL.m3], cells[COL.m4]]) {
    if (!slot) continue;
    for (const m of slot.split('/')) { const t = m.trim(); if (t && t !== 'Tackle') mset.add(t); }
  }
}

// Union the CSV abilities for a display mon across its baseSpecies / changesFrom
// (mirrors the runtime _tutorGetPoolForMon ability accumulation).
function csvUnionFor(entry) {
  const s = new Set(), m = new Set();
  const add = (n) => {
    const r = csv.get(n); if (!r) return;
    for (const a of r.abilities) s.add(a);
    for (const mset of r.movesByFormat.values()) for (const x of mset) m.add(x);
  };
  add(entry.name);
  if (entry.baseSpecies && entry.baseSpecies !== entry.name) add(entry.baseSpecies);
  if (entry.changesFrom && entry.changesFrom !== entry.name) add(entry.changesFrom);
  return { abilities: s, smogonMoves: m };
}

// ─── Move-source categoriser ─────────────────────────────────────────────────
// Each learnset entry is a code like "9L1" / "8M" / "7E" / "6T" / "5S3" / "8V".
// Return a primary category for display (priority: Level > TM > Egg > Tutor > Event > Transfer).
const CAT_ORDER = ['Level-up', 'TM/HM', 'Egg', 'Tutor', 'Event', 'Transfer'];
function categoriseSource(code) {
  // <gen><letter>[<n>]
  const ch = code[1]; // letter
  if (ch === 'L') return 'Level-up';
  if (ch === 'M') return 'TM/HM';
  if (ch === 'E') return 'Egg';
  if (ch === 'T') return 'Tutor';
  if (ch === 'S') return 'Event';
  if (ch === 'V') return 'Transfer';
  return 'Other';
}
function pickPrimaryCategory(codes) {
  let best = 99;
  for (const c of codes) {
    const cat = categoriseSource(c);
    const idx = CAT_ORDER.indexOf(cat);
    if (idx >= 0 && idx < best) best = idx;
  }
  return best === 99 ? 'Other' : CAT_ORDER[best];
}

// ─── Resolve a display name to a @pkmn species + learnset (any gen it appears) ─
async function resolveLearnset(displayName) {
  for (let gn = 9; gn >= 1; gn--) {
    const g = gens.get(gn);
    let sp = null;
    try { sp = g.species.get(displayName); } catch (e) {}
    if (!sp) continue;
    let ls = null;
    try { ls = await g.learnsets.get(displayName); } catch (e) {}
    if (ls && ls.learnset) return { gen: gn, species: sp, learnset: ls.learnset };
    // Some forms inherit from base — fall through and try base in the same gen.
    if (sp.baseSpecies && sp.baseSpecies !== sp.name) {
      try { ls = await g.learnsets.get(sp.baseSpecies); } catch (e) {}
      if (ls && ls.learnset) return { gen: gn, species: sp, learnset: ls.learnset };
    }
  }
  return null;
}

// ─── Build per-species record ────────────────────────────────────────────────
async function buildRecord(name, entry) {
  const slots = entry.abilities || {};
  const basic = [];
  if (slots['0']) basic.push(slots['0']);
  if (slots['1']) basic.push(slots['1']);
  const hidden = slots['H'] || null;
  const legalSet = new Set([...basic, ...(hidden ? [hidden] : [])]);
  // Form base / changesFrom contribute legal slots too (runtime pool does this).
  for (const ref of [entry.baseSpecies, entry.changesFrom]) {
    if (!ref || ref === name) continue;
    const ent = SPECIES[KEY(ref)];
    if (!ent || !ent.abilities) continue;
    for (const k of Object.keys(ent.abilities)) { const a = ent.abilities[k]; if (a) legalSet.add(a); }
  }

  const curated = (opAbilities[name] || []).slice();
  const csvUnion = csvUnionFor(entry);
  const offLegal = [...csvUnion.abilities].filter(a => a && !legalSet.has(a) && !curated.includes(a)).sort();
  const awakenAll = [...new Set([...curated, ...offLegal])];

  const types = (entry.types || []).slice();
  const bs = entry.baseStats || {};
  const bst = ['hp','atk','def','spa','spd','spe'].reduce((s,k) => s + ((bs[k]|0)), 0);

  // Learnset (also gives us the species' @pkmn record for fields species.json omits, like `gen`)
  const res = await resolveLearnset(name);
  const dexGen = (res && res.species && (res.species.gen | 0)) || 0;
  const movesByName = new Map();   // move -> { sources:string[], cat:string }
  if (res && res.learnset) {
    for (const moveKey of Object.keys(res.learnset)) {
      const codes = res.learnset[moveKey] || [];
      // Resolve display name — gen 9 dropped many moves (Cut, Flash, Captivate,
      // Hidden Power, …), so walk older gens until one knows the move.
      let display = moveKey;
      for (let gn = 9; gn >= 1; gn--) {
        try {
          const md = gens.get(gn).moves.get(moveKey);
          if (md && md.name) { display = md.name; break; }
        } catch (e) {}
      }
      const cat = pickPrimaryCategory(codes);
      movesByName.set(display, { sources: codes.slice(), cat });
    }
  }
  // Smogon-only moves (in CSV but not in the learnset map)
  const learnsetNames = new Set(movesByName.keys());
  const smogonByFormat = new Map();
  const ownCsv = csv.get(name);
  const collectFormats = (rec) => {
    if (!rec) return;
    for (const [fmt, mset] of rec.movesByFormat.entries()) {
      if (!fmt) continue;
      if (!smogonByFormat.has(fmt)) smogonByFormat.set(fmt, new Set());
      const dst = smogonByFormat.get(fmt);
      for (const m of mset) dst.add(m);
    }
  };
  collectFormats(ownCsv);
  // Form variants get the base's competitive sets if they have none of their own.
  if (!ownCsv || ownCsv.movesByFormat.size === 0) {
    if (entry.baseSpecies && csv.get(entry.baseSpecies)) collectFormats(csv.get(entry.baseSpecies));
    if (entry.changesFrom && csv.get(entry.changesFrom)) collectFormats(csv.get(entry.changesFrom));
  }
  const smogonOnly = new Set();
  for (const mset of smogonByFormat.values()) for (const m of mset) if (!learnsetNames.has(m)) smogonOnly.add(m);

  // Aggregate moves by category
  const movesByCat = {};
  for (const c of CAT_ORDER) movesByCat[c] = [];
  for (const [n, info] of movesByName.entries()) {
    if (!movesByCat[info.cat]) movesByCat[info.cat] = [];
    movesByCat[info.cat].push(n);
  }
  for (const c of Object.keys(movesByCat)) movesByCat[c].sort();
  const smogonFormatMap = {};
  for (const [fmt, set] of smogonByFormat.entries()) smogonFormatMap[fmt] = [...set].sort();

  return {
    name,
    num: entry.num | 0,
    gen: (entry.gen | 0) || dexGen,
    types,
    bst,
    forme: entry.forme || null,
    baseSpecies: entry.baseSpecies || null,
    abilities: {
      basic,
      hidden,
      awakened: {
        curated,
        offLegal,
        all: awakenAll,
        count: awakenAll.length,
      },
    },
    moves: {
      bySource: movesByCat,
      smogonByFormat: smogonFormatMap,
      smogonOnly: [...smogonOnly].sort(),
      totalUnique: movesByName.size + smogonOnly.size,
    },
    _movesDetail: Object.fromEntries(movesByName),  // move -> { sources, cat }
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log('[dojo-dex] building…');
const records = [];
const sortedKeys = Object.keys(SPECIES).sort();
let done = 0;
for (const k of sortedKeys) {
  const entry = SPECIES[k];
  if (!entry || !entry.name) continue;
  if (isExcludedForme(entry)) continue;
  const rec = await buildRecord(entry.name, entry);
  records.push(rec);
  done++;
  if (done % 100 === 0) console.log(`  ${done} / ${sortedKeys.length}…`);
}
console.log(`[dojo-dex] processed ${records.length} species`);

// JSON output (compact: drop _movesDetail's source codes into a flatter shape)
const json = {};
for (const r of records) {
  json[r.name] = {
    num: r.num, gen: r.gen, types: r.types, bst: r.bst,
    forme: r.forme, baseSpecies: r.baseSpecies,
    abilities: r.abilities,
    moves: {
      bySource: r.moves.bySource,
      smogonByFormat: r.moves.smogonByFormat,
      smogonOnly: r.moves.smogonOnly,
      totalUnique: r.moves.totalUnique,
      // Per-move source codes (compact: comma-joined)
      sourceCodes: Object.fromEntries(
        Object.entries(r._movesDetail).map(([m, info]) => [m, info.sources.join(',')])
      ),
    },
  };
}
fs.writeFileSync(path.join(OUT_DIR, 'dex.json'), JSON.stringify(json, null, 1));
console.log(`  wrote dex.json (${(fs.statSync(path.join(OUT_DIR, 'dex.json')).size/1024).toFixed(1)} KB)`);

// Markdown per-gen
const byGen = new Map();
for (const r of records) {
  const g = r.gen || 0;
  if (!byGen.has(g)) byGen.set(g, []);
  byGen.get(g).push(r);
}
for (const arr of byGen.values()) arr.sort((a, b) => a.num - b.num || a.name.localeCompare(b.name));

function speciesMd(r) {
  const types = r.types.length ? r.types.join('/') : '?';
  const ab = r.abilities;
  const awCount = ab.awakened.count;
  const awList = ab.awakened.all.length ? ab.awakened.all.join(', ') : '—';
  const hidden = ab.hidden || '—';
  const basic = ab.basic.length ? ab.basic.join(', ') : '—';
  const curatedTag = ab.awakened.curated.length ? `curated: ${ab.awakened.curated.join(', ')}` : '';
  const offLegalTag = ab.awakened.offLegal.length ? `off-legal: ${ab.awakened.offLegal.join(', ')}` : '';
  const awBreakdown = [curatedTag, offLegalTag].filter(Boolean).join(' · ');
  const forme = r.forme ? ` *(${r.forme})*` : '';
  const lines = [];
  lines.push(`### #${String(r.num).padStart(3,'0')} ${r.name}${forme} · ${types} · BST ${r.bst}`);
  lines.push(`**Abilities** · Basic: ${basic} · Hidden: ${hidden} · **Awakened (${awCount}):** ${awList}`);
  if (awBreakdown) lines.push(`  · ${awBreakdown}`);
  // Moves
  const cats = CAT_ORDER.filter(c => (r.moves.bySource[c] || []).length);
  lines.push(`**Moves (${r.moves.totalUnique})**`);
  for (const c of cats) {
    const moves = r.moves.bySource[c];
    lines.push(`- **${c}** (${moves.length}): ${moves.join(', ')}`);
  }
  const fmts = Object.keys(r.moves.smogonByFormat).filter(f => f).sort();
  if (fmts.length) {
    const fmtLines = fmts.map(f => `${f}: ${r.moves.smogonByFormat[f].join(', ')}`);
    lines.push(`- **Smogon sets** — ${fmtLines.join(' · ')}`);
  }
  if (r.moves.smogonOnly.length) {
    lines.push(`- **Smogon-only** (not in any gen's learnset): ${r.moves.smogonOnly.join(', ')}`);
  }
  return lines.join('\n');
}

for (const [g, arr] of byGen.entries()) {
  if (!arr.length) continue;
  const md = [
    `# Dojo Dex · Generation ${g}`,
    ``,
    `${arr.length} species. Awakened picks unlock at the Battle Dojo's Grandmaster tier (City 8+).`,
    `Curated picks come from \`data/op-abilities.json\`; off-legal picks are Smogon-set abilities that aren't in any legal slot.`,
    ``,
    ...arr.map(speciesMd),
  ].join('\n\n');
  fs.writeFileSync(path.join(OUT_DIR, `gen${g}.md`), md);
}
console.log(`  wrote per-gen markdown for gens ${[...byGen.keys()].sort((a,b)=>a-b).join(', ')}`);

// README — index + quality flags
const under3 = records.filter(r => r.abilities.awakened.count < 3);
const at3 = records.filter(r => r.abilities.awakened.count === 3);
const ge4 = records.filter(r => r.abilities.awakened.count >= 4);
const noOff = records.filter(r => r.abilities.awakened.offLegal.length === 0).length;
const withOff = records.length - noOff;

// Distribution of awakened count
const dist = new Map();
for (const r of records) {
  const c = r.abilities.awakened.count;
  dist.set(c, (dist.get(c) || 0) + 1);
}
const distRows = [...dist.entries()].sort((a, b) => a[0] - b[0])
  .map(([c, n]) => `| ${c} | ${n} |`).join('\n');

const iconicNames = [
  'Bulbasaur','Venusaur','Charizard','Blastoise','Pikachu','Raichu','Eevee','Sylveon','Snorlax',
  'Dragonite','Mewtwo','Mew','Tyranitar','Salamence','Metagross','Garchomp','Hydreigon','Goodra',
  'Greninja','Sceptile','Blaziken','Swampert','Lucario','Gengar','Alakazam','Gyarados','Gardevoir',
  'Excadrill','Ferrothorn','Aegislash','Hoopa','Magikarp','Smeargle','Ditto','Shedinja','Sunkern',
  'Decidueye','Incineroar','Primarina','Mimikyu','Toxapex','Tapu Koko','Cinderace','Rillaboom',
  'Inteleon','Corviknight','Dragapult','Zacian','Eternatus',
];
const iconicRecs = records.filter(r => iconicNames.includes(r.name)).sort((a,b)=>a.num-b.num);
const iconicMd = iconicRecs.map(r => {
  const ab = r.abilities;
  const aw = ab.awakened.all.join(', ') || '—';
  return `- **${r.name}** (${r.types.join('/')}) — Basic: ${ab.basic.join(', ') || '—'} · Hidden: ${ab.hidden || '—'} · **Awakened (${ab.awakened.count}):** ${aw}`;
}).join('\n');

const readme = `# Dojo Dex

Auto-generated by \`scripts/build-dojo-dex.mjs\`. For each non-excluded species
(no Mega / Primal / Gmax / Eternamax / Ultra formes), lists every move with its
source category and every ability classified as Basic / Hidden / Awakened.

- \`dex.json\` — full machine-readable data (compact source codes per move).
- \`gen{1..9}.md\` — human-browsable per-generation listings.
- This file — summary + quality review for the Awakened picks.

## Coverage

- **${records.length}** species covered.
- Species at **≥ 4** Awakened: ${ge4.length} · at exactly **3**: ${at3.length} · **below 3**: ${under3.length}
- Species with off-legal Smogon picks adding to the Awakened pool: **${withOff}**
- Species relying only on curated picks: **${noOff}**

Awakened-count distribution:

| count | species |
|---:|---:|
${distRows}

## Battle Dojo tier reminder

| Tier | Stage | Items shown | Abilities shown | Cost (basic / hidden / awakened) |
|---|---|---|---|---|
| L1 · White Belt | City 2 | Berries (unlocked); higher tiers locked | Basic (unlocked); Hidden + Awakened **shown locked** | 2 000 G · — · — |
| L2 · Black Belt | City 5 | Berries + decent staples; best items locked | Basic + Hidden (unlocked); Awakened **shown locked** | 2 000 G · 3 000 G · — |
| L3 · Grandmaster | City 8 | All items | All abilities | 2 000 G · 3 000 G · 5 000 G |

## Spot-checks on iconic species

${iconicMd || '_(no matches)_'}

## Sub-3-Awakened species (none expected)

${under3.length ? under3.map(r => `- ${r.name}: ${r.abilities.awakened.all.join(', ') || '—'}`).join('\n') : '_None — every species clears the ≥ 3 Awakened floor._'}
`;

fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme);
console.log(`  wrote README.md`);
console.log('[dojo-dex] done.');
