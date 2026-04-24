const CACHE_NAME = 'aakash-ai-v8';
const BASE = '/aakash-ai/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'crypto.js',
  BASE + 'state.js',
  BASE + 'tools.js',
  BASE + 'providers.js',
  BASE + 'ai.js',
  BASE + 'chat.js',
  BASE + 'projects.js',
  BASE + 'vault.js',
  BASE + 'notes.js',
  BASE + 'finance.js',
  BASE + 'habits.js',
  BASE + 'timer.js',
  BASE + 'create.js',
  BASE + 'voice.js',
  BASE + 'settings.js',
  BASE + 'app.js',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // API calls — always network, never cache
  if (
    event.request.url.includes('api.anthropic.com') ||
    event.request.url.includes('generativelanguage.googleapis.com') ||
    event.request.url.includes('fonts.googleapis.com') ||
    event.request.url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Everything else — Network First
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + 'index.html');
        }
      });
    })
  );
});
