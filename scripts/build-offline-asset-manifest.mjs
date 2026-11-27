#!/usr/bin/env node
// Enumerates every cacheable asset with a content hash, so the opt-in "Download for offline" flow
// can fetch only the DIFFERENCES on an update (not re-download all ~686 MB).
//
// Output: offline-assets.json at repo root —
//   { version, generatedAt, digest, fileCount, totalBytes, files: [{ u: url, h: hash, b: bytes }] }
//   • url   — relative, forward-slash, per-segment encodeURI'd so SW fetch() matches the served path
//   • hash  — first 16 hex of the file's sha1 (change-detection key)
//   • digest— sha1 of the sorted "u:h" lines: a one-shot "did anything change?" signal, independent
//             of CACHE_VERSION (so media-only changes are detected without a version bump)
//
// Read at RUNTIME (fetch('offline-assets.json')), NOT inlined into battle.html. Committed like
// sprites/manifest.json. Regenerate after any asset change (or via `npm run build:pwa`):
//   node scripts/build-offline-asset-manifest.mjs        (npm run offline:manifest)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { offlinePack } from './build-release-graph.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Embed the package version before hashing, so both installed titles can show it offline.
const { version: gameVersion } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const titleVersionLabel = /<p class="game-version">[^<]*<\/p>/;
const versionMeta = /<meta name="battle-version" content="[^"]*">/;
for (const name of ['index.html', 'battle.html']) {
  const file = path.join(ROOT, name);
  const html = fs.readFileSync(file, 'utf8');
  if (!titleVersionLabel.test(html)) throw new Error(`Missing game version label in ${name}`);
  if (!versionMeta.test(html)) throw new Error(`Missing game version metadata in ${name}`);
  const updated = html.replace(titleVersionLabel, `<p class="game-version">Version ${gameVersion}</p>`)
    .replace(versionMeta, `<meta name="battle-version" content="${gameVersion}">`);
  if (updated !== html) fs.writeFileSync(file, updated);
}

// Keep CACHE_VERSION in sync with sw.js (drives the versioned app-shell cache).
function readCacheVersion() {
  try {
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    const m = sw.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return m ? m[1] : 'unknown';
  } catch { return 'unknown'; }
}

function hashFile(full) {
  return crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex').slice(0, 16);
}

// Directories walked recursively (every file inside is cacheable media/data).
const WALK_DIRS = ['sprites', 'music', 'data', 'fonts', 'icons', 'vendor'];
// Vendored-but-unused libs — kept in-repo (see ATTRIBUTION.md) for a future revival, but
// NOT shipped into the offline download. howler.min.js lost its only consumer (window.AudioBus)
// when that dead wrapper was removed in 2026-07.
const EXCLUDE_URLS = new Set(['vendor/howler.min.js']);
// Menu and battle views use WebP. Keep the original PNGs as editing sources.
const BACKGROUND_SOURCE = /^sprites\/backgrounds\/(?:menu\/menu_bg(?:_[a-z]+)?|battle\/(?:portrait|landscape)\/bg_[a-z]+)\.png$/;
// Top-level boot files (explicit — not walked).
const BOOT_FILES = [
  'battle.html', 'index.html', 'manifest.webmanifest', 'game-update.js', 'home-menu.css', 'game-upgrades.js', 'game-upgrades.css',
  'online-config.js', 'online-pvp.js', 'move-anim-map.js', 'move-sfx-map.js', 'sw.js',
  'battle-encounter-profiles.js', 'battle-move-profiles.js', 'battle-motion.js',
  'world-presentation.js', 'world-location.css', 'story-activities.css',
  'competitive/index.html', 'competitive/arena.css', 'competitive/arena.js',
  'competitive/arena-client.js', 'competitive/showdown-worker.js',
  'competitive/classic-simulation.js', 'competitive/showdown-engine.js',
  'competitive/THIRD_PARTY_NOTICES.txt',
];

function walk(dir, acc) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.isFile()) acc.push(full);
  }
}

// rel path → URL (forward slashes, each segment encodeURI'd to handle spaces/unicode in names).
function toUrl(relPath) {
  return relPath.split(path.sep).map((seg) => encodeURI(seg)).join('/');
}

const paths = [];
for (const f of BOOT_FILES) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) paths.push(full);
}
for (const d of WALK_DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full, paths);
}

const publishedPaths = paths.filter(full => {
  const url = toUrl(path.relative(ROOT, full));
  return !EXCLUDE_URLS.has(url) && !BACKGROUND_SOURCE.test(url);
});

// Bind each installed core release to its code and data. Exclude the generated manifest
// and the version literal itself to avoid a circular hash.
const swPath=path.join(ROOT,'sw.js');
const normalizedSw=fs.readFileSync(swPath,'utf8').replace(/const CACHE_VERSION = '[^']+';/,"const CACHE_VERSION = 'RELEASE';");
const releaseHash=crypto.createHash('sha256').update(normalizedSw);
for(const full of publishedPaths.filter(p=>p!==swPath).sort()) {
  const url = toUrl(path.relative(ROOT, full));
  releaseHash.update(url).update(offlinePack(url) || '').update(fs.readFileSync(full));
}
const releaseVersion='battle-v5-'+releaseHash.digest('hex').slice(0,12);
fs.writeFileSync(swPath,normalizedSw.replace("const CACHE_VERSION = 'RELEASE';",`const CACHE_VERSION = '${releaseVersion}';`));

let totalBytes = 0;
const seen = new Set();
const files = [];
for (const full of publishedPaths) {
  const url = toUrl(path.relative(ROOT, full));
  if (seen.has(url)) continue;
  seen.add(url);
  const bytes = fs.statSync(full).size;
  totalBytes += bytes;
  const pack = offlinePack(url);
  files.push({ u: url, h: hashFile(full), b: bytes, ...(pack ? { p: pack } : {}) });
}
files.sort((a, b) => (a.u < b.u ? -1 : a.u > b.u ? 1 : 0));

const digest = crypto.createHash('sha1')
  .update(files.map((f) => `${f.u}:${f.h}`).join('\n'))
  .digest('hex')
  .slice(0, 16);

const out = {
  version: readCacheVersion(),
  generatedAt: new Date().toISOString(),
  digest,
  fileCount: files.length,
  totalBytes,
  files,
};
fs.writeFileSync(path.join(ROOT, 'offline-assets.json'), JSON.stringify(out));
const mb = (totalBytes / (1024 * 1024)).toFixed(1);
console.log(`[offline-manifest] ${files.length} files, ${mb} MB, digest=${digest}, version=${out.version} → offline-assets.json`);

