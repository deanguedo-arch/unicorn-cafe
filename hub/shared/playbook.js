/* Picture adventures are optional; gifts never alter the coin economy. */
(function(root){'use strict';
const books=[
 {id:'picnic',name:'Picnic outing',gift:'picnic-basket',steps:[{id:'serve',name:'Serve a café customer',icon:'pizza'},{id:'outfit',name:'Choose your outfit',icon:'shirt'},{id:'picnic',name:'Share a park picnic',icon:'basket'}]},
 {id:'dress',name:'Dress-up party',gift:'star-lamp',steps:[{id:'outfit',name:'Wear your outfit',icon:'shirt'},{id:'photo',name:'Take an outfit photo',icon:'camera'},{id:'display',name:'Display that photo at home',icon:'photo'}]},
 {id:'park',name:'Park day',gift:'rainbow-beanbag',steps:[{id:'visit',name:'Visit the park',icon:'ball'},{id:'play',name:'Take three shots or finish a match',icon:'ball'},{id:'home',name:'Return home',icon:'home'}]}
];
const decorations=[['rug','Rainbow rug'],['cushion-pink','Pink cushion'],['cushion-blue','Blue cushion'],['teddy','Teddy bear'],['train','Toy train'],['plant','Flower plant'],['picnic-basket','Picnic basket'],['star-lamp','Star reading lamp'],['rainbow-beanbag','Rainbow beanbag']].map(([id,name],i)=>({id,name,free:i<6,image:'./assets/playbook/decor-atlas.png',atlasIndex:i}));
const byId=Object.fromEntries(books.map(b=>[b.id,b])),decorationById=Object.fromEntries(decorations.map(d=>[d.id,d]));
const uuid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function normalize(p){
 if(!p.playbook||typeof p.playbook!=='object')p.playbook={active:null,books:{}};
 if(!p.playbook.books||typeof p.playbook.books!=='object')p.playbook.books={};
 if(!byId[p.playbook.active])p.playbook.active=null;
 if(!p.decor||typeof p.decor!=='object')p.decor={owned:[],placements:{}};
 p.decor.owned=[...new Set([...(Array.isArray(p.decor.owned)?p.decor.owned:[]),...decorations.filter(d=>d.free).map(d=>d.id)])];
 if(!p.decor.placements||typeof p.decor.placements!=='object')p.decor.placements={};
 if(!p.scrapbook||typeof p.scrapbook!=='object')p.scrapbook={entries:{},pages:Array.from({length:6},()=>Array(4).fill(null)),homePhoto:null};
 if(!p.scrapbook.entries||typeof p.scrapbook.entries!=='object')p.scrapbook.entries={};
 const old=Array.isArray(p.scrapbook.pages)?p.scrapbook.pages:[];p.scrapbook.pages=Array.from({length:6},(_,i)=>Array.from({length:4},(_,j)=>old[i]?.[j]||null));
 if(!p.bests||typeof p.bests!=='object')p.bests={};if(!p.practiceBests||typeof p.practiceBests!=='object')p.practiceBests={};return p;
}
function context(p){const b=p.playbook?.active,s=p.playbook?.books?.[b];return s&&!s.complete?{book:b,run:s.run}:null;}
function progress(p,book=p.playbook?.active){const definition=byId[book],state=p.playbook?.books?.[book];return definition?{book:definition,state,done:definition.steps.filter(s=>state?.steps?.[s.id]).length,total:definition.steps.length,next:definition.steps.find(s=>!state?.steps?.[s.id])||null}:null;}
function select(p,id,replay=false){const b=byId[id];if(!b)throw Error('invalid');normalize(p);let s=p.playbook.books[id];if(!s||replay){s={run:uuid(),started:Date.now(),steps:Object.fromEntries(b.steps.map(s=>[s.id,false])),complete:false,completions:s?.completions||0,shots:0,photoIds:[]};p.playbook.books[id]=s;}p.playbook.active=id;return{book:id,run:s.run};}
function best(p,sport,score,rally,practice=false){if(!['basketball','tennis','volleyball','catcher','bowling','jigsaw'].includes(sport))return;
 const n=v=>Number.isFinite(v)?Math.max(0,Math.min(100000,Math.floor(v))):0,table=practice?p.practiceBests:p.bests,old=table[sport]||{score:0,rally:0};score=n(score);rally=n(rally);if(table[sport]&&score<=old.score&&rally<=old.rally)return;table[sport]={score:Math.max(old.score,score),rally:Math.max(old.rally,rally)};
 if(!practice){const id='best:'+sport;p.scrapbook.entries[id]={id,type:'best',sport,...table[sport],at:Date.now()};}}
function activity(p,e){normalize(p);if(['sport-shot','sport-finished','sport-best'].includes(e.kind))best(p,e.sport,e.score,e.rally,!!e.practice);
 const b=byId[e.context?.book],s=p.playbook.books[e.context?.book];if(!b||!s||s.complete||e.context.run!==s.run)return{advanced:false};let changed=false;const mark=k=>{if(!s.steps[k]){s.steps[k]=true;changed=true;}};
 if(b.id==='picnic'){if(e.kind==='cafe-payment')mark('serve');if(e.kind==='outfit')mark('outfit');if(e.kind==='picnic')mark('picnic');}
 if(b.id==='dress'){if(e.kind==='outfit')mark('outfit');if(e.kind==='photo'&&e.photo){mark('photo');if(!s.photoIds.includes(e.photo))s.photoIds.push(e.photo);}if(e.kind==='display'&&s.photoIds.includes(e.photo))mark('display');}
 if(b.id==='park'){if(e.kind==='park-visit')mark('visit');if(e.kind==='sport-shot'&&e.sport==='basketball'){s.shots=Math.min(3,s.shots+1);changed=true;if(s.shots>=3)mark('play');}if(e.kind==='sport-finished'&&['tennis','volleyball'].includes(e.sport))mark('play');if(e.kind==='home-return')mark('home');}
 if(b.steps.every(x=>s.steps[x.id])){s.complete=true;s.completions++;s.completedAt=Date.now();if(!p.decor.owned.includes(b.gift))p.decor.owned.push(b.gift);const id='adventure:'+b.id;if(!p.scrapbook.entries[id])p.scrapbook.entries[id]={id,type:'adventure',book:b.id,gift:b.gift,at:s.completedAt};return{advanced:true,complete:true,book:b.id,gift:b.gift};}return{advanced:changed,complete:false};}
// Full-room normalized coordinates. Furnishings never add walking collisions.
function placement(x,y){if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return null;return{x:Number(x.toFixed(6)),y:Number(y.toFixed(6))};}
const api={books,byId,decorations,decorationById,normalize,context,progress,select,activity,best,placement,snap:placement,anchors:[]};root.UWPlaybook=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
