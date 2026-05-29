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
      // Only count CSV-encoded alternatives — a string with an actual comma.
      // Array alternatives are the canonical schema; flagging them was a
      // false-positive that produced a phantom 6925-occurrence "inconsistency".
      if (typeof raw === 'string' && raw.includes(',')) commaAlternativeFields++;
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

  // Data-driven files added by the Wave 5 extraction series. Each validator
  // appends to `findings` and contributes a stat entry so the report covers
  // the full editable-data surface.
  validateDialogue(findings, stats);
  validateTypeChart(findings, stats);
  validateBallMath(findings, stats);
  validateShops(findings, stats);

  return { findings, stats };
}

// ──────────────────────────────────────────────────────────────────────────
// Wave 5 data-file validators. Cheap shape/non-empty checks — catches the
// "I just committed an empty JSON" class of bug + obvious malformed entries.
// Not a behavioral check: doesn't simulate gameplay, just structure.
// ──────────────────────────────────────────────────────────────────────────

function _readJson(rel) {
  const p = join(REPO, rel);
  if (!existsSync(p)) return { _missing: true, _path: rel };
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    return { _parseError: e.message, _path: rel };
  }
}

const DIALOGUE_FILES = [
  // [path, expected shape ('object' or 'array'), min entries, sample-key (optional)]
  ['data/dialogue/leader-victory-lines.json',     'object', 60,  'Brock'],
  ['data/dialogue/leader-badge-reflections.json', 'object', 60,  'Brock'],
  ['data/dialogue/elite-victory-lines.json',      'object', 25,  'Lorelei'],
  ['data/dialogue/champion-victory-lines.json',   'object', 10,  'Blue'],
  ['data/dialogue/trainer-quotes.json',           'object', 10,  'Basic Trainer'],
  ['data/dialogue/trainer-quotes-by-name.json',   'object', 100, 'Brock'],
  ['data/dialogue/city-guide-quotes.json',        'array',  12,  null],
];

function validateDialogue(findings, stats) {
  stats.dialogueFiles = DIALOGUE_FILES.length;
  let totalEntries = 0;
  for (const [path, shape, minSize, sampleKey] of DIALOGUE_FILES) {
    const v = _readJson(path);
    if (v._missing) {
      findings.push({
        severity: 'P1', category: 'data',
        title: `Dialogue file missing: ${path}`,
        anchor: path,
        examples: [`battle.html's loadGameData fetches this; missing file leaves the pool empty in-game.`],
      });
      continue;
    }
    if (v._parseError) {
      findings.push({
        severity: 'P0', category: 'data',
        title: `Dialogue file is malformed JSON: ${path}`,
        anchor: path,
        examples: [v._parseError],
      });
      continue;
    }
    const isArray = Array.isArray(v);
    const expectedArray = shape === 'array';
    if (isArray !== expectedArray) {
      findings.push({
        severity: 'P1', category: 'data',
        title: `Dialogue file has wrong shape (expected ${shape}): ${path}`,
        anchor: path,
        examples: [`got ${isArray ? 'array' : typeof v}`],
      });
      continue;
    }
    const size = isArray ? v.length : Object.keys(v).length;
    totalEntries += size;
    if (size < minSize) {
      findings.push({
        severity: 'P2', category: 'data',
        title: `Dialogue file under-populated: ${path} has ${size} entries (expected ≥${minSize})`,
        anchor: path,
        examples: [`Recently shrunk? Check the source CSV or extraction tooling.`],
      });
    }
    if (sampleKey && !v[sampleKey]) {
      findings.push({
        severity: 'P2', category: 'data',
        title: `Dialogue file missing canonical key "${sampleKey}": ${path}`,
        anchor: path,
        examples: [`Expected key based on existing canon — was it renamed or removed?`],
      });
    }
    // Empty-string entries flag a likely paste error.
    if (!isArray) {
      const empties = Object.entries(v).filter(([_, val]) => typeof val === 'string' && val.trim() === '');
      if (empties.length) {
        findings.push({
          severity: 'P2', category: 'data',
          title: `Dialogue file has ${empties.length} empty-string entries: ${path}`,
          anchor: path,
          examples: empties.slice(0, 5).map(([k]) => `\`${k}\` has empty string`),
        });
      }
    }
  }
  stats.dialogueEntries = totalEntries;
}

const VALID_TYPES = new Set([
  'Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
  'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy','???'
]);
const VALID_MULTS = new Set([0, 0.25, 0.5, 1, 2, 4]);

function validateTypeChart(findings, stats) {
  const tc = _readJson('data/type-chart.json');
  if (tc._missing || tc._parseError) {
    findings.push({
      severity: 'P0', category: 'data',
      title: `data/type-chart.json: ${tc._missing ? 'missing' : 'malformed JSON'}`,
      anchor: 'data/type-chart.json',
      examples: [tc._parseError || 'file does not exist'],
    });
    stats.typeChartAttackers = 0;
    return;
  }
  stats.typeChartAttackers = Object.keys(tc).length;
  // Every standard type should be an attacker key
  const missingAttackers = [...VALID_TYPES].filter(t => !(t in tc));
  if (missingAttackers.length) {
    findings.push({
      severity: 'P1', category: 'data',
      title: `Type chart missing attacker entries: ${missingAttackers.join(', ')}`,
      anchor: 'data/type-chart.json',
      examples: missingAttackers.map(t => `\`${t}\` has no row — defaults to neutral 1× vs all defenders`),
    });
  }
  // Defender types and multipliers
  const badMults = [];
  const unknownTypes = [];
  for (const atk of Object.keys(tc)) {
    if (!VALID_TYPES.has(atk)) unknownTypes.push(`attacker "${atk}"`);
    const row = tc[atk];
    if (!row || typeof row !== 'object') continue;
    for (const def of Object.keys(row)) {
      if (!VALID_TYPES.has(def)) unknownTypes.push(`${atk}→"${def}"`);
      if (!VALID_MULTS.has(row[def])) badMults.push(`${atk}→${def} = ${row[def]}`);
    }
  }
  if (unknownTypes.length) {
    findings.push({
      severity: 'P1', category: 'data',
      title: `Type chart references unknown types (${unknownTypes.length} occurrences)`,
      anchor: 'data/type-chart.json',
      examples: unknownTypes.slice(0, 8),
    });
  }
  if (badMults.length) {
    findings.push({
      severity: 'P1', category: 'data',
      title: `Type chart has out-of-band multipliers (${badMults.length} occurrences)`,
      anchor: 'data/type-chart.json',
      examples: badMults.slice(0, 8).concat([`Allowed: ${[...VALID_MULTS].join(', ')}`]),
    });
  }
}

function validateBallMath(findings, stats) {
  const bm = _readJson('data/story/ball-math.json');
  if (bm._missing || bm._parseError) {
    findings.push({
      severity: 'P0', category: 'data',
      title: `data/story/ball-math.json: ${bm._missing ? 'missing' : 'malformed JSON'}`,
      anchor: 'data/story/ball-math.json',
      examples: [bm._parseError || 'file does not exist'],
    });
    return;
  }
  stats.ballMathOK = true;
  const need = ['ballMultipliers', 'catchRateByGrade', 'fleeRateByGrade', 'defaultFleeRate', 'safari'];
  const missing = need.filter(k => !(k in bm));
  if (missing.length) {
    findings.push({
      severity: 'P1', category: 'data',
      title: `ball-math.json missing top-level keys: ${missing.join(', ')}`,
      anchor: 'data/story/ball-math.json',
      examples: missing.map(k => `\`${k}\` is required — see scripts/build/generate-shop-catalogs.mjs counterpart pattern.`),
    });
    stats.ballMathOK = false;
    return;
  }
  // Ball multipliers — poke/great/ultra/master required; master must be "guaranteed" or finite number.
  const balls = bm.ballMultipliers;
  const ballRequired = ['poke', 'great', 'ultra', 'master'];
  for (const k of ballRequired) {
    if (!(k in balls)) {
      findings.push({
        severity: 'P1', category: 'data',
        title: `ball-math.json: ballMultipliers.${k} missing`,
        anchor: 'data/story/ball-math.json',
        examples: [`Defaulted to 0 at runtime — every ${k} throw would auto-fail.`],
      });
    }
  }
  if (balls.master !== 'guaranteed' && (typeof balls.master !== 'number' || !isFinite(balls.master))) {
    findings.push({
      severity: 'P1', category: 'data',
      title: `ball-math.json: ballMultipliers.master = ${JSON.stringify(balls.master)} (expected "guaranteed" or finite number)`,
      anchor: 'data/story/ball-math.json',
      examples: ['"guaranteed" → Infinity at load time; numeric values pass through as multipliers.'],
    });
  }
  // Grades 1..4 in both rate tables
  for (const tbl of ['catchRateByGrade', 'fleeRateByGrade']) {
    for (const g of [1, 2, 3, 4]) {
      if (!(g in bm[tbl]) && !((`${g}`) in bm[tbl])) {
        findings.push({
          severity: 'P2', category: 'data',
          title: `ball-math.json: ${tbl} missing grade ${g}`,
          anchor: 'data/story/ball-math.json',
          examples: [`Grade ${g} pokemon would fall through to default 0 / NaN.`],
        });
      }
    }
  }
  // Safari block — required keys
  const safariNeeded = ['ballMultiplier', 'ballsPerSession', 'baitCatchMult', 'baitFleeMult', 'rockCatchMult', 'rockFleeMult'];
  for (const k of safariNeeded) {
    if (typeof bm.safari[k] !== 'number') {
      findings.push({
        severity: 'P2', category: 'data',
        title: `ball-math.json: safari.${k} is not a number (got ${typeof bm.safari[k]})`,
        anchor: 'data/story/ball-math.json',
        examples: [`Safari Zone math will fall back to defaults baked into battle.html.`],
      });
    }
  }
}

function validateShops(findings, stats) {
  const sh = _readJson('data/story/shops.json');
  if (sh._missing || sh._parseError) {
    findings.push({
      severity: 'P0', category: 'data',
      title: `data/story/shops.json: ${sh._missing ? 'missing' : 'malformed JSON'}`,
      anchor: 'data/story/shops.json',
      examples: [sh._parseError || 'file does not exist; run scripts/build/generate-shop-catalogs.mjs'],
    });
    return;
  }
  let totalItems = 0;
  const allIds = new Set();
  for (const shop of ['pokemart', 'dept', 'stone']) {
    if (!Array.isArray(sh[shop])) {
      findings.push({
        severity: 'P1', category: 'data',
        title: `shops.json: \`${shop}\` is not an array`,
        anchor: 'data/story/shops.json',
        examples: [`got ${typeof sh[shop]}`],
      });
      continue;
    }
    totalItems += sh[shop].length;
    for (const item of sh[shop]) {
      // Required fields
      for (const f of ['id', 'name', 'price', 'desc']) {
        if (!(f in item)) {
          findings.push({
            severity: 'P2', category: 'data',
            title: `shops.json[${shop}]: item \`${item.id || '(no id)'}\` missing field "${f}"`,
            anchor: 'data/story/shops.json',
            examples: [JSON.stringify(item)],
          });
        }
      }
      // Price must be positive integer
      if (typeof item.price !== 'number' || item.price <= 0 || !Number.isInteger(item.price)) {
        findings.push({
          severity: 'P2', category: 'data',
          title: `shops.json[${shop}]: item \`${item.id}\` has invalid price ${JSON.stringify(item.price)}`,
          anchor: 'data/story/shops.json',
          examples: [`Expected positive integer.`],
        });
      }
      // Kind-specific fields
      if (item.kind === 'ball' && !item.ballKey) {
        findings.push({
          severity: 'P1', category: 'data',
          title: `shops.json[${shop}]: ball item \`${item.id}\` missing ballKey`,
          anchor: 'data/story/shops.json',
          examples: [`ballKey is required by the catch system to look up the multiplier.`],
        });
      }
      if (item.kind === 'stone' && !item.stone) {
        findings.push({
          severity: 'P2', category: 'data',
          title: `shops.json[${shop}]: stone item \`${item.id}\` missing stone field`,
          anchor: 'data/story/shops.json',
          examples: [`stone field names the in-game stone used by the Sage.`],
        });
      }
      if (item.kind === 'tradeItem' && !item.tradeItem) {
        findings.push({
          severity: 'P2', category: 'data',
          title: `shops.json[${shop}]: trade item \`${item.id}\` missing tradeItem field`,
          anchor: 'data/story/shops.json',
          examples: [`tradeItem field names the in-game trade item used by the Sage.`],
        });
      }
      // Duplicate id check (across all shops)
      if (item.id) {
        if (allIds.has(item.id)) {
          findings.push({
            severity: 'P1', category: 'data',
            title: `shops.json: duplicate item id "${item.id}" (in ${shop})`,
            anchor: 'data/story/shops.json',
            examples: [`Each item id must be unique across all three shops; sm.inventory.<id> is keyed by id.`],
          });
        }
        allIds.add(item.id);
      }
    }
  }
  stats.shopItems = totalItems;
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
  if (stats.dialogueFiles != null) out.push(`| dialogue/*.json | ${stats.dialogueFiles} files, ${stats.dialogueEntries || 0} entries |`);
  if (stats.typeChartAttackers != null) out.push(`| type-chart.json | ${stats.typeChartAttackers} attacker rows |`);
  if (stats.ballMathOK != null) out.push(`| story/ball-math.json | ${stats.ballMathOK ? 'OK' : 'malformed'} |`);
  if (stats.shopItems != null) out.push(`| story/shops.json | ${stats.shopItems} items |`);
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
