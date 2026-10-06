/* Child-side outbox. Original native save payloads/keys stay authoritative. */
(function(root){'use strict';const uuid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),query=new URLSearchParams(location.search),origin=query.get('worldOrigin');
function trusted(){try{const u=new URL(origin);return query.get('hub')==='1'&&parent!==window&&u.origin===origin&&(origin===location.origin||(['localhost','127.0.0.1'].includes(u.hostname)&&['localhost','127.0.0.1'].includes(location.hostname)));}catch(_){return false;}}
class Link{
 constructor({game,key,snapshot,restore,onProfile,onReady}){
  this.game=game;this.key=key;this.snapshot=snapshot;this.restore=restore;this.onProfile=onProfile;this.onReady=onReady;this.profile=null;this.storageOK=true;this.store='unicorn-world-'+game+'-bridge-v1';this.requests=new Map();this.sent=new Map();
  try{this.state=JSON.parse(localStorage.getItem(this.store)||'null')||{version:1,source:uuid(),generation:uuid(),outbox:[],importQueued:false,run:null};
   if(this.state.pendingNative){localStorage.setItem(key,JSON.stringify(this.state.pendingNative));restore(this.state.pendingNative);delete this.state.pendingNative;this.persist();}
  }catch(_){this.state={version:1,source:uuid(),generation:uuid(),outbox:[],importQueued:false,run:null};this.storageOK=false;}
  this.handler=e=>{if(e.source!==parent||e.origin!==origin||e.data?.type!=='UNICORN_PROFILE')return;
   if(e.data.command==='snapshot'){this.profile=e.data.profile;onProfile?.(this.profile);onReady?.();this.flush();}
   if(e.data.command==='receipt'){const i=this.state.outbox.findIndex(q=>q.id===e.data.id);if(i>=0){this.state.outbox.splice(i,1);this.persist();}this.sent.delete(e.data.id);this.requests.get(e.data.id)?.(e.data);this.requests.delete(e.data.id);}
  };addEventListener('message',this.handler);this.timer=setInterval(()=>this.flush(),1500);
  this.send({command:'connect'});addEventListener('pagehide',()=>this.saveNative(this.snapshot()));
 }
 send(data){parent.postMessage({type:'UNICORN_PROFILE',...data},origin);}
 persist(){try{localStorage.setItem(this.store,JSON.stringify(this.state));this.storageOK=true;return true;}catch(_){this.storageOK=false;return false;}}
 saveNative(snapshot){try{this.state.pendingNative=snapshot;if(!this.persist())return false;localStorage.setItem(this.key,JSON.stringify(snapshot));delete this.state.pendingNative;return this.persist();}catch(_){this.storageOK=false;return false;}}
 queue(e,snapshot=this.snapshot()){
  if(!this.state.outbox.some(x=>x.id===e.id))this.state.outbox.push(e);
  if(this.saveNative(snapshot))this.flush();
 }
 flush(){if(!this.profile||!this.storageOK)return;for(const event of this.state.outbox){const now=Date.now();if(now-(this.sent.get(event.id)||0)<1000)continue;this.sent.set(event.id,now);if(event.request)this.send({command:'request',id:event.id,action:event.request,args:event.args});else this.send({command:'earn',event});}}
 request(action,args={},id=uuid()){
  if(!['buy','equip'].includes(action))return Promise.reject(Error('invalid'));
  if(!this.state.outbox.some(e=>e.id===id))this.state.outbox.push({id,request:action,args});
  if(!this.persist()){this.state.outbox=this.state.outbox.filter(e=>e.id!==id);return Promise.resolve({id,ok:false,error:'storage'});}
  const result=new Promise(resolve=>this.requests.set(id,resolve));this.flush();return result;
 }
 cafeConnect(coins){if(!this.state.importQueued){this.state.importQueued=true;this.queue({id:'import:cafe',kind:'import',coins});}}
 payment(id,snapshot){this.queue({id:'cafe:'+this.state.source+':'+this.state.generation+':'+id,kind:'payment'},snapshot);}
 reset(snapshot){this.state.generation=uuid();this.saveNative(snapshot);}
 startRun(){this.state.run=uuid();this.persist();}
 win(level,snapshot){if(!this.state.run)this.startRun();this.queue({id:'adventure:'+this.state.source+':'+this.state.run,kind:'win',level},snapshot);}
 costumes(secrets){
  const event={id:'costumes:'+this.state.source+':'+secrets,kind:'costumes',secrets};
  if(!this.state.outbox.some(x=>x.id===event.id))this.state.outbox.push(event);
  // Reporting an existing unlock must not rewrite or normalize a native save.
  if(this.persist())this.flush();
 }
}
root.UWBridge={trusted,origin,Link};
})(window);
