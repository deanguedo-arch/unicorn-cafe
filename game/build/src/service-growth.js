/* Pure candidate. Callers must durably commit returned state BEFORE displaying success or sending outbox. */
(function(root){'use strict';
const DEFAULT_POLICY=Object.freeze({version:1,boundary:'full-service',offerSize:3});
const clone=x=>JSON.parse(JSON.stringify(x));const str=x=>typeof x==='string'&&x.length>0&&x.length<=180;
function hash(s){let n=2166136261;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
function create({baselineServiceId,connected=false}){if(!str(baselineServiceId))throw Error('A forward-only baseline is required');return{version:1,policy:{...DEFAULT_POLICY},baselineServiceId,connected:!!connected,completed:[],offers:[],ownedDesigns:[],pendingDeliveries:[],receipts:[]};}
function catalogue(items){if(!Array.isArray(items))throw Error('Catalogue required');const seen=new Set();for(const i of items){if(!i||!str(i.id)||seen.has(i.id)||!['cafe','home'].includes(i.target)||i.ready!==true)throw Error('Invalid, duplicate or unready catalogue entry');seen.add(i.id);}return items;}
function validate(s){if(!s||s.version!==1||s.policy?.boundary!=='full-service'||s.policy.offerSize!==3||!str(s.baselineServiceId)||!['completed','offers','ownedDesigns','pendingDeliveries','receipts'].every(k=>Array.isArray(s[k])))throw Error('Unsupported growth state');}
function complete(state,event,items){validate(state);catalogue(items);if(!event||!str(event.serviceId)||event.fullServiceClear!==true)return{changed:false,state};
 if(event.serviceId===state.baselineServiceId||state.completed.includes(event.serviceId))return{changed:false,state};
 const s=clone(state),id='service-growth-v1:'+event.serviceId;s.completed.push(event.serviceId);
 const reserved=new Set([...s.ownedDesigns,...s.pendingDeliveries.map(x=>x.designId),...s.offers.filter(x=>!x.claim).flatMap(x=>x.choices)]);
 const eligible=items.filter(x=>(s.connected||x.target==='cafe')&&!reserved.has(x.id));
 eligible.sort((a,b)=>hash(id+'|'+a.id)-hash(id+'|'+b.id)||a.id.localeCompare(b.id));
 const choices=eligible.slice(0,s.policy.offerSize).map(x=>x.id);
 s.offers.push({id,serviceId:event.serviceId,policy:clone(s.policy),choices,claim:null,status:choices.length?'offered':s.offers.some(x=>x.status==='offered')?'choices-pending':'collection-complete'});
 return{changed:true,state:s,offerId:id};}
function claim(state,offerId,designId,items){validate(state);catalogue(items);const offer=state.offers.find(x=>x.id===offerId);if(!offer||!offer.choices.includes(designId))return{ok:false,reason:'Not offered',state};
 if(offer.claim)return{ok:offer.claim===designId,changed:false,reason:offer.claim===designId?'Already claimed':'Choice already made',state};
 const design=items.find(x=>x.id===designId);if(!design||(!state.connected&&design.target==='home'))return{ok:false,reason:'Unavailable destination',state};
 const s=clone(state),o=s.offers.find(x=>x.id===offerId),id=offerId+':claim';o.claim=designId;o.status=design.target==='home'?'delivery-pending':'claimed';
 s.receipts.push({id,designId,target:design.target});if(design.target==='cafe'){if(!s.ownedDesigns.includes(designId))s.ownedDesigns.push(designId);}else s.pendingDeliveries.push({id,designId,status:'pending'});
 return{ok:true,changed:true,state:s,outbox:design.target==='home'?{id,kind:'home-design-unlock',designId}:null};}
function acknowledge(state,receiptId,designId){validate(state);const entry=state.pendingDeliveries.find(x=>x.id===receiptId&&x.designId===designId);if(!entry)return{changed:false,state};const s=clone(state);s.pendingDeliveries=s.pendingDeliveries.filter(x=>x.id!==receiptId);if(!s.ownedDesigns.includes(designId))s.ownedDesigns.push(designId);const o=s.offers.find(x=>x.id+':claim'===receiptId);if(o)o.status='claimed';return{changed:true,state:s};}
const api=Object.freeze({DEFAULT_POLICY,create,complete,claim,acknowledge});root.UWServiceGrowth=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
