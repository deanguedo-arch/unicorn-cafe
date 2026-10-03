/* Native DOM simulation integration check, not a real browser.
 * Uses actual app.js + actual kitchen.js, DOM clicks and a native Canvas bridge.
 * Run: node tests/integration-tests.cjs (development dependencies documented in
 * controller-tests.cjs). No alternate gameplay path or controller mutation.
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {boot,start,noErrors,IDS,opened}=require('./controller-tests.cjs');
const ROOT=path.resolve(__dirname,'..');
const result={kind:'Actual controller + actual renderer integration in jsdom/native Canvas',
 timestamp:new Date().toISOString(),
 runtime:'jsdom DOM; @napi-rs/canvas real Image and CanvasRenderingContext2D; deterministic animation timers',
 actualFiles:['src/index.html','src/assets.js','src/recipes.js','src/app.js','src/kitchen.js'],
 limitations:['No browser layout engine','No real iPhone Safari','No physical touch input','Audio interface is simulated','No service-worker execution'],
 cases:[]};
result.sourceSha256=Object.fromEntries(result.actualFiles.map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,n))).digest('hex')]));
function pixels(e){
  const data=e.nativeCanvas.getContext('2d').getImageData(0,0,e.nativeCanvas.width,e.nativeCanvas.height).data;
  let opaque=0;for(let i=3;i<data.length;i+=4)if(data[i])opaque++;
  const png=e.nativeCanvas.toBuffer('image/png');
  return{width:e.nativeCanvas.width,height:e.nativeCanvas.height,opaquePixels:opaque,pngBytes:png.length,sha256:crypto.createHash('sha256').update(png).digest('hex')};
}
(async()=>{
 try{
  const e=await boot({nativeRenderer:true,width:640,height:360});start(e);
  assert.equal(e.decoded.size,Object.keys(e.w.ART).length);
  for(const id of IDS){
    const beforeFrames=e.renderStats.frames,beforeDraws=e.renderStats.drawCalls;assert.equal(e.snap().orderId,id);e.choose(id);
    const recipe=e.w.RECIPES.find(r=>r.id===id),steps=[];
    for(let index=0;index<recipe.steps.length;index++){
      const step=recipe.steps[index];assert.equal(e.snap().progress.active.stepIndex,index);
      e.clock.advance(20);assert.equal(e.rendererSnapshot().recipeId,id);assert.equal(e.rendererSnapshot().stepIndex,index);
      for(let n=0;n<step.count;n++){
        e.click('cook-button');e.clock.advance(20);
        if(n<step.count-1)assert.equal(e.rendererSnapshot().progress,(n+1)/step.count);
      }
      e.clock.advance(step.gesture==='bake'?1160:560);
      assert.equal(e.snap().progress.active.stepIndex,index+1);assert.equal(e.rendererSnapshot().stepIndex,index+1);
      steps.push({id:step.id,tapActions:step.count,framesDrawn:e.renderStats.frames-beforeFrames});
    }
    e.clock.advance(64);assert.equal(e.snap().progress.active.phase,'ready');assert.equal(e.rendererSnapshot().phase,'ready');
    assert.equal(e.rendererSnapshot().recipeId,id);assert.ok(e.renderStats.lastFrameSources.includes(e.w.ART[recipe.finalArt]),'Actual final bitmap drawn for '+id);
    const frame=pixels(e);assert.ok(frame.opaquePixels>640*360*.8);assert.ok(frame.pngBytes>10000);
    e.click('cook-button');assert.equal(e.snap().progress.pending.type,'correct');assert.equal(e.snap().progress.stamps[id],1);
    assert.equal(e.snap().progress.served,IDS.indexOf(id)+1);e.click('next-button');e.clock.advance(20);noErrors(e);
    result.cases.push({name:id+' full recipe, native frames, correct serve',status:'PASS',steps,
      frames:e.renderStats.frames-beforeFrames,nativeImageDraws:e.renderStats.drawCalls-beforeDraws,finalFrame:frame});
  }
  assert.equal(e.snap().progress.served,7);assert.equal(Object.keys(e.snap().progress.stamps).length,7);
  e.choose('soup');e.clock.advance(32);e.resizeTo(320,220);e.clock.advance(64);
  assert.equal(e.nativeCanvas.width,320);assert.equal(e.nativeCanvas.height,220);
  e.click('cook-button');e.clock.advance(32);assert.equal(e.rendererSnapshot().recipeId,'soup');assert.ok(e.renderStats.lastFrameSources.length>0);
  e.resizeTo(800,270);e.clock.advance(64);assert.equal(e.nativeCanvas.width,800);assert.equal(e.nativeCanvas.height,270);
  e.click('home-button');e.clock.advance(32);e.click('start-button');e.clock.advance(32);assert.equal(e.rendererSnapshot().recipeId,'soup');noErrors(e);
  result.cases.push({name:'Actual renderer resize and home/resume bridge',status:'PASS',sizes:[[320,220],[800,270]],finalFrame:pixels(e)});
  result.summary={total:result.cases.length,passed:result.cases.length,failed:0,allSevenCorrectServes:7,
    imagesDecoded:e.decoded.size,framesDrawn:e.renderStats.frames,nativeImageDrawCalls:e.renderStats.drawCalls};
 }catch(error){
  result.cases.push({name:'Integration execution',status:'FAIL',error:error.stack});
  result.summary={total:result.cases.length,passed:result.cases.filter(c=>c.status==='PASS').length,failed:1};process.exitCode=1;
 }finally{
  for(const e of opened){try{e.close();}catch(_){}}
  fs.writeFileSync(path.join(__dirname,'integration-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result.summary));
  if(result.summary.failed)console.error(result.cases[result.cases.length-1].error);
 }
})();
