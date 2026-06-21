/* Service worker for offline play.
 *
 * Strategy:
 *   • App shell (battle.html + the scripts it can't boot without) is PRECACHED on install,
 *     so the game launches with no network once installed.
 *   • Everything else same-origin (sprites, music, data/*.json, fonts, icons) is CACHE-FIRST
 *     with runtime population: the first time an asset is fetched while online it is stored,
 *     and every fetch after that is served from cache — works offline thereafter.
 *   • Cross-origin requests (Supabase for Online PvP, any CDN) are passed straight through to
 *     the network and never cached. PvP is inherently online; offline it simply fails quietly.
 *
 * Note: the full sprite/music library is ~600 MB, so it is NOT force-precached (that would be a
 * brutal install download and may blow browser cache quotas). Assets cache lazily as they are
 * used. Play through once while online to warm the cache for a given team/region; after that the
 * game is fully offline. Bump CACHE_VERSION whenever battle.html or a vendored script changes.
 */
const CACHE_VERSION = 'battle-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Files the app cannot boot without — precached so a cold offline launch works.
const SHELL = [
  './',
  'battle.html',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // Tolerate individual 404s so one missing optional file can't break the whole install.
      .then((cache) => Promise.all(SHELL.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cross-origin (Supabase, any CDN) → network only, never cached.
  if (url.origin !== self.location.origin) return;

  // Navigations → serve the cached app shell, fall back to network.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('battle.html').then((cached) => cached || fetch(req).catch(() => caches.match('./')))
    );
    return;
  }

  // Same-origin assets → cache-first, populate the runtime cache on first network hit.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Only cache complete, same-origin OK responses.
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
