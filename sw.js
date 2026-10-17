/* Nenjac Creator offline helper.
   The app page always tries the network first (so updates show up right away)
   and falls back to the saved copy when you're offline. Art, music and fonts are
   saved the first time they load. */
const CACHE = 'nenjac-creator-v5-8-1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nenjac-creator-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (isPage) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  const cacheable = (url.origin === location.origin && /\/assets\//.test(url.pathname)) || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || /\.(png|webmanifest)$/.test(url.pathname);
  if (!cacheable || req.headers.has('range') || /\.(mp4|webm|mov)$/i.test(url.pathname)) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
