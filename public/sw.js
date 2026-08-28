// PWA Service Worker：网络优先 + 缓存兜底，保证可安装且不干扰接口请求
const CACHE = 'wb-v1'
const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg', '/pwa-192.png', '/pwa-512.png']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => {})
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // 网络优先：拿最新数据；离线时回退缓存
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('/')))
  )
})
