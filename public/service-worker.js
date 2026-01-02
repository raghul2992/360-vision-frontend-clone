const CACHE_NAME = `app-cache-${Date.now()}`

// Install → wait
self.addEventListener('install', event => {
  console.log('Service Worker installed')
})

// Activate → clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache)
            }
          })
        )
      )
      .then(() => self.clients.claim())
  )
})

// Listen for update trigger
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Fetch → network first
self.addEventListener('fetch', event => {
  // IMPORTANT: Filter out non-cacheable requests
  const url = new URL(event.request.url);

  // 1. Skip requests that are not http/https (e.g., chrome-extension://, data:, blob:)
  // 2. You might also want to skip requests to other origins if you only want to cache your app's assets.
  //    For a 'network first' strategy, you might want to cache everything that is an actual web resource.
  //    However, if you're experiencing issues with external APIs or very dynamic content,
  //    you might add more specific origin checks here.
  if (!url.protocol.startsWith('http')) {
    // If it's not http or https, just let the browser handle it without interception
    return; // Do not call event.respondWith, let the browser's default fetch handle it
  }

  // If you only want to cache assets from your own domain:
  // if (url.origin !== location.origin) {
  //   return; // Or event.respondWith(fetch(event.request)); if you just want to pass it through
  // }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if the response is valid before caching
        // A response from an opaque request (e.g., cross-origin without CORS) might not be cacheable or useful.
        // Also, don't cache 206 Partial Content or other specific statuses.
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        }).catch(e => {
            console.error(`Service Worker: Failed to cache ${event.request.url}:`, e);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});