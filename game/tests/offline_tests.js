/* Cache/worker logic simulation, NOT a real installed PWA test. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','pages'),source=fs.readFileSync(path.join(root,'sw.js'),'utf8');const report=[];
async function test(name,fn){try{const detail=await fn();report.push({name,pass:true,detail});console.log('PASS',name);}catch(e){report.push({name,pass:false,error:e.stack});console.error('FAIL',name,e.stack);}}
function harness(fail=false){
 const scope='https://test.invalid/restaurant/',handlers={},db=new Map(),state={claimed:false,skip:false,network:0},key=q=>new URL(typeof q==='string'?q:q.url,scope).href;
 db.set('sneaky-restaurant:/restaurant/:1.3.0-p4',new Map());db.set('sneaky-adventure:/restaurant/:9',new Map());db.set('sneaky-restaurant:/another-game/:1.2',new Map());
 const caches={open:async name=>{if(!db.has(name))db.set(name,new Map());let store=db.get(name);return {addAll:async files=>{if(fail)throw Error('Injected install failure');for(const f of files){const file=path.join(root,f.replace(/^\.\//,''));assert(fs.existsSync(file));store.set(key(f),{url:key(f),body:fs.readFileSync(file)});}},match:async (req,opts)=>{let k=key(req);if(opts?.ignoreSearch)k=k.split('?')[0];return store.get(k)||null;}};},keys:async()=>[...db.keys()],delete:async name=>db.delete(name)};
 const self={registration:{scope},location:{origin:'https://test.invalid'},addEventListener:(t,f)=>handlers[t]=f,skipWaiting:async()=>{state.skip=true},clients:{claim:async()=>{state.claimed=true}}};
 vm.runInNewContext(source,{self,caches,URL,fetch:async()=>{state.network++;throw Error('Network offline');},console});
 async function emit(t){let promise;handlers[t]({waitUntil:p=>promise=p});await promise;}
 async function get(url,mode='navigate',method='GET'){let promise;handlers.fetch({request:{url:new URL(url,scope).href,mode,method},respondWith:p=>promise=p});return promise?await promise:undefined;}
 return {db,state,emit,get};
}
(async()=>{
 const h=harness();
 await test('Install precaches embedded index, manifest and three app icons',async()=>{await h.emit('install');assert(h.state.skip);const currentKey=[...h.db.keys()].find(k=>/^sneaky-restaurant:\/restaurant\/:2\.0\.0-[a-f0-9]{16}$/.test(k));assert(currentKey,'content-derived cache key');const c=h.db.get(currentKey);assert.equal(c.size,5);return {cachedFiles:5};});
 await test('Activation removes only older caches for this restaurant scope',async()=>{await h.emit('activate');assert(!h.db.has('sneaky-restaurant:/restaurant/:1.3.0-p4'));assert(h.db.has('sneaky-adventure:/restaurant/:9'));assert(h.db.has('sneaky-restaurant:/another-game/:1.2'));assert(h.state.claimed);});
 await test('Offline root navigation receives cached current game',async()=>{const r=await h.get('./');assert(r.body.includes(Buffer.from("const VERSION='2.0.0'")));assert.equal(h.state.network,0);});
 await test('Offline deep/query navigation receives same app entry',async()=>{const r=await h.get('./play/?old=1');assert.equal(r.url,'https://test.invalid/restaurant/index.html');assert.equal(h.state.network,0);});
 await test('Offline manifest and all icons have cached bytes',async()=>{for(const file of ['./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'])assert((await h.get(file,'same-origin')).body.length>0);});
 await test('Other origins and sibling games are not intercepted',async()=>{assert.equal(await h.get('https://other.invalid/data'),undefined);assert.equal(await h.get('https://test.invalid/other-game/'),undefined);assert.equal(await h.get('https://test.invalid/restaurant-fake/'),undefined);});
 await test('Non-GET operations are not intercepted',async()=>{assert.equal(await h.get('./','navigate','POST'),undefined);});
 await test('Failed install never activates or skips the old worker',async()=>{const bad=harness(true);await assert.rejects(bad.emit('install'));assert(!bad.state.skip);assert(!bad.state.claimed);assert(bad.db.has('sneaky-restaurant:/restaurant/:1.3.0-p4'));});
 await test('Unknown uncached resource propagates network failure honestly',async()=>{await assert.rejects(h.get('./missing.png','same-origin'));assert.equal(h.state.network,1);});
 fs.writeFileSync(path.join(__dirname,'offline-results.json'),JSON.stringify({method:'Node VM with mocked CacheStorage, request/response and network; not browser service-worker registration or offline relaunch',passed:report.filter(x=>x.pass).length,total:report.length,results:report},null,2));if(report.some(x=>!x.pass))process.exitCode=1;
})();
