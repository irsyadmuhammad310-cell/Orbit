// === Orbit Service Worker (V1.5.3) ===
// IMPORTANT: Bump this version string on EVERY deploy to trigger update
const CACHE_NAME = 'orbit-v1.5.3-b1724231820';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/seed.js',
  './js/home.js',
  './js/tasks.js',
  './js/calendar.js',
  './js/projects.js',
  './js/tracker.js',
  './js/notes.js',
  './js/admin.js',
  './js/intelligence.js',
  './js/contacts.js',
  './js/settings.js',
  './js/app.js',
  './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(res) {
      // Cache successful GET responses
      if (res.ok && e.request.method === 'GET') {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

// Listen for skip-waiting message
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
