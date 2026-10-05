/* Real audio samples plus iOS session routing and interruption recovery.
 * Desktop WebKit/Chromium cannot prove physical iPhone speaker output. */
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const results=[];
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true,...(name==='chromium'?{executablePath:process.env.CHROMIUM_PATH}:process.env.WEBKIT_PATH?{executablePath:process.env.WEBKIT_PATH}:{})});
  try{
   const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    // Exercise Safari's AudioSession branch even in engines lacking that API.
    const session={type:'auto'};
    Object.defineProperty(navigator,'audioSession',{configurable:true,value:session});
    const Native=window.AudioContext||window.webkitAudioContext;
    window.AudioContext=class extends Native{
     constructor(...args){super(...args);window.testAudio=this;}
     createGain(){const gain=super.createGain();if(!window.testMaster){window.testMaster=gain;window.testAnalyser=this.createAnalyser();gain.connect(window.testAnalyser);}return gain;}
    };
   });
   await page.goto(process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../Sneaky-Unicorn-Restaurant-v2.0.0.html')).href+'?qa=1');
   await page.waitForFunction(()=>window.__RR_TEST__&&__RR_TEST__.mode!=='loading');
   assert.equal(await page.evaluate(()=>!!window.testAudio),false,'no audio before interaction');
   await page.locator('#menu').tap();
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='running');
   assert.equal(await page.evaluate(()=>navigator.audioSession.type),'playback');
   const sample=()=>page.evaluate(async()=>{
    let energy=0,peak=0,count=0;const data=new Float32Array(testAnalyser.fftSize);
    for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,25));testAnalyser.getFloatTimeDomainData(data);for(const n of data){energy+=n*n;peak=Math.max(peak,Math.abs(n));count++;}}
    return {rms:Math.sqrt(energy/count),peak};
   });
   const music=await sample();assert(music.rms>.005,'music has audible-level PCM samples');assert(music.peak<1,'no clipping');
   // Safari reports interrupted after app switching. Simulate that state on the
   // real suspended context and require the next genuine touch to resume it.
   await page.evaluate(async()=>{
    await testAudio.suspend();
    Object.defineProperty(testAudio,'state',{configurable:true,get:()=> 'interrupted'});
    const nativeResume=testAudio.resume.bind(testAudio);
    testAudio.resume=()=>{delete testAudio.state;return nativeResume();};
   });
   await page.locator('[data-action="resume"]').tap();
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='running');
   const recovered=await sample();assert(recovered.rms>.005);
   await page.locator('#menu').tap();await page.locator('[data-action="toggle-audio"]').tap();
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='suspended');
   assert.equal(await page.evaluate(()=>navigator.audioSession.type),'auto');
   assert(await page.locator('[data-action="toggle-audio"]').innerText().then(t=>t.includes('off')));
   await page.locator('[data-action="toggle-audio"]').tap();
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='running');
   const unmuted=await sample();assert(unmuted.rms>.005);
   // Exercise the page visibility handler using the real audio graph.
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='suspended');
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='running');
   const foreground=await sample();assert(foreground.rms>.005);
   // Rotation pauses sound along with the landscape-only game and restores it.
   await page.setViewportSize({width:390,height:844});
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='suspended');
   await page.setViewportSize({width:844,height:390});
   await page.locator('[data-action="resume"]').tap();
   await page.waitForFunction(()=>__RR_TEST__.metrics().audioState==='running');
   // The saved mute preference survives reload and taps do not override it.
   await page.locator('#menu').tap();await page.locator('[data-action="toggle-audio"]').tap();
   await page.reload();await page.waitForFunction(()=>window.__RR_TEST__&&__RR_TEST__.mode!=='loading');
   await page.locator('#menu').tap();
   assert.equal(await page.evaluate(()=>__RR_TEST__.snapshot().settings.muted),true);
   assert.equal(await page.evaluate(()=>!!window.testAudio),false);
   assert.deepEqual(errors,[]);
   results.push({browser:name,music,recovered,unmuted,sessionPlayback:true,foregroundRecovery:true,mutePersisted:true,rotationRecovery:true,errors});
  }finally{await browser.close();}
 }
 const report={scope:'Actual PCM sampling in desktop Chromium and WebKit with mobile viewports; physical iPhone speakers and Silent Mode require device confirmation',results};
 fs.writeFileSync(process.env.AUDIO_REPORT||'/tmp/unicorn-phone-audio.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
