#!/usr/bin/env node
// Completes local BACK / BACK-SHINY animated-sprite coverage for base-species Pokémon.
//
// Why: the player's active Pokémon renders back-facing (getSprite(..., back=true)). Until now
// only Mega/Gmax/Primal backs were vendored (see download-mega-gmax-sprites.mjs), so every
// ORDINARY species' back sprite was served remotely from Showdown on every battle — a network
// request per battle that also breaks offline play. This vendors them locally.
//
// Source: PokeAPI's Showdown mirror, keyed by National Dex number:
//   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back[/shiny]/{num}.gif
//
// Scope: BASE species only (Dex.species.get(slug).baseSpecies === name). Formes (arceus-*,
// rotom-*, regional forms, etc.) are intentionally SKIPPED — the id-keyed mirror would return
// the base form's back under a forme slug, which is wrong; those keep the runtime remote
// fallback (which is slug-keyed and correct for end-users). Mega/Gmax/Primal are handled by
// download-mega-gmax-sprites.mjs and are skipped here too.
//
// Sprites from PokeAPI are already optimized upstream; no gifsicle pass is needed.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');
const FRONT_DIR = path.join(SPRITES, 'gen5ani');
const CDN = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';

const VARIANTS = [
  { dir: 'gen5ani-back', urlPrefix: 'back/' },
  { dir: 'gen5ani-back-shiny', urlPrefix: 'back/shiny/' },
];

const FORM_RE = /-(mega|megax|megay|primal|gmax|eternamax)$/;

const FORCE = process.argv.includes('--force');
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  return a ? Number(a.slice('--limit='.length)) : Infinity;
})();

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'sprite-sync/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode === 404) { res.resume(); return resolve({ status: 404 }); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} for ${url}`)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 100) return resolve({ status: 'tiny', bytes: buf.length });
        fs.writeFileSync(dest, buf);
        resolve({ status: 200, bytes: buf.length });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
  });
}

async function pLimit(limit, items, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await fn(items[idx], idx); }
      catch (e) { results[idx] = { error: e.message }; }
    }
  });
  await Promise.all(workers);
  return results;
}

function buildJobs() {
  const slugs = fs.readdirSync(FRONT_DIR).filter((f) => f.endsWith('.gif')).map((f) => f.slice(0, -4));
  const jobs = [];
  let skippedForm = 0, skippedForme = 0, unresolved = 0;
  for (const slug of slugs) {
    if (FORM_RE.test(slug)) { skippedForm++; continue; }
    const sp = Dex.species.get(slug);
    if (!sp || !sp.exists) { unresolved++; continue; }
    if (sp.baseSpecies !== sp.name) { skippedForme++; continue; }   // forme → keep remote
    const num = sp.num;
    if (!num || num < 1) { unresolved++; continue; }
    for (const v of VARIANTS) {
      const dest = path.join(SPRITES, v.dir, `${slug}.gif`);
      ensureDir(path.dirname(dest));
      if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 100) continue;
      jobs.push({ slug, num, variant: v.dir, dest, url: `${CDN}/${v.urlPrefix}${num}.gif` });
    }
  }
  console.log(`[back-sync] base-species jobs=${jobs.length} (skipped: mega/gmax=${skippedForm}, formes=${skippedForme}, unresolved=${unresolved})`);
  return jobs.slice(0, LIMIT === Infinity ? jobs.length : LIMIT);
}

async function main() {
  const jobs = buildJobs();
  let ok = 0, miss = 0, err = 0, bytes = 0;
  const failures = [];
  await pLimit(8, jobs, async (job) => {
    const r = await download(job.url, job.dest);
    if (r.status === 200) { ok++; bytes += r.bytes; return; }
    if (r.status === 404) { miss++; failures.push(`${job.variant}/${job.slug} (num ${job.num}) → 404`); return; }
    err++; failures.push(`${job.variant}/${job.slug} → ${r.status}`);
  });
  console.log(`[back-sync] downloaded=${ok} (${(bytes / 1048576).toFixed(1)} MB) missing404=${miss} errors=${err}`);
  if (miss) console.log(`[back-sync] (404s keep the runtime remote fallback — e.g. newer-gen species absent from the mirror)`);
  if (err) { console.log('[back-sync] errors:'); failures.filter((f) => !f.endsWith('404')).slice(0, 20).forEach((f) => console.log('  ' + f)); }
}

main().catch((e) => { console.error('[back-sync] fatal:', e); process.exit(1); });
