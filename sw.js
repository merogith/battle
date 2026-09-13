/* Service worker for offline play + differential ("download only the diff") updates.
 *
 * Caches:
 *   • SHELL_CACHE  (versioned)  — app boot files (battle.html + scripts it can't launch without).
 *     Re-precached on every SW install with {cache:'reload'}, so a new deploy's CODE reaches
 *     players automatically via the normal SW lifecycle (only the small shell is re-fetched).
 *   • ASSETS_CACHE ('battle-assets', STABLE) — the opt-in bulk download (all sprites/music/data…).
 *     Survives CACHE_VERSION bumps so an update never wipes the 600 MB library. Updated in place
 *     by SYNC_ASSETS, which fetches only the files whose content hash changed (+ new files) and
 *     deletes removed ones. A snapshot of the last-applied manifest lives here under
 *     __OFFLINE_MANIFEST__ so the next sync can diff against it.
 *   • RUNTIME_CACHE (versioned) — lazy cache-on-first-use for assets a non-downloader happens to hit.
 *
 * Fetch precedence (cache-first): SHELL → ASSETS → RUNTIME → network. Serving the shell first keeps
 * code fresh even when ASSETS still holds an older battle.html. Cross-origin (Supabase/CDN) is
 * network-only. Bump CACHE_VERSION when the shell/code changes.
 */
const CACHE_VERSION = 'battle-v5-828dc46a6e15';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const ASSETS_CACHE = 'battle-assets';            // STABLE — not version-keyed
const APPLIED_MANIFEST_KEY = '__OFFLINE_MANIFEST__';

// Files the app cannot boot without — precached so a cold offline launch works.
const SHELL = [
  './',
  'battle.html',
  'game-upgrades.js',
  'game-upgrades.css',
  'index.html',
  'manifest.webmanifest',
  'online-config.js',
  'online-pvp.js',
  'move-anim-map.js',
  'move-sfx-map.js',
  'vendor/anime.min.js',
  'vendor/pkmn-dex.min.js',
  'vendor/pkmn-dex-learnsets.min.js',
  'sprites/placeholder.svg',
  'sprites/substitute.png',
  'icons/app-icon.svg',
];

// An incomplete or mismatched core never activates. Media remains an optional download.
async function verifyResponse(response, file) {
  if (!response || !response.ok) throw new Error(`Could not fetch ${file.u}`);
  const buffer=await response.clone().arrayBuffer();
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
  const core=manifest.files.filter(f=>SHELL.includes(f.u) || f.u.startsWith('data/'));
  for(const required of SHELL.filter(u=>u!=='./'))if(!core.some(f=>f.u===required))throw new Error(`Core asset missing: ${required}`);
  const cache=await caches.open(SHELL_CACHE);
  for(let i=0;i<core.length;i+=12) await Promise.all(core.slice(i,i+12).map(async file=>{
    const response=await verifyResponse(await fetch(file.u,{cache:'reload'}),file);
    await cache.put(file.u,response);
  }));
  await cache.put('./',await cache.match('index.html'));
  await cache.put('offline-assets.json',new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/json'}}));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        // Preserve the current shell + runtime, AND the stable assets cache (never wipe the download).
        keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE && k !== ASSETS_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(req) {
  for (const name of [SHELL_CACHE, ASSETS_CACHE, RUNTIME_CACHE]) {
    const c = await caches.open(name);
    const hit = await c.match(req);
    if (hit) return hit;
  }
  return null;
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cross-origin (Supabase, any CDN) → network only, never cached.
  if (url.origin !== self.location.origin) return;

  // Navigations → serve the cached shell instantly, but revalidate it against the network
  // in the background (stale-while-revalidate). This is what makes a redeploy reach players
  // like a normal app update WITHOUT a manual CACHE_VERSION bump: if the live battle.html
  // changed, we refresh SHELL_CACHE and tell the page so it can offer a one-tap reload.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const shell = await caches.open(SHELL_CACHE);
      const cached = (await shell.match('battle.html'))
        || (await (await caches.open(ASSETS_CACHE)).match('battle.html'));
      if (cached) {
        event.waitUntil(revalidateShell());
        return cached;
      }
      return fetch(req).catch(() => shell.match('./'));
    })());
    return;
  }

  // Same-origin assets → cache-first by precedence; populate RUNTIME on first network hit.
  event.respondWith((async () => {
    const hit = await cacheFirst(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        const runtime=await caches.open(RUNTIME_CACHE);
        await runtime.put(req,copy);
        const entries=await runtime.keys();
        for(const oldest of entries.slice(0,Math.max(0,entries.length-200)))await runtime.delete(oldest);
      }
      return res;
    } catch (e) {
      return hit; // offline + uncached → let the request fail
    }
  })());
});

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

async function readAppliedHashes(cache) {
  const r = await cache.match(APPLIED_MANIFEST_KEY);
  if (!r) return {};
  try {
    const j = await r.json();
    const map = {};
    for (const f of (j.files || [])) map[f.u] = f.h;
    return map;
  } catch (e) { return {}; }
}

async function presentUrls(cache) {
  const keys = await cache.keys();
  const set = new Set();
  for (const req of keys) {
    const u = relUrl(req.url);
    if (u !== APPLIED_MANIFEST_KEY) set.add(u);
  }
  return set;
}

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  const reply = (payload) => {
    if (event.source && event.source.postMessage) event.source.postMessage(payload);
    else self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage(payload)));
  };

  if (msg.type === 'SYNC_ASSETS' && msg.manifest && Array.isArray(msg.manifest.files)) {
    event.waitUntil((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const oldHash = await readAppliedHashes(cache);
      const present = await presentUrls(cache);
      const plan = computeSyncPlan(msg.manifest.files, oldHash, present);

      // Dry run: report the delta so the UI can show "Update available — N files, X MB".
      if (msg.dryRun) {
        reply({ type: 'SYNC_PLAN', batchId: msg.batchId,
          fetchCount: plan.toFetch.length, removeCount: plan.toRemove.length, bytes: plan.bytes });
        return;
      }

      const total = plan.toFetch.length;
      let done = 0, failed = 0;
      for (let i = 0; i < total; i += 50) {
        const batch = plan.toFetch.slice(i, i + 50);
        await Promise.allSettled(batch.map(async (f) => {
          try {
            const res = await fetch(f.u, { cache: 'reload' }); // bypass HTTP cache → get the new bytes
            if (res && res.ok) { await verifyResponse(res,f); await cache.put(f.u, res.clone()); done++; }
            else failed++;
          } catch (e) { failed++; }                            // network error / QuotaExceededError
        }));
        reply({ type: 'SYNC_PROGRESS', batchId: msg.batchId, done, total, failed });
      }
      let removed = 0;
      for (const u of plan.toRemove) { try { if (await cache.delete(u)) removed++; } catch (e) {} }
      // Snapshot the applied manifest so the next sync diffs against it.
      try {
        if (failed === 0) await cache.put(APPLIED_MANIFEST_KEY, new Response(JSON.stringify(msg.manifest),
          { headers: { 'Content-Type': 'application/json' } }));
      } catch (e) {}
      reply({ type: 'SYNC_DONE', batchId: msg.batchId, done, total, removed, failed, bytes: plan.bytes });
    })());
  } else if (msg.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      await caches.delete(ASSETS_CACHE);
      await caches.open(ASSETS_CACHE); // recreate empty (also drops the applied-manifest snapshot)
      reply({ type: 'CACHE_CLEARED', batchId: msg.batchId });
    })());
  } else if (msg.type === 'CACHE_STATE') {
    event.waitUntil((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const keys = await cache.keys();
      const applied = await readAppliedHashes(cache);
      const appliedCount = Object.keys(applied).length;
      // cachedCount excludes the manifest snapshot entry; appliedCount = files the
      // last-applied manifest recorded (0 when nothing was ever downloaded).
      reply({ type: 'CACHE_STATE', batchId: msg.batchId,
        cachedCount: Math.max(0, keys.length - 1), appliedCount });
    })());
  }
});
