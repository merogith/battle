// Offline / installable-PWA contract guard.
//
// Locks in the "works fully offline + installs as an app" wiring so a later session can't
// silently regress it:
//   • offline-assets.json exists, is non-empty, and every listed URL resolves to a real file
//     (the opt-in "Download all" flow hands this list to the service worker);
//   • the Settings modal exposes the download flow, positioned after the Fullscreen row;
//   • the web manifest advertises PNG + maskable icons and standalone/display_override + id;
//   • the HTML head carries the iOS app-title meta;
//   • the two avoidable remote boot deps (unused nes.css, render-blocking Supabase <script>)
//     are gone from the head;
//   • sw.js implements the bulk-cache message protocol.
//
// Source-level (reads files as text/JSON) — no jsdom or live service worker needed; the SW
// runtime path is verified manually in a browser (see plan §4b).
//
// Run: node --test tests/suites/offline-pwa-assets.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const HTML = read('battle.html');

test('offline-assets.json exists, is non-empty, and lists real files', () => {
  const m = JSON.parse(read('offline-assets.json'));
  assert.ok(m.totalBytes > 0, 'totalBytes > 0');
  assert.ok(Array.isArray(m.urls) && m.urls.length > 1000, 'urls is a large array');
  assert.equal(m.fileCount, m.urls.length, 'fileCount matches urls length');
  assert.ok(m.urls.includes('battle.html'), 'boot file present');
  assert.ok(m.urls.includes('sprites/gen5ani/kilowattrel.gif'), 'gen9 sprite present');
  // Spot-check a sample of URLs resolve to real files (decodeURI to undo encodeURI segments).
  const sample = [0, 1, m.urls.length >> 1, m.urls.length - 1].map((i) => m.urls[i]);
  for (const u of sample) {
    assert.ok(fs.existsSync(path.join(ROOT, decodeURI(u))), `exists: ${u}`);
  }
});

test('offline-assets.json version mirrors sw.js CACHE_VERSION', () => {
  const m = JSON.parse(read('offline-assets.json'));
  const v = read('sw.js').match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/)[1];
  assert.equal(m.version, v, 'manifest version == sw CACHE_VERSION (regenerate if this fails)');
});

test('Settings modal exposes the download flow after the Fullscreen row', () => {
  assert.ok(HTML.includes('id="offline-dl-btn"'), 'download button present');
  assert.ok(HTML.includes('window.openDownloadOfflineFlow'), 'open flow handler present');
  assert.ok(HTML.includes('window.startOfflineDownload'), 'start handler present');
  const fsIdx = HTML.indexOf('id="toggle-fs-btn"');
  const dlIdx = HTML.indexOf('id="offline-dl-btn"');
  assert.ok(fsIdx > 0 && dlIdx > fsIdx, 'download row comes after Fullscreen row');
});

test('manifest advertises PNG + maskable icons and standalone app identity', () => {
  const mf = JSON.parse(read('manifest.webmanifest'));
  const png512 = mf.icons.find((i) => i.type === 'image/png' && i.sizes === '512x512');
  assert.ok(png512, '512x512 PNG icon present');
  assert.ok(mf.icons.some((i) => i.purpose === 'maskable' && i.type === 'image/png'), 'maskable PNG present');
  assert.ok(Array.isArray(mf.display_override) && mf.display_override.includes('standalone'), 'display_override has standalone');
  assert.ok(mf.id, 'id present');
  assert.ok(Array.isArray(mf.categories) && mf.categories.includes('games'), 'categories includes games');
  // The advertised icon files actually exist.
  for (const ic of mf.icons) assert.ok(fs.existsSync(path.join(ROOT, ic.src)), `icon exists: ${ic.src}`);
});

test('head carries the iOS app-title meta and PNG apple-touch-icon', () => {
  assert.ok(HTML.includes('name="apple-mobile-web-app-title"'), 'apple-mobile-web-app-title present');
  assert.ok(/apple-touch-icon[^>]*apple-touch-180\.png/.test(HTML), 'PNG apple-touch-icon present');
});

test('avoidable remote boot deps are gone from battle.html', () => {
  assert.ok(!HTML.includes('unpkg.com/nes.css'), 'unused nes.css link removed');
  // No render-blocking Supabase <script> in the head (it is now lazy-loaded by ensureSdk()).
  assert.ok(!/<script[^>]+supabase-js@2[^>]*><\/script>/.test(HTML), 'render-blocking Supabase script removed');
  assert.ok(read('online-pvp.js').includes('ensureSdk'), 'online-pvp exposes ensureSdk');
});

test('sw.js implements the bulk-cache message protocol', () => {
  const sw = read('sw.js');
  for (const tok of ['CACHE_ALL', 'CACHE_PROGRESS', 'CACHE_DONE', 'CLEAR_CACHE', 'cacheUrlsInBatches']) {
    assert.ok(sw.includes(tok), `sw.js has ${tok}`);
  }
});
