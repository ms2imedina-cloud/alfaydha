/* ════════════════════════════════════════════════════
   BAYE NIASS WORLD — Service Worker PWA
   Cache stratégie : Cache First pour assets statiques
   Network First pour Firebase / API
════════════════════════════════════════════════════ */

const CACHE_NAME = 'bayen-v1';
const CACHE_STATIC = [
  '/alfaydha/',
  '/alfaydha/index.html',
  '/alfaydha/manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap',
];

/* ── Installation : mise en cache des ressources statiques ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_STATIC);
    }).then(() => self.skipWaiting())
  );
});

/* ── Activation : suppression des anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch : stratégie selon la requête ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Firebase, Google APIs → Network First (pas de cache) */
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firebaseio.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  /* Assets statiques → Cache First */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        /* Ne mettre en cache que les réponses valides */
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => {
      /* Fallback hors-ligne : retourner la page principale */
      if (event.request.destination === 'document') {
        return caches.match('/alfaydha/');
      }
    })
  );
});
