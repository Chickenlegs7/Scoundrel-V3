const CACHE='dungeon-arcade-v2.1';
const ASSETS=["./", "./index.html", "./hub.css", "./manifest.webmanifest", "./delver/", "./delver/index.html", "./delver/styles.css", "./delver/app.js", "./scoundrel/", "./scoundrel/index.html", "./scoundrel/styles.css", "./scoundrel/app.js", "./scoundrel/cards/Hearts-3.webp", "./scoundrel/cards/Diamonds-5.webp", "./scoundrel/cards/Diamonds-7.webp", "./scoundrel/cards/Diamonds-8.webp", "./scoundrel/cards/Diamonds-4.webp", "./scoundrel/cards/Spades-A.webp", "./scoundrel/cards/Clubs-4.webp", "./scoundrel/cards/Clubs-5.webp", "./scoundrel/cards/Spades-J.webp", "./scoundrel/cards/Spades-10.webp", "./scoundrel/cards/Spades-4.webp", "./scoundrel/cards/Hearts-2.webp", "./scoundrel/cards/Clubs-6.webp", "./scoundrel/cards/Hearts-5.webp", "./scoundrel/cards/Spades-5.webp", "./scoundrel/cards/Diamonds-3.webp", "./scoundrel/cards/Spades-9.webp", "./scoundrel/cards/Clubs-K.webp", "./scoundrel/cards/Diamonds-6.webp", "./scoundrel/cards/Hearts-9.webp", "./scoundrel/cards/Clubs-10.webp", "./scoundrel/cards/Clubs-8.webp", "./scoundrel/cards/Hearts-8.webp", "./scoundrel/cards/Clubs-2.webp", "./scoundrel/cards/Clubs-A.webp", "./scoundrel/cards/Clubs-7.webp", "./scoundrel/cards/Clubs-Q.webp", "./scoundrel/cards/Hearts-7.webp", "./scoundrel/cards/Clubs-3.webp", "./scoundrel/cards/Spades-8.webp", "./scoundrel/cards/Spades-7.webp", "./scoundrel/cards/Hearts-4.webp", "./scoundrel/cards/Spades-2.webp", "./scoundrel/cards/Spades-6.webp", "./scoundrel/cards/Spades-3.webp", "./scoundrel/cards/Spades-K.webp", "./scoundrel/cards/Clubs-J.webp", "./scoundrel/cards/Spades-Q.webp", "./scoundrel/cards/Hearts-10.webp", "./scoundrel/cards/Clubs-9.webp", "./scoundrel/cards/Diamonds-2.webp", "./scoundrel/cards/Hearts-6.webp", "./scoundrel/cards/Reference.webp", "./scoundrel/cards/Diamonds-10.webp", "./scoundrel/cards/Diamonds-9.webp"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  const isCode=req.mode==='navigate' || /\.(?:html|js|css|webmanifest)$/.test(url.pathname);
  if(isCode){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;})));
  }
});
