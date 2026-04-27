/**
 * Aggregates data/builds.csv + data/moves.json into a single meta-analysis CSV.
 * Run: node scripts/generate-meta-analysis-csv.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const GENS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function deepMerge(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    if (k === 'inherit') continue;
    const v = b[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && v.constructor === Object) {
      out[k] = deepMerge(out[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function loadMovesResolved() {
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'moves.json'), 'utf8'));
  const allIds = new Set();
  for (const g of GENS) {
    if (!raw[g]) continue;
    for (const id of Object.keys(raw[g])) allIds.add(id);
  }
  const resolved = {};
  for (const id of allIds) {
    let m = {};
    for (const g of GENS) {
      if (!raw[g]?.[id]) continue;
      const chunk = { ...raw[g][id] };
      delete chunk.inherit;
      m = deepMerge(m, chunk);
    }
    resolved[id] = m;
  }
  const byNameNorm = new Map();
  for (const m of Object.values(resolved)) {
    if (!m.name || typeof m.name !== 'string') continue;
    const key = m.name.trim().toLowerCase();
    if (!byNameNorm.has(key)) byNameNorm.set(key, m);
  }
  return { resolved, byNameNorm };
}

function lookupMove(name, byNameNorm) {
  if (!name || !String(name).trim()) return null;
  const key = String(name).trim().toLowerCase();
  return byNameNorm.get(key) || null;
}

function splitMoveSlot(slot) {
  if (!slot || !String(slot).trim()) return [];
  return String(slot)
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBuilds(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.length);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length !== 15) continue;
    rows.push({
      species: parts[0],
      tag: parts[1],
      item: parts[2].trim(),
      ability: parts[3].trim(),
      nature: parts[4].trim(),
      moves: [parts[5], parts[6], parts[7], parts[8]].map((s) => String(s).trim()),
      evs: parts.slice(9, 15).map((n) => parseInt(n, 10) || 0),
    });
  }
  return rows;
}

function countMap(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function pct(n, d) {
  if (!d) return '0';
  return ((100 * n) / d).toFixed(2);
}

function csvEscape(s) {
  const t = String(s ?? '');
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const WEATHER_MOVE_NAMES_ONLY = new Set(
  ['Sunny Day', 'Rain Dance', 'Sandstorm', 'Snowscape', 'Hail', 'Chilly Reception'].map((x) => x.toLowerCase())
);

const TERRAIN_MOVES = new Set(
  ['Electric Terrain', 'Grassy Terrain', 'Misty Terrain', 'Psychic Terrain'].map((x) => x.toLowerCase())
);

const HAZARD_MOVES = new Set(
  [
    'Stealth Rock',
    'Spikes',
    'Toxic Spikes',
    'Sticky Web',
    'Ceaseless Edge',
    'Stone Axe',
    'G-Max Steelsurge',
    'G-Max Vine Lash',
    'G-Max Cannonade',
    'G-Max Volcalith',
    'G-Max Wildfire',
    'G-Max Chi Strike',
    'G-Max Stonesurge',
  ].map((x) => x.toLowerCase())
);

const PROTECT_LIKE = new Set(
  [
    'Protect',
    'Detect',
    'Endure',
    "King's Shield",
    'Baneful Bunker',
    'Spiky Shield',
    'Silk Trap',
    'Obstruct',
    'Burning Bulwark',
    'Wide Guard',
    'Quick Guard',
    'Crafty Shield',
    'Mat Block',
  ].map((x) => x.toLowerCase())
);

const PIVOT_MOVES = new Set(
  ['U-turn', 'Volt Switch', 'Flip Turn', 'Parting Shot', 'Teleport', 'Baton Pass', 'Chilly Reception'].map((x) =>
    x.toLowerCase()
  )
);

const SPEED_FIELD_MOVES = new Set(['Tailwind', 'Trick Room', 'Icy Wind', 'Electroweb'].map((x) => x.toLowerCase()));

const WEATHER_ABILITIES = new Set(
  [
    'Drizzle',
    'Drought',
    'Sand Stream',
    'Snow Warning',
    'Sand Spit',
    'Desolate Land',
    'Primordial Sea',
    'Delta Stream',
  ].map((x) => x.toLowerCase())
);

function main() {
  const buildsPath = path.join(root, 'data', 'builds.csv');
  const outPath = path.join(root, 'meta analysis.csv');

  const { byNameNorm } = loadMovesResolved();
  const rows = parseBuilds(fs.readFileSync(buildsPath, 'utf8'));
  const N = rows.length;

  const itemCounts = new Map();
  const abilityCounts = new Map();
  const natureCounts = new Map();
  const moveCounts = new Map();
  const unmappedMoves = new Map();
  const weatherAbilityBuilds = new Map();

  for (const r of rows) {
    if (r.item) itemCounts.set(r.item, (itemCounts.get(r.item) || 0) + 1);
    if (r.ability) {
      abilityCounts.set(r.ability, (abilityCounts.get(r.ability) || 0) + 1);
      if (WEATHER_ABILITIES.has(r.ability.toLowerCase())) {
        weatherAbilityBuilds.set(r.ability, (weatherAbilityBuilds.get(r.ability) || 0) + 1);
      }
    }
    if (r.nature) natureCounts.set(r.nature, (natureCounts.get(r.nature) || 0) + 1);

    for (const slot of r.moves) {
      for (const mv of splitMoveSlot(slot)) {
        moveCounts.set(mv, (moveCounts.get(mv) || 0) + 1);
        if (!lookupMove(mv, byNameNorm)) {
          unmappedMoves.set(mv, (unmappedMoves.get(mv) || 0) + 1);
        }
      }
    }
  }

  const allTypes = new Set();
  for (const m of byNameNorm.values()) {
    if (m.type && m.type !== '???') allTypes.add(m.type);
  }
  const TYPE_ORDER = [
    'Bug',
    'Dark',
    'Dragon',
    'Electric',
    'Fairy',
    'Fighting',
    'Fire',
    'Flying',
    'Ghost',
    'Grass',
    'Ground',
    'Ice',
    'Normal',
    'Poison',
    'Psychic',
    'Rock',
    'Steel',
    'Water',
    'Stellar',
  ];
  const sortedTypes = [...TYPE_ORDER.filter((t) => allTypes.has(t)), ...[...allTypes].filter((t) => !TYPE_ORDER.includes(t))];

  /** @type {Map<string, Map<string, number>>} */
  const movesByType = new Map();
  for (const t of sortedTypes) movesByType.set(t, new Map());

  const statusMoveCounts = new Map();
  const weatherSlot = new Map();
  const terrainSlot = new Map();
  const hazardSlot = new Map();
  const protectSlot = new Map();
  const pivotSlot = new Map();
  const speedFieldSlot = new Map();

  for (const [name, c] of moveCounts) {
    const meta = lookupMove(name, byNameNorm);
    const norm = name.toLowerCase();
    if (meta?.category === 'Status') {
      statusMoveCounts.set(name, c);
    }
    if (WEATHER_MOVE_NAMES_ONLY.has(norm)) {
      weatherSlot.set(name, c);
    }
    if (TERRAIN_MOVES.has(norm)) {
      terrainSlot.set(name, c);
    }
    if (HAZARD_MOVES.has(norm)) {
      hazardSlot.set(name, c);
    }
    if (PROTECT_LIKE.has(norm)) {
      protectSlot.set(name, c);
    }
    if (PIVOT_MOVES.has(norm)) {
      pivotSlot.set(name, c);
    }
    if (SPEED_FIELD_MOVES.has(norm)) {
      speedFieldSlot.set(name, c);
    }
    if (meta?.type && movesByType.has(meta.type)) {
      movesByType.get(meta.type).set(name, c);
    }
  }

  const outLines = [];
  const COLS = [
    'section',
    'subcategory',
    'rank',
    'name',
    'count',
    'pct_of_builds',
    'move_type',
    'move_category',
    'notes',
  ];
  outLines.push(COLS.join(','));

  const pushRow = (section, sub, rank, name, count, pct, moveType, moveCat, notes) => {
    outLines.push(
      [
        csvEscape(section),
        csvEscape(sub),
        csvEscape(rank),
        csvEscape(name),
        csvEscape(count),
        csvEscape(pct),
        csvEscape(moveType),
        csvEscape(moveCat),
        csvEscape(notes),
      ].join(',')
    );
  };

  pushRow('META', 'dataset', '', 'builds.csv + moves.json (gens 1–9 merged)', N, '100', '', '', 'Each build row = one preset; slash moves count each listed option');

  const topItems = countMap(itemCounts).slice(0, 50);
  topItems.forEach(([name, c], i) => pushRow('TOP_ITEMS', '', i + 1, name, c, pct(c, N), '', '', ''));

  const topAbilities = countMap(abilityCounts).slice(0, 50);
  topAbilities.forEach(([name, c], i) => pushRow('TOP_ABILITIES', '', i + 1, name, c, pct(c, N), '', '', 'Blank abilities omitted from this section'));

  const topNatures = countMap(natureCounts).slice(0, 50);
  topNatures.forEach(([name, c], i) => pushRow('TOP_NATURES', '', i + 1, name, c, pct(c, N), '', '', ''));

  const topMovesAll = countMap(moveCounts).slice(0, 50);
  topMovesAll.forEach(([name, c], i) => {
    const meta = lookupMove(name, byNameNorm);
    pushRow('TOP_MOVES_ALL', '', i + 1, name, c, pct(c, N), meta?.type || '', meta?.category || 'UNKNOWN', meta ? '' : 'unresolved in moves.json');
  });

  for (const t of sortedTypes) {
    const ranked = countMap(movesByType.get(t)).slice(0, 20);
    ranked.forEach(([name, c], i) => {
      const meta = lookupMove(name, byNameNorm);
      pushRow('TOP_MOVES_BY_MOVE_TYPE', t, i + 1, name, c, pct(c, N), t, meta?.category || '', 'Top 20 moves of this elemental type by slot appearances');
    });
  }

  const topStatus = countMap(statusMoveCounts).slice(0, 50);
  topStatus.forEach(([name, c], i) => {
    const meta = lookupMove(name, byNameNorm);
    pushRow('TOP_STATUS_MOVES', '', i + 1, name, c, pct(c, N), meta?.type || '', 'Status', '');
  });

  countMap(weatherSlot).forEach(([name, c], i) => {
    pushRow('WEATHER_SETTING_MOVES', '', i + 1, name, c, pct(c, N), '', '', 'Traditional weather field moves only');
  });

  countMap(weatherAbilityBuilds).forEach(([name, c], i) => {
    pushRow('WEATHER_INDUCING_ABILITIES', '', i + 1, name, c, pct(c, N), '', '', 'Build rows where ability sets field weather on switch');
  });

  countMap(terrainSlot).forEach(([name, c], i) => {
    pushRow('TERRAIN_MOVES', '', i + 1, name, c, pct(c, N), '', '', '');
  });

  countMap(hazardSlot).forEach(([name, c], i) => {
    pushRow('HAZARD_ENTRY_MOVES', '', i + 1, name, c, pct(c, N), '', '', 'Includes hazard-like G-Max where listed in presets');
  });

  countMap(protectSlot).forEach(([name, c], i) => {
    pushRow('PROTECT_AND_STANCE_MOVES', '', i + 1, name, c, pct(c, N), '', '', 'Protect clones + Wide/Quick Guard family');
  });

  countMap(pivotSlot).forEach(([name, c], i) => {
    pushRow('PIVOT_AND_MOMENTUM_MOVES', '', i + 1, name, c, pct(c, N), '', '', 'Switching / tempo moves common in builds');
  });

  countMap(speedFieldSlot).forEach(([name, c], i) => {
    pushRow('SPEED_CONTROL_MOVES', '', i + 1, name, c, pct(c, N), '', '', 'Tailwind, Trick Room, spread speed drops');
  });

  const unmappedSorted = countMap(unmappedMoves).slice(0, 40);
  unmappedSorted.forEach(([name, c], i) => {
    pushRow('UNRESOLVED_MOVE_NAMES', '', i + 1, name, c, pct(c, N), '', '', 'Fix spelling or add aliases if needed');
  });

  fs.writeFileSync(outPath, outLines.join('\r\n'), 'utf8');
  console.log('Wrote', outPath, 'rows', outLines.length - 1, 'builds', N);
}

main();
