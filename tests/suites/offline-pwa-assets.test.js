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

test('offline-assets.json exists, is hashed, and lists real files', () => {
  const m = JSON.parse(read('offline-assets.json'));
  assert.ok(m.totalBytes > 0, 'totalBytes > 0');
  assert.ok(typeof m.digest === 'string' && m.digest.length >= 8, 'has a manifest digest');
  assert.ok(Array.isArray(m.files) && m.files.length > 1000, 'files is a large array');
  assert.equal(m.fileCount, m.files.length, 'fileCount matches files length');
  // Each entry carries url + content hash + bytes (the diff keys).
  for (const f of [m.files[0], m.files[m.files.length - 1]]) {
    assert.ok(f.u && typeof f.h === 'string' && f.h.length >= 8 && f.b >= 0, `well-formed entry ${JSON.stringify(f)}`);
  }
  const urls = m.files.map((f) => f.u);
  assert.ok(urls.includes('battle.html'), 'boot file present');
  assert.ok(urls.includes('sprites/gen5ani/kilowattrel.gif'), 'gen9 sprite present');
  // Spot-check a sample of URLs resolve to real files (decodeURI to undo encodeURI segments).
  const sample = [0, 1, urls.length >> 1, urls.length - 1].map((i) => urls[i]);
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
  // The offline + install rows are grouped under an "App & data" section heading.
  const sectIdx = HTML.indexOf('>App &amp; data<');
  const installIdx = HTML.indexOf('id="install-app-row"');
  assert.ok(sectIdx > 0 && sectIdx < installIdx && installIdx < dlIdx, '"App & data" heading precedes Install app + Download rows');
});

test('home menu has a discoverable "Download for offline" entry wired to the flow', () => {
  assert.ok(HTML.includes('id="menu-offline-entry"'), 'home-menu offline entry present');
  assert.ok(HTML.includes('window.openOfflineSettings'), 'home entry opens the offline settings flow');
  assert.ok(/window\.openOfflineSettings\s*=\s*function/.test(HTML), 'openOfflineSettings wrapper defined');
  // The entry lives on the home menu (#screen-menu / mode-wrap), before the online-setup hint.
  const entryIdx = HTML.indexOf('id="menu-offline-entry"');
  const gridIdx = HTML.indexOf('class="menu-mode-grid"');
  const hintIdx = HTML.indexOf('id="online-setup-hint"');
  assert.ok(gridIdx > 0 && entryIdx > gridIdx && entryIdx < hintIdx, 'entry sits between the mode grid and the online hint');
  // Reuses the existing update signal so it flags when an update is available.
  assert.ok(/refreshOfflineUpdateBadge[\s\S]*menu-offline-update/.test(HTML), 'badge refresh drives the home chip');
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

test('sw.js implements the differential-sync message protocol + stable assets cache', () => {
  const sw = read('sw.js');
  for (const tok of ['SYNC_ASSETS', 'SYNC_PLAN', 'SYNC_PROGRESS', 'SYNC_DONE', 'CLEAR_CACHE',
                     'computeSyncPlan', "ASSETS_CACHE = 'battle-assets'", '__OFFLINE_MANIFEST__']) {
    assert.ok(sw.includes(tok), `sw.js has ${tok}`);
  }
  // The stable assets cache must NOT be deleted on activate (so a version bump never wipes the download).
  assert.ok(/k !== ASSETS_CACHE/.test(sw), 'activate preserves ASSETS_CACHE');
});

test('the download "remembers" its state — restore fn + reconciliation exist', () => {
  // The button/menu label must be restorable from the persisted completed flag so a
  // returning player is not asked to download from scratch every visit.
  assert.ok(/window\.refreshOfflineDownloadUI\s*=\s*async function/.test(HTML), 'refreshOfflineDownloadUI defined');
  assert.ok(HTML.includes('refreshOfflineDownloadUI()'), 'restore fn is actually called (load/open)');
  // Reconciliation queries the SW cache so a wiped cache does not keep claiming "downloaded".
  assert.ok(/_swCacheState/.test(HTML), 'app queries CACHE_STATE via _swCacheState');
  const sw = read('sw.js');
  assert.ok(/CACHE_STATE'[\s\S]*batchId: msg\.batchId/.test(sw), 'CACHE_STATE reply echoes batchId (awaitable)');
  assert.ok(/CACHE_CLEARED', batchId: msg\.batchId/.test(sw), 'CACHE_CLEARED reply echoes batchId');
});

test('offline download panel is screen-reader friendly (progressbar + live regions)', () => {
  assert.ok(/role="progressbar"[^>]*aria-valuemin="0"[^>]*aria-valuemax="100"/.test(HTML), 'progressbar role + range');
  assert.ok(/id="offline-dl-status"[^>]*aria-live="polite"/.test(HTML), 'status is a polite live region');
  assert.ok(/id="offline-dl-size"[^>]*aria-live="polite"/.test(HTML), 'size line is a polite live region');
  assert.ok(/id="offline-dl-btn"[^>]*aria-controls="offline-dl-panel"/.test(HTML), 'button controls the panel');
});

test('settings modal is labelled and the ambient-particles toggle is wired', () => {
  assert.ok(/id="modal-settings"[^>]*aria-labelledby="modal-settings-title"/.test(HTML), 'dialog is named');
  assert.ok(HTML.includes('id="modal-settings-title"'), 'title carries the referenced id');
  // The previously-orphaned ambientParticles pref now has a real control.
  assert.ok(HTML.includes('id="sw-ambient-particles"'), 'ambient particles toggle present');
  assert.ok(/applySettingSwitch\('ambientParticles'/.test(HTML), 'toggle wired to applySettingSwitch');
});

test('client uses differential sync (digest-based), not the old bulk re-download', () => {
  assert.ok(HTML.includes('window.checkOfflineUpdate'), 'launch update-check present');
  assert.ok(/SYNC_ASSETS/.test(HTML), 'client posts SYNC_ASSETS');
  assert.ok(/offlineDownload[\s\S]{0,60}digest/.test(HTML), 'offlineDownload persists a digest');
  assert.ok(!HTML.includes("type: 'CACHE_ALL'"), 'old CACHE_ALL bulk message removed');
});
