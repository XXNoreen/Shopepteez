/* Shopepteez service worker v5
   - The app page always tries the network first (so updates show), with an offline copy as backup.
   - Install files and icons are NEVER served from cache, so the installed app always gets the real icon. */
const VERSION = 'shopepteez-v6';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.add(new Request('./index.html', { cache: 'reload' })))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never touch install files, icons or this worker: the browser fetches them fresh.
  if (url.origin === location.origin && /\.(webmanifest|png|ico|svg|js)$/.test(url.pathname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }))
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Fonts and the Excel library: cache first so the app looks right offline.
  if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    })));
  }
});
