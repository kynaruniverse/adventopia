/* =============================================
   ADVENTOPIA — Service Worker
   Handles offline caching and PWA support
   ============================================= */


const CACHE_NAME = 'adventopia-v4';

const CORE_FILES = [
  "/adventopia/",
  "/adventopia/manifest.json",
  "/adventopia/README.md",
  "/adventopia/assets/audio/music_gate.mp3",
  "/adventopia/assets/audio/music_library.mp3",
  "/adventopia/assets/audio/music_village.mp3",
  "/adventopia/assets/audio/sfx_click.mp3",
  "/adventopia/assets/audio/sfx_collect.mp3",
  "/adventopia/assets/audio/sfx_dialogue.mp3",
  "/adventopia/assets/audio/sfx_hint.mp3",
  "/adventopia/assets/audio/sfx_key_collect.mp3",
  "/adventopia/assets/audio/sfx_puzzle_complete.mp3",
  "/adventopia/assets/audio/sfx_reward.mp3",
  "/adventopia/assets/audio/sfx_scene_transition.mp3",
  "/adventopia/assets/audio/sfx_world_complete.mp3",
  "/adventopia/assets/audio/sfx_wrong.mp3",
  "/adventopia/assets/backgrounds/placeholder.js",
  "/adventopia/assets/characters/placeholder.js",
  "/adventopia/assets/icons/icon-192.png",
  "/adventopia/assets/icons/icon-512.png",
  "/adventopia/assets/icons/placeholder.js",
  "/adventopia/assets/objects/placeholder.js",
  "/adventopia/data/puzzle1_bread_sort.json",
  "/adventopia/data/puzzle2_story_pages.json",
  "/adventopia/data/puzzle3_gate_pattern.json",
  "/adventopia/data/scene1_village_square.json",
  "/adventopia/data/scene2_library.json",
  "/adventopia/data/scene3_town_gate.json",
  "/adventopia/data/world1.json",
  "/adventopia/index.html",
  "/adventopia/main.js",
  "/adventopia/puzzles.js",
  "/adventopia/puzzles/placeholder.js",
  "/adventopia/scene-art.js",
  "/adventopia/scenes/placeholder.js",
  "/adventopia/style.css"
];


// -----------------------------------------------
// INSTALL
// Runs when the service worker is first installed
// Caches all core files
// -----------------------------------------------

self.addEventListener('install', event => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core files');
        return cache.addAll(CORE_FILES);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install error:', err))
  );
});


// -----------------------------------------------
// ACTIVATE
// Runs when a new service worker takes over
// Cleans up any old caches from previous versions
// -----------------------------------------------

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});


// -----------------------------------------------
// FETCH
// Intercepts every network request
// Serves from cache if available
// Falls back to network if not cached
// -----------------------------------------------

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        // Return cached version if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {

            // Cache the new response for next time
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail
            // show a friendly offline message for HTML requests
            if (event.request.destination === 'document') {
              return caches.match('/adventopia/index.html');
            }
          });
      })
  );
});