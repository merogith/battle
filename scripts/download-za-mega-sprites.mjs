#!/usr/bin/env node
// Vendors battle sprites for the Legends: Z-A wave of Mega Evolutions.
//
// Companion to scripts/download-mega-gmax-sprites.mjs, which covers the Gen 6
// ORAS megas / primals / Gmaxes. Those all have hand-animated BW-style GIFs
// upstream; this newer wave does not (yet) — only the first nine do. So this
// script walks a per-variant candidate chain and re-encodes whatever it finds
// into the `.gif` the runtime expects (see scripts/lib/png-gif.mjs for why):
//
//   1. PokeAPI's Showdown mirror  → animated GIF, used verbatim.
//   2. PokeAPI's 96x96 game sprite → static PNG, re-encoded as a 1-frame GIF.
//   3. PokeAPI's HOME render       → downscaled + quantised 1-frame GIF.
//
// Slugs match toShowdownSpriteId() in battle.html (after SPRITE_ID_ALIASES), so
// the output drops straight into sprites/gen5ani*/ and is picked up by
// `npm run sprites:manifest`.
//
// Usage: node scripts/download-za-mega-sprites.mjs [--force] [--only=gen5ani,gen5ani-back]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pngToGif } from './lib/png-gif.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');

const CDN = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

// sprite slug → PokeAPI National Dex form ID. Keep in sync with FORM_DEX_IDS in
// battle.html (tests/suites/mega-roster.test.js asserts the two agree).
const FORM_IDS = {
  'clefable-mega': 10278,
  'victreebel-mega': 10279,
  'starmie-mega': 10280,
  'dragonite-mega': 10281,
  'meganium-mega': 10282,
  'feraligatr-mega': 10283,
  'skarmory-mega': 10284,
  'froslass-mega': 10285,
  'emboar-mega': 10286,
  'excadrill-mega': 10287,
  'scolipede-mega': 10288,
  'scrafty-mega': 10289,
  'eelektross-mega': 10290,
  'chandelure-mega': 10291,
  'chesnaught-mega': 10292,
  'delphox-mega': 10293,
  'greninja-mega': 10294,
  'pyroar-mega': 10295,
  'floette-mega': 10296,
  'malamar-mega': 10297,
  'barbaracle-mega': 10298,
  'dragalge-mega': 10299,
  'hawlucha-mega': 10300,
  'zygarde-mega': 10301,
  'drampa-mega': 10302,
  'falinks-mega': 10303,
  'raichu-megax': 10304,
  'raichu-megay': 10305,
  'chimecho-mega': 10306,
  'absol-megaz': 10307,
  'staraptor-mega': 10308,
  'garchomp-megaz': 10309,
  'lucario-megaz': 10310,
  'heatran-mega': 10311,
  'darkrai-mega': 10312,
  'golurk-mega': 10313,
  'meowstic-mega': 10314,
  'crabominable-mega': 10315,
  'golisopod-mega': 10316,
  'magearna-mega': 10317,
  'magearna-original-mega': 10318,
  'zeraora-mega': 10319,
  'scovillain-mega': 10320,
  'glimmora-mega': 10321,
  'tatsugiri-curly-mega': 10322,
  'tatsugiri-droopy-mega': 10323,
  'tatsugiri-stretchy-mega': 10324,
  'baxcalibur-mega': 10325,
  'meowstic-f-mega': 10326,
};

// HOME renders are front-facing only and have no shiny/back split for every form,
// so the chain degrades toward the plain front render as a last resort.
const VARIANTS = [
  { dir: 'gen5ani', ani: '', still: '', home: '' },
  { dir: 'gen5ani-shiny', ani: 'shiny/', still: 'shiny/', home: 'shiny/' },
  { dir: 'gen5ani-back', ani: 'back/', still: 'back/', home: '' },
  { dir: 'gen5ani-back-shiny', ani: 'back/shiny/', still: 'back/shiny/', home: 'shiny/' },
];

const HOME_MAX_EDGE = 112; // roughly matches the tallest gen5ani frames

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'pbs-sprite-sync/1.0' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 100 ? buf : null;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  return null;
}

async function fetchVariant(id, v) {
  const ani = await get(`${CDN}/other/showdown/${v.ani}${id}.gif`);
  if (ani) return { buf: ani, source: 'animated' };

  const still = await get(`${CDN}/${v.still}${id}.png`);
  if (still) return { buf: pngToGif(still), source: 'static' };

  const home = await get(`${CDN}/other/home/${v.home}${id}.png`);
  if (home) return { buf: pngToGif(home, { maxSize: HOME_MAX_EDGE }), source: 'home' };

  return null;
}

async function pLimit(limit, items, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx]); }
      catch (e) { out[idx] = { ...items[idx], error: e.message }; }
    }
  }));
  return out;
}

const FORCE = process.argv.includes('--force');
const ONLY = (() => {
  const arg = process.argv.find((a) => a.startsWith('--only='));
  return arg ? new Set(arg.slice('--only='.length).split(',')) : null;
})();

async function main() {
  const jobs = [];
  for (const [slug, id] of Object.entries(FORM_IDS)) {
    for (const v of VARIANTS) {
      if (ONLY && !ONLY.has(v.dir)) continue;
      const dest = path.join(SPRITES, v.dir, `${slug}.gif`);
      ensureDir(path.dirname(dest));
      if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 100) continue;
      jobs.push({ slug, id, v, dest });
    }
  }
  console.log(`[za-megas] ${Object.keys(FORM_IDS).length} forms — ${jobs.length} sprite files to fetch.`);

  const counts = { animated: 0, static: 0, home: 0 };
  const failures = [];
  const results = await pLimit(8, jobs, async (job) => {
    const r = await fetchVariant(job.id, job.v);
    if (!r) { failures.push(job); return { ...job, ok: false }; }
    fs.writeFileSync(job.dest, r.buf);
    counts[r.source]++;
    return { ...job, ok: true, source: r.source };
  });

  const errored = results.filter((r) => r && r.error);
  console.log(`[za-megas] animated=${counts.animated} static=${counts.static} home=${counts.home} missing=${failures.length} errors=${errored.length}`);
  for (const r of results) {
    if (r && r.ok && r.source !== 'animated') console.log(`  ${r.v.dir}/${r.slug}.gif (${r.source})`);
  }
  for (const f of failures) console.log(`  MISSING ${f.v.dir}/${f.slug}.gif`);
  for (const e of errored) console.log(`  ERROR ${e.v.dir}/${e.slug}.gif → ${e.error}`);
  if (errored.length) process.exitCode = 1;
}

main().catch((e) => { console.error('[za-megas] fatal:', e); process.exit(1); });
