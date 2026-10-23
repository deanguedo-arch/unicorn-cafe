// First-cycle onboarding is opt-in only for a genuinely fresh café save.
const assert=require('node:assert/strict'),R=require('../../../game/build/src/engine.js');
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS',name);};
function make(e,c){assert(e.takeOrder(c.id));assert(e.startRecipe(c.id,c.dish));while(!e.s.prep.done){const p=e.s.prep,st=R.RECIPES[p.dish].steps[p.step];assert(e.act(st.action==='choice'?R.RECIPES[p.dish].variants[0].id:st.action==='decorate'?'rainbow':null,{x:.4,y:.6}).ok);}assert(e.packMeal());}
check('New café saves alone receive first-service marker without changing schema, key, coins, target, or lunch',()=>{
 const e=new R.Engine(),s=e.snapshot();assert.equal(s.firstServiceCycle,0);assert.equal(R.SCHEMA,3);assert.equal(R.SAVE_KEY,'sneaky-unicorn-restaurant-v1-4');assert.equal(s.coins,0);assert.equal(R.DAY_TARGET,10);assert.equal(R.LUNCH_AT,5);assert.equal(R.firstServicePending(s),true);
});
check('Manual spawn API and historical fixtures keep their existing behavior',()=>{
 const e=new R.Engine(),one=e.spawn(1),two=e.spawn(5);assert(one&&two);assert.equal(e.s.customers.length,2);assert.equal(e.s.issued,2);
});
check('Only natural arrival pauses until the fresh guest is fully served and the dish is washed',()=>{
 const e=new R.Engine();e.s.pace.next=0;const first=e.paceTick(.25);assert(first);assert(e.arrive(first.id));
 for(let i=0;i<240;i++){e.s.pace.next=0;assert.equal(e.paceTick(.25),null);}assert.equal(e.s.issued,1);
 make(e,first);assert(e.serve(first.table).ok);assert.equal(e.s.firstServiceCycle,1);assert(e.finishEating(first.id));assert(e.startLeaving(first.id));Object.assign(e.customer(first.id),R.CASHIER);assert(e.pay(first.id));assert(e.remove(first.id));assert(e.pickDirty(first.table));assert.equal(e.s.firstServiceCycle,2);
 for(let i=0;i<4;i++)assert.equal(e.washAct().done,false);assert.equal(e.s.firstServiceCycle,2);assert.equal(e.washAct().done,true);assert.equal(e.s.firstServiceCycle,3);
 e.s.pace.next=0;const second=e.paceTick(.25);assert(second);assert.equal(e.s.issued,2);
});
check('Legacy and progressed schema-3 saves without a marker never opt into the new gate',()=>{
 const source=new R.Engine(),live=source.spawn(5);assert(live);source.arrive(live.id);source.takeOrder(live.id);source.s.served=1;source.s.total=1;delete source.s.firstServiceCycle;source.s.pace.next=4.25;
 const clean=R.cleanSave(source.snapshot());assert(clean);assert.equal(Object.hasOwn(clean,'firstServiceCycle'),false);assert.equal(clean.pace.next,4.25);assert.equal(R.firstServicePending(clean),false);
 const e=new R.Engine(clean);e.s.pace.next=0;const c=e.paceTick(.25);assert(c);assert.equal(e.s.issued,3);
});
check('Reload preserves a genuine first-cycle marker; first completed cycle remains complete after reload',()=>{
 const e=new R.Engine();e.s.firstServiceCycle=2;e.s.served=1;e.s.total=1;e.s.issued=1;e.s.dirtyTray={table:0,dish:'pizza',variant:'tomato',wash:2};e.s.tables[0]={status:'carried',dirty:null};
 const reload=new R.Engine(e.snapshot());assert.equal(reload.s.firstServiceCycle,2);assert.equal(R.firstServicePending(reload.s),true);
 reload.s.firstServiceCycle=3;const done=new R.Engine(reload.snapshot());assert.equal(done.s.firstServiceCycle,3);assert.equal(R.firstServicePending(done.s),false);
});
console.log(`${count} café onboarding checks passed`);
