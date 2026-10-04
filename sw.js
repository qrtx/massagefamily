const CACHE_NAME = 'massagefamily-v14';
const APP_SHELL = [
  './', './index.html', './about.html', './services.html', './prices.html', './booking.html', './admin.html',
  './styles.css', './app.js', './site-common.js', './booking-page.js', './admin.js', './site-data.js', './prices-live.js', './firebase-client.js', './site.webmanifest', './assets/leaf.svg',
  './assets/photos/hero.jpg', './assets/photos/massage.jpg', './assets/photos/practice.jpg',
  './assets/photos/gallery/session-01.webp', './assets/photos/gallery/session-02.webp',
  './assets/photos/gallery/session-03.webp', './assets/photos/gallery/session-04.webp',
  './assets/photos/gallery/session-05.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
