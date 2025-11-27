// Advanced Service Worker for Maximum Performance
// Implements aggressive caching strategies for sub-300ms performance

const CACHE_NAME = 'auralo-v1.0.0';
const STATIC_CACHE = 'auralo-static-v1';
const DYNAMIC_CACHE = 'auralo-dynamic-v1';
const IMAGE_CACHE = 'auralo-images-v1';

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/maximum-performance.html',
  '/ultra-fast.html'
];

// Images to cache with stale-while-revalidate
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'];

// Install event - Cache critical assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Implement advanced caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Determine caching strategy based on request type
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isHTMLRequest(request)) {
    event.respondWith(handleHTMLRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAssetRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Image caching strategy: Stale-while-revalidate with size limits
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);

  try {
    // Try cache first
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Return cached version and update in background
      updateImageInBackground(request, cache);
      return cachedResponse;
    }

    // If not in cache, fetch and cache
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Check cache size before storing
      await limitCacheSize(IMAGE_CACHE, 50); // Max 50 images
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('Image fetch failed:', error);

    // Return fallback image
    return new Response(createFallbackImageSVG(), {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

// HTML caching strategy: Network first with cache fallback
async function handleHTMLRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');

  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback
    return new Response(createOfflinePage(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Static assets: Cache first with network fallback
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    // Check cache first
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If not cached, fetch and cache
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('Static asset fetch failed:', error);

    // Return minimal fallback for CSS/JS
    if (request.url.includes('.css')) {
      return new Response('/* Offline fallback CSS */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }

    if (request.url.includes('.js')) {
      return new Response('// Offline fallback JS', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }

    throw error;
  }
}

// Dynamic content: Network first with short-term cache
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache for 5 minutes
      const cache = await caches.open(DYNAMIC_CACHE);
      const responseToCache = networkResponse.clone();

      // Add timestamp header for cache expiry
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
    }

    return networkResponse;

  } catch (error) {
    // Check cache for recent version (within 5 minutes)
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

      if (!cachedAt || parseInt(cachedAt) > fiveMinutesAgo) {
        return cachedResponse;
      }
    }

    throw error;
  }
}

// Utility functions
function isImageRequest(request) {
  const url = new URL(request.url);
  return IMAGE_EXTENSIONS.some(ext => url.pathname.includes(ext));
}

function isHTMLRequest(request) {
  const acceptHeader = request.headers.get('Accept') || '';
  return acceptHeader.includes('text/html');
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('.css') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('.woff') ||
         url.pathname.includes('.woff2');
}

// Background image update
function updateImageInBackground(request, cache) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response);
      }
    })
    .catch(error => console.log('Background update failed:', error));
}

// Cache size management
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Remove oldest items
    const itemsToRemove = keys.slice(0, keys.length - maxItems);
    await Promise.all(itemsToRemove.map(key => cache.delete(key)));
  }
}

// Fallback content generators
function createFallbackImageSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect width="400" height="400" fill="#f0f0f0"/>
      <text x="200" y="200" font-family="Arial, sans-serif" font-size="16"
            fill="#999" text-anchor="middle" dominant-baseline="middle">
        Image temporarily unavailable
      </text>
    </svg>
  `;
}

function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Auralo</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; margin: 0; background: #f8f9fa;
          text-align: center; padding: 20px;
        }
        .offline-content {
          max-width: 400px; background: #fff; padding: 40px;
          border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 { margin-bottom: 20px; color: #1a1a1a; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        button {
          background: #000; color: #fff; border: none; padding: 12px 24px;
          border-radius: 8px; font-weight: 600; cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="offline-content">
        <h1>You're Offline</h1>
        <p>It looks like you've lost your connection. Don't worry, your favorite sneakers will be here when you get back!</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
}

// Handle background sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued operations when connection is restored
  console.log('Service Worker: Performing background sync operations');
}

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    tag: 'auralo-notification',
    actions: [
      {
        action: 'view',
        title: 'View Product',
        icon: '/images/action-view.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Auralo', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/maximum-performance.html')
    );
  }
});

console.log('Service Worker: Advanced caching strategies loaded');