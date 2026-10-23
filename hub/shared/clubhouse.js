/* Quiet, picture-first clubhouse play. Profile transactions own saved artwork.
 * A draft is never replaced by a delayed save; failed writes retain the marks here.
 */
(()=>{'use strict';
const W=1100,H=660,COLORS=['#ed87b8','#8e79c7','#6dbbaa'],FRIENDS=['pink','blue'];
const copy=value=>JSON.parse(JSON.stringify(value)),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),blank=()=>({version:1,ops:[]});
const uid=()=>window.UWProfile?.uuid?.()||globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const titles={art:'Make a picture',fort:'Cushion fort',ball:'Musical ball run',puppets:'Puppet theatre'};
const labels={heart:'Heart stamp',flower:'Flower stamp',rainbow:'Rainbow stamp',brush:'Paintbrush'};
class Clubhouse {
 constructor(world){
  this.w=world;this.service=world.service;this.kind=null;this.epoch=0;this.raf=0;this.last=0;this.age=0;this.pointer=null;this.tool='heart';this.color=COLORS[0];this.cursor={x:.5,y:.5};
  this.art=null;this.gallery=null;this.galleryCache=new Map();this.galleryIndex=0;this.states={};this.configJobs={};this.configErrors={};this.configSerial={};this.selected=null;this.action=null;this.actionAge=0;this.reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
  this.onPause=()=>{this.cancel();if(this.root)this.root.inert=this.paused();};
  document.addEventListener('visibilitychange',this.onPause);window.addEventListener('resize',this.onPause);window.addEventListener('orientationchange',this.onPause);
  window.addEventListener('beforeunload',e=>{if(this.art&&this.art.edit!==this.art.ack){this.backup();e.preventDefault();e.returnValue='';}});
 }
 get active(){return this.kind;}
 paused(){return document.hidden||innerHeight>innerWidth;}
 reduced(){return !!this.service.value.settings?.reduced||this.reducedQuery.matches;}
 icon(kind){return window.UWClubhouseArt?.icon(kind)||window.UWArt.icon(({carry:'save',finish:'save',paint:'flower',brush:'flower',heart:'flower',flower:'flower',rainbow:'flower',cushion:'flower',ramp:'play',wave:'hand',dance:'star',peek:'hand',puppets:'play',fort:'home',ball:'ball',retry:'retry',undo:'back'})[kind]||kind);}
 button(action,icon,label,extra=''){return '<button type="button" class="uwc-object" data-uwc="'+action+'" aria-label="'+label+'" '+extra+'>'+this.icon(icon)+'</button>';}
 sound(win=false){if(!this.service.value.settings?.muted)this.w.sound?.(win);}
 announce(text){this.w.announce?.(text);}
 async open(kind){
  if(!titles[kind]||this.kind===kind)return;if(this.kind)await this.close();
  const epoch=++this.epoch;this.previousFocus=document.activeElement;this.kind=kind;this.selected=null;this.action=null;this.age=0;this.actionAge=0;this.last=0;this.w.clear?.();
  await this.w.setPanel?.(true);if(epoch!==this.epoch)return;
  this.gallery=null;this.mount();this.root.inert=this.paused();this.start();this.root.querySelector('[data-uwc="back"]').focus({preventScroll:true});
  if(kind==='art'){await this.loadDraft();if(epoch===this.epoch){this.artControls();this.refreshStack();}}
  else {const defaults=kind==='puppets'?{friend:'pink'}:kind==='fort'?{slots:[0,1,2]}:{ramps:[0,1,2]};if(!this.states[kind]||(!this.configJobs[kind]&&!this.configErrors[kind]))this.states[kind]=copy(this.service.value.clubhouse?.[kind]||defaults);this.drawButtons();}
 }
 mount(){
  if(!this.root){this.root=document.createElement('section');this.root.id='clubhouse-play';this.root.className='uwc-play';this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');document.body.append(this.root);}
  const art=this.kind==='art';this.root.hidden=false;delete this.root.dataset.gallery;this.root.dataset.kind=this.kind;this.root.setAttribute('aria-label',titles[this.kind]);
  this.root.innerHTML='<div class="uwc-workspace">'+this.button('back','back','Return to the clubhouse')+
   '<div class="uwc-scene-wrap"><canvas class="uwc-scene" width="1100" height="660" aria-hidden="true"></canvas><div class="uwc-hit-layer"></div></div>'+
   (art?'<div class="uwc-art-tools" role="group" aria-label="Stamps and paintbrush">'+['heart','flower','rainbow','brush'].map(t=>this.button('tool',t,labels[t],'data-tool="'+t+'" aria-pressed="'+(this.tool===t)+'"')).join('')+'</div><div class="uwc-colors" role="group" aria-label="Paint colours">'+COLORS.map((c,i)=>'<button type="button" class="uwc-paint" data-uwc="color" data-color="'+c+'" style="--paint:'+c+'" aria-label="'+['Pink paint','Purple paint','Teal paint'][i]+'" aria-pressed="'+(c===this.color)+'"><span aria-hidden="true"></span></button>').join('')+'</div><div class="uwc-paper-holder"><canvas class="uwc-paper" width="960" height="640" tabindex="0" aria-label="Your picture. Tap or drag to draw. With a keyboard, use arrow keys to move the brush and Space or Enter to add a mark."></canvas></div><div class="uwc-art-actions">'+this.button('undo','undo','Undo your last mark')+this.button('finish','carry','Finish and carry your picture to the café')+'</div><button type="button" class="uwc-paper-stack" data-uwc="gallery" aria-label="Look through your saved pictures" hidden><canvas width="150" height="104" aria-hidden="true"></canvas></button><div class="uwc-gallery-nav" hidden>'+this.button('gallery-prev','back','Previous saved picture')+this.button('draft','brush','Return to your unfinished picture')+this.button('gallery-next','play','Next saved picture')+'</div>':'<div class="uwc-play-actions"></div>')+
   '<div class="uwc-notice" role="status" hidden><span></span>'+this.button('retry','retry','Try saving again')+this.button('keep-copy','paper','Keep both pictures and carry these marks to the café','hidden')+'</div><div class="uwc-saving" aria-hidden="true" hidden>'+this.icon('carry')+'</div></div>';
  // The back button is deliberately outside the play canvas and always reachable.
  this.root.querySelector('[data-uwc="back"]').classList.add('uwc-back');
  this.sceneCanvas=this.root.querySelector('.uwc-scene');this.paper=this.root.querySelector('.uwc-paper');
  this.root.onclick=e=>{const b=e.target.closest('[data-uwc]');if(!b||b.disabled||this.paused())return;if(e.detail>0&&this.suppressClick?.button===b&&performance.now()<this.suppressClick.until){this.suppressClick=null;return;}this.click(b);};
  this.root.onkeydown=e=>this.key(e);
  this.root.onpointerdown=e=>this.down(e);this.root.onpointermove=e=>this.move(e);this.root.onpointerup=e=>this.up(e);this.root.onpointercancel=e=>this.endPointer(e,true);this.root.onlostpointercapture=e=>{if(this.pointer?.id===e.pointerId)this.endPointer(e,true);};
  this.artControls();
 }
 notice(text,retry=true){if(!this.root||!this.kind)return;const n=this.root.querySelector('.uwc-notice');n.hidden=!text;n.querySelector('span').textContent=text||'';n.querySelector('[data-uwc=retry]').hidden=!retry;n.querySelector('[data-uwc=keep-copy]').hidden=!(this.kind==='art'&&this.art?.error?.code==='conflict');if(text)this.announce(text);}
 status(){if(!this.root)return;const busy=!!this.draftSaving||!!this.finishing||!!this.configJobs[this.kind];this.root.querySelector('.uwc-saving').hidden=!busy;this.root.setAttribute('aria-busy',busy?'true':'false');}
 backupKey(){return 'unicorn-world-clubhouse-recovery:'+this.service.value.id;}
 backup(){const a=this.art;if(!a?.loaded||a.edit===a.ack)return;try{sessionStorage.setItem(this.backupKey(),JSON.stringify({id:a.id,revision:a.revision,picture:a.picture,edit:a.edit,ack:a.ack}));}catch(_){/* The live copy stays available even when browser storage is full. */}}
 removeBackup(){try{sessionStorage.removeItem(this.backupKey());}catch(_){}}
 validPicture(p){return p&&p.version===1&&Array.isArray(p.ops)&&p.ops.length<=256&&JSON.stringify(p).length<=65536&&p.ops.every(o=>o.tool==='stamp'||(o.tool==='brush'&&Array.isArray(o.points)&&o.points.length<=512));}
 async loadDraft(explicit=false){
  if(this.art?.loaded){if(this.art.error)this.notice('Your picture is here, but the latest changes are not saved yet.');this.paintPaper();return;}
  if(this.loadingDraft)return this.loadingDraft;
  this.loadingDraft=(async()=>{
   const saved=this.service.value.clubhouse?.draft;let recovery=null;
   try{const raw=JSON.parse(sessionStorage.getItem(this.backupKey())||'null');if(raw&&this.validPicture(raw.picture)&&raw.edit>raw.ack)recovery=raw;}catch(_){}
   try{
    const picture=await(saved?this.service.getMedia('clubhouse:draft:'+saved.id):Promise.resolve(blank()));
    if(saved&&!this.validPicture(picture))throw Error('missing');
    this.art={id:saved?.id||null,revision:saved?.revision||0,picture:copy(picture),edit:0,ack:0,loaded:true,error:null};
    if(recovery){
     const same=(recovery.id===this.art.id&&recovery.revision===this.art.revision)||(!this.art.id&&!recovery.id);
     if(same){this.art={...this.art,...recovery,error:null,loaded:true};this.notice('Your unfinished marks are back. Tap the save picture to keep them.',true);}
     else {this.art={...this.art,...recovery,error:{code:'conflict'},loaded:true};this.notice('Your unsaved picture is still here. Another window changed the saved draft, so these marks have not overwritten it.',false);}
    }
    this.paintPaper();
   }catch(error){if(recovery){this.art={...recovery,loaded:true,error};this.notice('Your unfinished marks are still here. Saved pictures could not be checked yet.');this.paintPaper();}else{this.art={...(this.art||{}),loaded:false,error};this.notice('Your picture could not open. It has not been changed. Tap the arrow to try again.');}}
   finally{this.loadingDraft=null;this.artControls();}
  })();return this.loadingDraft;
 }
 artControls(){
  if(!this.root||this.kind!=='art')return;const a=this.art,ready=!!a?.loaded,locked=!!this.finishing;
  for(const b of this.root.querySelectorAll('[data-uwc="tool"],[data-uwc="color"]')){b.disabled=!ready||locked;b.setAttribute('aria-pressed',b.dataset.tool?b.dataset.tool===this.tool:b.dataset.color===this.color);}
  this.root.querySelector('[data-uwc="undo"]').disabled=!ready||locked||!a.picture.ops.length;
  const finish=this.root.querySelector('[data-uwc="finish"]');finish.disabled=this.gallery?locked||!this.gallery.picture:!ready||locked||!a.picture.ops.length;finish.setAttribute('aria-label',this.gallery?'Carry this saved picture to the café':'Finish and carry your picture to the café');
  if(this.paper)this.paper.setAttribute('aria-disabled',(!ready||locked)?'true':'false');this.status();
 }
 addMark(op){
  const a=this.art;if(!a?.loaded||this.finishing)return false;const next={version:1,ops:[...a.picture.ops,op]};
  if(next.ops.length>256||JSON.stringify(next).length>65536){this.notice('This paper is full. Carry it to the café, or undo a mark to make room.',false);return false;}
  a.picture=next;a.edit++;a.finishPending=null;a.copyPending=null;this.backup();this.paintPaper();this.artControls();this.queueDraft();return true;
 }
 queueDraft(){clearTimeout(this.draftTimer);if(this.art?.error)return;this.draftTimer=setTimeout(()=>this.saveDraft(),260);}
 async saveDraft(explicit=false){
  clearTimeout(this.draftTimer);const a=this.art;if(!a?.loaded)return false;if(this.draftSaving)return this.draftSaving;
  if(a.error&&!explicit)return false;if(a.edit===a.ack&&!a.pending)return true;if(explicit)a.error=null;
  this.draftSaving=(async()=>{
   try{
    while(a.edit!==a.ack){
     const edit=a.edit,picture=copy(a.picture);if(!a.id)a.id=uid();
     // Retrying an uncertain failure reuses the exact request and receipt first.
     const pending=a.pending||{args:{id:a.id,expectedRevision:a.revision,picture},receipt:'clubhouse-draft:'+uid(),edit};a.pending=pending;this.backup();
     const result=await this.service.run('clubhouse-draft',pending.args,pending.receipt);
     a.revision=result.value.revision;a.id=result.value.id;a.ack=pending.edit;a.pending=null;a.error=null;
     if(a.edit===a.ack)this.removeBackup();else this.backup();
    }
    if(this.kind==='art')this.notice('');return true;
   }catch(error){a.error=error;this.backup();if(this.kind==='art')this.notice(error?.code==='conflict'?'This picture changed in another window. Your marks are still here, and have not overwritten it.':'Your picture is here, but the latest changes are not saved yet.');return false;}
   finally{this.draftSaving=null;this.artControls();this.w.draw?.();}
  })();this.status();return this.draftSaving;
 }
 async finish(){
  const a=this.art;if(!a?.loaded||!a.picture.ops.length||this.finishing)return;
  this.endPointer(null,true);this.finishing=true;this.finishWait=new Promise(resolve=>{this.finishDone=resolve;});this.artControls();
  try{
   if(!await this.saveDraft(true))return;
   const pending=a.finishPending||{args:{id:a.id,expectedRevision:a.revision},receipt:'clubhouse-finish:'+uid()};a.finishPending=pending;
   await this.service.run('clubhouse-finish',pending.args,pending.receipt);
   a.finishPending=null;this.removeBackup();this.art=null;this.sound(true);this.announce('Your picture is saved. Carry it to the café display.');await this.close(true);
  }catch(error){a.error=error;this.notice(error?.code==='capacity'?'Your picture is saved as a draft. The collection is full, so keep this picture here for now.':'Your picture is saved as a draft. It could not be finished yet. Tap the carry picture to try again.',error?.code!=='capacity');}
  finally{this.finishing=false;this.finishDone?.();this.finishDone=null;this.finishWait=null;this.artControls();}
 }
 async saveConfig(kind,explicit=false){
  if(this.configJobs[kind])return this.configJobs[kind];if(this.configErrors[kind]&&!explicit)return false;
  if(explicit)this.configErrors[kind]=null;
  this.configJobs[kind]=(async()=>{try{
   do{const serial=this.configSerial[kind]||0,state=copy(this.states[kind]);await this.service.run('clubhouse-play',{kind,state},'clubhouse-play:'+uid());this.configSaved=this.configSaved||{};this.configSaved[kind]=serial;}while(this.configSaved[kind]!== (this.configSerial[kind]||0));
   if(this.kind===kind)this.notice('');return true;
  }catch(error){this.configErrors[kind]=error;if(this.kind===kind)this.notice('Your play arrangement is here, but it could not be saved yet.');return false;
  }finally{this.configJobs[kind]=null;this.status();this.w.draw?.();}})();this.status();return this.configJobs[kind];
 }
 changeConfig(){const kind=this.kind;this.configSerial[kind]=(this.configSerial[kind]||0)+1;this.saveConfig(kind);this.drawButtons();}
 async close(finished=false){
  if(this.finishing&&!finished)await this.finishWait;if(!this.kind)return;const kind=this.kind,epoch=this.epoch;this.cancel();
  if(kind==='art'&&!finished)await this.saveDraft();else if(this.configJobs[kind])await this.configJobs[kind];
  if(epoch!==this.epoch)return;this.epoch++;this.kind=null;cancelAnimationFrame(this.raf);this.raf=0;this.last=0;if(this.root){this.root.hidden=true;this.root.inert=false;}
  await this.w.setPanel?.(false);this.previousFocus?.isConnected?this.previousFocus.focus({preventScroll:true}):document.getElementById('scene')?.focus({preventScroll:true});this.w.draw?.();
 }
 cancel(){this.endPointer(null,true);this.action=null;this.ballLanded=false;this.actionAge=0;this.last=0;this.suppressClick=null;}
 changed(){
  if(this.kind==='art'&&this.art?.loaded&&!this.draftSaving&&!this.finishing&&this.art.edit===this.art.ack){const next=this.service.value.clubhouse?.draft;if((next?.id||null)!==this.art.id||(next?.revision||0)!==this.art.revision){this.art=null;this.loadDraft();}}
  if(this.kind==='art')this.refreshStack();else if(this.kind&&!this.configJobs[this.kind]&&!this.configErrors[this.kind]&&this.service.value.clubhouse?.[this.kind]){this.states[this.kind]=copy(this.service.value.clubhouse[this.kind]);this.drawButtons();}this.artControls();
 }
 click(b){const action=b.dataset.uwc;
  if(action==='back'){this.close();return;}
  if(action==='retry'){if(this.kind==='art'){if(!this.art?.loaded)this.loadDraft(true);else this.saveDraft(true);}else this.saveConfig(this.kind,true);return;}
  if(action==='tool'){this.tool=b.dataset.tool;this.sound();this.artControls();return;}
  if(action==='color'){this.color=b.dataset.color;this.sound();this.artControls();return;}
  if(action==='undo'&&this.art?.picture.ops.length&&!this.finishing){this.art.picture.ops.pop();this.art.edit++;this.art.finishPending=null;this.art.copyPending=null;this.backup();this.paintPaper();this.artControls();this.queueDraft();return;}
  if(action==='finish'){this.gallery?this.carrySaved():this.finish();return;}
  if(action==='keep-copy'){this.keepCopy();return;}
  if(action==='gallery'){this.gallery?this.leaveGallery():this.openGallery();return;}
  if(action==='draft'){this.leaveGallery();return;}
  if(action==='gallery-prev'||action==='gallery-next'){this.openGallery(this.galleryIndex+(action==='gallery-prev'?-1:1));return;}
  if(action==='slot'){this.pickSlot(Number(b.dataset.slot));return;}
  if(action==='friend'){this.states.puppets.friend=b.dataset.friend;this.action=null;this.changeConfig();this.sound();return;}
  if(['play','wave','dance','peek'].includes(action)){this.action=action;this.actionAge=0;this.ballLanded=false;this.noteIndex=-1;if(this.kind==='puppets')this.changeConfig();this.sound();this.announce(this.kind==='fort'?'Peekaboo! Your unicorn is playing in the cushion fort.':this.kind==='ball'?'Down rolls the ball.':action==='wave'?'Your friend waves hello.':action==='dance'?'Your friend does a little dance.':'Peekaboo!');}
 }
 key(e){
  if(!this.kind)return;e.stopPropagation();if(e.key==='Escape'){e.preventDefault();this.close();return;}
  if(e.key==='Tab'){const buttons=[...this.root.querySelectorAll('button:not(:disabled),canvas[tabindex]')].filter(n=>!n.hidden&&n.getClientRects().length);const i=buttons.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0]?.focus();}return;}
  if(this.paused())return;
  if(e.target===this.paper&&!this.gallery){
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();this.cursor.x=clamp(this.cursor.x+(e.key==='ArrowRight' ? .035 : e.key==='ArrowLeft' ? -.035 : 0),.03,.97);this.cursor.y=clamp(this.cursor.y+(e.key==='ArrowDown' ? .05 : e.key==='ArrowUp' ? -.05 : 0),.03,.97);this.keyboardCursor=true;this.paintPaper();}
   if([' ','Enter'].includes(e.key)){e.preventDefault();if(e.repeat)return;this.keyboardCursor=true;const p={...this.cursor};this.addMark(this.tool==='brush'?{tool:'brush',color:this.color,width:.025,points:[[p.x,p.y],[clamp(p.x+.08,0,1),p.y]]}:{tool:'stamp',shape:this.tool,color:this.color,x:p.x,y:p.y,size:.15});}
  }else if(e.target.dataset.slot!==undefined&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const i=Number(e.target.dataset.slot),j=(i+(e.key==='ArrowLeft'||e.key==='ArrowUp'?2:1))%3;this.swap(i,j);this.root.querySelector('[data-slot="'+j+'"]').focus({preventScroll:true});}
 }
 paperPoint(e){const r=this.paper.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)};}
 scenePoint(e){const r=this.sceneCanvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
 down(e){
  if(e.button>0||this.pointer||this.paused())return;
  if(e.target===this.paper&&!this.gallery&&this.art?.loaded&&!this.finishing){e.preventDefault();this.paper.focus({preventScroll:true});this.keyboardCursor=false;const p=this.paperPoint(e);this.pointer={id:e.pointerId,node:e.target,type:'art',start:p,point:p,tool:this.tool,color:this.color,points:[[p.x,p.y]]};e.target.setPointerCapture(e.pointerId);this.paintPaper();}
  const b=e.target.closest('[data-slot]');if(b){e.preventDefault();b.focus({preventScroll:true});this.pointer={id:e.pointerId,node:b,type:'slot',slot:Number(b.dataset.slot),start:this.scenePoint(e),point:this.scenePoint(e),moved:false};b.setPointerCapture(e.pointerId);}
 }
 move(e){const p=this.pointer;if(!p||p.id!==e.pointerId)return;e.preventDefault();
  if(p.type==='art'){p.point=this.paperPoint(e);if(p.tool==='brush'){const last=p.points.at(-1);if(Math.hypot(p.point.x-last[0],p.point.y-last[1])>.002){
    if(p.points.length>=512){if(!this.commitStroke(p)){this.endPointer(e,false);return;}p.points=[last];}
    const nextPoint=[Math.round(p.point.x*10000)/10000,Math.round(p.point.y*10000)/10000],candidate={tool:'brush',color:p.color,width:.025,points:[...p.points,nextPoint]};
    if(this.art.picture.ops.length>=256||JSON.stringify({version:1,ops:[...this.art.picture.ops,candidate]}).length>65536){this.commitStroke(p);this.endPointer(e,false);this.notice('This paper is full. Carry it to the café, or undo a mark to make room.',false);return;}
    p.points.push(nextPoint);
   }}this.paintPaper();}
  else{p.point=this.scenePoint(e);if(Math.hypot(p.point.x-p.start.x,p.point.y-p.start.y)>15)p.moved=true;}
 }
 commitStroke(p){if(p.tool!=='brush'||!p.points.length)return false;return this.addMark({tool:'brush',color:p.color,width:.025,points:copy(p.points)});}
 up(e){const p=this.pointer;if(!p||p.id!==e.pointerId)return;
  if(p.type==='art'){p.point=this.paperPoint(e);if(p.tool==='brush')this.commitStroke(p);else this.addMark({tool:'stamp',shape:p.tool,color:p.color,x:p.point.x,y:p.point.y,size:.15});}
  else if(p.moved){const slots=this.slots(),target=slots.map((s,i)=>({i,d:Math.hypot(p.point.x-s.x,p.point.y-s.y)})).sort((a,b)=>a.d-b.d)[0];if(target.d<230)this.swap(p.slot,target.i);this.suppressClick={button:p.node,until:performance.now()+500};}else {this.pickSlot(p.slot);this.suppressClick={button:p.node,until:performance.now()+500};}
  this.endPointer(e,false);this.paintPaper();
 }
 endPointer(e,cancel){const p=this.pointer;if(!p||(e&&e.pointerId!==p.id))return;this.pointer=null;
  // Keep a partial brush stroke when play is suspended, but never stamp on cancel.
  if(cancel&&p.type==='art'&&p.tool==='brush')this.commitStroke(p);
  try{if(p.node.hasPointerCapture(p.id))p.node.releasePointerCapture(p.id);}catch(_){}this.paintPaper();
 }
 slots(){return this.kind==='fort'?[{x:390,y:510},{x:715,y:510},{x:550,y:335}]:[{x:535,y:210},{x:565,y:355},{x:535,y:500}];}
 pickSlot(i){if(this.selected===null){this.selected=i;this.sound();this.announce('Choose another '+(this.kind==='fort'?'cushion':'ramp')+' to swap places.');}else if(this.selected===i)this.selected=null;else this.swap(this.selected,i);this.drawButtons();}
 swap(i,j){if(i===j){this.selected=null;this.drawButtons();return;}const key=this.kind==='fort'?'slots':'ramps',list=this.states[this.kind][key];[list[i],list[j]]=[list[j],list[i]];this.selected=null;this.action=null;this.changeConfig();this.sound();}
 drawButtons(){
  if(!this.root||!this.kind||this.kind==='art'||!this.states[this.kind])return;const hit=this.root.querySelector('.uwc-hit-layer'),actions=this.root.querySelector('.uwc-play-actions');
  if(this.kind==='fort'||this.kind==='ball'){
   const existing=[...hit.querySelectorAll('[data-slot]')];if(!existing.length)hit.innerHTML=this.slots().map((s,i)=>'<button type="button" class="uwc-hit" data-uwc="slot" data-slot="'+i+'" aria-label="'+(this.kind==='fort'?'Cushion':'Ramp')+' '+(i+1)+'. Select and tap another to swap, drag to another place, or use arrow keys." style="left:'+s.x/W*100+'%;top:'+s.y/H*100+'%"></button>').join('');
   hit.querySelectorAll('[data-slot]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.slot)===this.selected));
   if(!actions.children.length)actions.innerHTML=this.button('play','play',this.kind==='fort'?'Play peekaboo in your fort':'Roll the ball');
  }else{
   if(!actions.children.length)actions.innerHTML='<div class="uwc-friends" role="group" aria-label="Choose a puppet friend">'+FRIENDS.map(f=>'<button type="button" class="uwc-object uwc-friend" data-uwc="friend" data-friend="'+f+'" aria-label="'+(f==='pink'?'Pink':'Blue')+' unicorn puppet"><canvas width="120" height="120" aria-hidden="true"></canvas></button>').join('')+'</div><div class="uwc-puppet-actions" role="group" aria-label="Puppet actions">'+this.button('wave','wave','Wave hello')+this.button('dance','dance','Dance')+this.button('peek','peek','Play peekaboo')+'</div>';
   for(const b of actions.querySelectorAll('[data-friend]')){b.setAttribute('aria-pressed',b.dataset.friend===this.states.puppets.friend);const c=b.querySelector('canvas').getContext('2d');c.clearRect(0,0,120,120);this.friend(c,b.dataset.friend,60,112,102);}
  }this.status();if(this.configErrors[this.kind])this.notice('Your play arrangement is here, but it could not be saved yet.');
 }
 collection(){return Object.values(this.service.value.clubhouse?.artworks||{}).sort((a,b)=>b.at-a.at||a.id.localeCompare(b.id));}
 async refreshStack(){
  if(!this.root||this.kind!=='art')return;const stack=this.root.querySelector('.uwc-paper-stack'),items=this.collection();stack.hidden=!items.length;if(!items.length)return;
  const id=this.gallery?.id||items[0].id;let picture=this.galleryCache.get(id);
  if(!picture){try{picture=await this.service.getMedia('clubhouse:art:'+id);if(this.validPicture(picture))this.galleryCache.set(id,picture);}catch(_){return;}}
  if(this.kind!=='art'||!stack.isConnected||!this.validPicture(picture))return;const c=stack.querySelector('canvas').getContext('2d');c.clearRect(0,0,150,104);c.save();c.translate(6,7);c.rotate(-.07);window.UWClubhouseArt.drawPicture(c,blank(),3,3,132,88);c.restore();window.UWClubhouseArt.drawPicture(c,picture,10,1,132,88);
 }
 async openGallery(index=this.galleryIndex){
  if(this.finishing)return;this.endPointer(null,true);const items=this.collection();if(!items.length)return;this.galleryIndex=(index%items.length+items.length)%items.length;
  const entry=items[this.galleryIndex],epoch=this.epoch;this.gallery={id:entry.id,picture:null};this.root.dataset.gallery='true';this.root.querySelector('.uwc-gallery-nav').hidden=false;this.root.querySelector('[data-uwc=gallery]').setAttribute('aria-label','Return to your unfinished picture');this.paper.setAttribute('aria-label','Saved picture '+(this.galleryIndex+1)+' of '+items.length);this.paintPaper();this.artControls();
  for(const b of this.root.querySelectorAll('[data-uwc=gallery-prev],[data-uwc=gallery-next]'))b.disabled=items.length<2;
  try{const picture=this.galleryCache.get(entry.id)||await this.service.getMedia('clubhouse:art:'+entry.id);if(!this.validPicture(picture))throw Error('missing');this.galleryCache.set(entry.id,picture);if(epoch===this.epoch&&this.gallery?.id===entry.id){this.gallery.picture=picture;this.paintPaper();this.artControls();this.refreshStack();}}
  catch(_){if(epoch===this.epoch&&this.gallery?.id===entry.id)this.notice('This saved picture could not open. Your pictures have not changed. Tap its paper stack to return.',false);}
 }
 leaveGallery(){this.gallery=null;if(!this.root)return;delete this.root.dataset.gallery;this.root.querySelector('.uwc-gallery-nav').hidden=true;this.root.querySelector('[data-uwc=gallery]').setAttribute('aria-label','Look through your saved pictures');this.paper.setAttribute('aria-label','Your picture. Tap or drag to draw. With a keyboard, use arrow keys to move and Space or Enter to add a mark.');this.paintPaper();this.artControls();this.refreshStack();}
 async carrySaved(){
  const gallery=this.gallery;if(!gallery?.picture||this.finishing)return;this.finishing=true;this.finishWait=new Promise(resolve=>{this.finishDone=resolve;});this.artControls();
  try{if(this.art?.edit!==this.art?.ack&&!await this.saveDraft())return;await this.service.run('clubhouse-carry',{artwork:gallery.id},'clubhouse-carry:'+uid());this.sound(true);this.announce('Carry this saved picture to the café display.');await this.close(true);}
  catch(_){this.notice('This picture is still safely in your paper stack. It could not be picked up yet.',false);}
  finally{this.finishing=false;this.finishDone?.();this.finishDone=null;this.finishWait=null;this.artControls();}
 }
 async keepCopy(){
  const a=this.art;if(!a?.loaded||a.error?.code!=='conflict'||this.finishing)return;this.endPointer(null,true);this.finishing=true;this.finishWait=new Promise(resolve=>{this.finishDone=resolve;});this.artControls();
  try{const pending=a.copyPending||{args:{id:uid(),picture:copy(a.picture)},receipt:'clubhouse-copy:'+uid()};a.copyPending=pending;await this.service.run('clubhouse-keep-copy',pending.args,pending.receipt);this.removeBackup();this.art=null;this.sound(true);this.announce('Both pictures are kept. Carry this one to the café display.');await this.close(true);}
  catch(error){a.error={code:'conflict',cause:error};this.notice(error?.code==='capacity'?'Your marks are still here. The picture collection is full.':'Your marks are still here. Tap the two-paper picture to try keeping both again.',false);}
  finally{this.finishing=false;this.finishDone?.();this.finishDone=null;this.finishWait=null;this.artControls();}
 }
 paintPaper(){
  if(!this.paper?.isConnected||this.kind!=='art')return;const c=this.paper.getContext('2d');c.clearRect(0,0,960,640);
  const p=this.pointer;let picture=this.gallery?this.gallery.picture||blank():this.art?.loaded?this.art.picture:blank();
  if(!this.gallery&&p?.type==='art'){const op=p.tool==='brush'?{tool:'brush',color:p.color,width:.025,points:p.points}:{tool:'stamp',shape:p.tool,color:p.color,x:p.point.x,y:p.point.y,size:.15};picture={version:1,ops:[...picture.ops,op]};}
  window.UWClubhouseArt?.drawPicture(c,picture,0,0,960,640);
  if(!this.gallery&&this.keyboardCursor&&document.activeElement===this.paper){c.save();c.strokeStyle='#654275';c.lineWidth=3;c.setLineDash([6,5]);c.beginPath();c.arc(this.cursor.x*960,this.cursor.y*640,18,0,Math.PI*2);c.stroke();c.restore();}
 }

 start(){cancelAnimationFrame(this.raf);const frame=ms=>{if(!this.kind)return;this.raf=requestAnimationFrame(frame);const paused=this.paused(),dt=this.last&&!paused?Math.min(.05,(ms-this.last)/1000):0;this.last=paused?0:ms;if(paused)return;this.age+=dt;if(this.action)this.actionAge+=dt;if(this.kind==='ball'&&this.action){const note=Math.floor(this.actionAge/1.6);if(note!==this.noteIndex&&note<3){this.noteIndex=note;if(!this.reduced())this.sound(note===2);}}if(this.actionAge>(this.kind==='ball'?5:4.4)){if(this.kind==='ball')this.ballLanded=true;this.action=null;this.actionAge=0;}this.drawScene();};this.raf=requestAnimationFrame(frame);}
 friend(c,id,x,y,h,flip=false){const im=window.UWArt.images['baby_'+id+'_0'];if(im?.complete&&im.naturalWidth)window.UWArt.sprite(c,im,x,y,h,h,flip);}
 drawScene(){
  if(!this.sceneCanvas?.isConnected)return;const cv=this.sceneCanvas,c=cv.getContext('2d');c.clearRect(0,0,W,H);const bg=this.w.images?.['home-downstairs'];if(bg?.complete&&bg.naturalWidth){c.save();c.globalAlpha=.72;c.drawImage(bg,285,240,1130,760,0,0,W,H);c.restore();}
  const light=c.createLinearGradient(0,0,0,H);light.addColorStop(0,'#fff2dc36');light.addColorStop(1,'#b47ab92e');c.fillStyle=light;c.fillRect(0,0,W,H);
  if(this.kind==='art'){this.drawArtTable(c);return;}if(!this.states[this.kind])return;
  if(this.kind==='fort')this.drawFort(c);if(this.kind==='ball')this.drawBall(c);if(this.kind==='puppets')this.drawPuppets(c);
 }
 drawArtTable(c){window.UWArt.ellipse(c,555,606,400,35,'#72507126',null);window.UWArt.rect(c,100,65,910,560,48,'#bf7e56','#8c5c57',8);window.UWArt.rect(c,108,48,894,550,44,'#eac19a','#a96e5f',5);c.save();c.strokeStyle='#fff3d34d';c.lineWidth=4;for(let i=0;i<5;i++){c.beginPath();c.moveTo(130,110+i*108);c.bezierCurveTo(400,85+i*110,700,140+i*108,978,95+i*109);c.stroke();}c.restore();}
 cushion(c,n,x,y,w=275,angle=0,selected=false){const A=window.UWArt;c.save();c.translate(x,y);c.rotate(angle);A.ellipse(c,0,25,w*.48,20,'#69507325',null);A.rect(c,-w/2,-60,w,110,30,COLORS[n],'#79537b',5);A.rect(c,-w/2+12,-49,w-24,87,24,null,'#ffffff72',3);A.ellipse(c,-w*.22,-22,20,6,'#ffffff26',null);if(selected){c.setLineDash([12,8]);A.rect(c,-w/2-13,-73,w+26,137,36,null,'#fff5b7',6);}c.restore();}
 drawFort(c){
  const A=window.UWArt,state=this.states.fort,slots=this.slots(),playing=!!this.action,reduced=this.reduced(),t=this.actionAge;
  A.ellipse(c,550,578,360,55,'#9d6d9b40',null);A.ellipse(c,550,558,330,62,'#e6b9d1','#bc8ab9',4);
  const fabric=c.createLinearGradient(250,170,840,520);fabric.addColorStop(0,'#ffe0df');fabric.addColorStop(.6,'#e9a4c5');fabric.addColorStop(1,'#be79a6');c.beginPath();c.moveTo(230,500);c.quadraticCurveTo(330,260,550,160);c.quadraticCurveTo(735,295,870,500);c.closePath();c.fillStyle=fabric;c.fill();c.strokeStyle='#94668c';c.lineWidth=6;c.stroke();A.line(c,[[550,178],[835,497]],'#ffe4a2',8);A.line(c,[[270,485],[550,183]],'#fff1db88',5);
  A.rect(c,426,280,248,255,90,'#785977','#ad7eaa',6);for(const [x,y]of [[330,410],[390,330],[695,340],[755,420]])A.star(c,x,y,13,'#ffe7af');
  const actorX=playing&&!reduced?550+Math.sin(t*1.4)*92:550,actorY=playing&&!reduced?550+Math.sin(t*2)*11:548;
  if(playing&&(reduced||t<=2.5))A.unicorn(c,actorX,actorY,reduced?170:155,this.w.getOutfit?.()||this.service.value.outfit,reduced?'u_happy1':'u_run'+Math.floor(t*7)%6,t>2.2);
  else if(!playing)A.unicorn(c,550,528,132,this.w.getOutfit?.()||this.service.value.outfit,'u_idle0',false);
  // Cushions form a forgiving arch: permutations change colours, never block play.
  for(const i of [0,1,2]){const p=slots[i],drag=this.pointer?.type==='slot'&&this.pointer.slot===i&&this.pointer.moved;if(drag)continue;this.cushion(c,state.slots[i],p.x,p.y,i===2?355:280,i===0?-.12:i===1?.12:0,this.selected===i);}
  if(this.pointer?.type==='slot'&&this.pointer.moved){const p=this.pointer;this.cushion(c,state.slots[p.slot],p.point.x,p.point.y,280,0,true);}
  if(playing&&!reduced&&t>2.5)A.unicorn(c,630+(t-2.5)*80,585,155,this.w.getOutfit?.()||this.service.value.outfit,'u_run'+Math.floor(t*8)%6,false);
 }
 rampY(slot,type,u){const base=160+slot*145;return base+100*u-(type===1?Math.sin(Math.PI*u)*24:type===2?Math.sin(Math.PI*u*2)*13:0);}
 rampPoint(slot,type,u){return{x:slot===1?805-510*u:295+510*u,y:this.rampY(slot,type,u)};}
 drawRamp(c,slot,type,selected=false,drag=null){const A=window.UWArt;c.save();if(drag){const spot=this.slots()[slot];c.translate(drag.x-spot.x,drag.y-spot.y);}
  for(const u of [.12,.88]){const p=this.rampPoint(slot,type,u);A.rect(c,p.x-13,p.y+15,26,590-p.y,8,'#d6a477','#996779',3);}
  c.beginPath();for(let i=0;i<=40;i++){const p=this.rampPoint(slot,type,i/40);c[i?'lineTo':'moveTo'](p.x,p.y);}c.lineJoin='round';c.lineCap='round';c.strokeStyle='#7b5378';c.lineWidth=31;c.stroke();c.strokeStyle=COLORS[type];c.lineWidth=23;c.stroke();c.strokeStyle='#fff6cc88';c.lineWidth=5;c.stroke();
  if(selected){c.strokeStyle='#fff6aa';c.lineWidth=5;c.setLineDash([10,10]);c.stroke();}c.restore();
 }
 drawBall(c){
  const A=window.UWArt,state=this.states.ball;A.ellipse(c,550,600,365,46,'#9b719b35',null);
  for(const slot of [2,1,0])this.drawRamp(c,slot,state.ramps[slot],this.selected===slot,this.pointer?.type==='slot'&&this.pointer.moved&&this.pointer.slot===slot?this.pointer.point:null);
  // Wide catch cups make every arrangement a complete, welcoming run.
  A.ellipse(c,805,316,42,18,'#f5d993','#af817f',4);A.ellipse(c,295,461,42,18,'#f5d993','#af817f',4);A.ellipse(c,823,590,82,25,'#c89aca','#895d94',5);
  let p=this.ballLanded?{x:823,y:567}:{x:295,y:this.rampY(0,state.ramps[0],0)-29};if(this.action){const segment=Math.min(2,Math.floor(this.actionAge/1.6)),phase=(this.actionAge%1.6)/1.6;if(this.reduced()||this.actionAge>=4.8){p={x:823,y:567};}else{const u=Math.min(1,phase/.83);p=this.rampPoint(segment,state.ramps[segment],u);p.y-=25;if(phase>.83){const drop=(phase-.83)/.17;p.y+=drop*45;}}}
  const g=c.createRadialGradient(p.x-7,p.y-9,3,p.x,p.y,26);g.addColorStop(0,'#fffad9');g.addColorStop(.45,'#f4cf71');g.addColorStop(1,'#d98b64');A.ellipse(c,p.x,p.y,24,24,g,'#9a657d',4);A.ellipse(c,p.x-7,p.y-8,7,5,'#ffffff9c',null);
 }
 drawPuppets(c){
  const A=window.UWArt,state=this.states.puppets,t=this.actionAge,reduced=this.reduced();A.ellipse(c,550,607,325,42,'#875d9033',null);
  A.rect(c,250,76,600,520,28,'#e7b77f','#94668c',7);A.rect(c,278,105,544,380,18,'#746183','#94668c',5);
  c.save();c.beginPath();c.rect(294,124,512,365);c.clip();let x=550,y=475,angle=0;
  if(this.action==='dance'&&!reduced){x+=Math.sin(t*5)*65;y-=Math.abs(Math.sin(t*5))*40;angle=Math.sin(t*5)*.12;}
  if(this.action==='peek'&&!reduced)y+=Math.max(0,Math.sin(t*2.6))*190;
  if(this.action==='wave'&&!reduced)angle=Math.sin(t*7)*.16;
  A.rect(c,x-6,y-15,12,150,6,'#dfb580',null);c.save();c.translate(x,y);c.rotate(angle);this.friend(c,state.friend,0,0,245);c.restore();c.restore();
  // Curtain fabric frames the original restaurant friend sprites, never repaints them.
  A.rect(c,266,95,100,392,18,'#c781ae','#98638d',4);A.rect(c,734,95,100,392,18,'#c781ae','#98638d',4);
  for(const x of [282,314,346,750,782,814])A.line(c,[[x,109],[x-5,466]],'#e7abc8',7);
  A.rect(c,242,66,616,76,25,'#bc79a9','#94668c',5);for(let i=0;i<7;i++)A.ellipse(c,285+i*88,132,45,23,'#c98bb7','#94668c',3);
  A.rect(c,246,480,608,120,18,'#d497bd','#94668c',6);A.rect(c,270,499,560,81,13,'#edc4ce','#a9779b',3);A.star(c,550,538,27,'#f6d887');
  for(const [i,friend]of FRIENDS.entries()){const x=i?950:150;A.ellipse(c,x,609,80,20,i?'#b6cee1':'#ecc1d6','#ac86ad',3);const bounce=this.action&&!reduced?Math.abs(Math.sin(t*4+i)) * 8:0;this.friend(c,friend,x,607-bounce,118,!!i);if(this.action)window.UWClubhouseArt?.drawStamp(c,'heart',i?'#8e79c7':'#ed87b8',x,445-bounce,30);}
 }
}
window.UWClubhouse=Clubhouse;
})();
