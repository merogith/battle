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
const CACHE_VERSION = 'battle-v5-2a5565dcb091';
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
  'manifest.webmanifest',
  'online-config.js',
  'online-pvp.js',
  'move-anim-map.js',
  'move-sfx-map.js',
  'battle-encounter-profiles.js',
  'battle-move-profiles.js',
  'battle-motion.js',
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
async function precacheShell() {
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
  for(let i=0;i<core.length;i+=12) await Promise.all(core.slice(i,i+12).map(async file=>{
    const response = await reuseVerifiedResponse(file, previousShells)
      || await verifyResponse(await fetch(file.u,{cache:'reload'}),file);
    await cache.put(file.u,response);
  }));
  await cache.put('./',await cache.match('index.html'));
  await cache.put('offline-assets.json',new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/json'}}));
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
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
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
    const cache = await caches.open(name);
    return await cache.match(req);
  } catch (_) {
    return null;
  }
}

async function cacheFirst(req) {
  for (const name of [SHELL_CACHE, ASSETS_CACHE, RUNTIME_CACHE]) {
    const hit = await matchCache(name, req);
    if (hit) return hit;
  }
  return null;
}

const PACK_FRAME_ARCHIVE = 'sprites/compact-frames.bin';
let compactFrames;

async function loadCompactFrames() {
  const archive = await matchCache(ASSETS_CACHE, PACK_FRAME_ARCHIVE);
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
  event.respondWith((async () => {
    const hit = await cacheFirst(req) || await compactSprite(path);
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

  if (msg.type === 'SYNC_ASSETS' && msg.manifest && Array.isArray(msg.manifest.files)) {
    event.waitUntil(syncAssets(msg, reply));
  } else if (msg.type === 'SYNC_STATUS') {
    reply({ type: 'SYNC_STATUS', batchId: msg.batchId, job: offlineJob });
  } else if (msg.type === 'PAUSE_ASSETS') {
    if (offlineJob?.status === 'running' || offlineJob?.status === 'preparing') offlineJob.status = 'pausing';
    if (offlineJob?.status === 'continuing') offlineJob.status = 'paused';
    reply({ type: 'PAUSE_RESULT', batchId: msg.batchId, job: offlineJob });
  } else if (msg.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAssets(msg, reply));
  } else if (msg.type === 'CACHE_STATE') {
    event.waitUntil((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const present = await presentUrls(cache);
      const record = await readAssetRecord(cache, APPLIED_MANIFEST_KEY);
      const applied = assetHashes(record);
      const partial = assetHashes(await readAssetRecord(cache, OFFLINE_PROGRESS_KEY));
      const urls = Object.keys(applied);
      reply({ type: 'CACHE_STATE', batchId: msg.batchId, cachedCount: present.size,
        appliedCount: urls.length, digest: record?.digest, profile: record?.profile || 'full', complete: urls.length > 0
          && urls.every(url => present.has(url))
          && Object.keys(partial).every(url => applied[url] === partial[url]) });
    })());
  }
});

let assetMutationInProgress = false;
let offlineJob = null;

async function clearAssets(msg, reply) {
  if (assetMutationInProgress) {
    reply({ type: 'CACHE_CLEARED', batchId: msg.batchId, busy: true });
    return;
  }
  assetMutationInProgress = true;
  try {
    await caches.delete(ASSETS_CACHE);
    compactFrames = null;
    offlineJob = null;
    reply({ type: 'CACHE_CLEARED', batchId: msg.batchId });
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
    // A continuation can outlive its worker, but it must still belong to a
    // saved download. Another tab's Remove action deletes that checkpoint.
    if (!msg.dryRun && msg.continueJob && partialRecord?.digest !== digest) {
      const complete = appliedRecord?.digest === digest && plan.toFetch.length === 0 && plan.toRemove.length === 0;
      offlineJob = null;
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, applied: complete, cancelled: !complete });
      return;
    }
    if (msg.dryRun) {
      reply({ type: 'SYNC_PLAN', batchId: msg.batchId,
        digest, profile, installedProfile: appliedRecord ? appliedRecord.profile || 'full' : null,
        pendingProfile: partialRecord ? partialRecord.profile || 'full' : null,
        fetchCount: plan.toFetch.length, removeCount: plan.toRemove.length, bytes: plan.bytes,
        totalBytes: packFiles.reduce((sum, file) => sum + (file.b || 0), 0),
        complete: Boolean(appliedRecord && files.length && plan.toFetch.length === 0 && plan.toRemove.length === 0),
        resumable: Boolean(partialRecord && (partialRecord.profile || 'full') === profile),
        paused: partialRecord?.digest === digest && partialRecord.paused === true });
      return;
    }

    const job = offlineJob;
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
        await cache.put(APPLIED_MANIFEST_KEY, new Response(JSON.stringify({ files, digest, profile }),
          { headers: { 'Content-Type': 'application/json' } }));
        applied = true;
        compactFrames = null;
        await cache.delete(OFFLINE_PROGRESS_KEY);
      } catch (_) { /* Existing asset files can still be used on a retry. */ }
    }
    if (!applied) await checkpointAssets(cache, progress, job);
    job.status = applied ? 'complete' : 'incomplete';
    reply({ type: 'SYNC_DONE', batchId: msg.batchId, ...job, removed, applied });
    if (applied && digest) {
      try {
        for (const client of await self.clients.matchAll({ type: 'window' })) {
          try { client.postMessage({ type: 'OFFLINE_PACK_READY', digest, profile }); } catch (_) {}
        }
      } catch (_) { /* Readiness is still available through CACHE_STATE. */ }
    }
  } catch (_) {
    const type = msg.dryRun ? 'SYNC_PLAN' : 'SYNC_DONE';
    if (!msg.dryRun) offlineJob.status = 'incomplete';
    reply({ type, batchId: msg.batchId, failed: true });
  } finally {
    if (!msg.dryRun) assetMutationInProgress = false;
  }
}
