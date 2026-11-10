const CACHE_NAME = 'roadtohalal-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/rute',
  '/profil',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Road To Halal: Removing outdated cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. For API GET requests, use Stale-While-Revalidate
  if ((url.pathname.startsWith('/api/m/') || url.pathname.startsWith('/api/route')) && request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. For navigation requests, network first, fallback to cached offline shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline') || caches.match('/rute') || caches.match('/');
        });
      })
    );
    return;
  }

  // 3. Network-First for Icons & Logos to prevent stale branding
  if (url.pathname.startsWith('/icons/') || url.pathname === '/favicon.ico') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4. Cache-First with Network fallback for hashed Next.js assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
            }
            return networkResponse;
          })
        );
      })
    );
  }
});
