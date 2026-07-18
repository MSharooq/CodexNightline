const version = new URL(self.location.href).searchParams.get('v') ?? 'v1'
const CACHE = `sahaayi-${version}`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('sahaayi-') && key !== CACHE).map((key) => caches.delete(key)),
  )))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')))
    return
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
})
