/* Browser interaction checks; these do not establish child or physical-device acceptance. */
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const output=process.env.OUTPUT_DIR||'/tmp/unicorn-restaurant-help';fs.mkdirSync(output,{recursive:true});
const results=[];
(async()=>{for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:8890/game/build/')+'?qa=1');await page.waitForFunction(()=>window.__RR_TEST__?.mode==='customize');
  await page.locator('[data-action="open"]').tap();
  const fixture=async({phase='waiting',helper=false,cook=null,reduced=false}={})=>page.evaluate(({phase,helper,cook,reduced})=>{
   const e=new RR.Engine(),c=e.spawn();c.table=3;c.type='blue';c.dish=cook||'icecream';c.variant=cook?RR.RECIPES[cook].variants[0].id:'vanilla';e.arrive(c.id);e.s.coins=3;e.s.settings.reduced=reduced;e.s.settings.muted=true;e.s.pace.next=20;
   if(phase==='ordered'||cook)e.takeOrder(c.id);if(cook)e.startRecipe(c.id,cook);if(helper)e.grantHelper('pink','local:1:morning');
   __RR_TEST__.loadFixture(e.snapshot());__RR_TEST__.setPlayer(445,911);__RR_TEST__.updateHUD(true);__RR_TEST__.drawWorld();if(cook)__RR_TEST__.openCooking();return c.id;
  },{phase,helper,cook,reduced});
  const shot=async(file)=>{await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));await new Promise(requestAnimationFrame);});await page.screenshot({path:path.join(output,name+file)});};
  const check=(label)=>{results.push({browser:name,name:label,status:'pass'});console.log('PASS',name,label);};
  await fixture();await page.locator('[data-helper="pink"]').tap();
  assert.equal(await page.evaluate(()=>__RR_TEST__.engine.s.coins),2);assert(await page.evaluate(()=>__RR_TEST__.engine.helperActivity(__RR_TEST__.engine.s.helpers[0]).happy>0));
  await page.waitForFunction(()=>__RR_TEST__.engine.s.helpers[0].task?.kind==='order');assert.match(await page.locator('[data-helper="pink"]').getAttribute('aria-label'),/taking an order/);
  await shot('-helper.png');check('Native helper tap hires once and exposes pictured job/happy pose');
  await fixture();assert.equal(await page.locator('.order-picture-action .favourite-picture').count(),1);await page.locator('.order-picture-action').tap();
  assert.equal(await page.evaluate(()=>__RR_TEST__.metrics().goal?.kind),'table');check('Favourite picture order tap walks to the waiting guest');
  await fixture({phase:'ordered'});await page.locator('.order-picture-action').tap();assert.equal(await page.evaluate(()=>__RR_TEST__.metrics().goal?.kind),'kitchen');check('Taken picture order tap walks to the kitchen');
  await fixture();await page.evaluate(()=>{__RR_TEST__.dismissPictureHint();__RR_TEST__.updatePictureHint(7);});assert.equal(await page.locator('#picture-hint').isVisible(),false);
  await page.evaluate(()=>__RR_TEST__.updatePictureHint(1.1));assert(await page.locator('#picture-hint').isVisible());
  const player=await page.evaluate(()=>({...__RR_TEST__.engine.s.player}));await page.locator('#picture-hint').tap();assert(await page.evaluate(()=>__RR_TEST__.pictureHint.playing));assert(await page.locator('.hint-hand').isVisible());
  {const hand=await page.locator('.hint-hand').boundingBox(),target=await page.locator('#primary').boundingBox();assert(Math.abs(hand.x+17-target.x-target.width/2)<25&&Math.abs(hand.y+9-target.y-target.height/2)<25,'demo points at action on its first frame');}
  await shot('-navigation-hint.png');await page.waitForFunction(()=>!__RR_TEST__.pictureHint.playing,{},{timeout:5000});assert.deepEqual(await page.evaluate(()=>__RR_TEST__.engine.s.player),player);check('Eight-second optional navigation hint ends without moving the player');
  await page.evaluate(()=>__RR_TEST__.updatePictureHint(8.1));await page.locator('#picture-hint').tap();await page.locator('#menu').tap();assert.equal(await page.evaluate(()=>__RR_TEST__.pictureHint.playing),false);await page.locator('[data-action="resume"]').tap();check('Ordinary interaction dismisses the demo without consuming the tap');
  await fixture({cook:'pizza'});await page.evaluate(()=>__RR_TEST__.updatePictureHint(8.1));await page.locator('#picture-hint').tap();assert.equal(await page.evaluate(()=>__RR_TEST__.pictureHint.gesture),'rub');
  const prep=await page.evaluate(()=>({...__RR_TEST__.engine.prep}));{const hand=await page.locator('.hint-hand').boundingBox(),board=await page.locator('#work-canvas').boundingBox();assert(Math.abs(hand.x+17-board.x-board.width/2)<70&&Math.abs(hand.y+9-board.y-board.height/2)<20,'cooking demo points to the food');}await shot('-cooking-hint.png');assert.equal(await page.evaluate(()=>__RR_TEST__.engine.prep.p),prep.p);
  await page.locator('#prep-action').tap();assert.equal(await page.evaluate(()=>__RR_TEST__.engine.prep.p),prep.p+1);assert.equal(await page.evaluate(()=>__RR_TEST__.pictureHint.playing),false);check('Cooking demo changes no recipe progress and the next native tap still works');
  await fixture({cook:'soup'});await page.evaluate(()=>{const e=__RR_TEST__.engine;while(e.prep.step<1)e.act();__RR_TEST__.openCooking();__RR_TEST__.updatePictureHint(8.1);});await page.locator('#picture-hint').tap();assert.equal(await page.evaluate(()=>__RR_TEST__.pictureHint.gesture),'tap');assert.equal(await page.evaluate(()=>__RR_TEST__.engine.prep.variant),null);await page.locator('[data-variant="carrot"]').tap();assert.equal(await page.evaluate(()=>__RR_TEST__.engine.prep.variant),'carrot');check('Choice hint points to the requested ingredient without selecting it');
  await fixture({cook:'pizza',reduced:true});await page.evaluate(()=>{__RR_TEST__.updatePictureHint(8.1);__RR_TEST__.startPictureHint();__RR_TEST__.updatePictureHint(.1);});const first=await page.locator('.hint-hand').boundingBox();await page.evaluate(()=>__RR_TEST__.updatePictureHint(.6));assert.deepEqual(await page.locator('.hint-hand').boundingBox(),first);check('Reduced-motion hint stays still');
  await page.setViewportSize({width:568,height:320});await fixture();await page.evaluate(()=>__RR_TEST__.updatePictureHint(8.1));
  for(const selector of ['.order-picture-action','#picture-hint']){const b=await page.locator(selector).boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=568&&b.y+b.height<=320,selector+' inside viewport');assert(b.width>=44&&b.height>=44,selector+' usable touch target');}
  await shot('-small-world.png');await fixture({cook:'pizza'});await page.evaluate(()=>__RR_TEST__.updatePictureHint(8.1));await page.locator('#picture-hint').tap();await shot('-small-cooking.png');check('Picture actions and optional hints fit a 568×320 phone viewport');
  assert.deepEqual(errors,[]);check('No browser runtime errors');
 }catch(error){results.push({browser:name,status:'fail',error:error.stack});console.error(name,error.stack);process.exitCode=1;}finally{await browser.close();}
}fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));})().catch(error=>{console.error(error);process.exitCode=1;});
