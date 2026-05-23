#!/usr/bin/env node
// Downloads Mega / Primal / Gmax animated sprites from PokeAPI's Showdown mirror.
// Source: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/
// Targets all four variant directories: front, shiny, back, back-shiny.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');

const CDN = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';

// Mapping: sprite-slug (canonical, matches toShowdownSpriteId output) → PokeAPI National Dex form ID.
// Source: https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2/pokemon/{id}/index.json
// Note: getSprite() uses slugs like "charizard-megax" (per SPRITE_ID_ALIASES), not "charizard-mega-x".
// The Showdown sprite at .../sprites/pokemon/other/showdown/{id}.gif matches /pokemon/{id} (not pokemon-form).
const FORM_IDS = {
  // ── MEGA EVOLUTIONS (Gen 6 ORAS) ──
  'venusaur-mega': 10033,
  'charizard-megax': 10034,
  'charizard-megay': 10035,
  'blastoise-mega': 10036,
  'alakazam-mega': 10037,
  'gengar-mega': 10038,
  'kangaskhan-mega': 10039,
  'pinsir-mega': 10040,
  'gyarados-mega': 10041,
  'aerodactyl-mega': 10042,
  'mewtwo-megax': 10043,
  'mewtwo-megay': 10044,
  'ampharos-mega': 10045,
  'scizor-mega': 10046,
  'heracross-mega': 10047,
  'houndoom-mega': 10048,
  'tyranitar-mega': 10049,
  'blaziken-mega': 10050,
  'gardevoir-mega': 10051,
  'mawile-mega': 10052,
  'aggron-mega': 10053,
  'medicham-mega': 10054,
  'manectric-mega': 10055,
  'banette-mega': 10056,
  'absol-mega': 10057,
  'garchomp-mega': 10058,
  'lucario-mega': 10059,
  'abomasnow-mega': 10060,
  'latias-mega': 10062,
  'latios-mega': 10063,
  'swampert-mega': 10064,
  'sceptile-mega': 10065,
  'sableye-mega': 10066,
  'altaria-mega': 10067,
  'gallade-mega': 10068,
  'audino-mega': 10069,
  'sharpedo-mega': 10070,
  'slowbro-mega': 10071,
  'steelix-mega': 10072,
  'pidgeot-mega': 10073,
  'glalie-mega': 10074,
  'diancie-mega': 10075,
  'metagross-mega': 10076,
  'rayquaza-mega': 10079,
  'camerupt-mega': 10087,
  'lopunny-mega': 10088,
  'salamence-mega': 10089,
  'beedrill-mega': 10090,

  // ── PRIMAL REVERSIONS (Gen 6 ORAS) ──
  'kyogre-primal': 10077,
  'groudon-primal': 10078,

  // ── ETERNAMAX (Gen 8 SwSh) ──
  'eternatus-eternamax': 10190,

  // ── G-MAX FORMS (Gen 8 SwSh) ──
  'venusaur-gmax': 10195,
  'charizard-gmax': 10196,
  'blastoise-gmax': 10197,
  'butterfree-gmax': 10198,
  'pikachu-gmax': 10199,
  'meowth-gmax': 10200,
  'machamp-gmax': 10201,
  'gengar-gmax': 10202,
  'kingler-gmax': 10203,
  'lapras-gmax': 10204,
  'eevee-gmax': 10205,
  'snorlax-gmax': 10206,
  'garbodor-gmax': 10207,
  'melmetal-gmax': 10208,
  'rillaboom-gmax': 10209,
  'cinderace-gmax': 10210,
  'inteleon-gmax': 10211,
  'corviknight-gmax': 10212,
  'orbeetle-gmax': 10213,
  'drednaw-gmax': 10214,
  'coalossal-gmax': 10215,
  'flapple-gmax': 10216,
  'appletun-gmax': 10217,
  'sandaconda-gmax': 10218,
  'toxtricity-gmax': 10219,
  'centiskorch-gmax': 10220,
  'hatterene-gmax': 10221,
  'grimmsnarl-gmax': 10222,
  'alcremie-gmax': 10223,
  'copperajah-gmax': 10224,
  'duraludon-gmax': 10225,
  'urshifu-gmax': 10226,
  'urshifu-rapidstrike-gmax': 10227,
  'toxtricity-lowkey-gmax': 10228,
};

const VARIANTS = [
  { dir: 'gen5ani', urlPrefix: '' },
  { dir: 'gen5ani-shiny', urlPrefix: 'shiny/' },
  { dir: 'gen5ani-back', urlPrefix: 'back/' },
  { dir: 'gen5ani-back-shiny', urlPrefix: 'back/shiny/' },
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'sprite-sync/1.0' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        res.resume();
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode === 404) {
        res.resume();
        return resolve({ status: 404 });
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 100) {
          return resolve({ status: 'tiny', bytes: buf.length });
        }
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
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (e) {
        results[idx] = { error: e.message };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

const FORCE = process.argv.includes('--force');
const VARIANT_FILTER = (() => {
  const arg = process.argv.find((a) => a.startsWith('--only='));
  return arg ? arg.slice('--only='.length).split(',') : null;
})();

async function main() {
  const jobs = [];
  for (const [slug, formId] of Object.entries(FORM_IDS)) {
    for (const v of VARIANTS) {
      if (VARIANT_FILTER && !VARIANT_FILTER.includes(v.dir)) continue;
      const dest = path.join(SPRITES, v.dir, `${slug}.gif`);
      ensureDir(path.dirname(dest));
      if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 100) {
        jobs.push({ slug, formId, variant: v.dir, dest, skip: true });
        continue;
      }
      jobs.push({
        slug,
        formId,
        variant: v.dir,
        dest,
        url: `${CDN}/${v.urlPrefix}${formId}.gif`,
      });
    }
  }

  const skips = jobs.filter((j) => j.skip).length;
  const work = jobs.filter((j) => !j.skip);
  console.log(`[sprite-sync] ${jobs.length} variants total, ${skips} already present, ${work.length} to fetch.`);

  let ok = 0, miss = 0, err = 0;
  const failures = [];
  const results = await pLimit(8, work, async (job) => {
    const r = await download(job.url, job.dest);
    if (r.status === 200) {
      ok++;
      return { ...job, ok: true, bytes: r.bytes };
    }
    if (r.status === 404) {
      miss++;
      failures.push({ ...job, reason: '404' });
      return { ...job, ok: false, reason: '404' };
    }
    err++;
    failures.push({ ...job, reason: r.status });
    return { ...job, ok: false, reason: r.status };
  });

  console.log(`[sprite-sync] downloaded=${ok} missing=${miss} errors=${err} skipped=${skips}`);
  if (failures.length) {
    console.log('[sprite-sync] failures:');
    for (const f of failures) {
      console.log(`  ${f.variant}/${f.slug}.gif → ${f.reason}`);
    }
  }
  return { ok, miss, err, skips, failures };
}

main().catch((e) => {
  console.error('[sprite-sync] fatal:', e);
  process.exit(1);
});
