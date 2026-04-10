// Service Worker - Request Interception for Proxy
const CACHE_NAME = 'phaxe-v1';
const PROXY_BASE = self.location.origin;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept requests that should go through proxy
  const url = new URL(event.request.url);
  
  // Skip proxy requests, extension requests, etc.
  if (url.pathname.startsWith('/proxy/') || 
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/ws')) {
    return;
  }

  // Cache-first strategy for static assets
  if (event.request.destination === 'style' || 
      event.request.destination === 'script' ||
      event.request.destination === 'image' ||
      event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
});

// Message handler for proxy requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PROXY_REQUEST') {
    const { url } = event.data;
    const encoded = btoa(url);
    const proxyUrl = `${PROXY_BASE}/proxy/${encoded}`;
    
    event.source.postMessage({
      type: 'PROXY_URL',
      url: proxyUrl,
    });
  }
});
