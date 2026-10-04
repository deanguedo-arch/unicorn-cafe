/* Production UI approach/serve/exit checks with explicit customer fixtures. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{const page=await browser.newPage({viewport:{width:932,height:430},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../Sneaky-Unicorn-Restaurant-v2.0.0.html')).href+'?qa=1');await page.waitForFunction(()=>window.__RR_TEST__);
 const types=['pink','human','blue','worker','manager'];
 for(let i=0;i<5;i++){
  await page.evaluate(({i,type})=>{const s=RR.fresh(),t=RR.TABLES[i];s.customers=[{id:1,table:i,dish:'pizza',variant:'tomato',type,phase:'waiting',x:0,y:0,eat:0}];s.issued=1;s.nextId=2;s.player={x:t.meet.x,y:t.meet.y+120,facing:-1};__RR_TEST__.loadFixture(s)}, {i,type:types[i]});
  await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>__RR_TEST__.snapshot().customers[0].phase),'waiting','distant position must not take order');
  await page.locator('#primary').click();await page.waitForFunction(()=>__RR_TEST__.snapshot().customers[0]?.phase==='ordered');
  const q=await page.evaluate(()=>{const s=__RR_TEST__.snapshot(),c=s.customers[0],t=RR.TABLES[c.table];return {distance:Math.hypot(s.player.x-c.x,s.player.y-c.y),seat:c.x===t.seat.x&&c.y===t.seat.y}});assert(q.seat);assert(q.distance<115,'taking order must happen beside seated guest');
  await page.evaluate(()=>{const s=__RR_TEST__.snapshot(),t=RR.TABLES[s.customers[0].table];s.tray={orderId:1,dish:'pizza',variant:'tomato'};s.player={x:t.meet.x,y:t.meet.y+120,facing:-1};__RR_TEST__.loadFixture(s)});
  await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>__RR_TEST__.snapshot().customers[0].phase),'ordered','distant position must not serve');
  await page.locator('#primary').click();await page.waitForFunction(()=>__RR_TEST__.snapshot().customers[0]?.phase==='eating');
  assert(await page.evaluate(()=>{const s=__RR_TEST__.snapshot(),c=s.customers[0];return Math.hypot(s.player.x-c.x,s.player.y-c.y)<115}));
  await page.evaluate(()=>{const e=__RR_TEST__.engine;e.finishEating(1);e.startLeaving(1);__RR_TEST__.updateHUD(true)});
  await page.waitForFunction(()=>!__RR_TEST__.snapshot().customers.some(c=>c.id===1),{},{timeout:30000});
 }
 await page.evaluate(()=>{const s=RR.fresh();s.customers=[{id:1,table:0,dish:'pizza',variant:'tomato',type:'pink',phase:'arriving',...RR.ENTRY,eat:0}];s.issued=1;s.nextId=2;s.player={x:997,y:650,facing:1};__RR_TEST__.loadFixture(s)});
 await page.waitForFunction(()=>__RR_TEST__.snapshot().customers[0]?.phase==='waiting',{}, {timeout:30000});
 assert(await page.evaluate(()=>{const c=__RR_TEST__.snapshot().customers[0];return c.x===RR.TABLES[0].seat.x&&c.y===RR.TABLES[0].seat.y}));
 await page.evaluate(()=>{const s=RR.fresh();s.issued=5;s.nextId=6;s.player={x:997,y:650,facing:1};s.decor.tablecloth='gingham';s.customers=['pink','human','blue','worker','manager'].map((type,i)=>({id:i+1,table:i,dish:RR.MENU[i],variant:RR.RECIPES[RR.MENU[i]].variants[0].id,type,phase:i===1?'eating':'ordered',...RR.TABLES[i].seat,eat:0}));__RR_TEST__.loadFixture(s);window.seatedDraws=[];const original=RRArt.sprite;RRArt.sprite=function(c,key,...args){if(key.startsWith('guest_seated_'))seatedDraws.push(key);return original(c,key,...args)}});
 await page.waitForTimeout(100);const drawn=await page.evaluate(()=>[...new Set(seatedDraws)]);for(const type of types)assert(drawn.includes('guest_seated_'+type));
 await page.screenshot({path:process.env.DINING_SCREENSHOT||'/tmp/unicorn-seated-dining.png'});
 const choices=await page.evaluate(()=>{const d=__RR_TEST__.snapshot().decor;return RR.CUSTOMIZATION.tableType.flatMap(shape=>RR.CUSTOMIZATION.tablecloth.map(cloth=>RRArt.customData('tableType',shape,{...d,tablecloth:cloth})));});assert.equal(new Set(choices).size,30);
 await page.reload();await page.waitForFunction(()=>window.__RR_TEST__);await page.locator('[data-action=open]').click();assert(await page.evaluate(()=>__RR_TEST__.snapshot().customers.every(c=>['arriving','leaving'].includes(c.phase)||c.x===RR.TABLES[c.table].seat.x&&c.y===RR.TABLES[c.table].seat.y)));
 assert.deepEqual(errors,[]);const report={passed:true,types:5,tableClothCombinations:30,method:'Actual UI approach and serving at five tables from outside the interaction radius; chair anchoring, exit paths, arrival from the entrance, reload, seated asset drawing and distinct customization previews. Fixtures accelerate customer state; Chromium simulation, not physical iPhone testing.',errors};fs.writeFileSync(process.env.DINING_REPORT||'/tmp/unicorn-seated-dining.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
