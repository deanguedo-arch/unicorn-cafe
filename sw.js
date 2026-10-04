/* Rainbow Restaurant v1.6.0. Same-origin, directory-scoped offline cache. */
const PREFIX='sneaky-restaurant:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+'1.6.0';
const FILES=[
  "./index.html",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const key=req.mode==='navigate'?'./index.html':req;
  const hit=await cache.match(key,{ignoreSearch:req.mode==='navigate'});
  if(hit)return hit;
  return fetch(req);
 }));
});
