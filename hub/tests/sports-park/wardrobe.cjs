/* Disposable browser profile. Exercises the canonical sports renderer and retained wardrobe. */
const {chromium,webkit}=require('/Users/deanguedo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.SPORTS_QA_OUTPUT||'/tmp/unicorn-sports-wardrobe';fs.mkdirSync(out,{recursive:true});
(async()=>{for(const [engine,name] of [[chromium,'Chromium'],[webkit,'WebKit']]){
 const b=await engine.launch({headless:true,...(name==='Chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 try{
 const p=await b.newPage({viewport:{width:932,height:430},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto((process.env.SPORTS_QA_URL||'http://localhost:8890/hub/')+'?qa=1&fits=1');
 await p.waitForFunction(()=>window.__WORLD_TEST__?.snapshot().loaded);
 await p.evaluate(()=>__WORLD_TEST__.navigate('park'));await p.waitForFunction(()=>__WORLD_TEST__.park.ready);
 const matrix=await p.evaluate(()=>{
  const P=__WORLD_TEST__.park,F=UWArt.fullSportsFits,M=F.manifest,canvas=()=>Object.assign(document.createElement('canvas'),{width:300,height:300});let cases=0;
  const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
  for(const f of M.frames.filter(f=>f.kind==='sports'))for(const i of M.items)for(const facing of [1,-1]){
   const bare=canvas(),dressed=canvas(),restored=canvas(),ctx=dressed.getContext('2d'),outfit={[i.slot]:i.item_id},state=JSON.stringify(outfit);
   P.actor(bare.getContext('2d'),f.id,150,270,facing,.4);
   ctx.translate(2,3);const before=ctx.getTransform();P.actor(ctx,f.id,148,267,facing,.4,outfit);const after=ctx.getTransform();
   P.actor(restored.getContext('2d'),f.id,150,270,facing,.4);
   const pixels=c=>c.getContext('2d').getImageData(0,0,300,300).data;
   if(same(pixels(bare),pixels(dressed)))throw Error('Missing wearable '+f.id+'/'+i.item_id+'/'+facing);
   if(!same(pixels(bare),pixels(restored)))throw Error('Unequip changed base '+f.id);
   if(JSON.stringify(outfit)!==state||before.a!==after.a||before.e!==after.e||before.f!==after.f)throw Error('Actor state leak');cases++;
  }
  return {cases,records:M.records.length,sportsPoses:M.frames.filter(f=>f.kind==='sports').length,wearables:M.items.length};
 });assert.equal(matrix.cases,460);
 // Golden captures supplied by the handoff are optional, but use the actual installed actor/ball methods.
 let golden=0;if(name==='Chromium'&&process.env.SPORTS_HANDOFF){
  for(const id of await p.evaluate(()=>UWFullSportsFitData.frames.filter(f=>f.kind==='sports').map(f=>f.id)))for(const variant of [0,3])for(const face of [1,-1]){
   const file=path.join(process.env.SPORTS_HANDOFF,'evidence/full-outfits',id+'__outfit'+variant+'__'+(face===1?'right':'left')+'.png');
   const expected='data:image/png;base64,'+fs.readFileSync(file).toString('base64');
   const match=await p.evaluate(async({id,variant,face,expected})=>{
    const P=__WORLD_TEST__.park,f=UWArt.fullSportsFits.frames[id],[w,h]=f.canvas,[px,py]=f.pivot_local,cv=Object.assign(document.createElement('canvas'),{width:w+192,height:h+192}),c=cv.getContext('2d',{willReadFrequently:true});c.fillStyle='#eee7de';c.fillRect(0,0,cv.width,cv.height);
    const eq=variant===0?{head:'bow',body:'tee',accessory:'beads'}:{head:'legacy-space',body:'raincoat',accessory:'prize-moon-bag'},scale=1/f.scale_to_logical,x=96+(face===1?px:w-px),y=96+py;
    const ball=!f.embedded_ball&&f.ball?P.anchor(id,x,y,face,false,scale):null;if(ball&&f.ball.layer==='back')P.ballDraw(c,ball);P.actor(c,id,x,y,face,scale,eq);if(ball&&f.ball.layer==='front')P.ballDraw(c,ball);
    const im=new Image();im.src=expected;await im.decode();const reference=Object.assign(document.createElement('canvas'),{width:im.width,height:im.height}),r=reference.getContext('2d');r.drawImage(im,0,0);const a=c.getImageData(0,0,cv.width,cv.height).data,b=r.getImageData(0,0,im.width,im.height).data;return a.length===b.length&&a.every((v,i)=>v===b[i])?{same:true}:{same:false,actual:cv.toDataURL()};
   },{id,variant,face,expected});if(!match.same)fs.writeFileSync(out+'/golden-failure.png',Buffer.from(match.actual.split(',')[1],'base64'));assert.ok(match.same,file);golden++;
  }
 }
 await p.evaluate(async()=>{const s=__WORLD_TEST__.service;await s.run('earn',{game:'cafe',event:{kind:'import',coins:100,id:'wardrobe-test-credit'}},'wardrobe-test-credit');await s.run('buy',{item:'rainbow-dress'},'wardrobe-test-dress');await s.run('buy',{item:'sunhat'},'wardrobe-test-hat');await s.run('buy',{item:'satchel'},'wardrobe-test-bag');await s.run('outfit',{outfit:{head:'sunhat',body:'rainbow-dress',accessory:'satchel'}},'wardrobe-test-equip');});
 const profile=await p.evaluate(()=>JSON.stringify(__WORLD_TEST__.service.value));
 for(const mode of ['basketball','tennis','volleyball']){
  const used=await p.evaluate(mode=>{const Q=__WORLD_TEST__,P=Q.park;P.begin(mode,true);const seen=[],draw=UWArt.fullSportsFits.actor;UWArt.fullSportsFits.actor=function(...args){seen.push(args[7]);return draw(...args);};P.w.draw();UWArt.fullSportsFits.actor=draw;return seen.some(o=>o?.body==='rainbow-dress'&&o?.accessory==='satchel');},mode);assert.ok(used,'Player outfit passed through actual scene: '+mode);
  await p.waitForTimeout(150);await p.screenshot({path:out+'/'+name.toLowerCase()+'-'+mode+'.png'});
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(__WORLD_TEST__.service.value)),profile);
 await p.reload();await p.waitForFunction(()=>__WORLD_TEST__.snapshot().loaded&&__WORLD_TEST__.park.ready);
 assert.equal(await p.evaluate(()=>JSON.stringify(__WORLD_TEST__.service.value)),profile);
 await p.setViewportSize({width:393,height:852});await p.waitForFunction(()=>__WORLD_TEST__.snapshot().portrait);await p.setViewportSize({width:852,height:393});await p.waitForFunction(()=>!__WORLD_TEST__.snapshot().portrait);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+name.toLowerCase()+'-results.json',JSON.stringify({engine:name,...matrix,golden,profileRetained:true,errors},null,2));console.log('PASS',name,matrix,'golden',golden,'equipped scenes/reload/portrait');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
