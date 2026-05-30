#!/usr/bin/env node
// Vendors CORRECT item icons for Story Mode's shops/bag from PokeAPI sprites
// (same gen-style art as the 68 icons already in sprites/items/). These replace
// thematic *substitutes* in STORY_SHOP_ITEM_SPRITE_SLUG (battle.html) — e.g. a
// Fire Stone was showing a Flame Orb, a Protein a Muscle Band. Canonical items
// only; the game's invented items (sunOrb, berserkerSerum, ...) keep substitutes
// because no real icon exists. Fan-ripped reference art (see ATTRIBUTION.md).
//
// Usage: node scripts/download-item-icons.mjs

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'sprites', 'items');
const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

// Canonical items that currently render a wrong substitute icon. Slugs match
// PokeAPI's filenames and the names wired into STORY_SHOP_ITEM_SPRITE_SLUG.
const ICONS = [
  // evolution stones (Stone Emporium)
  'fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone',
  'sun-stone', 'ice-stone', 'dusk-stone', 'dawn-stone', 'shiny-stone',
  // vitamins
  'hp-up', 'protein', 'iron', 'calcium', 'zinc', 'carbos',
  // evolution items
  'dragon-scale', 'kings-rock', 'metal-coat', 'up-grade', 'dubious-disc',
  'protector', 'electirizer', 'magmarizer', 'reaper-cloth',
  'deep-sea-tooth', 'deep-sea-scale', 'prism-scale', 'sachet', 'whipped-dream',
  // healing tiers (each was sharing one icon)
  'potion', 'super-potion', 'hyper-potion', 'max-elixir',
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'item-icons/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); return download(res.headers.location).then(resolve, reject); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks))); res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  let ok = 0; const failed = [];
  for (const slug of ICONS) {
    try {
      const buf = await download(`${BASE}/${slug}.png`);
      if (buf.length < 67 || buf.readUInt32BE(0) !== 0x89504E47) throw new Error('not a PNG');
      fs.writeFileSync(path.join(OUT, `${slug}.png`), buf);
      ok++;
    } catch (e) { failed.push(`${slug} (${e.message})`); }
  }
  console.log(`[item-icons] ${ok}/${ICONS.length} downloaded -> sprites/items/`);
  if (failed.length) console.error('[item-icons] FAILED:', failed.join(', '));
  process.exit(failed.length ? 1 : 0);
}
main();
