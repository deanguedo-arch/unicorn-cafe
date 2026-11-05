/* Authoring candidate only. Pure reaction descriptions; no timers, storage, rewards or runtime wiring. */
(function(root){'use strict';
const TYPES=Object.freeze(['pink','blue','human','worker','manager']);
const PERSONALITY=Object.freeze({
 pink:{arrival:'wave',served:'garnish-delight',picture:'sprinkle',motion:'small-bounce',surprise:'point-at-garnish'},
 blue:{arrival:'small-wave',served:'warm-heart',picture:'heart',motion:'gentle-nod',surprise:'two-person-cheer'},
 human:{arrival:'wave',served:'stack-count',picture:'pancake',motion:'count-gesture',surprise:'napkin-doodle'},
 worker:{arrival:'two-beat-greeting',served:'happy-rhythm',picture:'coffee',motion:'two-beat-tap',surprise:'friendly-salute'},
 manager:{arrival:'wave',served:'garden-delight',picture:'leaf',motion:'gentle-nod',surprise:'notice-garnish'}
});
function hash(text){let n=2166136261;for(const c of String(text)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
function key(s){return typeof s==='string'&&s.length>0&&s.length<=160?s:null;}
function reaction(input){
 if(!input||!TYPES.includes(input.type)||!['arrival','item-served','party-served'].includes(input.event))return null;
 const party=key(input.partyId),member=key(input.memberId);if(!party||!member)return null;
 const item=input.event==='item-served'?key(input.itemId):'-';if(!item)return null;
 if(!Number.isSafeInteger(input.visit)||input.visit<1||!Number.isInteger(input.seed)||input.seed<0||input.seed>4294967295)return null;
 const id=['guest-reaction-v1',party,member,input.event,item].map(encodeURIComponent).join(':');
 if(Array.isArray(input.shown)&&input.shown.includes(id))return null;
 const p=PERSONALITY[input.type],familiar=input.visit>=2;
 // Surprises are cosmetic, seeded per visit, and never request an ingredient or give an item.
 const surprise=input.event==='party-served'&&input.visit>=3&&hash(input.seed+'|'+input.type+'|'+input.visit)%3===0;
 let pose=input.event==='arrival'?p.arrival:input.event==='item-served'?p.served:'thank-you';
 if(surprise)pose=p.surprise;
 if(pose==='two-person-cheer'&&input.partySize!==2)pose='warm-heart';
 // A food reaction refers only to the concrete just-served dish; no locked food request.
 const food=input.event==='item-served'&&key(input.dish)&&key(input.variant)?{dish:input.dish,variant:input.variant}:null;
 return Object.freeze({version:1,id,type:input.type,event:input.event,familiar,surprise,
   pose,picture:input.event==='arrival'?'hello':p.picture,food,
   motion:input.reducedMotion?'none':input.event==='arrival'?'small-wave':p.motion,
   durationMs:input.reducedMotion?1600:surprise?2200:1400,
   audio:input.muted||input.type!=='worker'?null:'soft-two-beat',
   layer:'guest-reaction',anchor:'above-head',maxWidthNative:24,maxHeightNative:20,
   blocksInput:false,changesOrder:false,changesPayment:false,grantsReward:false,
   textKey:input.event==='arrival'?(familiar?'familiar-hello':'hello'):'thank-you'});
}
function sample(r,t){if(!r||!Number.isFinite(t))return null;const phase=Math.max(0,Math.min(1,t/r.durationMs));
 const lift=r.motion==='none'?0:r.motion==='small-bounce'?-Math.sin(Math.PI*phase)*3:r.motion==='two-beat-tap'?Math.sin(Math.PI*4*phase):0;
 return{visible:t>=0&&t<r.durationMs,offsetNativeY:Math.round(lift),picture:r.picture,pose:r.pose,phase};}
const api=Object.freeze({TYPES,PERSONALITY,reaction,sample});root.UWGuestReactions=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
