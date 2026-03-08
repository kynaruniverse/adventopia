/* =============================================
   ADVENTOPIA — Service Worker
   Handles offline caching and PWA support
   ============================================= */


const CACHE_NAME = 'adventopia-v3';

const CORE_FILES = [
  '/adventopia/',
  '/adventopia/index.html',
  '/adventopia/style.css',
  '/adventopia/main.js',
  '/adventopia/puzzles.js',
  '/adventopia/manifest.json',
  '/adventopia/data/world1.json',
  '/adventopia/data/scene1_village_square.json',
  '/adventopia/data/scene2_library.json',
  '/adventopia/data/scene3_town_gate.json',
  '/adventopia/data/puzzle1_bread_sort.json',
  '/adventopia/data/puzzle2_story_pages.json',
  '/adventopia/data/puzzle3_gate_pattern.json'
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