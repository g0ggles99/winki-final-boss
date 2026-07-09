const CACHE = 'winki-final-boss-v7';
const FILES = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './assets/winki-surfer-source.png', './assets/winki-app-icon.png'];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(saved => saved || fetch(event.request))));
