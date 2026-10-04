/* Verify complete scoop/cone pixels before checking responsive card placement. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:844,height:390}});
 const url=new URL(process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../Sneaky-Unicorn-Restaurant-v2.0.0.html')).href);url.searchParams.set('qa','1');
 await page.goto(url.href);await page.waitForFunction(()=>window.__RR_TEST__);
 const results=await page.evaluate(async()=>{
  function bounds(canvas){const {width:w,height:h}=canvas,p=canvas.getContext('2d').getImageData(0,0,w,h).data;let left=w,top=h,right=-1,bottom=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]){count++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}return {left,top,right,bottom,count};}
  const rows=[];
  for(const variant of ['strawberry','vanilla']){
   for(const [step,p] of [[1,0],[2,0],[2,1],[2,2],[3,0],[4,0]]){
    const prep={dish:'icecream',step,p,variant,done:step===4},frame=document.createElement('canvas');frame.width=320;frame.height=280;RRArt.drawFood(frame.getContext('2d'),'icecream',variant,prep);
    const expanded=document.createElement('canvas');expanded.width=400;expanded.height=400;const ctx=expanded.getContext('2d');ctx.translate(40,60);RRArt.drawFood(ctx,'icecream',variant,prep);
    rows.push({variant,step,p,frame:bounds(frame),expanded:bounds(expanded)});
   }
   const image=new Image();image.src=RRArt.foodData('icecream',variant);await image.decode();const card=document.createElement('canvas');card.width=image.naturalWidth;card.height=image.naturalHeight;card.getContext('2d').drawImage(image,0,0);
   rows.push({variant,card:{width:card.width,height:card.height,bounds:bounds(card)}});
  }
  return rows;
 });
 for(const row of results){if(row.frame){assert.equal(row.frame.count,row.expanded.count,'Food pixels clipped by 320x280 source frame');assert(row.frame.top>=8&&row.frame.bottom<272,'Cone must leave vertical breathing room');assert(row.frame.left>=8&&row.frame.right<312,'Cone must leave horizontal breathing room');}else{const {width,height,bounds:b}=row.card;assert(width<height,'Ice-cream card image must have a portrait canvas');assert(b.top>=8&&b.bottom<=height-9&&b.left>=8&&b.right<=width-9,'Card artwork must have clear padding on every edge');}}
 const report={method:'Actual renderer pixels compared with an expanded canvas, both flavours at six preparation states; full card pictures have transparent padding on all four edges.',passed:results.length,results};
 if(process.env.ICECREAM_REPORT)fs.writeFileSync(process.env.ICECREAM_REPORT,JSON.stringify(report,null,2)+'\n');
 console.log(`PASS ${results.length} ice-cream pixel checks: no cropped scoops/cones; both card pictures fit with padding`);
 await browser.close();
})();
