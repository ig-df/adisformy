// Rock-solid, Safe Service Worker for Adis Formy PWA (Netlify & GitHub Pages compatible)
const CACHE_NAME = 'adis-pwa-static-v11';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/splash-orbit.svg',
  '/af-base.png',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon.png',
  '/favicon-16.png',
  '/favicon-32.png',
  '/logo.png',
  '/icon1.png',
  '/icon2.png',
  '/icon3.png',
  '/icon5.png',
  '/icon6.png',
  '/icon7.png',
  '/icon9.png',
  '/sql.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll skipped missing asset:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never intercept external requests (Supabase, Google Apps Script, Gemini, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Never intercept dynamic APIs
  if (url.pathname.includes('/api/') || url.pathname.includes('supabase')) {
    return;
  }

  // Network First for navigation requests: ensures latest deployed code & bundles on Netlify
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cachedResponse) => {
            return cachedResponse || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Never intercept dynamic APIs
  if (url.pathname.includes('/api/') || url.pathname.includes('supabase')) {
    return;
  }

  // Cache-first only for static icons and manifest
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req);
    })
  );
});
