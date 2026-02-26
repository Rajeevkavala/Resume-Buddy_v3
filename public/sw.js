/**
 * Service Worker v3 - Network-First Strategy
 * Ensures users always get the latest version of HTML pages
 * while caching static assets for performance
 */

const CACHE_VERSION = 'v4'; // INCREMENT ON EVERY DEPLOY
const CACHE_NAME = `resume-buddy-${CACHE_VERSION}`;

// Minimal set of routes to cache for offline fallback
const offlineRoutes = ['/', '/login', '/signup'];

// Install event - cache core routes
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        offlineRoutes.map(route => 
          fetch(route, { cache: 'reload' })
            .then(res => {
              if (res.ok) {
                return cache.put(route, res);
              }
            })
            .catch(() => console.log(`[SW] Could not cache ${route}`))
        )
      );
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => {
      console.log('[SW] Now controlling all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network-first for HTML, Cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip requests to other origins
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  const url = new URL(event.request.url);
  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isAPI = url.pathname.startsWith('/api/');
  const isNextInternal = url.pathname.startsWith('/_next/');
  
  // Never cache API requests - let them go to network
  if (isAPI) return;
  
  // Network-first for HTML pages (always get fresh content)
  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Fall back to home page for offline
            return caches.match('/');
          });
        })
    );
    return;
  }
  
  // Network-first for Next.js static assets.
  // Even though /_next/static/ filenames are hashed in production, they can
  // change after a .next cache wipe in development. Network-first ensures
  // stale chunks are never served with outdated server-action IDs.
  if (isNextInternal) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Cache-first for other static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request).then((response) => {
        // Only cache successful responses for static file types
        if (response.ok && url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Message event - handle commands from client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING, activating new version');
    self.skipWaiting();
  }
  
  if (event.data?.type === 'PRELOAD_ROUTES') {
    const routes = event.data.routes || [];
    caches.open(CACHE_NAME).then((cache) => {
      routes.forEach(route => {
        fetch(route).then(response => {
          if (response.ok) {
            cache.put(route, response);
            console.log('[SW] Preloaded route:', route);
          }
        }).catch(() => {});
      });
    });
  }
});