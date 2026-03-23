/* Faydha — Service Worker PWA */
var CACHE_NAME = 'faydha-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
  /* Nettoyer anciens caches */
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        /* Mettre en cache la page principale */
        if (e.request.url.includes('alfaydha.pages.dev')) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      })
      .catch(function() {
        /* Hors ligne : servir depuis le cache */
        return caches.match(e.request);
      })
  );
});
