#!/usr/bin/env node
// generate_builds.js
// Reads data/builds/gen4-9.json, tags every set, and writes data/builds.csv.
// Schema (extended for multi-agent audit fixes):
//   name, tag, gen, format, category, item, ability, nature,
//   move1, move2, move3, move4,
//   hp_ev, atk_ev, def_ev, spa_ev, spd_ev, spe_ev,
//   hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv,
//   teratypes
//
// Multi-option fields encode alternatives:
//   moveN  → slash-delimited: "Move A/Move B"
//   item/ability/nature/teratypes → pipe-delimited: "A|B|C"
//
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

const WEATHER_SETTER_MOVES = new Set([
  'Rain Dance','Sunny Day','Sandstorm','Hail','Snowscape','Chilly Reception'
]);
const WEATHER_BOOSTED_MOVES = new Set([
  'Solar Beam','Solar Blade','Thunder','Hurricane','Weather Ball',
  'Growth','Morning Sun','Synthesis','Moonlight','Blizzard'
]);

// Format keys that imply doubles/triples play (different team-support move pools).
const DOUBLES_FORMATS = new Set([
  'doublesou','doublesuu','doublesubers','doubleslc',
  'nationaldexdoubles',
  'battlespotdoubles','battlestadiumdoubles','battlespottriples',
  '2v2doubles',
  // VGC are all doubles
  'vgc2009','vgc2010','vgc2011','vgc2012','vgc2013','vgc2014','vgc2015',
  'vgc2016','vgc2017','vgc2018','vgc2019','vgc2020','vgc2021','vgc2022',
  'vgc2023','vgc2024','vgc2025'
]);

function categoryForFormat(fmt) {
  return DOUBLES_FORMATS.has(String(fmt || '').toLowerCase()) ? 'doubles' : 'singles';
}

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

// Pick the first option (used only for the primary value the tag system needs).
function pickFirst(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const f = val.filter(Boolean);
    return f.length ? f[0] : null;
  }
  return val;
}

// Pipe-encode an array of options; if scalar, return as-is.
function pipeEncode(val) {
  if (val == null) return '';
  if (Array.isArray(val)) {
    const f = val.filter(Boolean).map(String);
    return f.length ? f.join('|') : '';
  }
  return String(val);
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
  let arr = [e.hp||0, e.atk||0, e.def||0, e.spa||0, e.spd||0, e.spe||0];
  arr = arr.map(v => Math.min(252, Math.max(0, v)));
  let total = arr.reduce((a, b) => a + b, 0);
  if (total > 510) {
    const scale = 510 / total;
    arr = arr.map(v => Math.floor(v * scale));
    total = arr.reduce((a, b) => a + b, 0);
    while (total > 510) {
      let maxIdx = arr.indexOf(Math.max(...arr));
      arr[maxIdx]--;
      total--;
    }
  }
  return arr;
}

// Pull IVs (default 31 each, override per-stat from the set). Smogon convention:
// any stat not listed defaults to 31.
function flattenIvs(ivs) {
  let i = ivs || {};
  const def = 31;
  return [
    i.hp  !== undefined ? Math.max(0, Math.min(31, i.hp))  : def,
    i.atk !== undefined ? Math.max(0, Math.min(31, i.atk)) : def,
    i.def !== undefined ? Math.max(0, Math.min(31, i.def)) : def,
    i.spa !== undefined ? Math.max(0, Math.min(31, i.spa)) : def,
    i.spd !== undefined ? Math.max(0, Math.min(31, i.spd)) : def,
    i.spe !== undefined ? Math.max(0, Math.min(31, i.spe)) : def
  ];
}

// Tag priority: mega > z-attack > tera > weather > regular
function tagBuild(item, ability, encodedMoves) {
  if (isMegaItem(item))    return 'mega';
  if (isZCrystal(item))    return 'z-attack';
  const allMoves = encodedMoves.flatMap(m => m.split('/'));
  if (allMoves.some(m => TERA_MOVES.has(m)))             return 'tera';
  if (ability && WEATHER_DEP_ABILITIES.has(ability))      return 'weather';
  const hasSetter  = allMoves.some(m => WEATHER_SETTER_MOVES.has(m));
  const hasBoosted = allMoves.some(m => WEATHER_BOOSTED_MOVES.has(m));
  if (hasSetter && hasBoosted) return 'weather';
  return 'regular';
}

// CSV field quoting (UTF-8 aware: forces correct apostrophe / accent encoding).
function q(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ── Main ───────────────────────────────────────────────────────────────────

// Project-owned overlay. The gen*.json files are regenerated Smogon exports, so
// hand-maintained sets live in custom.json and are merged in here. See that file's
// _comment for what each section is for.
const customPath = path.join(__dirname, '..', 'data', 'builds', 'custom.json');
const custom = fs.existsSync(customPath) ? JSON.parse(fs.readFileSync(customPath, 'utf8')) : {};
const mirrorFormes = custom.mirrorFormes || {};
const customSets = custom.sets || {};

const rows = [];
const seen = new Set();  // dedup: name|gen|format|roleName|item-first|m1|m2|m3|m4
let totalSets = 0;
let mirrored = 0, authored = 0;

for (let gen = 4; gen <= 9; gen++) {
  const fp = path.join(__dirname, '..', 'data', 'builds', `gen${gen}.json`);
  if (!fs.existsSync(fp)) { console.log(`  gen${gen}.json — not found, skip`); continue; }

  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

  // Formes that are mechanically identical to their base forme inherit its sets, but
  // only in gens where the base actually has any — and never over a real Smogon entry.
  for (const [forme, base] of Object.entries(mirrorFormes)) {
    if (data[base] && !data[forme]) { data[forme] = data[base]; mirrored++; }
  }
  // Authored sets for formes Smogon does not cover at all.
  for (const [pokeName, tiers] of Object.entries(customSets[String(gen)] || {})) {
    data[pokeName] = Object.assign({}, data[pokeName], tiers);
    authored++;
  }

  let genCount = 0;

  for (const [pokeName, tiers] of Object.entries(data)) {
    if (!tiers || typeof tiers !== 'object') continue;

    for (const [formatKey, sets] of Object.entries(tiers)) {
      if (!sets || typeof sets !== 'object') continue;
      const category = categoryForFormat(formatKey);

      for (const [roleName, set] of Object.entries(sets)) {
        if (!set || !Array.isArray(set.moves) || set.moves.length === 0) continue;

        // Tag math runs on the FIRST option of each multi-value field
        // (so the bucket reflects the canonical build, not a fallback).
        const itemFirst    = pickFirst(set.item)    || 'Leftovers';
        const abilityFirst = pickFirst(set.ability) || '';
        const natureFirst  = pickFirst(set.nature)  || 'Hardy';

        const moves   = encodeMoves(set.moves);
        const tag     = tagBuild(itemFirst, abilityFirst, moves);
        const evArr   = flattenEvs(set.evs);
        const ivArr   = flattenIvs(set.ivs);

        // Pipe-encoded multi-option fields. Empty teratypes column for non-gen-9.
        const itemEnc    = pipeEncode(set.item)    || 'Leftovers';
        const abilityEnc = pipeEncode(set.ability);
        const natureEnc  = pipeEncode(set.nature)  || 'Hardy';
        const teraEnc    = (gen === 9) ? pipeEncode(set.teratypes) : '';

        const key = `${pokeName}|${gen}|${formatKey}|${roleName}|${itemFirst}|${moves.join('|')}`;
        if (seen.has(key)) continue;
        seen.add(key);

        rows.push([
          q(pokeName), q(tag), q(gen), q(formatKey), q(category),
          q(itemEnc), q(abilityEnc), q(natureEnc),
          q(moves[0]), q(moves[1]), q(moves[2]), q(moves[3]),
          ...evArr.map(v => q(v)),
          ...ivArr.map(v => q(v)),
          q(teraEnc)
        ].join(','));
        genCount++;
      }
    }
  }

  totalSets += genCount;
  console.log(`  gen${gen}: ${genCount} builds`);
}

const header = [
  'name','tag','gen','format','category',
  'item','ability','nature',
  'move1','move2','move3','move4',
  'hp_ev','atk_ev','def_ev','spa_ev','spd_ev','spe_ev',
  'hp_iv','atk_iv','def_iv','spa_iv','spd_iv','spe_iv',
  'teratypes'
].join(',');
const output = header + '\n' + rows.join('\n') + '\n';
const outPath = path.join(__dirname, '..', 'data', 'builds.csv');
fs.writeFileSync(outPath, output, 'utf8');

const sizeKB = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
console.log(`\ncustom.json overlay — ${mirrored} forme mirror(s), ${authored} authored entr(ies)`);
console.log(`Done — ${totalSets} total rows → data/builds.csv (${sizeKB} KB)`);
