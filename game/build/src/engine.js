/* Sneaky Unicorn: Rainbow Restaurant v1.2.0 — deterministic restaurant rules.
 * Child-facing play is visual; labels remain for accessibility and parent QA.
 * No networking, accounts, ads, purchases, analytics, or adventure combat.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RR=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const VERSION='2.0.0';
const SCHEMA=3;
const SAVE_KEY='sneaky-unicorn-restaurant-v1-4';
const PREVIOUS_SAVE_KEYS=['sneaky-unicorn-restaurant-v1-3','sneaky-unicorn-restaurant-v1-2','sneaky-unicorn-restaurant-v1'];
const LEGACY_SAVE_KEY='sneaky-unicorn-restaurant-v1';
const DAY_TARGET=10;
const LUNCH_AT=5;
const LUNCH_MENU=['pizza','pancakes','soup','smoothie'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const clone=o=>JSON.parse(JSON.stringify(o));
const step=(label,tool,need,action='tap')=>({label,tool,need,action});
const RECIPES={
 pizza:{name:'Pizza',icon:'pizza',variants:[{id:'tomato',name:'Tomato',icon:'tomato'},{id:'mushroom',name:'Mushroom',icon:'mushroom'}],steps:[step('Squish dough','roller',3,'rub'),step('Spread sauce','sauce',3,'rub'),step('Add cheese','cheese',3),step('Choose topping','choice',1,'choice'),step('Put toppings on','topping',3,'place'),step('Bake','oven',3,'hold')]},
 coffee:{name:'Coffee',icon:'coffee',variants:[{id:'milk',name:'Milky',icon:'milk'},{id:'cocoa',name:'Cocoa',icon:'cocoa'}],steps:[step('Grind beans','beans',3,'rub'),step('Pour water','kettle',3,'hold'),step('Choose flavour','choice',1,'choice'),step('Stir','spoon',4,'stir')]},
 cupcake:{name:'Cupcakes',icon:'cupcake',variants:[{id:'strawberry',name:'Strawberry',icon:'strawberry'},{id:'cocoa',name:'Chocolate',icon:'cocoa'}],decorations:[{id:'rainbow',name:'Rainbow sprinkles',icon:'sprinkles'},{id:'stars',name:'Star sprinkles',icon:'sprinkleStars'},{id:'hearts',name:'Heart sprinkles',icon:'sprinkleHearts'}],steps:[step('Add flour','flour',2),step('Crack egg','egg',2),step('Mix batter','whisk',4,'stir'),step('Bake','oven',3,'hold'),step('Choose frosting','choice',1,'choice'),step('Decorate','sprinkles',1,'decorate')]},
 icecream:{name:'Ice cream',icon:'icecream',variants:[{id:'strawberry',name:'Strawberry',icon:'strawberry'},{id:'vanilla',name:'Vanilla',icon:'vanilla'}],steps:[step('Set cone','cone',1),step('Choose flavour','choice',1,'choice'),step('Scoop','scoop',3,'rub'),step('Sprinkles','sprinkles',3)]},
 burger:{name:'Hamburger',icon:'burger',variants:[{id:'cheese',name:'Cheese',icon:'cheese'},{id:'tomato',name:'Tomato',icon:'tomato'}],steps:[step('Bottom bun','bun',1),step('Cook patty','pan',3,'hold'),step('Choose filling','choice',1,'choice'),step('Add lettuce','lettuce',2),step('Top bun','bun',1)]},
 soup:{name:'Soup',icon:'soup',variants:[{id:'carrot',name:'Carrot',icon:'carrots'},{id:'peas',name:'Pea',icon:'peas'}],steps:[step('Pour broth','kettle',3,'hold'),step('Choose vegetables','choice',1,'choice'),step('Add vegetables','chopper',3),step('Stir','spoon',4,'stir'),step('Warm','stove',3,'hold')]},
 chicken:{name:'Chicken & sweet potatoes',icon:'chicken',variants:[{id:'peas',name:'With peas',icon:'peas'},{id:'corn',name:'With corn',icon:'corn'}],steps:[step('Chicken on tray','chicken',1),step('Sweet potatoes','sweetpotato',3),step('Brush glaze','brush',3,'rub'),step('Choose vegetables','choice',1,'choice'),step('Roast','oven',4,'hold')]},
 pancakes:{name:'Pancakes',icon:'pancakes',variants:[{id:'berries',name:'Berries',icon:'blueberries'},{id:'banana',name:'Banana',icon:'banana'}],steps:[step('Mix batter','whisk',3,'stir'),step('Pour pancakes','ladle',3),step('Flip','spatula',3,'tap'),step('Choose topping','choice',1,'choice'),step('Add topping','topping',2)]},
 smoothie:{name:'Smoothie',icon:'smoothie',variants:[{id:'strawberry',name:'Strawberry',icon:'strawberry'},{id:'mango',name:'Mango',icon:'mango'}],steps:[step('Choose fruit','choice',1,'choice'),step('Add fruit','fruit',3),step('Add milk','milk',2,'hold'),step('Blend','blender',4,'hold'),step('Pour','cup',3,'hold')]}
};
const MENU=Object.keys(RECIPES);
const SEQUENCE=['pizza','icecream','burger','cupcake','soup','coffee','chicken','pancakes','smoothie'];
const TABLES=[
 {id:'heart',name:'Heart table',symbol:'heart',colour:'#e95d92',seat:{x:720,y:421},meet:{x:862,y:552},food:{x:712,y:500}},
 {id:'star',name:'Star table',symbol:'star',colour:'#4f79e2',seat:{x:1233,y:649},meet:{x:1338,y:792},food:{x:1180,y:743}},
 {id:'flower',name:'Flower table',symbol:'flower',colour:'#269a78',seat:{x:188,y:684},meet:{x:399,y:792},food:{x:247,y:745}},
 {id:'moon',name:'Moon table',symbol:'moon',colour:'#8757cf',seat:{x:733,y:740},meet:{x:888,y:884},food:{x:744,y:830}},
 {id:'diamond',name:'Diamond table',symbol:'diamond',colour:'#cc6a19',seat:{x:1445,y:742},meet:{x:1590,y:888},food:{x:1450,y:830}}
];
const KITCHEN={x:997,y:380}, SINK={x:1450,y:385}, ENTRY={x:236,y:1000};
// Visible interior footprints. The unused baked-background obstacles are gone.
const OBSTACLES=[
 [452,174,880,130],[80,405,259,112],[1490,305,208,173],
 [1610,533,102,112],[1061,905,89,91],
 ...TABLES.map(t=>[t.food.x-120,t.food.y-34,240,130])
];
const BOUNDS={left:66,right:1734,top:325,bottom:1030};
const CUSTOMIZATION={
 flooring:['lavender','mint','peach','moonstone','confetti'],
 wallpaper:['twilight','rainbow','garden','sunrise','starlight'],
 tableType:['round','clover','oval','heart','cloud'],
 tablecloth:['honey','cream','berry','sky','gingham','rainbow'],
 decoration:['flowers','stars','teapot','cookies','plant','cupcake'],
 chairs:['plum','mint','rainbow','rose','gold','sky']
};
// Whole-room closeout tasks. Progress is separate from regular dirty dishes.
const CLEAN_TASKS=[
 ...TABLES.map((t,i)=>({id:'table-'+i,kind:'table',x:t.meet.x,y:t.meet.y,artX:t.food.x,artY:t.food.y,need:3,table:i})),
 {id:'kitchen',kind:'counter',x:997,y:380,artX:975,artY:250,need:3},
 {id:'sink',kind:'sink',x:1450,y:385,artX:1450,artY:260,need:3},
 {id:'window-left',kind:'window',x:223,y:355,artX:223,artY:145,need:3},
 {id:'window-right',kind:'window',x:1400,y:343,artX:1527,artY:147,need:3},
 ...[[470,615],[979,625],[1497,566],[485,938],[980,999],[1640,1000]].map(([x,y],i)=>({id:'floor-'+i,kind:'floor',x,y,artX:x,artY:y,need:4}))
];
function freshDayState(){return {phase:'morning',lunch:{done:false,meal:null,packed:0,bites:0,sips:0},cleaning:CLEAN_TASKS.map(t=>({id:t.id,p:0})),pace:{elapsed:0,next:8,mood:'cozy',remaining:24,burst:0,seed:73129}};}
function clampInt(v,max=1000000){return Number.isFinite(v)?clamp(Math.floor(v),0,max):0;}
function safePoint(pt){
 if(walkable(pt.x,pt.y))return {x:pt.x,y:pt.y};
 for(let r=8;r<=240;r+=8)for(let i=0;i<32;i++){const a=i*Math.PI/16,x=pt.x+Math.cos(a)*r,y=pt.y+Math.sin(a)*r;if(walkable(x,y))return {x,y};}
 return {x:445,y:911};
}
const DEFAULT_DECOR={flooring:'lavender',wallpaper:'twilight',tableType:'round',tablecloth:'honey',decoration:'flowers',chairs:'plum'};
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
 let nodes=[];for(let i=b;i!==-1;i=prev[i])nodes.push(gridPoint(i));nodes.reverse();if(walkable(end.x,end.y))nodes.push({x:end.x,y:end.y});
 const result=[];let current=start;
 while(nodes.length){let furthest=0;for(let i=nodes.length-1;i>=0;i--)if(lineFree(current,nodes[i])){furthest=i;break;}current=nodes[furthest];result.push(current);nodes=nodes.slice(furthest+1);}
 return result;
}
function blankTables(){return TABLES.map(()=>({status:'clean',dirty:null}));}
function fresh(settings={},decor={}){return {...freshDayState(),schema:SCHEMA,version:VERSION,day:1,served:0,total:0,issued:0,nextId:1,customers:[],active:null,tray:null,dirtyTray:null,prep:null,stickers:[],completed:false,player:{x:445,y:911,facing:1},tables:blankTables(),decor:{...DEFAULT_DECOR,...decor},settings:{muted:!!settings.muted,reduced:!!settings.reduced}};}
function validDish(d){return typeof d==='string'&&MENU.includes(d);}
function validVariant(d,v){return validDish(d)&&RECIPES[d].variants.some(x=>x.id===v);}
function validDecor(obj){obj=obj&&typeof obj==='object'?{...obj}:{};if(!obj.tablecloth&&obj.tabletop)obj.tablecloth=obj.tabletop;const out={...DEFAULT_DECOR};for(const k of Object.keys(CUSTOMIZATION))if(obj&&CUSTOMIZATION[k].includes(obj[k]))out[k]=obj[k];return out;}
function validDeco(dish,deco){if(dish!=='cupcake')return null;return RECIPES.cupcake.decorations.some(x=>x.id===deco)?deco:null;}
function cleanPrep(p,customers){
 if(!p||!validDish(p.dish)||!customers.some(c=>c.id===p.orderId&&c.phase==='ordered'))return null;
 const r=RECIPES[p.dish];let st=Number.isFinite(p.step)?clamp(Math.floor(p.step),0,r.steps.length):0;let variant=validVariant(p.dish,p.variant)?p.variant:null;
 const choiceIndex=r.steps.findIndex(x=>x.action==='choice');if(st>choiceIndex&&!variant)st=choiceIndex;
 const stepDef=r.steps[st];const maxP=stepDef?.need||1;
 const placements=Array.isArray(p.placements)?p.placements.slice(0,8).map(q=>({x:clamp(Number(q.x)||.5,.05,.95),y:clamp(Number(q.y)||.5,.05,.95)})):[];
 const done=!!p.done||st>=r.steps.length;
 return {orderId:p.orderId,dish:p.dish,step:done?r.steps.length:st,p:done?0:clamp(Math.floor(Number(p.p)||0),0,Math.max(0,maxP-1)),variant,deco:validDeco(p.dish,p.deco),done,placements};
}
function migrateV1(raw){
 if(!raw||raw.schema!==1||!Array.isArray(raw.customers))return null;
 const s=fresh(raw.settings||{});const num=(v,max)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
 s.day=Math.max(1,num(raw.day,100000));s.total=num(raw.total,10000000);s.served=num(raw.served,DAY_TARGET);s.issued=Math.max(s.served,num(raw.issued,DAY_TARGET));s.nextId=Math.max(1,num(raw.nextId,10000000));
 s.stickers=Array.isArray(raw.stickers)?[...new Set(raw.stickers.filter(validDish))]:[];
 if(raw.player&&Number.isFinite(raw.player.x)&&Number.isFinite(raw.player.y)&&walkable(raw.player.x,raw.player.y))s.player={x:raw.player.x,y:raw.player.y,facing:raw.player.facing===-1?-1:1};
 const usedT=new Set(),usedI=new Set();
 for(const c of raw.customers.slice(0,3)){
  if(!c||!Number.isInteger(c.id)||usedI.has(c.id)||!TABLES[c.table]||usedT.has(c.table)||!validVariant(c.dish,c.variant))continue;
  let phase=['arriving','waiting','ordered','eating','leaving'].includes(c.phase)?c.phase:'waiting';if(phase==='leaving')continue;
  usedI.add(c.id);usedT.add(c.table);s.customers.push({id:c.id,table:c.table,dish:c.dish,variant:c.variant,type:['pink','blue','human','worker','manager'].includes(c.type)?c.type:'pink',phase,x:Number.isFinite(c.x)?clamp(c.x,66,1734):ENTRY.x,y:Number.isFinite(c.y)?clamp(c.y,305,1030):ENTRY.y,eat:Number.isFinite(c.eat)?clamp(c.eat,0,9):0});
 }
 const ordered=id=>s.customers.some(c=>c.id===id&&c.phase==='ordered');
 s.active=ordered(raw.active)?raw.active:null;
 if(raw.tray&&ordered(raw.tray.orderId)&&validVariant(raw.tray.dish,raw.tray.variant))s.tray={orderId:raw.tray.orderId,dish:raw.tray.dish,variant:raw.tray.variant,deco:raw.tray.dish==='cupcake'?'rainbow':null};
 if(raw.prep&&!s.tray&&ordered(raw.prep.orderId)&&validDish(raw.prep.dish)){
  const old=raw.prep,r=RECIPES[old.dish];let st=clamp(Math.floor(Number(old.step)||0),0,r.steps.length);
  if(old.dish==='pizza'&&st>=4&&!old.done)st=4; // v1.1 went directly from topping choice to bake; v1.2 adds placement.
  const done=!!old.done;const choiceIndex=r.steps.findIndex(x=>x.action==='choice');let variant=validVariant(old.dish,old.variant)?old.variant:null;if(st>choiceIndex&&!variant)st=choiceIndex;
  s.prep={orderId:old.orderId,dish:old.dish,step:done?r.steps.length:st,p:done?0:clamp(Math.floor(Number(old.p)||0),0,3),variant,deco:old.dish==='cupcake'&&done?'rainbow':null,done,placements:[]};s.active=old.orderId;
 }
 s.issued=Math.max(s.served,s.served+s.customers.filter(c=>['arriving','waiting','ordered','eating','finished'].includes(c.phase)).length);s.issued=clamp(s.issued,0,DAY_TARGET);
 s.nextId=Math.max(s.nextId,...s.customers.map(c=>c.id+1),1);s.completed=false;return s;
}
function cleanCoreSave(raw){
 try{
  if(raw?.schema===1)return migrateV1(raw);
  if(!raw||![2,SCHEMA].includes(raw.schema)||!Array.isArray(raw.customers))return null;
  const s=fresh(raw.settings||{},validDecor(raw.decor));const num=(v,max)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
  s.day=Math.max(1,num(raw.day,100000));s.total=num(raw.total,10000000);s.served=num(raw.served,DAY_TARGET);s.issued=Math.max(s.served,num(raw.issued,DAY_TARGET));s.nextId=Math.max(1,num(raw.nextId,10000000));s.stickers=Array.isArray(raw.stickers)?[...new Set(raw.stickers.filter(validDish))]:[];
  if(raw.player&&Number.isFinite(raw.player.x)&&Number.isFinite(raw.player.y)&&walkable(raw.player.x,raw.player.y))s.player={x:raw.player.x,y:raw.player.y,facing:raw.player.facing===-1?-1:1};
  const usedT=new Set(),usedI=new Set();
  for(const c of raw.customers.slice(0,5)){
   if(!c||!Number.isInteger(c.id)||c.id<1||usedI.has(c.id)||!TABLES[c.table]||usedT.has(c.table)||!validVariant(c.dish,c.variant)||!['arriving','waiting','ordered','eating','finished','leaving'].includes(c.phase))return null;
   usedI.add(c.id);usedT.add(c.table);s.customers.push({id:c.id,table:c.table,dish:c.dish,variant:c.variant,type:['pink','blue','human','worker','manager'].includes(c.type)?c.type:'pink',phase:c.phase,x:Number.isFinite(c.x)?clamp(c.x,66,1734):ENTRY.x,y:Number.isFinite(c.y)?clamp(c.y,305,1030):ENTRY.y,eat:Number.isFinite(c.eat)?clamp(c.eat,0,12):0,deco:validDeco(c.dish,c.deco)});
  }
  if(Array.isArray(raw.tables))for(let i=0;i<TABLES.length;i++){
   const q=raw.tables[i];if(!q||!['clean','dirty','carried'].includes(q.status))continue;
   let dirty=null;if(q.dirty&&validVariant(q.dirty.dish,q.dirty.variant))dirty={dish:q.dirty.dish,variant:q.dirty.variant,deco:validDeco(q.dirty.dish,q.dirty.deco),orderId:Number.isInteger(q.dirty.orderId)?q.dirty.orderId:0};
   s.tables[i]={status:q.status,dirty};if(q.status==='dirty'&&!dirty)s.tables[i]={status:'clean',dirty:null};
  }
  const ordered=id=>s.customers.some(c=>c.id===id&&c.phase==='ordered');s.active=ordered(raw.active)?raw.active:null;
  if(raw.tray&&ordered(raw.tray.orderId)&&validVariant(raw.tray.dish,raw.tray.variant))s.tray={orderId:raw.tray.orderId,dish:raw.tray.dish,variant:raw.tray.variant,deco:validDeco(raw.tray.dish,raw.tray.deco)};
  if(raw.dirtyTray&&TABLES[raw.dirtyTray.table]&&s.tables[raw.dirtyTray.table].status==='carried'&&validVariant(raw.dirtyTray.dish,raw.dirtyTray.variant))s.dirtyTray={table:raw.dirtyTray.table,dish:raw.dirtyTray.dish,variant:raw.dirtyTray.variant,deco:validDeco(raw.dirtyTray.dish,raw.dirtyTray.deco),wash:clamp(Math.floor(Number(raw.dirtyTray.wash)||0),0,5)};
  if(raw.prep&&!s.tray&&!s.dirtyTray)s.prep=cleanPrep(raw.prep,s.customers);if(s.prep)s.active=s.prep.orderId;
  // Repair table dirt from finished/leaving guests if an interrupted save missed it.
  for(const c of s.customers)if(['finished','leaving'].includes(c.phase)&&s.tables[c.table].status==='clean'&&(!Array.isArray(raw.tables)||!raw.tables[c.table]))s.tables[c.table]={status:'dirty',dirty:{dish:c.dish,variant:c.variant,deco:null,orderId:c.id}};
  if(s.dirtyTray)s.tables[s.dirtyTray.table]={status:'carried',dirty:null};
  s.issued=clamp(Math.max(s.served,s.issued),0,DAY_TARGET);s.nextId=Math.max(s.nextId,...s.customers.map(c=>c.id+1),1);s.completed=!!raw.completed&&isDayClear(s);return s;
 }catch(_){return null;}
}
function serviceClear(s){return !s.customers.length&&!s.tray&&!s.prep&&!s.dirtyTray&&s.tables.every(t=>t.status==='clean');}
function surfacesClean(s){return CLEAN_TASKS.filter(t=>t.kind!=='floor').every(t=>s.cleaning?.find(q=>q.id===t.id)?.p>=t.need);}
function isDayClear(s){return s.served>=DAY_TARGET&&s.issued>=DAY_TARGET&&serviceClear(s)&&s.lunch?.done&&CLEAN_TASKS.every(t=>s.cleaning?.find(q=>q.id===t.id)?.p>=t.need);}
function cleanSave(raw){
 const s=cleanCoreSave(raw);if(!s)return null;
 const old=raw.schema!==SCHEMA;
 if(s.tray&&s.dirtyTray)s.dirtyTray=null;
 for(let i=0;i<s.tables.length;i++)if(s.tables[i].status==='carried'&&s.dirtyTray?.table!==i)s.tables[i]={status:'clean',dirty:null};
 const live=s.customers.filter(c=>['arriving','waiting','ordered'].includes(c.phase)).length;
 if(s.served+live>DAY_TARGET)return null;
 s.issued=clamp(Math.max(s.served+live,s.issued),0,DAY_TARGET);
 // A partially damaged save must not strand unissued orders forever.
 if(s.issued>s.served+live)s.issued=s.served+live;
 const l=raw.lunch&&typeof raw.lunch==='object'?raw.lunch:{};
 s.lunch={done:!old&&l.done===true,meal:LUNCH_MENU.includes(l.meal)?l.meal:null,packed:LUNCH_MENU.includes(l.meal)?(Number.isFinite(l.packed)?clampInt(l.packed,3):3):0,bites:clampInt(l.bites,3),sips:clampInt(l.sips,2)};
 if(!s.lunch.meal){s.lunch.bites=0;s.lunch.sips=0;}if(s.lunch.bites<3)s.lunch.sips=0;
 if(s.lunch.bites||s.lunch.sips)s.lunch.packed=3;
 if(s.lunch.done){s.lunch.meal=s.lunch.meal||'pizza';s.lunch.packed=3;s.lunch.bites=3;s.lunch.sips=2;}
 s.cleaning=CLEAN_TASKS.map(t=>({id:t.id,p:old?0:clampInt(Array.isArray(raw.cleaning)?raw.cleaning.find(q=>q?.id===t.id)?.p:0,t.need)}));
 if(s.served<DAY_TARGET)s.cleaning=CLEAN_TASKS.map(t=>({id:t.id,p:0}));
 const q=raw.pace&&typeof raw.pace==='object'?raw.pace:{};
 s.pace={elapsed:clampInt(q.elapsed),next:Number.isFinite(q.next)?clamp(q.next,0,20):8,mood:['cozy','normal','busy'].includes(q.mood)?q.mood:'cozy',remaining:Number.isFinite(q.remaining)?clamp(q.remaining,0,60):24,burst:clampInt(q.burst,3),seed:clampInt(q.seed,4294967295)||73129};
 if(old&&raw.completed&&serviceClear(s)){
  // A finished earlier release stays finished; do not demand a bonus meal.
  s.served=DAY_TARGET;s.issued=DAY_TARGET;s.lunch.done=true;s.lunch.meal='pizza';s.lunch.bites=3;s.lunch.sips=2;s.cleaning=CLEAN_TASKS.map(t=>({id:t.id,p:t.need}));
 }
 s.completed=isDayClear(s);
 if(s.completed)s.phase='complete';
 else if(s.served>=DAY_TARGET&&s.lunch.done)s.phase=serviceClear(s)?'cleaning':'closing';
 else if(!s.lunch.done&&s.served>=LUNCH_AT&&serviceClear(s))s.phase='lunch';
 else s.phase=s.lunch.done?'afternoon':'morning';
 return s;
}
class Engine{
 constructor(saved=null){this.s=cleanSave(saved)||fresh();}
 customer(id){return this.s.customers.find(c=>c.id===id)||null;}
 atTable(index){return this.s.customers.find(c=>c.table===index)||null;}
 nextOrder(){return this.s.customers.find(c=>c.phase==='ordered')||null;}
 freeTable(){return TABLES.findIndex((_,i)=>!this.atTable(i)&&this.s.tables[i].status==='clean');}
 spawn(limit=5){const s=this.s;if(!['morning','afternoon'].includes(s.phase)||(!s.lunch.done&&s.issued>=LUNCH_AT)||s.completed||s.issued>=DAY_TARGET||s.customers.length>=limit)return null;const table=this.freeTable();if(table<0)return null;const idx=(s.issued+(s.day-1)*3)%SEQUENCE.length,dish=SEQUENCE[idx],r=RECIPES[dish],variant=r.variants[(s.issued+s.day-1)%r.variants.length].id;const types=['pink','human','blue','worker','manager'];const c={id:s.nextId++,table,dish,variant,type:types[(s.issued+s.day-1)%types.length],phase:'arriving',x:ENTRY.x,y:ENTRY.y,eat:0};s.issued++;s.customers.push(c);return c;}
 arrive(id){const c=this.customer(id);if(!c||c.phase!=='arriving')return false;c.phase='waiting';c.x=TABLES[c.table].seat.x;c.y=TABLES[c.table].seat.y;return true;}
 takeOrder(id){const c=this.customer(id);if(!c||!['waiting','ordered'].includes(c.phase))return false;c.phase='ordered';this.s.active=id;return true;}
 selectOrder(id){const c=this.customer(id);if(c?.phase!=='ordered')return false;this.s.active=id;return true;}
 startRecipe(orderId,dish){const c=this.customer(orderId);if(!['morning','afternoon'].includes(this.s.phase)||this.s.tray||this.s.dirtyTray||c?.phase!=='ordered'||!validDish(dish))return false;this.s.active=orderId;this.s.prep={orderId,dish,step:0,p:0,variant:null,deco:null,done:false,placements:[]};return true;}
 act(value=null,meta=null){const p=this.s.prep;if(!p||p.done)return {ok:false};const st=RECIPES[p.dish].steps[p.step];if(!st)return {ok:false};
  if(st.action==='choice'){if(!validVariant(p.dish,value))return {ok:false};p.variant=value;p.p=st.need;}
  else if(st.action==='decorate'){if(p.dish!=='cupcake'||!validDeco('cupcake',value))return {ok:false};p.deco=value;p.p=st.need;}
  else {if(st.action==='place'&&meta&&Number.isFinite(meta.x)&&Number.isFinite(meta.y))p.placements.push({x:clamp(meta.x,.05,.95),y:clamp(meta.y,.05,.95)});p.p++;}
  let advanced=false;if(p.p>=st.need){p.step++;p.p=0;advanced=true;}p.done=p.step>=RECIPES[p.dish].steps.length;return {ok:true,advanced,done:p.done};
 }
 redecorate(value){const p=this.s.prep;if(!p?.done||p.dish!=='cupcake'||!validDeco('cupcake',value))return false;p.deco=value;return true;}
 restartPrep(){const p=this.s.prep;if(!p)return false;return this.startRecipe(p.orderId,p.dish);}
 cancelPrep(){this.s.prep=null;}
 packMeal(){const p=this.s.prep;if(!p?.done||!validVariant(p.dish,p.variant)||this.s.tray||this.s.dirtyTray)return false;this.s.tray={orderId:p.orderId,dish:p.dish,variant:p.variant,deco:validDeco(p.dish,p.deco)};this.s.prep=null;return true;}
 remake(){const tray=this.s.tray;if(!tray)return false;this.s.active=tray.orderId;this.s.tray=null;this.s.prep=null;return true;}
 serve(table){const t=this.s.tray,c=this.atTable(table);if(!t)return {ok:false,reason:'empty'};if(!c||c.phase!=='ordered'||c.id!==t.orderId)return {ok:false,reason:'table',target:this.customer(t.orderId)?.table};if(c.dish!==t.dish)return {ok:false,reason:'dish'};if(c.variant!==t.variant)return {ok:false,reason:'variant'};c.phase='eating';c.eat=0;c.deco=t.deco||null;this.s.tray=null;this.s.served++;this.s.total++;if(!this.s.stickers.includes(c.dish))this.s.stickers.push(c.dish);this.s.active=this.nextOrder()?.id||null;return {ok:true,dish:c.dish,table};}
 finishEating(id){const c=this.customer(id);if(c?.phase!=='eating')return false;c.phase='finished';c.eat=0;this.s.tables[c.table]={status:'dirty',dirty:{dish:c.dish,variant:c.variant,deco:c.deco||null,orderId:c.id}};return true;}
 startLeaving(id){const c=this.customer(id);if(c?.phase!=='finished')return false;c.phase='leaving';return true;}
 remove(id){const c=this.customer(id);if(c?.phase!=='leaving')return false;this.s.customers=this.s.customers.filter(x=>x.id!==id);this.updateCompleted();return true;}
 pickDirty(table){const t=this.s.tables[table];if(!t||t.status!=='dirty'||!t.dirty||this.s.tray||this.s.dirtyTray||this.s.prep)return false;const d=t.dirty;this.s.dirtyTray={table,dish:d.dish,variant:d.variant,deco:d.deco||null,wash:0};this.s.tables[table]={status:'carried',dirty:null};return true;}
 washAct(){const d=this.s.dirtyTray;if(!d)return {ok:false,done:false};d.wash=clamp(d.wash+1,0,5);if(d.wash>=5){const table=d.table;this.s.dirtyTray=null;this.s.tables[table]={status:'clean',dirty:null};this.updateCompleted();return {ok:true,done:true,table};}return {ok:true,done:false,wash:d.wash};}
 updateCompleted(){this.updateDay();return this.s.completed;}
 updateDay(){const s=this.s;if(s.completed)return s.phase;
  if(!s.lunch.done&&s.served>=LUNCH_AT&&serviceClear(s)){s.phase='lunch';return s.phase;}
  if(s.lunch.done&&s.served>=DAY_TARGET)s.phase=serviceClear(s)?'cleaning':'closing';
  else if(s.phase!=='lunch')s.phase=s.lunch.done?'afternoon':'morning';
  s.completed=isDayClear(s);if(s.completed)s.phase='complete';return s.phase;
 }
 chooseLunch(meal){if(this.s.phase!=='lunch'||!LUNCH_MENU.includes(meal))return false;this.s.lunch.meal=meal;this.s.lunch.packed=0;this.s.lunch.bites=0;this.s.lunch.sips=0;return true;}
 packLunch(item){const l=this.s.lunch;if(this.s.phase!=='lunch'||!l.meal||l.packed>=3||item!==['meal','fruit','milk'][l.packed])return false;l.packed++;return true;}
 lunchAct(){const s=this.s,l=s.lunch;if(s.phase!=='lunch'||!l.meal||l.packed<3)return false;if(l.bites<3)l.bites++;else if(l.sips<2)l.sips++;else return false;return true;}
 endLunch(){const s=this.s,l=s.lunch;if(s.phase!=='lunch'||!l.meal||l.bites<3||l.sips<2)return false;l.done=true;s.phase='afternoon';s.pace.next=3;s.pace.mood='normal';s.pace.remaining=20;this.updateDay();return true;}
 cleanTargets(){const s=this.s;if(s.phase!=='cleaning')return [];const floors=surfacesClean(s);return CLEAN_TASKS.filter(t=>(t.kind==='floor')===floors&&s.cleaning.find(q=>q.id===t.id).p<t.need);}
 cleanAct(id){const s=this.s,t=this.cleanTargets().find(t=>t.id===id);if(!t)return {ok:false};const q=s.cleaning.find(q=>q.id===id);q.p=clamp(q.p+1,0,t.need);this.updateDay();return {ok:true,done:q.p>=t.need,complete:s.completed};}
 paceRandom(){const p=this.s.pace;p.seed=(Math.imul(p.seed,1664525)+1013904223)>>>0;return p.seed/4294967296;}
 paceTick(dt){const s=this.s,p=s.pace;if(!Number.isFinite(dt)||dt<=0||!['morning','afternoon'].includes(s.phase))return null;dt=Math.min(dt,.25);p.elapsed+=dt;p.next-=dt;p.remaining-=dt;
  if(p.remaining<=0){if(p.mood==='cozy'){p.mood='normal';p.remaining=18+this.paceRandom()*9;}else if(p.mood==='normal'){p.mood='busy';p.burst=3;p.remaining=18;}else{p.mood='cozy';p.remaining=22+this.paceRandom()*12;}}
  const cap=s.served<1?1:s.served<3?3:5;
  if(p.next>0)return null;
  const guest=this.spawn(cap);if(!guest){p.next=1.2;return null;}
  p.next=p.mood==='busy'?3+this.paceRandom()*2:p.mood==='normal'?7+this.paceRandom()*4:12+this.paceRandom()*5;
  if(p.mood==='busy'&&--p.burst<=0){p.mood='cozy';p.remaining=26;p.next=13;}
  return guest;
 }
 guestSpeed(c){return 174*(.84+((c.id*17+this.s.day*13)%41)/100)*(this.s.pace.mood==='busy'?1.07:1);}

 setDecor(stage,value){if(!CUSTOMIZATION[stage]?.includes(value))return false;this.s.decor[stage]=value;return true;}
 newDay(){const old=this.s,n=fresh(old.settings,old.decor);n.day=old.day+1;n.total=old.total;n.stickers=[...old.stickers];n.nextId=old.nextId;n.pace.seed=(old.pace.seed+137*n.day)>>>0;this.s=n;return n;}
 reset(){this.s=fresh(this.s.settings);}
 snapshot(){return clone(this.s);}
}
return {LUNCH_AT,LUNCH_MENU,CLEAN_TASKS,PREVIOUS_SAVE_KEYS,serviceClear,surfacesClean,safePoint,VERSION,SCHEMA,SAVE_KEY,LEGACY_SAVE_KEY,DAY_TARGET,RECIPES,MENU,SEQUENCE,TABLES,KITCHEN,SINK,ENTRY,OBSTACLES,BOUNDS,CUSTOMIZATION,DEFAULT_DECOR,Engine,fresh,cleanSave,migrateV1,validVariant,validDish,validDecor,pathfind,walkable,lineFree,clamp,clone,isDayClear};
});
