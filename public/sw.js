// Service Worker minimal pour PWA
// Permet l'installation de l'application

const CACHE_NAME = 'derviche-v1';

// Installation - mise en cache des ressources essentielles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/accueil',
        '/manifest.json',
        '/favicon.png',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
      ]);
    })
  );
  // Activer immédiatement le nouveau service worker
  self.skipWaiting();
});

// Activation - nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Prendre le contrôle de toutes les pages
  self.clients.claim();
});

// Fetch - stratégie network-first (réseau d'abord, cache en fallback)
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes API et auth
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.hostname.includes('supabase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utiliser le cache
        return caches.match(event.request);
      })
  );
});
