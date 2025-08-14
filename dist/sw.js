// SmartPOS Service Worker - Optimized for Cloudflare deployment
// Follows rules: Online-only, no offline functionality, performance optimization only

const CACHE_NAME = 'smartpos-v1.0.0';
const API_BASE = 'https://smartpos-api.bangachieu2.workers.dev';

// Cache static assets only (no offline functionality)
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SmartPOS SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SmartPOS SW: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('SmartPOS SW: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SmartPOS SW: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SmartPOS SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SmartPOS SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SmartPOS SW: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - Network-first strategy (online-only)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests - always go to network (online-only)
  if (url.origin === API_BASE || url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            // Clone response for caching
            const responseClone = response.clone();
            
            // Cache API responses for short time (performance only)
            caches.open(CACHE_NAME + '-api')
              .then((cache) => {
                cache.put(request, responseClone);
                // Auto-expire API cache after 5 minutes
                setTimeout(() => {
                  cache.delete(request);
                }, 5 * 60 * 1000);
              });
          }
          return response;
        })
        .catch((error) => {
          console.error('SmartPOS SW: API request failed', error);
          // Don't provide offline fallback - online-only
          throw error;
        })
    );
    return;
  }
  
  // Handle static assets - cache-first for performance
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache for performance
            return cachedResponse;
          }
          
          // Fetch from network and cache
          return fetch(request)
            .then((response) => {
              // Only cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.error('SmartPOS SW: Static asset request failed', error);
              throw error;
            });
        })
    );
  }
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('SmartPOS SW: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('SmartPOS SW: Unhandled promise rejection', event.reason);
});

console.log('SmartPOS Service Worker loaded - Online-only mode');
