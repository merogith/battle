/* Service worker for offline play + differential ("download only the diff") updates.
 *
 * Caches:
 *   • SHELL_CACHE  (versioned)  — app boot files (battle.html + scripts it can't launch without).
 *     Each release verifies its core before taking control. Unchanged files can be copied
 *     from an older shell without downloading them again.
 *   • ASSETS_CACHE ('battle-assets', STABLE) — the opt-in bulk download beyond the core shell.
 *     Survives CACHE_VERSION bumps so an update never wipes the 600 MB library. Updated in place
 *     by SYNC_ASSETS, which fetches only the files whose content hash changed (+ new files) and
 *     deletes removed ones. A snapshot of the last-applied manifest lives here under
 *     __OFFLINE_MANIFEST__ so the next sync can diff against it.
 *   • RUNTIME_CACHE (versioned) — lazy cache-on-first-use for assets a non-downloader happens to hit.
 *
 * Fetch precedence (cache-first): SHELL → ASSETS → RUNTIME → network. Serving the shell first keeps
 * code fresh even when ASSETS still holds an older battle.html. Cross-origin (Supabase/CDN) is
 * network-only. The manifest build sets CACHE_VERSION from the release contents.
 */
const CACHE_VERSION = 'battle-v5-b9f179b9dfc5';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const ASSETS_CACHE = 'battle-assets';            // STABLE — not version-keyed
const APPLIED_MANIFEST_KEY = '__OFFLINE_MANIFEST__';
const OFFLINE_PROGRESS_KEY = '__OFFLINE_PROGRESS__';
const VERSIONED_CACHE = /^battle-v\d+(?:-[0-9a-f]+)?-(?:shell|runtime)$/;
const ASSET_BATCH_SIZE = 12;
const ASSET_BATCH_BYTES = 16 * 1024 * 1024;
const ASSET_TRANSFER_IDLE_MS = 30000;
const ASSET_WORK_SLICE_MS = 45000;
const LAZY_CODE = new Set(['competitive/showdown-worker.js', 'vendor/pkmn-dex-learnsets.min.js']);

// Files the app cannot boot without — precached so a cold offline launch works.
const SHELL = [
  './',
  'battle.html',
  'game-update.js',
  'game-upgrades.js',
  'game-upgrades.css',
  'index.html',
  'home-menu.css',
  'manifest.webmanifest',
  'online-config.js',
  'online-pvp.js',
  'move-anim-map.js',
  'move-sfx-map.js',
  'battle-encounter-profiles.js',
  'battle-move-profiles.js',
  'battle-motion.js',
  'world-presentation.js',
  'world-location.css',
  'story-activities.css',
  'vendor/anime.min.js',
  'vendor/pkmn-dex.min.js',
  'sprites/placeholder.svg',
  'sprites/substitute.png',
  'icons/app-icon.svg',
  'competitive/index.html',
  'competitive/arena.css',
  'competitive/arena.js',
  'competitive/arena-client.js',
  'competitive/classic-simulation.js',
  'competitive/showdown-engine.js',
];

function isCoreAsset(file) {
  return SHELL.includes(file.u) || file.u.startsWith('data/');
}

// An incomplete or mismatched core never activates. Media remains an optional download.
async function verifyResponse(response, file, onChunk) {
  if (!response || !response.ok) throw new Error(`Could not fetch ${file.u}`);
  const copy = response.clone();
  const source = onChunk && copy.body ? new Response(copy.body.pipeThrough(new TransformStream({
    transform(chunk, output) { onChunk(); output.enqueue(chunk); },
  }))) : copy;
  const buffer=await source.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-1',buffer);
  const hash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,16);
  if(hash!==file.h || buffer.byteLength!==file.b) throw new Error(`Release mismatch: ${file.u}`);
  return response;
}
async function precacheShell(repair = false) {
  const manifestResponse=await fetch('offline-assets.json',{cache:'no-store'});
  if(!manifestResponse.ok)throw new Error('Release manifest unavailable');
  const manifest=await manifestResponse.json();
  if(manifest.version!==CACHE_VERSION || !Array.isArray(manifest.files))throw new Error('Release manifest is incompatible');
  const core=manifest.files.filter(isCoreAsset);
  for(const required of SHELL.filter(u=>u!=='./'))if(!core.some(f=>f.u===required))throw new Error(`Core asset missing: ${required}`);
  const previousShells = (await caches.keys()).filter(name =>
    name !== SHELL_CACHE && VERSIONED_CACHE.test(name) && name.endsWith('-shell')
  ).reverse();
  const cache=await caches.open(SHELL_CACHE);
  try {
    for(let i=0;i<core.length;i+=12) {
      const batch = await Promise.allSettled(core.slice(i,i+12).map(async file=>{
        // A repair can keep verified files from its own shell.
        if (repair && await reuseVerifiedResponse(file, [SHELL_CACHE])) return;
        const response = await reuseVerifiedResponse(file, previousShells)
          || await verifyResponse(await fetch(file.u,{cache:'reload'}),file);
        await cache.put(file.u,response);
      }));
      const failure = batch.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
    }
    await cache.put('./',await cache.match('index.html'));
    await cache.put('offline-assets.json',new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/json'}}));
  } catch (error) {
    // A rejected installation should leave the last release available and no partial shell
    // taking up space. A repair keeps the individual files it was able to restore.
    if (!repair) {
      try { await caches.delete(SHELL_CACHE); } catch (_) {}
    }
    throw error;
  }
}

async function shellIsComplete(manifest) {
  if (!await matchCache(SHELL_CACHE, 'offline-assets.json')) return false;
  const urls = new Set((await (await caches.open(SHELL_CACHE)).keys()).map(entry => relUrl(entry.url)));
  return manifest.files.filter(isCoreAsset).every(file => urls.has(file.u));
}

async function reuseVerifiedResponse(file, names) {
  for (const name of names) {
    const response = await matchCache(name, file.u);
    if (!response) continue;
    try {
      return await verifyResponse(response, file);
    } catch (_) { /* This cached copy differs from the requested release. */ }
  }
  return null;
}

self.addEventListener('install', (event) => {
  // A first install activates naturally. A replacement waits for the current
  // game clients to reach a safe boundary or close.
  event.waitUntil(precacheShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        // Leave the stable download and other apps on this origin alone.
        keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE && k !== ASSETS_CACHE)
          .filter((k) => VERSIONED_CACHE.test(k))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function matchCache(name, req) {
  try {
    return await caches.match(req, { cacheName: name });
  } catch (_) {
    return null;
  }
}

async function gameWindows() {
  const scope = new URL(self.registration.scope);
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windows.filter(client => {
    const url = new URL(client.url);
    return url.origin === scope.origin && url.pathname.startsWith(scope.pathname)
      && shellDocument(url.pathname.slice(scope.pathname.length));
  });
}

function probeGameWindow(client, type) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => finish(false), 1100);
    function finish(ready) {
      clearTimeout(timer);
      channel.port1.close();
      resolve(ready);
    }
    channel.port1.onmessage = event => finish(event.data === true);
    try { client.postMessage({ type }, [channel.port2]); }
    catch (_) { finish(false); }
  });
}

let updateHandoff;
function activatePreparedUpdate(sourceId) {
  if (updateHandoff) return updateHandoff;
  updateHandoff = (async () => {
    const clients = await gameWindows();
    if (!clients.some(client => client.id === sourceId)) return false;
    if (!(await Promise.all(clients.map(client => probeGameWindow(client, 'CHECK_GAME_UPDATE')))).every(Boolean)) return false;
    let applying = false;
    try {
      if (!(await Promise.all(clients.map(client => probeGameWindow(client, 'PREPARE_GAME_UPDATE')))).every(Boolean)) return false;
      const readyIds = new Set(clients.map(client => client.id));
      if ((await gameWindows()).some(client => !readyIds.has(client.id))) return false;
      await self.skipWaiting();
      applying = true;
      return true;
    } finally {
      if (!applying) for (const client of clients) {
        try { client.postMessage({ type: 'CANCEL_GAME_UPDATE' }); } catch (_) {}
      }
    }
  })().catch(() => false).finally(() => { updateHandoff = null; });
  return updateHandoff;
}

async function cacheFirst(req, bundleKey = req) {
  return await matchCache(SHELL_CACHE, bundleKey) || await matchInstalledAsset(bundleKey) || await matchCache(RUNTIME_CACHE, req);
}

const PACK_FRAME_ARCHIVE = 'sprites/compact-frames.bin';
let compactFrames;
let installedAssetCompatibility;

async function readInstalledAssetCompatibility() {
  const applied = await matchCache(ASSETS_CACHE, APPLIED_MANIFEST_KEY);
  if (!applied) return null;
  const record = await applied.json();
  if (!record?.release || record.release === CACHE_VERSION) return null;
  const manifest = await matchCache(SHELL_CACHE, 'offline-assets.json');
  if (!manifest) return null;
  const previous = assetHashes(record);
  const current = assetHashes(await manifest.json());
  return new Set(Object.keys(previous).filter(url => previous[url] === current[url]));
}

async function matchInstalledAsset(request) {
  const response = await matchCache(ASSETS_CACHE, request);
  if (!response) return null;
  const path = typeof request === 'string' ? request : relUrl(request.url);
  // Unchanged downloads stay available while an updated shell waits for its
  // optional media delta. Changed files use the current origin or the UI fallback.
  installedAssetCompatibility ??= readInstalledAssetCompatibility().catch(() => null);
  const compatible = await installedAssetCompatibility;
  return !compatible || compatible.has(path) ? response : null;
}

async function loadCompactFrames() {
  const archive = await matchInstalledAsset(PACK_FRAME_ARCHIVE);
  if (!archive) return null;
  const blob = await archive.blob();
  const bytes = new DataView(await blob.slice(0, 4).arrayBuffer()).getUint32(0);
  const origin = bytes + 4;
  if (bytes <= 0 || bytes > 1024 * 1024 || origin >= blob.size) return null;
  return { entries: JSON.parse(await blob.slice(4, origin).text()), blob, origin };
}

async function compactSprite(path) {
  if (!/^sprites\/gen5ani(?:-back)?(?:-shiny)?\/[a-z0-9-]+\.gif$/.test(path)) return null;
  compactFrames ??= loadCompactFrames().catch(() => null).then(value => {
    if (!value) compactFrames = null;
    return value;
  });
  const frames = await compactFrames;
  const range = frames && Object.hasOwn(frames.entries, path) ? frames.entries[path] : null;
  if (!range) return null;
  const [start, bytes] = range;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(bytes) || start < 0 || bytes <= 0
      || frames.origin + start + bytes > frames.blob.size) return null;
  return new Response(frames.blob.slice(frames.origin + start, frames.origin + start + bytes, 'image/webp'), {
    headers: { 'Content-Type': 'image/webp', 'Content-Length': String(bytes) },
  });
}

async function versionedLazyCode(path, request, event) {
  // A versioned runtime entry was verified by this worker before caching.
  const loaded = await matchCache(RUNTIME_CACHE, path);
  if (loaded) return loaded;
  try {
    const manifestResponse = await matchCache(SHELL_CACHE, 'offline-assets.json');
    const manifest = await manifestResponse?.json();
    const file = manifest?.version === CACHE_VERSION && manifest.files.find(asset => asset.u === path);
    if (!file) throw new Error('Release asset unavailable');

    const downloaded = await reuseVerifiedResponse(file, [ASSETS_CACHE]);
    if (downloaded) return downloaded;
    const response = await verifyResponse(await fetch(request, { cache: 'reload' }), file);
    event.waitUntil(cacheRuntimeResponse(path, response.clone()));
    return response;
  } catch (_) {
    return new Response('This part of the game is unavailable. Connect to download it.', { status: 503 });
  }
}

// Core caches are immutable after install. Ask the browser to install a complete
// new worker instead of replacing battle.html while sibling code/data may still be old.
let _shellRevalidating=false;
async function revalidateShell() {
  if(_shellRevalidating)return;
  _shellRevalidating=true;
  try { await self.registration.update(); } catch (_) { /* Offline: retain this release. */ }
  finally { _shellRevalidating=false; }
}

function shellDocument(path) {
  if (path === '' || path === 'index.html') return 'index.html';
  if (path === 'battle.html') return 'battle.html';
  if (path === 'competitive/' || path === 'competitive/index.html') return 'competitive/index.html';
  return null;
}

async function cachedByteRange(response, range) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match || (!match[1] && !match[2]) || response.status !== 200) return null;
  const data = await response.blob();
  const length = data.size;
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
  const headers = new Headers({ 'Accept-Ranges': 'bytes' });
  if (start >= length || end < start) {
    headers.set('Content-Range', `bytes */${length}`);
    return new Response(null, { status: 416, headers });
  }
  const type = response.headers.get('Content-Type');
  if (type) headers.set('Content-Type', type);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
  return new Response(data.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cross-origin (Supabase, any CDN) → network only, never cached.
  if (url.origin !== self.location.origin) return;
  const scopePath = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scopePath)) return;
  const path = url.pathname.slice(scopePath.length);

  if (LAZY_CODE.has(path)) {
    event.respondWith(versionedLazyCode(path, req, event));
    return;
  }

  // Each app navigation uses its own verified HTML and triggers an update check.
  const page = req.mode === 'navigate' && shellDocument(path);
  if (page) {
    event.respondWith((async () => {
      const cached = await cacheFirst(page);
      if (cached) {
        event.waitUntil(revalidateShell());
        return cached;
      }
      return fetch(req);
    })());
    return;
  }

  // Same-origin assets → cache-first by precedence; populate RUNTIME on first network hit.
  // Static artwork often carries an HTTP cache-busting version. Pack and shell
  // entries already belong to a verified release and use plain manifest paths.
  const bundleKey = /^\?v=[^&]*$/.test(url.search)
    && /^(?:icons|sprites|music|fonts|data|vendor)\//.test(path) ? path : req;
  event.respondWith((async () => {
    const hit = await cacheFirst(req, bundleKey) || await compactSprite(path);
    if (hit) {
      const range = req.headers?.get('Range');
      if (!range) return hit;
      const ifRange = req.headers.get('If-Range');
      if (ifRange && ifRange !== hit.headers.get('ETag') && ifRange !== hit.headers.get('Last-Modified')) return hit;
      const partial = await cachedByteRange(hit, range);
      if (partial) return partial;
    }
    const response = await fetch(req);
    if (response.status === 200 && response.type === 'basic') {
      event.waitUntil(cacheRuntimeResponse(req, response.clone()));
    }
    return response;
  })());
});

async function cacheRuntimeResponse(request, response) {
  try {
    const runtime = await caches.open(RUNTIME_CACHE);
    await runtime.put(request, response);
    const entries = await runtime.keys();
    const evictable = entries.filter(entry => !LAZY_CODE.has(relUrl(entry.url)));
    for (const oldest of evictable.slice(0, Math.max(0, entries.length - 200))) {
      await runtime.delete(oldest);
    }
  } catch (_) { /* A full or unavailable cache should not break online play. */ }
}

// ── Differential offline sync ────────────────────────────────────────────────────────────────
// Pure diff: given the new manifest files [{u,h,b}], the previously-applied {url:hash} map, and the
// set of URLs currently present in the cache, decide what to (re)fetch and what to delete. Exported
// shape is unit-tested (tests/sprites/offline-sync-diff.test.js extracts it from this source).
function computeSyncPlan(newFiles, oldHashMap, presentSet) {
  const toFetch = [];
  const newUrls = new Set();
  for (const f of newFiles) {
    newUrls.add(f.u);
    // (Re)fetch when the content hash changed, the file is new, OR it was evicted from the cache.
    if (oldHashMap[f.u] !== f.h || !presentSet.has(f.u)) toFetch.push(f);
  }
  const remove = new Set();
  for (const u of Object.keys(oldHashMap)) if (!newUrls.has(u)) remove.add(u);
  for (const u of presentSet) if (!newUrls.has(u)) remove.add(u);
  const bytes = toFetch.reduce((s, f) => s + (f.b || 0), 0);
  return { toFetch, toRemove: [...remove], bytes };
}

function relUrl(absUrl) {
  const scope = self.registration.scope;
  if (absUrl.startsWith(scope)) return absUrl.slice(scope.length);
  try { return new URL(absUrl).pathname.replace(/^\//, ''); } catch (e) { return absUrl; }
}

async function readAssetRecord(cache, key) {
  const r = await cache.match(key);
  if (!r) return null;
  try { return await r.json(); } catch (_) { return null; }
}

function assetHashes(record) {
  const hashes = Object.create(null);
  if (Array.isArray(record?.files)) {
    for (const file of record.files) hashes[file.u] = file.h;
  }
  return hashes;
}

async function presentUrls(cache) {
  const keys = await cache.keys();
  const set = new Set();
  for (const req of keys) {
    const u = relUrl(req.url);
    if (u !== APPLIED_MANIFEST_KEY && u !== OFFLINE_PROGRESS_KEY) set.add(u);
  }
  return set;
}

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  const reply = (payload) => {
    // A tab can close while its download keeps running.
    try { event.source?.postMessage(payload); } catch (_) {}
  };

  if (msg.type === 'APPLY_GAME_UPDATE' && event.ports?.[0]) {
    const port = event.ports[0];
    event.waitUntil(activatePreparedUpdate(event.source?.id).then(ready => port.postMessage(ready)));
  } else if (msg.type === 'SYNC_ASSETS' && msg.manifest && Array.isArray(msg.manifest.files)) {
    event.waitUntil(syncAssets(msg, reply));
  } else if (msg.type === 'SYNC_STATUS') {
    reply({ type: 'SYNC_STATUS', batchId: msg.batchId, job: offlineJob });
  } else if (msg.type === 'PAUSE_ASSETS') {
    if (offlineJob?.status === 'running' || offlineJob?.status === 'preparing') offlineJob.status = 'pausing';
    if (offlineJob?.status === 'continuing') offlineJob.status = 'paused';
    reply({ type: 'PAUSE_RESULT', batchId: msg.batchId, job: offlineJob });
  } else if (msg.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAssets(msg, reply, event.source?.id));
  } else if (msg.type === 'CACHE_STATE') {
    event.waitUntil((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const present = await presentUrls(cache);
      const record = await readAssetRecord(cache, APPLIED_MANIFEST_KEY);
      const applied = assetHashes(record);
      const partial = assetHashes(await readAssetRecord(cache, OFFLINE_PROGRESS_KEY));
      const urls = Object.keys(applied);
      let shellReady = !record?.release;
      if (!shellReady) {
        try {
          const shell = await matchCache(SHELL_CACHE, 'offline-assets.json');
          shellReady = !!shell && await shellIsComplete(await shell.json());
        } catch (_) {}
      }
      reply({ type: 'CACHE_STATE', batchId: msg.batchId, cachedCount: present.size,
        appliedCount: urls.length, digest: record?.digest, profile: record?.profile || 'full', complete: urls.length > 0
          && shellReady
          && urls.every(url => present.has(url))
          && Object.keys(partial).every(url => applied[url] === partial[url]) });
    })());
  }
});

let assetMutationInProgress = false;
let offlineJob = null;

async function notifyOfflineClients(message, except) {
  try {
    for (const client of await self.clients.matchAll({ type: 'window' })) {
      if (except && client.id === except) continue;
      try { client.postMessage(message); } catch (_) {}
    }
  } catch (_) {}
}

async function clearAssets(msg, reply, sourceId) {
  if (assetMutationInProgress) {
    reply({ type: 'CACHE_CLEARED', batchId: msg.batchId, busy: true });
    return;
  }
  assetMutationInProgress = true;
  try {
    await Promise.all([caches.delete(ASSETS_CACHE), caches.delete(RUNTIME_CACHE)]);
    compactFrames = null;
    installedAssetCompatibility = null;
    offlineJob = null;
    reply({ type: 'CACHE_CLEARED', batchId: msg.batchId });
    await notifyOfflineClients({ type: 'OFFLINE_PACK_REMOVED' }, sourceId);
  } catch (_) {
    reply({ type: 'CACHE_CLEARED', batchId: msg.batchId, failed: true });
  } finally {
    assetMutationInProgress = false;
  }
}

function* offlineAssetBatches(files) {
  let batch = [], bytes = 0;
  for (const file of files) {
    const size = file.b || 0;
    if (batch.length && (batch.length >= ASSET_BATCH_SIZE || bytes + size > ASSET_BATCH_BYTES)) {
      yield batch;
      batch = [];
      bytes = 0;
    }
    batch.push(file);
    bytes += size;
  }
  if (batch.length) yield batch;
}

async function fetchOfflineAsset(file) {
  const controller = new AbortController();
  let timeout;
  const onChunk = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort(), ASSET_TRANSFER_IDLE_MS);
  };
  // Extend the network deadline only while bytes arrive. This keeps long tracks
  // downloadable on slow connections and still recovers from a stalled response.
  onChunk();
  try {
    return await verifyResponse(await fetch(file.u, { cache: 'reload', signal: controller.signal }), file, onChunk);
  } finally {
    clearTimeout(timeout);
  }
}

async function checkpointAssets(cache, progress, job) {
  try {
    await cache.put(OFFLINE_PROGRESS_KEY, new Response(JSON.stringify({
      files: [...progress.values()], digest: job.digest, profile: job.profile, paused: job.status === 'pausing',
    })));
    return true;
  } catch (_) { /* Available space may be too low even for the checkpoint. */ }
  return false;
}

async function syncAssets(msg, reply) {
  const profile = msg.profile === 'compact' ? 'compact' : 'full';
  const digest = msg.manifest.digest && profile === 'compact' ? `${msg.manifest.digest}:compact` : msg.manifest.digest || null;
  if (msg.manifest.version && msg.manifest.version !== CACHE_VERSION) {
    const type = msg.dryRun ? 'SYNC_PLAN' : 'SYNC_DONE';
    reply({ type, batchId: msg.batchId, failed: true });
    return;
  }
  if (msg.dryRun && assetMutationInProgress && offlineJob
      && ['preparing', 'running', 'pausing', 'finishing'].includes(offlineJob.status)) {
    reply({ type: 'SYNC_PLAN', batchId: msg.batchId, job: offlineJob });
    return;
  }
  if (!msg.dryRun) {
    if (assetMutationInProgress) {
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, busy: true, job: offlineJob });
      return;
    }
    if (msg.continueJob && offlineJob?.digest === digest && offlineJob.status === 'paused') {
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, ...offlineJob, paused: true });
      return;
    }
    assetMutationInProgress = true;
    offlineJob = { digest, profile, status: 'preparing', total: 0, done: 0, failed: 0, bytes: 0, remainingBytes: 0 };
  }
  try {
    const cache = await caches.open(ASSETS_CACHE);
    const appliedRecord = await readAssetRecord(cache, APPLIED_MANIFEST_KEY);
    const partialRecord = await readAssetRecord(cache, OFFLINE_PROGRESS_KEY);
    const appliedHashes = assetHashes(appliedRecord);
    const partialHashes = assetHashes(partialRecord);
    const present = await presentUrls(cache);
    const packFiles = msg.manifest.files.filter(file => !file.p || file.p === profile);
    const files = packFiles.filter(file => !isCoreAsset(file) && file.u !== 'sw.js');
    if (profile === 'compact' && !files.some(file => file.u === PACK_FRAME_ARCHIVE)) throw new Error('Compact sprite archive is missing');
    const plan = computeSyncPlan(files, { ...appliedHashes, ...partialHashes }, present);
    const shellReady = !msg.manifest.version || await shellIsComplete(msg.manifest);
    // A continuation can outlive its worker, but it must still belong to a
    // saved download. Another tab's Remove action deletes that checkpoint.
    if (!msg.dryRun && msg.continueJob && partialRecord?.digest !== digest) {
      const complete = shellReady && appliedRecord?.digest === digest && plan.toFetch.length === 0 && plan.toRemove.length === 0;
      offlineJob = null;
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, applied: complete, cancelled: !complete });
      return;
    }
    if (msg.dryRun) {
      reply({ type: 'SYNC_PLAN', batchId: msg.batchId,
        digest, profile, shellReady, installedDigest: appliedRecord?.digest,
        installedProfile: appliedRecord ? appliedRecord.profile || 'full' : null,
        pendingProfile: partialRecord ? partialRecord.profile || 'full' : null,
        fetchCount: plan.toFetch.length, removeCount: plan.toRemove.length, bytes: plan.bytes,
        totalBytes: packFiles.reduce((sum, file) => sum + (file.b || 0), 0),
        complete: Boolean(shellReady && appliedRecord && files.length && plan.toFetch.length === 0 && plan.toRemove.length === 0),
        resumable: Boolean(partialRecord && (partialRecord.profile || 'full') === profile),
        paused: partialRecord?.digest === digest && partialRecord.paused === true });
      return;
    }

    const job = offlineJob;
    if (!shellReady) {
      const report = () => reply({ type: 'SYNC_PROGRESS', batchId: msg.batchId, ...job, status: 'repairing' });
      report();
      const pulse = setInterval(report, 10000);
      try { await precacheShell(true); }
      finally { clearInterval(pulse); }
    }
    job.total = plan.toFetch.length;
    job.bytes = plan.bytes;
    job.remainingBytes = plan.bytes;
    if (job.status === 'preparing') job.status = 'running';
    const progress = new Map(Object.entries(partialHashes).map(([u, h]) => [u, { u, h }]));
    let removed = 0, applied = false, completedBatches = 0;
    if (job.total) await checkpointAssets(cache, progress, job);
    const update = () => reply({ type: 'SYNC_PROGRESS', batchId: msg.batchId, ...job });
    // The page watchdog can distinguish a slow large file from a lost worker.
    const heartbeat = setInterval(update, 10000);
    // End a long download at a verified checkpoint before browser event limits
    // can terminate the service worker. The open page requests the next slice.
    const deadline = Date.now() + ASSET_WORK_SLICE_MS;
    try {
      for (const batch of offlineAssetBatches(plan.toFetch)) {
        if (job.status === 'pausing') break;
        await Promise.all(batch.map(async file => {
          try {
            await cache.put(file.u, await fetchOfflineAsset(file));
            progress.set(file.u, { u: file.u, h: file.h });
            job.done++;
            job.remainingBytes -= file.b || 0;
          } catch (_) {
            job.failed++;
          }
        }));
        if (++completedBatches % 16 === 0) await checkpointAssets(cache, progress, job);
        update();
        if (Date.now() >= deadline) break;
      }
    } finally {
      clearInterval(heartbeat);
    }
    if (job.status === 'pausing' && (job.done < job.total || job.failed > 0)) {
      await checkpointAssets(cache, progress, job);
      job.status = 'paused';
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, ...job, paused: true });
      return;
    }
    if (job.done + job.failed < job.total) {
      const checkpointed = await checkpointAssets(cache, progress, job);
      const continuation = checkpointed && job.failed === 0;
      job.status = continuation ? 'continuing' : 'incomplete';
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, ...job, continuation, applied: false });
      return;
    }
    job.status = 'finishing';
    if (job.failed === 0) {
      for (const url of plan.toRemove) {
        try {
          if (await cache.delete(url)) removed++;
        } catch (_) {
          job.failed++;
        }
      }
    }
    if (job.failed === 0) {
      try {
        await cache.put(APPLIED_MANIFEST_KEY, new Response(JSON.stringify({ files, digest, profile, release: msg.manifest.version }),
          { headers: { 'Content-Type': 'application/json' } }));
        applied = true;
        compactFrames = null;
        await cache.delete(OFFLINE_PROGRESS_KEY);
      } catch (_) { /* Existing asset files can still be used on a retry. */ }
    }
    if (!applied) await checkpointAssets(cache, progress, job);
    job.status = applied ? 'complete' : 'incomplete';
    reply({ type: 'SYNC_DONE', batchId: msg.batchId, ...job, removed, applied });
    if (applied && digest) await notifyOfflineClients({ type: 'OFFLINE_PACK_READY', digest, profile });
  } catch (_) {
    const type = msg.dryRun ? 'SYNC_PLAN' : 'SYNC_DONE';
    if (!msg.dryRun) offlineJob.status = 'incomplete';
    reply({ type, batchId: msg.batchId, failed: true });
  } finally {
    if (!msg.dryRun) {
      installedAssetCompatibility = null;
      assetMutationInProgress = false;
    }
  }
}
