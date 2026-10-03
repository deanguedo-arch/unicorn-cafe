/* Development verification only. No dependencies are needed by the delivered game.
 * Run with Node 20+ and development packages jsdom@26 and @napi-rs/canvas.
 * Example: npm install --prefix /tmp/rainbow-kitchen-testdeps jsdom@26 @napi-rs/canvas
 * NODE_PATH=/tmp/rainbow-kitchen-testdeps/node_modules node tests/controller-tests.cjs
 *
 * Actual index.html, assets.js, recipes.js and app.js are loaded without rewriting.
 * User actions use DOM click/keydown/pointer events. RainbowKitchen.snapshot is
 * read-only observation. Timers are deterministic; audio and KitchenScene are
 * doubles. Every ART bitmap is decoded from its real bytes with native Canvas.
 * This is DOM simulation, not browser layout, Safari, audio or touch-device QA.
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
function dep(name){
  for(const root of [null,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'/tmp/rainbow-kitchen-testdeps/node_modules']){
    try{return require(root?path.join(root,name):name);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
  }
  throw new Error('Install development dependency '+name+' (see this file header).');
}
const {JSDOM,VirtualConsole}=dep('jsdom'),{loadImage,createCanvas,Image:NativeImage}=dep('@napi-rs/canvas');
const ROOT=path.resolve(__dirname,'..'),SRC=path.join(ROOT,'src');
const SAVE_KEY='sneaky-unicorn-rainbow-kitchen:v1';
const IDS=['pizza','coffee','cupcakes','icecream','hamburger','soup','chicken'];
const imageCache=new Map(),opened=[];
const report={kind:'DOM simulation using jsdom and actual controller files',timestamp:new Date().toISOString(),
  renderer:'KitchenScene double; renderer has separate native Canvas verification',
  artwork:'All mapped production ART files decoded from actual bytes using @napi-rs/canvas',
  input:'Real DOM click, keydown and synthetic pointer events; no internal controller mutation',
  limitations:['No browser layout engine','No physical touch device','No iPhone Safari','Audio API calls simulated, not audible playback','Service workers not simulated','Pointer capture geometry is simulated'],
  sourceSha256:Object.fromEntries(['index.html','assets.js','recipes.js','app.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(SRC,n))).digest('hex')])),
  cases:[]};
class Clock{
  constructor(){this.now=0;this.next=1;this.queue=new Map();}
  set(fn,delay=0,...args){const id=this.next++;this.queue.set(id,{at:this.now+Math.max(0,+delay||0),fn,args});return id;}
  clear(id){this.queue.delete(id);}
  advance(ms){
    const end=this.now+ms;let count=0;
    for(;;){let best=null;for(const [id,v]of this.queue){if(v.at<=end&&(!best||v.at<best.v.at))best={id,v};}
      if(!best)break;if(++count>10000)throw new Error('Timer runaway');this.queue.delete(best.id);this.now=best.v.at;best.v.fn(...best.v.args);}
    this.now=end;
  }
}
function plain(v){return JSON.parse(JSON.stringify(v));}
async function nativeImage(url){
  const filename=url.startsWith('data:')?url:path.join(ROOT,url);
  if(!imageCache.has(filename))imageCache.set(filename,loadImage(url.startsWith('data:')?url:fs.readFileSync(filename)));
  return imageCache.get(filename);
}
async function boot(options={}){
  const html=fs.readFileSync(path.join(SRC,'index.html'),'utf8');
  const errors=[],consoleErrors=[],clock=new Clock(),store=options.store||new Map();
  const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
  virtualConsole.on('error',e=>consoleErrors.push(String(e)));
  const dom=new JSDOM(html,{url:'https://rainbow-kitchen.test/index.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,d=w.document;
  w.addEventListener('error',e=>errors.push(e.error?e.error.message:e.message));
  w.setTimeout=(fn,delay,...args)=>clock.set(fn,delay,...args);w.clearTimeout=id=>clock.clear(id);
  w.requestAnimationFrame=fn=>clock.set(()=>fn(clock.now),16);w.cancelAnimationFrame=id=>clock.clear(id);
  Object.defineProperty(w.performance,'now',{value:()=>clock.now});
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  Object.defineProperty(w,'localStorage',{value:{
    getItem(k){if(options.failGet)throw new w.DOMException('Blocked in test','SecurityError');return store.has(k)?store.get(k):null;},
    setItem(k,v){if(options.failSet)throw new w.DOMException('Full in test','QuotaExceededError');store.set(k,String(v));},
    removeItem(k){store.delete(k);},clear(){store.clear();},key(i){return Array.from(store.keys())[i]||null;},get length(){return store.size;}
  }});
  let contexts=0,notes=0;
  const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  w.AudioContext=class{
    constructor(){contexts++;this.state='running';this.currentTime=0;this.destination={};}
    createGain(){return {gain:param(),connect(){},disconnect(){}};}
    createOscillator(){notes++;return{frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}
    resume(){this.state='running';return Promise.resolve();}
  };
  const canvas=d.getElementById('kitchen-canvas'),captures=new Set(),sceneStates=[];
  const geometry={width:options.width||640,height:options.height||360};
  Object.defineProperty(canvas,'clientWidth',{get:()=>geometry.width});Object.defineProperty(canvas,'clientHeight',{get:()=>geometry.height});
  canvas.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:geometry.width,bottom:geometry.height,width:geometry.width,height:geometry.height,toJSON(){return{};}});
  let nativeCanvas=null,rendererInstance=null;
  const renderStats={frames:0,drawCalls:0,lastFrameSources:[]};
  if(options.nativeRenderer){
    nativeCanvas=createCanvas(geometry.width,geometry.height);
    Object.defineProperties(canvas,{width:{configurable:true,get:()=>nativeCanvas.width,set:v=>{nativeCanvas.width=v;}},height:{configurable:true,get:()=>nativeCanvas.height,set:v=>{nativeCanvas.height=v;}}});
    const context=nativeCanvas.getContext('2d'),clear=context.clearRect.bind(context),draw=context.drawImage.bind(context);
    context.clearRect=(...args)=>{renderStats.frames++;renderStats.lastFrameSources=[];return clear(...args);};
    context.drawImage=(image,...args)=>{renderStats.drawCalls++;renderStats.lastFrameSources.push(image._testSource||'native-canvas');return draw(image,...args);};
    canvas.getContext=kind=>{assert.equal(kind,'2d');return context;};
  }
  canvas.setPointerCapture=id=>captures.add(id);
  canvas.releasePointerCapture=id=>{if(captures.delete(id))clock.set(()=>pointerEvent('lostpointercapture',id,0,0),0);};
  w.KitchenScene=class{
    constructor(_canvas,images){assert.equal(Object.keys(images).length,Object.keys(w.ART).length);}
    setState(s){sceneStates.push(plain(s));}
    interact(x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y));}
    resize(){}destroy(){}
  };
  const failure={active:!!options.failImage},decoded=new Set();
  w.Image=class{
    set src(url){this._src=url;Promise.resolve().then(async()=>{
      if(failure.active&&url===w.ART[options.failImage])throw new Error('Intentional artwork failure');
      const native=await nativeImage(url);this.naturalWidth=native.width;this.naturalHeight=native.height;this.width=native.width;this.height=native.height;decoded.add(url);
      if(this.onload)this.onload();
    }).catch(e=>{if(this.onerror)this.onerror(e);});}
    get src(){return this._src;}
  };
  function pointerEvent(type,id,x=200,y=140){
    const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0});
    Object.defineProperties(event,{pointerId:{value:id},pointerType:{value:'touch'},isPrimary:{value:id===1}});
    canvas.dispatchEvent(event);
  }
  if(options.nativeRenderer){
    const sourceDescriptor=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
    w.Image=function(){
      const image=new NativeImage();
      Object.defineProperty(image,'src',{configurable:true,get:()=>sourceDescriptor.get.call(image),set:url=>{
        image._testSource=url;const onload=image.onload;
        image.onload=()=>{decoded.add(url);if(onload)onload();};
        sourceDescriptor.set.call(image,url.startsWith('data:')?url:fs.readFileSync(path.join(ROOT,url)));
      }});
      return image;
    };
  }
  const env={w,d,clock,store,errors,consoleErrors,sceneStates,decoded,failure,canvas,nativeCanvas,renderStats,
    rendererSnapshot:()=>rendererInstance?plain(rendererInstance.s):null,
    resizeTo:(width,height)=>{geometry.width=width;geometry.height=height;w.dispatchEvent(new w.Event('resize'));},
    snap:()=>plain(w.RainbowKitchen.snapshot()),
    click:id=>{const el=d.getElementById(id);assert.ok(el,'Missing button '+id);el.click();},
    choose:id=>{const el=d.querySelector('[data-recipe="'+id+'"]');assert.ok(el,'Recipe card missing '+id);el.click();},
    pointer:pointerEvent,
    key:(key,repeat=false)=>canvas.dispatchEvent(new w.KeyboardEvent('keydown',{key,repeat,bubbles:true,cancelable:true})),
    get audio(){return{contexts,notes};},
    flush:()=>clock.advance(200),
    close(){clock.queue.clear();dom.window.close();}
  };
  opened.push(env);
  for(const name of ['assets.js','recipes.js'])w.eval(fs.readFileSync(path.join(SRC,name),'utf8'));
  if(options.nativeRenderer){
    w.eval(fs.readFileSync(path.join(SRC,'kitchen.js'),'utf8'));
    const ActualKitchenScene=w.KitchenScene;
    w.KitchenScene=function(...args){rendererInstance=new ActualKitchenScene(...args);return rendererInstance;};
    w.KitchenScene.prototype=ActualKitchenScene.prototype;
  }
  w.eval(fs.readFileSync(path.join(SRC,'app.js'),'utf8'));
  for(let i=0;i<10000;i++){
    clock.advance(20);
    if(w.RainbowKitchen&&w.RainbowKitchen.snapshot().ready)break;
    if(!d.getElementById('load-retry').hidden)break;
    await new Promise(resolve=>setImmediate(resolve));
    if(i===9999)throw new Error('Boot did not settle');
  }
  if(!options.failImage)assert.equal(env.snap().ready,true,'Game booted');
  return env;
}
function start(e,id){e.click('start-button');assert.equal(e.snap().modal,'menu-modal');if(id)e.choose(id);}
function finish(e){
  let guard=0;
  while(e.snap().progress.active.phase!=='ready'){
    if(++guard>10)throw new Error('Recipe did not finish');
    const a=e.snap().progress.active,r=e.w.RECIPES.find(r=>r.id===a.recipeId),s=r.steps[a.stepIndex];
    for(let i=0;i<s.count-a.taps;i++)e.click('cook-button');
    assert.equal(e.snap().progress.active.stepIndex,a.stepIndex,'Step stays stable until transition');
    e.clock.advance(s.gesture==='bake'?1160:560);
    assert.equal(e.snap().progress.active.stepIndex,a.stepIndex+1,'Exactly one step advanced');
  }
}
function noErrors(e){assert.deepEqual(e.errors,[]);assert.deepEqual(e.consoleErrors,[]);}
async function test(name,fn){
  try{const detail=await fn();report.cases.push({name,status:'PASS',detail:detail||''});console.log('PASS '+name);}
  catch(e){report.cases.push({name,status:'FAIL',error:e.stack||String(e)});console.log('FAIL '+name+': '+e.message);}
}
module.exports={boot,start,finish,noErrors,IDS,SAVE_KEY,opened};
if(require.main===module){
(async()=>{
  await test('Complete all seven dishes through real preparation/serve controls',async()=>{
    const store=new Map([['sneaky-unicorn-adventure:v14','unchanged-adventure-data']]),e=await boot({store});
    assert.equal(e.audio.contexts,0,'No audio before a gesture');start(e);
    assert.equal(e.audio.contexts,1);assert.deepEqual(Array.from(e.d.querySelectorAll('[data-recipe]'),x=>x.dataset.recipe),IDS);
    for(const id of IDS){
      assert.equal(e.snap().orderId,id);e.choose(id);finish(e);e.click('cook-button');
      const n=IDS.indexOf(id)+1;assert.equal(e.snap().progress.served,n);assert.equal(e.snap().progress.pending.type,'correct');
      assert.equal(e.snap().progress.stamps[id],1);assert.equal(e.snap().modal,'result-modal');
      for(let i=0;i<20;i++)e.click('cook-button');
      assert.equal(e.snap().progress.served,n,'Queued serve clicks cannot duplicate reward');
      e.click('next-button');for(let i=0;i<10;i++)e.click('next-button');
      assert.equal(e.snap().modal,'menu-modal');assert.equal(e.snap().progress.served,n);
    }
    assert.equal(Object.keys(e.snap().progress.stamps).length,7);assert.equal(e.snap().progress.collectionCelebrated,true);
    assert.equal(new Set(e.snap().progress.bag).size,7);assert.notEqual(e.snap().orderId,'chicken','Avoid immediate repeat across bags');
    assert.equal(store.get('sneaky-unicorn-adventure:v14'),'unchanged-adventure-data');
    assert.equal(JSON.parse(store.get(SAVE_KEY)).served,7);assert.equal(e.decoded.size,Object.keys(e.w.ART).length);noErrors(e);
    return 'Seven complete recipes; seven correct serves and stamps; second menu cycle; '+e.decoded.size+' real images decoded; queued serve/next events did not duplicate progress.';
  });
  await test('Wrong dish, gentle result, retry requested recipe, correct serve',async()=>{
    const e=await boot();start(e,'coffee');finish(e);e.click('cook-button');
    assert.equal(e.snap().progress.pending.type,'wrong');assert.equal(e.snap().orderId,'pizza');assert.equal(e.snap().progress.served,0);assert.deepEqual(e.snap().progress.stamps,{});
    assert.ok(e.d.getElementById('result-food').alt.includes('Pizza'));e.click('next-button');
    assert.equal(e.snap().progress.active.recipeId,'pizza');assert.equal(e.snap().progress.active.stepIndex,0);finish(e);e.click('cook-button');
    assert.equal(e.snap().progress.served,1);assert.equal(e.snap().progress.stamps.pizza,1);noErrors(e);
  });
  await test('Rapid input cannot skip multiple preparation steps',async()=>{
    const e=await boot();start(e,'pizza');for(let i=0;i<100;i++)e.click('cook-button');
    assert.equal(e.snap().progress.active.stepIndex,0);assert.equal(e.snap().progress.active.taps,3);
    e.clock.advance(560);assert.equal(e.snap().progress.active.stepIndex,1);assert.equal(e.snap().progress.active.taps,0);noErrors(e);
  });
  await test('Partial recipe resumes after pagehide and reload',async()=>{
    const store=new Map(),e=await boot({store});start(e,'cupcakes');e.click('cook-button');e.click('cook-button');e.w.dispatchEvent(new e.w.Event('pagehide'));const before=e.snap().progress.active;e.close();
    const f=await boot({store});f.click('start-button');assert.deepEqual(f.snap().progress.active,before);assert.equal(f.snap().progress.served,0);assert.equal(f.snap().modal,null);noErrors(f);
  });
  await test('Reload during completed-step animation normalizes once',async()=>{
    const store=new Map(),e=await boot({store});start(e,'pizza');for(let i=0;i<3;i++)e.click('cook-button');
    assert.equal(JSON.parse(store.get(SAVE_KEY)).active.taps,3);e.close();const f=await boot({store});f.click('start-button');
    assert.deepEqual(f.snap().progress.active,{recipeId:'pizza',stepIndex:1,taps:0,phase:'cooking'});f.clock.advance(2000);
    assert.equal(f.snap().progress.active.stepIndex,1);assert.equal(f.snap().progress.served,0);noErrors(f);
  });
  await test('Home during transition, continue, fresh tray, stickers preserved',async()=>{
    const e=await boot();start(e,'pizza');for(let i=0;i<3;i++)e.click('cook-button');e.click('home-button');
    assert.equal(e.snap().view,'home');assert.equal(e.snap().progress.active.stepIndex,1);e.click('start-button');
    assert.equal(e.snap().progress.active.stepIndex,1);e.click('restart-button');assert.equal(e.snap().progress.active.stepIndex,0);
    finish(e);e.click('cook-button');e.click('next-button');e.choose('coffee');e.click('home-button');e.click('start-button');e.click('restart-button');
    assert.equal(e.snap().progress.served,1);assert.equal(e.snap().progress.stamps.pizza,1);noErrors(e);
  });
  await test('Correct result reload does not duplicate reward or lose next order',async()=>{
    const store=new Map(),e=await boot({store});start(e,'pizza');finish(e);e.click('cook-button');e.close();
    const f=await boot({store});f.click('start-button');assert.equal(f.snap().modal,'result-modal');assert.equal(f.snap().progress.served,1);
    f.click('next-button');assert.equal(f.snap().orderId,'coffee');assert.equal(f.snap().progress.served,1);assert.equal(f.snap().progress.stamps.pizza,1);noErrors(f);
  });
  await test('Wrong result reload preserves request and retry',async()=>{
    const store=new Map(),e=await boot({store});start(e,'soup');finish(e);e.click('cook-button');e.close();
    const f=await boot({store});f.click('start-button');assert.equal(f.snap().progress.pending.type,'wrong');assert.equal(f.snap().orderId,'pizza');
    f.click('next-button');assert.equal(f.snap().progress.active.recipeId,'pizza');assert.equal(f.snap().progress.served,0);noErrors(f);
  });
  await test('Pointer cancel, ignored second touch, drag cap and new-touch recovery',async()=>{
    const e=await boot();start(e,'pizza');e.pointer('pointerdown',1,120,100);assert.equal(e.snap().progress.active.taps,1);
    e.pointer('pointerdown',2,240,100);e.clock.advance(150);e.pointer('pointermove',2,440,100);assert.equal(e.snap().progress.active.taps,1);
    e.pointer('pointercancel',1,120,100);e.clock.advance(10);e.pointer('pointermove',1,400,100);assert.equal(e.snap().progress.active.taps,1);
    e.pointer('pointerdown',3,100,100);assert.equal(e.snap().progress.active.taps,2);e.clock.advance(150);e.pointer('pointermove',3,300,100);
    assert.equal(e.snap().progress.active.taps,3);e.clock.advance(560);assert.equal(e.snap().progress.active.stepIndex,1);
    e.clock.advance(150);e.pointer('pointermove',3,500,100);assert.equal(e.snap().progress.active.taps,0,'One held drag cannot cross a step boundary');
    e.pointer('pointerup',3);e.pointer('pointerdown',4,200,100);assert.equal(e.snap().progress.active.taps,1);e.pointer('pointerup',4);noErrors(e);
  });
  await test('Pointer release on blur and keyboard repeat guard',async()=>{
    const e=await boot();start(e,'cupcakes');e.pointer('pointerdown',1,100,100);e.w.dispatchEvent(new e.w.Event('blur'));e.clock.advance(160);e.pointer('pointermove',1,500,100);
    assert.equal(e.snap().progress.active.taps,1);e.key(' ',false);assert.equal(e.snap().progress.active.taps,2);e.key(' ',true);assert.equal(e.snap().progress.active.taps,2);
    e.key('Enter',false);assert.equal(e.snap().progress.active.taps,3);noErrors(e);
  });
  await test('Malformed JSON and corrupt recipe identifiers recover safely',async()=>{
    const cases=['{ broken',JSON.stringify({schema:1,active:{recipeId:'constructor',stepIndex:0}}),
      JSON.stringify({schema:1,active:{recipeId:{toString:'pizza'},stepIndex:0}}),
      JSON.stringify({schema:1,bag:Array.from({length:7},()=>['pizza'])}),
      JSON.stringify({schema:1,pending:{type:'correct',dishId:'constructor',orderId:'pizza'}})];
    for(const raw of cases){const e=await boot({store:new Map([[SAVE_KEY,raw]])});assert.equal(e.snap().progress.active,null);assert.deepEqual(e.snap().progress.bag,IDS);start(e,'pizza');assert.equal(e.snap().progress.active.recipeId,'pizza');noErrors(e);}
    return 'Five malformed/corrupt save cases, including both previously verified startup crashes and invalid nested-array bag.';
  });
  await test('Corrupt fields normalize while valid earned stickers survive',async()=>{
    const value={schema:1,served:3,stamps:{pizza:2,coffee:1,soup:-4},position:-20,active:{recipeId:'pizza',stepIndex:999,taps:999},muted:true};
    const e=await boot({store:new Map([[SAVE_KEY,JSON.stringify(value)]])});assert.equal(e.snap().progress.served,3);assert.deepEqual(e.snap().progress.stamps,{pizza:2,coffee:1});
    assert.equal(e.snap().progress.active.phase,'ready');assert.equal(e.snap().progress.active.stepIndex,5);assert.equal(e.snap().orderId,'pizza');noErrors(e);
  });
  await test('Storage permission/quota failures leave cooking operational',async()=>{
    for(const flags of [{failGet:true,failSet:true},{failSet:true}]){
      const e=await boot(flags);start(e,'pizza');finish(e);e.click('cook-button');assert.equal(e.snap().progress.served,1);assert.equal(e.snap().storageAvailable,false);
      assert.ok(e.d.getElementById('save-note').textContent.includes('without'));e.click('next-button');assert.equal(e.snap().modal,'menu-modal');noErrors(e);
    }
    return 'Read+write Security/Quota failure and write-only quota failure; correct reward retained in memory and explicit no-save feedback.';
  });
  await test('Mute persists, sound creation follows gesture, muted replay works',async()=>{
    const store=new Map(),e=await boot({store});assert.equal(e.audio.contexts,0);e.click('home-mute');assert.equal(e.snap().progress.muted,true);
    const notes=e.audio.notes;start(e,'pizza');e.click('cook-button');assert.equal(e.audio.notes,notes);e.w.dispatchEvent(new e.w.Event('pagehide'));e.close();
    const f=await boot({store});assert.equal(f.snap().progress.muted,true);f.click('start-button');f.click('mute-button');assert.equal(f.snap().progress.muted,false);
    assert.equal(f.audio.contexts,1);assert.ok(f.audio.notes>0);noErrors(f);
  });
  await test('Recipe/sticker modals can be entered and closed through buttons/Escape',async()=>{
    const e=await boot();e.click('home-book');assert.equal(e.snap().modal,'book-modal');e.click('book-done');assert.equal(e.snap().modal,null);
    start(e,'pizza');e.click('menu-button');assert.equal(e.snap().modal,'menu-modal');e.click('menu-close');assert.equal(e.snap().modal,null);
    e.click('sticker-button');assert.equal(e.snap().modal,'book-modal');e.d.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(e.snap().modal,null);noErrors(e);
  });
  await test('Real bitmap load failure exposes retry and recovers without fallback',async()=>{
    const e=await boot({failImage:'pizza'});assert.equal(e.snap().ready,false);assert.equal(e.d.getElementById('load-retry').hidden,false);
    assert.ok(e.d.getElementById('load-note').textContent.includes('pizza'));e.failure.active=false;e.click('load-retry');
    for(let i=0;i<10000&&!e.snap().ready;i++){e.clock.advance(20);await new Promise(resolve=>setImmediate(resolve));}
    assert.equal(e.snap().ready,true);assert.equal(e.snap().artLoaded,Object.keys(e.w.ART).length);start(e,'pizza');noErrors(e);
  });
  for(const e of opened){try{e.close();}catch(_){}}
  report.summary={total:report.cases.length,passed:report.cases.filter(t=>t.status==='PASS').length,failed:report.cases.filter(t=>t.status==='FAIL').length,decodedImageFiles:imageCache.size};
  fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.summary));process.exitCode=report.summary.failed?1:0;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});

}
