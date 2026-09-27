const VERSION = 'chapter-vii-2026-09-27-2';
const CACHE = `reading-euler-${VERSION}`;
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css', 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.filter(url => url.startsWith('/')));
    await Promise.allSettled(CORE.filter(url => url.startsWith('https://')).map(async url => cache.put(url, await fetch(url, {mode:'no-cors'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith('reading-euler-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const local = url.origin === self.location.origin;
  const katex = url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/katex@0.16.22/dist/');
  if (!local && !katex) return;
  if (request.mode === 'navigate' || (local && (url.pathname === '/index.html' || url.pathname === '/manifest.webmanifest'))) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); if (request.mode === 'navigate') await cache.put('/index.html', response.clone()); }
        return response;
      } catch {
        return (await caches.match(request)) || (request.mode === 'navigate' && await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') (await caches.open(CACHE)).put(request, response.clone());
      return response;
    } catch { return Response.error(); }
  })());
});
