/* Static release and root-worker scope checks; no browser storage is touched. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../game/pages'),results=[];
const check=(name,details)=>{results.push({name,pass:true,details});console.log('PASS',name);};
(async()=>{
 const sums=fs.readFileSync(path.join(root,'SHA256SUMS.txt'),'utf8').trim().split('\n');
 for(const line of sums){const h=line.slice(0,64),p=line.slice(66);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),h,p);}
 check('Every packaged file matches its release checksum',{files:sums.length});
 const entry=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 assert.ok(entry.includes("new URL('./hub/'+location.search,location.href)"));assert.equal(manifest.name,'Unicorn World');assert.equal(manifest.orientation,'landscape');assert.equal(manifest.id,'./index.html');
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)));
 for(const p of ['hub/index.html','game/build/index.html','adventure/index.html','hub/shared/profile.js','hub/shared/bridge.js','hub/shared/art.js','hub/shared/portals.js'])assert.ok(fs.existsSync(path.join(root,p)));
 assert.ok(!fs.existsSync(path.join(root,'hub/tests')));assert.ok(!fs.existsSync(path.join(root,'adventure/original-packages')));
 check('The root launches Unicorn World, retains both games and landscape installation, and excludes QA/source ZIPs');
 for(const file of ['game/build/src/game.js','adventure/index.html']){
  const source=fs.readFileSync(path.join(root,file),'utf8');assert.ok(source.includes("new URL('hub/shared/'+file+'.js',worldBase).href"));assert.ok(source.includes('base.origin===worldOrigin'));
 }
 check('Both game bridges use the checked project base, rather than the hosting domain root');
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8'),handlers={},deleted=[],keys=['sneaky-restaurant:/unicorn-cafe/:old','sneaky-restaurant:/another/:old','sneaky-unicorn-scope-%2Funicorn-cafe%2Fadventure%2F-v15','world-test-unrelated'];let claimed=false,skipped=false;
 const context={URL,self:{registration:{scope:'https://example.invalid/unicorn-cafe/'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{skipped=true;},clients:{claim:async()=>{claimed=true;}}},caches:{keys:async()=>keys,delete:async key=>{deleted.push(key);}}};vm.runInNewContext(worker,context);
 for(const kind of ['install','activate']){let pending;handlers[kind]({waitUntil:p=>pending=p});await pending;}
 assert.ok(skipped&&claimed);assert.deepEqual(deleted,[keys[0]]);assert.equal(handlers.fetch,undefined);assert.ok(!worker.includes('localStorage')&&!worker.includes('indexedDB'));
 check('The replacement root worker retires only the old café root cache and cannot erase native/shared saves or sibling caches');
 fs.writeFileSync(path.resolve(__dirname,'release-package-results.json'),JSON.stringify({results,files:sums.length},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
