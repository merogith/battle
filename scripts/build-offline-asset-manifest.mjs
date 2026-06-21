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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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

const paths = [];
for (const f of BOOT_FILES) {
  const full = path.join(ROOT, f);
  if (fs.existsSync(full)) paths.push(full);
}
for (const d of WALK_DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full, paths);
}

let totalBytes = 0;
const seen = new Set();
const files = [];
for (const full of paths) {
  const url = toUrl(path.relative(ROOT, full));
  if (seen.has(url)) continue;
  seen.add(url);
  const bytes = fs.statSync(full).size;
  totalBytes += bytes;
  files.push({ u: url, h: hashFile(full), b: bytes });
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

