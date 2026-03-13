/* =============================================
   ADVENTOPIA — Service Worker
   Handles offline caching and PWA support
   ============================================= */


const CACHE_NAME = 'adventopia-v8';

const CORE_FILES = [
  "/adventopia/game/",
  "/adventopia/game/index.html",
  "/adventopia/game/style.css",
  "/adventopia/game/main.js",
  "/adventopia/game/scene-art.js",
  "/adventopia/game/puzzles.js",
  "/adventopia/game/manifest.json",

  // Scene and puzzle data
  "/adventopia/game/data/world1.json",
  "/adventopia/game/data/scene1_village_square.json",
  "/adventopia/game/data/scene2_library.json",
  "/adventopia/game/data/scene3_town_gate.json",
  "/adventopia/game/data/puzzle1_bread_sort.json",
  "/adventopia/game/data/puzzle2_story_pages.json",
  "/adventopia/game/data/puzzle3_gate_pattern.json",

  // Icons
  "/adventopia/game/assets/icons/icon-192.png",
  "/adventopia/game/assets/icons/icon-512.png",
  "/adventopia/game/assets/icons/key_piece.png",
  "/adventopia/game/assets/icons/hint_lumie.png",

  // Backgrounds
  "/adventopia/game/assets/backgrounds/scene1_village_square.png",
  "/adventopia/game/assets/backgrounds/scene2_library.png",
  "/adventopia/game/assets/backgrounds/scene3_town_gate.png",

  // Characters
  "/adventopia/game/assets/characters/benny_baker.png",
  "/adventopia/game/assets/characters/gus_gatekeeper.png",
  "/adventopia/game/assets/characters/Mara_librarian.png",
  "/adventopia/game/assets/characters/pip.png",
  "/adventopia/game/assets/characters/shell.png",

  // Objects
  "/adventopia/game/assets/objects/bench.png",
  "/adventopia/game/assets/objects/bookshelves-1.png",
  "/adventopia/game/assets/objects/bookshelves.png",
  "/adventopia/game/assets/objects/fountain.png",
  "/adventopia/game/assets/objects/gate_panel.png",
  "/adventopia/game/assets/objects/ivy_walls.png",
  "/adventopia/game/assets/objects/notice_board.png",
  "/adventopia/game/assets/objects/signpost.png",
  "/adventopia/game/assets/objects/spiral_staircase.png",
  "/adventopia/game/assets/objects/wall_map.png",

  // Badges
  "/adventopia/game/assets/badges/badge_super_sorter.png",
  "/adventopia/game/assets/badges/badge_story_keeper.png",
  "/adventopia/game/assets/badges/badge_village_hero.png",

  // Audio
  "/adventopia/game/assets/audio/music_village.mp3",
  "/adventopia/game/assets/audio/music_library.mp3",
  "/adventopia/game/assets/audio/music_gate.mp3",
  "/adventopia/game/assets/audio/sfx_click.mp3",
  "/adventopia/game/assets/audio/sfx_collect.mp3",
  "/adventopia/game/assets/audio/sfx_dialogue.mp3",
  "/adventopia/game/assets/audio/sfx_hint.mp3",
  "/adventopia/game/assets/audio/sfx_key_collect.mp3",
  "/adventopia/game/assets/audio/sfx_puzzle_complete.mp3",
  "/adventopia/game/assets/audio/sfx_reward.mp3",
  "/adventopia/game/assets/audio/sfx_scene_transition.mp3",
  "/adventopia/game/assets/audio/sfx_world_complete.mp3",
  "/adventopia/game/assets/audio/sfx_wrong.mp3"
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
      .then(() => {
        console.log('[SW] Core files cached — activating');
        return self.skipWaiting();
      })
      .catch(err => {
        // Log which file caused the failure if possible
        console.error('[SW] Cache install failed — SW will not activate:', err);
        // Do NOT call skipWaiting — let the old SW keep running
      })
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
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
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
            const dest = event.request.destination;

            // HTML pages — return the app shell
            if (dest === 'document') {
              return caches.match('/adventopia/game/index.html');
            }

            // JSON data files — return a structured error response
            // so loadScene/triggerPuzzle throw properly instead of
            // receiving undefined
            if (event.request.url.endsWith('.json')) {
              return new Response(
                JSON.stringify({ error: 'offline' }),
                { status: 503,
                  headers: { 'Content-Type': 'application/json' } }
              );
            }

            // Everything else (images, audio) — return empty 503
            return new Response('', { status: 503 });
          });
      })
  );
});