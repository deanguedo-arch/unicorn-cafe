// Isolated IndexedDB-shaped harness for Profile receipt/media transactions; no browser or user origin.
const assert=require('node:assert/strict');
const {Profile}=require('../../shared/profile.js');
const K=require('../../shared/clubhouse-state.js');
const databases=new Map(); let failNextWrite=false;
const clone=x=>x===undefined?undefined:structuredClone(x);
class FakeDB {
  constructor(name,entry){this.name=name;this.entry=entry;this.version=entry.version;this.objectStoreNames={contains:n=>entry.names.includes(n),add:n=>{if(!entry.names.includes(n))entry.names.push(n);}};}
  createObjectStore(n){this.objectStoreNames.add(n);if(!this.entry.stores.has(n))this.entry.stores.set(n,new Map());return {};}
  transaction(names){if(typeof names==='string')names=[names];const db=this;const snapshots=new Map(names.map(n=>[n,new Map([...db.entry.stores.get(n)||[]].map(([k,v])=>[k,clone(v)]))]));let pending=0,finalizeQueued=false;
    const tx={error:null,aborted:false,stores:new Map(),objectStore(name){if(!snapshots.has(name))throw Error('NotInTransaction');if(this.stores.has(name))return this.stores.get(name);const view={
      get(key){const req={result:undefined,onsuccess:null,onerror:null};pending++;setTimeout(()=>{if(!tx.aborted){req.result=clone(snapshots.get(name).get(key));req.onsuccess?.({target:req});}pending--;scheduleFinish();},0);return req;},
      put(value,key){if(tx.aborted)return;if(failNextWrite){failNextWrite=false;tx.error=Object.assign(new Error('QuotaExceededError'),{name:'QuotaExceededError'});tx.abort();return;}snapshots.get(name).set(key,clone(value));return {};}
    };this.stores.set(name,view);return view;},
    abort(){if(this.aborted)return;this.aborted=true;setTimeout(()=>this.onabort?.({target:this}),0);}};
    function scheduleFinish(){if(tx.aborted||pending||finalizeQueued)return;finalizeQueued=true;setTimeout(()=>{finalizeQueued=false;if(tx.aborted||pending)return;for(const [n,map] of snapshots)db.entry.stores.set(n,map);tx.oncomplete?.({target:tx});},0);}
    return tx;
  }
  close(){}
}
global.indexedDB={open(name,version){const req={result:null,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};setTimeout(()=>{let e=databases.get(name);const fresh=!e;if(!e){e={version:0,names:[],stores:new Map()};databases.set(name,e);}if(version<e.version){req.error=Error('VersionError');req.onerror?.({target:req});return;}const db=new FakeDB(name,e);req.result=db;if(fresh||version>e.version){e.version=version;req.onupgradeneeded?.({target:req});}setTimeout(()=>req.onsuccess?.({target:req}),0);},0);return req;}};
const picture={version:1,ops:[{tool:'stamp',shape:'flower',color:'#f06a99',x:.5,y:.5,size:.2}]};
(async()=>{
 let count=0;const check=async(name,fn)=>{await fn();count++;console.log('PASS',name);};
 await check('Repeated request receipt is idempotent and keeps stable revision/value',async()=>{
  const p=new Profile('clubhouse-test-receipt');await p.open();
  const args={id:'art_a',expectedRevision:0,picture};
  const first=await p.run('clubhouse-draft',args,'draft-receipt');const rev=first.profile.revision;
  const duplicate=await p.run('clubhouse-draft',args,'draft-receipt');
  assert.equal(first.ok,true);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.profile.revision,rev);assert.deepEqual(duplicate.value,first.value);
  const again=await p.run('clubhouse-finish',{id:'art_a',expectedRevision:1},'finish-receipt');assert.equal(again.profile.clubhouse.carried,'art_a');
  const duplicateFinish=await p.run('clubhouse-finish',{id:'art_a',expectedRevision:1},'finish-receipt');assert.equal(duplicateFinish.duplicate,true);assert.equal(duplicateFinish.profile.revision,again.profile.revision);
  assert.deepEqual(await p.getMedia('clubhouse:art:art_a'),K.cleanPicture(picture));p.close();
 });
 await check('Keep-copy request receipt preserves the competing draft and pre-existing library',async()=>{
  const p=new Profile('clubhouse-test-keep-copy');await p.open();
  const work={id:'draft_work',expectedRevision:0,picture};await p.run('clubhouse-draft',work,'draft-work-receipt');
  const before=structuredClone(p.value.clubhouse.draft);const args={id:'recovery_copy',picture};
  const first=await p.run('clubhouse-keep-copy',args,'keep-copy-receipt');const revision=first.profile.revision;
  assert.deepEqual(first.profile.clubhouse.draft,before);assert.equal(first.profile.clubhouse.artworks.recovery_copy.id,'recovery_copy');
  const duplicate=await p.run('clubhouse-keep-copy',args,'keep-copy-receipt');assert.equal(duplicate.duplicate,true);assert.equal(duplicate.profile.revision,revision);
  assert.deepEqual(duplicate.profile.clubhouse.draft,before);assert.deepEqual(await p.getMedia('clubhouse:art:recovery_copy'),K.cleanPicture(picture));p.close();
 });
 await check('Aborted media/state write on simulated quota failure leaves stored profile unchanged',async()=>{
  const p=new Profile('clubhouse-test-quota');await p.open();const before=structuredClone(p.value);failNextWrite=true;
  await assert.rejects(p.run('clubhouse-draft',{id:'quota_art',expectedRevision:0,picture},'quota-receipt'),e=>e?.name==='QuotaExceededError');
  await p.refresh();assert.deepEqual(p.value,before);assert.equal(await p.getMedia('clubhouse:draft:quota_art'),null);p.close();
 });
 console.log(`${count} clubhouse transaction checks passed`);
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
