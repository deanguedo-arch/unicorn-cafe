/* One transactional world profile. IndexedDB receipts make retries harmless. */
(function(root){'use strict';const C=root.UWCatalog||require('./catalogue.js'),B=root.UWPlaybook||require('./playbook.js');
const copy=o=>JSON.parse(JSON.stringify(o)),uuid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
class WorldError extends Error{constructor(code){super(code);this.code=code;}}
function fresh(){return B.normalize({version:1,id:uuid(),revision:0,coins:0,owned:[...C.starters],outfit:{head:'bow',body:'tee',accessory:'beads'},outfits:[null,null,null],wishlist:null,vehicle:null,stamps:0,prize:C.prizes[0],sessions:{},photos:[],settings:{muted:false,reduced:false}});}
const fail=c=>{throw new WorldError(c);};
function owned(p,id){return p.owned.includes(id);}
function grant(p,id){if(C.byId[id]&&!owned(p,id))p.owned.push(id);}
function findSession(p,id){return Object.values(p.sessions).find(s=>s.id===id);}
function validateSession(s,state){if(!state||typeof state!=='object')fail('invalid');
 if(s.game==='jigsaw'){const placed=state.placed;if(!Array.isArray(placed)||placed.some(n=>!Number.isInteger(n)||n<0||n>=s.pieces))fail('invalid');return{placed:[...new Set(placed)],guide:!!state.guide};}
 if(s.game==='catcher'){return{elapsed:Math.max(0,Math.min(30,Number(state.elapsed)||0)),basket:Math.max(0,Math.min(1,Number(state.basket)||.5)),caught:[...new Set((state.caught||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<20))]};}
 if(s.game==='bowling'){return{throws:Math.max(0,Math.min(3,Math.floor(Number(state.throws)||0))),score:Math.max(0,Math.min(30,Math.floor(Number(state.score)||0))),aim:Math.max(-1,Math.min(1,Number(state.aim)||0))};}fail('invalid');}
function apply(p,action,a={}){
 B.normalize(p);const captured=Object.prototype.hasOwnProperty.call(a,'context')?a.context:B.context(p),outfitActivity=()=>{if(Object.values(p.outfit).some(Boolean))B.activity(p,{kind:'outfit',context:captured});};
 switch(action){
 case'earn':{
  const e=a.event;if(!e||!e.id||typeof e.id!=='string'||e.id.length>240)fail('invalid');let amount=0;
  if(a.game==='cafe'&&e.kind==='import')amount=Math.max(0,Math.min(10000000,Math.floor(Number(e.coins)||0)));
  else if(a.game==='cafe'&&e.kind==='payment')amount=1;
  else if(a.game==='adventure'&&e.kind==='win')amount=3;
  else if(a.game==='adventure'&&e.kind==='costumes'){
   grant(p,'legacy-princess');const n=Math.max(0,Math.floor(Number(e.secrets)||0));
   if(n>=1){grant(p,'legacy-hero');grant(p,'legacy-mask');}if(n>=2)grant(p,'legacy-chef');if(n>=3)grant(p,'legacy-space');
  }else fail('invalid');p.coins+=amount;if(a.game==='cafe'&&e.kind==='payment')B.activity(p,{...e,kind:'cafe-payment'});return{amount};}
 case'hire':{const {scope,worker}=a;if(typeof scope!=='string'||scope.length>200||!/^cafe-hire:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+:[0-9]+:(morning|afternoon)$/.test(scope)||!['pink','blue'].includes(worker))fail('invalid');
  p.cafeHires=p.cafeHires||{};const key=scope+':'+worker;if(p.cafeHires[key])return{key,alreadyHired:true};if(p.coins<1)fail('coins');p.coins--;p.cafeHires[key]={scope,worker};return{key,alreadyHired:false};}
 case'buy':{
  const i=C.byId[a.item];if(!i||i.price===null)fail('invalid');const alreadyOwned=owned(p,i.id);if(!alreadyOwned){if(p.coins<i.price)fail('coins');p.coins-=i.price;grant(p,i.id);}
  if(a.equip){if(i.ride)p.vehicle=i.id;else{p.outfit[i.slot]=i.id;outfitActivity();}}if(p.wishlist===i.id)p.wishlist=null;return{item:i.id,alreadyOwned};}
 case'equip':{
  const i=C.byId[a.item];if(a.item===null){if(!C.slots.includes(a.slot))fail('invalid');p.outfit[a.slot]=null;return;}
  if(!i||!owned(p,i.id))fail('owned');if(i.ride)p.vehicle=i.id;else{p.outfit[i.slot]=i.id;outfitActivity();}return;}
 case'outfit':{const o=C.cleanOutfit(a.outfit,p.owned);for(const id of Object.values(a.outfit||{}))if(id&&!owned(p,id))fail('owned');p.outfit=o;outfitActivity();return;}
 case'save-outfit':{if(!Number.isInteger(a.slot)||a.slot<0||a.slot>2)fail('invalid');if(a.outfit){for(const id of Object.values(a.outfit))if(id&&!owned(p,id))fail('owned');p.outfit=C.cleanOutfit(a.outfit,p.owned);}p.outfits[a.slot]=copy(p.outfit);outfitActivity();return;}
 case'wear-outfit':{const o=p.outfits[a.slot];if(!o)fail('missing');p.outfit=C.cleanOutfit(o,p.owned);outfitActivity();return;}
 case'wishlist':{if(a.item!==null&&(!C.byId[a.item]||C.byId[a.item].price===null))fail('invalid');p.wishlist=a.item;return;}
 case'park':p.vehicle=null;return;
 case'prize':if(!C.prizes.includes(a.item)||owned(p,a.item))fail('invalid');p.prize=a.item;return;
 case'settings':p.settings={muted:!!a.muted,reduced:!!a.reduced};return;
 case'photo':{if(typeof a.image!=='string'||!a.image.startsWith('data:image/png;base64,')||a.image.length>1800000)fail('invalid');const photo={id:uuid(),image:a.image,outfit:copy(p.outfit),at:Date.now()};p.photos.unshift(photo);p.photos=p.photos.slice(0,24);B.activity(p,{kind:'photo',photo:photo.id,context:captured});return{photo:photo.id};}
 case'select-adventure':if(!B.byId[a.book]||(a.replay!==undefined&&typeof a.replay!=='boolean'))fail('invalid');return B.select(p,a.book,!!a.replay);
 case'record-activity':{const e=a.event;if(!e||typeof e.id!=='string'||!e.id||e.id.length>240||!['park-visit','picnic','home-return','sport-shot','sport-finished','sport-best'].includes(e.kind))fail('invalid');if(e.context!==null&&e.context!==undefined&&(!B.byId[e.context.book]||typeof e.context.run!=='string'))fail('invalid');if(e.kind.startsWith('sport-')&&(!['basketball','tennis','volleyball'].includes(e.sport)||(e.kind==='sport-shot'&&e.sport!=='basketball')||(e.kind==='sport-finished'&&e.sport==='basketball')))fail('invalid');return B.activity(p,e);}
 case'place-decoration':{if(!B.decorationById[a.item]||!p.decor.owned.includes(a.item))fail('owned');if(a.remove===true){delete p.decor.placements[a.item];return{item:a.item,removed:true};}const spot=B.snap(a.x,a.y);if(!spot||Object.entries(p.decor.placements).some(([id,v])=>id!==a.item&&v.x===spot.x&&v.y===spot.y))fail('placement');p.decor.placements[a.item]=spot;return{item:a.item,...spot};}
 case'pin-scrapbook-photo':{if(typeof a.photo!=='string')fail('invalid');const id='photo:'+a.photo,existing=p.scrapbook.entries[id];if(existing)return{entry:copy(existing)};const photo=p.photos.find(x=>x.id===a.photo);if(!photo)fail('missing');const entry={id,type:'photo',photo:photo.id,media:id,outfit:copy(photo.outfit),at:photo.at};p.scrapbook.entries[id]=entry;return{entry:copy(entry)};}
 case'place-memory':{if(!p.scrapbook.entries[a.entry])fail('missing');if(a.slot!==null&&(!Number.isInteger(a.page)||a.page<0||a.page>=6||!Number.isInteger(a.slot)||a.slot<0||a.slot>=4))fail('invalid');for(const page of p.scrapbook.pages)for(let j=0;j<4;j++)if(page[j]===a.entry)page[j]=null;if(a.slot!==null)p.scrapbook.pages[a.page][a.slot]=a.entry;return;}
 case'display-home-photo':{const entry=p.scrapbook.entries[a.entry];if(!entry||entry.type!=='photo')fail('missing');p.scrapbook.homePhoto=entry.id;B.activity(p,{kind:'display',photo:entry.photo,context:captured});return{entry:copy(entry)};}
 case'start':{
  if(!['catcher','bowling','jigsaw'].includes(a.game))fail('invalid');
  if(a.game==='jigsaw'&&(!C.puzzles.some(q=>q.id===a.puzzle)||![4,9,16].includes(a.pieces)))fail('invalid');
  const key=a.game==='jigsaw'?a.puzzle+':'+a.pieces:a.game,old=p.sessions[key];
  if(old&&old.status==='play')return{session:copy(old),resumed:true};if(p.coins<1)fail('coins');p.coins--;
  const s={id:uuid(),key,game:a.game,puzzle:a.puzzle||null,pieces:a.pieces||null,status:'play',started:Date.now(),state:a.game==='jigsaw'?{placed:[],guide:true}:a.game==='catcher'?{elapsed:0,basket:.5,caught:[]}:{throws:0,score:0,aim:0}};p.sessions[key]=s;return{session:copy(s),resumed:false};}
 case'progress':{
  const s=findSession(p,a.session);if(!s||s.status!=='play')fail('missing');const next=validateSession(s,a.state);
  // Do not let a stale tab or delayed save undo a more advanced round.
  if(s.game==='jigsaw')next.placed=[...new Set([...s.state.placed,...next.placed])];
  if(s.game==='catcher'){next.elapsed=Math.max(s.state.elapsed,next.elapsed);next.caught=[...new Set([...s.state.caught,...next.caught])];}
  if(s.game==='bowling'&&next.throws<s.state.throws)return{session:copy(s)};
  s.state=next;return{session:copy(s)};}
 case'finish':{
  const s=findSession(p,a.session);if(!s)fail('missing');if(s.status==='done')return{session:copy(s),alreadyDone:true};
  if(a.state)s.state=validateSession(s,a.state);let amount=0,score=0;
  if(s.game==='jigsaw'){if(s.state.placed.length!==s.pieces)fail('unfinished');amount=1;score=s.pieces;}
  if(s.game==='catcher'){if(s.state.elapsed<30)fail('unfinished');score=s.state.caught.length;amount=score>=15?2:score>=8?1:0;}
  if(s.game==='bowling'){if(s.state.throws!==3)fail('unfinished');score=s.state.score;amount=score>=20?2:score>=10?1:0;}
  s.status='done';s.result={coins:amount,score};B.best(p,s.game,score,0);p.coins+=amount;p.stamps++;let prize=null;
  if(p.stamps>=5&&p.prize&&!owned(p,p.prize)){prize=p.prize;grant(p,prize);p.stamps-=5;p.prize=C.prizes.find(id=>!owned(p,id))||null;}
  return{session:copy(s),amount,prize};}
 default:fail('invalid');
 }
}
class Profile{
 constructor(name='unicorn-world-profile-v1'){this.name=name;this.db=null;this.value=fresh();this.listeners=new Set();this.available=false;this.channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(name):null;this.channel?.addEventListener('message',()=>this.refresh());}
 async open(){this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open(this.name,2);r.onupgradeneeded=()=>{for(const name of ['state','receipts','media'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new WorldError('storage'));});this.db.onversionchange=()=>{this.available=false;this.db?.close();};this.available=true;return this.run('init',{},'init');}
 onChange(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 publish(p){B.normalize(p);if(p.revision<this.value.revision)return;this.value=p;for(const fn of this.listeners)fn(copy(p));}
 async refresh(){if(!this.db)return;const p=await new Promise((resolve,reject)=>{const r=this.db.transaction('state').objectStore('state').get('profile');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(p)this.publish(p);}
 async run(action,args={},id=uuid()){
  if(!this.db)throw new WorldError('storage');
  args={...args};if(!Object.prototype.hasOwnProperty.call(args,'context'))args.context=B.context(this.value);
  if(action==='record-activity'&&args.event?.id)id='activity:'+args.event.id;
  const result=await new Promise((resolve,reject)=>{
   const tx=this.db.transaction(['state','receipts','media'],'readwrite'),state=tx.objectStore('state'),receipts=tx.objectStore('receipts');let result=null,error=null;
   const req=state.get('profile');req.onsuccess=()=>{const p=req.result||fresh(),before=JSON.stringify(p);B.normalize(p);const normalized=JSON.stringify(p)!==before,seen=receipts.get(id);
    seen.onsuccess=()=>{try{
     if(seen.result){if(normalized){p.revision++;state.put(p,'profile');}result={ok:true,duplicate:true,profile:p,value:seen.result.value};return;}
     const value=action==='init'?null:apply(p,action,args);if(action==='pin-scrapbook-photo'){const photo=p.photos.find(x=>x.id===args.photo);if(photo)tx.objectStore('media').put(photo.image,value.entry.media);}p.revision++;state.put(p,'profile');receipts.put({at:Date.now(),action,value},id);result={ok:true,profile:p,value};
    }catch(e){error=e;tx.abort();}};};
   tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||tx.error||new WorldError('storage'));tx.onerror=()=>{};
  });this.publish(result.profile);this.channel?.postMessage({revision:result.profile.revision});return result;
 }
 async getMedia(id){if(!this.db)throw new WorldError('storage');return new Promise((resolve,reject)=>{const r=this.db.transaction('media').objectStore('media').get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
 public(){const{photos,sessions,scrapbook,...p}=this.value;const result=copy(p);for(const book of Object.values(result.playbook.books))delete book.photoIds;return result;}
 close(){this.channel?.close();this.db?.close();}
}
root.UWProfile={Profile,fresh,apply,WorldError,uuid};if(typeof module!=='undefined')module.exports=root.UWProfile;
})(typeof window!=='undefined'?window:globalThis);
