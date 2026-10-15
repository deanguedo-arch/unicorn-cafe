/* Durable hub/sports facts, separate from native saves and reward journals. */
(function(root){'use strict';const B=root.UWPlaybook||(typeof require==='function'?require('./playbook.js'):null),uuid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),clone=o=>o==null?null:JSON.parse(JSON.stringify(o));
class Queue{
 constructor({service,key='unicorn-world-activities-v1',onError=()=>{}}){this.service=service;this.key=key;this.onError=onError;this.events=[];this.pending=null;this.closed=false;this.storageOK=true;
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){if(!Array.isArray(saved.events))throw Error('storage');this.events=saved.events;}}catch(e){this.storageOK=false;onError(e);}
  this.timer=setInterval(()=>this.flush(),1500);this.timer?.unref?.();this.flush();
 }
 persist(){try{localStorage.setItem(this.key,JSON.stringify({version:1,events:this.events}));this.storageOK=true;return true;}catch(e){this.storageOK=false;this.onError(e);return false;}}
 record(kind,details={},id=uuid(),contextOverride){const context=arguments.length>=4?contextOverride:B.context(this.service.value),event={...details,id,kind,context:clone(context)};if(!this.events.some(e=>e.id===id))this.events.push(event);if(!this.persist())return Promise.resolve({queued:false,id,error:'storage'});return this.flush().then(()=>({queued:true,id}));}
 flush(){if(this.closed)return Promise.resolve();if(this.pending)return this.pending;if(!this.events.length)return Promise.resolve();if(!this.persist())return Promise.resolve();
  this.pending=(async()=>{while(this.events.length&&!this.closed){const event=this.events[0];try{await this.service.run('record-activity',{event},'activity:'+event.id);}catch(e){this.onError(e);break;}this.events.shift();if(!this.persist())break;}})().finally(()=>{this.pending=null;});return this.pending;
 }
 close(){this.closed=true;clearInterval(this.timer);}
}
const api={Queue};root.UWActivityQueue=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
