/**
 * Generates supplemental TRAINER_DATA rows for every Trainerlist PNG not covered
 * by existing name → sprite resolution. Run: node scripts/gen-story-trainers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'battle.html');
const listPath = path.join(root, 'trainerlist_files.txt');

const html = fs.readFileSync(htmlPath, 'utf8');
const basenames = fs.readFileSync(listPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);

function sanitize(name) {
  return String(name).replace(/\s+/g, '_').replace(/[().\/]/g, '');
}

function parseSpriteMap(src) {
  const map = {};
  const m = src.match(/const SPRITE_MAP = \{([\s\S]*?)\n\s*\};/);
  if (!m) return map;
  const body = m[1];
  const re = /'((?:\\'|[^'])*)'\s*:\s*'((?:\\'|[^'])*)'/g;
  let mm;
  while ((mm = re.exec(body))) {
    map[mm[1].replace(/\\'/g, "'")] = mm[2].replace(/\\'/g, "'");
  }
  return map;
}

const SPRITE_MAP = parseSpriteMap(html);

const tdStart = html.indexOf('const TRAINER_DATA = [');
const storyStart = html.indexOf('const STORY_EVENTS_RAW', tdStart);
const tdBlock = html.slice(tdStart, storyStart);
const nameRe = /name:'((?:\\'|[^'])*)'/g;
const existingNames = new Set();
let nm;
while ((nm = nameRe.exec(tdBlock))) {
  existingNames.add(nm[1].replace(/\\'/g, "'"));
}

function resolveFile(name) {
  return SPRITE_MAP[name] || sanitize(name);
}

const covered = new Set();
for (const name of existingNames) {
  covered.add(resolveFile(name));
}

function basenameToDisplay(b) {
  let s = b
    .replace(/___0026_/g, ' & ')
    .replace(/__0301/g, '')
    .replace(/~/g, ' ')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s || b;
}

function inferType(display, b) {
  const d = (display + ' ' + b).toLowerCase();
  const rules = [
    [['fire', 'magma', 'flare', 'burner'], 'Fire'],
    [['water', 'aqua', 'swimmer', 'sailor', 'fisher'], 'Water'],
    [['grass', 'ranger', 'aroma'], 'Grass'],
    [['electric', 'guitarist'], 'Electric'],
    [['ice', 'skier', 'boarder'], 'Ice'],
    [['fighting', 'blackbelt', 'black belt', 'crush girl', 'battle girl', 'martial'], 'Fighting'],
    [['poison', 'rocket', 'galactic', 'plasma'], 'Poison'],
    [['ground', 'hiker', 'ruin'], 'Ground'],
    [['flying', 'bird', 'pilot'], 'Flying'],
    [['psychic', 'hex', 'medium', 'channeler'], 'Psychic'],
    [['bug', 'bug catcher'], 'Bug'],
    [['rock', 'rocker'], 'Rock'],
    [['ghost', 'hex maniac'], 'Ghost'],
    [['dragon', 'dragon tamer'], 'Dragon'],
    [['dark', 'skull', 'biker', 'roughneck'], 'Dark'],
    [['steel', 'engineer', 'depot'], 'Steel'],
    [['fairy', 'beauty', 'lady'], 'Fairy'],
  ];
  for (const [keys, t] of rules) {
    if (keys.some((k) => d.includes(k))) return t;
  }
  return 'Normal';
}

const SIG_POOL = {
  Normal: ['Rattata', 'Sentret', 'Zigzagoon', 'Bidoof', 'Patrat'],
  Fire: ['Vulpix', 'Growlithe', 'Slugma', 'Numel', 'Litleo'],
  Water: ['Wooper', 'Marill', 'Lotad', 'Wingull', 'Arrokuda'],
  Grass: ['Oddish', 'Seedot', 'Shroomish', 'Petilil', 'Grookey'],
  Electric: ['Pichu', 'Mareep', 'Electrike', 'Blitzle', 'Toxel'],
  Ice: ['Snorunt', 'Snom', 'Cubchoo', 'Spheal', 'Vanillite'],
  Fighting: ['Machop', 'Makuhita', 'Meditite', 'Croagunk', 'Stufful'],
  Poison: ['Ekans', 'Zubat', 'Trubbish', 'Salazzle', 'Gulpin'],
  Ground: ['Diglett', 'Phanpy', 'Trapinch', 'Drilbur', 'Silicobra'],
  Flying: ['Pidgey', 'Starly', 'Pidove', 'Fletchling', 'Rookidee'],
  Psychic: ['Abra', 'Drowzee', 'Spoink', 'Gothita', 'Espurr'],
  Bug: ['Caterpie', 'Weedle', 'Wurmple', 'Sewaddle', 'Grubbin'],
  Rock: ['Geodude', 'Roggenrola', 'Nosepass', 'Bonsly', 'Rolycoly'],
  Ghost: ['Gastly', 'Duskull', 'Litwick', 'Phantump', 'Sinistea'],
  Dragon: ['Dratini', 'Bagon', 'Gible', 'Axew', 'Goomy'],
  Dark: ['Poochyena', 'Purrloin', 'Zorua', 'Nickit', 'Maschiff'],
  Steel: ['Aron', 'Beldum', 'Shieldon', 'Klink', 'Togedemaru'],
  Fairy: ['Cleffa', 'Ralts', 'Azurill', 'Spritzee', 'Milcery'],
  Mixed: ['Rattata', 'Eevee', 'Dunsparce', 'Chatot', 'Kecleon'],
};

function sigsFor(type) {
  const pool = SIG_POOL[type] || SIG_POOL.Mixed;
  const out = [];
  for (let i = 0; i < 5; i++) out.push(pool[(i + type.length) % pool.length]);
  return out;
}

const newRows = [];
const usedDisplay = new Set(existingNames);

for (const b of basenames) {
  if (covered.has(b)) continue;
  const display = basenameToDisplay(b);
  let name = display;
  let n = 2;
  while (usedDisplay.has(name)) {
    name = `${display} (${n})`;
    n++;
  }
  usedDisplay.add(name);
  const type = inferType(display, b);
  const sigs = sigsFor(type);
  const charGen = (b.length % 9) + 1;
  const pkmGens = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((g) => g >= charGen - 2 && g <= Math.min(9, charGen + 4));
  const role = /Champion|Elite|Gym|Leader|E[1-4]|Frontier|Brain/i.test(b) ? 'Elite Trainer' : 'Basic Trainer';
  newRows.push({
    name,
    spriteFile: b,
    role,
    type,
    sigs,
    charGen,
    pkmGens: pkmGens.length ? pkmGens : [1, 9],
  });
}

const lines = newRows.map((t) => {
  const sigStr = t.sigs.map((s) => `'${s}'`).join(',');
  const pg = `[${t.pkmGens.join(',')}]`;
  return `          { role:'${t.role}', name:'${t.name.replace(/'/g, "\\'")}', type:'${t.type}', sigs:[${sigStr}], charGen:${t.charGen}, pkmGens:${pg}, spriteFile:'${t.spriteFile}' },`;
});

const outPath = path.join(root, 'scripts', 'generated-trainer-rows.txt');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

console.log('Trainer PNG count:', basenames.length);
console.log('Existing trainer names:', existingNames.size);
console.log('Already covered basenames:', covered.size);
console.log('New supplemental rows:', newRows.length);
console.log('Wrote', outPath);

// Verification: all basenames should be covered after merge
const after = new Set(covered);
for (const t of newRows) after.add(t.spriteFile);
const missing = basenames.filter((b) => !after.has(b));
if (missing.length) console.warn('Still missing:', missing.slice(0, 20), '...');
