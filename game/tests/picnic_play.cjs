/* Actual picnic clicks, saved-state reloads and busy-room marker selection. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({isMobile:true,hasTouch:true}),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../Sneaky-Unicorn-Restaurant-v2.0.0.html')).href+'?qa=1';
 async function load(){await page.goto(url);await page.waitForFunction(()=>window.__RR_TEST__);}
 async function state(){return page.evaluate(()=>__RR_TEST__.snapshot());}
 async function reloadLunch(){const before=(await state()).lunch;await page.reload();await page.waitForFunction(()=>window.__RR_TEST__);await page.locator('[data-action=open]').click();assert.deepEqual((await state()).lunch,before);}
 for(const [width,height] of [[568,320],[844,390],[932,430]]){
  await page.setViewportSize({width,height});await load();
  for(const meal of ['pizza','pancakes','soup','smoothie']){
   await page.evaluate(()=>{const s=RR.fresh();s.customers=[];s.active=null;s.served=5;s.issued=5;__RR_TEST__.loadFixture(s);__RR_TEST__.openLunch();});
   await page.locator(`[data-meal=${meal}]`).click();
   await page.locator('[data-item=milk]').click();assert.equal((await state()).lunch.packed,0);
   for(const item of ['meal','fruit','milk']){await page.locator(`[data-item=${item}]`).click();if(width===568)await reloadLunch();}
   assert.equal((await state()).lunch.packed,3);
   await page.locator('[data-action=settings]').click();await page.locator('[data-action=toggle-audio]').click();await page.locator('[data-action=resume]').click();assert.equal(await page.evaluate(()=>__RR_TEST__.mode),'lunch');
   for(let i=0;i<5;i++){await page.locator('[data-action=lunch-act]').click();if(width===568)await reloadLunch();}
   assert.equal((await state()).lunch.bites,3);assert.equal((await state()).lunch.sips,2);
   await page.locator('[data-action=lunch-return]').click();assert.equal((await state()).phase,'afternoon');assert.equal(await page.evaluate(()=>__RR_TEST__.mode),'world');
   results.push({width,height,meal,passed:true});
  }
  await page.evaluate(()=>{const s=RR.fresh();s.customers=RR.TABLES.map((t,i)=>({id:i+1,table:i,dish:RR.MENU[i],variant:RR.RECIPES[RR.MENU[i]].variants[0].id,type:'human',phase:'ordered',x:t.seat.x,y:t.seat.y,eat:0}));s.issued=5;s.nextId=6;s.active=1;__RR_TEST__.loadFixture(s);__RR_TEST__.drawWorld();});
  const markers=await page.evaluate(()=>__RR_TEST__.metrics().hitboxes);assert(markers.length>0);
  for(const marker of markers){assert(marker.orderMarker);assert.equal(marker.w,54);assert.equal(marker.h,54);const stage=await page.locator('#stage').boundingBox();await page.mouse.click(stage.x+marker.x+27,stage.y+marker.y+27);assert.equal((await state()).active,marker.table+1);assert.equal(await page.locator('#order-pin img.food').count(),1);}
  assert.equal(await page.locator('.topbar .brand').isVisible(),false);
  const stage=await page.locator('#stage').boundingBox();assert.equal(stage.height,height);
  results.push({width,height,busyRoomMarkers:markers.length,passed:true});
 }
 await browser.close();assert.deepEqual(errors,[]);const report={method:'Isolated Chromium mobile viewports; actual UI clicks, reload after every picnic step at 568x320, five-customer fixtures. No physical-device certification.',cases:results.length,errors,results};fs.writeFileSync(process.env.PICNIC_REPORT||'/tmp/unicorn-picnic-play.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.cases,errors},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
