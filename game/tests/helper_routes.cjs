/* Regression: sub-pixel frame steps used to send helpers back around grid corners. */
const assert=require('node:assert/strict');
const R=require('../build/src/engine.js');
const profiles={'30 Hz':[1/30],'60 Hz':[1/60],'120 Hz':[1/120],jitter:[1/120,.04,1/60,1/90]};
const results=[];
function test(name,fn){try{fn();results.push({name,status:'pass'});console.log('PASS',name);}catch(error){results.push({name,status:'fail',error:error.stack});console.error('FAIL',name,error.stack);process.exitCode=1;}}
function waitAt(e,table){const c=e.spawn();assert(c);c.table=table;e.arrive(c.id);return c;}
function dirtyAt(e,table){e.s.tables[table]={status:'dirty',dirty:{dish:'pizza',variant:'tomato',orderId:table+1}};}
function run(e,steps,done,limit=90){let elapsed=0,n=0;while(!done()&&elapsed<limit){const old=e.s.helpers.map(h=>({x:h.x,y:h.y})),dt=steps[n++%steps.length];e.helpersTick(dt);elapsed+=dt;e.s.helpers.forEach((h,i)=>{assert(R.walkable(h.x,h.y),'helper entered furniture');assert(R.lineFree(old[i],h),'helper crossed furniture');});}assert(done(),`job unfinished after ${elapsed.toFixed(2)}s: ${JSON.stringify(e.s.helpers)}`);return elapsed;}
for(const [name,steps] of Object.entries(profiles))test(`${name}: both helpers, every table, orders and dishes (20 jobs)`,()=>{
 for(const id of R.HELPER_IDS)for(let table=0;table<5;table++)for(const job of ['order','dish']){
  const e=new R.Engine();let c;if(job==='order')c=waitAt(e,table);else dirtyAt(e,table);e.grantHelper(id,'test');
  run(e,steps,()=>job==='order'?c.phase==='ordered':e.s.tables[table].status==='clean',45);
  assert.equal(e.s.coins,0);assert.equal(e.s.served,0);assert.equal(e.s.tray,null);assert.equal(e.s.dirtyTray,null);
 }
});
for(const [name,steps] of Object.entries(profiles))test(`${name}: concurrent five orders then five dishes without duplicate claims`,()=>{
 const e=new R.Engine();for(let i=0;i<5;i++)waitAt(e,i);for(const id of R.HELPER_IDS)e.grantHelper(id,'test');
 const claims=()=>{const jobs=e.s.helpers.map(h=>h.task).filter(Boolean);if(jobs.length===2)assert(jobs[0].kind!==jobs[1].kind||(jobs[0].id||jobs[0].table)!==(jobs[1].id||jobs[1].table),'duplicate helper claim');return e.s.customers.every(c=>c.phase==='ordered');};
 run(e,steps,claims,60);for(let i=0;i<5;i++)dirtyAt(e,i);run(e,steps,()=>e.s.tables.every(t=>t.status==='clean'),100);assert(e.s.helpers.every(h=>!h.dish));
});
test('Old stuck save and reload during order, carrying and washing complete',()=>{
 let e=new R.Engine();const c=waitAt(e,3);e.grantHelper('pink','x');Object.assign(e.s.helpers[0],{x:906.035744584,y:773.142978337,task:{kind:'order',table:3,id:c.id},progress:0});
 e=new R.Engine(e.snapshot());run(e,profiles['60 Hz'],()=>e.customer(c.id).phase==='ordered');
 for(const phase of ['order','carry','wash']){
  e=new R.Engine();let customer;if(phase==='order')customer=waitAt(e,4);else dirtyAt(e,4);e.grantHelper('pink','x');
  run(e,profiles['60 Hz'],()=>phase==='order'?e.s.helpers[0].task&&e.s.helpers[0].y>780:phase==='carry'?!!e.s.helpers[0].dish:e.s.helpers[0].dish&&e.s.helpers[0].progress>2);
  const before=e.snapshot();e=new R.Engine(before);assert.equal(e.s.helpers[0].progress,before.helpers[0].progress);
  run(e,profiles['120 Hz'],()=>phase==='order'?e.customer(customer.id).phase==='ordered':e.s.tables[4].status==='clean');
 }
});
test('Manual order/dish takeover, recipe and player inventories remain independent',()=>{
 const e=new R.Engine(),first=waitAt(e,0),second=waitAt(e,4);e.takeOrder(first.id);e.startRecipe(first.id,first.dish);const prep=structuredClone(e.s.prep);for(const id of R.HELPER_IDS)e.grantHelper(id,'x');e.helpersTick(1/60);assert.equal(e.s.helpers.filter(h=>h.task?.id===second.id).length,1);e.takeOrder(second.id);run(e,profiles['60 Hz'],()=>e.s.helpers.every(h=>!h.task));assert.deepEqual(e.s.prep,prep);assert.equal(e.s.active,second.id);
 e.cancelPrep();dirtyAt(e,3);e.helpersTick(1/60);assert(e.pickDirty(3));const dish=structuredClone(e.s.dirtyTray);run(e,profiles['60 Hz'],()=>e.s.helpers.every(h=>!h.task));assert.deepEqual(e.s.dirtyTray,dish);assert.equal(e.s.tables[3].status,'carried');
 for(let i=0;i<5;i++)e.washAct();e.s.tray={orderId:first.id,dish:first.dish,variant:first.variant};const tray=structuredClone(e.s.tray);dirtyAt(e,2);run(e,profiles.jitter,()=>e.s.tables[2].status==='clean');assert.deepEqual(e.s.tray,tray);
});
test('An interrupted route recovers without losing its carried dish',()=>{
 const e=new R.Engine();dirtyAt(e,3);e.grantHelper('pink','x');run(e,profiles['60 Hz'],()=>!!e.s.helpers[0].dish);e.helpersTick(1/60);
 const h=e.s.helpers[0],carried=structuredClone(h.dish),engineRoute=e.helperActivity(h).route;engineRoute.path=[];
 for(let i=0;i<30;i++)e.helpersTick(1/60);assert.deepEqual(h.dish,carried);assert.equal(e.s.tables[3].status,'carried');
 run(e,profiles['60 Hz'],()=>e.s.tables[3].status==='clean');
});
test('Hire/finish happiness is transient; expiry, reset and new day preserve contracts',()=>{
 const e=new R.Engine();e.s.coins=2;assert(e.hireLocal('pink'));assert.equal(e.s.coins,1);assert(e.helperActivity(e.s.helpers[0]).happy>0);assert(e.hireLocal('pink'));assert.equal(e.s.coins,1);
 const keys=Object.keys(R.fresh().helpers[0]);dirtyAt(e,3);run(e,profiles['60 Hz'],()=>!!e.s.helpers[0].dish);assert.deepEqual(Object.keys(e.snapshot().helpers[0]),keys);
 e.revokeHelper('pink');assert.equal(e.s.tables[3].status,'dirty');assert.equal(e.s.helpers[0].dish,null);assert.equal(e.s.coins,1);e.s.tables[3]={status:'clean',dirty:null};e.s.served=5;e.s.issued=5;e.updateDay();assert.equal(e.s.phase,'lunch');assert(e.s.helpers.every(h=>!h.hired));e.newDay();assert(e.s.helpers.every(h=>!h.hired));assert(e.hireLocal('blue'));e.reset();assert(e.s.helpers.every(h=>!h.hired));assert.equal(R.SAVE_KEY,'sneaky-unicorn-restaurant-v1-4');assert.equal(R.SCHEMA,3);
});
test('Favourite visits retain every original dish, variant and saved order',()=>{
 const seen=new Set();for(let day=1;day<=9;day++){const e=new R.Engine();e.s.day=day;for(let issued=0;issued<10;issued++){e.s.issued=issued;e.s.customers=[];e.s.lunch.done=issued>=5;e.s.phase=issued>=5?'afternoon':'morning';const c=e.spawn(),dish=R.SEQUENCE[(issued+(day-1)*3)%R.SEQUENCE.length];assert.equal(c.dish,dish);assert.equal(c.variant,R.RECIPES[dish].variants[(issued+day-1)%2].id);if(R.favouriteGuest(c))seen.add(c.type);const raw=e.snapshot(),restored=new R.Engine(raw);assert.equal(restored.customer(c.id).type,c.type);assert.equal(restored.customer(c.id).dish,c.dish);}}
 assert.deepEqual([...seen].sort(),['blue','pink']);
});
if(process.env.RESULT_FILE)require('node:fs').writeFileSync(process.env.RESULT_FILE,JSON.stringify(results,null,2));
