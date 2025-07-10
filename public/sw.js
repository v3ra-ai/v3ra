// Service Worker for v3ra app
const CACHE_NAME = 'v3ra-cache-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline usage
const urlsToCache = [
  '/',
  '/ask',
  '/ai-hub',
  '/headlines',
  '/leaderboard',
  '/icons/chatgpt.png',
  '/icons/claude.png',
  '/icons/gemini.png',
  '/logos/v3ralogo.png',
  '/logos/android-chrome-192x192.png',
  '/logos/android-chrome-512x512.png',
  // Add other critical assets
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return a custom offline response for API requests
          return new Response(
            JSON.stringify({ error: 'Offline - please try again when connected' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // Handle page requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If offline and request is for a page, return offline page
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle queued actions when back online
      syncOfflineActions()
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logos/android-chrome-192x192.png',
      badge: '/logos/android-chrome-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/') // Open app when notification is clicked
  );
});

// Function to sync offline actions
async function syncOfflineActions() {
  // Implementation for syncing offline actions
  // This would handle queued predictions, votes, etc.
  console.log('Syncing offline actions...');
}

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_REPORT') {
    // Handle performance reports from the main thread
    console.log('Performance report received:', event.data.metrics);
  }
});

// Cache size management
async function cleanupCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  // Remove old entries if cache is too large
  if (keys.length > 100) {
    const oldKeys = keys.slice(0, 20);
    await Promise.all(oldKeys.map(key => cache.delete(key)));
  }
}

// Run cleanup periodically
setInterval(cleanupCache, 24 * 60 * 60 * 1000); // Once per day 