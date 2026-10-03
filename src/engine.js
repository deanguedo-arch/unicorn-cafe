/* Rainbow Restaurant 1.1.0 — independent, deterministic game rules.
 * No networking, dependencies, account data, punishments, or adventure combat.
 * This file is also loadable by Node for the acceptance suite.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RR=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const VERSION='1.1.0', SAVE_KEY='sneaky-unicorn-restaurant-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const clone=o=>JSON.parse(JSON.stringify(o));
const step=(label,tool,need,action='tap')=>({label,tool,need,action});
const RECIPES={
 pizza:{name:'Pizza',icon:'pizza',variants:[{id:'tomato',name:'Tomato',icon:'tomato'},{id:'mushroom',name:'Mushroom',icon:'mushroom'}],steps:[step('Squish the dough','roller',3,'rub'),step('Spread the sauce','sauce',3,'rub'),step('Sprinkle cheese','cheese',3),step('Pick the topping','choice',1,'choice'),step('Bake your pizza','oven',3,'hold')]},
 coffee:{name:'Coffee',icon:'coffee',variants:[{id:'milk',name:'Milky',icon:'milk'},{id:'cocoa',name:'Cocoa',icon:'cocoa'}],steps:[step('Grind the beans','beans',3,'rub'),step('Pour warm water','kettle',3,'hold'),step('Pick the flavour','choice',1,'choice'),step('Stir the cup','spoon',4,'stir')]},
 cupcake:{name:'Cupcakes',icon:'cupcake',variants:[{id:'strawberry',name:'Strawberry',icon:'strawberry'},{id:'cocoa',name:'Chocolate',icon:'cocoa'}],steps:[step('Add flour','flour',2),step('Crack the egg','egg',2),step('Mix the batter','whisk',4,'stir'),step('Bake the cakes','oven',3,'hold'),step('Pick the frosting','choice',1,'choice'),step('Shake the sprinkles','sprinkles',3)]},
 icecream:{name:'Ice cream',icon:'icecream',variants:[{id:'strawberry',name:'Strawberry',icon:'strawberry'},{id:'vanilla',name:'Vanilla',icon:'vanilla'}],steps:[step('Set out a cone','cone',1),step('Pick a flavour','choice',1,'choice'),step('Scoop, scoop, scoop!','scoop',3,'rub'),step('Shake the sprinkles','sprinkles',3)]},
 burger:{name:'Hamburger',icon:'burger',variants:[{id:'cheese',name:'Cheese',icon:'cheese'},{id:'tomato',name:'Tomato',icon:'tomato'}],steps:[step('Put down the bun','bun',1),step('Sizzle the patty','pan',3,'hold'),step('Pick the filling','choice',1,'choice'),step('Add crunchy lettuce','lettuce',2),step('Put the lid on!','bun',1)]},
 soup:{name:'Soup',icon:'soup',variants:[{id:'carrot',name:'Carrot',icon:'carrots'},{id:'peas',name:'Pea',icon:'peas'}],steps:[step('Pour into the pot','kettle',3,'hold'),step('Pick the vegetables','choice',1,'choice'),step('Chop with the toy chopper','chopper',3,'rub'),step('Stir the soup','spoon',4,'stir'),step('Warm it up','stove',3,'hold')]},
 chicken:{name:'Chicken & sweet potatoes',icon:'chicken',variants:[{id:'peas',name:'With peas',icon:'peas'},{id:'corn',name:'With corn',icon:'corn'}],steps:[step('Put chicken on the tray','chicken',1),step('Add sweet potatoes','sweetpotato',3),step('Brush on the glaze','brush',3,'rub'),step('Pick the extra vegetables','choice',1,'choice'),step('Roast your dinner','oven',4,'hold')]}
};
const MENU=Object.keys(RECIPES);
const SEQUENCE=['pizza','icecream','burger','cupcake','soup','coffee','chicken'];
const TABLES=[
 {id:'heart',name:'Heart table',symbol:'heart',colour:'#ed75a0',seat:{x:720,y:421},meet:{x:856,y:548},food:{x:712,y:500},bubble:{x:678,y:311}},
 {id:'star',name:'Star table',symbol:'star',colour:'#739cea',seat:{x:1233,y:649},meet:{x:1334,y:790},food:{x:1180,y:743},bubble:{x:1152,y:548}},
 {id:'flower',name:'Flower table',symbol:'flower',colour:'#6bbfa5',seat:{x:188,y:684},meet:{x:399,y:792},food:{x:247,y:745},bubble:{x:198,y:577}}
];
const KITCHEN={x:997,y:380}, ENTRY={x:236,y:1000};
const OBSTACLES=[
 [452,174,880,130], [72,339,269,178], [72,658,269,172],
 [559,450,244,103], [1041,681,244,119], [1467,305,231,177],
 [1610,533,102,112], [1061,905,89,91]
];
const BOUNDS={left:66,right:1734,top:325,bottom:1030};
function walkable(x,y,r=18){if(x<BOUNDS.left||x>BOUNDS.right||y<BOUNDS.top||y>BOUNDS.bottom)return false;return !OBSTACLES.some(o=>x>o[0]-r&&x<o[0]+o[2]+r&&y>o[1]-r&&y<o[1]+o[3]+r);}
function lineFree(a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/10);for(let i=0;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/(n||1),a.y+(b.y-a.y)*i/(n||1)))return false;return true;}
const CELL=28,NX=60,NY=26;
const gridPoint=i=>({x:BOUNDS.left+CELL*(i%NX),y:BOUNDS.top+CELL*Math.floor(i/NX)});
const GRID=Array.from({length:NX*NY},(_,i)=>{const p=gridPoint(i);return walkable(p.x,p.y);});
function closestCell(p){let best=-1,dist=Infinity;GRID.forEach((v,i)=>{if(v){const q=gridPoint(i),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<dist){dist=d;best=i;}}});return best;}
function pathfind(start,end){
 if(lineFree(start,end))return [{x:end.x,y:end.y}];
 const a=closestCell(start),b=closestCell(end);if(a<0||b<0)return [];
 const prev=new Int32Array(NX*NY).fill(-2),queue=[a];prev[a]=-1;
 for(let qi=0;qi<queue.length&&prev[b]===-2;qi++){
  const cur=queue[qi],x=cur%NX,y=Math.floor(cur/NX);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const xx=x+dx,yy=y+dy;if(xx<0||xx>=NX||yy<0||yy>=NY)continue;
   const ni=yy*NX+xx;if(!GRID[ni]||prev[ni]!==-2)continue;
   if(dx&&dy&&(!GRID[y*NX+xx]||!GRID[yy*NX+x]))continue;
   prev[ni]=cur;queue.push(ni);
  }
 }
 if(prev[b]===-2)return [];
 let nodes=[];for(let i=b;i!==-1;i=prev[i])nodes.push(gridPoint(i));nodes.reverse();
 if(walkable(end.x,end.y))nodes.push({x:end.x,y:end.y});
 const result=[];let current=start;
 while(nodes.length){let furthest=0;for(let i=nodes.length-1;i>=0;i--)if(lineFree(current,nodes[i])){furthest=i;break;}current=nodes[furthest];result.push(current);nodes=nodes.slice(furthest+1);}
 return result;
}
function fresh(settings={}){return {schema:1,version:VERSION,day:1,served:0,total:0,issued:0,nextId:1,customers:[],active:null,tray:null,prep:null,stickers:[],completed:false,player:{x:445,y:911,facing:1},settings:{muted:!!settings.muted,reduced:!!settings.reduced}};}
function validDish(d){return typeof d==='string'&&MENU.includes(d);}
function validVariant(d,v){return validDish(d)&&RECIPES[d].variants.some(x=>x.id===v);}
function cleanSave(raw){
 try{
  if(!raw||raw.schema!==1||!Array.isArray(raw.customers))return null;
  const s=fresh(raw.settings||{}),num=(v,max)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
  s.day=Math.max(1,num(raw.day,100000));s.total=num(raw.total,10000000);s.served=num(raw.served,7);s.issued=Math.max(s.served,num(raw.issued,7));s.nextId=Math.max(1,num(raw.nextId,10000000));
  s.stickers=Array.isArray(raw.stickers)?[...new Set(raw.stickers.filter(validDish))]:[];
  s.completed=s.served===7;
  if(raw.player&&Number.isFinite(raw.player.x)&&Number.isFinite(raw.player.y)&&walkable(raw.player.x,raw.player.y))s.player={x:raw.player.x,y:raw.player.y,facing:raw.player.facing===-1?-1:1};
  const usedTables=new Set(),usedIDs=new Set();
  for(const c of raw.customers.slice(0,3)){
   if(!c||!Number.isInteger(c.id)||c.id<1||usedIDs.has(c.id)||!TABLES[c.table]||usedTables.has(c.table)||!validVariant(c.dish,c.variant)||!['arriving','waiting','ordered','eating','leaving'].includes(c.phase))return null;
   usedTables.add(c.table);usedIDs.add(c.id);
   s.customers.push({id:c.id,table:c.table,dish:c.dish,variant:c.variant,type:['pink','blue','human','worker','manager'].includes(c.type)?c.type:'pink',phase:c.phase,x:Number.isFinite(c.x)?clamp(c.x,66,1734):ENTRY.x,y:Number.isFinite(c.y)?clamp(c.y,305,1030):ENTRY.y,eat:Number.isFinite(c.eat)?clamp(c.eat,0,5):0});
  }
  const outstanding=s.customers.filter(c=>['arriving','waiting','ordered'].includes(c.phase)).length;
  if(s.served+outstanding>7)return null;
  // Repair an interrupted/damaged issue counter rather than leaving an empty restaurant stuck.
  s.issued=s.served+outstanding;s.total=Math.max(s.total,s.served);
  const ordered=id=>s.customers.some(c=>c.id===id&&c.phase==='ordered');
  s.active=ordered(raw.active)?raw.active:null;
  if(raw.tray&&ordered(raw.tray.orderId)&&validVariant(raw.tray.dish,raw.tray.variant))s.tray={orderId:raw.tray.orderId,dish:raw.tray.dish,variant:raw.tray.variant};
  if(raw.prep&&!s.tray&&ordered(raw.prep.orderId)&&validDish(raw.prep.dish)){
   const p=raw.prep,r=RECIPES[p.dish],st=num(p.step,r.steps.length);
   const v=validVariant(p.dish,p.variant)?p.variant:null;
   const choiceIndex=r.steps.findIndex(x=>x.action==='choice');
   // A damaged save may not silently skip a custom-order choice.
   const safeStep=st>choiceIndex&&!v?choiceIndex:st;
   s.prep={orderId:p.orderId,dish:p.dish,step:safeStep,p:Math.min(num(p.p,20),(r.steps[safeStep]?.need||1)-1),variant:v,done:safeStep===r.steps.length};
   s.active=p.orderId;
  }
  s.nextId=Math.max(s.nextId,...s.customers.map(c=>c.id+1));
  return s;
 }catch(_){return null;}
}
class Engine{
 constructor(saved=null){this.s=cleanSave(saved)||fresh();}
 customer(id){return this.s.customers.find(c=>c.id===id)||null;}
 atTable(index){return this.s.customers.find(c=>c.table===index)||null;}
 nextOrder(){return this.s.customers.find(c=>c.phase==='ordered')||null;}
 spawn(){
  const s=this.s;if(s.completed||s.issued>=7||s.customers.length>=3)return null;
  const table=TABLES.findIndex((_,i)=>!this.atTable(i));if(table<0)return null;
  const dish=SEQUENCE[(s.issued+(s.day-1)*2)%7],r=RECIPES[dish],variant=r.variants[(s.issued+s.day-1)%r.variants.length].id;
  const c={id:s.nextId++,table,dish,variant,type:['pink','human','blue','worker','pink','manager','blue'][s.issued],phase:'arriving',x:ENTRY.x,y:ENTRY.y,eat:0};s.issued++;s.customers.push(c);return c;
 }
 arrive(id){const c=this.customer(id);if(!c||c.phase!=='arriving')return false;c.phase='waiting';c.x=TABLES[c.table].seat.x;c.y=TABLES[c.table].seat.y;return true;}
 takeOrder(id){const c=this.customer(id);if(!c||!['waiting','ordered'].includes(c.phase))return false;c.phase='ordered';this.s.active=id;return true;}
 selectOrder(id){const c=this.customer(id);if(c?.phase!=='ordered')return false;this.s.active=id;return true;}
 startRecipe(orderId,dish){const c=this.customer(orderId);if(this.s.tray||c?.phase!=='ordered'||!validDish(dish))return false;this.s.active=orderId;this.s.prep={orderId,dish,step:0,p:0,variant:null,done:false};return true;}
 act(variant){
  const p=this.s.prep;if(!p||p.done)return {ok:false};
  const step=RECIPES[p.dish].steps[p.step];
  if(step.action==='choice'){
   if(!validVariant(p.dish,variant))return {ok:false};p.variant=variant;
  }
  p.p++;let advanced=false;if(p.p>=step.need){p.step++;p.p=0;advanced=true;}
  p.done=p.step>=RECIPES[p.dish].steps.length;
  return {ok:true,advanced,done:p.done};
 }
 restartPrep(){const p=this.s.prep;if(!p)return false;return this.startRecipe(p.orderId,p.dish);}
 cancelPrep(){this.s.prep=null;}
 packMeal(){const p=this.s.prep;if(!p?.done||!validVariant(p.dish,p.variant)||this.s.tray)return false;this.s.tray={orderId:p.orderId,dish:p.dish,variant:p.variant};this.s.prep=null;return true;}
 remake(){const tray=this.s.tray;if(!tray)return false;this.s.active=tray.orderId;this.s.tray=null;this.s.prep=null;return true;}
 serve(table){
  const t=this.s.tray,c=this.atTable(table);
  if(!t)return {ok:false,reason:'empty'};
  if(!c||c.phase!=='ordered'||c.id!==t.orderId)return {ok:false,reason:'table',target:this.customer(t.orderId)?.table};
  if(c.dish!==t.dish)return {ok:false,reason:'dish'};
  if(c.variant!==t.variant)return {ok:false,reason:'variant'};
  c.phase='eating';c.eat=0;this.s.tray=null;this.s.served++;this.s.total++;if(!this.s.stickers.includes(c.dish))this.s.stickers.push(c.dish);
  this.s.active=this.nextOrder()?.id||null;this.s.completed=this.s.served===7;
  return {ok:true,completed:this.s.completed,dish:c.dish,table};
 }
 leave(id){const c=this.customer(id);if(c?.phase!=='eating')return false;c.phase='leaving';return true;}
 remove(id){const c=this.customer(id);if(c?.phase!=='leaving')return false;this.s.customers=this.s.customers.filter(x=>x.id!==id);return true;}
 newDay(){const old=this.s,n=fresh(old.settings);n.day=old.day+1;n.total=old.total;n.stickers=[...old.stickers];n.nextId=old.nextId;this.s=n;return n;}
 reset(){this.s=fresh(this.s.settings);}
 snapshot(){return clone(this.s);}
}
return {VERSION,SAVE_KEY,RECIPES,MENU,SEQUENCE,TABLES,KITCHEN,ENTRY,OBSTACLES,BOUNDS,Engine,fresh,cleanSave,validVariant,pathfind,walkable,lineFree,clamp,clone};
});
