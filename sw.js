const CACHE_NAME = "walibi-quest-v2026-update12";
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/audio.js',
  '/js/data/rulesData.js',
  '/js/data/mascotsData.js',
  '/js/data/partyQuotesData.js',
  '/js/data/attractionsData.js',
  '/js/data/questsData.js',
  '/js/data/parkMapData.js',
  '/js/camera.js',
  '/js/store.js',
  '/js/profile.js',
  '/js/parkMap.js',
  '/js/parkGuide.js',
  '/js/quests.js',
  '/js/counter.js',
  '/js/feed.js',
  '/js/leaderboard.js',
  '/js/awards.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache prefetch partial', err));
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // SSE und API Requests nicht über ServiceWorker cachen
  if (e.request.url.includes('/api/')) {
    return;
  }

  if (e.request.method === "GET") {
    // Network-First: Wenn online, immer neueste Version laden und Cache aktualisieren
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline-Fallback auf Cache
          return caches.match(e.request);
        })
    );
  }
});
