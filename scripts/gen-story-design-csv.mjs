/**
 * Extracts the Story Mode design tables from battle.html into editable CSVs
 * under docs/story-design/. These are the human-tunable mirror of the data
 * that currently lives as hardcoded literals in the monolith (see Lane D /
 * docs review). Generation is one-way for now (code -> CSV); wiring CSV ->
 * code via codegen is a separate, later step.
 *
 * Run: node scripts/gen-story-design-csv.mjs
 *
 * Emits:
 *   story-timeline.csv       — the ordered event flow (the "story mode flow")
 *   story-cities.csv         — per-city service availability (City rows only)
 *   story-shops.csv          — Pokemart / Dept / Stone catalogs
 *   story-iv-tiers.csv       — enemy IV bands per training tier
 *   story-facility-debut.csv — first city each facility appears
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'battle.html'), 'utf8');
const outDir = path.join(root, 'docs', 'story-design');
fs.mkdirSync(outDir, { recursive: true });

// Pull a `const NAME = [...]` / `{...}` (incl. Object.freeze({...})) literal out
// of the monolith and eval it to real data. Quote- and comment-aware so brackets
// inside strings / // / * comments don't unbalance the depth counter.
function extractLiteral(src, name) {
  const at = src.indexOf(`const ${name}`);
  if (at < 0) throw new Error(`literal not found: ${name}`);
  let i = src.indexOf('=', at) + 1;
  while (i < src.length && src[i] !== '[' && src[i] !== '{') i++;
  const open = src[i];
  const close = open === '[' ? ']' : '}';
  let depth = 0, str = null, j = i;
  for (; j < src.length; j++) {
    const c = src[j], n = src[j + 1];
    if (str) {
      if (c === '\\') { j++; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === '/' && n === '/') { const nl = src.indexOf('\n', j); j = nl < 0 ? src.length : nl; continue; }
    if (c === '/' && n === '*') { const e = src.indexOf('*/', j); j = e < 0 ? src.length : e + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { j++; break; } }
  }
  // eslint-disable-next-line no-eval
  return eval(`(${src.slice(i, j)})`);
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (headers, rows) =>
  [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n') + '\n';
const write = (file, text) => {
  fs.writeFileSync(path.join(outDir, file), text);
  console.log(`  ${file.padEnd(26)} ${text.split('\n').length - 2} rows`);
};

const EVENTS = extractLiteral(html, 'STORY_EVENTS_RAW');
const POKEMART = extractLiteral(html, 'POKEMART_ITEMS');
const DEPT = extractLiteral(html, 'DEPT_ITEMS');
const STONES = extractLiteral(html, 'STONE_SHOP_ITEMS');
const DEBUT = extractLiteral(html, 'FACILITY_DEBUT_CITY');
const IVT = extractLiteral(html, 'STORY_IV_TIER_RANGES');

// Replicate the runtime fan-club splice so the CSV reflects real availability.
for (const row of EVENTS) {
  if (!Array.isArray(row) || row[1] !== 'City') continue;
  const a = row[5];
  if (!Array.isArray(a) || a.includes('Pokemon Fan Club')) continue;
  let at = a.indexOf('Pokemart');
  if (at < 0) at = a.indexOf('Department Store');
  if (at < 0) at = a.indexOf('Link Station');
  if (at < 0) at = a.length - 1;
  a.splice(at + 1, 0, 'Pokemon Fan Club');
}

console.log('Writing docs/story-design/ ...');

// story-timeline.csv — the ordered flow. cityIndex tracks the most recent City row.
let city = 0;
const timeline = [];
const cities = [];
EVENTS.forEach((r, pos) => {
  if (r[1] === 'City') {
    const m = String(r[2]).match(/City(\d+)/);
    if (m) city = +m[1];
    cities.push([pos, city, r[2], Array.isArray(r[5]) ? r[5].join('|') : '']);
  }
  const gw = r[3] || {};
  timeline.push([
    pos, r[0], r[1], r[2], city,
    gw.g1 ?? '', gw.g2 ?? '', gw.g3 ?? '', gw.g4 ?? '',
    r[4] ?? '', Array.isArray(r[5]) ? r[5].join('|') : '',
  ]);
});
write('story-timeline.csv',
  toCsv(['pos', 'eventId', 'type', 'name', 'cityIndex', 'g1', 'g2', 'g3', 'g4', 'coins', 'actions'], timeline));
write('story-cities.csv',
  toCsv(['pos', 'cityIndex', 'name', 'actions'], cities));

// story-shops.csv — three catalogs, one table.
const shopRows = [];
const pushShop = (shop, list) => list.forEach((it) =>
  shopRows.push([shop, it.id, it.name, it.price, it.kind || it.effect || '', it.battleBag === false ? 'no' : 'yes', it.desc || '']));
pushShop('pokemart', POKEMART);
pushShop('dept', DEPT);
pushShop('stone', STONES);
write('story-shops.csv',
  toCsv(['shop', 'id', 'name', 'price', 'kindOrEffect', 'battleBag', 'desc'], shopRows));

// story-iv-tiers.csv
write('story-iv-tiers.csv',
  toCsv(['tier', 'min', 'max'], Object.keys(IVT).map((t) => [t, IVT[t].min, IVT[t].max])));

// story-facility-debut.csv
write('story-facility-debut.csv',
  toCsv(['facility', 'debutCity'], Object.keys(DEBUT).map((k) => [k, DEBUT[k]])));

console.log('Done.');
