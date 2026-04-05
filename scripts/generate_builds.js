#!/usr/bin/env node
// generate_builds.js
// Reads data/builds/gen4-9.json, tags every set, and writes data/builds.csv
// Run from repo root: node scripts/generate_builds.js

const fs   = require('fs');
const path = require('path');

// ── Tagging constants (mirror battle.html) ─────────────────────────────────

const Z_CRYSTAL_ITEMS = new Set([
  'Normalium Z','Firium Z','Waterium Z','Grassium Z','Electrium Z',
  'Icium Z','Fightinium Z','Poisonium Z','Groundium Z','Flyinium Z',
  'Psychium Z','Buginium Z','Rockium Z','Ghostium Z','Dragonium Z',
  'Darkinium Z','Steelium Z','Fairium Z',
  'Pikanium Z','Pikashunium Z','Eevium Z','Decidium Z','Incinium Z',
  'Primarium Z','Tapunium Z','Marshadium Z','Aloraichium Z','Snorlium Z','Mewnium Z'
]);

const WEATHER_DEP_ABILITIES = new Set([
  'Swift Swim','Hydration','Rain Dish','Dry Skin',
  'Chlorophyll','Solar Power','Flower Gift','Leaf Guard',
  'Sand Rush','Sand Force','Sand Veil',
  'Slush Rush','Ice Body'
]);

const TERA_MOVES = new Set(['Tera Blast','Tera Starstorm']);

// ── Helpers ────────────────────────────────────────────────────────────────

function isMegaItem(item) {
  if (!item) return false;
  if (item === 'Red Orb' || item === 'Blue Orb' || item === 'Rusted Sword' || item === 'Rusted Shield') return true;
  if (item !== 'Eviolite' && (item.endsWith('ite') || item.endsWith('ite X') || item.endsWith('ite Y'))) return true;
  return false;
}

function isZCrystal(item) {
  if (!item) return false;
  return item.endsWith(' Z') || Z_CRYSTAL_ITEMS.has(item);
}

function pickRandom(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const f = val.filter(Boolean);
    return f.length ? f[Math.floor(Math.random() * f.length)] : null;
  }
  return val;
}

// Encode move slot: array → "Move A/Move B", string → as-is
function encodeMove(m) {
  if (Array.isArray(m)) {
    const f = m.filter(Boolean);
    return f.length ? f.join('/') : 'Tackle';
  }
  return m || 'Tackle';
}

function encodeMoves(movesRaw) {
  const slots = (movesRaw || []).slice(0, 4).map(encodeMove);
  while (slots.length < 4) slots.push('Tackle');
  return slots;
}

function flattenEvs(evs) {
  let e = Array.isArray(evs) ? (evs[0] || {}) : (evs || {});
  return [e.hp||0, e.atk||0, e.def||0, e.spa||0, e.spd||0, e.spe||0];
}

// Tag priority: mega > z-attack > tera > weather > regular
function tagBuild(item, ability, encodedMoves) {
  if (isMegaItem(item))    return 'mega';
  if (isZCrystal(item))    return 'z-attack';
  // Check all move options (expand A/B choices)
  const allMoves = encodedMoves.flatMap(m => m.split('/'));
  if (allMoves.some(m => TERA_MOVES.has(m)))             return 'tera';
  if (ability && WEATHER_DEP_ABILITIES.has(ability))      return 'weather';
  return 'regular';
}

// CSV field quoting
function q(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ── Main ───────────────────────────────────────────────────────────────────

const rows = [];
const seen = new Set();  // dedup: name|tag|item|m1|m2|m3|m4
let totalSets = 0;

for (let gen = 4; gen <= 9; gen++) {
  const fp = path.join(__dirname, '..', 'data', 'builds', `gen${gen}.json`);
  if (!fs.existsSync(fp)) { console.log(`  gen${gen}.json — not found, skip`); continue; }

  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let genCount = 0;

  for (const [pokeName, tiers] of Object.entries(data)) {
    if (!tiers || typeof tiers !== 'object') continue;

    for (const [, sets] of Object.entries(tiers)) {
      if (!sets || typeof sets !== 'object') continue;

      for (const [, set] of Object.entries(sets)) {
        if (!set || !Array.isArray(set.moves) || set.moves.length === 0) continue;

        const item    = pickRandom(set.item)    || 'Leftovers';
        const ability = pickRandom(set.ability) || '';
        const nature  = pickRandom(set.nature)  || 'Hardy';
        const evArr   = flattenEvs(set.evs);
        const moves   = encodeMoves(set.moves);
        const tag     = tagBuild(item, ability, moves);

        const key = `${pokeName}|${tag}|${item}|${moves.join('|')}`;
        if (seen.has(key)) continue;
        seen.add(key);

        rows.push([
          q(pokeName), q(tag), q(item), q(ability), q(nature),
          q(moves[0]), q(moves[1]), q(moves[2]), q(moves[3]),
          ...evArr.map(v => q(v))
        ].join(','));
        genCount++;
      }
    }
  }

  totalSets += genCount;
  console.log(`  gen${gen}: ${genCount} builds`);
}

const header = 'name,tag,item,ability,nature,move1,move2,move3,move4,hp_ev,atk_ev,def_ev,spa_ev,spd_ev,spe_ev';
const output = header + '\n' + rows.join('\n') + '\n';
const outPath = path.join(__dirname, '..', 'data', 'builds.csv');
fs.writeFileSync(outPath, output, 'utf8');

const sizeKB = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
console.log(`\nDone — ${totalSets} total rows → data/builds.csv (${sizeKB} KB)`);
