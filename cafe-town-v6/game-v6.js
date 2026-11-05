/* Sneaky Unicorn — Rainbow Restaurant v2.0.0 Production Art Integration
 * Picture-first restaurant loop: customize, seat, order, cook, deliver, clear and wash.
 * Sourcepack characters/environment remain the visual authority; furniture now combines image-generated interior assets with original sourcepack sprites.
 */
(function(){'use strict';
// Cancel native image dragging and selection without cancelling gameplay pointers or scrolling.
for(const type of ['contextmenu','dragstart','selectstart'])document.addEventListener(type,e=>{if(!e.target.closest?.('input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]'))e.preventDefault();},{capture:true});

const R=window.RR,A=window.RRArt,$=id=>document.getElementById(id);
const dom={app:$('app'),world:$('world'),stage:$('stage'),customizer:$('customizer'),kitchen:$('kitchen-screen'),ui:$('world-ui'),modal:$('modal-root'),primary:$('primary'),orderPin:$('order-pin'),guide:$('movement-guide')};
const ctx=dom.world.getContext('2d',{alpha:false});
let storageOK=true,saved=null,migrated=false;
try{
 for(const key of [R.SAVE_KEY,...R.PREVIOUS_SAVE_KEYS]){
  let raw=null;try{const text=localStorage.getItem(key);if(text)raw=JSON.parse(text);}catch(_){}
  const good=R.cleanSave(raw);if(good){saved=raw;migrated=key!==R.SAVE_KEY;break;}
 }
}catch(_){storageOK=false;}
let engine=new R.Engine(saved),mode='loading',loaded=false;
if(!saved&&window.matchMedia)engine.s.settings.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=1,height=1,dpr=1,clock=0,lastTime=0,saveClock=0,spawnClock=0,idle=0;
let view={x:0,y:0,scale:1},path=[],goal=null,playerMoving=false,playerAnim=0;
let npcPaths=new Map(),npcFacing=new Map(),particles=[],hits=[],toastUntil=0,joyUntil=0,selectedCleanup=null;
let worldLink=null,worldOutfit=null,worldReady=false,worldMuted=false,worldExitLatch=null;
// Keep the connected return area beyond every dining interaction. The pictured
// doorway also walks here, without intercepting taps on the diamond table.
const worldExitArea={...R.LAYOUT.exit,cueVector:{x:0,y:1},hit:{...R.LAYOUT.exit.hit}};
function requestWorldExit(){if(!worldReady||!worldExitLatch||hubPaused||mode!=='world')return;save();stopControls();hubPaused=true;window.parent.postMessage({type:'UNICORN_WORLD',command:'return'},worldOrigin);}
function resetWorldExit(){worldExitLatch?.reset(engine.s.player,worldExitArea);}
let hubPaused=new URLSearchParams(location.search).get('hub')==='1'&&window.parent!==window;
let pointer=null,keys=new Set(),cookPointer=null,cookLast=0,cookStepLock=-1,cookDistance=0,cookPrev=null,cookBump=0,cookMoved=false;
let cookCanvas=null,cookContext=null,washCanvas=null,washContext=null,washSnapshot=null,washDone=false;
let kitchenSignature='',hudSignature='',modalReturn='world',previousFocus=null,customStage=0,offlineReady=false,bootCount=0;
let autoZoneKey=null,autoZoneInside=false,autoDwell=0,autoFlashUntil=0,autoLastTrigger='';
let mopSwingUntil=0,mopLast=0;
const AUTO_DWELL=.28,AUTO_EXIT_PAD=34;
const dayScreen=document.createElement('section');dayScreen.id='day-screen';dayScreen.className='day-screen';dayScreen.hidden=true;dom.stage.insertBefore(dayScreen,dom.modal);
const hintButton=document.createElement('button'),hintHand=document.createElement('div');
hintButton.id='picture-hint';hintButton.className='picture-hint';hintButton.hidden=true;hintButton.setAttribute('aria-label','Show me what to tap');hintHand.className='hint-hand';hintHand.hidden=true;hintHand.setAttribute('aria-hidden','true');dom.stage.append(hintButton,hintHand);
let pictureHint=null,lastHintTarget=null;const automaticHints=new Set();
function dismissPictureHint(){idle=0;pictureHint=null;hintButton.hidden=true;hintHand.hidden=true;}
function hintTarget(){
 if(mode==='world'){const info=primaryInfo();return info.type==='wait'?null:{element:dom.primary,gesture:'tap',key:JSON.stringify([mode,info.type,info.id,info.table,info.task,!!engine.s.tray,!!engine.s.dirtyTray,engine.customer(info.id)?.phase]),info};}
 if(mode==='recipes'){const el=dom.kitchen.querySelector('.dish-card.requested');return el?{element:el,gesture:'tap',key:'recipes:'+engine.s.active}:null;}
 if(mode==='wash'){const el=washDone?dom.kitchen.querySelector('[data-action="wash-return"]'):washCanvas;return el?{element:el,gesture:washDone?'tap':'rub',key:'wash:'+washSnapshot?.table+':'+washDone}:null;}
 if(mode==='scrub'){const el=cleanDone?dayScreen.querySelector('[data-action="day-return"]'):dayCanvas;return el?{element:el,gesture:cleanDone?'tap':'rub',key:'scrub:'+cleanTask?.id+':'+cleanDone}:null;}
 if(mode!=='cook'||!engine.prep)return null;const p=engine.prep,step=R.RECIPES[p.dish].steps[p.step],choice=engine.customer(p.orderId)?.variant;
 const element=p.done?dom.kitchen.querySelector('[data-action="carry"]'):step.action==='choice'?dom.kitchen.querySelector(`[data-variant="${choice||R.RECIPES[p.dish].variants[0].id}"]`):step.action==='decorate'?dom.kitchen.querySelector('[data-decoration]'):cookCanvas;
 return element?{element,gesture:p.done||['choice','decorate'].includes(step.action)?'tap':step.action,key:'cook:'+p.orderId+':'+p.step+':'+p.done}:null;
}
function startPictureHint(){const target=hintTarget();if(!target)return;pictureHint={...target,remaining:3.4};idle=0;hintButton.hidden=true;hintHand.innerHTML=A.icon('hand');updatePictureHint(0);if(mode==='world')drawWorld();}
function updatePictureHint(dt){
 const target=hintTarget(),busy=pointer||cookPointer!==null||dayPointer!==null||keys.size||path.length;
 if(target?.key!==lastHintTarget){lastHintTarget=target?.key||null;idle=0;}
 if(!target||busy){dismissPictureHint();return;}
 if(pictureHint){if(pictureHint.key!==target.key){dismissPictureHint();return;}pictureHint.remaining-=dt;if(pictureHint.remaining<=0){dismissPictureHint();return;}
  const box=target.element.getBoundingClientRect(),stage=dom.stage.getBoundingClientRect(),time=3.4-pictureHint.remaining,motion=engine.s.settings.reduced?0:1,phase=time*4;
  let x=box.left+box.width*.5,y=box.top+box.height*.5;
  if(pictureHint.gesture==='stir'){x+=Math.cos(phase)*Math.min(38,box.width*.12)*motion;y+=Math.sin(phase)*Math.min(26,box.height*.12)*motion;}
  else if(['rub','place'].includes(pictureHint.gesture))x+=Math.sin(phase)*Math.min(46,box.width*.14)*motion;
  else y+=Math.sin(phase)*6*motion;
  hintHand.style.left=R.clamp(x-stage.left-17,0,width-48)+'px';hintHand.style.top=R.clamp(y-stage.top-9,0,height-54)+'px';hintHand.dataset.gesture=pictureHint.gesture;hintHand.hidden=false;return;
 }
 idle+=dt;hintButton.dataset.scene=mode;
 // One silent demonstration per task/step, not a repeating interruption.
 // It only draws a hand and route: recipe progress still requires real input.
 if(idle>=8&&!automaticHints.has(target.key)){automaticHints.add(target.key);if(automaticHints.size>256)automaticHints.delete(automaticHints.values().next().value);startPictureHint();return;}
 hintButton.hidden=idle<8;if(!hintButton.hidden&&!hintButton.firstChild)hintButton.innerHTML=A.icon('hand');
}
hintButton.addEventListener('click',startPictureHint);
// Dismissing a hint never consumes the child's pointer, including iOS taps.
for(const type of ['pointerdown','pointermove','keydown'])dom.app.addEventListener(type,e=>{if(type==='pointermove'&&!e.buttons&&!pointer&&cookPointer===null)return;if(e.target.closest?.('#picture-hint'))return;dismissPictureHint();},{capture:true,passive:true});
let dayCanvas=null,dayContext=null,dayPointer=null,dayPoint={x:260,y:230},dayDistance=0,dayLast=0,dayDidAct=false,dayPulse=0,cleanTask=null,cleanDone=false,cleanDoneAt=0,completeShown=false;

// Use the media playback route on iOS: the default ambient route obeys the
// phone's Ring/Silent switch even when Web Audio reports a running context.
const SOUND_LEVEL=.28;
const sound={context:null,master:null,unlocked:false,
 session(active){try{if(navigator.audioSession)navigator.audioSession.type=active?'playback':'auto';}catch(_){}},
 unlock(){
  if(document.hidden||portraitBlocked||hubPaused||worldMuted||engine.s.settings.muted)return;
  this.session(true);
  try{
   if(!this.context||this.context.state==='closed'){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    this.context=new AC();this.master=this.context.createGain();
    this.master.gain.value=SOUND_LEVEL;this.master.connect(this.context.destination);
    this.context.addEventListener('statechange',()=>{this.unlocked=this.context.state==='running';});
   }
   // Touch-end/click are trusted activation events on phones. Retry interrupted
   // contexts too; switching apps or locking an iPhone can interrupt playback.
   const ac=this.context;this.unlocked=ac.state==='running';
   if(!this.unlocked)ac.resume().then(()=>{if(this.context===ac){this.unlocked=ac.state==='running';this.musicNext=0;}}).catch(()=>{});
  }catch(_){}
 },
 pause(){
  this.musicNext=0;this.session(false);
  if(this.context?.state==='running')this.context.suspend().catch(()=>{});
 },
 mute(){
  if(this.master)this.master.gain.setTargetAtTime((engine.s.settings.muted||worldMuted)?0:SOUND_LEVEL,this.context.currentTime,.02);
  if(engine.s.settings.muted||worldMuted)this.pause();else if(this.context)this.unlock();
 },
 play(kind='tap'){if(!this.unlocked||this.context?.state!=='running'||worldMuted||engine.s.settings.muted)return;try{const ac=this.context,now=ac.currentTime;const notes=kind==='serve'?[523,659,784,1047]:kind==='ready'?[523,698,880]:kind==='wash'?[659,784,988]:kind==='hello'?[587,784]:kind==='oops'?[392,330]:[460+Math.random()*130];notes.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+i*.09);o.frequency.exponentialRampToValueAtTime(f*1.06,now+i*.09+.12);g.gain.setValueAtTime(0,now+i*.09);g.gain.linearRampToValueAtTime(.55,now+i*.09+.018);g.gain.exponentialRampToValueAtTime(.001,now+i*.09+.22);o.connect(g);g.connect(this.master);o.start(now+i*.09);o.stop(now+i*.09+.24);});}catch(_){} }
};

const DJ_TUNES=[{name:'Rainbow waltz',beat:.32,notes:[523,659,784,659,587,698,880,698,659,784,988,784,587,698,784,698]},{name:'Moonlight bounce',beat:.26,notes:[392,494,587,784,587,494,440,523,659,880,659,523,494,587,740,587]},{name:'Cupcake parade',beat:.29,notes:[523,523,784,880,784,659,587,659,698,698,880,988,880,784,659,587]}];
function changeMusic(){sound.unlock();engine.s.settings.musicTrack=(engine.s.settings.musicTrack+1)%DJ_TUNES.length;sound.musicNext=0;sound.musicStep=0;save();feedback('tap');toast(DJ_TUNES[engine.s.settings.musicTrack].name);burst(R.DJ.x,R.DJ.y-100,10,'#f5c3e9');}
sound.musicNotes=0;sound.musicNext=0;sound.musicStep=0;
sound.musicTick=function(){if(!this.unlocked||worldMuted||engine.s.settings.muted||this.context.state!=='running')return;const ac=this.context,tune=DJ_TUNES[engine.s.settings.musicTrack||0];if(this.musicNext<ac.currentTime)this.musicNext=ac.currentTime+.02;while(this.musicNext<ac.currentTime+.12){const at=this.musicNext,step=this.musicStep++,freq=tune.notes[step%tune.notes.length];for(const [f,amp,duration] of [[freq,.18,.25],...(step%4===0?[[freq/4,.12,.65]]:[])]){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(amp,at+.015);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(this.master);o.start(at);o.stop(at+duration+.02);this.musicNotes++;}this.musicNext+=tune.beat;}};

const assetStates=new Map();let assetGateSequence=0;
const assetNotice=document.createElement('div');assetNotice.setAttribute('role','status');assetNotice.style.cssText='position:fixed;inset:0;z-index:10000;background:#352c46dd;color:#fff2d4;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;text-align:center';document.body.append(assetNotice);
function assetsBlocked(){return assetStates.size>0;}
function setAssetStatus(id,message,retry=null){if(!message&&!assetStates.has(id))return;if(message)assetStates.set(id,{message,retry});else assetStates.delete(id);assetNotice.replaceChildren();assetNotice.style.display=assetsBlocked()?'flex':'none';if(!assetsBlocked()){lastTime=0;return;}stopControls();// A failed activity gate retries all missing assets through the bounded loader.
 const entry=[...assetStates.entries()].find(([id,q])=>id.startsWith('gate:')&&q.retry)?.[1]||[...assetStates.values()].find(q=>q.retry)||[...assetStates.values()].at(-1),text=document.createElement('p');text.textContent=entry.message;assetNotice.append(text);if(entry.retry){const button=document.createElement('button');button.textContent='Try loading again';button.setAttribute('aria-label','Retry artwork loading');button.style.cssText='min-width:48px;min-height:48px;padding:12px;border:2px solid #fff2d4;background:#352c46;color:#fff2d4';button.onclick=entry.retry;assetNotice.append(button);}}
function presentationGate(kind,dish,run){const keys=A.keysForState(kind,dish);if(A.isReady(keys)){run();return;}const id='gate:'+ ++assetGateSequence;const attempt=()=>{setAssetStatus(id,'Loading this activity…');A.ensure(keys).then(()=>{setAssetStatus(id,null);run();}).catch(()=>setAssetStatus(id,'This activity artwork did not finish loading. Your progress is unchanged.',attempt));};attempt();}
window.addEventListener('rr-assets',e=>{const {type,key}=e.detail,id='asset:'+key;if(type==='needed')setAssetStatus(id,'Loading artwork…');else if(type==='ready')setAssetStatus(id,null);else if(type==='failed')setAssetStatus(id,'Artwork did not finish loading: '+key,()=>{setAssetStatus(id,'Loading artwork…');A.ensure([key]).then(()=>{if(!loaded&&mode==='loading')boot();}).catch(()=>{});});});
function imageHTML(key,cls='',alt=''){return `<img class="${cls}" src="${A.nativeData(key)||A.assetURL(key)||A.toolData(key)}" alt="${alt}" draggable="false">`;}
function foodHTML(dish,variant,cls=''){return `<img class="${cls}" src="${A.foodData(dish,variant)}" alt="${R.RECIPES[dish].name}" draggable="false">`;}
function foodCategoryHTML(dish){return foodHTML(dish,R.RECIPES[dish].variants[0].id);}
function variantInfo(dish,id){return R.RECIPES[dish].variants.find(x=>x.id===id)||R.RECIPES[dish].variants[0];}
function variantHTML(dish,id,cls=''){const v=variantInfo(dish,id);return `<img class="${cls}" src="${A.toolData(v.icon)}" alt="${v.name}" draggable="false">`;}
const tableBadgePictures=new Map();
function tableMarkHTML(i,cls='table-mark'){
 const t=R.TABLES[i];
 if(!tableBadgePictures.has(i)){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;A.badge(canvas.getContext('2d'),t.symbol,48,48,40,t.colour);tableBadgePictures.set(i,canvas.toDataURL());}
 return `<span class="${cls} table-badge" aria-label="${t.symbol} table"><img src="${tableBadgePictures.get(i)}" alt="" draggable="false"></span>`;
}
function guestKey(c,moving=false){const happy=['eating','finished'].includes(c.phase);if(c.type==='pink'||c.type==='blue')return 'baby_'+c.type+'_'+(happy?(Math.floor(clock*4+c.id)%2?4:5):moving?1+Math.floor(clock*6+c.id)%3:0);if(c.type==='human')return happy?'h_happy':moving?'h_run'+Math.floor(clock*6)%4:'h_idle0';if(c.type==='worker')return happy?'w_5_3':'w_0_'+(moving?Math.floor(clock*5)%3:0);return happy?'m_4_5':'m_0_'+(moving?Math.floor(clock*5)%3:0);}
const liveGuestReactions=new Map();
function queueGuestReaction(id,event,itemId=null){const api=window.UWCafeReactionRuntime;if(!api)return;const r=api.prepare(engine.snapshot(),id,event,itemId,worldMuted);if(!r.changed||!persistGrowth(r.snapshot))return;const actual=engine.customer(id),persisted=r.snapshot.customers.find(c=>c.id===id);if(!actual)return;actual.reactionShown=persisted.reactionShown;actual.reactionVisits=persisted.reactionVisits;for(const d of r.descriptors){const key=id+':'+d.memberId,queue=liveGuestReactions.get(key)||[],last=queue.at(-1);queue.push({...d,start:last?Math.max(clock,last.start+last.reaction.durationMs/1000):clock});liveGuestReactions.set(key,queue.slice(-4));}}
function drawPersistedGuestReaction(c,index,seat,h){const key=c.id+':'+index,queue=liveGuestReactions.get(key);if(!queue?.length)return false;while(queue.length&&(clock-queue[0].start)*1000>=queue[0].reaction.durationMs)queue.shift();if(!queue.length){liveGuestReactions.delete(key);return false;}const q=queue[0],elapsed=(clock-q.start)*1000;if(elapsed<0)return false;if(window.UWGuestReactionArt?.draw)window.UWGuestReactionArt.draw(ctx,q.reaction,seat.x,seat.y-h-20,elapsed);return true;}
function persistGrowth(snapshot){try{const ok=worldLink?worldLink.saveNative(snapshot):(()=>{localStorage.setItem(R.SAVE_KEY,JSON.stringify(snapshot));return true;})();storageOK=ok===true;return storageOK;}catch(e){storageOK=false;return false;}}
function growthCatalogue(){const cafe=window.UWCafeDesignRewards?.catalogue||[];const home=worldLink?.homeDesign?(window.UWHomeGrowthCatalogue||[]):[];return [...cafe,...home].filter(d=>d.ready===true);}
function growthPreview(id){return window.UWCafeDesignRewards?.supports(id)?window.UWCafeDesignRewards.previewData(id,engine.s.decor):window.UWHomeGrowthPreview?.(id)||'';}
function flushDesignDeliveries(){if(!worldLink?.homeDesign)return;for(const q of window.UWCafeGrowthRuntime.clean(engine.s.growth)?.service.pendingDeliveries||[])worldLink.homeDesign(q.id,q.designId,engine.snapshot());}
function showGrowthChoices(){const from=mode==='dialog'?modalReturn:mode;if(mode==='dialog')closeDialog();const body=window.UWCafeRewardUI.render(engine.s.growth,growthCatalogue(),growthPreview);showDialog('Your designs',body+`<div class="dialog-buttons"><button class="dialog-button" data-action="resume" aria-label="Back to play">${A.icon('back')}</button></div>`);modalReturn=from;}
function handleGrowthButton(button){if(button.dataset.growthClaim){const r=engine.claimDesign(button.dataset.growthOffer,button.dataset.growthClaim,persistGrowth,growthCatalogue());if(!r.ok){toast('Not saved yet. Please try again.');return;}flushDesignDeliveries();showGrowthChoices();return;}if(button.dataset.growthApply){const r=engine.applyDesign(button.dataset.growthApply,persistGrowth,growthCatalogue());if(!r.ok){toast('Not saved yet. Please try again.');return;}toast('Design applied');showGrowthChoices();}}
function save(){if(worldLink){storageOK=worldLink.saveNative(engine.snapshot());return storageOK;}try{localStorage.setItem(R.SAVE_KEY,JSON.stringify(engine.snapshot()));storageOK=true;}catch(_){storageOK=false;}return storageOK;}
const helperRequests=new Set(),helperTargets=new Map();
function helperScope(){return worldLink?'cafe-hire:'+worldLink.state.source+':'+worldLink.state.generation+':'+engine.s.day+':'+engine.halfDay():null;}
function syncHelperEntitlements(){if(!worldLink?.profile||!['morning','afternoon'].includes(engine.s.phase))return;const scope=helperScope();for(const h of engine.s.helpers){if(worldLink.profile.cafeHires?.[scope+':'+h.id])engine.grantHelper(h.id,scope);else engine.revokeHelper(h.id);}}
async function hireHelper(id){if(!['morning','afternoon'].includes(engine.s.phase)||engine.s.helpers.find(h=>h.id===id)?.hired||helperRequests.has(id))return;helperRequests.add(id);try{
 if(worldLink){const scope=helperScope(),r=await worldLink.request('hire',{scope,worker:id},scope+':'+id);if(r.ok&&scope===helperScope()){engine.grantHelper(id,scope);save();feedback('ready');}else if(!r.ok)toast(r.error==='coins'?'One coin needed.':'Could not save. Tap to retry.');}
 else{const before=engine.snapshot();if(!engine.hireLocal(id)){toast('One coin needed.');return;}if(!save()){engine=new R.Engine(before);toast('Could not save. Tap to retry.');}else feedback('ready');}
 }finally{helperRequests.delete(id);updateHUD(true);drawWorld();}}
let pendingHelperHire=null;
function requestHelperHire(id){
 const helper=engine.s.helpers.find(h=>h.id===id);
 if(mode!=='world'||!helper||helper.hired||helperRequests.has(id)||!['morning','afternoon'].includes(engine.s.phase))return;
 const coins=worldLink?Number(worldLink.profile?.coins||0):engine.s.coins,unit=worldLink?'world coin':'café coin';
 pendingHelperHire=id;
 showDialog('Invite a helper?',`<div class="helper-hire-preview">${imageHTML('baby_'+id+'_0','helper-portrait',id+' helper')}<div class="helper-hire-cost" aria-label="Costs one ${unit}">${A.icon('coin')}<strong>1</strong></div></div><p class="helper-hire-copy">${coins>=1?'One '+unit+' for this half-day.':'Earn one '+unit+' first.'}</p><div class="dialog-buttons"><button class="dialog-button" data-action="resume" aria-label="Back without hiring">${A.icon('back')}</button><button class="dialog-button good" data-action="confirm-helper-hire" aria-label="Confirm hire ${id} helper for one ${unit}" ${coins<1?'disabled':''}>${A.icon('check')}${A.icon('coin')}<span>1</span></button></div>`);
}
function confirmHelperHire(){
 if(mode!=='dialog'||!pendingHelperHire)return;
 const id=pendingHelperHire,coins=worldLink?Number(worldLink.profile?.coins||0):engine.s.coins;
 if(coins<1){closeDialog();toast('One coin needed.');return;}
 pendingHelperHire=null;closeDialog();hireHelper(id);
}
function updateHelperTargets(){for(const h of engine.s.helpers){let b=helperTargets.get(h.id);if(!b){b=document.createElement('button');b.className='helper-target';b.onclick=()=>requestHelperHire(h.id);b.dataset.helper=h.id;dom.ui.append(b);helperTargets.set(h.id,b);}const p=worldToScreen(h.x,h.y),size=Math.max(44,R.LAYOUT.actor.baby*view.scale);b.style.left=(p.x-size*.6)+'px';b.style.top=(p.y-size)+'px';b.style.width=(size*1.2)+'px';b.style.height=size+'px';b.hidden=mode!=='world'||!['morning','afternoon'].includes(engine.s.phase)||p.x<0||p.x>width||p.y<0||p.y-size>height;b.disabled=h.hired||helperRequests.has(h.id);b.setAttribute('aria-label',h.hired?h.id+' helper '+(h.task?.kind==='order'?'taking an order at the '+R.TABLES[h.task.table].name:h.task?.kind==='dish'?'clearing the '+R.TABLES[h.task.table].name:h.task?.kind==='wash'?'washing a dish':'ready to help'):helperRequests.has(h.id)?'Saving '+h.id+' hire':'Hire '+h.id+' helper for one '+(worldLink?'world':'café')+' coin');}}
// Connected artwork is a display-only sidecar, never a meal or dirty-dish tray.
// This wall strip is between the left lamp and kitchen, outside DJ/table hits.
const cafeGallery={x:450,y:170,w:112,h:112};
const cafeGalleryTarget=document.createElement('button');
cafeGalleryTarget.id='cafe-gallery';cafeGalleryTarget.className='cafe-gallery-target';cafeGalleryTarget.hidden=true;cafeGalleryTarget.type='button';dom.ui.append(cafeGalleryTarget);
const cafeGalleryCue=document.createElement('button'),cafeGalleryCueCanvas=document.createElement('canvas');
cafeGalleryCue.id='cafe-gallery-cue';cafeGalleryCue.className='cafe-gallery-cue';cafeGalleryCue.type='button';cafeGalleryCue.hidden=true;cafeGalleryCue.setAttribute('aria-label','Go to the café gallery with your drawing. Hanging it takes a separate tap.');
cafeGalleryCueCanvas.width=108;cafeGalleryCueCanvas.height=108;cafeGalleryCueCanvas.setAttribute('aria-hidden','true');cafeGalleryCue.append(cafeGalleryCueCanvas);dom.ui.append(cafeGalleryCue);
const cafeGalleryViewSpot={x:505,y:345};let cafeGalleryCueArt=null;
let cafeClubhouse=null,cafeDisplayRequest=null,cafeSuccessUntil=0;
const cafeGuestReactions=new Map();
function cafeArtAvailable(){return !!(worldReady&&worldLink&&cafeClubhouse&&window.UWClubhouseArt?.drawPicture);}
function cafeDisplayed(){return cafeClubhouse?.displayed?.cafe||null;}
function cafeGalleryHit(p){const q=cafeGallery;return cafeArtAvailable()&&p.x>=q.x&&p.x<=q.x+q.w&&p.y>=q.y&&p.y<=q.y+q.h;}
function syncCafeClubhouse(value){
 cafeClubhouse=value?.version===1?{version:1,carried:value.carried||null,displayed:{cafe:value.displayed?.cafe||null},friends:{pink:value.friends?.pink===true,blue:value.friends?.blue===true}}:null;
 // Reattach to the durable outbox after a reload; never mint a second intent.
 const pending=worldLink?.state.outbox.find(q=>q.request==='clubhouse-display'&&q.args?.slot==='cafe');
 if(pending&&!cafeDisplayRequest)watchCafeDisplay(pending.id,pending.args);
 updateCafeGuestReactions();updateCafeGalleryTarget();
}
function watchCafeDisplay(id,args){
 const request={id,artwork:args.artwork,expectedArtwork:args.expectedArtwork??null};cafeDisplayRequest=request;updateCafeGalleryTarget();
 worldLink.request('clubhouse-display',{artwork:request.artwork,slot:'cafe',expectedArtwork:request.expectedArtwork},id).then(receipt=>{
  if(cafeDisplayRequest!==request)return;cafeDisplayRequest=null;
  if(receipt.ok){cafeSuccessUntil=clock+1.8;worldLink.send({command:'connect'});if(mode==='world'&&!hubPaused){feedback('ready');announce('Your drawing is hanging in the café. Any previous drawing is still saved in your collection.');}}
  else if(mode==='world'&&!hubPaused)toast(receipt.error==='storage'?'Your drawing could not be saved. It is still safe to carry.':receipt.error==='conflict'?'The gallery changed. Look at the frame, then tap again if you want to replace it.':'Your drawing stayed safe. Try the frame again when you are ready.');
  updateCafeGuestReactions();updateCafeGalleryTarget();if(loaded)drawWorld();
 }).catch(()=>{if(cafeDisplayRequest!==request)return;
  // An unresolved outbox entry remains pending, including across suspension.
  if(!worldLink.state.outbox.some(q=>q.id===id))cafeDisplayRequest=null;
  if(mode==='world'&&!hubPaused)announce('The gallery is waiting for its save confirmation.');updateCafeGalleryTarget();
 });
}
function hangCafePicture(){
 if(mode!=='world'||hubPaused||!cafeArtAvailable()||cafeDisplayRequest)return;
 const carried=cafeClubhouse.carried,current=cafeDisplayed();
 if(!carried){announce(current?'Your drawing is on the café wall. Bring another from the clubhouse to change it.':'Bring a drawing from the clubhouse to hang here.');return;}
 if(current?.id===carried.id){announce('This drawing is already on the café wall.');return;}
 stopControls();const id='cafe-gallery:'+ (globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
 watchCafeDisplay(id,{artwork:carried.id,expectedArtwork:current?.id||null});
}
cafeGalleryTarget.addEventListener('click',hangCafePicture);
cafeGalleryCue.addEventListener('click',()=>{
 if(mode!=='world'||hubPaused||!cafeArtAvailable()||!cafeClubhouse.carried||cafeDisplayRequest)return;
 // This reachable floor point clears the DJ (x <= 433) and kitchen (x >= 567)
 // collision margins. The camera can see the wall here; no station is activated.
 stopControls();path=R.pathfind(engine.s.player,R.safePoint(cafeGalleryViewSpot));goal=null;
});
function updateCafeGalleryTarget(){
 const q=cafeGallery,p=worldToScreen(q.x,q.y),w=q.w*view.scale,h=q.h*view.scale;
 cafeGalleryTarget.hidden=mode!=='world'||hubPaused||!cafeArtAvailable()||p.x<0||p.y<0||p.x+w>width||p.y+h>height;
 cafeGalleryTarget.style.left=p.x+'px';cafeGalleryTarget.style.top=p.y+'px';cafeGalleryTarget.style.width=w+'px';cafeGalleryTarget.style.height=h+'px';cafeGalleryTarget.disabled=!!cafeDisplayRequest;
 cafeGalleryTarget.setAttribute('aria-busy',String(!!cafeDisplayRequest));
 cafeGalleryTarget.setAttribute('aria-label',cafeDisplayRequest?'Saving your drawing to the café gallery':cafeClubhouse?.carried&&cafeClubhouse.carried.id!==cafeDisplayed()?.id?'Hang your carried drawing in the café gallery. Previous drawings stay in your collection.':cafeDisplayed()?'Café gallery, displaying your drawing':'Café gallery. Bring a drawing from the clubhouse.');
 const art=cafeClubhouse?.carried,offscreen=p.x<0||p.y<0||p.x+w>width||p.y+h>height;
 cafeGalleryCue.hidden=mode!=='world'||hubPaused||!cafeArtAvailable()||!art||art.id===cafeDisplayed()?.id||!!cafeDisplayRequest||!offscreen;
 if(!cafeGalleryCue.hidden&&cafeGalleryCueArt!==art){cafeGalleryCueArt=art;const c=cafeGalleryCueCanvas.getContext('2d');c.clearRect(0,0,108,108);A.rect(c,9,14,90,72,10,'#e8bd7e','#654565',4);A.rect(c,15,20,78,60,5,'#fff9ed',null);UWClubhouseArt.drawPicture(c,art.picture,18,26,72,48);A.line(c,[[51,94],[77,94]],'#654565',5);A.poly(c,[[74,85],[86,94],[74,103]],'#654565',null);}
}
function drawCafeGallery(){
 if(!cafeArtAvailable())return;const q=cafeGallery,art=cafeDisplayed(),ready=cafeClubhouse.carried&&cafeClubhouse.carried.id!==art?.id;
 A.line(ctx,[[q.x+26,q.y],[q.x+q.w/2,q.y-14],[q.x+q.w-26,q.y]],'#795470',3);
 A.rect(ctx,q.x,q.y,q.w,q.h,9,'#e8bd7e','#654565',4);
 A.rect(ctx,q.x+7,q.y+7,q.w-14,q.h-14,4,'#fff9ed','#fff0cd',3);
 if(art){const w=q.w-24,h=w*2/3;UWClubhouseArt.drawPicture(ctx,art.picture,q.x+12,q.y+(q.h-h)/2,w,h);}
 else{A.heart(ctx,q.x+q.w/2,q.y+q.h*.58,21,'#e4bed3');A.line(ctx,[[q.x+q.w-29,q.y+22],[q.x+q.w-29,q.y+38]],'#8c6e9e',4);A.line(ctx,[[q.x+q.w-37,q.y+30],[q.x+q.w-21,q.y+30]],'#8c6e9e',4);}
 if(ready&&!cafeDisplayRequest){A.ellipse(ctx,q.x+q.w-15,q.y+q.h-15,11,11,'#bde4d3','#654565',3);A.line(ctx,[[q.x+q.w-20,q.y+q.h-15],[q.x+q.w-10,q.y+q.h-15]],'#654565',3);A.line(ctx,[[q.x+q.w-15,q.y+q.h-20],[q.x+q.w-15,q.y+q.h-10]],'#654565',3);}
 if(cafeDisplayRequest){for(let i=0;i<3;i++)A.ellipse(ctx,q.x+q.w/2+(i-1)*11,q.y+q.h-7,3,3,'#654565');}
 if(clock<cafeSuccessUntil)A.star(ctx,q.x+q.w-6,q.y+8,13,'#fff1ad');
}
function drawCafeCarry(p,bounce){
 const art=cafeClubhouse?.carried;if(!cafeArtAvailable()||!art)return;
 // A small picture satchel on the opposite side from native meal carrying.
 const x=p.x-p.facing*75-18,y=p.y-58-bounce;A.line(ctx,[[x+7,y],[x+18,y-9],[x+29,y]],'#795470',2);
 A.rect(ctx,x,y,36,33,4,'#fff9ed','#795470',3);UWClubhouseArt.drawPicture(ctx,art.picture,x+4,y+(33-28*2/3)/2,28,28*2/3);
}
function updateCafeGuestReactions(){
 const current=new Set(engine.s.customers.map(c=>c.id));for(const id of cafeGuestReactions.keys())if(!current.has(id))cafeGuestReactions.delete(id);
 const art=cafeDisplayed();
 for(const c of engine.s.customers){if(!['waiting','ordered','eating','finished'].includes(c.phase))continue;
  let reaction=cafeGuestReactions.get(c.id);if(!reaction){reaction={greetUntil:clock,known:false,admired:null};cafeGuestReactions.set(c.id,reaction);}
  // Any unicorn guest may enjoy the real gallery; a familiar greeting is earned separately.
  if((c.visitIndex>1||cafeClubhouse?.friends?.[c.type])&&!c.greeted&&!reaction.known){reaction.known=true;c.greeted=true;reaction.greetUntil=clock+2.6;}
  if(art&&!cafeDisplayRequest&&reaction.admired!==art.id){reaction.admired=art.id;reaction.picture=art.picture;reaction.admireFrom=Math.max(clock,reaction.greetUntil);reaction.admireUntil=reaction.admireFrom+3.8;}
 }
}
function drawCafeGuestReaction(c,height){
 const r=cafeGuestReactions.get(c.id);if(!r)return;
 if(clock<r.greetUntil){A.heart(ctx,c.x+46,c.y-height-9,11,c.type==='pink'?'#eb95bf':'#9ccfea');A.heart(ctx,c.x+62,c.y-height+7,7,'#fff0b7');}
 else if(clock>=r.admireFrom&&clock<r.admireUntil&&window.UWClubhouseArt){
  const x=c.x-30,y=c.y-height-62;A.ellipse(ctx,x+44,y+57,5,4,'#fff9ed','#8c6e9e',2);A.rect(ctx,x,y,62,49,12,'#fff9ed','#8c6e9e',3);UWClubhouseArt.drawPicture(ctx,r.picture,x+8,y+8,45,30);A.heart(ctx,x+57,y+40,9,'#ef9dbb');
 }
}
function feedback(kind='tap'){sound.play(kind);try{if(navigator.vibrate&&!engine.s.settings.reduced)navigator.vibrate(kind==='serve'?22:kind==='wash'?16:8);}catch(_){} }
function announce(text){$('announcer').textContent=text;}
function toast(text,seconds=2.2){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=clock+seconds;announce(text);}
function stopControls(){dismissPictureHint();resetWorldExit();pointer=null;keys.clear();path=[];goal=null;cookPointer=null;playerMoving=false;autoDwell=0;dayPointer=null;}
function syncPrefs(){dom.app.classList.toggle('reduced',engine.s.settings.reduced);sound.mute();}
function updateProgress(){const s=engine.s;
 $('day-progress').innerHTML=`<div class="shift-pips">${Array.from({length:5},(_,i)=>`<span class="meal-pip ${i<s.served?'filled':''}"></span>`).join('')}</div><span class="phase-icon ${s.lunch.done?'done':''}" aria-hidden="true">${imageHTML('lunch')}</span><div class="shift-pips">${Array.from({length:5},(_,i)=>`<span class="meal-pip ${i+5<s.served?'filled':''}"></span>`).join('')}</div><span class="phase-icon ${s.completed?'done':''}" aria-hidden="true">${imageHTML('mop')}</span>`;
 $('day-progress').setAttribute('aria-label',`${s.served} of ten meals, ${s.lunch.done?'lunch finished':'lunch after five meals'}, ${s.completed?'restaurant clean':'cleaning at closing'}`);
}
function decorChoice(stage,id){return `<img src="${A.customData(stage,id,engine.s.decor)}" alt="" draggable="false">`;}
const CUSTOM_STAGES=[['flooring','floor'],['wallpaper','wall'],['tableType','table'],['tablecloth','cloth'],['decoration','flower'],['chairs','chair']];
const CUSTOM_PICTURES={flooring:'floor',wallpaper:'walls',tableType:'tables',tablecloth:'tablecloths',decoration:'decorations',chairs:'chairs'};
function customTabPicture(key){const icon=CUSTOM_PICTURES[key];return icon?'<img src="./assets/refresh_icons_'+icon+'.png" alt="" draggable="false">':decorChoice(key,engine.s.decor[key]);}
function showCustomizer(stage=0){dayScreen.hidden=true;stopControls();mode='customize';dom.ui.hidden=true;dom.kitchen.hidden=true;dom.customizer.hidden=false;customStage=R.clamp(stage,0,6);renderCustomizer();resize();}
function renderCustomizer(){
 const idx=Math.min(customStage,5),[stage,icon]=CUSTOM_STAGES[idx],choices=[...R.CUSTOMIZATION[stage],...growthCatalogue().filter(d=>d.target==='cafe'&&d.category===stage&&window.UWCafeGrowthRuntime.clean(engine.s.growth)?.service.ownedDesigns.includes(d.id)).map(d=>d.id)],selected=engine.s.decor[stage];
 const labels=['Floor','Walls','Tables','Tablecloths','Decorations','Chairs'];
 dom.customizer.innerHTML=`<div class="designer-shell"><div class="designer-banner">Design your Restaurant!</div><nav class="designer-tabs" aria-label="Restaurant design categories">${CUSTOM_STAGES.map(([key,ico],i)=>`<button class="designer-tab ${i===idx?'selected':''}" data-custom-jump="${i}" aria-label="Choose ${key}" aria-pressed="${i===idx}">${customTabPicture(key)}<span>${labels[i]}</span></button>`).join('')}</nav><div class="designer-preview"><canvas id="designer-preview" aria-label="Live restaurant design preview"></canvas></div><div class="designer-picker"><div class="custom-options">${choices.map(id=>`<button class="custom-choice ${id===selected?'selected':''}" data-custom-stage="${stage}" data-custom-value="${id}" aria-label="Choose ${stage} ${id}" aria-pressed="${id===selected}">${decorChoice(stage,id)}</button>`).join('')}</div></div><button class="designer-open" data-action="open" aria-label="Open the restaurant"><img src="./assets/refresh_icons_play.png" alt="" draggable="false"></button></div>`;
 drawDesignerPreview();
}
function drawDesignerPreview(){const canvas=$('designer-preview');if(!canvas||!loaded)return;const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,r.width*2);canvas.height=Math.max(1,r.height*2);const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,d=engine.s.decor;c.imageSmoothingEnabled=false;c.save();c.scale(w/1800,h/1100);A.drawRoomShell(c,d);A.drawStationLayer(c);for(const t of R.TABLES)A.drawTableFurniture(c,t.food.x,t.food.y,d,t.symbol,t.colour,0,false);A.sprite(c,'u_idle0',800,440,134,134);c.restore();}
function openRestaurant(){presentationGate('world',null,openRestaurantReady);}
function openRestaurantReady(){sound.unlock();feedback('hello');stopControls();dayScreen.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=true;dom.ui.hidden=false;dom.modal.innerHTML='';mode='world';hudSignature='';npcPaths.clear();idle=0;spawnClock=0;
 if(engine.s.completed){showComplete();return;}
 if(!engine.s.customers.length&&engine.s.issued===0)engine.spawn(1);
 engine.updateDay();save();updateHUD(true);resize();
 if(engine.s.phase==='lunch')openLunch();else if(engine.prep)openCooking();
}
function orderCustomer(){const s=engine.s;return (s.tray&&engine.customer(s.tray.orderId))||(s.prep&&engine.customer(s.prep.orderId))||engine.customer(s.active)||engine.nextOrder()||s.customers.find(c=>c.phase==='waiting')||null;}
function firstDirty(){return engine.s.tables.findIndex(t=>t.status==='dirty');}
function primaryInfo(){const s=engine.s,p=s.player;if(worldReady&&worldExitLatch&&UWPortals.contains(worldExitArea,p))return {type:'world-exit',aria:'Return to Unicorn World',icon:'home'};const clean=nextCleanTask();if(s.phase==='cleaning'&&clean){if(clean.kind==='floor'){if(!s.mopEquipped)return {type:'mop-pickup',near:Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y)<=112,aria:'Pick up the mop by the sink',icon:'mop'};return {type:'mop-floor',task:clean.id,near:Math.hypot(p.x-clean.x,p.y-clean.y)<=112,aria:'Move to the dirty patch and press to mop',icon:'mop'};}return {type:'clean',task:clean.id,aria:'Clean this part of the restaurant',icon:'sponge'};}if(s.phase==='break')return {type:worldLink?'explore':'continue',aria:worldLink?'Explore Unicorn World':'Start afternoon service',icon:worldLink?'home':'play'};if(s.phase==='lunch')return {type:'lunch',aria:'Take your lunch break',icon:'lunch'};if(s.completed)return {type:'new-day',aria:'Open another restaurant day',icon:'play'};
 if(s.dirtyTray){const near=Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y)<105;return {type:'sink',aria:near?'Wash the dirty dish':'Bring dirty dish to the sink',icon:'sink',near};}
 if(s.tray){const c=engine.customer(s.tray.orderId);if(c){const near=Math.hypot(p.x-R.TABLES[c.table].meet.x,p.y-R.TABLES[c.table].meet.y)<55;return {type:'table',id:c.id,table:c.table,aria:near?'Serve the meal':'Bring meal to its table',food:s.tray,near};}}
 if(s.prep){const c=engine.customer(s.prep.orderId),near=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y)<105;return {type:'kitchen',id:c?.id,aria:near?'Keep cooking':'Go to the kitchen',food:c?{dish:c.dish,variant:c.variant}:null,near};}
 let c=engine.customer(s.active);if(!c||!['waiting','ordered','arriving'].includes(c.phase))c=engine.nextOrder()||s.customers.find(x=>x.phase==='waiting')||s.customers.find(x=>x.phase==='arriving');
 if(c){if(c.phase==='ordered'){const near=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y)<105;return {type:'kitchen',id:c.id,aria:near?'Make the picture order':'Go to the kitchen',food:{dish:c.dish,variant:c.variant},near};}
  const near=Math.hypot(p.x-R.TABLES[c.table].meet.x,p.y-R.TABLES[c.table].meet.y)<55;return {type:'table',id:c.id,table:c.table,aria:c.phase==='waiting'?(near?'Take the picture order':'Go to the customer'):'Meet the arriving customer',food:{dish:c.dish,variant:c.variant},near};}
 const dirty=selectedCleanup!==null&&s.tables[selectedCleanup]?.status==='dirty'?selectedCleanup:firstDirty();if(dirty>=0){const near=Math.hypot(p.x-R.TABLES[dirty].meet.x,p.y-R.TABLES[dirty].meet.y)<105;return {type:'dirty',table:dirty,aria:near?'Pick up the dirty dish':'Go clear the table',icon:'bubbles',near};}
 return {type:'wait',aria:'Guests are coming',icon:'heart'};
}
function actionHTML(info){if(info.type==='world-exit')return UWArt.icon('home');if(['explore','continue'].includes(info.type))return worldLink?UWArt.icon('home'):A.icon('play');if(['clean','lunch','mop-pickup','mop-floor'].includes(info.type))return imageHTML(info.icon);if(info.food){const badge=info.table!==undefined?tableMarkHTML(info.table,'mini'):`<span class="mini">${A.icon('oven')}</span>`;return `<span class="action-stack">${foodHTML(info.food.dish,info.food.variant)}${badge}</span>`;}if(info.type==='table'&&info.table!==undefined)return `<span class="action-stack">${A.icon('heart')}${tableMarkHTML(info.table,'mini')}</span>`;if(info.type==='kitchen')return `<span class="action-stack">${A.icon('chef')}<span class="mini">${A.icon('oven')}</span></span>`;if(info.type==='dirty')return `<span class="action-stack">${A.icon('tray')}<span class="mini">${A.icon('bubbles')}</span></span>`;if(info.type==='sink')return `<span class="action-stack">${A.icon('bubbles')}<span class="mini">${A.icon('sink')}</span></span>`;return A.icon(info.icon||'heart');}
function partyPictures(c,compact=false){if(!c?.items)return '';return `<span class="party-items" style="display:flex;gap:4px;align-items:center;justify-content:center;flex-wrap:wrap" aria-label="${c.items.filter(i=>i.served).length} of ${c.items.length} meals served">${c.items.map(i=>`<span style="position:relative;width:${compact?32:52}px;height:${compact?32:52}px;opacity:${i.served?.55:1};border:${i.id===c.activeItem&&!i.served?'2px solid #d5a94c':'2px solid transparent'};border-radius:8px">${foodHTML(i.dish,i.variant,'party-food').replace('<img ','<img style="width:100%;height:100%;object-fit:contain" ')}${i.served?`<span style="position:absolute;right:-2px;bottom:-2px;width:16px;height:16px;background:#f7ebd5;border-radius:50%">${A.icon('check')}</span>`:''}</span>`).join('')}</span>`;}
function partyPortraits(c){return (c?.members||[{type:c.type}]).map(m=>imageHTML(guestKey({...c,type:m.type}),'customer')).join('');}
function favouriteHTML(c){return R.favouriteGuest(c)?`<span class="favourite-picture" aria-label="This guest’s favourite">${A.icon('heart')}</span>`:'';}
function updateOrderPin(){const c=orderCustomer();if(engine.s.phase==='cleaning'){dom.orderPin.hidden=false;const n=engine.s.cleaning.filter(q=>q.p>=R.CLEAN_TASKS.find(t=>t.id===q.id).need).length;dom.orderPin.innerHTML=`${imageHTML(R.surfacesClean(engine.s)?'mop':'sponge','variant')}<span class="cleanup-meter" aria-label="${n} of ${R.CLEAN_TASKS.length} areas clean"><span style="width:${100*n/R.CLEAN_TASKS.length}%"></span></span><button class="cleanup-find" data-action="find-mess" aria-label="Find unfinished cleaning">${A.icon('arrow')}<span>Find mess</span></button>`;return;}if(!c||!['ordered','waiting'].includes(c.phase)){dom.orderPin.hidden=true;dom.orderPin.innerHTML='';return;}dom.orderPin.hidden=false;dom.orderPin.innerHTML=`<button class="order-picture-action" data-order-table="${c.table}" aria-label="${c.phase==='waiting'?'Go take':'Go cook'} ${variantInfo(c.dish,c.variant).name} ${R.RECIPES[c.dish].name} for the ${R.TABLES[c.table].name}">${imageHTML(guestKey(c),'pin-portrait')}${favouriteHTML(c)}${tableMarkHTML(c.table,'badge-svg')}<span class="pin-arrow">${A.icon(c.phase==='waiting'?'hand':'oven')}</span>${c.items?.length>1?partyPictures(c,true):foodHTML(c.dish,c.variant,'food')+variantHTML(c.dish,c.variant,'variant')}</button>`;}
function updateHUD(force=false){if(mode!=='world')return;const s=engine.s,info=primaryInfo(),sig=JSON.stringify([s.customers.map(c=>[c.id,c.table,c.phase,c.activeItem,c.items?.map(i=>i.served)]),s.active,s.tray,s.dirtyTray,s.tables.map(t=>t.status),s.served,info.type,info.id,info.table,info.task,info.near,s.mopEquipped,s.phase,s.cleaning.map(t=>t.p)]);if(!force&&sig===hudSignature)return;hudSignature=sig;dom.primary.innerHTML=actionHTML(info);dom.primary.disabled=info.type==='wait';dom.primary.setAttribute('aria-label',info.aria);updateOrderPin();updateProgress();dom.guide.style.opacity=s.total>0&&idle<7?'.12':'.82';}
function nearestWaitingCandidate(){
 const p=engine.s.player;let best=null,dist=Infinity;
 for(const c of engine.s.customers){if(c.phase!=='waiting')continue;const m=R.TABLES[c.table].meet,d=Math.hypot(p.x-m.x,p.y-m.y);if(d<dist){dist=d;best={key:`order:${c.id}`,kind:'order',id:c.id,table:c.table,x:m.x,y:m.y,radius:55,dist};}}
 return best;
}
function nearestDirtyCandidate(){
 const p=engine.s.player;let best=null,dist=Infinity;
 for(let i=0;i<R.TABLES.length;i++){if(engine.s.tables[i].status!=='dirty')continue;const m=R.TABLES[i].meet,d=Math.hypot(p.x-m.x,p.y-m.y);if(d<dist){dist=d;best={key:`dirty:${i}`,kind:'dirty',table:i,x:m.x,y:m.y,radius:112,dist};}}
 return best;
}
function autoCandidate(){
 if(mode!=='world')return null;const s=engine.s,p=s.player;
 if(s.completed||['lunch','break'].includes(s.phase))return null;
 if(s.phase==='cleaning'){const t=nextCleanTask();if(!t||t.kind==='floor')return null;return {key:'clean:'+t.id,kind:'clean',task:t.id,x:t.x,y:t.y,radius:126,dist:Math.hypot(p.x-t.x,p.y-t.y)};}
 // Carry states intentionally narrow the interaction target: a meal goes only to
 // its matching table, and a dirty dish goes only to the sink.
 if(s.dirtyTray){const d=Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y);return {key:'sink',kind:'sink',x:R.SINK.x,y:R.SINK.y,radius:122,dist:d};}
 if(s.tray){const c=engine.customer(s.tray.orderId);if(c){const m=R.TABLES[c.table].meet,d=Math.hypot(p.x-m.x,p.y-m.y);return {key:`serve:${c.id}`,kind:'serve',id:c.id,table:c.table,x:m.x,y:m.y,radius:55,dist:d};}return null;}
 if(s.prep){const d=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y);return {key:`cook:${s.prep.orderId}`,kind:'kitchen',id:s.prep.orderId,x:R.KITCHEN.x,y:R.KITCHEN.y,radius:124,dist:d};}
 // Otherwise proximity wins over the global task queue. This is what makes the
 // unicorn feel physical: if the child walks to a waiting guest or a dirty table,
 // that nearby thing responds even when another order also exists elsewhere.
 const pool=[];
 const ordered=engine.customer(s.active)?.phase==='ordered'?engine.customer(s.active):engine.nextOrder();
 if(ordered){const d=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y);pool.push({key:`kitchen:${ordered.id}`,kind:'kitchen',id:ordered.id,x:R.KITCHEN.x,y:R.KITCHEN.y,radius:124,dist:d});}
 const waiting=nearestWaitingCandidate();if(waiting)pool.push(waiting);
 const dirty=nearestDirtyCandidate();if(dirty)pool.push(dirty);
 if(!pool.length)return null;
 pool.sort((a,b)=>(a.dist/a.radius)-(b.dist/b.radius));return pool[0];
}
function triggerAutoInteraction(c){
 if(!c||mode!=='world')return false;autoLastTrigger=c.key;autoFlashUntil=clock+.8;
 if(c.kind==='clean'){openClean(c.task);return true;}
 if(c.kind==='sink'){if(engine.s.dirtyTray){feedback('wash');openWash();return true;}return false;}
 if(c.kind==='serve'){if(engine.s.tray){serveAt(c.table);return true;}return false;}
 if(c.kind==='kitchen'){
   const guest=engine.customer(c.id)||engine.nextOrder();if(guest?.phase==='ordered')engine.selectOrder(guest.id);feedback('tap');
   if(engine.prep)openCooking();else if(guest)openRecipeMenu();
   return !!guest||!!engine.prep;
 }
 if(c.kind==='order'){
   const guest=engine.customer(c.id);if(guest?.phase==='waiting'){engine.takeOrder(guest.id);feedback('hello');burst(guest.x,guest.y-75,13,R.TABLES[guest.table].colour);save();updateHUD(true);return true;}return false;
 }
 if(c.kind==='dirty'){
   if(engine.pickDirty(c.table)){feedback('tap');selectedCleanup=null;burst(R.TABLES[c.table].food.x,R.TABLES[c.table].food.y-20,9,R.TABLES[c.table].colour);save();updateHUD(true);return true;}return false;
 }
 return false;
}
function updateAutoInteraction(dt,playerStopped){
 if(mode!=='world'){autoDwell=0;autoZoneInside=false;return;}
 const c=autoCandidate();
 if(!c){autoZoneKey=null;autoZoneInside=false;autoDwell=0;return;}
 const inside=c.dist<=c.radius;
 if(c.key!==autoZoneKey){autoZoneKey=c.key;autoZoneInside=false;autoDwell=0;}
 if(!inside){if(c.dist>c.radius+AUTO_EXIT_PAD)autoZoneInside=false;autoDwell=0;return;}
 if(autoZoneInside)return;
 if(playerStopped){autoDwell+=dt;if(autoDwell>=AUTO_DWELL){autoZoneInside=true;autoDwell=0;triggerAutoInteraction(c);}}
 else autoDwell=Math.max(0,autoDwell-dt*.8);
}
function drawAutoInteractionHint(){
 const c=autoCandidate();if(!c||c.dist>c.radius*1.85||autoZoneInside)return;
 const pulse=engine.s.settings.reduced?1:.5+.5*Math.sin(clock*5),near=c.dist<=c.radius;
 ctx.save();ctx.globalAlpha=near?.72:.28+.18*pulse;ctx.lineWidth=near?7:5;ctx.strokeStyle=near?'#fff7c7':'#f8e7ff';ctx.setLineDash(near?[]:[5,14]);ctx.beginPath();ctx.ellipse(c.x,c.y,c.radius*.58,c.radius*.25,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);A.star(ctx,c.x,c.y-c.radius*.34,near?11:8,near?'#ffe58b':'#f2c8ee',engine.s.settings.reduced?0:clock*.35);ctx.restore();
}
function route(kind,arg=null){if(mode!=='world')return;let dest=null,id=null,table=null;if(kind==='mop')dest=R.SINK;else if(kind==='kitchen'){id=arg;dest=R.KITCHEN;if(id&&engine.customer(id)?.phase==='ordered')engine.selectOrder(id);}else if(kind==='clean'){const t=R.CLEAN_TASKS.find(t=>t.id===arg);id=arg;dest=t;}else if(kind==='sink')dest=R.SINK;else if(kind==='table'){id=arg;const c=engine.customer(id);if(c){table=c.table;dest=R.TABLES[table].meet;}}else if(kind==='dirty'){table=arg;dest=R.TABLES[table]?.meet;}if(!dest)return;dest=R.safePoint(dest);path=R.pathfind(engine.s.player,dest);goal={kind,id,table,x:dest.x,y:dest.y};idle=0;updateHUD(true);}
function onTable(index){if(mode!=='world')return;selectedCleanup=index;const c=engine.atTable(index);if(engine.s.tray){path=R.pathfind(engine.s.player,R.TABLES[index].meet);goal={kind:'table',id:c?.id||null,table:index,x:R.TABLES[index].meet.x,y:R.TABLES[index].meet.y};return;}if(engine.s.tables[index].status==='dirty'){route('dirty',index);return;}if(!c)return;if(c.phase==='ordered'){engine.selectOrder(c.id);save();route('kitchen',c.id);}else if(c.phase==='waiting'||c.phase==='arriving')route('table',c.id);else{feedback('hello');burst(c.x,c.y-80,8,R.TABLES[index].colour);}}
function mainAction(){sound.unlock();if(mode!=='world')return;const info=primaryInfo();if(info.type==='world-exit'||info.type==='explore'){requestWorldExit();return;}if(info.type==='continue'){engine.leaveCafe();engine.enterCafe();save();updateHUD(true);return;}if(info.type==='mop-pickup'){if(info.near&&engine.pickupMop()){feedback('ready');save();updateHUD(true);toast('Mop ready! Move to a dirty patch.');}else route('mop');}else if(info.type==='mop-floor'){if(!info.near){toast('Move closer to the dirty patch, then press the mop.');return;}if(clock<mopLast+.22)return;const result=engine.cleanAct(info.task);if(result.ok){mopLast=clock;mopSwingUntil=clock+.38;feedback(result.done?'wash':'tap');save();updateHUD(true);updateProgress();const t=R.CLEAN_TASKS.find(t=>t.id===info.task);burst(t.x,t.y,8,result.done?'#fff0b4':'#b6e4dd');}}else if(info.type==='clean')route('clean',info.task);else if(info.type==='lunch')openLunch();else if(info.type==='new-day')showComplete();else if(info.type==='kitchen')route('kitchen',info.id);else if(info.type==='sink')route('sink');else if(info.type==='table')route('table',info.id);else if(info.type==='dirty')route('dirty',info.table);}
function performGoal(){if(!goal)return;const g=goal;goal=null;if(g.kind==='mop'){toast('Press the mop button to pick it up.');updateHUD(true);return;}if(g.kind==='clean'){openClean(g.id);return;}
 if(g.kind==='kitchen'){if(engine.s.dirtyTray){route('sink');return;}if(engine.s.tray){showCarryQuestion();return;}if(engine.prep){openCooking();return;}const c=engine.customer(engine.s.active)||engine.nextOrder();if(c){engine.selectOrder(c.id);openRecipeMenu();}return;}
 if(g.kind==='sink'){if(engine.s.dirtyTray)openWash();return;}
 if(g.kind==='dirty'){if(engine.pickDirty(g.table)){feedback('tap');selectedCleanup=null;save();updateHUD(true);burst(R.TABLES[g.table].food.x,R.TABLES[g.table].food.y-20,9,R.TABLES[g.table].colour);}return;}
 if(g.kind==='table'){
  if(engine.s.tray){serveAt(g.table);return;}const c=engine.atTable(g.table);if(!c)return;if(c.phase==='waiting'){engine.takeOrder(c.id);feedback('hello');burst(c.x,c.y-75,13,R.TABLES[c.table].colour);save();updateHUD(true);}else if(c.phase==='ordered'){engine.selectOrder(c.id);save();updateHUD(true);}return;
 }}
function serveAt(table){const party=engine.atTable(table),servedItem=engine.s.tray?.itemId,result=engine.serve(table);if(result.ok){feedback('serve');joyUntil=clock+1.5;burst(R.TABLES[table].food.x,R.TABLES[table].food.y-65,28,R.TABLES[table].colour);if(save()&&party){queueGuestReaction(party.id,'item-served',servedItem);if(party.items.every(i=>i.served))queueGuestReaction(party.id,'party-served');}updateHUD(true);}else if(result.reason==='table'){feedback('oops');showTableMismatch(table,result.target);}else if(result.reason==='dish'||result.reason==='variant'){feedback('oops');showMealMismatch(engine.atTable(table)||engine.customer(engine.s.tray?.orderId));}}
function ticketHTML(c){if(!c)return '';return `<div class="ticket">${partyPortraits(c)}${tableMarkHTML(c.table)}${A.icon('arrow').replace('<svg ','<svg class="arrow" ')}${c.items?.length>1?partyPictures(c):foodHTML(c.dish,c.variant,'food')+variantHTML(c.dish,c.variant,'variant')}</div>`;}
function kitchenHeader(c,retry=false){return `<div class="kitchen-header"><button class="small-round" data-action="leave-kitchen" aria-label="Back to restaurant">${A.icon('back')}</button><div class="kitchen-title-pic">${c?foodHTML(c.dish,c.variant):engine.s.phase==='lunch'?foodHTML(engine.s.lunch.meal,engine.s.lunch.variant):A.icon('chef')}</div>${retry?`<button class="small-round" data-action="restart-recipe" aria-label="Restart this recipe">${A.icon('retry')}</button>`:'<span></span>'}</div>`;}
function openRecipeMenu(){toastUntil=0;$('toast').classList.remove('show');stopControls();mode='recipes';dom.ui.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=false;const c=engine.customer(engine.s.active)||engine.nextOrder();if(!c){returnToWorld();return;}engine.selectOrder(c.id);save();dom.kitchen.innerHTML=kitchenHeader(c)+ticketHTML(c)+`<div class="menu-grid">${R.MENU.map(d=>{const r=R.RECIPES[d],v=d===c.dish?c.variant:r.variants[0].id;return `<button data-recipe="${d}" class="dish-card ${d===c.dish?'requested':''}" aria-label="Make ${r.name}${d===c.dish?', matching picture order':''}">${foodCategoryHTML(d)}${d===c.dish?`<span class="request-star">${A.icon('star')}</span>`:''}</button>`;}).join('')}</div>`;resize();announce(`Picture order is ${R.RECIPES[c.dish].name}, ${variantInfo(c.dish,c.variant).name}.`);}
function startRecipe(dish){const c=engine.customer(engine.s.active);if(!c||!engine.startRecipe(c.id,dish))return;feedback('tap');save();openCooking();}
function currentStepTool(p,st){
 if(p.variant&&R.RECIPES[p.dish].variants.find(v=>v.id===p.variant)?.growthId&&['scoop','cup'].includes(st.tool))return variantInfo(p.dish,p.variant).icon;
 if(p.variant&&['topping','fruit'].includes(st.tool))return variantInfo(p.dish,p.variant).icon;
 if(p.dish==='icecream'&&st.tool==='scoop')return p.variant==='vanilla'?'ice_vanilla':'ice_strawberry';
 if(p.dish==='soup'&&st.tool==='chopper'&&p.variant)return variantInfo(p.dish,p.variant).icon;
 if(p.dish==='smoothie'&&st.tool==='cup'&&p.variant)return 'smoothie_'+p.variant;
 if(p.dish==='cupcake'&&st.tool==='whisk')return 'cupcake_batter';
 return st.tool;
}
function customerOrderHTML(c){
 if(!c)return '';
 const flavour=variantInfo(c.dish,c.variant);
 return `<section class="customer-order" aria-label="Customer order: ${flavour.name} ${R.RECIPES[c.dish].name}, ${R.TABLES[c.table].name}"><div class="order-person">${imageHTML(guestKey(c),'order-portrait')}${favouriteHTML(c)}<strong>Order</strong>${tableMarkHTML(c.table,'order-table')}</div>${c.items?.length>1?partyPictures(c):foodHTML(c.dish,c.variant,'order-meal')}<strong class="order-dish-name">${R.RECIPES[c.dish].name}</strong><div class="order-flavour">${variantHTML(c.dish,c.variant,'order-ingredient')}<span>${flavour.name}</span></div></section>`;
}
function cookingActionHTML(tool,label,hint,action='prep',progress=null){
 const count=progress&&progress.need>1?`<span class="action-progress" aria-label="${progress.p} of ${progress.need}">${Array.from({length:progress.need},(_,i)=>`<i class="${i<progress.p?'done':''}"></i>`).join('')}</span>`:'';
 const picture=action==='carry'&&engine.prep?foodHTML(engine.prep.dish,engine.prep.variant):`<img src="${A.toolData(tool)}" alt="">`;
 return `<button ${action==='prep'?'id="prep-action" ':''}class="picture-tool action-control ${action==='carry'?'carry':''}" data-action="${action}" aria-label="${label}. ${hint}"><span class="action-ingredient">${picture}</span><span class="action-copy"><strong>${label}</strong><small>${hint}</small>${count}</span><span class="action-arrow" aria-hidden="true">${A.icon('arrow')}</span></button>`;
}
function openCooking(){presentationGate('recipe',engine.prep?.dish,openCookingReady);}
function openCookingReady(){dayScreen.hidden=true;toastUntil=0;$('toast').classList.remove('show');stopControls();mode='cook';dom.ui.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=false;kitchenSignature='';washCanvas=null;const p=engine.prep;if(!p){openRecipeMenu();return;}const c=engine.customer(p.orderId);engine.s.active=p.orderId;
 dom.kitchen.innerHTML=`<div class="cook-layout">${kitchenHeader(c,true)}<div class="recipe-banner">Make ${p.dish==='chicken'?'Roast Chicken':R.RECIPES[p.dish].name}!</div><div id="step-dots" class="step-dots"></div><div class="work-area"><canvas id="work-canvas" aria-label="Food preparation area. Tap or drag to prepare." tabindex="0"></canvas><div id="step-picture" class="step-picture"></div></div><aside class="cook-order">${engine.s.phase==='lunch'?`<section class="customer-order self-order" aria-label="Cook your own lunch">${imageHTML('u_idle0','order-portrait')}<strong>Your lunch</strong>${foodHTML(p.dish,p.variant,'order-meal')}<span>You choose the flavour!</span></section>`:customerOrderHTML(c)}</aside><div id="cook-tools" class="cook-tools"></div></div>`;
 cookCanvas=$('work-canvas');cookContext=cookCanvas.getContext('2d');bindCookCanvas();updateCookUI(true);resize();save();}
function updateCookUI(force=false){const p=engine.prep;if(!p||mode!=='cook')return;const r=R.RECIPES[p.dish],st=r.steps[p.step],sig=JSON.stringify([p.dish,p.step,p.p,p.variant,p.deco,p.done,p.placements]);if(!force&&sig===kitchenSignature)return;kitchenSignature=sig;
 const stepPic=$('step-picture'),dots=$('step-dots'),tools=$('cook-tools');
 tools.className='cook-tools';
 if(p.done){
  tools.classList.add('ready-actions');stepPic.innerHTML=A.icon('check');
  dots.innerHTML=r.steps.map(()=>`<span class="step-dot finished">${A.icon('check')}</span>`).join('');
  tools.innerHTML=`${p.dish==='cupcake'?`<div class="free-deco">${r.decorations.map(d=>`<button data-decoration="${d.id}" aria-label="Free ${d.name}">${imageHTML(d.icon)}<span>${d.name.replace(' sprinkles','')}</span></button>`).join('')}</div>`:''}${cookingActionHTML('tray',engine.s.phase==='lunch'?'Eat with friends':'Take to table','Your food is ready','carry')}`;return;
 }
 const tool=currentStepTool(p,st);
 stepPic.innerHTML=`${st.action==='choice'||st.action==='decorate'?A.icon('star'):`<img src="${A.toolData(tool)}" alt="">`}<span class="sr-only">${st.label}</span>`;
 dots.innerHTML=r.steps.map((s,i)=>`<span class="step-dot ${i<p.step?'finished':i===p.step?'current':''}">${i<p.step?A.icon('check'):s.action==='choice'||s.action==='decorate'?A.icon('star'):`<img src="${A.toolData(currentStepTool(p,s))}" alt="">`}</span>`).join('');
 if(st.action==='choice'){
  tools.classList.add('choice-actions');tools.innerHTML=engine.availableVariants(p.dish).map(v=>`<button class="picture-tool choice" data-variant="${v.id}" aria-label="Choose ${v.name}"><img src="${A.toolData(v.icon)}" alt=""><span>${v.name}</span></button>`).join('');
 }else if(st.action==='decorate'){
  tools.classList.add('choice-actions');tools.innerHTML=r.decorations.map(v=>`<button class="picture-tool choice" data-decoration="${v.id}" aria-label="Choose ${v.name}. Any decoration is correct."><img src="${A.toolData(v.icon)}" alt=""><span>${v.name.replace(' sprinkles','')}</span></button>`).join('');
 }else{
  tools.classList.add('single-action');
  const label=p.dish==='icecream'&&st.tool==='scoop'?'Add a scoop':st.label;
  const hint=p.dish==='icecream'&&st.tool==='scoop'?'Tap here or rub the cone':st.action==='stir'?'Tap here or stir the food':st.action==='rub'?'Tap here or rub the food':st.action==='hold'?'Tap here or hold on the food':st.action==='place'?'Tap here or place on the food':'Tap to add it';
  tools.innerHTML=cookingActionHTML(tool,label,hint,'prep',{p:p.p,need:st.need});
 }

}
function doPrep(value=null,meta=null){if(mode!=='cook')return;const result=engine.act(value,meta);if(!result.ok)return;cookBump=1;feedback(result.done?'ready':'tap');save();if(result.advanced){cookPointer=null;cookStepLock=-1;cookPrev=null;cookMoved=false;}updateCookUI();if(result.done){cleanDoneAt=clock+.38;announce('Meal ready to carry.');}}
function cookPoint(e){const r=cookCanvas.getBoundingClientRect();return {x:R.clamp((e.clientX-r.left)/r.width,0,1),y:R.clamp((e.clientY-r.top)/r.height,0,1)};}
function cookDown(e){if(mode!=='cook'||e.button>0||cookPointer!==null)return;const p=engine.prep,st=p&&R.RECIPES[p.dish].steps[p.step];if(!p||p.done||!st||['choice','decorate'].includes(st.action))return;e.preventDefault();sound.unlock();cookPointer=e.pointerId;cookStepLock=p.step;cookPrev={x:e.clientX,y:e.clientY};cookDistance=0;cookLast=clock;cookMoved=false;try{cookCanvas.setPointerCapture(e.pointerId);}catch(_){}
 if(st.action==='place'){const q=cookPoint(e);doPrep(null,q);}else if(st.action==='tap')doPrep();}
function cookMove(e){if(cookPointer!==e.pointerId||mode!=='cook'||!engine.prep||engine.prep.step!==cookStepLock)return;const st=R.RECIPES[engine.prep.dish].steps[engine.prep.step],dx=e.clientX-cookPrev.x,dy=e.clientY-cookPrev.y,d=Math.hypot(dx,dy);cookDistance+=d;cookMoved=cookMoved||d>7;cookPrev={x:e.clientX,y:e.clientY};if(['rub','stir'].includes(st.action)&&cookDistance>34&&clock-cookLast>.11){cookDistance=0;cookLast=clock;doPrep();}else if(st.action==='place'&&cookDistance>45&&clock-cookLast>.14){cookDistance=0;cookLast=clock;doPrep(null,cookPoint(e));}}
function cookUp(e){if(cookPointer!==e.pointerId)return;const p=engine.prep,st=p&&p.step===cookStepLock?R.RECIPES[p.dish].steps[p.step]:null;if(st&&['rub','stir','hold'].includes(st.action)&&!cookMoved&&p?.step===cookStepLock)doPrep();cookPointer=null;cookStepLock=-1;cookPrev=null;try{if(cookCanvas.hasPointerCapture(e.pointerId))cookCanvas.releasePointerCapture(e.pointerId);}catch(_){} }
function bindCookCanvas(){cookCanvas.addEventListener('pointerdown',cookDown);cookCanvas.addEventListener('pointermove',cookMove);cookCanvas.addEventListener('pointerup',cookUp);cookCanvas.addEventListener('pointercancel',e=>{cookPointer=null;cookStepLock=-1;cookPrev=null;});}
function openWash(){if(!engine.s.dirtyTray){returnToWorld();return;}stopControls();mode='wash';dom.ui.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=false;washDone=false;washSnapshot={...engine.s.dirtyTray};dom.kitchen.innerHTML=kitchenHeader(null,false)+`<div class="ticket">${tableMarkHTML(washSnapshot.table)}${A.icon('arrow').replace('<svg ','<svg class="arrow" ')}${A.icon('sink')}${A.icon('bubbles')}</div><div class="wash-body"><canvas id="wash-canvas" aria-label="Sink washing area. Rub or tap bubbles to wash the dish." tabindex="0"></canvas><div id="wash-tools" class="wash-tools"><button class="picture-tool" data-action="wash" aria-label="Wash the dish">${A.icon('bubbles')}</button></div></div>`;washCanvas=$('wash-canvas');washContext=washCanvas.getContext('2d');bindWashCanvas();resize();save();}
function doWash(){if(mode!=='wash'||washDone)return;const result=engine.washAct();if(!result.ok)return;feedback(result.done?'wash':'tap');save();if(result.done){washDone=true;burst(R.SINK.x,R.SINK.y-50,18,'#a7dfe5');$('wash-tools').innerHTML=`<button class="picture-tool carry" data-action="wash-return" aria-label="Return to restaurant">${A.icon('check')}</button>`;}drawWashing();}
function washDown(e){if(mode!=='wash'||e.button>0||washDone)return;e.preventDefault();sound.unlock();cookPointer=e.pointerId;cookPrev={x:e.clientX,y:e.clientY};cookDistance=0;cookMoved=false;try{washCanvas.setPointerCapture(e.pointerId);}catch(_){} }
function washMove(e){if(cookPointer!==e.pointerId||washDone)return;const d=Math.hypot(e.clientX-cookPrev.x,e.clientY-cookPrev.y);cookDistance+=d;cookMoved=cookMoved||d>6;cookPrev={x:e.clientX,y:e.clientY};if(cookDistance>38){cookDistance=0;doWash();}}
function washUp(e){if(cookPointer!==e.pointerId)return;if(!cookMoved&&!washDone)doWash();cookPointer=null;cookPrev=null;try{if(washCanvas.hasPointerCapture(e.pointerId))washCanvas.releasePointerCapture(e.pointerId);}catch(_){} }
function bindWashCanvas(){washCanvas.addEventListener('pointerdown',washDown);washCanvas.addEventListener('pointermove',washMove);washCanvas.addEventListener('pointerup',washUp);washCanvas.addEventListener('pointercancel',washUp);}
function carryMeal(){if(engine.s.phase==='lunch'){if(clock<cleanDoneAt||!engine.finishLunchRecipe())return;feedback('ready');save();openLunch();return;}if(clock<cleanDoneAt||!engine.packMeal())return;feedback('ready');save();returnToWorld();}
function leaveKitchen(){if(engine.s.phase==='lunch'){stopControls();dom.kitchen.hidden=true;dom.ui.hidden=true;dayScreen.hidden=false;mode='lunch';renderLunch();resize();save();return;}if(mode==='cook'&&engine.prep){showDialog('Cooking can wait',`<div class="meal-compare"><div class="compare-card">${foodHTML(engine.prep.dish,engine.prep.variant||R.RECIPES[engine.prep.dish].variants[0].id)}</div></div><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('chef')}</button><button class="dialog-button" data-action="pause-cooking" aria-label="Back to restaurant">${A.icon('back')}</button></div><p class="parent-copy">Progress is saved. Either picture is safe.</p>`);return;}returnToWorld();}
function returnToWorld(){presentationGate('world',null,returnToWorldReady);}
function returnToWorldReady(){dayScreen.hidden=true;dayCanvas=null;dayContext=null;stopControls();mode='world';dom.kitchen.hidden=true;dom.customizer.hidden=true;dom.ui.hidden=false;cookCanvas=null;cookContext=null;washCanvas=null;washContext=null;save();updateHUD(true);resize();const c=autoCandidate();autoZoneKey=c?.key||null;autoZoneInside=!!c&&c.dist<=c.radius;autoDwell=0;}
function showDialog(title,body){previousFocus=document.activeElement;modalReturn=mode;stopControls();mode='dialog';dom.modal.innerHTML=`<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2>${body}</section></div>`;dom.modal.querySelector('button')?.focus({preventScroll:true});}
function closeDialog(){pendingHelperHire=null;dom.modal.innerHTML='';mode=modalReturn;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});if(mode==='world')updateHUD(true);}
function menuDialog(){if(!loaded)return;if(mode==='dialog'){closeDialog();return;}showDialog('Restaurant settings',`<div class="settings-grid"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('play')}<span>Keep playing</span></button><button class="dialog-button" data-action="toggle-audio" aria-label="Toggle sound">${A.icon(engine.s.settings.muted?'mute':'sound')}<span>Sound ${engine.s.settings.muted?'off':'on'}</span></button><button class="dialog-button" data-action="toggle-motion" aria-label="Toggle reduced motion">${A.icon('star')}<span>${engine.s.settings.reduced?'Gentle motion':'Animations'}</span></button><button class="dialog-button" data-action="customize" aria-label="Decorate restaurant"><img src="./assets/refresh_icons_decorate.png" alt="" draggable="false"><span>Decorate</span></button><button class="dialog-button" data-action="collection" aria-label="Recipe collection">${foodHTML('pizza','tomato')}<span>Recipe book</span></button><button class="dialog-button" data-action="growth-open" aria-label="Your earned designs">${A.icon('star')}<span>Your designs</span></button><button class="dialog-button quiet" data-action="reset-question" aria-label="Ask to reset restaurant">${A.icon('retry')}<span>Start fresh</span></button></div><p class="parent-copy">${storageOK?'Saved on this device.':'Saving is unavailable on this device.'} ${offlineReady?'Ready for offline play.':''}<br>Start fresh is for grown-ups.</p>`);dom.modal.querySelector('.dialog').classList.add('settings-dialog');}
function compareCard(dish,variant,table,deco=null){return `<div class="compare-card">${tableMarkHTML(table)}${foodHTML(dish,variant)}${variantHTML(dish,variant,'variant')}</div>`;}
function showMealMismatch(c){const t=engine.s.tray;if(!t)return;const target=c||engine.customer(t.orderId);if(!target)return;showDialog('Picture check',`<div class="meal-compare">${compareCard(t.dish,t.variant,target.table,t.deco)}<span class="xmark">×</span>${compareCard(target.dish,target.variant,target.table)}</div><div class="dialog-buttons"><button class="dialog-button good" data-action="fix-meal" aria-label="Remake the meal">${A.icon('retry')}${A.icon('chef')}</button><button class="dialog-button" data-action="resume" aria-label="Keep carrying the meal">${A.icon('tray')}</button></div><p class="parent-copy">The pictures do not match yet. Remaking is gentle and keeps the order.</p>`);}
function showTableMismatch(chosen,targetIndex){const t=engine.s.tray;if(!t)return;const target=Number.isInteger(targetIndex)?targetIndex:engine.customer(t.orderId)?.table;if(target===undefined)return;showDialog('Table check',`<div class="meal-compare"><div class="compare-card">${tableMarkHTML(target)}${foodHTML(t.dish,t.variant)}</div><span class="xmark">≠</span><div class="compare-card">${tableMarkHTML(chosen)}${engine.atTable(chosen)?foodHTML(engine.atTable(chosen).dish,engine.atTable(chosen).variant):A.icon('table')}</div></div><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('tray')}${tableMarkHTML(target)}</button><button class="dialog-button" data-action="fix-meal">${A.icon('retry')}</button></div><p class="parent-copy">The meal is fine; its table picture is different. You can keep carrying or remake.</p>`);}
function showCarryQuestion(){const t=engine.s.tray;if(!t)return;const c=engine.customer(t.orderId);showDialog('Meal on tray',`<div class="meal-compare">${compareCard(t.dish,t.variant,c?.table??0)}</div><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('tray')}</button><button class="dialog-button" data-action="fix-meal">${A.icon('retry')}</button></div>`);}
function showCollection(){const from=mode==='dialog'?modalReturn:mode;if(mode==='dialog')closeDialog();showDialog('Recipe pictures',`<div class="collection">${R.MENU.map(d=>`<img style="opacity:${engine.s.stickers.includes(d)?1:.18}" src="${A.foodData(d,R.RECIPES[d].variants[0].id)}" alt="${R.RECIPES[d].name}">`).join('')}</div><p class="parent-copy">${engine.s.stickers.length} / ${R.MENU.length} recipe pictures · ${engine.s.total} happy meals</p><div class="dialog-buttons"><button class="dialog-button good wide" data-action="resume" aria-label="Back to previous screen">${A.icon('back')}</button></div>`);modalReturn=from;}
function showComplete(){if(!engine.s.completed)return;if(mode==='dialog')closeDialog();const reward=engine.completeServiceGrowth(persistGrowth,growthCatalogue(),!!worldLink?.homeDesign);if(!reward.ok&&reward.reason==='Growth recovery required'){completeShown=true;showDialog('Design collection unavailable','<p>Your saved collection is kept unchanged, but cannot be read by this version. Do not reset your game. Recovery or a compatible version is needed.</p><button class="dialog-button" data-action="resume">Back to play</button>');return;}if(!reward.ok){completeShown=true;showDialog('Saving your service',`<p>Your reward has not been saved yet. Please try again.</p><button class="dialog-button" data-action="growth-retry">Try saving again</button>`);return;}dayScreen.hidden=true;completeShown=true;feedback('serve');showDialog('Restaurant day complete',`<div class="celebration">${imageHTML('u_happy1','', 'Happy unicorn')}<div class="collection">${R.MENU.map(d=>foodHTML(d,R.RECIPES[d].variants[0].id)).join('')}</div></div>${window.UWCafeRewardUI.render(engine.s.growth,growthCatalogue(),growthPreview)}<div class="dialog-buttons"><button class="dialog-button good" data-action="replay" aria-label="Start another day">${A.icon('play')}</button><button class="dialog-button" data-action="new-day" aria-label="Decorate the next day">${A.icon('table')}</button></div><p class="parent-copy">Ten happy meals, a lunch break, every dish returned, every surface wiped and every floor mopped.</p>`);save();if(worldOutfit&&window.UWArt){const im=dom.modal.querySelector('.celebration img');if(im){const cv=document.createElement('canvas');cv.width=200;cv.height=190;cv.setAttribute('aria-label','Happy unicorn in your outfit');const c=cv.getContext('2d');UWArt.unicorn(c,100,180,175,worldOutfit,'u_happy1');im.replaceWith(cv);}}}
function resetQuestion(){if(mode==='dialog')closeDialog();showDialog('Grown-up check',`<p>Start this restaurant completely fresh? This does not touch any other Sneaky Unicorn game.</p><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('back')}</button><button class="dialog-button" data-action="reset-confirm" aria-label="Confirm reset restaurant">${A.icon('retry')}</button></div><p class="parent-copy">This second confirmation protects saved restaurant progress.</p>`);}
function handleAction(action,e){sound.unlock();
 if(action==='lunch-cook'){engine.startLunchRecipe();openCooking();return;}
 if(action==='find-mess'){const t=nextCleanTask();if(t){if(t.kind==='floor'&&!engine.s.mopEquipped)route('mop');else route('clean',t.id);}return;}
 if(action==='lunch-pick'){if(engine.chooseLunch(e.target.closest('button').dataset.meal)){feedback('hello');save();renderLunch();}return;}
 if(action==='settings'){menuDialog();return;}
 if(action==='lunch-pack'){if(engine.packLunch(e.target.closest('button').dataset.item)){feedback('hello');dayPulse=1;save();if(engine.s.lunch.packed===3){engine.startLunchRecipe();save();openCooking();}else renderLunch();}else{feedback('tap');announce('Find the picture shown on the lunchbox.');}return;}
 if(action==='lunch-act'){lunchAction();return;}
 if(action==='lunch-return'){if(engine.endLunch()){feedback('ready');save();returnToWorld();updateProgress();toast(worldLink?'Explore! Afternoon starts when you return.':'Press play when you want the afternoon.');}return;}
 if(action==='clean-act'){cleanAction();return;}
 if(action==='day-return'){returnToWorld();if(engine.s.completed)showComplete();return;}
 switch(action){
 case 'confirm-helper-hire':confirmHelperHire();break;
 case 'growth-retry':showComplete();break;case 'growth-open':showGrowthChoices();break;case 'load-retry':boot();break;case 'replay':engine.newDay();completeShown=false;npcPaths.clear();particles=[];save();openRestaurant();break;case 'open':openRestaurant();break;case 'custom-back':customStage=Math.max(0,customStage-1);renderCustomizer();break;case 'custom-next':customStage=Math.min(6,customStage+1);renderCustomizer();break;
 case 'leave-kitchen':leaveKitchen();break;case 'restart-recipe':showDialog('Restart this meal?',`<div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('back')}</button><button class="dialog-button" data-action="restart-confirm">${A.icon('retry')}</button></div>`);break;
 case 'restart-confirm':closeDialog();engine.restartPrep();save();openCooking();break;case 'prep':if(mode==='cook'){const p=engine.prep,st=p&&R.RECIPES[p.dish].steps[p.step];if(st?.action==='place')doPrep(null,{x:.5+(p.p-1)*.18,y:.48+(p.p%2)*.12});else doPrep();}break;
 case 'carry':carryMeal();break;case 'wash':doWash();break;case 'wash-return':returnToWorld();break;case 'resume':closeDialog();break;case 'pause-cooking':closeDialog();returnToWorld();break;
 case 'fix-meal':closeDialog();engine.remake();save();returnToWorld();route('kitchen',engine.s.active);break;case 'toggle-audio':engine.s.settings.muted=!engine.s.settings.muted;save();syncPrefs();if(!engine.s.settings.muted){sound.unlock();feedback('hello');}closeDialog();menuDialog();break;case 'toggle-motion':engine.s.settings.reduced=!engine.s.settings.reduced;save();syncPrefs();closeDialog();menuDialog();break;
 case 'customize':if(mode==='dialog')closeDialog();showCustomizer(0);break;case 'collection':showCollection();break;case 'new-day':if(mode==='dialog')dom.modal.innerHTML='';engine.newDay();completeShown=false;dayScreen.hidden=true;npcPaths.clear();particles=[];save();showCustomizer(0);break;case 'reset-question':resetQuestion();break;case 'reset-confirm':engine.reset();worldLink?.reset(engine.snapshot());completeShown=false;dayScreen.hidden=true;npcPaths.clear();particles=[];selectedCleanup=null;save();syncPrefs();dom.modal.innerHTML='';showCustomizer(0);break;
 }}
dom.app.addEventListener('click',e=>{if(assetsBlocked())return;const button=e.target.closest('button');if(!button||button.disabled)return;idle=0;if(button.dataset.growthClaim||button.dataset.growthApply){handleGrowthButton(button);return;}if(button.dataset.orderTable!==undefined)onTable(Number(button.dataset.orderTable));else if(button.dataset.customJump!==undefined){customStage=Number(button.dataset.customJump);renderCustomizer();}else if(button.dataset.customStage){if(button.dataset.customValue.startsWith('cafe-design-v1:')){const r=engine.applyDesign(button.dataset.customValue,persistGrowth,growthCatalogue());if(r.ok)renderCustomizer();else toast('Not saved yet. Please try again.');}else if(engine.setDecor(button.dataset.customStage,button.dataset.customValue)){feedback('tap');save();renderCustomizer();}}else if(button.dataset.action)handleAction(button.dataset.action,e);else if(button.dataset.recipe&&mode==='recipes')startRecipe(button.dataset.recipe);else if(button.dataset.variant&&mode==='cook')doPrep(button.dataset.variant);else if(button.dataset.decoration&&mode==='cook'){if(engine.redecorate(button.dataset.decoration)){feedback('tap');save();updateCookUI(true);}else doPrep(button.dataset.decoration);}});
dom.primary.addEventListener('click',mainAction);$('menu').addEventListener('click',menuDialog);
function resize(){const r=dom.stage.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);if(dom.world.width!==Math.round(width*dpr)||dom.world.height!==Math.round(height*dpr)){dom.world.width=Math.round(width*dpr);dom.world.height=Math.round(height*dpr);}for(const canvas of [cookCanvas,washCanvas,dayCanvas])if(canvas){const cr=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(cr.width*dpr)),h=Math.max(1,Math.round(cr.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}}
window.addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(dom.stage);
function screenToWorld(x,y){return {x:x/view.scale+view.x,y:y/view.scale+view.y};}function worldToScreen(x,y){return {x:(x-view.x)*view.scale,y:(y-view.y)*view.scale};}function canvasPosition(e){const r=dom.world.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
dom.world.addEventListener('pointerdown',e=>{if(mode!=='world'||e.button>0||pointer)return;e.preventDefault();sound.unlock();const p=canvasPosition(e);pointer={id:e.pointerId,x:p.x,y:p.y,dx:0,dy:0,moved:0};path=[];goal=null;idle=0;try{dom.world.setPointerCapture(e.pointerId);}catch(_){} });
dom.world.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=canvasPosition(e);pointer.dx=p.x-pointer.x;pointer.dy=p.y-pointer.y;pointer.moved=Math.max(pointer.moved,Math.hypot(pointer.dx,pointer.dy));idle=0;});
function endPointer(e,cancel=false){if(!pointer||pointer.id!==e.pointerId)return;const tap=pointer.moved<9,p=canvasPosition(e);pointer=null;try{if(dom.world.hasPointerCapture(e.pointerId))dom.world.releasePointerCapture(e.pointerId);}catch(_){}if(tap&&!cancel&&mode==='world')worldTap(p.x,p.y);}
dom.world.addEventListener('pointerup',e=>endPointer(e));dom.world.addEventListener('pointercancel',e=>endPointer(e,true));dom.world.addEventListener('lostpointercapture',e=>{if(pointer?.id===e.pointerId)pointer=null;});dom.world.addEventListener('contextmenu',e=>e.preventDefault());
function worldTap(x,y){const djPoint=screenToWorld(x,y);if(cafeGalleryHit(djPoint)){hangCafePicture();return;}const helper=engine.s.helpers.find(h=>Math.abs(h.x-djPoint.x)<65&&djPoint.y<h.y+15&&djPoint.y>h.y-125);if(helper){requestHelperHire(helper.id);return;}if(worldReady&&worldExitLatch&&UWPortals.hit(worldExitArea,djPoint)){path=R.pathfind(engine.s.player,worldExitArea);goal=null;return;}if(Math.abs(djPoint.x-R.STATIONS.dj.x)<R.STATIONS.dj.w/2&&djPoint.y>R.STATIONS.dj.y-R.STATIONS.dj.h&&djPoint.y<R.STATIONS.dj.y){changeMusic();return;}if(engine.s.phase==='cleaning'){const pt=screenToWorld(x,y),ts=engine.cleanTargets();let t=ts.find(t=>Math.hypot(t.artX-pt.x,t.artY-pt.y)<140||Math.hypot(t.x-pt.x,t.y-pt.y)<135);if(t){if(t.kind==='floor'){path=R.pathfind(engine.s.player,R.safePoint(t));goal=null;}else route('clean',t.id);return;}if(R.walkable(pt.x,pt.y)){path=R.pathfind(engine.s.player,pt);goal=null;}return;}for(let i=hits.length-1;i>=0;i--){const h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){onTable(h.table);return;}}const p=screenToWorld(x,y);if(Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y)<120&&engine.s.dirtyTray){route('sink');return;}if(p.x>R.STATIONS.kitchen.x-R.STATIONS.kitchen.w/2&&p.x<R.STATIONS.kitchen.x+R.STATIONS.kitchen.w/2&&p.y>R.STATIONS.kitchen.y-R.STATIONS.kitchen.h&&p.y<R.STATIONS.kitchen.y&&!engine.s.dirtyTray){route('kitchen',engine.s.active);return;}for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i];if(Math.hypot(p.x-t.food.x,p.y-t.food.y)<155||Math.hypot(p.x-t.seat.x,p.y-t.seat.y)<120||Math.hypot(p.x-t.meet.x,p.y-t.meet.y)<150){onTable(i);return;}}if(R.walkable(p.x,p.y)){path=R.pathfind(engine.s.player,p);goal=null;}}
window.addEventListener('keydown',e=>{if(assetsBlocked())return;if([' ','Enter'].includes(e.key)&&document.activeElement?.tagName==='BUTTON')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='Tab'&&mode==='dialog'){const buttons=[...dom.modal.querySelectorAll('button')];if(buttons.length){const i=buttons.indexOf(document.activeElement),n=e.shiftKey?(i<=0?buttons.length-1:i-1):(i+1)%buttons.length;e.preventDefault();buttons[n].focus();}return;}if(e.key==='Escape'){if(mode==='dialog')closeDialog();else if(mode==='scrub')returnToWorld();else if(mode==='lunch')menuDialog();else if(['cook','recipes','wash'].includes(mode))leaveKitchen();else if(loaded)menuDialog();return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)&&mode==='world'){keys.add(e.key.toLowerCase());path=[];goal=null;idle=0;}if(!e.repeat&&[' ','e','E'].includes(e.key)){sound.unlock();if(mode==='world')mainAction();else if(mode==='cook'){const p=engine.prep;if(p?.done)carryMeal();else{const st=p&&R.RECIPES[p.dish].steps[p.step];if(st&&!['choice','decorate'].includes(st.action))doPrep();}}else if(mode==='wash')doWash();else if(mode==='scrub')cleanAction();else if(mode==='lunch')lunchAction();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{pointer=null;keys.clear();cookPointer=null;dayPointer=null;});window.addEventListener('pagehide',()=>{save();sound.pause();});window.addEventListener('pageshow',()=>{if(sound.context)sound.unlock();});document.addEventListener('visibilitychange',()=>{save();pointer=null;keys.clear();cookPointer=null;dayPointer=null;lastTime=0;if(document.hidden)sound.pause();else if(sound.context)sound.unlock();});
function moveAlong(object,points,speed,dt){let remaining=speed*dt,moved=false;while(points.length&&remaining>0){const q=points[0],dx=q.x-object.x,dy=q.y-object.y,d=Math.hypot(dx,dy);if(d<1){points.shift();continue;}moved=true;const part=Math.min(d,remaining);object.x+=dx/d*part;object.y+=dy/d*part;if(Math.abs(dx)>1)object.facing=dx<0?-1:1;remaining-=part;if(d<=part+.01)points.shift();}return moved;}
function movePlayer(dx,dy,dt){const p=engine.s.player,len=Math.hypot(dx,dy);if(len<.08)return false;const strength=Math.min(1,len);dx=dx/len*292*dt*strength;dy=dy/len*292*dt*strength;const before={x:p.x,y:p.y};if(R.walkable(p.x+dx,p.y))p.x+=dx;if(R.walkable(p.x,p.y+dy))p.y+=dy;if(Math.abs(dx)>1)p.facing=dx<0?-1:1;return Math.hypot(p.x-before.x,p.y-before.y)>.1;}
function movePartyCompanions(c,slot,dt){let done=true;const t=R.TABLES[c.table];for(const member of (c.members||[]).slice(1)){
 const key=c.id+':'+member.id,seat=R.partySeat(c.table,member.id),meet=R.safePoint(t.meet),dest=c.phase==='arriving'?seat:c.phase==='paying'?{x:R.CASHIER.x-55,y:R.paymentPoint(slot).y}:{x:R.ENTRY.x-42,y:R.ENTRY.y};
 let route=npcPaths.get(key);if(!route||route.phase!==c.phase||route.slot!==slot){const fromSeat=Math.hypot(member.x-seat.x,member.y-seat.y)<50;const points=c.phase==='arriving'?[...R.pathfind(member,meet),seat]:fromSeat?[meet,...R.pathfind(meet,dest)]:R.pathfind(member,dest);route={phase:c.phase,slot,points};npcPaths.set(key,route);}
 const ox=member.x;moveAlong(member,route.points,engine.guestSpeed(c),dt);if(Math.abs(member.x-ox)>.2)npcFacing.set(key,member.x<ox?-1:1);if(route.points.length)done=false;
 }return done;}
function tickRestaurant(dt){const s=engine.s;if(s.phase==='break')return;saveClock+=dt;engine.helpersTick(dt);
 const guest=engine.paceTick(dt);if(guest){feedback('hello');updateHUD(true);save();}
 for(const c of [...s.customers]){
  if(['arriving','paying','leaving'].includes(c.phase)){
   const queue=s.customers.filter(q=>q.phase==='paying').sort((a,b)=>a.id-b.id),slot=queue.findIndex(q=>q.id===c.id);let data=npcPaths.get(c.id);if(!data||data.phase!==c.phase||(c.phase==='paying'&&data.slot!==slot)){const t=R.TABLES[c.table],m=R.safePoint(t.meet);const fromSeat=Math.hypot(c.x-t.seat.x,c.y-t.seat.y)<50;const dest=c.phase==='paying'?R.paymentPoint(slot):R.ENTRY;const points=c.phase==='arriving'?[...R.pathfind(c,m),{...t.seat}]:fromSeat?[{...m},...R.pathfind(m,dest)]:R.pathfind(c,dest);data={phase:c.phase,slot,points};npcPaths.set(c.id,data);}
   const companionsDone=movePartyCompanions(c,slot,dt);const ox=c.x;moveAlong(c,data.points,engine.guestSpeed(c),dt);if(c.members?.[0])Object.assign(c.members[0],{x:c.x,y:c.y});if(Math.abs(c.x-ox)>.2)npcFacing.set(c.id,c.x<ox?-1:1);
   if(!data.points.length&&companionsDone){if(c.phase==='arriving'){engine.arrive(c.id);if(save())queueGuestReaction(c.id,'arrival');feedback('hello');burst(c.x,c.y-85,7,R.TABLES[c.table].colour);}else if(c.phase==='paying'){const first=s.customers.filter(q=>q.phase==='paying').sort((a,b)=>a.id-b.id)[0];if(first?.id!==c.id)continue;c.eat+=dt;if(c.eat<1.1)continue;if(engine.pay(c.id)){worldLink?.payment(c.id,engine.snapshot(),c.items?.length||1);feedback('serve');burst(R.STATIONS.cashier.register.x,R.STATIONS.cashier.register.y,12,'#ffd46d');}}else{engine.remove(c.id);npcPaths.delete(c.id);for(const m of c.members||[]){npcPaths.delete(c.id+':'+m.id);liveGuestReactions.delete(c.id+':'+m.id);}}updateHUD(true);save();}
  }else if(c.phase==='eating'){c.eat+=dt;if(c.eat>4.3+(c.id%3)*.8){engine.finishEating(c.id);feedback('hello');burst(c.x,c.y-88,14,R.TABLES[c.table].colour);save();updateHUD(true);}}
  else if(c.phase==='finished'){c.eat+=dt;if(c.eat>1.6&&!s.customers.some(q=>q.phase==='paying')){engine.startLeaving(c.id);save();updateHUD(true);}}
 }
 updateCafeGuestReactions();engine.updateDay();if(saveClock>2.5){saveClock=0;save();}
}
function updateWorld(dt){const s=engine.s;tickRestaurant(dt);
 if(s.phase==='lunch'){openLunch();return;}if(s.completed&&!completeShown){showComplete();return;}
 playerMoving=false;let dx=0,dy=0;
 if(pointer&&pointer.moved>9){dx=pointer.dx/55;dy=pointer.dy/55;}
 if(keys.has('arrowleft')||keys.has('a'))dx=-1;if(keys.has('arrowright')||keys.has('d'))dx=1;if(keys.has('arrowup')||keys.has('w'))dy=-1;if(keys.has('arrowdown')||keys.has('s'))dy=1;
 if(dx||dy){playerMoving=movePlayer(dx,dy,dt);idle=0;}else if(path.length)playerMoving=moveAlong(s.player,path,290,dt);
 if(playerMoving)playerAnim+=dt*8;
 if(worldReady&&worldExitLatch?.step(s.player,worldExitArea,dt,!playerMoving&&!path.length)){requestWorldExit();return;}
 if(goal&&!path.length&&Math.hypot(s.player.x-goal.x,s.player.y-goal.y)<108)performGoal();if(mode!=='world')return;
 updateAutoInteraction(dt,!playerMoving&&!path.length&&!pointer&&keys.size===0);if(mode!=='world')return;updateHUD();
}
function burst(x,y,n=16,colour='#e4a8d1'){if(engine.s.settings.reduced)n=Math.min(7,n);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;particles.push({x,y,vx:Math.cos(a)*(30+Math.random()*100),vy:Math.sin(a)*80-70,life:1.2+Math.random()*.6,size:4+Math.random()*5,colour:i%3===0?'#fff0b4':i%3===1?colour:'#b9daca'});}}
function newTableMealPlacement(d,t,index,count){const D=window.UWCafeDesignRewards;if(!D||!d.tableType?.startsWith('cafe-design-v1:'))return null;const supports=D.geometry(d,t.food.x,t.food.y).plateSupport,r=supports[index%2],split=count===3&&index%2===0,w=split?r[2]/2:r[2];return{x:r[0]+(split?(index===0?.5:1.5):.5)*w,y:r[1]+r[3],w:Math.min(48,w),h:Math.min(42,w*.875)};}
const growthCleanPoints=new Map();
function newTableDirtPoint(index){const D=window.UWCafeDesignRewards,d=engine.s.decor;if(!D||!d.tableType?.startsWith('cafe-design-v1:'))return null;const m=D.cleaningMask(d),valid=growthCleanPoints.get(m.key)||[];if(!valid.length){for(let y=3;y<m.height-3;y++)for(let x=3;x<m.width-3;x++)if(m.bits[y*m.width+x]&&m.bits[(y-3)*m.width+x]&&m.bits[(y+3)*m.width+x]&&m.bits[y*m.width+x-3]&&m.bits[y*m.width+x+3])valid.push([260+m.originOffset[0]+x*2,167+m.originOffset[1]+y*2]);growthCleanPoints.set(m.key,valid);}if(!valid.length)return null;const p=valid[(index*71)%valid.length];return D.containsTablePoint(d,260,167,p[0],p[1])?{x:p[0],y:p[1]}:null;}
function drawMeal(c,dish,variant,x,y,w,h,prep=null,deco=null){if(dish==='cupcake'&&deco&&!prep)prep={step:R.RECIPES.cupcake.steps.length,p:0,done:true,deco};c.save();c.translate(x-w/2,y-h);c.scale(w/320,h/280);A.drawFood(c,dish,variant,prep,clock);c.restore();}
function drawMop(c,x,y,facing=1,swing=0){c.save();c.translate(x,y);c.scale(facing,1);c.rotate(swing);window.UWCafeNativeCues.draw(c,'mop',0,0,64,128);c.restore();}
function drawHelper(h){
 const activity=engine.helperActivity(h),pose=activity.happy>0?(engine.s.settings.reduced?4:4+Math.floor(clock*4)%2):activity.moving?1+Math.floor(clock*4)%3:0;
 drawActor('baby_'+h.id+'_'+pose,h.x,h.y,109,h.facing<0);
 if(h.dish)A.drawDirtyDish(ctx,h.x+h.facing*30,h.y-23,.55,h.dish.count||1);
 if(h.hired){
  const x=h.x,y=h.y-137,job=h.task,guest=job?.kind==='order'?engine.customer(job.id):null;
  A.rect(ctx,x-29,y-25,58,49,13,'#fff8e6','#b493ba',3);
  if(guest)drawMeal(ctx,guest.dish,guest.variant,x,y+17,47,39);
  else if(job?.kind==='dish')A.drawDirtyDish(ctx,x,y+6,.43);
  else if(job?.kind==='wash'){const im=getToolImage('sink');if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-20,y-20,40,40);}
  else A.star(ctx,x,y,13,activity.happy>0?'#ffe18b':'#b6e4dd');
  if(job)A.badge(ctx,R.TABLES[job.table].symbol,x+26,y+22,10,R.TABLES[job.table].colour);
  if(h.progress>0){ctx.strokeStyle='#dca45e';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,32,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,h.progress/(h.dish?6:job?.kind==='order'?3:1.5)));ctx.stroke();}
 }else if(['morning','afternoon'].includes(engine.s.phase)){A.ellipse(ctx,h.x,h.y-125,13,13,'#ffdc78');ctx.fillStyle='#80543b';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('1',h.x,h.y-119);}
}
function drawNavigationDemo(){
 if(!pictureHint||mode!=='world')return;const info=pictureHint.info;
 const target=info.type==='table'||info.type==='dirty'?R.TABLES[info.table]?.meet:info.type==='kitchen'?R.KITCHEN:info.type==='sink'||info.type==='mop-pickup'?R.SINK:info.task?R.CLEAN_TASKS.find(t=>t.id===info.task):null;
 if(!target)return;const route=R.pathfind(engine.s.player,R.safePoint(target));if(!route.length)return;
 ctx.save();ctx.strokeStyle='#fff1ad';ctx.lineWidth=6;ctx.setLineDash([7,14]);ctx.beginPath();ctx.moveTo(engine.s.player.x,engine.s.player.y);for(const q of route)ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);A.ellipse(ctx,target.x,target.y,29,17,'#fff1ad55','#fff1ad',4);ctx.restore();
}
function drawActor(key,x,y,h,flip=false,bounce=0,tilt=0){const im=A.images[key];if(!im){A.requireAsset(key);return;}A.ellipse(ctx,x,y,Math.min(38,h*.29),h*.092,'#62496b24');ctx.save();ctx.translate(x,y-bounce);ctx.rotate(tilt);if(worldOutfit&&key.startsWith('u_')&&window.UWArt)UWArt.unicorn(ctx,0,0,h,worldOutfit,key,flip);else A.sprite(ctx,key,0,0,h*1.35,h,flip);ctx.restore();}
// Short cosmetic whole-composite response; no character anatomy or simulation state changes.
function guestBodyResponse(c,memberIndex=0){const none={lift:0,tilt:0,squash:1,active:false};if(engine.s.settings.reduced)return none;const queue=liveGuestReactions.get(c.id+':'+memberIndex),q=queue?.find(q=>clock>=q.start&&clock<q.start+q.reaction.durationMs/1000);if(!q||q.reaction.motion==='none')return none;const r=q.reaction,p=(clock-q.start)*1000/r.durationMs,envelope=Math.sin(Math.PI*p),familiar=r.familiar?1:0.8;let lift=0,tilt=0,squash=1;if(r.type==='pink'){lift=5*envelope*familiar;tilt=.025*Math.sin(Math.PI*2*p)*envelope;}else if(r.type==='worker'){lift=3*Math.abs(Math.sin(Math.PI*2*p))*envelope;tilt=.045*Math.sin(Math.PI*4*p)*envelope;}else if(r.type==='blue'||r.type==='manager'){squash=1-.025*Math.sin(Math.PI*2*p)**2;tilt=.02*Math.sin(Math.PI*2*p)*envelope;}else{lift=2*envelope;tilt=.035*Math.sin(Math.PI*2*p)*envelope;}return{lift,tilt,squash,active:true};}
function drawSeatedGuest(c,memberIndex=0){const t={...R.TABLES[c.table],seat:R.partySeat(c.table,memberIndex)},baby=c.type==='pink'||c.type==='blue',h=baby?R.LAYOUT.actor.seatedBaby:R.LAYOUT.actor.seatedAdult;
 const breathe=engine.s.settings.reduced?0:Math.sin(clock*2+c.id)*1.1;
 const response=guestBodyResponse(c,memberIndex),footY=t.seat.y-(baby?R.LAYOUT.actor.seatedBabyLift:0);ctx.save();ctx.translate(t.seat.x,footY-breathe-response.lift);ctx.rotate(response.tilt);ctx.scale(1,response.squash);A.sprite(ctx,'guest_seated_'+c.type,0,0,h*1.2,h,memberIndex===0);ctx.restore();
 if(!drawPersistedGuestReaction(c,memberIndex,t.seat,h+(baby?R.LAYOUT.actor.seatedBabyLift:0))&&memberIndex===0)drawCafeGuestReaction(c,h+(baby?R.LAYOUT.actor.seatedBabyLift:0));

}
function drawWorld(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#baaccb';ctx.fillRect(0,0,width,height);const p=engine.s.player;const preview=mode==='customize'||mode==='loading';const sc=Math.min(width/R.LAYOUT.width,height/R.LAYOUT.height);view.scale=sc;view.x=(R.LAYOUT.width-width/sc)/2;view.y=(R.LAYOUT.height-height/sc)/2;ctx.save();ctx.scale(sc,sc);ctx.translate(-view.x,-view.y);A.drawRoomShell(ctx,engine.s.decor);A.drawStationLayer(ctx,engine.s.settings.reduced?0:clock);if(!preview)drawCafeGallery();if(worldReady&&worldExitLatch&&!preview)UWPortals.exit(ctx,worldExitArea,UWPortals.contains(worldExitArea,p));if(preview)for(const t of R.TABLES)A.drawTableFurniture(ctx,t.food.x,t.food.y,engine.s.decor,t.symbol,t.colour,clock);if(!preview){if(R.surfacesClean(engine.s))drawCleanTargets();
  if(path.length){ctx.save();ctx.strokeStyle='#fff6cfb8';ctx.lineWidth=8;ctx.setLineDash([2,24]);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);for(const q of path)ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();}
  for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i],state=engine.s.tables[i];if(state.status==='dirty'){ctx.save();ctx.globalAlpha=engine.s.settings.reduced?.75:.65+.15*Math.sin(clock*3);A.ellipse(ctx,t.meet.x,t.meet.y,48,22,'#ffffff12','#d7f4f0',5);ctx.restore();}}
  if(engine.nextOrder()&&!engine.s.tray&&!engine.s.dirtyTray){ctx.save();ctx.globalAlpha=engine.s.settings.reduced?.66:.5+.16*Math.sin(clock*3);const station=R.STATIONS.kitchen;A.rect(ctx,station.x-station.w/2-5,station.y-station.h-5,station.w+10,station.h+10,24,null,'#fff0b4',5);ctx.strokeStyle='#fff0b4';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(R.KITCHEN.x,R.KITCHEN.y,71,29,0,0,Math.PI*2);ctx.stroke();ctx.restore();A.star(ctx,R.STATIONS.kitchen.x,R.STATIONS.kitchen.y-R.STATIONS.kitchen.h*.23,12,'#fff2bb',engine.s.settings.reduced?0:clock*.25);}
  if(engine.s.dirtyTray){ctx.save();ctx.globalAlpha=engine.s.settings.reduced?.73:.6+.13*Math.sin(clock*3);const station=R.STATIONS.sink;A.rect(ctx,station.x-station.w/2-5,station.y-station.h-5,station.w+10,station.h+10,24,null,'#d8f4f6',5);ctx.strokeStyle='#d8f4f6';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(R.SINK.x,R.SINK.y,62,28,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  drawAutoInteractionHint();drawNavigationDemo();
  // Table -> foreground chairs -> seated guest. Walking actors share depth ordering with furniture.
  const actors=engine.s.customers.filter(c=>['arriving','paying','leaving'].includes(c.phase)).flatMap(c=>[{type:'guest',y:c.y,c},...(c.members||[]).slice(1).map(m=>({type:'guest',y:m.y,c:{...c,...m,id:c.id,memberIndex:m.id}}))]);
  actors.push(...engine.s.helpers.map(h=>({type:'helper',y:h.y,h})));
  actors.push(...R.TABLES.map((t,i)=>({type:'table',y:t.food.y+R.LAYOUT.dining.depth,t,i})),{type:'player',y:p.y});
  actors.sort((a,b)=>a.y-b.y);
  for(const act of actors){if(act.type==='table'){
    const {t,i}=act,c=engine.atTable(i),seated=c&&['waiting','ordered','eating','finished'].includes(c.phase);
    A.drawTableFurniture(ctx,t.food.x,t.food.y,engine.s.decor,t.symbol,t.colour,clock,!c||!['waiting','ordered'].includes(c.phase),seated?()=>{for(const [mi,m] of (c.members||[{type:c.type}]).entries())drawSeatedGuest({...c,type:m.type},mi);}:null);
    if(engine.s.tables[i].status==='dirty')A.drawDirtyDish(ctx,t.food.x,t.food.y-15,1,engine.s.tables[i].dirty?.count||1);
    if(c){const delivered=(c.items||[]).filter(q=>q.served);delivered.forEach((meal,mi)=>{const pos=newTableMealPlacement(engine.s.decor,t,mi,delivered.length),offset=delivered.length===1?-32:(mi-(delivered.length-1)/2)*43;drawMeal(ctx,meal.dish,meal.variant,pos?.x??t.food.x+offset,pos?.y??t.food.y+8,pos?.w??(delivered.length>1?48:62),pos?.h??(delivered.length>1?42:54),null,meal.deco);});if(c.phase==='eating')A.heart(ctx,c.x+38,c.y-120-(clock%1)*12,10,t.colour);}
  }else if(act.type==='helper'){drawHelper(act.h);
  }else if(act.type==='guest'){const c=act.c,baby=c.type==='pink'||c.type==='blue',bounce=engine.s.settings.reduced?0:Math.abs(Math.sin(clock*9+c.id))*6;const moving=c.phase!=='paying'||!!npcPaths.get(c.memberIndex?c.id+':'+c.memberIndex:c.id)?.points.length;drawActor(guestKey(c,moving),c.x,c.y,baby?R.LAYOUT.actor.baby:R.LAYOUT.actor.adult,(npcFacing.get(c.memberIndex?c.id+':'+c.memberIndex:c.id)||1)<0,moving?bounce:0);if(c.phase==='paying'&&!moving&&!c.memberIndex){const head=engine.s.customers.filter(q=>q.phase==='paying').sort((a,b)=>a.id-b.id)[0],progress=!engine.s.settings.reduced&&head?.id===c.id?Math.min(1,c.eat/1.1):0,coinX=c.x+(R.STATIONS.cashier.register.x-c.x)*progress,coinY=c.y-115+(R.STATIONS.cashier.register.y-(c.y-115))*progress;for(let coin=0;coin<(c.items?.length||1);coin++){const cx=coinX+(coin-((c.items?.length||1)-1)/2)*15,cy=coinY+coin*3;A.ellipse(ctx,cx,cy,12,12,'#ffdc78');A.star(ctx,cx,cy,7,'#bc8136');}}}
   else{const celebrate=clock<joyUntil,key=celebrate?'u_happy'+Math.floor(clock*6)%3:playerMoving?'u_run'+Math.floor(playerAnim)%6:'u_idle'+(Math.floor(clock*.7)%5===0?1:0),bounce=engine.s.settings.reduced?0:playerMoving?Math.abs(Math.sin(playerAnim*Math.PI))*4:Math.sin(clock*2)*1.5;drawActor(key,p.x,p.y,R.LAYOUT.actor.player,p.facing<0,bounce);drawCafeCarry(p,bounce);if(engine.s.phase==='cleaning'&&engine.s.mopEquipped){drawMop(ctx,p.x+p.facing*37,p.y+8,p.facing,!engine.s.settings.reduced&&clock<mopSwingUntil?Math.sin((mopSwingUntil-clock)*16)*.4:.13);}if(engine.s.tray){const t=engine.s.tray,x=p.x+p.facing*47,y=p.y-38-bounce;A.ellipse(ctx,x,y-1,43,10,'#d9c1df','#fff4e5',3);drawMeal(ctx,t.dish,t.variant,x,y,91,77,null,t.deco);const table=R.TABLES[engine.customer(t.orderId)?.table];if(table)A.badge(ctx,table.symbol,x,y+10,12,table.colour);}else if(engine.s.dirtyTray){const x=p.x+p.facing*45,y=p.y-31-bounce;A.drawDirtyDish(ctx,x,y,.78,engine.s.dirtyTray.count||1);}}
  }
  if(!R.surfacesClean(engine.s))drawCleanTargets();else for(const t of engine.cleanTargets()){A.ellipse(ctx,t.x,t.y,57,25,'#fff2c522','#fff3bc',5);A.star(ctx,t.x,t.y-38,12,'#fff1ad',clock*.2);}
  for(const q of particles){ctx.save();ctx.globalAlpha=R.clamp(q.life/.8,0,1);A.star(ctx,q.x,q.y,q.size,q.colour,clock*.4);ctx.restore();}
 }
 ctx.restore();updateHelperTargets();updateCafeGalleryTarget();hits=[];if(mode==='world'||(mode==='dialog'&&modalReturn==='world'))drawOrderMarkers();if(pointer&&pointer.moved>9&&mode==='world'){ctx.save();ctx.globalAlpha=.6;A.ellipse(ctx,pointer.x,pointer.y,39,39,'#fff8ee22','#fff7df',2);A.ellipse(ctx,pointer.x+R.clamp(pointer.dx,-35,35),pointer.y+R.clamp(pointer.dy,-35,35),15,15,'#fff6e3a8',null);ctx.restore();}}
function drawOrderMarkers(){
 const placed=[],active=orderCustomer(),stage=dom.stage.getBoundingClientRect();
 const occupied=[dom.orderPin,document.querySelector('.topbar'),dom.primary,document.querySelector('#picture-hint'),document.querySelector('.hint-hand'),cafeGalleryTarget,cafeGalleryCue].filter(e=>e&&!e.hidden&&e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {x:r.left-stage.left,y:r.top-stage.top,w:r.width,h:r.height};});
 // Keep badges off visible actors, carried objects and helpers' job pictures.
 const reserveActor=(actor,h,w)=>{const q=worldToScreen(actor.x,actor.y);occupied.push({x:q.x-w*view.scale/2,y:q.y-h*view.scale,w:w*view.scale,h:(h+12)*view.scale});};
 reserveActor(engine.s.player,150,engine.s.tray||engine.s.dirtyTray||cafeClubhouse?.carried?220:160);
 for(const h of engine.s.helpers)reserveActor(h,h.hired?170:120,h.dish?180:135);
 for(const g of engine.s.customers)if(['arriving','paying','leaving'].includes(g.phase))reserveActor(g,150,160);
 // A floor marker may move around UI, but never onto a chair or table.
 for(const t of R.TABLES){for(const [dx,dy,w,h] of [[-85,-55,170,132],[-R.LAYOUT.dining.chairDX-R.LAYOUT.dining.chairW/2,R.LAYOUT.dining.chairY-R.LAYOUT.dining.chairH,R.LAYOUT.dining.chairW,R.LAYOUT.dining.chairH],[R.LAYOUT.dining.chairDX-R.LAYOUT.dining.chairW/2,R.LAYOUT.dining.chairY-R.LAYOUT.dining.chairH,R.LAYOUT.dining.chairW,R.LAYOUT.dining.chairH]]){const q=worldToScreen(t.food.x+dx,t.food.y+dy);occupied.push({x:q.x,y:q.y,w:w*view.scale,h:h*view.scale});}}
 for(const guest of engine.s.customers){
  if(!['waiting','ordered'].includes(guest.phase))continue;
  const table=R.TABLES[guest.table],pt=worldToScreen(table.food.x,table.food.y+R.LAYOUT.dining.markerY),r=22;
  if(pt.x<-40||pt.x>width+40||pt.y<-60||pt.y>height+100)continue;
  const anchor={x:pt.x,y:pt.y};let point=null;
  for(const [dx,dy] of [[0,0],[-54,0],[54,0],[0,54],[-54,54],[54,54],[0,108]]){
   const q={x:anchor.x+dx,y:anchor.y+dy};
   if(q.x<r+6||q.x>width-r-6||q.y<r+6||q.y>height-r-6)continue;
   if(placed.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<52)||occupied.some(p=>q.x+r+4>p.x&&q.x-r-4<p.x+p.w&&q.y+r+4>p.y&&q.y-r-4<p.y+p.h))continue;
   point=q;break;
  }
  if(!point)continue;placed.push(point);
  if(active?.id===guest.id)A.ellipse(ctx,point.x,point.y,r+4,r+4,'#ffe6a0','#fff8df',2);
  A.badge(ctx,table.symbol,point.x,point.y,r,table.colour);
  if(guest.phase==='waiting')A.star(ctx,point.x+17,point.y-18,6,'#ffe18b',0);
  hits.push({x:point.x-27,y:point.y-27,w:54,h:54,table:guest.table,orderMarker:true});
 }
}
const cookFoodSurface=document.createElement('canvas');cookFoodSurface.width=320;cookFoodSurface.height=280;const cookFoodSurfaceContext=cookFoodSurface.getContext('2d');
const cookStageSurface=document.createElement('canvas');cookStageSurface.width=170;cookStageSurface.height=150;const cookStageContext=cookStageSurface.getContext('2d');
const toolImages={};function getToolImage(name){if(A.images[name])return A.images[name];if(!toolImages[name]){const im=new Image();im.src=A.toolData(name);toolImages[name]=im;}return toolImages[name];}
function drawCooking(){if(!cookCanvas||!cookContext||mode!=='cook')return;const p=engine.prep;if(!p)return;const output=cookContext,w=cookCanvas.width/dpr,h=cookCanvas.height/dpr,r=R.RECIPES[p.dish],st=r.steps[p.step],c=cookStageContext;output.setTransform(dpr,0,0,dpr,0,0);output.imageSmoothingEnabled=false;output.clearRect(0,0,w,h);
 // Compose all three layers once at the same native stage resolution, then
 // enlarge that single surface without smoothing. Input coordinates and game state stay unchanged.
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,170,150);c.imageSmoothingEnabled=false;c.setTransform(.5,0,0,.5,85,75);
 A.drawPrepBoard(c);
 const bump=engine.s.settings.reduced?1:1+Math.sin(cookBump*Math.PI)*.035;cookFoodSurfaceContext.setTransform(1,0,0,1,0,0);cookFoodSurfaceContext.clearRect(0,0,320,280);cookFoodSurfaceContext.imageSmoothingEnabled=false;A.drawFood(cookFoodSurfaceContext,p.dish,p.variant,p,clock);c.save();c.scale(bump,bump);c.imageSmoothingEnabled=false;
 c.drawImage(cookFoodSurface,-90,-124,180,158);c.restore();
 const toolImg=getToolImage(st?currentStepTool(p,st):'chef');if(st&&!p.done&&['stir','rub'].includes(st.action)&&st.tool!=='scoop'&&p.p>0&&toolImg?.complete&&toolImg.naturalWidth){const k=Math.min(32/toolImg.naturalWidth,50/toolImg.naturalHeight),tw=toolImg.naturalWidth*k,th=toolImg.naturalHeight*k;c.save();c.translate(15+Math.round(Math.cos(clock*3)*3),-65);c.imageSmoothingEnabled=false;c.drawImage(toolImg,-tw/2,-th/2,tw,th);c.restore();}
 if(p.done)for(let i=0;i<7;i++){const a=i*Math.PI*2/7+clock*.25;A.star(c,Math.cos(a)*149,Math.sin(a)*109,8,['#fff0a2','#f6b4d0','#b6e4dd'][i%3],clock*.4);}
 const scale=Math.min(w/340,h/300);output.drawImage(cookStageSurface,w/2-170*scale,h/2-150*scale,340*scale,300*scale);}

function drawWashing(){if(!washCanvas||!washContext||mode!=='wash')return;const c=washContext,w=washCanvas.width/dpr,h=washCanvas.height/dpr;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.save();const scale=Math.min(w/320,h/280,1.6),x=w/2-160*scale,y=h/2-140*scale;c.translate(x,y);c.scale(scale,scale);const progress=washDone?1:(engine.s.dirtyTray?.wash||0)/5;A.drawWash(c,progress,clock);c.restore();}
function animationFrame(ms){requestAnimationFrame(animationFrame);const dt=lastTime?Math.min(.04,(ms-lastTime)/1000):0;lastTime=ms;if(document.hidden||portraitBlocked||hubPaused||assetsBlocked())return;clock+=dt;updatePictureHint(dt);sound.musicTick();dayPulse=Math.max(0,dayPulse-dt*2);cookBump=Math.max(0,cookBump-dt*2.7);if(mode==='world')updateWorld(dt);else if(['cook','recipes','wash'].includes(mode))tickRestaurant(dt);if(mode==='cook'&&cookPointer!==null){const p=engine.prep,st=p&&p.step===cookStepLock?R.RECIPES[p.dish].steps[p.step]:null;if(st?.action==='hold'&&clock-cookLast>.42){cookLast=clock;doPrep();}}
 for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=55*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0);if(toastUntil&&clock>toastUntil){$('toast').classList.remove('show');toastUntil=0;}if(loaded){if(['world','customize','loading'].includes(mode)||(mode==='dialog'&&modalReturn==='world'))drawWorld();if(mode==='customize')drawDesignerPreview();drawCooking();drawWashing();drawDayScene();}}
async function offline(){if(window.UW_HOSTED_ENTRY||window.RR_STANDALONE||!('serviceWorker'in navigator)||!['http:','https:'].includes(location.protocol))return;try{const ownWorker=new URL('./sw.js',location.href).href,hadController=navigator.serviceWorker.controller?.scriptURL===ownWorker;let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!refreshing){refreshing=true;save();location.reload();}});const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});registration.update().catch(()=>{});await navigator.serviceWorker.ready;offlineReady=true;}catch(_){offlineReady=false;}}
async function boot(){const current=++bootCount;mode='loading';dom.customizer.hidden=false;dom.customizer.innerHTML='<div class="custom-final"><div class="parent-copy">Setting the tables…</div></div>';$('menu').innerHTML=A.icon('settings');syncPrefs();resize();try{await A.load();if(current!==bootCount)return;loaded=true;if(migrated)save();showCustomizer(0);offline();}catch(err){if(current!==bootCount)return;dom.customizer.innerHTML=`<div class="custom-final"><div class="parent-copy">Artwork did not finish loading. Keep the assets folder beside index.html.</div><button class="open-button" data-action="load-retry" aria-label="Retry loading">${A.icon('retry')}</button></div>`;window.dispatchEvent(new CustomEvent('rr-cafe-load-failed'));}}
if(false)window.__RR_TEST__={get bridge(){return worldLink;},get worldExit(){return worldExitLatch?{...worldExitArea,state:worldExitLatch.snapshot()}:null;},get engine(){return engine;},get mode(){return mode;},get view(){return {...view};},get storageOK(){return storageOK;},get cafeGallery(){return {rect:{...cafeGallery},available:cafeArtAvailable(),pending:cafeDisplayRequest?{...cafeDisplayRequest}:null,displayed:cafeDisplayed()?.id||null,carried:cafeClubhouse?.carried?.id||null,targetHidden:cafeGalleryTarget.hidden,cueHidden:cafeGalleryCue.hidden,viewSpot:{...cafeGalleryViewSpot}};},hangCafePicture,get pictureHint(){return {idle,visible:!hintButton.hidden,playing:!!pictureHint,gesture:pictureHint?.gesture,automaticCount:automaticHints.size};},updatePictureHint,startPictureHint,dismissPictureHint,get offlineReady(){return offlineReady;},get migrated(){return migrated;},snapshot:()=>engine.snapshot(),hireHelper,helperScope,syncHelperEntitlements,save,resize,worldToScreen,showCustomizer,openRestaurant,route,updateHUD,openRecipeMenu,openCooking,openWash,drawWorld,metrics:()=>({width,height,dpr,mode,hitboxes:hits.map(x=>({...x})),audioUnlocked:sound.unlocked,worldMuted,musicTrack:engine.s.settings.musicTrack,musicNotes:sound.musicNotes,audioState:sound.context?.state,pathLength:path.length,goal:goal?{...goal}:null,auto:{key:autoZoneKey,inside:autoZoneInside,dwell:autoDwell,last:autoLastTrigger}}),changeMusic,openLunch,openClean,cleanAction,lunchAction,tickRestaurant,returnToWorld,showComplete,autoCandidate:()=>autoCandidate(),updateAuto:(dt=.3,stopped=true)=>updateAutoInteraction(dt,stopped),setPlayer(x,y){engine.s.player.x=x;engine.s.player.y=y;path=[];goal=null;pointer=null;keys.clear();autoZoneKey=null;autoZoneInside=false;autoDwell=0;},loadFixture(raw){dom.modal.innerHTML='';engine=new R.Engine(raw);cafeGuestReactions.clear();automaticHints.clear();lastHintTarget=null;npcPaths.clear();path=[];goal=null;particles=[];hudSignature='';kitchenSignature='';selectedCleanup=null;autoZoneKey=null;autoZoneInside=false;autoDwell=0;autoLastTrigger='';completeShown=false;dayScreen.hidden=true;save();returnToWorld();}};
// v1.4: day scenes share the same characters, table art, picture controls and audio.
function nextCleanTask(){const ts=engine.cleanTargets(),p=engine.s.player;ts.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));return ts[0]||null;}
function taskPicture(t){if(t.kind==='table')return tableMarkHTML(t.table);if(t.kind==='floor')return imageHTML('mop');if(t.kind==='window')return imageHTML('room_window');return imageHTML(t.kind==='sink'?'painted_sink':'painted_kitchen');}
function dotRow(n,count){return `<span class="day-dots" aria-label="${count} of ${n}">${Array.from({length:n},(_,i)=>`<span class="${i<count?'finished':''}">${A.icon(i<count?'check':'star')}</span>`).join('')}</span>`;}
function dayHeader(pictures,back=true){return `<div class="day-heading">${back?`<button class="small-round" data-action="day-return" aria-label="Back to the restaurant">${A.icon('back')}</button>`:'<span></span>'}<div class="day-ticket">${pictures}</div><span></span></div>`;}
function prepareDayCanvas(){dayCanvas=$('day-canvas');dayContext=dayCanvas.getContext('2d');bindDayCanvas();resize();}
function openLunch(){presentationGate('lunch',null,openLunchReady);}
function openLunchReady(){if(engine.s.phase!=='lunch')return;if(engine.s.lunch.packed===3&&!engine.s.lunch.cooked&&engine.startLunchRecipe()){openCooking();return;}stopControls();mode='lunch';dom.kitchen.hidden=true;dom.customizer.hidden=true;dom.ui.hidden=true;dayScreen.hidden=false;dayScreen.classList.add('lunch-screen');dayScreen.classList.remove('scrub-screen');cleanTask=null;renderLunch();save();updateProgress();announce('Picnic time. Ask your unicorn friends for ingredients and a drink, cook your own meal, then eat together. There is no timer.');}
function lunchItemHTML(item){const l=engine.s.lunch;return item==='meal'?l.cooked?foodHTML(l.meal,l.variant):imageHTML({pizza:'pizza_dough',pancakes:'pancake_batter',soup:'soup_chunk',smoothie:'fruit_strawberry'}[l.meal]):imageHTML(item==='fruit'?'fruit_strawberry':'milk');}
function renderLunch(){const l=engine.s.lunch,ready=l.bites>=3&&l.sips>=2,packing=l.meal&&l.packed<3;
 let controls='',heading='Choose your picnic';
 if(!l.meal){controls=`<div class="lunch-choices">${R.LUNCH_MENU.map(d=>`<button class="day-choice" data-action="lunch-pick" data-meal="${d}" aria-label="Choose ${R.RECIPES[d].name} for your lunch">${foodCategoryHTML(d)}<span>${R.RECIPES[d].name}</span></button>`).join('')}</div>`;}
 else if(packing){const next=['meal','fruit','milk'][l.packed];heading='Ask your friends for ingredients';controls=`<div class="picnic-target" aria-label="Ask a unicorn for ${next==='meal'?'ingredients':next}">${lunchItemHTML(next)}${A.icon('arrow')}${imageHTML('lunch')}${dotRow(3,l.packed)}</div><div class="picnic-items">${['milk','meal','fruit'].map(item=>`<button class="day-choice" data-action="lunch-pack" data-item="${item}" aria-label="Pack ${item==='meal'?R.RECIPES[l.meal].name:item}">${imageHTML(item==='milk'?'baby_blue_0':'baby_pink_0','helper-portrait')}${lunchItemHTML(item)}<span>${item==='meal'?'Ingredients':item==='fruit'?'Fruit':'Drink'}</span></button>`).join('')}</div>`;}
 else if(!l.cooked){heading='Your ingredients are ready';controls=`<button class="day-big" data-action="lunch-cook">${A.icon('chef')}<span>Cook my lunch</span></button>`;}
 else if(ready){heading='A lovely picnic!';controls=`<button class="day-big" data-action="lunch-return" aria-label="Finish lunch and explore">${worldLink?UWArt.icon('home'):A.icon('play')}<span>${worldLink?'Explore':'Finish picnic'}</span>${A.icon('arrow')}</button>`;}
 else{heading=l.bites<3?'Enjoy your picnic':'Time for a drink';controls=`<div class="lunch-progress">${l.bites<3?dotRow(3,l.bites):dotRow(2,l.sips)}</div><button class="day-big" data-action="lunch-act" aria-label="${l.bites<3?'Take a bite of your lunch':'Take a sip of your drink'}">${l.bites<3?foodHTML(l.meal,l.variant||R.RECIPES[l.meal].variants[0].id):imageHTML('milk')}<span>${l.bites<3?'Take a bite':'Take a sip'}</span></button>`;}
 dayScreen.innerHTML=`<div class="day-heading"><span></span><div class="picnic-heading">${heading}</div><button class="small-round" data-action="settings" aria-label="Parent and settings menu">${A.icon('settings')}</button></div><div class="day-scene"><canvas id="day-canvas" tabindex="0" aria-label="Unicorn friends bring ingredients. You cook your own lunch and eat together."></canvas></div><div class="day-controls ${packing?'packing-controls':''}">${controls}</div>`;
 prepareDayCanvas();
}
function lunchAction(){if(mode!=='lunch')return;if(engine.lunchAct()){feedback('hello');dayPulse=1;save();renderLunch();}}
function openClean(id){if(engine.s.phase!=='cleaning')return;const t=engine.cleanTargets().find(q=>q.id===id);if(!t)return;if(t.kind==='floor'){returnToWorld();toast('Move to a dirty patch and press the mop.');return;}stopControls();cleanTask=t;cleanDone=false;mode='scrub';dom.kitchen.hidden=true;dom.customizer.hidden=true;dom.ui.hidden=true;dayScreen.hidden=false;dayScreen.classList.remove('lunch-screen');dayScreen.classList.add('scrub-screen');dayPoint={x:260,y:220};
 dayScreen.innerHTML=dayHeader(`${taskPicture(t)}${A.icon('arrow')}${imageHTML(t.kind==='floor'?'mop':'sponge')}`)+`<div class="day-scene"><canvas id="day-canvas" tabindex="0" aria-label="${t.kind==='floor'?'Mop the floor':'Wipe the '+t.kind}. Rub anywhere, or tap the big picture button."></canvas></div><div class="day-controls" id="clean-tools"></div>`;
 updateCleanUI();prepareDayCanvas();save();announce(t.kind==='floor'?'Mop the floor. Rub or tap.':'Wipe this part of the restaurant. Rub or tap.');
}
function updateCleanUI(){if(mode!=='scrub'||!cleanTask)return;const q=engine.s.cleaning.find(q=>q.id===cleanTask.id);$('clean-tools').innerHTML=`${dotRow(cleanTask.need,q.p)}<button class="day-big" data-action="${cleanDone?'day-return':'clean-act'}" aria-label="${cleanDone?'All sparkling. Return to restaurant':cleanTask.kind==='floor'?'Mop floor':'Wipe surface'}">${cleanDone?A.icon('check'):imageHTML(cleanTask.kind==='floor'?'mop':'sponge')}</button>`;}
function cleanAction(){if(mode!=='scrub'||cleanDone||!cleanTask)return;const result=engine.cleanAct(cleanTask.id);if(!result.ok)return;dayPulse=1;feedback(result.done?'wash':'tap');save();if(result.done){cleanDone=true;dayPointer=null;burst(cleanTask.artX,cleanTask.artY,20,'#a3dfd5');announce('Sparkling clean.');}updateCleanUI();updateProgress();}
function bindDayCanvas(){
 dayCanvas.addEventListener('pointerdown',e=>{if(e.button>0||dayPointer!==null||!['lunch','scrub'].includes(mode))return;e.preventDefault();sound.unlock();dayPointer=e.pointerId;dayDistance=0;dayLast=clock;dayDidAct=false;const r=dayCanvas.getBoundingClientRect();dayPoint={x:(e.clientX-r.left)/r.width*520,y:(e.clientY-r.top)/r.height*360};dayCanvas._prev={x:e.clientX,y:e.clientY};try{dayCanvas.setPointerCapture(e.pointerId);}catch(_){};});
 dayCanvas.addEventListener('pointermove',e=>{if(e.pointerId!==dayPointer||!dayCanvas._prev)return;const q=dayCanvas._prev,r=dayCanvas.getBoundingClientRect();dayDistance+=Math.hypot(e.clientX-q.x,e.clientY-q.y);dayCanvas._prev={x:e.clientX,y:e.clientY};dayPoint={x:(e.clientX-r.left)/r.width*520,y:(e.clientY-r.top)/r.height*360};if(mode==='scrub'&&dayDistance>=32&&clock-dayLast>.12){dayDistance=0;dayLast=clock;dayDidAct=true;cleanAction();}});
 dayCanvas.addEventListener('pointerup',e=>{if(e.pointerId!==dayPointer)return;dayPointer=null;if(mode==='lunch'){if(engine.s.lunch.cooked)lunchAction();}else if(!dayDidAct)cleanAction();});
 dayCanvas.addEventListener('pointercancel',()=>{dayPointer=null;});dayCanvas.addEventListener('lostpointercapture',()=>{dayPointer=null;});
 dayCanvas.addEventListener('contextmenu',e=>e.preventDefault());
}
function sceneImage(c,key,x,y,w,h){if(A.nativeImage(c,key,x,y,w,h))return;const im=A.images[key];if(!im){A.requireAsset(key);return;}const sc=Math.min(w/im.width,h/im.height);c.drawImage(im,x+(w-im.width*sc)/2,y+(h-im.height*sc)/2,im.width*sc,im.height*sc);}
function drawCleanTargets(){const s=engine.s;if(!['cleaning','complete'].includes(s.phase))return;
 if(R.surfacesClean(s)&&!s.mopEquipped){A.ellipse(ctx,R.SINK.x,R.SINK.y,43,20,'#fff2c522','#ffeab5',3);drawMop(ctx,R.SINK.x,R.SINK.y);}
 const targets=engine.cleanTargets(),tNow=engine.s.settings.reduced?0:clock;
 for(const t of R.CLEAN_TASKS){const q=s.cleaning.find(q=>q.id===t.id);if(q.p>=t.need){A.star(ctx,t.artX,t.artY-10,11,'#fff1b3',0);continue;}if(!targets.some(z=>z.id===t.id))continue;
  const bx=t.artX,by=t.kind==='floor'?t.artY:t.artY-30;
  ctx.save();ctx.globalAlpha=.7;for(let i=0;i<Math.ceil(6*(1-q.p/t.need));i++){A.ellipse(ctx,bx-38+(i*29)%78,by-7+(i*17)%24,8+i%3,4,'#8c6a668c',null);}ctx.restore();
  if(t.kind==='floor'){A.ellipse(ctx,t.x,t.y,56,25,'#fff2c512','#ffeab5',3);continue;}
  const yy=by-37-Math.sin(tNow*2+t.need)*3;A.ellipse(ctx,bx,yy,34,32,'#fff5dc','#735180',4);sceneImage(ctx,t.kind==='floor'?'mop':'sponge',bx-25,yy-25,50,50);
  A.ellipse(ctx,t.x,t.y,45,19,'#fff2c522','#ffeab5',3);
 }
}
function drawDayScene(){if(!dayCanvas||!dayContext||!['lunch','scrub'].includes(mode))return;const c=dayContext,w=dayCanvas.width/dpr,h=dayCanvas.height/dpr,s=engine.s,t=s.settings.reduced?0:clock;
 c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 // Continuous floor material is safe to repeat/crop; no cropped scene background.
 const floor=A.materialData(s.decor);if(floor)c.drawImage(floor,0,0,w,h);
 if(mode==='lunch'){const wall=A.materialData(s.decor,true);if(wall)c.drawImage(wall,0,0,w,h*.43);}
 c.fillStyle=mode==='lunch'?'#fff4cd18':'#dbccef26';c.fillRect(0,0,w,h);
 const sc=Math.min(w/520,(mode==='lunch'?Math.max(1,h-140):h)/360),ox=(w-520*sc)/2,oy=mode==='lunch'?46+(h-140-360*sc)/2:(h-360*sc)/2;c.save();c.translate(ox,oy);c.scale(sc,sc);
 if(mode==='lunch'){
  const l=s.lunch,ready=l.bites>=3&&l.sips>=2,packing=l.meal&&l.packed<3;
  sceneImage(c,'room_window',192,12,135,112);
  sceneImage(c,'room_plant',69,129,56,80);sceneImage(c,'room_plant',396,129,56,80);
  A.sprite(c,'baby_pink_'+(ready?'4':'0'),171+dayPulse*44,208+Math.sin(t*3)*2,87,92);
  const lunchPose=ready||dayPulse>0?'u_happy'+Math.floor(t*4)%3:'u_idle0';if(worldOutfit&&window.UWArt)UWArt.unicorn(c,260,207,112,worldOutfit,lunchPose);else A.sprite(c,lunchPose,260,207,117,112);
  A.sprite(c,'baby_blue_'+(ready?'4':'0'),348,208+Math.cos(t*3)*2,87,92);
  A.drawTableFurniture(c,260,237,{...s.decor,decoration:'flowers'},'heart','#e98bb1',t,false);
  if(!l.meal||packing){sceneImage(c,'lunch',218,213,84,72);if(l.packed>0){if(l.cooked)drawMeal(c,l.meal,l.variant||R.RECIPES[l.meal].variants[0].id,216,227,65,56);else sceneImage(c,{pizza:'pizza_dough',pancakes:'pancake_batter',soup:'soup_chunk',smoothie:'fruit_strawberry'}[l.meal],195,170,65,56);}if(l.packed>1)sceneImage(c,'fruit_strawberry',293,196,29,34);}
  else if(l.bites<3){const scale=1-l.bites*.2;drawMeal(c,l.meal,l.variant||R.RECIPES[l.meal].variants[0].id,240,246,112*scale,98*scale);}
  else{window.UWCafeNativeCues.drawFit(c,'finish-plate',202,219,72,24);window.UWCafeNativeCues.drawFit(c,'star',228,218,20,20);}
  if(l.packed>=3)sceneImage(c,'milk',299,182,34,52-l.sips*5);
  if(dayPulse>0&&packing){sceneImage(c,l.packed===1?{pizza:'pizza_dough',pancakes:'pancake_batter',soup:'soup_chunk',smoothie:'fruit_strawberry'}[l.meal]:'fruit_strawberry',170+dayPulse*44,146,46,43);}
  if(dayPulse>0){window.UWCafeNativeCues.drawFit(c,'heart',264,83-dayPulse*17,36,36);for(let i=0;i<4;i++)window.UWCafeNativeCues.drawFit(c,'star',177+i*42,90+(i%2)*15,10,10);}
  if(ready)for(let i=0;i<7;i++)window.UWCafeNativeCues.drawFit(c,'star',92+i*52,118+(i%3)*27,14,14);
 }else if(cleanTask){
  const task=cleanTask,q=s.cleaning.find(q=>q.id===task.id),frac=q.p/task.need;
  // Flat, stepped native frame; same outer box and input geometry.
  c.fillStyle='#352C46';c.fillRect(35,27,450,303);c.fillRect(27,35,466,287);c.fillStyle='#A5754D';c.fillRect(35,31,450,295);c.fillRect(31,35,458,287);c.fillStyle='#E9C18D';c.fillRect(37,37,446,282);c.fillStyle='#FFF2D4';c.fillRect(37,35,446,2);c.fillStyle='#76543D';c.fillRect(37,319,446,3);
  if(task.kind==='table'){A.drawTableFurniture(c,260,167,{...s.decor,decoration:'stars'},R.TABLES[task.table].symbol,R.TABLES[task.table].colour,t);}
  else if(task.kind==='window')sceneImage(c,'room_window',92,53,334,231);
  else if(task.kind==='sink')sceneImage(c,'painted_sink',116,36,287,262);
  else if(task.kind==='counter')sceneImage(c,'painted_kitchen',38,58,445,220);
  else if(floor){c.save();c.beginPath();c.rect(37,37,446,282);c.clip();c.drawImage(floor,37,37,446,282);c.restore();}
  // Each stroke clears a stable group of crumbs/smudges. No time-based fading of
  // remaining dirt: interrupted/reloaded progress matches the visible result.
  for(let i=0;i<20;i++){if(i<frac*20)continue;const point=task.kind==='table'?newTableDirtPoint(i):null,x=point?.x??78+(i*71)%368,y=point?.y??96+(i*59)%173;c.save();c.translate(x,y);c.rotate(i*.83);window.UWCafeNativeCues.drawFit(c,'dirt-smudge',point?-4:-18,point?-3:-10,point?8:36,point?6:20);c.restore();}
  if(!cleanDone){sceneImage(c,task.kind==='floor'?'mop':'sponge',R.clamp(dayPoint.x,70,440)-48,R.clamp(dayPoint.y,65,278)-36,108,112);}
  if(dayPulse>0||cleanDone){for(let i=0;i<12;i++){const x=66+(i*59)%390,y=66+(i*71)%235;if(cleanDone)window.UWCafeNativeCues.drawFit(c,'clean-sparkle',x-12,y-12,24,24);else window.UWCafeNativeCues.drawFit(c,'bubble-cluster',dayPoint.x-33+(i*13)%71,dayPoint.y-30+(i*19)%72,20,20);}}
 }
 c.restore();
}

// Pause play and remove all game controls from focus while a phone is upright.
const portraitQuery=matchMedia('(orientation: portrait) and (max-width: 900px)');
let portraitBlocked=portraitQuery.matches;
function syncOrientation(){
 portraitBlocked=portraitQuery.matches;
 $('rotate-screen').hidden=!portraitBlocked;
 dom.app.hidden=portraitBlocked;
 dom.app.inert=portraitBlocked;
 stopControls();cookPointer=null;dayPointer=null;lastTime=0;
 if(portraitBlocked){save();sound.pause();}else{resize();if(sound.context)sound.unlock();}
}
portraitQuery.addEventListener('change',syncOrientation);
// Installed browsers may grant the lock; the portrait gate also works when they cannot.
function requestLandscape(){
 if(!matchMedia('(pointer: coarse)').matches||!screen.orientation?.lock)return;
 screen.orientation.lock('landscape').catch(()=>{});
}
document.addEventListener('pointerdown',requestLandscape,{passive:true});
// Cover all controls, including decorating and the DJ, without preventing taps.
for(const event of ['touchend','click','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)sound.unlock();},{capture:true,passive:true});
document.addEventListener('fullscreenchange',requestLandscape);
// Bounded parent navigation: dormant for independent launches; never clears or renames saves.
const worldQuery=new URLSearchParams(location.search),worldOrigin=worldQuery.get('worldOrigin'),worldBase=worldQuery.get('worldBase')||(worldOrigin+'/');
if(new URLSearchParams(location.search).get('hub')==='1'&&window.parent!==window&&worldOrigin){
 let trusted=false;try{const u=new URL(worldOrigin),base=new URL(worldBase);trusted=u.origin===worldOrigin&&base.origin===worldOrigin&&base.pathname.endsWith('/')&&!base.search&&!base.hash&&!base.username&&!base.password&&(u.origin===location.origin||(['localhost','127.0.0.1'].includes(u.hostname)&&['localhost','127.0.0.1'].includes(location.hostname)));}catch(_){}
 if(trusted){const ack=command=>window.parent.postMessage({type:'UNICORN_WORLD_ACK',command,build:window.UW_NATIVE_BUILD||null},worldOrigin);
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==worldOrigin||e.data?.type!=='UNICORN_WORLD')return;
 if(e.data.command==='suspend'){hubPaused=true;save();stopControls();lastTime=0;sound.pause();ack('suspend');}
 if(e.data.command==='cafe-depart'){engine.leaveCafe();save();}
 if(e.data.command==='cafe-entry'){if(engine.enterCafe()){save();syncHelperEntitlements();updateHUD(true);}}
 if(e.data.command==='resume'){hubPaused=!worldReady;stopControls();lastTime=0;resize();ack('resume');}
 });
 const scriptCache=new Map();const script=file=>{if(scriptCache.has(file))return scriptCache.get(file);const promise=new Promise((resolve,reject)=>{const n=document.createElement('script');const resource=new URL('hub/shared/'+file+'.js',worldBase);if(window.UW_NATIVE_BUILD)resource.searchParams.set('nativeBuild',window.UW_NATIVE_BUILD);n.src=resource.href;n.onload=resolve;n.onerror=()=>{scriptCache.delete(file);reject(new Error('Could not load '+file));};document.head.append(n);});scriptCache.set(file,promise);return promise;};
 let profileGeneration=0,bridgeReady=false,outfitReady=false;
 async function applyWorldProfile(p){if(Array.isArray(p.cafeIngredients))engine.mergeIngredientUnlocks(p.cafeIngredients,persistGrowth);if(outfitReady&&JSON.stringify(worldOutfit)===JSON.stringify(p.outfit)){worldMuted=!!p.settings.muted;if(worldMuted)sound.mute();syncCafeClubhouse(p.clubhouse);syncHelperEntitlements();return;}const version=++profileGeneration;outfitReady=false;worldReady=false;worldMuted=!!p.settings.muted;if(worldMuted)sound.mute();setAssetStatus('wardrobe','Loading your outfit…');try{const loadedOutfit=await UWArt.loadNativeWardrobe(p.outfit,{baseImages:true});if(version!==profileGeneration||!loadedOutfit.isCurrent())return;worldOutfit=loadedOutfit.outfit;outfitReady=true;worldReady=bridgeReady;syncCafeClubhouse(p.clubhouse);syncHelperEntitlements();setAssetStatus('wardrobe',null);if(loaded)drawWorld();}catch(error){if(version===profileGeneration)setAssetStatus('wardrobe','Your outfit did not finish loading. The previous outfit is kept.',()=>applyWorldProfile(p));}}
 async function connectWorldPresentation(){setAssetStatus('world-connect','Loading the connected café…');await script('catalogue');await script('sprites');await script('art');await script('clubhouse-art');await script('portals');await UWPortals.load();worldExitLatch=UWPortals.latch();resetWorldExit();await script('bridge');
 if(!worldLink){worldLink=new UWBridge.Link({game:'cafe',key:R.SAVE_KEY,snapshot:()=>engine.snapshot(),restore:raw=>{engine=new R.Engine(raw);},onProfile:p=>{applyWorldProfile(p);},onReceipt:event=>{if(event.kind!=='home-design-unlock'||!event.ok)return false;return engine.acknowledgeDesign(event.receiptId,event.designId,persistGrowth).ok===true;},onReady:()=>{bridgeReady=true;worldReady=outfitReady;flushDesignDeliveries();}});worldLink.cafeConnect(engine.s.coins);}
 setAssetStatus('world-connect',null);}
 function beginWorldPresentation(){connectWorldPresentation().catch(()=>{worldReady=false;setAssetStatus('world-connect','Connected café artwork did not finish loading.',beginWorldPresentation);});}
 beginWorldPresentation();
 const announceReady=setInterval(()=>{if(loaded&&worldReady&&!assetsBlocked()){clearInterval(announceReady);ack('ready');}},100);
 }

}
requestAnimationFrame(animationFrame);boot();syncOrientation();
})();
