const CACHE='scoundrel-v3-card-art';
const ASSETS=["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./cards/Clubs-10.webp", "./cards/Clubs-2.webp", "./cards/Clubs-3.webp", "./cards/Clubs-4.webp", "./cards/Clubs-5.webp", "./cards/Clubs-6.webp", "./cards/Clubs-7.webp", "./cards/Clubs-8.webp", "./cards/Clubs-9.webp", "./cards/Clubs-A.webp", "./cards/Clubs-J.webp", "./cards/Clubs-K.webp", "./cards/Clubs-Q.webp", "./cards/Diamonds-10.webp", "./cards/Diamonds-2.webp", "./cards/Diamonds-3.webp", "./cards/Diamonds-4.webp", "./cards/Diamonds-5.webp", "./cards/Diamonds-6.webp", "./cards/Diamonds-7.webp", "./cards/Diamonds-8.webp", "./cards/Diamonds-9.webp", "./cards/Hearts-10.webp", "./cards/Hearts-2.webp", "./cards/Hearts-3.webp", "./cards/Hearts-4.webp", "./cards/Hearts-5.webp", "./cards/Hearts-6.webp", "./cards/Hearts-7.webp", "./cards/Hearts-8.webp", "./cards/Hearts-9.webp", "./cards/Reference.webp", "./cards/Spades-10.webp", "./cards/Spades-2.webp", "./cards/Spades-3.webp", "./cards/Spades-4.webp", "./cards/Spades-5.webp", "./cards/Spades-6.webp", "./cards/Spades-7.webp", "./cards/Spades-8.webp", "./cards/Spades-9.webp", "./cards/Spades-A.webp", "./cards/Spades-J.webp", "./cards/Spades-K.webp", "./cards/Spades-Q.webp"];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>e.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));

self.addEventListener('fetch',e=>e.respondWith(
  caches.match(e.request,{cacheName:CACHE}).then(r=>r||fetch(e.request))
));
