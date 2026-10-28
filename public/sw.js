// Rock-solid, Dual-Host Safe Service Worker for Adis Formy PWA (Netlify & GitHub Pages)
const CACHE_NAME = 'adis-pwa-static-v14';

const RELATIVE_STATIC_ASSETS = [
  './',
  './index.html',
  './splash-orbit.svg',
  './af-base.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.ico',
  './favicon.png',
  './favicon-16.png',
  './favicon-32.png',
  './logo.png',
  './icon1.png',
  './icon2.png',
  './icon3.png',
  './icon5.png',
  './icon6.png',
  './icon7.png',
  './icon9.png',
  './sql.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dynamically resolve relative asset URLs against SW location (works seamlessly on GitHub Pages subpaths & Netlify root)
      const fullUrls = RELATIVE_STATIC_ASSETS.map((asset) => new URL(asset, self.location.href).href);
      return Promise.allSettled(
        fullUrls.map((url) =>
          fetch(url)
            .then((res) => {
              if (res && res.status === 200) {
                const contentType = res.headers.get('content-type') || '';
                // Safety check: Never cache HTML SPA fallback responses when fetching media/static assets
                const isMediaFile = /\.(png|ico|svg|jpg|jpeg|webp|json|css|js)$/i.test(url);
                if (isMediaFile && contentType.includes('text/html')) {
                  return;
                }
                return cache.put(url, res);
              }
            })
            .catch((err) => {
              console.warn('[SW] Precache skipped asset:', url, err);
            })
        )
      );
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

  // Stale-While-Revalidate for navigation requests (Instant <20ms boot on cold launch)
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type') || '';
              if (contentType.includes('text/html')) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(req, responseToCache);
                });
              }
            }
            return networkResponse;
          })
          .catch(() => null);

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetchPromise.then((netRes) => {
          if (netRes) return netRes;
          const fallbackUrl = new URL('./index.html', self.location.href).href;
          return caches.match(fallbackUrl);
        });
      })
    );
    return;
  }

  // Cache-first with resilient Content-Type protection for static assets
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      const fileName = url.pathname.split('/').pop() || '';
      const resolvedRelativeUrl = new URL('./' + fileName, self.location.href).href;

      return caches.match(resolvedRelativeUrl)
        .then((res) => {
          if (res) return res;
          return fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type') || '';
              const isMediaFile = /\.(png|ico|svg|jpg|jpeg|webp|json|css|js)$/i.test(url.pathname);
              
              // CRITICAL: Block Netlify SPA fallback HTML pages from being cached as images/assets!
              if (isMediaFile && contentType.includes('text/html')) {
                return networkResponse;
              }

              const resToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, resToCache);
              });
            }
            return networkResponse;
          }).catch(() => null);
        });
    })
  );
});
