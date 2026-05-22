#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');
const DATA = join(REPO, 'data');

function loadJsonByGen(filename) {
  const obj = JSON.parse(readFileSync(join(DATA, filename), 'utf8'));
  const flat = {};
  for (const gen of Object.keys(obj)) {
    for (const key of Object.keys(obj[gen])) {
      const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      flat[norm] = { gen, key, entry: obj[gen][key] };
    }
  }
  return flat;
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function loadBuilds() {
  const dir = join(DATA, 'builds');
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const species of Object.keys(data)) {
      const tierObj = data[species];
      for (const tier of Object.keys(tierObj)) {
        const buildSet = tierObj[tier];
        if (typeof buildSet !== 'object' || buildSet === null) continue;
        for (const buildName of Object.keys(buildSet)) {
          const b = buildSet[buildName];
          if (!b || typeof b !== 'object') continue;
          out.push({
            file: `data/builds/${f}`,
            species,
            tier,
            buildName,
            moves: Array.isArray(b.moves) ? b.moves : [],
            ability: b.ability,
            item: b.item,
            nature: b.nature,
          });
        }
      }
    }
  }
  return out;
}

function expandMoveOptions(moves) {
  const out = [];
  for (const slot of moves) {
    if (Array.isArray(slot)) {
      for (const m of slot) out.push(m);
    } else if (typeof slot === 'string') {
      out.push(slot);
    }
  }
  return out;
}

function expandCommaAlternatives(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(expandCommaAlternatives);
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}

function validate() {
  const moves = loadJsonByGen('moves.json');
  const species = loadJsonByGen('species.json');
  const abilities = loadJsonByGen('abilities.json');
  const items = loadJsonByGen('items.json');
  const natures = loadJsonByGen('natures.json');
  const builds = loadBuilds();

  const findings = [];

  const missingMoves = new Map();
  const missingSpecies = new Map();
  const missingAbilities = new Map();
  const missingItems = new Map();
  const missingNatures = new Map();
  let commaAlternativeFields = 0;

  for (const b of builds) {
    if (!species[norm(b.species)]) {
      missingSpecies.set(b.species, (missingSpecies.get(b.species) || []).concat([b]));
    }
    for (const m of expandMoveOptions(b.moves)) {
      for (const choice of expandCommaAlternatives(m)) {
        if (!moves[norm(choice)]) {
          const existing = missingMoves.get(choice) || [];
          if (existing.length < 5) existing.push(b);
          missingMoves.set(choice, existing);
        }
      }
    }
    for (const field of ['ability', 'item', 'nature']) {
      const raw = b[field];
      if (!raw) continue;
      const alternatives = expandCommaAlternatives(raw);
      if (alternatives.length > 1) commaAlternativeFields++;
      const target = field === 'ability' ? abilities : field === 'item' ? items : natures;
      const missing = field === 'ability' ? missingAbilities : field === 'item' ? missingItems : missingNatures;
      for (const alt of alternatives) {
        // "No Item" is the engine-wide sentinel for the empty held-item slot
        // (battle.html:9322 converts it to 'NO_ITEM'; getItemDisplay returns
        // it as the fallback when mon.item is null). Skip it during validation.
        if (field === 'item' && alt === 'No Item') continue;
        if (!target[norm(alt)]) {
          missing.set(alt, (missing.get(alt) || []).concat([b]));
        }
      }
    }
  }

  if (commaAlternativeFields > 0) {
    findings.push({
      severity: 'P2',
      category: 'inconsistency',
      title: `Build alternative format is inconsistent — moves use array literals, ability/item/nature use comma-separated strings (${commaAlternativeFields} occurrences)`,
      anchor: 'data/builds/gen*.json schema',
      examples: ['e.g., \`"item": "Choice Specs,Choice Scarf,Life Orb"\` vs \`"moves": [["Knock Off", "Sucker Punch"]]\` — pick one alternative-encoding pattern and migrate the other.'],
    });
  }

  if (missingMoves.size > 0) {
    findings.push({
      severity: missingMoves.size > 50 ? 'P1' : 'P2',
      category: 'data',
      title: `${missingMoves.size} moves referenced by builds are missing from moves.json`,
      anchor: 'data/builds → data/moves.json',
      examples: [...missingMoves.entries()].slice(0, 8).map(([m, refs]) => `\`${m}\` (used by ${refs.length} build(s), e.g., ${refs[0].species}/${refs[0].tier}/${refs[0].buildName})`),
    });
  }
  if (missingSpecies.size > 0) {
    findings.push({
      severity: 'P0',
      category: 'data',
      title: `${missingSpecies.size} species referenced by builds are missing from species.json`,
      anchor: 'data/builds → data/species.json',
      examples: [...missingSpecies.entries()].slice(0, 8).map(([s, refs]) => `\`${s}\` (${refs.length} build(s))`),
    });
  }
  if (missingAbilities.size > 0) {
    findings.push({
      severity: 'P1',
      category: 'data',
      title: `${missingAbilities.size} abilities referenced by builds are missing from abilities.json`,
      anchor: 'data/builds → data/abilities.json',
      examples: [...missingAbilities.entries()].slice(0, 8).map(([a, refs]) => `\`${a}\` (${refs.length} build(s))`),
    });
  }
  if (missingItems.size > 0) {
    findings.push({
      severity: 'P1',
      category: 'data',
      title: `${missingItems.size} items referenced by builds are missing from items.json`,
      anchor: 'data/builds → data/items.json',
      examples: [...missingItems.entries()].slice(0, 8).map(([i, refs]) => `\`${i}\` (${refs.length} build(s))`),
    });
  }
  if (missingNatures.size > 0) {
    findings.push({
      severity: 'P1',
      category: 'data',
      title: `${missingNatures.size} natures referenced by builds are missing from natures.json`,
      anchor: 'data/builds → data/natures.json',
      examples: [...missingNatures.entries()].slice(0, 8).map(([n, refs]) => `\`${n}\` (${refs.length} build(s))`),
    });
  }

  const stats = {
    moves: Object.keys(moves).length,
    species: Object.keys(species).length,
    abilities: Object.keys(abilities).length,
    items: Object.keys(items).length,
    natures: Object.keys(natures).length,
    builds: builds.length,
  };

  return { findings, stats };
}

function render({ findings, stats }) {
  const ts = new Date().toISOString();
  const out = [];
  out.push('# Data Integrity Report');
  out.push('');
  out.push(`> Generated: ${ts}`);
  out.push(`> Source: \`node scripts/debug/data-validator.mjs\``);
  out.push('');
  out.push('## Inputs scanned');
  out.push('');
  out.push('| File | Entries |');
  out.push('|---|---|');
  out.push(`| moves.json | ${stats.moves} |`);
  out.push(`| species.json | ${stats.species} |`);
  out.push(`| abilities.json | ${stats.abilities} |`);
  out.push(`| items.json | ${stats.items} |`);
  out.push(`| natures.json | ${stats.natures} |`);
  out.push(`| builds (flattened) | ${stats.builds} |`);
  out.push('');
  out.push('## Findings');
  out.push('');
  if (findings.length === 0) {
    out.push('_No data-integrity issues found._');
  } else {
    for (const f of findings) {
      out.push(`### [${f.severity}] ${f.title}`);
      out.push('');
      out.push(`- **Where**: ${f.anchor}`);
      out.push(`- **Examples**:`);
      for (const ex of f.examples) out.push(`  - ${ex}`);
      out.push('');
    }
  }
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validate();
  const md = render(result);
  const reportsDir = join(REPO, 'tests', 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = join(reportsDir, 'data-integrity.md');
  writeFileSync(outPath, md);
  console.log(`[data-validator] wrote ${outPath} — ${result.findings.length} findings (scanned ${result.stats.builds} builds)`);
  process.exit(result.findings.some(f => f.severity === 'P0') ? 1 : 0);
}

export { validate };
