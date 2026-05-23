#!/usr/bin/env node
// Verify that every Mega / Primal / Gmax form named in battle.html has a local sprite.
// Reports the gap so the download script can be re-run if needed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
function parseGmaxSpecies() {
  const m = HTML.match(/const GMAX_SPECIES = new Set\(\[([\s\S]*?)\]\);/);
  if (!m) return [];
  const re = /"([^"]+?)"/g;
  const out = [];
  let mm;
  while ((mm = re.exec(m[1]))) out.push(mm[1]);
  return out;
}

function toSlug(name) {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/♀/g, '-f').replace(/♂/g, '-m')
    .replace(/\s+/g, '-').replace(/\./g, '').replace(/'/g, '')
    .replace(/-mega-x/g, '-megax').replace(/-mega-y/g, '-megay')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/-$/, '');
}

const megaForms = parseMegaFormNames();
const gmaxSpecies = parseGmaxSpecies();

// Known gaps that have no official PokeAPI/Showdown sprite — handled via runtime fallback chain.
const EXPECTED_GAPS_FRONT = new Set([
  'crucibelle-mega', // Smogon CAP Pokemon; not on PokeAPI. Showdown serves it via URL fallback.
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
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let manifestMismatch = 0;
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

// Exit code: nonzero only on UNEXPECTED front-sprite gaps (Smogon CAP & special-form gaps don't count).
const unexpectedFront = frontMissing.filter((r) => !EXPECTED_GAPS_FRONT.has(r.slug));
process.exit(unexpectedFront.length > 0 ? 1 : 0);
