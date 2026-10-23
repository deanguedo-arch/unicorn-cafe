/* Additive, local-only clubhouse state. Existing world/native saves remain authoritative. */
(function(root){'use strict';
const clone=o=>JSON.parse(JSON.stringify(o));
const LIMITS=Object.freeze({artworks:128,operations:256,points:512,bytes:65536});
const idOK=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&!['__proto__','prototype','constructor'].includes(id);
function fail(code){const e=new Error(code);e.code=code;throw e;}
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
function cleanPicture(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.ops)||raw.ops.length>LIMITS.operations)fail('invalid');
 if(JSON.stringify(raw).length>LIMITS.bytes)fail('capacity');
 const ops=raw.ops.map(o=>{
  if(!o||!/^#[0-9a-f]{6}$/i.test(o.color))fail('invalid');
  if(o.tool==='stamp'){
   if(!['heart','flower','rainbow'].includes(o.shape)||!number(o.x,0,1)||!number(o.y,0,1)||!number(o.size,.02,.4))fail('invalid');
   return {tool:'stamp',shape:o.shape,color:o.color.toLowerCase(),x:o.x,y:o.y,size:o.size};
  }
  if(o.tool==='brush'){
   if(!number(o.width,.002,.1)||!Array.isArray(o.points)||o.points.length<1||o.points.length>LIMITS.points||o.points.some(p=>!Array.isArray(p)||p.length!==2||!number(p[0],0,1)||!number(p[1],0,1)))fail('invalid');
   return {tool:'brush',color:o.color.toLowerCase(),width:o.width,points:o.points.map(p=>p.slice())};
  }
  fail('invalid');
 });
 return {version:1,ops};
}
function normalize(p){
 if(!p.clubhouse||typeof p.clubhouse!=='object'||Array.isArray(p.clubhouse))p.clubhouse={version:1};
 const c=p.clubhouse;
 // Unknown future versions are retained, never normalized destructively.
 if(c.version!==undefined&&c.version!==1)return p;
 c.version=1;
 if(!c.artworks||typeof c.artworks!=='object'||Array.isArray(c.artworks))c.artworks={};
 if(!c.displayed||typeof c.displayed!=='object')c.displayed={cafe:null,downstairs:null};
 if(!c.presentation||typeof c.presentation!=='object')c.presentation={carried:null,cafe:null,downstairs:null};
 if(c.draft===undefined)c.draft=null;
 if(c.carried===undefined)c.carried=null;
 if(!c.fort)c.fort={slots:[0,1,2]};
 if(!c.ball)c.ball={ramps:[0,1,2]};
 if(!c.puppets)c.puppets={friend:'pink'};
 if(!c.friends)c.friends={pink:false,blue:false};
 return p;
}
function apply(p,action,a={},loadedMedia=null){
 normalize(p);const c=p.clubhouse;if(c.version!==1)fail('invalid');
 if(action==='clubhouse-draft'){
  if(!idOK(a.id)||!Number.isInteger(a.expectedRevision)||a.expectedRevision<0)fail('invalid');
  cleanPicture(a.picture);
  if(c.artworks[a.id])fail('conflict');
  if(c.draft?(c.draft.id!==a.id||c.draft.revision!==a.expectedRevision):a.expectedRevision!==0)fail('conflict');
  if(!c.draft&&Object.keys(c.artworks).length>=LIMITS.artworks)fail('capacity');
  c.draft={id:a.id,revision:a.expectedRevision+1};return clone(c.draft);
 }
 if(action==='clubhouse-finish'){
  if(!idOK(a.id)||!Number.isInteger(a.expectedRevision))fail('invalid');
  if(!c.draft||c.draft.id!==a.id||c.draft.revision!==a.expectedRevision)fail('conflict');
  if(Object.keys(c.artworks).length>=LIMITS.artworks)fail('capacity');
  const picture=cleanPicture(loadedMedia);if(!picture.ops.length)fail('invalid');
  c.artworks[a.id]={id:a.id,at:Date.now(),media:'clubhouse:art:'+a.id};
  c.carried=a.id;c.presentation.carried={id:a.id,picture};c.draft=null;
  return {id:a.id};
 }
 if(action==='clubhouse-keep-copy'){
  if(!idOK(a.id))fail('invalid');if(c.artworks[a.id])fail('conflict');
  if(Object.keys(c.artworks).length>=LIMITS.artworks)fail('capacity');
  const picture=cleanPicture(a.picture);if(!picture.ops.length)fail('invalid');
  c.artworks[a.id]={id:a.id,at:Date.now(),media:'clubhouse:art:'+a.id};
  c.carried=a.id;c.presentation.carried={id:a.id,picture};return {id:a.id};
 }
 if(action==='clubhouse-carry'){
  if(!idOK(a.artwork)||!c.artworks[a.artwork])fail('missing');
  const picture=cleanPicture(loadedMedia);c.carried=a.artwork;c.presentation.carried={id:a.artwork,picture};return {id:a.artwork};
 }
 if(action==='clubhouse-display'){
  if(!idOK(a.artwork)||!['cafe','downstairs'].includes(a.slot)||!c.artworks[a.artwork])fail('invalid');
  if(a.expectedArtwork!==null&&!idOK(a.expectedArtwork))fail('invalid');
  const current=c.displayed[a.slot]||null;if(current!==a.expectedArtwork)fail('conflict');
  if(c.carried!==a.artwork||c.presentation.carried?.id!==a.artwork)fail('missing');
  c.displayed[a.slot]=a.artwork;c.presentation[a.slot]=clone(c.presentation.carried);c.carried=null;c.presentation.carried=null;
  return {id:a.artwork,slot:a.slot};
 }
 if(action==='clubhouse-play'){
  const s=a.state;
  if(!s||typeof s!=='object')fail('invalid');
  if(a.kind==='fort'){
   if(!Array.isArray(s.slots)||s.slots.length!==3||s.slots.some(v=>!Number.isInteger(v)||v<0||v>2)||new Set(s.slots).size!==3)fail('invalid');
   c.fort={slots:s.slots.slice()};
  }else if(a.kind==='ball'){
   if(!Array.isArray(s.ramps)||s.ramps.length!==3||s.ramps.some(v=>!Number.isInteger(v)||v<0||v>2))fail('invalid');
   c.ball={ramps:s.ramps.slice()};
  }else if(a.kind==='puppets'){
   if(!['pink','blue'].includes(s.friend))fail('invalid');c.puppets={friend:s.friend};c.friends[s.friend]=true;
  }else fail('invalid');
  return {kind:a.kind,state:clone(c[a.kind])};
 }
 fail('invalid');
}
function mediaKey(action,args){return action==='clubhouse-finish'?'clubhouse:draft:'+args.id:action==='clubhouse-carry'?'clubhouse:art:'+args.artwork:null;}
function mediaWrites(action,args,result,loaded){
 if(action==='clubhouse-draft')return [{key:'clubhouse:draft:'+result.id,value:cleanPicture(args.picture)}];
 if(action==='clubhouse-finish')return [{key:'clubhouse:art:'+result.id,value:cleanPicture(loaded)}];
 if(action==='clubhouse-keep-copy')return [{key:'clubhouse:art:'+result.id,value:cleanPicture(args.picture)}];
 return [];
}
function publicView(p){
 const c=p.clubhouse;if(!c||c.version!==1)return null;
 return clone({version:1,carried:c.presentation?.carried||null,displayed:{cafe:c.presentation?.cafe||null},friends:{pink:!!c.friends?.pink,blue:!!c.friends?.blue}});
}
const api={LIMITS,normalize,cleanPicture,apply,mediaKey,mediaWrites,publicView};root.UWClubhouseState=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
