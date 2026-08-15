const CACHE_NAME = "walibi-quest-v8";
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
  '/js/store.js',
  '/js/profile.js',
  '/js/parkGuide.js',
  '/js/quests.js',
  '/js/counter.js',
  '/js/feed.js',
  '/js/leaderboard.js',
  '/js/awards.js',
  '/js/app.js',
  '/manifest.json',
  '/assets/walibi_festival_poster_bg.jpg',
  '/assets/walibi_trio_banner.jpg',
  '/assets/attr_untamed.jpg',
  '/assets/attr_goliath.jpg',
  '/assets/attr_lost_gravity.jpg',
  '/assets/attr_xpress.jpg',
  '/assets/attr_speed_of_sound.jpg',
  '/assets/attr_eat_my_dust.jpg',
  '/assets/attr_drako.jpg',
  '/assets/attr_el_rio_grande.jpg',
  '/assets/attr_space_shot.jpg',
  '/assets/attr_blast.jpg',
  '/assets/attr_g_force.jpg',
  '/assets/attr_spinning_vibe.jpg',
  '/assets/attr_super_swing.jpg',
  '/assets/attr_tomahawk.jpg',
  '/assets/attr_grande_roue.jpg',
  '/assets/attr_merlins_castle.jpg',
  '/assets/attr_skydiver.jpg',
  '/assets/attr_yoy_chill.jpg',
  '/assets/attr_yoy_thrill.jpg',
  '/assets/mascot_kangaroo.jpg',
  '/assets/mascot_hard_gaan.jpg',
  '/assets/mascot_fox.jpg'
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
