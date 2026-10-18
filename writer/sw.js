/* Nenjac Writer offline helper. The page always tries the network first
   (so updates show up right away) and falls back to the saved copy offline.
   Fonts and character art are saved the first time they load. */
const CACHE = 'nenjac-writer-v1-0';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('nenjac-writer-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/api\.github\.com$/.test(url.hostname)) return;
  const scope = new URL(self.registration.scope);
  const isPage = req.mode === 'navigate' || (url.origin === location.origin && url.pathname.startsWith(scope.pathname) && /\/(index\.html)?$/.test(url.pathname));
  if (isPage) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html').then(r => r || caches.match(req))));
    return;
  }
  const cacheable = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || (url.origin === location.origin && /\.(png|jpe?g|webp|gif|svg|webmanifest)$/i.test(url.pathname));
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
