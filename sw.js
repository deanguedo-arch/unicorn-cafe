/* Rainbow Restaurant v1.2.0 — versioned, same-origin, project-subdirectory-safe offline cache. */
const PREFIX='sneaky-restaurant:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+'1.2.0';
const FILES=[
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/art.js",
  "./src/assets.js",
  "./src/engine.js",
  "./src/game.js",
  "./assets/baby_blue_0.webp",
  "./assets/baby_blue_1.webp",
  "./assets/baby_blue_2.webp",
  "./assets/baby_blue_3.webp",
  "./assets/baby_blue_4.webp",
  "./assets/baby_blue_5.webp",
  "./assets/baby_pink_0.webp",
  "./assets/baby_pink_1.webp",
  "./assets/baby_pink_2.webp",
  "./assets/baby_pink_3.webp",
  "./assets/baby_pink_4.webp",
  "./assets/baby_pink_5.webp",
  "./assets/bread.webp",
  "./assets/burger.webp",
  "./assets/carrots.webp",
  "./assets/cheese.webp",
  "./assets/cherries.webp",
  "./assets/cookie.webp",
  "./assets/cupcake.webp",
  "./assets/dog_happy.webp",
  "./assets/dog_idle.webp",
  "./assets/donut.webp",
  "./assets/flowers.webp",
  "./assets/h_happy.webp",
  "./assets/h_idle0.webp",
  "./assets/h_idle1.webp",
  "./assets/h_run0.webp",
  "./assets/h_run1.webp",
  "./assets/h_run2.webp",
  "./assets/h_run3.webp",
  "./assets/hero.webp",
  "./assets/icecream.webp",
  "./assets/m_0_0.webp",
  "./assets/m_0_1.webp",
  "./assets/m_0_2.webp",
  "./assets/m_4_5.webp",
  "./assets/milk.webp",
  "./assets/pizza.webp",
  "./assets/restaurant.webp",
  "./assets/star.webp",
  "./assets/strawberry.webp",
  "./assets/teapot.webp",
  "./assets/u_happy0.webp",
  "./assets/u_happy1.webp",
  "./assets/u_happy2.webp",
  "./assets/u_idle0.webp",
  "./assets/u_idle1.webp",
  "./assets/u_run0.webp",
  "./assets/u_run1.webp",
  "./assets/u_run2.webp",
  "./assets/u_run3.webp",
  "./assets/u_run4.webp",
  "./assets/u_run5.webp",
  "./assets/w_0_0.webp",
  "./assets/w_0_1.webp",
  "./assets/w_0_2.webp",
  "./assets/w_5_3.webp",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const match=await cache.match(event.request,{ignoreSearch:event.request.mode==='navigate'});
  if(match)return match;
  try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate'){const fallback=await cache.match('./index.html');if(fallback)return fallback;}throw error;}
 }));
});
