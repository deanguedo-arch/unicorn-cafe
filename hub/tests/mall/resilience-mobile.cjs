/* Fresh browser storage only: interrupted earnings, atomic rollback and mobile play. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/deanguedo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.WORLD_QA_URL||'http://localhost:8890/hub/',out=process.env.WORLD_QA_OUTPUT||'/tmp/unicorn-mall-resilience-mobile';
fs.mkdirSync(out,{recursive:true});const results=[],errors=[];
function check(name,details){results.push({name,pass:true,details});console.log('PASS',name);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await browser.newContext({viewport:{width:568,height:320},hasTouch:true}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>__WORLD_TEST__.snapshot().loaded);
  const profile=()=>p.evaluate(()=>__WORLD_TEST__.service.value);
  const open=async kind=>{await p.evaluate(kind=>__WORLD_TEST__.mall.open(kind),kind);await p.waitForFunction(()=>__WORLD_TEST__.snapshot().panel);};
  const close=async()=>{await p.locator('#panel-close').click();await p.waitForFunction(()=>!__WORLD_TEST__.snapshot().panel);};
  const enterCafe=async()=>{
   await p.evaluate(()=>{const w=__WORLD_TEST__;w.navigate('village');const d=w.doors.find(d=>d.id==='cafe');w.place(d.x,d.y+45);w.enter();});
   await p.waitForFunction(()=>__WORLD_TEST__.snapshot().frames.find(f=>f.id==='cafe')?.ready);
   return p.frames().find(f=>f.url().includes('/game/build/'));
  };
  const payingCustomer=async(f,id)=>f.evaluate(id=>{
   const s=__RR_TEST__.snapshot();s.customers=[{id,table:0,dish:'pizza',variant:'tomato',type:'pink',phase:'paying',x:RR.CASHIER.x,y:RR.CASHIER.y,eat:1.2}];s.issued=1;s.nextId=id+1;__RR_TEST__.loadFixture(s);
  },id);
  await p.goto(base+'?qa=1');await ready();
  let f=await enterCafe();await f.evaluate(()=>__RR_TEST__.openRestaurant());await p.waitForTimeout(100);
  await p.evaluate(async()=>{const s=__WORLD_TEST__.service;for(let i=0;i<15;i++)await s.run('earn',{game:'adventure',event:{id:'mobile-funds-'+i,kind:'win'}},'mobile-funds-'+i);});
  // The real child bridge awaits a receipt; retrying the same request cannot re-charge.
  const beforeRequest=(await profile()).coins;
  const request=await f.evaluate(()=>__RR_TEST__.bridge.request('buy',{item:'scarf',equip:true},'qa-child-buy-scarf'));
  assert.equal(request.ok,true);assert.equal((await profile()).coins,beforeRequest-3);assert.equal((await profile()).outfit.accessory,'scarf');
  await f.evaluate(()=>__RR_TEST__.bridge.request('buy',{item:'scarf',equip:true},'qa-child-buy-scarf'));
  assert.equal((await profile()).coins,beforeRequest-3);
  const rejection=await f.evaluate(()=>__RR_TEST__.bridge.request('equip',{item:'prize-star-bow'},'qa-child-locked-equip'));
  assert.equal(rejection.ok,false);assert.equal(rejection.error,'owned');
  const queueFailure=await f.evaluate(async()=>{const set=Storage.prototype.setItem,link=__RR_TEST__.bridge;Storage.prototype.setItem=function(key,value){if(key===link.store)throw new DOMException('QA outbox full','QuotaExceededError');return set.call(this,key,value);};const r=await link.request('buy',{item:'bike'},'qa-unpersisted-request');Storage.prototype.setItem=set;__RR_TEST__.save();return r;});
  assert.equal(queueFailure.error,'storage');assert.equal((await profile()).coins,beforeRequest-3);assert.ok(!(await profile()).owned.includes('bike'));
  check('Child purchase/equip requests are acknowledged; repeated purchase charges once and unowned equip is rejected');
  // Parent cannot commit this earning yet. The native outbox must survive a reload.
  await open('backpack');
  await payingCustomer(f,801);const blockedCoins=(await profile()).coins;
  await p.evaluate(()=>{const s=__WORLD_TEST__.service,run=s.run.bind(s);s.run=(action,args,...rest)=>action==='earn'&&args.event.kind==='payment'?Promise.reject(new UWProfile.WorldError('storage')):run(action,args,...rest);});
  await f.evaluate(()=>__RR_TEST__.tickRestaurant(.05));
  await f.waitForFunction(()=>JSON.parse(localStorage.getItem('unicorn-world-cafe-bridge-v1')).outbox.some(e=>e.kind==='payment'));
  assert.equal((await profile()).coins,blockedCoins);
  await p.reload();await ready();f=await enterCafe();await p.waitForFunction(coins=>__WORLD_TEST__.service.value.coins===coins+1,blockedCoins);
  await f.waitForFunction(()=>!JSON.parse(localStorage.getItem('unicorn-world-cafe-bridge-v1')).outbox.some(e=>e.kind==='payment'));
  check('Unacknowledged café earnings survive interruption and are paid exactly once on reconnect');
  // Fail the second write after the sidecar journal has durably recorded native progress.
  await open('backpack');
  await payingCustomer(f,802);const journalCoins=(await profile()).coins,nativeCoins=await f.evaluate(()=>__RR_TEST__.snapshot().coins);
  await f.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===RR.SAVE_KEY)throw new DOMException('QA native save failure','QuotaExceededError');return set.call(this,key,value);};__RR_TEST__.tickRestaurant(.05);});
  const pending=await f.evaluate(()=>JSON.parse(localStorage.getItem('unicorn-world-cafe-bridge-v1')).pendingNative);
  assert.equal(pending.coins,nativeCoins+1);assert.equal((await profile()).coins,journalCoins);
  await p.reload();await ready();f=await enterCafe();await p.waitForFunction(coins=>__WORLD_TEST__.service.value.coins===coins+1,journalCoins);
  assert.equal(await f.evaluate(()=>__RR_TEST__.snapshot().coins),nativeCoins+1);
  assert.equal(await f.evaluate(()=>!!JSON.parse(localStorage.getItem('unicorn-world-cafe-bridge-v1')).pendingNative),false);
  check('Native write failure recovers the journal and its earning without paying the customer twice');
  await p.locator('#return').click();await p.waitForFunction(()=>!__WORLD_TEST__.snapshot().active);
  // A real IndexedDB transaction abort between writes rolls both ownership and coins back.
  const abort=await p.evaluate(async()=>{
   const s=__WORLD_TEST__.service,before=JSON.stringify(s.value),db=s.db,transaction=db.transaction.bind(db);
   db.transaction=function(...args){const tx=transaction(...args),get=tx.objectStore.bind(tx);if(args[1]==='readwrite')tx.objectStore=function(name){const store=get(name);if(name==='state'){const put=store.put.bind(store);store.put=function(...values){const request=put(...values);queueMicrotask(()=>tx.abort());return request;};}return store;};return tx;};
   let rejected=false;try{await s.run('buy',{item:'bike',equip:true},'qa-aborted-bike');}catch(_){rejected=true;}db.transaction=transaction;await s.refresh();
   const receipt=await new Promise(resolve=>{const r=db.transaction('receipts').objectStore('receipts').get('qa-aborted-bike');r.onsuccess=()=>resolve(!!r.result);});
   return{rejected,unchanged:JSON.stringify(s.value)===before,receipt};
  });assert.deepEqual(abort,{rejected:true,unchanged:true,receipt:false});
  check('Interrupted IndexedDB purchase rolls back money, ownership, equipment and receipt together');
  await p.evaluate(()=>__WORLD_TEST__.navigate('boutique'));await open('shop');
  async function bottomRight(selector){const r=await p.locator(selector).boundingBox(),size=p.viewportSize();assert.ok(r&&r.x+r.width/2>size.width*.78&&r.y+r.height/2>size.height*.75,'Primary action remains at lower right');assert.ok(r.width>=44&&r.height>=44,'44px action target');}
  await bottomRight('.shop-actions .primary-action');await p.screenshot({path:out+'/mobile-boutique-right-action.png'});await close();
  await p.evaluate(()=>__WORLD_TEST__.navigate('arcade'));const demoCoins=(await profile()).coins;await open('catcher');await bottomRight('[data-action="start"]');assert.equal((await profile()).coins,demoCoins);await close();
  await open('bowling');await bottomRight('[data-action="start"]');await p.locator('[data-action="start"]').click();await p.waitForSelector('#round-canvas');await bottomRight('[data-action="roll"]');await p.screenshot({path:out+'/mobile-bowling-right-roll.png'});await close();
  check('Shop, free arcade instructions, paid-round start and bowling roll keep a 44px lower-right action');
  const touch=await context.newCDPSession(p);
  async function piecePoints(i){return p.evaluate(i=>{const m=__WORLD_TEST__.mall,r=m.puzzleRects(),cv=m.cv.getBoundingClientRect(),scale=Math.min(cv.width/m.cv.width,cv.height/m.cv.height),left=cv.x+(cv.width-m.cv.width*scale)/2,top=cv.y+(cv.height-m.cv.height*scale)/2;
   const pt=(x,y)=>({x:left+x*scale,y:top+y*scale});return{from:pt(r.tray.x,r.tray.y),to:pt(r.x+(i%r.n+.5)*r.cw,r.y+(Math.floor(i/r.n)+.5)*r.ch),height:r.ch*scale};},i);}
  async function touchPiece(i,cancel=false){const q=await piecePoints(i);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q.from]});for(let step=1;step<=8;step++){const t=step/8;await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:q.from.x+(q.to.x-q.from.x)*t,y:q.from.y+(q.to.y-q.from.y)*t}]});}await touch.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}
  await open('jigsaws');await p.waitForSelector('.puzzle-tile');assert.equal(await p.locator('[data-action="pieces"][data-pieces="16"] img').getAttribute('src').then(src=>src.endsWith('/grid16.png')),true);await p.locator('[data-action="pieces"][data-pieces="16"]').click();await bottomRight('[data-action="start"]');await p.locator('[data-action="start"]').click();await p.waitForSelector('#round-canvas');await bottomRight('[data-action="next-piece"]');
  await touchPiece(0);await p.waitForFunction(()=>__WORLD_TEST__.service.value.sessions['unicorns-1:16'].state.placed.includes(0));const q=await piecePoints(1);assert.ok(q.height>=40,'Large pieces on smallest landscape viewport');
  await touchPiece(1,true);assert.deepEqual(await p.evaluate(()=>__WORLD_TEST__.mall.round.state.placed),[0]);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q.from]});await p.setViewportSize({width:320,height:568});await p.waitForFunction(()=>__WORLD_TEST__.snapshot().portrait);assert.equal(await p.evaluate(()=>__WORLD_TEST__.mall.drag),null);assert.deepEqual(await p.evaluate(()=>__WORLD_TEST__.mall.round.state.placed),[0]);await p.screenshot({path:out+'/portrait-pause.png'});
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.setViewportSize({width:568,height:320});await touchPiece(1);await p.waitForFunction(()=>__WORLD_TEST__.service.value.sessions['unicorns-1:16'].state.placed.includes(1));await p.screenshot({path:out+'/mobile-jigsaw-16-touch.png'});
  const resumeCoins=(await profile()).coins;await close();await open('jigsaws');await p.locator('[data-action="start"]').click();await p.waitForSelector('#round-canvas');assert.equal((await profile()).coins,resumeCoins);assert.deepEqual(await p.evaluate(()=>__WORLD_TEST__.mall.round.state.placed),[0,1]);await close();
  check('16-piece phone jigsaw supports real touch snapping, touch cancellation, rotation suspension and free resume',{viewport:'568x320',pieceHeight:q.height});
  // Completion and prizes run through IndexedDB, even when the round score is zero.
  const prizes=await p.evaluate(async()=>{const s=__WORLD_TEST__.service;await s.run('prize',{item:'prize-rainbow-cape'});for(let i=0;i<5;i++){const r=await s.run('start',{game:'bowling'});await s.run('finish',{session:r.value.session.id,state:{throws:3,score:0,aim:0}});}const coins=s.value.coins,stamps=s.value.stamps,id=s.value.sessions.bowling.id;await Promise.all([s.run('finish',{session:id}),s.run('finish',{session:id})]);return{owned:s.value.owned.includes('prize-rainbow-cape'),stamps:s.value.stamps,duplicateSafe:coins===s.value.coins&&stamps===s.value.stamps};});
  assert.deepEqual(prizes,{owned:true,stamps:0,duplicateSafe:true});
  check('Five completed low-score rounds unlock the selected cosmetic; duplicate finishes award nothing extra');
  assert.deepEqual(errors,[]);check('No browser runtime exceptions during failure recovery or mobile play');
  fs.writeFileSync(out+'/QA-RESULTS.json',JSON.stringify({results,errors,physicalDevice:false,childReview:false},null,2));console.log('Evidence:',out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);fs.writeFileSync(out+'/QA-FAILURE.txt',e.stack);process.exit(1);});
