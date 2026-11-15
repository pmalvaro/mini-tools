const scope = self.registration.scope;
const cachePrefix = `mini-tools:${scope}:`;
const cacheName = `${cachePrefix}v5`;
const files = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];
const assets = new Set(files.map((file) => new URL(file, scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => {
    return cache.addAll([...assets].map((url) => new Request(url, { cache: 'reload' })));
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names
      .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
      .map((name) => caches.delete(name))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    url.search = '';
  }

  if (request.method !== 'GET' || !assets.has(url.href)) {
    return;
  }

  event.respondWith(caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(url.href);
    return cached ?? fetch(request);
  }));
});
