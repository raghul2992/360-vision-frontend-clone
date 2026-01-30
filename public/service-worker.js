const CACHE_NAME = `app-cache-${Date.now()}`

self.addEventListener('install', event => {
  self.skipWaiting()
  console.log('Service Worker installed')
})

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

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

//[Image of Service Worker Network First Strategy]

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // 1. Only handle http/https and skip non-GET requests (POST, PUT, DELETE)
  if (!url.protocol.startsWith('http') || event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if the response is valid before caching
        if (
          !response ||
          response.status !== 200 ||
          (response.type !== 'basic' && response.type !== 'cors')
        ) {
          return response
        }

        const clone = response.clone()
        caches
          .open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, clone)
          })
          .catch(e => console.error('Cache put error:', e))

        return response
      })
      .catch(async () => {
        // 2. Fallback to cache if network fails
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) return cachedResponse

        // 3. Final safety: Return a valid Response object to prevent TypeError
        return new Response('Network error occurred and no cache available.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        })
      })
  )
})
