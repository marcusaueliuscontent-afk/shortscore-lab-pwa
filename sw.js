const SHORTSCORE_CACHE = 'shortscore-pwa-v2';
const APP_SCOPE = self.registration.scope;
const scopedUrl = (path = '') => new URL(path, APP_SCOPE).toString();
const PRECACHE_URLS = [
  '',
  'manifest.webmanifest',
  'favicon.svg',
  'pwa/icon-180.png',
  'pwa/icon-192.png',
  'pwa/icon-512.png',
  'pwa/maskable-512.png',
].map((path) => scopedUrl(path));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHORTSCORE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHORTSCORE_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(scopedUrl(''))));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(SHORTSCORE_CACHE).then((cache) => cache.put(request, responseToCache));
          }

          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    }),
  );
});
