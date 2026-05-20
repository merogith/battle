#!/usr/bin/env node
// Coverage audit: classify every move in moves.json by how the engine handles it.
// Outputs:
//   /tests/reports/coverage.csv  (one row per move)
//   /tests/reports/coverage.md   (human-readable summary)
//
// Bucketing logic:
//   named-branch        engine has `if (move.name === "X")` in battle.html
//   data-driven         JSON declares secondary/boosts/multihit/drain/recoil/self and no named branch
//   damaging-only       basePower>0 with no special data and no named branch (vanilla damage path)
//   unhandled           basePower=0 status move with no boosts/status/volatileStatus/self/secondary
//                       and no named branch -> likely a gap
//   partially-handled   declares behavior the engine cannot apply generically
//                       (e.g. status type the data-driven path doesn't dispatch)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const MOVES_PATH = join(ROOT, 'data', 'moves.json');
const BATTLE_HTML_PATH = join(ROOT, 'battle.html');
const REPORTS_DIR = join(ROOT, 'tests', 'reports');

const CSV_ONLY = process.argv.includes('--csv-only');

function flattenMovesByGen(genKeyed) {
  // moves.json is { "1": { moveId: {...} }, "2": {...}, ... } with later gens overlaying earlier ones.
  // Merge into one map: take the highest gen entry per move id, fall back to earlier gens for missing fields.
  const merged = new Map();
  const gens = Object.keys(genKeyed).sort((a, b) => Number(a) - Number(b));
  for (const gen of gens) {
    const moves = genKeyed[gen];
    for (const [id, def] of Object.entries(moves)) {
      const prior = merged.get(id) || {};
      merged.set(id, { ...prior, ...def, _gen: gen, _id: id });
    }
  }
  return merged;
}

function deriveDisplayName(id, def) {
  if (def.name) return def.name;
  // Showdown convention: move ids strip non-alphanumerics; we approximate display name.
  return id.replace(/(^|[a-z])([A-Z])/g, '$1 $2')
           .replace(/\b\w/g, (c) => c.toUpperCase());
}

function findNamedBranches(htmlText, allMoveNames) {
  // The engine references moves via several patterns:
  //   move.name === "X"                       (~400 sites)
  //   ["X","Y",...].includes(move.name)       (healing groups, OHKO set)
  //   new Set([...]).has(move.name)           (ohko moves, trapping moves)
  //   const _xxx = ["X",...]                  (lookup tables consumed later)
  // A robust audit: collect every string literal in battle.html, then intersect with the move-name set.
  // False positives (any string matching a move name even outside engine logic) are acceptable -
  // they only widen the "handled" set, making "unhandled" a tighter signal.
  const referenced = new Set();
  const stringLiteralRe = /"([^"\\\n]+)"|'([^'\\\n]+)'/g;
  let m;
  while ((m = stringLiteralRe.exec(htmlText)) !== null) {
    const s = m[1] || m[2];
    if (allMoveNames.has(s)) referenced.add(s);
  }
  return referenced;
}

function bucketMove(def, displayName, namedBranches) {
  const inNamedBranch = namedBranches.has(displayName);
  const basePower = def.basePower ?? 0;
  const category = def.category ?? null;
  const hasBoosts = def.boosts && Object.keys(def.boosts).length > 0;
  const hasSelf = !!def.self;
  const hasSecondary = !!(def.secondary || def.secondaries);
  const hasStatus = !!def.status;
  const hasVolatile = !!def.volatileStatus;
  const hasMultihit = def.multihit != null;
  const hasDrain = Array.isArray(def.drain);
  const hasRecoil = Array.isArray(def.recoil);
  const hasSideCondition = !!def.sideCondition;
  const hasWeather = !!def.weather;
  const hasTerrain = !!def.terrain;
  const hasOnHit = !!def.onHit;
  const hasZMove = !!def.isZ;
  const hasMaxMove = !!def.isMax;

  const dataDrivenSignals =
    hasBoosts || hasSelf || hasSecondary || hasStatus || hasVolatile ||
    hasMultihit || hasDrain || hasRecoil || hasSideCondition ||
    hasWeather || hasTerrain;

  let bucket;
  if (inNamedBranch) {
    bucket = 'named-branch';
  } else if (dataDrivenSignals) {
    bucket = 'data-driven';
  } else if (basePower > 0 && category !== 'Status') {
    bucket = 'damaging-only';
  } else {
    // basePower = 0, no boosts, no status, no volatile, no side condition -> the engine cannot do anything for this move.
    bucket = 'unhandled';
  }

  // Partial-handled override: status moves with onHit (custom logic in the data file)
  // that the engine cannot execute generically -> needs a named branch.
  if (!inNamedBranch && (hasOnHit || hasZMove || hasMaxMove)) {
    bucket = 'partially-handled';
  }

  return {
    bucket,
    flags: {
      inNamedBranch,
      hasBoosts,
      hasSelf,
      hasSecondary,
      hasStatus,
      hasVolatile,
      hasMultihit,
      hasDrain,
      hasRecoil,
      hasSideCondition,
      hasWeather,
      hasTerrain,
      hasOnHit,
      isZ: hasZMove,
      isMax: hasMaxMove,
    },
  };
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(rows) {
  const headers = [
    'id', 'name', 'gen', 'category', 'basePower', 'accuracy', 'priority', 'type', 'target',
    'bucket', 'namedBranch',
    'hasBoosts', 'hasSelf', 'hasSecondary', 'hasStatus', 'hasVolatile',
    'hasMultihit', 'hasDrain', 'hasRecoil', 'hasSideCondition', 'hasWeather', 'hasTerrain',
    'hasOnHit', 'isZ', 'isMax',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.id, r.name, r.gen, r.category, r.basePower, r.accuracy, r.priority, r.type, r.target,
      r.bucket, r.flags.inNamedBranch ? 1 : 0,
      r.flags.hasBoosts ? 1 : 0, r.flags.hasSelf ? 1 : 0, r.flags.hasSecondary ? 1 : 0,
      r.flags.hasStatus ? 1 : 0, r.flags.hasVolatile ? 1 : 0,
      r.flags.hasMultihit ? 1 : 0, r.flags.hasDrain ? 1 : 0, r.flags.hasRecoil ? 1 : 0,
      r.flags.hasSideCondition ? 1 : 0, r.flags.hasWeather ? 1 : 0, r.flags.hasTerrain ? 1 : 0,
      r.flags.hasOnHit ? 1 : 0, r.flags.isZ ? 1 : 0, r.flags.isMax ? 1 : 0,
    ].map(csvEscape).join(','));
  }
  return lines.join('\n') + '\n';
}

function buildMarkdown(rows, namedBranches) {
  const total = rows.length;
  const buckets = rows.reduce((acc, r) => { acc[r.bucket] = (acc[r.bucket] || 0) + 1; return acc; }, {});
  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

  const perGen = rows.reduce((acc, r) => {
    acc[r.gen] = acc[r.gen] || { total: 0 };
    acc[r.gen].total++;
    acc[r.gen][r.bucket] = (acc[r.gen][r.bucket] || 0) + 1;
    return acc;
  }, {});

  const unhandled = rows.filter(r => r.bucket === 'unhandled').sort((a, b) => a.name.localeCompare(b.name));
  const partial = rows.filter(r => r.bucket === 'partially-handled').sort((a, b) => a.name.localeCompare(b.name));

  // Named branches in engine that don't correspond to any move in moves.json (orphans)
  const movesByName = new Set(rows.map(r => r.name));
  const orphanBranches = [...namedBranches].filter(n => !movesByName.has(n)).sort();

  const lines = [];
  lines.push('# Move Coverage Report\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push(`**Total moves in moves.json:** ${total}\n`);
  lines.push(`**Engine named-branch references:** ${namedBranches.size} (${orphanBranches.length} reference move names not in moves.json)\n`);

  lines.push('## Bucket Summary\n');
  lines.push('| Bucket | Count | % |');
  lines.push('|---|---:|---:|');
  for (const b of ['named-branch', 'data-driven', 'damaging-only', 'partially-handled', 'unhandled']) {
    const n = buckets[b] || 0;
    lines.push(`| ${b} | ${n} | ${pct(n)} |`);
  }
  lines.push('');

  lines.push('## Per-Generation Breakdown\n');
  lines.push('| Gen | Total | named-branch | data-driven | damaging-only | partial | unhandled |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  const gens = Object.keys(perGen).sort((a, b) => Number(a) - Number(b));
  for (const g of gens) {
    const p = perGen[g];
    lines.push(`| ${g} | ${p.total} | ${p['named-branch'] || 0} | ${p['data-driven'] || 0} | ${p['damaging-only'] || 0} | ${p['partially-handled'] || 0} | ${p['unhandled'] || 0} |`);
  }
  lines.push('');

  if (unhandled.length) {
    lines.push(`## Unhandled Moves (${unhandled.length})\n`);
    lines.push('These moves have basePower=0 and no boosts/status/volatile/self/secondary/side condition/weather/terrain declared.');
    lines.push('They likely do nothing in the engine. Add either a named branch in battle.html or appropriate data fields in moves.json.\n');
    for (const r of unhandled) lines.push(`- ${r.name} (gen ${r.gen})`);
    lines.push('');
  }

  if (partial.length) {
    lines.push(`## Partially-Handled Moves (${partial.length})\n`);
    lines.push('These declare onHit/isZ/isMax behavior the engine cannot dispatch generically.\n');
    for (const r of partial) lines.push(`- ${r.name} (gen ${r.gen})`);
    lines.push('');
  }

  if (orphanBranches.length) {
    lines.push(`## Orphan Named Branches (${orphanBranches.length})\n`);
    lines.push('Engine references these move names via `move.name === "X"` but no matching entry exists in moves.json:\n');
    for (const n of orphanBranches) lines.push(`- ${n}`);
    lines.push('');
  }

  lines.push('## How to Use This Report\n');
  lines.push('- Bucket `unhandled` is the priority gap list: those moves silently do nothing.');
  lines.push('- Bucket `partially-handled` needs either a code branch or a richer data schema.');
  lines.push('- Bucket `damaging-only` is fine for vanilla attacks (Tackle, Pound) but may indicate missing secondaries on moves like Body Slam.');
  lines.push('- Property tests in `/tests/property/` iterate over the CSV to find regressions.');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const [movesJson, htmlText] = await Promise.all([
    readFile(MOVES_PATH, 'utf8').then(JSON.parse),
    readFile(BATTLE_HTML_PATH, 'utf8'),
  ]);

  const merged = flattenMovesByGen(movesJson);

  // First pass: derive display names so we can intersect with engine string literals.
  const allMoveNames = new Set();
  const nameOf = new Map();
  for (const [id, def] of merged) {
    const name = deriveDisplayName(id, def);
    nameOf.set(id, name);
    allMoveNames.add(name);
  }
  const namedBranches = findNamedBranches(htmlText, allMoveNames);

  const rows = [];
  for (const [id, def] of merged) {
    const name = nameOf.get(id);
    const classification = bucketMove(def, name, namedBranches);
    rows.push({
      id,
      name,
      gen: def._gen,
      category: def.category ?? '',
      basePower: def.basePower ?? '',
      accuracy: def.accuracy === true ? 'true' : (def.accuracy ?? ''),
      priority: def.priority ?? 0,
      type: def.type ?? '',
      target: def.target ?? '',
      bucket: classification.bucket,
      flags: classification.flags,
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));

  await mkdir(REPORTS_DIR, { recursive: true });
  const csv = buildCsv(rows);
  await writeFile(join(REPORTS_DIR, 'coverage.csv'), csv);

  if (!CSV_ONLY) {
    const md = buildMarkdown(rows, namedBranches);
    await writeFile(join(REPORTS_DIR, 'coverage.md'), md);
  }

  // Summary to stdout
  const buckets = rows.reduce((acc, r) => { acc[r.bucket] = (acc[r.bucket] || 0) + 1; return acc; }, {});
  console.log(`\nAudit complete: ${rows.length} moves scanned`);
  console.log(`Named-branch references in engine: ${namedBranches.size}`);
  console.log('\nBucket counts:');
  for (const b of ['named-branch', 'data-driven', 'damaging-only', 'partially-handled', 'unhandled']) {
    const n = buckets[b] || 0;
    const pct = ((n / rows.length) * 100).toFixed(1);
    console.log(`  ${b.padEnd(20)} ${String(n).padStart(4)}  (${pct}%)`);
  }
  console.log(`\nReports written to: ${REPORTS_DIR}`);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
