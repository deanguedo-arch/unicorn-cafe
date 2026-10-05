/* Traverse the reported chair/register gap with real directional input, no safePoint nudge. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH}),results=[];try{
for(const [width,height] of [[568,320],[667,375],[740,300],[844,390],[932,430],[967,897]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
await page.goto(process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../Sneaky-Unicorn-Restaurant-v2.0.0.html')).href+'?qa=1');await page.waitForFunction(()=>window.__RR_TEST__);
await page.evaluate(()=>{const s=RR.fresh();s.player={x:1475,y:550,facing:1};s.issued=5;s.nextId=6;__RR_TEST__.loadFixture(s);for(const y of [550,620,654,710,800,900])if(!RR.walkable(1475,y))throw Error('Reported aisle still blocked at '+y);});
await page.keyboard.down('ArrowDown');await page.waitForFunction(()=>__RR_TEST__.snapshot().player.y>=900,{},{timeout:4000});await page.keyboard.up('ArrowDown');
const down=await page.evaluate(()=>__RR_TEST__.snapshot().player);assert(Math.abs(down.x-1475)<1);
await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>__RR_TEST__.snapshot().player.y<=550,{},{timeout:4000});await page.keyboard.up('ArrowUp');
const up=await page.evaluate(()=>__RR_TEST__.snapshot().player);assert(Math.abs(up.x-1475)<1);
if(width===844||width===967){await page.evaluate(()=>{const s=__RR_TEST__.snapshot();s.player={x:1475,y:680,facing:1};__RR_TEST__.loadFixture(s)});await page.waitForTimeout(80);await page.screenshot({path:`/tmp/cafe-aisle-${width}.png`});await page.evaluate(()=>__RR_TEST__.showCustomizer(0));await page.waitForTimeout(80);await page.screenshot({path:`/tmp/cafe-designer-${width}.png`});}
results.push({width,height,downY:down.y,upY:up.y,manualTraversal:true});await page.close();}
fs.writeFileSync(process.env.AISLE_REPORT||'/tmp/unicorn-cashier-aisle.json',JSON.stringify({passed:results.length,results},null,2));console.log('PASS manual cashier aisle in both directions:',results.length,'viewports');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
