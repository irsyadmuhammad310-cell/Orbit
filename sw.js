/* ═══ ORBIT — SW.JS ═══
 * Service Worker: offline caching
 */

const CACHE_NAME = 'orbit-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/js/helpers.js',
  '/js/app.js',
  '/js/overview.js',
  '/js/tasks.js',
  '/js/calendar.js',
  '/js/goals.js',
  '/js/projects.js',
  '/js/reminders.js',
  '/js/integrations.js',
  '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CDN resources (Chart.js, Lucide, Google Fonts): network first
  if (url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Local assets: cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
