
const CACHE_NAME = 'ledger-pwa-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './storage.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];
self.addEventListener('install', (e)=>{ e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS))); });
self.addEventListener('activate', (e)=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); });
self.addEventListener('fetch', (e)=>{ const url = new URL(e.request.url); if(url.origin === location.origin){ e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request))); } });
