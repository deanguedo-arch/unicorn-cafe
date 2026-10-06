const {chromium}=require('/Users/deanguedo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const oracles=process.env.WARDROBE_ORACLES||'/tmp/unicorn-wardrobe-oracles',out=process.env.WORLD_QA_OUTPUT||'/tmp/unicorn-production-wardrobe';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const p=await b.newPage({viewport:{width:852,height:393},hasTouch:true}),errors=[],missing=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 try{
 await p.goto((process.env.WORLD_QA_URL||'http://localhost:8790/hub/')+'?qa=1');await p.waitForFunction(()=>__WORLD_TEST__.snapshot().loaded);
 const cases=JSON.parse(fs.readFileSync(path.join(oracles,'cases.json'))),failures=[];let checked=0,maxDifference=0;
 for(let start=0;start<cases.length;start+=19){
  const batch=cases.slice(start,start+19).map(c=>({...c,png:'data:image/png;base64,'+fs.readFileSync(path.join(oracles,c.oracle)).toString('base64')}));
  const checks=await p.evaluate(async cases=>{
   const checks=[],actual=document.createElement('canvas'),expected=document.createElement('canvas');actual.width=actual.height=expected.width=expected.height=512;
   for(const item of cases){const im=new Image();im.src=item.png;await im.decode();const base=UWArt.fitted.frames[item.frame],bounds=base.source_pose_anchors_logical.bounds,h=(bounds[3]-bounds[1])*2-(item.frame.startsWith('bike')?42:item.frame.startsWith('skateboard')?22:0);
    for(const flip of [false,true]){const a=actual.getContext('2d'),e=expected.getContext('2d');a.fillStyle='white';a.fillRect(0,0,512,512);e.clearRect(0,0,512,512);e.save();if(flip){e.translate(512,0);e.scale(-1,1);}e.drawImage(im,0,0);e.restore();
     UWArt.unicorn(a,flip?512-base.pivot_stage[0]:base.pivot_stage[0],base.pivot_stage[1],h,item.outfit,item.frame,flip);
     const pixels=a.getImageData(0,0,512,512).data,oracle=e.getImageData(0,0,512,512).data;let beyond=0,max=0;
     for(let i=0;i<pixels.length;i++){const d=Math.abs(pixels[i]-oracle[i]);max=Math.max(max,d);if(d>3)beyond++;}
     checks.push({label:item.label,frame:item.frame,flip,max,beyond});
    }
   }return checks;
  },batch);
  for(const c of checks){checked++;maxDifference=Math.max(maxDifference,c.max);if(c.beyond)failures.push(c);}
 }
 assert.deepEqual(failures,[]);results.push({name:'All 874 single-item/facing cases and 342 representative outfit/facing cases match independent Pillow compositions',checked,maxDifference});
 const gallery=await p.evaluate(()=>{const cv=document.createElement('canvas');cv.width=1600;cv.height=1050;const c=cv.getContext('2d');c.fillStyle='#eadff0';c.fillRect(0,0,cv.width,cv.height);UWArt.fitted.manifest.frame_order.forEach((frame,i)=>{const x=160+(i%5)*320,y=220+Math.floor(i/5)*260;UWArt.unicorn(c,x,y,155,{head:'bow',body:'tee',accessory:'beads'},frame,i%2===1);c.fillStyle='#694574';c.font='20px system-ui';c.textAlign='center';c.fillText(frame,x,y+24);});return cv.toDataURL();});fs.writeFileSync(path.join(out,'all-19-starter-poses.png'),Buffer.from(gallery.split(',')[1],'base64'));
 await p.evaluate(async()=>{const s=__WORLD_TEST__.service;for(let i=0;i<15;i++)await s.run('earn',{game:'adventure',event:{id:'wardrobe-funds-'+i,kind:'win'}},'wardrobe-funds-'+i);await s.run('buy',{item:'bike',equip:true});await s.run('buy',{item:'skateboard'});window.rideDraws=[];const draw=UWArt.unicorn;UWArt.unicorn=function(c,x,y,h,o,frame,...rest){rideDraws.push(frame);if(rideDraws.length>200)rideDraws.shift();return draw(c,x,y,h,o,frame,...rest);};});
 for(const ride of ['bike','skateboard']){
  await p.evaluate(async ride=>{await __WORLD_TEST__.service.run('equip',{item:ride});__WORLD_TEST__.navigate('track');__WORLD_TEST__.place(800,850);rideDraws.length=0;},ride);
  const q=await p.evaluate(()=>__WORLD_TEST__.screenPoint(1400,850));await p.mouse.click(q.x,q.y);await p.waitForTimeout(650);
  const frames=await p.evaluate(ride=>rideDraws.filter(f=>f.startsWith(ride)),ride);assert.equal(new Set(frames).size,4);
  assert.ok(frames.every(f=>new RegExp('^'+ride+'[0-3]$').test(f))); // Rendering may skip clock frames under load; it must never use a six-frame ground sequence.
  results.push({name:ride+' uses all four matching riding frames during actual movement'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);results.push({name:'No browser exceptions or missing wardrobe resources'});
 fs.writeFileSync(path.join(out,'QA-RESULTS.json'),JSON.stringify({results,errors,missing,physicalDevice:false},null,2)+'\n');console.log(JSON.stringify(results,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
