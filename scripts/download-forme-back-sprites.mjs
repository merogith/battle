#!/usr/bin/env node
// Vendors FORME back / back-shiny animated sprites (plus the last few missing front-shiny)
// that the base-species script (download-back-sprites.mjs) intentionally skips.
//
// Why: download-back-sprites.mjs covers BASE species only (its id-keyed source returns the
// base form under a forme slug, which is wrong). That left ~122 forme back sprites unvendored
// — every battle with a regional form / Rotom appliance / alt forme hit the network for the
// player's back sprite (and broke offline play). This script fills them correctly.
//
// Source: PokeAPI's GitHub sprite mirror, keyed by the national-dex FORM id (>10000) resolved
// from PokeAPI's pokemon.csv (`identifier` → `id`). Showdown's own slug-keyed CDN is NOT used
// (it is frequently network-blocked in CI / sandboxes; the GitHub mirror is reachable).
//   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back[/shiny]/{id}.gif
//
// Three classes of forme:
//   1. Resolvable (regional forms, Rotom, Deoxys, Kyurem, gmax, …) → downloaded by form id.
//   2. Arceus-* / Silvally-* type forms → no separate PokeAPI id; their BACK sprite is the
//      base species' back (the type only tints the front), so we copy the local base back.
//   3. CAP fakemon (aurumoth, mollux, …) → not in PokeAPI at all; keep the runtime remote
//      fallback. Reported, not fetched.
//
// Re-run `npm run sprites:manifest` afterwards so LOCAL_SPRITE_MANIFEST picks up the new files.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');
const FRONT = path.join(SPRITES, 'gen5ani');
const FRONT_SHINY = path.join(SPRITES, 'gen5ani-shiny');
const BACK = path.join(SPRITES, 'gen5ani-back');
const BACK_SHINY = path.join(SPRITES, 'gen5ani-back-shiny');
const SHOWDOWN_MIRROR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';
const CSV_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv';
const CSV_CACHE = '/tmp/pokeapi-pokemon.csv';

const FORCE = process.argv.includes('--force');

// Showdown sprite slug → PokeAPI `pokemon.csv` identifier, for the formes whose slugs differ.
const SLUG_TO_POKEAPI = {
  'basculegion-f': 'basculegion-female',
  'indeedee-f': 'indeedee-female',
  'maushold-four': 'maushold-family-of-four',
  'ironhands': 'iron-hands',
  'ironmoth': 'iron-moth',
  'ironthorns': 'iron-thorns',
  'ironvaliant': 'iron-valiant',
  'urshifu-gmax': 'urshifu-single-strike-gmax',
  'urshifu-rapidstrike-gmax': 'urshifu-rapid-strike-gmax',
};

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function listGifs(dir) { return new Set(fs.readdirSync(dir).filter((f) => f.endsWith('.gif')).map((f) => f.slice(0, -4))); }
function hasFile(p) { try { return fs.statSync(p).size > 100; } catch { return false; } }

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'sprite-sync/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); return get(res.headers.location).then(resolve, reject); }
      if (res.statusCode === 404) { res.resume(); return resolve({ status: 404 }); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} for ${url}`)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: 200, buf: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
  });
}

async function download(url, dest) {
  const r = await get(url);
  if (r.status !== 200) return r;
  if (r.buf.length < 100) return { status: 'tiny', bytes: r.buf.length };
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, r.buf);
  return { status: 200, bytes: r.buf.length };
}

async function pLimit(limit, items, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < items.length) { const idx = i++; try { await fn(items[idx]); } catch (e) { items[idx]._err = e.message; } }
  }));
}

async function loadIdMap() {
  let csv;
  if (hasFile(CSV_CACHE)) { csv = fs.readFileSync(CSV_CACHE, 'utf8'); }
  else { const r = await get(CSV_URL); if (r.status !== 200) throw new Error('pokemon.csv fetch failed'); csv = r.buf.toString('utf8'); fs.writeFileSync(CSV_CACHE, csv); }
  const map = new Map();
  for (const line of csv.trim().split('\n').slice(1)) { const c = line.split(','); map.set(c[1], Number(c[0])); }
  return map;
}

function resolveId(slug, idMap) {
  if (SLUG_TO_POKEAPI[slug] && idMap.has(SLUG_TO_POKEAPI[slug])) return idMap.get(SLUG_TO_POKEAPI[slug]);
  if (idMap.has(slug)) return idMap.get(slug);
  return 0;
}

async function main() {
  const idMap = await loadIdMap();
  const front = listGifs(FRONT);
  const back = listGifs(BACK);
  const frontShiny = listGifs(FRONT_SHINY);

  const formeTargets = [...front].filter((s) => !back.has(s));

  const jobs = [];      // { slug, url, dest, kind }
  const copies = [];    // { from, to } — Arceus/Silvally base-back reuse
  const unresolved = []; // CAP fakemon etc.

  for (const slug of formeTargets) {
    // Arceus / Silvally type forms: back sprite == base species back (type only tints front).
    const baseMatch = /^(arceus|silvally)-/.exec(slug);
    if (baseMatch) {
      const base = baseMatch[1];
      for (const [dir, srcDir] of [[BACK, BACK], [BACK_SHINY, BACK_SHINY]]) {
        const fromBase = path.join(srcDir, `${base}.gif`);
        const to = path.join(dir, `${slug}.gif`);
        if (hasFile(fromBase) && (FORCE || !hasFile(to))) copies.push({ from: fromBase, to });
      }
      continue;
    }
    const id = resolveId(slug, idMap);
    if (!id) { unresolved.push(slug); continue; }
    const backDest = path.join(BACK, `${slug}.gif`);
    const backShinyDest = path.join(BACK_SHINY, `${slug}.gif`);
    if (FORCE || !hasFile(backDest)) jobs.push({ slug, kind: 'back', url: `${SHOWDOWN_MIRROR}/back/${id}.gif`, dest: backDest });
    if (FORCE || !hasFile(backShinyDest)) jobs.push({ slug, kind: 'back-shiny', url: `${SHOWDOWN_MIRROR}/back/shiny/${id}.gif`, dest: backShinyDest });
  }

  // Front-shiny gaps (base species missing only the shiny front sprite).
  for (const slug of [...front].filter((s) => !frontShiny.has(s))) {
    const id = resolveId(slug, idMap);
    if (!id) { unresolved.push(`${slug} (front-shiny)`); continue; }
    const dest = path.join(FRONT_SHINY, `${slug}.gif`);
    if (FORCE || !hasFile(dest)) jobs.push({ slug, kind: 'front-shiny', url: `${SHOWDOWN_MIRROR}/shiny/${id}.gif`, dest });
  }

  // Apply base-back copies for Arceus/Silvally.
  let copied = 0;
  for (const c of copies) { ensureDir(path.dirname(c.to)); fs.copyFileSync(c.from, c.to); copied++; }

  console.log(`[forme-back] jobs=${jobs.length} copies(arceus/silvally)=${copied} unresolved(CAP/other)=${unresolved.length}`);

  let ok = 0, miss = 0, err = 0, bytes = 0;
  const missList = [];
  await pLimit(8, jobs, async (job) => {
    const r = await download(job.url, job.dest);
    if (r.status === 200) { ok++; bytes += r.bytes; }
    else if (r.status === 404) { miss++; missList.push(`${job.kind}/${job.slug}`); }
    else { err++; missList.push(`${job.kind}/${job.slug} → ${r.status || job._err}`); }
  });

  console.log(`[forme-back] downloaded=${ok} (${(bytes / 1048576).toFixed(1)} MB) copied=${copied} missing404=${miss} errors=${err}`);
  if (missList.length) console.log(`[forme-back] no animated mirror sprite (keep runtime fallback): ${missList.join(', ')}`);
  if (unresolved.length) console.log(`[forme-back] not in PokeAPI (CAP fakemon etc., keep runtime fallback): ${[...new Set(unresolved)].join(', ')}`);
}

main().catch((e) => { console.error('[forme-back] fatal:', e); process.exit(1); });
