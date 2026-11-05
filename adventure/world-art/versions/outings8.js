/* Versioned optional native outing persistence. No rewards or storage side effects here. */
(function(root){'use strict';
const GEOMETRY=8,SCHEMA=1; // Native wall-junction revision; older active geometry enters explicit recovery.
function rng(seed){let x=seed>>>0||0x9e3779b9;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function variant(scene,seed,catalogue){const r=rng(seed),slots=shuffle(scene.items.map(it=>[it.x,it.y]),r),secret=scene.items.find(it=>it.secret),pool=[...new Map(catalogue.filter(l=>l.place===scene.place&&!l.police).flatMap(l=>l.items).map(it=>[it.id,it])).values()];
 if(!scene.police){const max=scene.items.length,min=Math.max(3,max-3),n=Math.min(max,min+Math.floor(r()*(max-min+1))),picked=shuffle(pool.filter(it=>it.id!==secret?.id),r).slice(0,Math.max(0,n-(secret?1:0)));if(secret)picked.push(secret);scene.items=shuffle(picked,r).map((it,i)=>({...it,x:slots[i][0],y:slots[i][1],z:0,secret:it.id===secret?.id}));scene.required=scene.items.length;}
 const usedStarts=new Set();for(const e of scene.enemies){let route=e.route.map(p=>p.slice());if(r()<.5)route.reverse();const choices=shuffle(route.map((_,i)=>i),r),k=choices.find(i=>!usedStarts.has(route[i].join(',')))??choices[0];usedStarts.add(route[k].join(','));route=route.slice(k).concat(route.slice(0,k));e.route=route;e.x=route[0][0];e.y=route[0][1];}
 return scene;}
const clone=x=>JSON.parse(JSON.stringify(x));
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function clean(x,depth=0){if(depth>20)return false;if(x===null)return true;if(typeof x==='number')return Number.isFinite(x);if(typeof x==='string')return x.length<=1000;if(typeof x==='boolean')return true;if(Array.isArray(x))return x.length<=2500&&x.every(v=>clean(v,depth+1));if(typeof x==='object')return Object.keys(x).length<=150&&Object.entries(x).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&clean(v,depth+1));return false;}
function validate(run,scene,tier=null){if(!run||run.schema!==SCHEMA||run.geometry!==GEOMETRY||run.levelId!==scene.id||!Number.isInteger(run.seed)||run.seed<0||run.seed>0xffffffff||typeof run.runId!=='string'||run.runId.length>120||!['active','won'].includes(run.phase))return'Unsupported or damaged outing header';
 if(JSON.stringify(run).length>250000||!clean(run))return'Outing data is too large or damaged';const s=run.state;if(!record(s)||!record(s.player)||!record(s.game)||!Array.isArray(s.items)||!Array.isArray(s.enemies))return'Missing outing state';
 if(!s.items.every(record)||!s.enemies.every(record)||!Array.isArray(s.game.followers)||!s.game.followers.every(record))return'Outing state contains damaged entries';
 if(s.items.length!==scene.items.length||s.items.some((it,i)=>['id','name','x','y','z','secret'].some(k=>it[k]!==scene.items[i][k])||!['floor','carried','delivered'].includes(it.status)))return'Outing item list does not match its seed';
 if(s.enemies.length!==scene.enemies.length||s.enemies.some((e,i)=>e.id!==scene.enemies[i].id||!['PATROL','JAILED','WAIT_BOSS','CHASE','CURIOUS','SEARCH'].includes(e.state)||!Number.isInteger(e.hits)||e.hits<0||e.hits>e.hitsNeeded))return'Outing opponent state is damaged';
 if(s.enemies.some((e,i)=>Object.entries(scene.enemies[i]).some(([k,v])=>!['x','y','angle','hitsNeeded'].includes(k)&&JSON.stringify(e[k])!==JSON.stringify(v))||!Number.isFinite(e.angle)||(tier&&e.hitsNeeded!==tier(scene.enemies[i]))||e.x<0||e.y<0||e.x>scene.w||e.y>scene.h))return'Outing opponent rules or route changed';
 if(!['play','pause','reset','win','retry'].includes(s.game.mode))return'Outing phase is damaged';
 if(run.phase==='won'&&(scene.police?!s.enemies.every(e=>e.state==='JAILED'):!s.items.every(it=>it.status==='delivered')))return'Completed outing has unfinished goals';
 const pt=s.player;if(!Number.isFinite(pt.x)||!Number.isFinite(pt.y)||pt.x<0||pt.y<0||pt.x>scene.w||pt.y>scene.h)return'Outing position is outside this map';
 const carried=s.items.filter(it=>it.status==='carried'),followers=s.game.followers||[];if(carried.length>1+followers.length||followers.length>2)return'Outing carrying state is damaged';const ids=new Set(carried.map(it=>it.id));if(pt.carry&&!ids.has(pt.carry))return'Carried treasure is missing';for(const f of followers)if(f.carry&&!ids.has(f.carry))return'Follower treasure is missing';const carrierIds=[pt.carry,...followers.map(f=>f.carry)].filter(Boolean);if(new Set(carrierIds).size!==carrierIds.length||carrierIds.length!==carried.length)return'Carrying slots do not match treasure state';
 if(s.game.inSecretRoom&&![0,1].includes(s.game.activeSecretRoom))return'Secret-room identity is damaged';return null;}
const transient=new Set(['fx','texts','rings','ribbon','hudStamp']);
function capture(P,G,items,enemies){const game={};for(const[k,v]of Object.entries(G))if(!transient.has(k)&&v!==undefined)game[k]=v;return clone({player:P,game,items,enemies});}
function restore(state,P,G,items,enemies){for(const k of Object.keys(P))if(Object.prototype.hasOwnProperty.call(state.player,k))P[k]=clone(state.player[k]);for(const k of Object.keys(G))if(!transient.has(k)&&Object.prototype.hasOwnProperty.call(state.game,k))G[k]=clone(state.game[k]);return{items:clone(state.items),enemies:clone(state.enemies)};}
root.UnicornOutings8=Object.freeze({SCHEMA,GEOMETRY,rng,variant,validate,capture,restore,clone});if(typeof module!=='undefined')module.exports=root.UnicornOutings8;
})(typeof window!=='undefined'?window:globalThis);
