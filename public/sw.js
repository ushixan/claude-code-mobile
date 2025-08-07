const CACHE_NAME = 'mobile-terminal-ide-v3';
const urlsToCache = [
  // Do not precache '/' or '/index.html' to avoid serving stale HTML
  '/manifest.json',
];

self.addEventListener('install', event => {
  // Skip waiting and activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Never cache API requests or WebSocket connections
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/socket.io/') ||
      url.pathname === '/health') {
    return event.respondWith(fetch(event.request));
  }
  
  // For assets, try network first, fall back to cache
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If successful, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For navigation requests, always prefer network; fallback to cache only if offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  // Claim all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      clients.claim()
    ])
  );
});

// Listen for messages to clear cache
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});