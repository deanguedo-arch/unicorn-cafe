const {chromium}=require('/Users/deanguedo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.FIT_OUTPUT||path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const p=await b.newPage({viewport:{width:1100,height:760},hasTouch:true}),errors=[],missing=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 try{
 await p.goto('http://127.0.0.1:8790/hub/trials/fit-v1/');await p.waitForFunction(()=>window.__FIT_REVIEW__?.state.ready);
 const comparisons=await p.evaluate(async()=>{
  const checks=[];
  for(const r of UWFitTrial.manifest.records){
   const actual=document.createElement('canvas');actual.width=actual.height=512;
   actual.getContext('2d').fillStyle='#ffffff';actual.getContext('2d').fillRect(0,0,512,512);
   UWFitTrial.draw(actual.getContext('2d'),r.frame_id,...r.pivot_stage);
   const im=new Image();im.src='previews/'+r.frame_id+'__right.png';await im.decode();
   const expected=document.createElement('canvas');expected.width=expected.height=512;expected.getContext('2d').fillStyle='#ffffff';expected.getContext('2d').fillRect(0,0,512,512);expected.getContext('2d').drawImage(im,0,0);
   const a=actual.getContext('2d').getImageData(0,0,512,512).data,e=expected.getContext('2d').getImageData(0,0,512,512).data;
   let max=0,meaningful=0;for(let i=0;i<a.length;i+=4){if(a[i+3]<10&&e[i+3]<10)continue;for(let k=0;k<4;k++){const d=Math.abs(a[i+k]-e[i+k]);max=Math.max(max,d);if(d>3)meaningful++;}}
   checks.push({frame:r.frame_id,maxChannelDifference:max,channelsBeyondRounding:meaningful});
  }return checks;
 });
 for(const c of comparisons)assert.equal(c.channelsBeyondRounding,0,JSON.stringify(c));results.push({name:'All five full-canvas renders match the supplied right-facing composites within browser alpha rounding',comparisons});
 const names=['Standing','Running sample','Celebrating','Bike sample','Skateboard sample'];
 for(const name of names){await p.getByRole('button',{name,exact:true}).click();for(const face of [false,true]){
  if(await p.evaluate(()=>__FIT_REVIEW__.state.flip)!==face)await p.locator('#flip').click();
  for(let mask=0;mask<8;mask++){for(const [n,id]of ['bow','tee','beads'].entries())await p.locator('#'+id).setChecked(!!(mask&(1<<n)));assert.equal(Object.values(await p.evaluate(()=>__FIT_REVIEW__.state.outfit)).filter(Boolean).length,mask.toString(2).replace(/0/g,'').length);}
  for(const id of ['bow','tee','beads'])await p.locator('#'+id).check();
 }
 await p.screenshot({path:path.join(out,name.replaceAll(' ','-')+'.png')});}
 results.push({name:'Five poses, both facings and all eight item combinations work without errors',combinations:80});
 await p.getByRole('button',{name:'Standing',exact:true}).click();await p.locator('#move').click();await p.waitForTimeout(200);
 await p.setViewportSize({width:393,height:852});await p.locator('#rotate').waitFor({state:'visible'});assert.equal(await p.evaluate(()=>__FIT_REVIEW__.state.portrait),true);
 for(const [width,height]of [[852,393],[568,320]]){await p.setViewportSize({width,height});await p.locator('#rotate').waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.waitForTimeout(150);assert.ok(await p.locator('.controls').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));await p.screenshot({path:path.join(out,`landscape-${width}.png`)});}
 await p.locator('#move').click();await p.locator('#reset').click();const box=await p.locator('#trial').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height*.6);await p.mouse.down();await p.mouse.move(box.x+box.width*.65,box.y+box.height*.65);await p.mouse.up();assert.ok((await p.evaluate(()=>__FIT_REVIEW__.state.x))>320);
 results.push({name:'Drag and movement controls work; portrait suspends and small landscape resumes without horizontal overflow'});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.equal(await p.evaluate(()=>localStorage.length),0);
 results.push({name:'No browser errors, missing images or save writes'});
 fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify({results,errors,missing,physicalDevice:false,productionWardrobeChanged:false},null,2)+'\n');console.log(JSON.stringify(results,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
