const CACHE_NAME = 'aakash-ai-v13';
const BASE = '/aakash-ai/';
const ASSETS = [
  BASE, BASE+'index.html', BASE+'icons.js', BASE+'crypto.js', BASE+'state.js',
  BASE+'tools.js', BASE+'web.js', BASE+'providers.js', BASE+'ai.js', BASE+'chat.js',
  BASE+'projects.js', BASE+'vault.js', BASE+'notes.js', BASE+'finance.js',
  BASE+'habits.js', BASE+'create.js', BASE+'voice.js', BASE+'settings.js',
  BASE+'app.js', BASE+'manifest.json', BASE+'icon-192.png', BASE+'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  // Pass through: APIs, fonts, web reader proxies
  const passthrough = ['api.anthropic.com','generativelanguage.googleapis.com','fonts.googleapis.com','fonts.gstatic.com','r.jina.ai','api.allorigins.win','corsproxy.io','api.codetabs.com','api.openai.com','api.elevenlabs.io'];
  if (passthrough.some(d => event.request.url.includes(d))) {
    event.respondWith(fetch(event.request)); return;
  }
  event.respondWith(fetch(event.request).then(response => {
    if (response.status === 200) { const clone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)); }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match(BASE+'index.html') : undefined))));
});
