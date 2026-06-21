#!/usr/bin/env node
// Enumerates every cacheable asset URL the game can request, so the opt-in "Download all" flow
// (Settings → Download for offline) can hand the full list to the service worker to precache.
//
// Output: offline-assets.json at repo root — { version, generatedAt, totalBytes, fileCount, urls }
// urls are relative, forward-slash, per-segment encodeURI'd so SW fetch() matches the served path.
//
// Read at RUNTIME (fetch('offline-assets.json')), NOT inlined into battle.html — it is large and
// only needed when the user opts in. Committed like sprites/manifest.json so GitHub Pages serves
// it with no build step. Regenerate after any media change OR when sw.js CACHE_VERSION changes:
//   node scripts/build-offline-asset-manifest.mjs        (npm run offline:manifest)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Keep CACHE_VERSION in sync with sw.js (used so the client can detect a stale download).
function readCacheVersion() {
  try {
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    const m = sw.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return m ? m[1] : 'unknown';
  } catch { return 'unknown'; }
}

// Directories walked recursively (every file inside is cacheable media/data).
const WALK_DIRS = ['sprites', 'music', 'data', 'fonts', 'icons', 'vendor'];
// Top-level boot files (explicit — not walked).
const BOOT_FILES = [
  'battle.html', 'index.html', 'manifest.webmanifest',
  'online-config.js', 'online-pvp.js', 'move-anim-map.js', 'move-sfx-map.js', 'sw.js',
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

const files = [];
for (const f of BOOT_FILES) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) files.push(full);
}
for (const d of WALK_DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full, files);
}

let totalBytes = 0;
const seen = new Set();
const urls = [];
for (const full of files) {
  const rel = path.relative(ROOT, full);
  const url = toUrl(rel);
  if (seen.has(url)) continue;
  seen.add(url);
  totalBytes += fs.statSync(full).size;
  urls.push(url);
}
urls.sort();

const out = {
  version: readCacheVersion(),
  generatedAt: new Date().toISOString(),
  fileCount: urls.length,
  totalBytes,
  urls,
};
fs.writeFileSync(path.join(ROOT, 'offline-assets.json'), JSON.stringify(out));
const mb = (totalBytes / (1024 * 1024)).toFixed(1);
console.log(`[offline-manifest] ${urls.length} files, ${mb} MB, version=${out.version} → offline-assets.json`);
