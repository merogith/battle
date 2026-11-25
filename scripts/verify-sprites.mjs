#!/usr/bin/env node
// Audit installed art for the full roster and its cosmetic formes using the runtime resolver.
// Include --details to list intentional same-form fallbacks and unavailable artwork.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/sim';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');
const HTML = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');

function parseMegaFormNames() {
  const m = HTML.match(/const MEGA_FORM_NAMES = \{([\s\S]*?)\};/);
  if (!m) return [];
  const re = /"([^"]+?)"\s*:\s*"([^"]+?)"/g;
  const out = new Set();
  let mm;
  while ((mm = re.exec(m[1]))) out.add(mm[2]);
  return [...out];
}
// Formes reachable only through MEGA_FORM_BY_SPECIES (stones shared by several formes
// of one species: Meowsticite, Magearnite, Tatsugirinite).
function parseFormeSpecificMegas() {
  const m = HTML.match(/const MEGA_FORM_BY_SPECIES = \{([\s\S]*?)\n {8}\};/);
  if (!m) return [];
  const re = /"([^"]+?)"\s*:\s*"([^"]+?)"/g;
  const out = new Set();
  let mm;
  while ((mm = re.exec(m[1]))) out.add(mm[2]);
  return [...out];
}
// Mirror battle.html's SPRITE_ID_ALIASES so slugs here match the ones getSprite emits.
function parseSpriteAliases() {
  const m = HTML.match(/const SPRITE_ID_ALIASES = \{([\s\S]*?)\n {8}\};/);
  if (!m) return {};
  const re = /'([^']+)'\s*:\s*'([^']+)'/g;
  const out = {};
  let mm;
  while ((mm = re.exec(m[1]))) out[mm[1]] = mm[2];
  return out;
}
function parseGmaxSpecies() {
  const m = HTML.match(/const GMAX_SPECIES = new Set\(\[([\s\S]*?)\]\);/);
  if (!m) return [];
  const re = /"([^"]+?)"/g;
  const out = [];
  let mm;
  while ((mm = re.exec(m[1]))) out.push(mm[1]);
  return out;
}

const SPRITE_ALIASES = parseSpriteAliases();

function toSlug(name) {
  const normalized = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/♀/g, '-f').replace(/♂/g, '-m')
    .replace(/\s+/g, '-').replace(/\./g, '').replace(/'/g, '')
    .replace(/-mega-([xyz])/g, '-mega$1')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/-$/, '');
  return SPRITE_ALIASES[normalized] || normalized;
}

const megaForms = [...new Set([...parseMegaFormNames(), ...parseFormeSpecificMegas()])];
const gmaxSpecies = parseGmaxSpecies();

// Known exceptions to direct Mega/Gmax sprite coverage.
const EXPECTED_GAPS_FRONT = new Set([
  'crucibelle-mega', // Smogon CAP form with no bundled sprite.
  'eternatus-gmax',  // Eternatus uses its Eternamax sprite (aliased in SPRITE_ID_ALIASES).
]);
// Some Gmaxes are too large to have back-facing sprites on PokeAPI's Showdown mirror.
const EXPECTED_GAPS_BACK = new Set([
  'crucibelle-mega',
  'eternatus-gmax',
  'venusaur-gmax', 'blastoise-gmax', 'rillaboom-gmax', 'cinderace-gmax',
  'inteleon-gmax', 'urshifu-gmax',
]);

const required = [];
for (const f of megaForms) required.push({ name: f, slug: toSlug(f), kind: 'mega/primal' });
for (const s of gmaxSpecies) required.push({ name: `${s}-Gmax`, slug: toSlug(`${s}-Gmax`), kind: 'gmax' });
required.push({ name: 'Eternatus-Eternamax', slug: 'eternatus-eternamax', kind: 'eternamax' });

const DIRS = ['gen5ani', 'gen5ani-shiny', 'gen5ani-back', 'gen5ani-back-shiny'];

let frontMissing = [], shinyMissing = [], backMissing = [], backShinyMissing = [];
for (const r of required) {
  const file = `${r.slug}.gif`;
  if (!fs.existsSync(path.join(SPRITES, 'gen5ani', file))) frontMissing.push(r);
  if (!fs.existsSync(path.join(SPRITES, 'gen5ani-shiny', file))) shinyMissing.push(r);
  if (!fs.existsSync(path.join(SPRITES, 'gen5ani-back', file))) backMissing.push(r);
  if (!fs.existsSync(path.join(SPRITES, 'gen5ani-back-shiny', file))) backShinyMissing.push(r);
}

function fmt(arr, expected) {
  const unexpected = arr.filter((r) => !expected.has(r.slug));
  const known = arr.filter((r) => expected.has(r.slug));
  if (unexpected.length === 0) {
    return known.length === 0 ? '✓ complete' : `✓ ${known.length} expected gap${known.length === 1 ? '' : 's'} only (runtime fallback handles)`;
  }
  return `${unexpected.length} unexpected missing: ${unexpected.map((r) => r.slug).join(', ')}`;
}

console.log(`Required Mega/Primal forms : ${megaForms.length}`);
console.log(`Required G-Max forms       : ${gmaxSpecies.length + 1} (incl. Eternamax)`);
console.log(`Required total             : ${required.length}`);
console.log();
console.log(`gen5ani/                   : ${fmt(frontMissing, EXPECTED_GAPS_FRONT)}`);
console.log(`gen5ani-shiny/             : ${fmt(shinyMissing, EXPECTED_GAPS_FRONT)}`);
console.log(`gen5ani-back/              : ${fmt(backMissing, EXPECTED_GAPS_BACK)}`);
console.log(`gen5ani-back-shiny/        : ${fmt(backShinyMissing, EXPECTED_GAPS_BACK)}`);

// Manifest consistency
const manifestPath = path.join(SPRITES, 'manifest.json');
let manifestMismatch = 0;
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const dir of DIRS) {
    const filesOnDisk = fs.readdirSync(path.join(SPRITES, dir))
      .filter((f) => f.endsWith('.gif'))
      .map((f) => f.slice(0, -4))
      .sort();
    const inManifest = (manifest[dir] || []).slice().sort();
    if (JSON.stringify(filesOnDisk) !== JSON.stringify(inManifest)) {
      console.log(`! manifest.json out of date for ${dir}/ (disk=${filesOnDisk.length} manifest=${inManifest.length}) — run scripts/build-sprite-manifest.mjs`);
      manifestMismatch++;
    }
  }
  if (!manifestMismatch) console.log(`manifest.json              : ✓ in sync`);
}

const start = HTML.indexOf('const _spriteCache = {};');
const end = HTML.indexOf('window.syncSettingsModalSwitches', start);
const { getSprite, SPRITE_PLACEHOLDER } = vm.runInNewContext(
  `${HTML.slice(start, end)}\n;({ getSprite, SPRITE_PLACEHOLDER });`,
);
const roster = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/species.json'), 'utf8'))['9'])
  .filter(entry => entry.num > 0 && entry.baseStats);
const forms = new Set(roster.flatMap(({ name }) => [name, ...(Dex.species.get(name).cosmeticFormes || [])]));
const regionalForms = roster.filter(({ name }) => /-(?:Alola|Galar|Hisui|Paldea)(?:-|$)/.test(name)).map(({ name }) => name);
const regionalSet = new Set(regionalForms);
let unavailableOnDisk = 0;
let regionalGaps = 0;
console.log(`\nFull roster audit           : ${forms.size} roster and cosmetic formes, ${regionalSet.size} regional entries`);
for (const [dir, shiny, back] of [
  ['gen5ani', false, false], ['gen5ani-shiny', true, false],
  ['gen5ani-back', false, true], ['gen5ani-back-shiny', true, true],
]) {
  const sameFormFallbacks = [];
  const placeholders = [];
  for (const name of forms) {
    const url = getSprite(name, shiny, back);
    if (!url.startsWith('sprites/') || !fs.existsSync(path.join(ROOT, url))) {
      console.error(`Bad resolved path for ${name}: ${url}`);
      unavailableOnDisk++;
    }
    if (url.startsWith(`sprites/${dir}/`)) continue;
    if (regionalSet.has(name)) {
      console.error(`Missing regional artwork in ${dir} for ${name}`);
      regionalGaps++;
    }
    if (url === SPRITE_PLACEHOLDER) placeholders.push(name);
    else sameFormFallbacks.push(name);
  }
  console.log(`${dir.padEnd(26)} : ${forms.size - sameFormFallbacks.length - placeholders.length} requested art, ${sameFormFallbacks.length} same-form fallbacks, ${placeholders.length} placeholders`);
  if (process.argv.includes('--details')) {
    if (sameFormFallbacks.length) console.log(`  Same-form fallback: ${sameFormFallbacks.join(', ')}`);
    if (placeholders.length) console.log(`  Art unavailable: ${placeholders.join(', ')}`);
  }
}

const unexpectedFront = frontMissing.filter((r) => !EXPECTED_GAPS_FRONT.has(r.slug));
process.exitCode = Number(unexpectedFront.length > 0 || manifestMismatch > 0 || unavailableOnDisk > 0 || regionalGaps > 0);
