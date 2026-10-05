/* eslint-disable no-restricted-globals */

// Bump this whenever the caching strategy below changes so old caches get
// cleared out on activate.
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `rentaflow-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rentaflow-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Financial/tenant data must never be served from cache — anything hitting
// the API (same-origin /api/ path, or a cross-origin API host in prod) is
// always fetched fresh from the network.
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.origin !== self.location.origin;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return; // never intercept mutations (POST/PUT/DELETE payments, etc.)
  }

  const url = new URL(request.url);

  if (isApiRequest(url)) {
    return; // let the browser handle API calls normally — no caching, ever
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // App shell + static assets (JS/CSS/fonts/images): stale-while-revalidate
  // so repeat visits render instantly, while the cache still gets refreshed
  // in the background whenever the network is available.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
