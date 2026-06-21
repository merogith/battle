#!/usr/bin/env node
// Fills ALL remaining gaps in the local animated-sprite set so the game renders every
// in-roster Pokémon offline (no runtime fallback to play.pokemonshowdown.com / PokeAPI).
//
// Why: getSprite() serves sprites/<dir>/<slug>.gif when the slug is in LOCAL_SPRITE_MANIFEST,
// otherwise it hits a remote CDN. Offline (installed PWA, no network) the remote rungs all
// fail and the player sees a broken-image box. This vendors the missing files locally.
//
// Source: PokeAPI's Showdown mirror, keyed by National Dex number (works for every gen,
// including Gen 9 — Showdown's own gen5ani dir stops at Gen 5):
//   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/[back/][shiny/]{id}.gif
//
// Scope:
//   • BASE species (baseSpecies === name)        → keyed by Dex num. The bulk of the gap
//     (all un-bundled Gen 6–9 base species: Kilowattrel, Tinkaton, Ceruledge, …).
//   • FORMES with a known PokeAPI form id (mega / gmax / primal / eternamax, from
//     FORM_DEX_IDS in battle.html)               → keyed by that id.
//   • FORMES without a known id (regional / cosmetic) are SKIPPED — the id-keyed mirror
//     would return the *base* form under a forme slug, which is wrong. Those keep the
//     runtime fallback + the bundled "unknown" placeholder (see handleSpriteError).
//   • CAP / fakemon (Dex num <= 0) are SKIPPED — PokeAPI has no sprite for them; the
//     hand-made ones that ship already live in the folder.
//
// After running, regenerate the manifest:  node scripts/build-sprite-manifest.mjs
//
// Usage: node scripts/download-missing-sprites.mjs [--force] [--limit=N] [--only=gen5ani,...]

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');
const BATTLE_HTML = path.join(ROOT, 'battle.html');
const CDN = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';

const VARIANTS = [
  { dir: 'gen5ani', urlPrefix: '' },
  { dir: 'gen5ani-shiny', urlPrefix: 'shiny/' },
  { dir: 'gen5ani-back', urlPrefix: 'back/' },
  { dir: 'gen5ani-back-shiny', urlPrefix: 'back/shiny/' },
];

// ── Keep the slug logic in lock-step with battle.html ──────────────────────────────
const html = fs.readFileSync(BATTLE_HTML, 'utf8');

function parseObjectLiteral(varName) {
  const re = new RegExp(`const ${varName} = \\{([\\s\\S]*?)\\n        \\};`);
  const m = html.match(re);
  if (!m) throw new Error(`could not parse ${varName} from battle.html`);
  const out = {};
  for (const pair of m[1].matchAll(/'([^']+)'\s*:\s*('([^']*)'|\d+)/g)) {
    out[pair[1]] = pair[2].startsWith("'") ? pair[3] : Number(pair[2]);
  }
  return out;
}

const SPRITE_ID_ALIASES = parseObjectLiteral('SPRITE_ID_ALIASES');
const FORM_DEX_IDS = parseObjectLiteral('FORM_DEX_IDS');

// Mirror of toShowdownSpriteId() in battle.html.
function toShowdownSpriteId(name) {
  const normalized = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/♀/g, '-f').replace(/♂/g, '-m')
    .replace(/\s+/g, '-').replace(/\./g, '').replace(/'/g, '')
    .replace(/-mega-x/g, '-megax').replace(/-mega-y/g, '-megay')
    .replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/-$/, '');
  return SPRITE_ID_ALIASES[normalized] || normalized;
}

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

const FORCE = process.argv.includes('--force');
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  return a ? Number(a.slice('--limit='.length)) : Infinity;
})();
const VARIANT_FILTER = (() => {
  const a = process.argv.find((x) => x.startsWith('--only='));
  return a ? a.slice('--only='.length).split(',') : null;
})();

function buildTargets() {
  // slug -> { id, isForme } for everything we know how to fetch.
  const targets = new Map();
  // Walk every species in the engine roster that maps to a species.json entry.
  const sp = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'species.json'), 'utf8'));
  const keys = [];
  for (const gen of Object.keys(sp)) for (const k of Object.keys(sp[gen])) keys.push(k);

  for (const key of keys) {
    const s = Dex.species.get(key);
    if (!s || !s.exists) continue;
    const slug = toShowdownSpriteId(s.name);
    if (targets.has(slug)) continue;
    const isForme = !!s.forme || (s.baseSpecies && s.baseSpecies !== s.name);
    if (isForme) {
      const id = FORM_DEX_IDS[slug];
      if (id) targets.set(slug, { id, isForme: true });
      // else: no reliable id — skip (placeholder covers it).
    } else if (s.num > 0) {
      targets.set(slug, { id: s.num, isForme: false });
    }
  }
  return targets;
}

async function main() {
  const targets = buildTargets();
  const jobs = [];
  for (const [slug, info] of targets) {
    for (const v of VARIANTS) {
      if (VARIANT_FILTER && !VARIANT_FILTER.includes(v.dir)) continue;
      const dest = path.join(SPRITES, v.dir, `${slug}.gif`);
      ensureDir(path.dirname(dest));
      if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 100) continue;
      jobs.push({ slug, variant: v.dir, dest, url: `${CDN}/${v.urlPrefix}${info.id}.gif` });
    }
  }

  const work = jobs.slice(0, LIMIT);
  console.log(`[sprite-sync] ${targets.size} roster slugs, ${jobs.length} variant files missing, fetching ${work.length}.`);

  let ok = 0, miss = 0, err = 0;
  const failures = [];
  await pLimit(8, work, async (job) => {
    const r = await download(job.url, job.dest);
    if (r.status === 200) { ok++; return; }
    if (r.status === 404 || r.status === 'tiny') { miss++; failures.push({ ...job, reason: r.status }); return; }
    err++; failures.push({ ...job, reason: r.status || r.error });
  });

  console.log(`[sprite-sync] downloaded=${ok} missing(404)=${miss} errors=${err}`);
  if (err) {
    console.log('[sprite-sync] non-404 failures:');
    for (const f of failures.filter((f) => f.reason !== 404 && f.reason !== 'tiny')) {
      console.log(`  ${f.variant}/${f.slug}.gif → ${f.reason}`);
    }
  }

  // ── Static fallback pass ───────────────────────────────────────────────────────────
  // The newest Gen 9 species (Treasures of Ruin, Paradox mons, DLC legendaries — Dex
  // 990+) have no ANIMATED sprite at the mirror yet (404 above). Vendor their HD static
  // "home" art under the .gif filename instead — <img> renders by content, not extension,
  // so they show offline (just non-animated) rather than hitting the placeholder. Front +
  // shiny only; the back slots fall through to the runtime placeholder.
  const HOME = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';
  const staticJobs = [];
  for (const [slug, info] of targets) {
    if (info.isForme) continue;
    for (const v of [{ dir: 'gen5ani', urlPrefix: '' }, { dir: 'gen5ani-shiny', urlPrefix: 'shiny/' }]) {
      if (VARIANT_FILTER && !VARIANT_FILTER.includes(v.dir)) continue;
      const dest = path.join(SPRITES, v.dir, `${slug}.gif`);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 100) continue;
      staticJobs.push({ slug, variant: v.dir, dest, url: `${HOME}/${v.urlPrefix}${info.id}.png` });
    }
  }
  if (staticJobs.length) {
    let sok = 0, smiss = 0;
    await pLimit(8, staticJobs, async (job) => {
      const r = await download(job.url, job.dest);
      if (r.status === 200) sok++; else smiss++;
    });
    console.log(`[sprite-sync] static-fallback: filled=${sok} still-missing=${smiss} (back slots use the runtime placeholder)`);
  }

  console.log('[sprite-sync] done. Now run: node scripts/build-sprite-manifest.mjs');
}

main().catch((e) => { console.error('[sprite-sync] fatal:', e); process.exit(1); });
