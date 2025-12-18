const CACHE_NAME = `app-cache-${Date.now()}`

// Install → activate immediately
self.addEventListener('install', event => {
  self.skipWaiting()
})

// Activate → remove old caches
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

// Fetch → network first (always fresh)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
