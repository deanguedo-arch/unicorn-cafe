/* Sneaky Unicorn — Rainbow Restaurant v2.0.0 Production Art Integration
 * Picture-first restaurant loop: customize, seat, order, cook, deliver, clear and wash.
 * Sourcepack characters/environment remain the visual authority; furniture now combines image-generated interior assets with original sourcepack sprites.
 */
(function(){'use strict';
const R=window.RR,A=window.RRArt,$=id=>document.getElementById(id);
const dom={app:$('app'),world:$('world'),stage:$('stage'),customizer:$('customizer'),kitchen:$('kitchen-screen'),ui:$('world-ui'),modal:$('modal-root'),primary:$('primary'),orderPin:$('order-pin'),guide:$('movement-guide')};
const ctx=dom.world.getContext('2d',{alpha:false});
let storageOK=true,saved=null,migrated=false;
try{
 for(const key of [R.SAVE_KEY,...R.PREVIOUS_SAVE_KEYS]){
  let raw=null;try{const text=localStorage.getItem(key);if(text)raw=JSON.parse(text);}catch(_){}
  const good=R.cleanSave(raw);if(good){saved=good;migrated=key!==R.SAVE_KEY;break;}
 }
}catch(_){storageOK=false;}
let engine=new R.Engine(saved),mode='loading',loaded=false;
if(!saved&&window.matchMedia)engine.s.settings.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=1,height=1,dpr=1,clock=0,lastTime=0,saveClock=0,spawnClock=0,idle=0;
let view={x:0,y:0,scale:1},path=[],goal=null,playerMoving=false,playerAnim=0;
let npcPaths=new Map(),npcFacing=new Map(),particles=[],hits=[],toastUntil=0,joyUntil=0,selectedCleanup=null;
let pointer=null,keys=new Set(),cookPointer=null,cookLast=0,cookStepLock=-1,cookDistance=0,cookPrev=null,cookBump=0,cookMoved=false;
let cookCanvas=null,cookContext=null,washCanvas=null,washContext=null,washSnapshot=null,washDone=false;
let kitchenSignature='',hudSignature='',modalReturn='world',previousFocus=null,customStage=0,offlineReady=false,bootCount=0;
let autoZoneKey=null,autoZoneInside=false,autoDwell=0,autoFlashUntil=0,autoLastTrigger='';
const AUTO_DWELL=.28,AUTO_EXIT_PAD=34;
const dayScreen=document.createElement('section');dayScreen.id='day-screen';dayScreen.className='day-screen';dayScreen.hidden=true;dom.stage.insertBefore(dayScreen,dom.modal);
let dayCanvas=null,dayContext=null,dayPointer=null,dayPoint={x:260,y:230},dayDistance=0,dayLast=0,dayDidAct=false,dayPulse=0,cleanTask=null,cleanDone=false,cleanDoneAt=0,completeShown=false;

const sound={context:null,master:null,unlocked:false,
 unlock(){if(this.unlocked){if(this.context?.state==='suspended')this.context.resume().catch(()=>{});return;}try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.context=new AC();this.master=this.context.createGain();this.master.gain.value=engine.s.settings.muted?0:.08;this.master.connect(this.context.destination);this.context.resume().catch(()=>{});this.unlocked=true;}catch(_){}},
 mute(){if(this.master)this.master.gain.setTargetAtTime(engine.s.settings.muted?0:.08,this.context.currentTime,.02);},
 play(kind='tap'){if(!this.unlocked||engine.s.settings.muted)return;try{const ac=this.context,now=ac.currentTime;const notes=kind==='serve'?[523,659,784,1047]:kind==='ready'?[523,698,880]:kind==='wash'?[659,784,988]:kind==='hello'?[587,784]:kind==='oops'?[392,330]:[460+Math.random()*130];notes.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+i*.09);o.frequency.exponentialRampToValueAtTime(f*1.06,now+i*.09+.12);g.gain.setValueAtTime(0,now+i*.09);g.gain.linearRampToValueAtTime(.55,now+i*.09+.018);g.gain.exponentialRampToValueAtTime(.001,now+i*.09+.22);o.connect(g);g.connect(this.master);o.start(now+i*.09);o.stop(now+i*.09+.24);});}catch(_){} }
};
function imageHTML(key,cls='',alt=''){return `<img class="${cls}" src="${window.RR_ASSETS[key]||A.toolData(key)}" alt="${alt}" draggable="false">`;}
function foodHTML(dish,variant,cls=''){return `<img class="${cls}" src="${A.foodData(dish,variant)}" alt="${R.RECIPES[dish].name}" draggable="false">`;}
function variantInfo(dish,id){return R.RECIPES[dish].variants.find(x=>x.id===id)||R.RECIPES[dish].variants[0];}
function variantHTML(dish,id,cls=''){const v=variantInfo(dish,id);return `<img class="${cls}" src="${A.toolData(v.icon)}" alt="${v.name}" draggable="false">`;}
const tableBadgePictures=new Map();
function tableMarkHTML(i,cls='table-mark'){
 const t=R.TABLES[i];
 if(!tableBadgePictures.has(i)){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;A.badge(canvas.getContext('2d'),t.symbol,48,48,40,t.colour);tableBadgePictures.set(i,canvas.toDataURL());}
 return `<span class="${cls} table-badge" aria-label="${t.symbol} table"><img src="${tableBadgePictures.get(i)}" alt="" draggable="false"></span>`;
}
function guestKey(c,moving=false){const happy=['eating','finished'].includes(c.phase);if(c.type==='pink'||c.type==='blue')return 'baby_'+c.type+'_'+(happy?(Math.floor(clock*4+c.id)%2?4:5):moving?1+Math.floor(clock*6+c.id)%3:0);if(c.type==='human')return happy?'h_happy':moving?'h_run'+Math.floor(clock*6)%4:'h_idle0';if(c.type==='worker')return happy?'w_5_3':'w_0_'+(moving?Math.floor(clock*5)%3:0);return happy?'m_4_5':'m_0_'+(moving?Math.floor(clock*5)%3:0);}
function save(){try{localStorage.setItem(R.SAVE_KEY,JSON.stringify(engine.snapshot()));storageOK=true;}catch(_){storageOK=false;}}
function feedback(kind='tap'){sound.play(kind);try{if(navigator.vibrate&&!engine.s.settings.reduced)navigator.vibrate(kind==='serve'?22:kind==='wash'?16:8);}catch(_){} }
function announce(text){$('announcer').textContent=text;}
function toast(text,seconds=2.2){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=clock+seconds;announce(text);}
function stopControls(){pointer=null;keys.clear();path=[];goal=null;cookPointer=null;playerMoving=false;autoDwell=0;dayPointer=null;}
function syncPrefs(){dom.app.classList.toggle('reduced',engine.s.settings.reduced);sound.mute();}
function updateProgress(){const s=engine.s;
 $('day-progress').innerHTML=`<div class="shift-pips">${Array.from({length:5},(_,i)=>`<span class="meal-pip ${i<s.served?'filled':''}"></span>`).join('')}</div><span class="phase-icon ${s.lunch.done?'done':''}" aria-hidden="true">${imageHTML('lunch')}</span><div class="shift-pips">${Array.from({length:5},(_,i)=>`<span class="meal-pip ${i+5<s.served?'filled':''}"></span>`).join('')}</div><span class="phase-icon ${s.completed?'done':''}" aria-hidden="true">${imageHTML('mop')}</span>`;
 $('day-progress').setAttribute('aria-label',`${s.served} of ten meals, ${s.lunch.done?'lunch finished':'lunch after five meals'}, ${s.completed?'restaurant clean':'cleaning at closing'}`);
}
function decorChoice(stage,id){return `<img src="${A.customData(stage,id,engine.s.decor)}" alt="" draggable="false">`;}
const CUSTOM_STAGES=[['flooring','floor'],['wallpaper','wall'],['tableType','table'],['tablecloth','cloth'],['decoration','flower'],['chairs','chair']];
function showCustomizer(stage=0){dayScreen.hidden=true;stopControls();mode='customize';dom.ui.hidden=true;dom.kitchen.hidden=true;dom.customizer.hidden=false;customStage=R.clamp(stage,0,6);renderCustomizer();resize();}
function renderCustomizer(){
 const idx=Math.min(customStage,5),[stage,icon]=CUSTOM_STAGES[idx],choices=R.CUSTOMIZATION[stage],selected=engine.s.decor[stage];
 const labels=['Floor','Walls','Tables','Tablecloths','Decorations','Chairs'];
 dom.customizer.innerHTML=`<div class="designer-shell"><div class="designer-banner">Design your Restaurant!</div><nav class="designer-tabs" aria-label="Restaurant design categories">${CUSTOM_STAGES.map(([key,ico],i)=>`<button class="designer-tab ${i===idx?'selected':''}" data-custom-jump="${i}" aria-label="Choose ${key}" aria-pressed="${i===idx}">${decorChoice(key,engine.s.decor[key])}<span>${labels[i]}</span></button>`).join('')}</nav><div class="designer-preview"><canvas id="designer-preview" aria-label="Live restaurant design preview"></canvas></div><div class="designer-picker"><div class="custom-options">${choices.map(id=>`<button class="custom-choice ${id===selected?'selected':''}" data-custom-stage="${stage}" data-custom-value="${id}" aria-label="Choose ${stage} ${id}" aria-pressed="${id===selected}">${decorChoice(stage,id)}</button>`).join('')}</div></div><button class="designer-open" data-action="open" aria-label="Open the restaurant">${A.icon('play')}</button></div>`;
 drawDesignerPreview();
}
function drawDesignerPreview(){
 const canvas=$('designer-preview');if(!canvas||!loaded)return;const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,r.width*2);canvas.height=Math.max(1,r.height*2);const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,d=engine.s.decor;
 c.drawImage(A.images['room_floor_'+d.flooring],0,0,w,h);c.drawImage(A.images['room_wall_'+d.wallpaper],0,0,w,h*.3);
 const sc=Math.min(w/650,h/460);c.save();c.translate(w/2,h/2);c.scale(sc,sc);A.sprite(c,'room_window',0,-65,165,136);A.sprite(c,'room_plant',-225,155,80,110);A.sprite(c,'room_plant',225,155,80,110);A.drawTableFurniture(c,0,25,d,'heart','#e98bb1',clock,false);A.sprite(c,'u_idle0',155,175,105,110);c.restore();
}
function openRestaurant(){sound.unlock();feedback('hello');stopControls();dayScreen.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=true;dom.ui.hidden=false;dom.modal.innerHTML='';mode='world';hudSignature='';npcPaths.clear();idle=0;spawnClock=0;
 if(engine.s.completed){showComplete();return;}
 if(!engine.s.customers.length&&engine.s.issued===0)engine.spawn(1);
 engine.updateDay();save();updateHUD(true);resize();
 if(engine.s.phase==='lunch')openLunch();else if(engine.s.prep)openCooking();
}
function orderCustomer(){const s=engine.s;return (s.tray&&engine.customer(s.tray.orderId))||(s.prep&&engine.customer(s.prep.orderId))||engine.customer(s.active)||engine.nextOrder()||s.customers.find(c=>c.phase==='waiting')||null;}
function firstDirty(){return engine.s.tables.findIndex(t=>t.status==='dirty');}
function primaryInfo(){const s=engine.s,p=s.player;const clean=nextCleanTask();if(s.phase==='cleaning'&&clean)return {type:'clean',task:clean.id,aria:clean.kind==='floor'?'Mop this floor':'Clean this part of the restaurant',icon:clean.kind==='floor'?'mop':'sponge'};if(s.phase==='lunch')return {type:'lunch',aria:'Take your lunch break',icon:'lunch'};if(s.completed)return {type:'new-day',aria:'Open another restaurant day',icon:'play'};
 if(s.dirtyTray){const near=Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y)<105;return {type:'sink',aria:near?'Wash the dirty dish':'Bring dirty dish to the sink',icon:'sink',near};}
 if(s.tray){const c=engine.customer(s.tray.orderId);if(c){const near=Math.hypot(p.x-R.TABLES[c.table].meet.x,p.y-R.TABLES[c.table].meet.y)<105;return {type:'table',id:c.id,table:c.table,aria:near?'Serve the meal':'Bring meal to its table',food:s.tray,near};}}
 if(s.prep){const c=engine.customer(s.prep.orderId),near=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y)<105;return {type:'kitchen',id:c?.id,aria:near?'Keep cooking':'Go to the kitchen',food:c?{dish:c.dish,variant:c.variant}:null,near};}
 let c=engine.customer(s.active);if(!c||!['waiting','ordered','arriving'].includes(c.phase))c=engine.nextOrder()||s.customers.find(x=>x.phase==='waiting')||s.customers.find(x=>x.phase==='arriving');
 if(c){if(c.phase==='ordered'){const near=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y)<105;return {type:'kitchen',id:c.id,aria:near?'Make the picture order':'Go to the kitchen',food:{dish:c.dish,variant:c.variant},near};}
  const near=Math.hypot(p.x-R.TABLES[c.table].meet.x,p.y-R.TABLES[c.table].meet.y)<105;return {type:'table',id:c.id,table:c.table,aria:c.phase==='waiting'?(near?'Take the picture order':'Go to the customer'):'Meet the arriving customer',icon:'order',near};}
 const dirty=selectedCleanup!==null&&s.tables[selectedCleanup]?.status==='dirty'?selectedCleanup:firstDirty();if(dirty>=0){const near=Math.hypot(p.x-R.TABLES[dirty].meet.x,p.y-R.TABLES[dirty].meet.y)<105;return {type:'dirty',table:dirty,aria:near?'Pick up the dirty dish':'Go clear the table',icon:'bubbles',near};}
 return {type:'wait',aria:'Guests are coming',icon:'heart'};
}
function actionHTML(info){if(['clean','lunch'].includes(info.type))return imageHTML(info.icon);if(info.food){const badge=info.table!==undefined?tableMarkHTML(info.table,'mini'):A.icon('oven');return `<span class="action-stack">${foodHTML(info.food.dish,info.food.variant)}<span class="mini">${badge}</span></span>`;}if(info.type==='table'&&info.table!==undefined)return `<span class="action-stack">${A.icon('heart')}<span class="mini">${tableMarkHTML(info.table,'mini')}</span></span>`;if(info.type==='kitchen')return `<span class="action-stack">${A.icon('chef')}<span class="mini">${A.icon('oven')}</span></span>`;if(info.type==='dirty')return `<span class="action-stack">${A.icon('tray')}<span class="mini">${A.icon('bubbles')}</span></span>`;if(info.type==='sink')return `<span class="action-stack">${A.icon('bubbles')}<span class="mini">${A.icon('sink')}</span></span>`;return A.icon(info.icon||'heart');}
function updateOrderPin(){const c=orderCustomer();if(engine.s.phase==='cleaning'){dom.orderPin.hidden=false;const n=engine.s.cleaning.filter(q=>q.p>=R.CLEAN_TASKS.find(t=>t.id===q.id).need).length;dom.orderPin.innerHTML=`${imageHTML(R.surfacesClean(engine.s)?'mop':'sponge','variant')}<span class="cleanup-meter" aria-label="${n} of ${R.CLEAN_TASKS.length} areas clean"><span style="width:${100*n/R.CLEAN_TASKS.length}%"></span></span>${A.icon('star')}`;return;}if(!c||!['ordered','waiting'].includes(c.phase)){dom.orderPin.hidden=true;dom.orderPin.innerHTML='';return;}dom.orderPin.hidden=false;dom.orderPin.innerHTML=`${imageHTML(guestKey(c),'pin-portrait')}${tableMarkHTML(c.table,'badge-svg')}<span class="pin-arrow">${A.icon('arrow')}</span>${foodHTML(c.dish,c.variant,'food')}${variantHTML(c.dish,c.variant,'variant')}`;}
function updateHUD(force=false){if(mode!=='world')return;const s=engine.s,info=primaryInfo(),sig=JSON.stringify([s.customers.map(c=>[c.id,c.table,c.phase]),s.active,s.tray,s.dirtyTray,s.tables.map(t=>t.status),s.served,info.type,info.id,info.table,info.task,s.phase,s.cleaning.map(t=>t.p)]);if(!force&&sig===hudSignature)return;hudSignature=sig;dom.primary.innerHTML=actionHTML(info);dom.primary.disabled=info.type==='wait';dom.primary.setAttribute('aria-label',info.aria);updateOrderPin();updateProgress();dom.guide.style.opacity=s.total>0&&idle<7?'.12':'.82';}
function nearestWaitingCandidate(){
 const p=engine.s.player;let best=null,dist=Infinity;
 for(const c of engine.s.customers){if(c.phase!=='waiting')continue;const m=R.TABLES[c.table].meet,d=Math.hypot(p.x-m.x,p.y-m.y);if(d<dist){dist=d;best={key:`order:${c.id}`,kind:'order',id:c.id,table:c.table,x:m.x,y:m.y,radius:112,dist};}}
 return best;
}
function nearestDirtyCandidate(){
 const p=engine.s.player;let best=null,dist=Infinity;
 for(let i=0;i<R.TABLES.length;i++){if(engine.s.tables[i].status!=='dirty')continue;const m=R.TABLES[i].meet,d=Math.hypot(p.x-m.x,p.y-m.y);if(d<dist){dist=d;best={key:`dirty:${i}`,kind:'dirty',table:i,x:m.x,y:m.y,radius:112,dist};}}
 return best;
}
function autoCandidate(){
 if(mode!=='world')return null;const s=engine.s,p=s.player;
 if(s.completed||s.phase==='lunch')return null;
 if(s.phase==='cleaning'){const t=nextCleanTask();if(!t)return null;return {key:'clean:'+t.id,kind:'clean',task:t.id,x:t.x,y:t.y,radius:126,dist:Math.hypot(p.x-t.x,p.y-t.y)};}
 // Carry states intentionally narrow the interaction target: a meal goes only to
 // its matching table, and a dirty dish goes only to the sink.
 if(s.dirtyTray){const d=Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y);return {key:'sink',kind:'sink',x:R.SINK.x,y:R.SINK.y,radius:122,dist:d};}
 if(s.tray){const c=engine.customer(s.tray.orderId);if(c){const m=R.TABLES[c.table].meet,d=Math.hypot(p.x-m.x,p.y-m.y);return {key:`serve:${c.id}`,kind:'serve',id:c.id,table:c.table,x:m.x,y:m.y,radius:114,dist:d};}return null;}
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
   if(engine.s.prep)openCooking();else if(guest)openRecipeMenu();
   return !!guest||!!engine.s.prep;
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
 const pulse=.5+.5*Math.sin(clock*5),near=c.dist<=c.radius;
 ctx.save();ctx.globalAlpha=near?.72:.28+.18*pulse;ctx.lineWidth=near?7:5;ctx.strokeStyle=near?'#fff7c7':'#f8e7ff';ctx.setLineDash(near?[]:[5,14]);ctx.beginPath();ctx.ellipse(c.x,c.y,c.radius*.58,c.radius*.25,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);A.star(ctx,c.x,c.y-c.radius*.34,near?11:8,near?'#ffe58b':'#f2c8ee',clock*.35);ctx.restore();
}
function route(kind,arg=null){if(mode!=='world')return;let dest=null,id=null,table=null;if(kind==='kitchen'){id=arg;dest=R.KITCHEN;if(id&&engine.customer(id)?.phase==='ordered')engine.selectOrder(id);}else if(kind==='clean'){const t=R.CLEAN_TASKS.find(t=>t.id===arg);id=arg;dest=t;}else if(kind==='sink')dest=R.SINK;else if(kind==='table'){id=arg;const c=engine.customer(id);if(c){table=c.table;dest=R.TABLES[table].meet;}}else if(kind==='dirty'){table=arg;dest=R.TABLES[table]?.meet;}if(!dest)return;dest=R.safePoint(dest);path=R.pathfind(engine.s.player,dest);goal={kind,id,table,x:dest.x,y:dest.y};idle=0;updateHUD(true);}
function onTable(index){if(mode!=='world')return;selectedCleanup=index;const c=engine.atTable(index);if(engine.s.tray){path=R.pathfind(engine.s.player,R.TABLES[index].meet);goal={kind:'table',id:c?.id||null,table:index,x:R.TABLES[index].meet.x,y:R.TABLES[index].meet.y};return;}if(engine.s.tables[index].status==='dirty'){route('dirty',index);return;}if(!c)return;if(c.phase==='ordered'){engine.selectOrder(c.id);save();route('kitchen',c.id);}else if(c.phase==='waiting'||c.phase==='arriving')route('table',c.id);else{feedback('hello');burst(c.x,c.y-80,8,R.TABLES[index].colour);}}
function mainAction(){sound.unlock();if(mode!=='world')return;const info=primaryInfo();if(info.type==='clean')route('clean',info.task);else if(info.type==='lunch')openLunch();else if(info.type==='new-day')showComplete();else if(info.type==='kitchen')route('kitchen',info.id);else if(info.type==='sink')route('sink');else if(info.type==='table')route('table',info.id);else if(info.type==='dirty')route('dirty',info.table);}
function performGoal(){if(!goal)return;const g=goal;goal=null;if(g.kind==='clean'){openClean(g.id);return;}
 if(g.kind==='kitchen'){if(engine.s.dirtyTray){route('sink');return;}if(engine.s.tray){showCarryQuestion();return;}if(engine.s.prep){openCooking();return;}const c=engine.customer(engine.s.active)||engine.nextOrder();if(c){engine.selectOrder(c.id);openRecipeMenu();}return;}
 if(g.kind==='sink'){if(engine.s.dirtyTray)openWash();return;}
 if(g.kind==='dirty'){if(engine.pickDirty(g.table)){feedback('tap');selectedCleanup=null;save();updateHUD(true);burst(R.TABLES[g.table].food.x,R.TABLES[g.table].food.y-20,9,R.TABLES[g.table].colour);}return;}
 if(g.kind==='table'){
  if(engine.s.tray){serveAt(g.table);return;}const c=engine.atTable(g.table);if(!c)return;if(c.phase==='waiting'){engine.takeOrder(c.id);feedback('hello');burst(c.x,c.y-75,13,R.TABLES[c.table].colour);save();updateHUD(true);}else if(c.phase==='ordered'){engine.selectOrder(c.id);save();updateHUD(true);}return;
 }}
function serveAt(table){const result=engine.serve(table);if(result.ok){feedback('serve');joyUntil=clock+1.5;burst(R.TABLES[table].food.x,R.TABLES[table].food.y-65,28,R.TABLES[table].colour);save();updateHUD(true);}else if(result.reason==='table'){feedback('oops');showTableMismatch(table,result.target);}else if(result.reason==='dish'||result.reason==='variant'){feedback('oops');showMealMismatch(engine.atTable(table)||engine.customer(engine.s.tray?.orderId));}}
function ticketHTML(c){if(!c)return '';return `<div class="ticket">${imageHTML(guestKey(c),'customer')}${tableMarkHTML(c.table)}${A.icon('arrow').replace('<svg ','<svg class="arrow" ')}${foodHTML(c.dish,c.variant,'food')}${variantHTML(c.dish,c.variant,'variant')}</div>`;}
function kitchenHeader(c,retry=false){return `<div class="kitchen-header"><button class="small-round" data-action="leave-kitchen" aria-label="Back to restaurant">${A.icon('back')}</button><div class="kitchen-title-pic">${c?foodHTML(c.dish,c.variant):A.icon('chef')}${A.icon('chef')}</div>${retry?`<button class="small-round" data-action="restart-recipe" aria-label="Restart this recipe">${A.icon('retry')}</button>`:'<span></span>'}</div>`;}
function openRecipeMenu(){toastUntil=0;$('toast').classList.remove('show');stopControls();mode='recipes';dom.ui.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=false;const c=engine.customer(engine.s.active)||engine.nextOrder();if(!c){returnToWorld();return;}engine.selectOrder(c.id);save();dom.kitchen.innerHTML=kitchenHeader(c)+ticketHTML(c)+`<div class="menu-grid">${R.MENU.map(d=>{const r=R.RECIPES[d],v=d===c.dish?c.variant:r.variants[0].id;return `<button data-recipe="${d}" class="dish-card ${d===c.dish?'requested':''}" aria-label="Make ${r.name}${d===c.dish?', matching picture order':''}">${foodHTML(d,v)}${d===c.dish?`<span class="request-star">${A.icon('star')}</span>`:''}</button>`;}).join('')}</div>`;resize();announce(`Picture order is ${R.RECIPES[c.dish].name}, ${variantInfo(c.dish,c.variant).name}.`);}
function startRecipe(dish){const c=engine.customer(engine.s.active);if(!c||!engine.startRecipe(c.id,dish))return;feedback('tap');save();openCooking();}
function currentStepTool(p,st){if(st.tool==='topping'&&p.variant)return variantInfo(p.dish,p.variant).icon;if(st.tool==='fruit'&&p.variant)return variantInfo(p.dish,p.variant).icon;return st.tool;}
function openCooking(){toastUntil=0;$('toast').classList.remove('show');stopControls();mode='cook';dom.ui.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=false;kitchenSignature='';washCanvas=null;const p=engine.s.prep;if(!p){openRecipeMenu();return;}const c=engine.customer(p.orderId);engine.s.active=p.orderId;
 dom.kitchen.innerHTML=`<div class="cook-layout">${kitchenHeader(c,true)}<div class="recipe-banner">Make ${p.dish==='chicken'?'Roast Chicken':R.RECIPES[p.dish].name}!</div><div id="step-dots" class="step-dots"></div><div class="work-area"><canvas id="work-canvas" aria-label="Food preparation area. Tap or drag to prepare." tabindex="0"></canvas><div id="step-picture" class="step-picture"></div><div class="gesture-cue">${A.icon('hand')}</div></div><aside class="cook-order">${ticketHTML(c)}</aside><div id="cook-tools" class="cook-tools"></div></div>`;
 cookCanvas=$('work-canvas');cookContext=cookCanvas.getContext('2d');bindCookCanvas();updateCookUI(true);resize();save();}
function updateCookUI(force=false){const p=engine.s.prep;if(!p||mode!=='cook')return;const r=R.RECIPES[p.dish],st=r.steps[p.step],sig=JSON.stringify([p.dish,p.step,p.p,p.variant,p.deco,p.done,p.placements]);if(!force&&sig===kitchenSignature)return;kitchenSignature=sig;
 const stepPic=$('step-picture'),dots=$('step-dots'),tools=$('cook-tools');if(p.done){stepPic.innerHTML=A.icon('check');dots.innerHTML=r.steps.map(()=>`<span class="step-dot finished">${A.icon('check')}</span>`).join('');tools.innerHTML=`${p.dish==='cupcake'?`<div class="free-deco">${r.decorations.map(d=>`<button data-decoration="${d.id}" aria-label="Free ${d.name}">${imageHTML(d.icon)}</button>`).join('')}</div>`:''}<button class="picture-tool carry" data-action="carry" aria-label="Carry meal to the table">${A.icon('tray')}</button>`;return;}
 const tool=currentStepTool(p,st);stepPic.innerHTML=`${st.action==='choice'||st.action==='decorate'?A.icon('star'):`<img src="${A.toolData(tool)}" alt="">`}<span class="sr-only">${st.label}</span>`;dots.innerHTML=r.steps.map((s,i)=>`<span class="step-dot ${i<p.step?'finished':i===p.step?'current':''}">${i<p.step?A.icon('check'):s.action==='choice'||s.action==='decorate'?A.icon('star'):`<img src="${A.toolData(s.tool==='topping'&&p.variant?variantInfo(p.dish,p.variant).icon:s.tool)}" alt="">`}</span>`).join('');
 if(st.action==='choice'){tools.innerHTML=r.variants.map(v=>`<button class="picture-tool choice" data-variant="${v.id}" aria-label="Choose ${v.name}"><img src="${A.toolData(v.icon)}" alt=""></button>`).join('');}
 else if(st.action==='decorate'){tools.innerHTML=r.decorations.map(v=>`<button class="picture-tool choice" data-decoration="${v.id}" aria-label="Choose ${v.name}. Any decoration is correct."><img src="${A.toolData(v.icon)}" alt=""><span class="free-sparkle">${A.icon('star')}</span></button>`).join('');}
 else tools.innerHTML=`<button id="prep-action" class="picture-tool" data-action="prep" aria-label="${st.label}. Tap this large picture or use the food area."><img src="${A.toolData(tool)}" alt=""></button>`;
}
function doPrep(value=null,meta=null){if(mode!=='cook')return;const result=engine.act(value,meta);if(!result.ok)return;cookBump=1;feedback(result.done?'ready':'tap');save();if(result.advanced){cookPointer=null;cookStepLock=-1;cookPrev=null;cookMoved=false;}updateCookUI();if(result.done){cleanDoneAt=clock+.38;announce('Meal ready to carry.');}}
function cookPoint(e){const r=cookCanvas.getBoundingClientRect();return {x:R.clamp((e.clientX-r.left)/r.width,0,1),y:R.clamp((e.clientY-r.top)/r.height,0,1)};}
function cookDown(e){if(mode!=='cook'||e.button>0||cookPointer!==null)return;const p=engine.s.prep,st=p&&R.RECIPES[p.dish].steps[p.step];if(!p||p.done||!st||['choice','decorate'].includes(st.action))return;e.preventDefault();sound.unlock();cookPointer=e.pointerId;cookStepLock=p.step;cookPrev={x:e.clientX,y:e.clientY};cookDistance=0;cookLast=clock;cookMoved=false;try{cookCanvas.setPointerCapture(e.pointerId);}catch(_){}
 if(st.action==='place'){const q=cookPoint(e);doPrep(null,q);}else if(st.action==='tap')doPrep();}
function cookMove(e){if(cookPointer!==e.pointerId||mode!=='cook'||!engine.s.prep||engine.s.prep.step!==cookStepLock)return;const st=R.RECIPES[engine.s.prep.dish].steps[engine.s.prep.step],dx=e.clientX-cookPrev.x,dy=e.clientY-cookPrev.y,d=Math.hypot(dx,dy);cookDistance+=d;cookMoved=cookMoved||d>7;cookPrev={x:e.clientX,y:e.clientY};if(['rub','stir'].includes(st.action)&&cookDistance>34&&clock-cookLast>.11){cookDistance=0;cookLast=clock;doPrep();}else if(st.action==='place'&&cookDistance>45&&clock-cookLast>.14){cookDistance=0;cookLast=clock;doPrep(null,cookPoint(e));}}
function cookUp(e){if(cookPointer!==e.pointerId)return;const p=engine.s.prep,st=p&&p.step===cookStepLock?R.RECIPES[p.dish].steps[p.step]:null;if(st&&['rub','stir','hold'].includes(st.action)&&!cookMoved&&p?.step===cookStepLock)doPrep();cookPointer=null;cookStepLock=-1;cookPrev=null;try{if(cookCanvas.hasPointerCapture(e.pointerId))cookCanvas.releasePointerCapture(e.pointerId);}catch(_){} }
function bindCookCanvas(){cookCanvas.addEventListener('pointerdown',cookDown);cookCanvas.addEventListener('pointermove',cookMove);cookCanvas.addEventListener('pointerup',cookUp);cookCanvas.addEventListener('pointercancel',e=>{cookPointer=null;cookStepLock=-1;cookPrev=null;});}
function openWash(){if(!engine.s.dirtyTray){returnToWorld();return;}stopControls();mode='wash';dom.ui.hidden=true;dom.customizer.hidden=true;dom.kitchen.hidden=false;washDone=false;washSnapshot={...engine.s.dirtyTray};dom.kitchen.innerHTML=kitchenHeader(null,false)+`<div class="ticket">${tableMarkHTML(washSnapshot.table)}${A.icon('arrow').replace('<svg ','<svg class="arrow" ')}${A.icon('sink')}${A.icon('bubbles')}</div><div class="wash-body"><canvas id="wash-canvas" aria-label="Sink washing area. Rub or tap bubbles to wash the dish." tabindex="0"></canvas><div id="wash-tools" class="wash-tools"><button class="picture-tool" data-action="wash" aria-label="Wash the dish">${A.icon('bubbles')}</button></div></div>`;washCanvas=$('wash-canvas');washContext=washCanvas.getContext('2d');bindWashCanvas();resize();save();}
function doWash(){if(mode!=='wash'||washDone)return;const result=engine.washAct();if(!result.ok)return;feedback(result.done?'wash':'tap');save();if(result.done){washDone=true;burst(R.SINK.x,R.SINK.y-50,18,'#a7dfe5');$('wash-tools').innerHTML=`<button class="picture-tool carry" data-action="wash-return" aria-label="Return to restaurant">${A.icon('check')}</button>`;}drawWashing();}
function washDown(e){if(mode!=='wash'||e.button>0||washDone)return;e.preventDefault();sound.unlock();cookPointer=e.pointerId;cookPrev={x:e.clientX,y:e.clientY};cookDistance=0;cookMoved=false;try{washCanvas.setPointerCapture(e.pointerId);}catch(_){} }
function washMove(e){if(cookPointer!==e.pointerId||washDone)return;const d=Math.hypot(e.clientX-cookPrev.x,e.clientY-cookPrev.y);cookDistance+=d;cookMoved=cookMoved||d>6;cookPrev={x:e.clientX,y:e.clientY};if(cookDistance>38){cookDistance=0;doWash();}}
function washUp(e){if(cookPointer!==e.pointerId)return;if(!cookMoved&&!washDone)doWash();cookPointer=null;cookPrev=null;try{if(washCanvas.hasPointerCapture(e.pointerId))washCanvas.releasePointerCapture(e.pointerId);}catch(_){} }
function bindWashCanvas(){washCanvas.addEventListener('pointerdown',washDown);washCanvas.addEventListener('pointermove',washMove);washCanvas.addEventListener('pointerup',washUp);washCanvas.addEventListener('pointercancel',washUp);}
function carryMeal(){if(clock<cleanDoneAt||!engine.packMeal())return;feedback('ready');save();returnToWorld();}
function leaveKitchen(){if(mode==='cook'&&engine.s.prep){showDialog('Cooking can wait',`<div class="meal-compare"><div class="compare-card">${foodHTML(engine.s.prep.dish,engine.s.prep.variant||R.RECIPES[engine.s.prep.dish].variants[0].id)}</div></div><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('chef')}</button><button class="dialog-button" data-action="pause-cooking">${A.icon('back')}</button></div><p class="parent-copy">Progress is saved. Either picture is safe.</p>`);return;}returnToWorld();}
function returnToWorld(){dayScreen.hidden=true;dayCanvas=null;dayContext=null;stopControls();mode='world';dom.kitchen.hidden=true;dom.customizer.hidden=true;dom.ui.hidden=false;cookCanvas=null;cookContext=null;washCanvas=null;washContext=null;save();updateHUD(true);resize();const c=autoCandidate();autoZoneKey=c?.key||null;autoZoneInside=!!c&&c.dist<=c.radius;autoDwell=0;}
function showDialog(title,body){previousFocus=document.activeElement;modalReturn=mode;stopControls();mode='dialog';dom.modal.innerHTML=`<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2>${body}</section></div>`;dom.modal.querySelector('button')?.focus({preventScroll:true});}
function closeDialog(){dom.modal.innerHTML='';mode=modalReturn;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});if(mode==='world')updateHUD(true);}
function menuDialog(){if(!loaded)return;if(mode==='dialog'){closeDialog();return;}showDialog('Parent & settings',`<div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('play')}</button><button class="dialog-button" data-action="toggle-audio" aria-label="Toggle sound">${A.icon(engine.s.settings.muted?'mute':'sound')}</button><button class="dialog-button" data-action="toggle-motion" aria-label="Toggle reduced motion">${A.icon('star')}</button><button class="dialog-button" data-action="customize" aria-label="Decorate restaurant">${A.icon('table')}</button><button class="dialog-button" data-action="collection" aria-label="Recipe collection">${A.icon('order')}</button><button class="dialog-button quiet" data-action="reset-question" aria-label="Ask to reset restaurant">${A.icon('retry')}<span class="parent-copy">Grown-ups: start fresh</span></button></div><p class="parent-copy">${storageOK?'Saved only on this device.':'Saving is unavailable; play still works.'} ${offlineReady?'Offline cache ready.':'Offline becomes available after the hosted app caches.'}<br>v${R.VERSION} · no ads, accounts, purchases or tracking.</p>`);}
function compareCard(dish,variant,table,deco=null){return `<div class="compare-card">${tableMarkHTML(table)}${foodHTML(dish,variant)}${variantHTML(dish,variant,'variant')}</div>`;}
function showMealMismatch(c){const t=engine.s.tray;if(!t)return;const target=c||engine.customer(t.orderId);if(!target)return;showDialog('Picture check',`<div class="meal-compare">${compareCard(t.dish,t.variant,target.table,t.deco)}<span class="xmark">×</span>${compareCard(target.dish,target.variant,target.table)}</div><div class="dialog-buttons"><button class="dialog-button good" data-action="fix-meal">${A.icon('retry')}${A.icon('chef')}</button><button class="dialog-button" data-action="resume">${A.icon('tray')}</button></div><p class="parent-copy">The pictures do not match yet. Remaking is gentle and keeps the order.</p>`);}
function showTableMismatch(chosen,targetIndex){const t=engine.s.tray;if(!t)return;const target=Number.isInteger(targetIndex)?targetIndex:engine.customer(t.orderId)?.table;if(target===undefined)return;showDialog('Table check',`<div class="meal-compare"><div class="compare-card">${tableMarkHTML(target)}${foodHTML(t.dish,t.variant)}</div><span class="xmark">≠</span><div class="compare-card">${tableMarkHTML(chosen)}${engine.atTable(chosen)?foodHTML(engine.atTable(chosen).dish,engine.atTable(chosen).variant):A.icon('table')}</div></div><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('tray')}${tableMarkHTML(target)}</button><button class="dialog-button" data-action="fix-meal">${A.icon('retry')}</button></div><p class="parent-copy">The meal is fine; its table picture is different. You can keep carrying or remake.</p>`);}
function showCarryQuestion(){const t=engine.s.tray;if(!t)return;const c=engine.customer(t.orderId);showDialog('Meal on tray',`<div class="meal-compare">${compareCard(t.dish,t.variant,c?.table??0)}</div><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('tray')}</button><button class="dialog-button" data-action="fix-meal">${A.icon('retry')}</button></div>`);}
function showCollection(){const from=mode==='dialog'?modalReturn:mode;if(mode==='dialog')closeDialog();showDialog('Recipe pictures',`<div class="collection">${R.MENU.map(d=>`<img style="opacity:${engine.s.stickers.includes(d)?1:.18}" src="${A.foodData(d,R.RECIPES[d].variants[0].id)}" alt="${R.RECIPES[d].name}">`).join('')}</div><p class="parent-copy">${engine.s.stickers.length} / ${R.MENU.length} recipe pictures · ${engine.s.total} happy meals</p><div class="dialog-buttons"><button class="dialog-button good wide" data-action="resume">${A.icon('back')}</button></div>`);modalReturn=from;}
function showComplete(){if(!engine.s.completed)return;dayScreen.hidden=true;completeShown=true;feedback('serve');showDialog('Restaurant day complete',`${imageHTML('u_happy1','', 'Happy unicorn')}<div class="collection">${R.MENU.map(d=>foodHTML(d,R.RECIPES[d].variants[0].id)).join('')}</div><div class="dialog-buttons"><button class="dialog-button good" data-action="replay" aria-label="Start another day">${A.icon('play')}</button><button class="dialog-button" data-action="new-day" aria-label="Decorate the next day">${A.icon('table')}</button></div><p class="parent-copy">Ten happy meals, a lunch break, every dish returned, every surface wiped and every floor mopped.</p>`);save();}
function resetQuestion(){if(mode==='dialog')closeDialog();showDialog('Grown-up check',`<p>Start this restaurant completely fresh? This does not touch any other Sneaky Unicorn game.</p><div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('back')}</button><button class="dialog-button" data-action="reset-confirm" aria-label="Confirm reset restaurant">${A.icon('retry')}</button></div><p class="parent-copy">This second confirmation protects saved restaurant progress.</p>`);}
function handleAction(action,e){sound.unlock();
 if(action==='lunch-pick'){if(engine.chooseLunch(e.target.closest('button').dataset.meal)){feedback('hello');save();renderLunch();}return;}
 if(action==='lunch-act'){lunchAction();return;}
 if(action==='lunch-return'){if(engine.endLunch()){feedback('ready');save();returnToWorld();updateProgress();}return;}
 if(action==='clean-act'){cleanAction();return;}
 if(action==='day-return'){returnToWorld();if(engine.s.completed)showComplete();return;}
 switch(action){
 case 'load-retry':boot();break;case 'replay':engine.newDay();completeShown=false;npcPaths.clear();particles=[];save();openRestaurant();break;case 'open':openRestaurant();break;case 'custom-back':customStage=Math.max(0,customStage-1);renderCustomizer();break;case 'custom-next':customStage=Math.min(6,customStage+1);renderCustomizer();break;
 case 'leave-kitchen':leaveKitchen();break;case 'restart-recipe':showDialog('Restart this meal?',`<div class="dialog-buttons"><button class="dialog-button good" data-action="resume" aria-label="Return to play">${A.icon('back')}</button><button class="dialog-button" data-action="restart-confirm">${A.icon('retry')}</button></div>`);break;
 case 'restart-confirm':closeDialog();engine.restartPrep();save();openCooking();break;case 'prep':if(mode==='cook'){const p=engine.s.prep,st=p&&R.RECIPES[p.dish].steps[p.step];if(st?.action==='place')doPrep(null,{x:.5+(p.p-1)*.18,y:.48+(p.p%2)*.12});else doPrep();}break;
 case 'carry':carryMeal();break;case 'wash':doWash();break;case 'wash-return':returnToWorld();break;case 'resume':closeDialog();break;case 'pause-cooking':closeDialog();returnToWorld();break;
 case 'fix-meal':closeDialog();engine.remake();save();returnToWorld();route('kitchen',engine.s.active);break;case 'toggle-audio':engine.s.settings.muted=!engine.s.settings.muted;save();syncPrefs();closeDialog();menuDialog();break;case 'toggle-motion':engine.s.settings.reduced=!engine.s.settings.reduced;save();syncPrefs();closeDialog();menuDialog();break;
 case 'customize':if(mode==='dialog')closeDialog();showCustomizer(0);break;case 'collection':showCollection();break;case 'new-day':if(mode==='dialog')dom.modal.innerHTML='';engine.newDay();completeShown=false;dayScreen.hidden=true;npcPaths.clear();particles=[];save();showCustomizer(0);break;case 'reset-question':resetQuestion();break;case 'reset-confirm':engine.reset();completeShown=false;dayScreen.hidden=true;npcPaths.clear();particles=[];selectedCleanup=null;save();syncPrefs();dom.modal.innerHTML='';showCustomizer(0);break;
 }}
dom.app.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.disabled)return;idle=0;if(button.dataset.customJump!==undefined){customStage=Number(button.dataset.customJump);renderCustomizer();}else if(button.dataset.customStage){if(engine.setDecor(button.dataset.customStage,button.dataset.customValue)){feedback('tap');save();renderCustomizer();}}else if(button.dataset.action)handleAction(button.dataset.action,e);else if(button.dataset.recipe&&mode==='recipes')startRecipe(button.dataset.recipe);else if(button.dataset.variant&&mode==='cook')doPrep(button.dataset.variant);else if(button.dataset.decoration&&mode==='cook'){if(engine.redecorate(button.dataset.decoration)){feedback('tap');save();updateCookUI(true);}else doPrep(button.dataset.decoration);}});
dom.primary.addEventListener('click',mainAction);$('menu').addEventListener('click',menuDialog);
function resize(){const r=dom.stage.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);if(dom.world.width!==Math.round(width*dpr)||dom.world.height!==Math.round(height*dpr)){dom.world.width=Math.round(width*dpr);dom.world.height=Math.round(height*dpr);}for(const canvas of [cookCanvas,washCanvas,dayCanvas])if(canvas){const cr=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(cr.width*dpr)),h=Math.max(1,Math.round(cr.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}}
window.addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(dom.stage);
function screenToWorld(x,y){return {x:x/view.scale+view.x,y:y/view.scale+view.y};}function worldToScreen(x,y){return {x:(x-view.x)*view.scale,y:(y-view.y)*view.scale};}function canvasPosition(e){const r=dom.world.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
dom.world.addEventListener('pointerdown',e=>{if(mode!=='world'||e.button>0||pointer)return;e.preventDefault();sound.unlock();const p=canvasPosition(e);pointer={id:e.pointerId,x:p.x,y:p.y,dx:0,dy:0,moved:0};path=[];goal=null;idle=0;try{dom.world.setPointerCapture(e.pointerId);}catch(_){} });
dom.world.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=canvasPosition(e);pointer.dx=p.x-pointer.x;pointer.dy=p.y-pointer.y;pointer.moved=Math.max(pointer.moved,Math.hypot(pointer.dx,pointer.dy));idle=0;});
function endPointer(e,cancel=false){if(!pointer||pointer.id!==e.pointerId)return;const tap=pointer.moved<9,p=canvasPosition(e);pointer=null;try{if(dom.world.hasPointerCapture(e.pointerId))dom.world.releasePointerCapture(e.pointerId);}catch(_){}if(tap&&!cancel&&mode==='world')worldTap(p.x,p.y);}
dom.world.addEventListener('pointerup',e=>endPointer(e));dom.world.addEventListener('pointercancel',e=>endPointer(e,true));dom.world.addEventListener('lostpointercapture',e=>{if(pointer?.id===e.pointerId)pointer=null;});dom.world.addEventListener('contextmenu',e=>e.preventDefault());
function worldTap(x,y){if(engine.s.phase==='cleaning'){const pt=screenToWorld(x,y),ts=engine.cleanTargets();let t=ts.find(t=>Math.hypot(t.artX-pt.x,t.artY-pt.y)<140||Math.hypot(t.x-pt.x,t.y-pt.y)<135);if(t){route('clean',t.id);return;}if(R.walkable(pt.x,pt.y)){path=R.pathfind(engine.s.player,pt);goal=null;}return;}for(let i=hits.length-1;i>=0;i--){const h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){onTable(h.table);return;}}const p=screenToWorld(x,y);if(Math.hypot(p.x-R.SINK.x,p.y-R.SINK.y)<120&&engine.s.dirtyTray){route('sink');return;}if(p.x>430&&p.x<1355&&p.y>20&&p.y<350&&!engine.s.dirtyTray){route('kitchen',engine.s.active);return;}for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i];if(Math.hypot(p.x-t.food.x,p.y-t.food.y)<155||Math.hypot(p.x-t.seat.x,p.y-t.seat.y)<120||Math.hypot(p.x-t.meet.x,p.y-t.meet.y)<150){onTable(i);return;}}if(R.walkable(p.x,p.y)){path=R.pathfind(engine.s.player,p);goal=null;}}
window.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&document.activeElement?.tagName==='BUTTON')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='Tab'&&mode==='dialog'){const buttons=[...dom.modal.querySelectorAll('button')];if(buttons.length){const i=buttons.indexOf(document.activeElement),n=e.shiftKey?(i<=0?buttons.length-1:i-1):(i+1)%buttons.length;e.preventDefault();buttons[n].focus();}return;}if(e.key==='Escape'){if(mode==='dialog')closeDialog();else if(mode==='scrub')returnToWorld();else if(mode==='lunch')menuDialog();else if(['cook','recipes','wash'].includes(mode))leaveKitchen();else if(loaded)menuDialog();return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)&&mode==='world'){keys.add(e.key.toLowerCase());path=[];goal=null;idle=0;}if(!e.repeat&&[' ','e','E'].includes(e.key)){sound.unlock();if(mode==='world')mainAction();else if(mode==='cook'){const p=engine.s.prep;if(p?.done)carryMeal();else{const st=p&&R.RECIPES[p.dish].steps[p.step];if(st&&!['choice','decorate'].includes(st.action))doPrep();}}else if(mode==='wash')doWash();else if(mode==='scrub')cleanAction();else if(mode==='lunch')lunchAction();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{pointer=null;keys.clear();cookPointer=null;dayPointer=null;});window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{save();pointer=null;keys.clear();cookPointer=null;dayPointer=null;lastTime=0;});
function moveAlong(object,points,speed,dt){let remaining=speed*dt,moved=false;while(points.length&&remaining>0){const q=points[0],dx=q.x-object.x,dy=q.y-object.y,d=Math.hypot(dx,dy);if(d<1){points.shift();continue;}moved=true;const part=Math.min(d,remaining);object.x+=dx/d*part;object.y+=dy/d*part;if(Math.abs(dx)>1)object.facing=dx<0?-1:1;remaining-=part;if(d<=part+.01)points.shift();}return moved;}
function movePlayer(dx,dy,dt){const p=engine.s.player,len=Math.hypot(dx,dy);if(len<.08)return false;const strength=Math.min(1,len);dx=dx/len*292*dt*strength;dy=dy/len*292*dt*strength;const before={x:p.x,y:p.y};if(R.walkable(p.x+dx,p.y))p.x+=dx;if(R.walkable(p.x,p.y+dy))p.y+=dy;if(Math.abs(dx)>1)p.facing=dx<0?-1:1;return Math.hypot(p.x-before.x,p.y-before.y)>.1;}
function tickRestaurant(dt){const s=engine.s;saveClock+=dt;
 const guest=engine.paceTick(dt);if(guest){feedback('hello');updateHUD(true);save();}
 for(const c of [...s.customers]){
  if(c.phase==='arriving'||c.phase==='leaving'){
   let data=npcPaths.get(c.id);if(!data||data.phase!==c.phase){const t=R.TABLES[c.table],m=R.safePoint(t.meet);const points=c.phase==='arriving'?[...R.pathfind(c,m),{...t.seat}]:[{...m},...R.pathfind(m,R.ENTRY)];data={phase:c.phase,points};npcPaths.set(c.id,data);}
   const ox=c.x;moveAlong(c,data.points,engine.guestSpeed(c),dt);if(Math.abs(c.x-ox)>.2)npcFacing.set(c.id,c.x<ox?-1:1);
   if(!data.points.length){if(c.phase==='arriving'){engine.arrive(c.id);feedback('hello');burst(c.x,c.y-85,7,R.TABLES[c.table].colour);}else{engine.remove(c.id);npcPaths.delete(c.id);}updateHUD(true);save();}
  }else if(c.phase==='eating'){c.eat+=dt;if(c.eat>4.3+(c.id%3)*.8){engine.finishEating(c.id);feedback('hello');burst(c.x,c.y-88,14,R.TABLES[c.table].colour);save();updateHUD(true);}}
  else if(c.phase==='finished'){c.eat+=dt;if(c.eat>1.6){engine.startLeaving(c.id);save();updateHUD(true);}}
 }
 engine.updateDay();if(saveClock>2.5){saveClock=0;save();}
}
function updateWorld(dt){const s=engine.s;idle+=dt;tickRestaurant(dt);
 if(s.phase==='lunch'){openLunch();return;}if(s.completed&&!completeShown){showComplete();return;}
 playerMoving=false;let dx=0,dy=0;
 if(pointer&&pointer.moved>9){dx=pointer.dx/55;dy=pointer.dy/55;}
 if(keys.has('arrowleft')||keys.has('a'))dx=-1;if(keys.has('arrowright')||keys.has('d'))dx=1;if(keys.has('arrowup')||keys.has('w'))dy=-1;if(keys.has('arrowdown')||keys.has('s'))dy=1;
 if(dx||dy){playerMoving=movePlayer(dx,dy,dt);idle=0;}else if(path.length)playerMoving=moveAlong(s.player,path,290,dt);
 if(playerMoving)playerAnim+=dt*8;
 if(goal&&!path.length&&Math.hypot(s.player.x-goal.x,s.player.y-goal.y)<108)performGoal();if(mode!=='world')return;
 updateAutoInteraction(dt,!playerMoving&&!path.length&&!pointer&&keys.size===0);if(mode!=='world')return;updateHUD();
}
function burst(x,y,n=16,colour='#e4a8d1'){if(engine.s.settings.reduced)n=Math.min(7,n);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;particles.push({x,y,vx:Math.cos(a)*(30+Math.random()*100),vy:Math.sin(a)*80-70,life:1.2+Math.random()*.6,size:4+Math.random()*5,colour:i%3===0?'#fff0b4':i%3===1?colour:'#b9daca'});}}
function drawMeal(c,dish,variant,x,y,w,h,prep=null,deco=null){if(dish==='cupcake'&&deco&&!prep)prep={step:R.RECIPES.cupcake.steps.length,p:0,done:true,deco};c.save();c.translate(x-w/2,y-h);c.scale(w/320,h/280);A.drawFood(c,dish,variant,prep,clock);c.restore();}
function drawActor(key,x,y,h,flip=false,bounce=0,tilt=0){const im=A.images[key];if(!im)return;A.ellipse(ctx,x,y,Math.min(38,h*.29),h*.092,'#62496b24');ctx.save();ctx.translate(x,y-bounce);ctx.rotate(tilt);A.sprite(ctx,key,0,0,h*1.35,h,flip);ctx.restore();}
function drawWorld(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#baaccb';ctx.fillRect(0,0,width,height);const p=engine.s.player;const preview=mode==='customize'||mode==='loading';const sc=Math.max(width/1800,height/1100,width<600?.52:.46);view.scale=sc;const vw=width/sc,vh=height/sc,targetX=R.clamp((preview?712:p.x)-vw*.5,0,Math.max(0,1800-vw)),targetY=R.clamp((preview?600:p.y-65)-vh*.5,0,Math.max(0,1100-vh));view.x=targetX;view.y=targetY;ctx.save();ctx.scale(sc,sc);ctx.translate(-view.x,-view.y);A.drawRoomShell(ctx,engine.s.decor);A.drawStationLayer(ctx,clock);for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i];A.drawTableFurniture(ctx,t.food.x,t.food.y,engine.s.decor,t.symbol,t.colour,clock);}if(!preview){drawCleanTargets();
  if(path.length){ctx.save();ctx.strokeStyle='#fff6cfb8';ctx.lineWidth=8;ctx.setLineDash([2,24]);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);for(const q of path)ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();}
  for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i],state=engine.s.tables[i];if(state.status==='dirty')A.drawDirtyDish(ctx,t.food.x,t.food.y-15,1);if(state.status==='dirty'){ctx.save();ctx.globalAlpha=.65+.15*Math.sin(clock*3);A.ellipse(ctx,t.meet.x,t.meet.y,48,22,'#ffffff12','#d7f4f0',5);ctx.restore();}}
  if(engine.nextOrder()&&!engine.s.tray&&!engine.s.dirtyTray){ctx.save();ctx.globalAlpha=.5+.16*Math.sin(clock*3);ctx.strokeStyle='#fff0b4';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(R.KITCHEN.x,R.KITCHEN.y,71,29,0,0,Math.PI*2);ctx.stroke();ctx.restore();A.star(ctx,997,315,12,'#fff2bb',clock*.25);}
  if(engine.s.dirtyTray){ctx.save();ctx.globalAlpha=.6+.13*Math.sin(clock*3);ctx.strokeStyle='#d8f4f6';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(R.SINK.x,R.SINK.y,62,28,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  drawAutoInteractionHint();
  const actors=engine.s.customers.map(c=>({type:'guest',y:c.y,c}));actors.push({type:'player',y:p.y});actors.sort((a,b)=>a.y-b.y);for(const act of actors){if(act.type==='guest'){const c=act.c,moving=['arriving','leaving'].includes(c.phase),baby=c.type==='pink'||c.type==='blue',happy=['eating','finished'].includes(c.phase),bounce=engine.s.settings.reduced?0:moving?Math.abs(Math.sin(clock*9+c.id))*6:happy?Math.abs(Math.sin(clock*8+c.id))*5:Math.sin(clock*(1.8+c.id%3*.4)+c.id)*2.7,tilt=baby&&happy&&!engine.s.settings.reduced?Math.sin(clock*8+c.id)*.07:0;if(baby&&!moving&&!engine.s.settings.reduced){for(let f=0;f<2;f++){const k=Math.sin(clock*(4+c.id%3)+f*Math.PI)*5;A.ellipse(ctx,c.x-15+f*29,c.y-4+k,9,7,'#d29acc','#765079',2);}}drawActor(guestKey(c,moving),c.x,c.y,baby?109:130,(npcFacing.get(c.id)||1)<0,bounce,tilt);if(c.phase==='eating'){const t=R.TABLES[c.table];drawMeal(ctx,c.dish,c.variant,t.food.x,t.food.y-13,96*(1-c.eat/18),83*(1-c.eat/18),null,c.deco);A.heart(ctx,c.x+50,c.y-115-(clock%1)*12,13,t.colour);}}
   else{const celebrate=clock<joyUntil,key=celebrate?'u_happy'+Math.floor(clock*6)%3:playerMoving?'u_run'+Math.floor(playerAnim)%6:'u_idle'+(Math.floor(clock*.7)%5===0?1:0),bounce=engine.s.settings.reduced?0:playerMoving?Math.abs(Math.sin(playerAnim*Math.PI))*4:Math.sin(clock*2)*1.5;drawActor(key,p.x,p.y,134,p.facing<0,bounce);if(engine.s.tray){const t=engine.s.tray,x=p.x+p.facing*47,y=p.y-38-bounce;A.ellipse(ctx,x,y-1,43,10,'#d9c1df','#fff4e5',3);drawMeal(ctx,t.dish,t.variant,x,y,91,77,null,t.deco);}else if(engine.s.dirtyTray){const x=p.x+p.facing*45,y=p.y-31-bounce;A.drawDirtyDish(ctx,x,y,.78);}}
  }
  for(const q of particles){ctx.save();ctx.globalAlpha=R.clamp(q.life/.8,0,1);A.star(ctx,q.x,q.y,q.size,q.colour,clock*.4);ctx.restore();}
 }
 ctx.restore();hits=[];if(mode==='world'||(mode==='dialog'&&modalReturn==='world'))drawBubbles();if(pointer&&pointer.moved>9&&mode==='world'){ctx.save();ctx.globalAlpha=.6;A.ellipse(ctx,pointer.x,pointer.y,39,39,'#fff8ee22','#fff7df',2);A.ellipse(ctx,pointer.x+R.clamp(pointer.dx,-35,35),pointer.y+R.clamp(pointer.dy,-35,35),15,15,'#fff6e3a8',null);ctx.restore();}}
function drawBubbles(){for(const c of engine.s.customers){if(!['waiting','ordered'].includes(c.phase))continue;const t=R.TABLES[c.table],pt=worldToScreen(c.x,c.y),h=96,w=126;if(pt.x<-40||pt.x>width+40||pt.y<-60||pt.y>height+100)continue;let x=pt.x-w/2,y=pt.y-139*view.scale-h-9;if(y<7){x=pt.x+50*view.scale+9;y=pt.y-h-7;if(x+w>width-7)x=pt.x-50*view.scale-w-9;}x=R.clamp(x,7,width-w-7);y=R.clamp(y,7,Math.max(7,height-h-7));ctx.save();ctx.shadowColor='#36234455';ctx.shadowBlur=14;ctx.shadowOffsetY=5;A.rect(ctx,x,y,w,h,27,A.grad(ctx,y,y+h,'#fff9e8','#f2dfc4'),'#fff2c7',6);ctx.shadowBlur=0;A.rect(ctx,x+3,y+3,w-6,h-6,24,null,'#6b4b7d',2.5);A.rect(ctx,x+8,y+8,w-16,h-16,19,null,t.colour,3);A.poly(ctx,[[x+w*.44,y+h-2],[x+w*.63,y+h-2],[x+w*.53,y+h+12]],'#f2dfc4','#6b4b7d',2.5);A.star(ctx,x+w-14,y+15,6,'#ffe28b',clock*.15);A.star(ctx,x+18,y+h-15,4,'#f5a9c9',-clock*.12);drawMeal(ctx,c.dish,c.variant,x+w*.52,y+h-18,78,65);A.badge(ctx,t.symbol,x+20,y+22,15,t.colour);const vi=variantInfo(c.dish,c.variant),im=getToolImage(vi.icon);A.ellipse(ctx,x+w-24,y+h-34,19,19,A.grad(ctx,y+h-53,y+h-15,'#fff8df','#ead5ee'),'#6b4b7d',2);if(im?.complete&&im.naturalWidth)ctx.drawImage(im,x+w-39,y+h-49,30,30);ctx.restore();hits.push({x:x-8,y:y-6,w:w+16,h:h+24,table:c.table});}}
const toolImages={};function getToolImage(name){if(A.images[name])return A.images[name];if(!toolImages[name]){const im=new Image();im.src=A.toolData(name);toolImages[name]=im;}return toolImages[name];}
function drawCooking(){if(!cookCanvas||!cookContext||mode!=='cook')return;const p=engine.s.prep;if(!p)return;const c=cookContext,w=cookCanvas.width/dpr,h=cookCanvas.height/dpr,r=R.RECIPES[p.dish],st=r.steps[p.step];c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const scale=Math.min(w/340,h/300),cx=w/2,cy=h/2; c.save();c.translate(cx,cy);c.scale(scale,scale);
 if(A.images.prep_board)A.sprite(c,'prep_board',0,145,335,290);else A.rect(c,-160,-133,320,266,25,'#bc845d','#6b4264',5);
 const bump=engine.s.settings.reduced?1:1+Math.sin(cookBump*Math.PI)*.035;c.save();c.scale(bump,bump);c.translate(-160,-140);A.drawFood(c,p.dish,p.variant,p,clock);c.restore();
 const toolImg=getToolImage(st?currentStepTool(p,st):'chef');if(st&&!p.done&&['stir','rub'].includes(st.action)&&p.p>0){c.save();c.translate(55+Math.cos(clock*3)*15,5);c.rotate(Math.sin(clock*3)*.2);if(toolImg?.complete&&toolImg.naturalWidth)c.drawImage(toolImg,-25,-95,64,94);c.restore();}
 if(p.done)for(let i=0;i<7;i++){const a=i*Math.PI*2/7+clock*.25;A.star(c,Math.cos(a)*149,Math.sin(a)*109,8,['#fff0a2','#f6b4d0','#b6e4dd'][i%3],clock*.4);}c.restore();}
function drawWashing(){if(!washCanvas||!washContext||mode!=='wash')return;const c=washContext,w=washCanvas.width/dpr,h=washCanvas.height/dpr;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.save();const scale=Math.min(w/320,h/280,1.6),x=w/2-160*scale,y=h/2-140*scale;c.translate(x,y);c.scale(scale,scale);const progress=washDone?1:(engine.s.dirtyTray?.wash||0)/5;A.drawWash(c,progress,clock);c.restore();}
function animationFrame(ms){requestAnimationFrame(animationFrame);const dt=lastTime?Math.min(.04,(ms-lastTime)/1000):0;lastTime=ms;if(document.hidden||portraitBlocked)return;clock+=dt;dayPulse=Math.max(0,dayPulse-dt*2);cookBump=Math.max(0,cookBump-dt*2.7);if(mode==='world')updateWorld(dt);else if(['cook','recipes','wash'].includes(mode))tickRestaurant(dt);if(mode==='cook'&&cookPointer!==null){const p=engine.s.prep,st=p&&p.step===cookStepLock?R.RECIPES[p.dish].steps[p.step]:null;if(st?.action==='hold'&&clock-cookLast>.42){cookLast=clock;doPrep();}}
 for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=55*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0);if(toastUntil&&clock>toastUntil){$('toast').classList.remove('show');toastUntil=0;}if(loaded){if(['world','customize','loading'].includes(mode)||(mode==='dialog'&&modalReturn==='world'))drawWorld();if(mode==='customize')drawDesignerPreview();drawCooking();drawWashing();drawDayScene();}}
async function offline(){if(window.RR_STANDALONE||!('serviceWorker'in navigator)||!['http:','https:'].includes(location.protocol))return;try{const hadController=!!navigator.serviceWorker.controller;let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!refreshing){refreshing=true;save();location.reload();}});const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});registration.update().catch(()=>{});await navigator.serviceWorker.ready;offlineReady=true;}catch(_){offlineReady=false;}}
async function boot(){const current=++bootCount;mode='loading';dom.customizer.hidden=false;dom.customizer.innerHTML='<div class="custom-final"><div class="parent-copy">Setting the tables…</div></div>';$('menu').innerHTML=A.icon('settings');syncPrefs();resize();try{await A.load();if(current!==bootCount)return;loaded=true;$('brand-picture').innerHTML=imageHTML('u_idle0');if(migrated)save();showCustomizer(0);offline();}catch(err){dom.customizer.innerHTML=`<div class="custom-final"><div class="parent-copy">Artwork did not finish loading. Keep the assets folder beside index.html.</div><button class="open-button" data-action="load-retry" aria-label="Retry loading">${A.icon('retry')}</button></div>`;}}
if(window.RR_QA===true||new URLSearchParams(location.search).get('qa')==='1')window.__RR_TEST__={get engine(){return engine;},get mode(){return mode;},get view(){return {...view};},get storageOK(){return storageOK;},get offlineReady(){return offlineReady;},get migrated(){return migrated;},snapshot:()=>engine.snapshot(),save,resize,worldToScreen,showCustomizer,openRestaurant,route,updateHUD,openRecipeMenu,openCooking,openWash,drawWorld,metrics:()=>({width,height,dpr,mode,hitboxes:hits.map(x=>({...x})),audioUnlocked:sound.unlocked,pathLength:path.length,goal:goal?{...goal}:null,auto:{key:autoZoneKey,inside:autoZoneInside,dwell:autoDwell,last:autoLastTrigger}}),openLunch,openClean,cleanAction,lunchAction,tickRestaurant,returnToWorld,showComplete,autoCandidate:()=>autoCandidate(),updateAuto:(dt=.3,stopped=true)=>updateAutoInteraction(dt,stopped),setPlayer(x,y){engine.s.player.x=x;engine.s.player.y=y;path=[];goal=null;pointer=null;keys.clear();autoZoneKey=null;autoZoneInside=false;autoDwell=0;},loadFixture(raw){dom.modal.innerHTML='';engine=new R.Engine(raw);npcPaths.clear();path=[];goal=null;particles=[];hudSignature='';kitchenSignature='';selectedCleanup=null;autoZoneKey=null;autoZoneInside=false;autoDwell=0;autoLastTrigger='';completeShown=false;dayScreen.hidden=true;save();returnToWorld();}};
// v1.4: day scenes share the same characters, table art, picture controls and audio.
function nextCleanTask(){const ts=engine.cleanTargets(),p=engine.s.player;ts.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));return ts[0]||null;}
function taskPicture(t){if(t.kind==='table')return tableMarkHTML(t.table);if(t.kind==='floor')return imageHTML('mop');if(t.kind==='window')return imageHTML('room_window');return imageHTML(t.kind==='sink'?'painted_sink':'painted_kitchen');}
function dotRow(n,count){return `<span class="day-dots" aria-label="${count} of ${n}">${Array.from({length:n},(_,i)=>`<span class="${i<count?'finished':''}">${A.icon(i<count?'check':'star')}</span>`).join('')}</span>`;}
function dayHeader(pictures,back=true){return `<div class="day-heading">${back?`<button class="small-round" data-action="day-return" aria-label="Back to the restaurant">${A.icon('back')}</button>`:'<span></span>'}<div class="day-ticket">${pictures}</div><span></span></div>`;}
function prepareDayCanvas(){dayCanvas=$('day-canvas');dayContext=dayCanvas.getContext('2d');bindDayCanvas();resize();}
function openLunch(){if(engine.s.phase!=='lunch')return;stopControls();mode='lunch';dom.kitchen.hidden=true;dom.customizer.hidden=true;dom.ui.hidden=true;dayScreen.hidden=false;dayScreen.classList.add('lunch-screen');dayScreen.classList.remove('scrub-screen');cleanTask=null;renderLunch();save();updateProgress();announce('Lunch break. Choose a lunch, take three bites, then two sips. Rest as long as you like.');}
function renderLunch(){const l=engine.s.lunch,ready=l.bites>=3&&l.sips>=2;
 const pictures=`${imageHTML('u_idle0')}${imageHTML('lunch')}${l.meal?foodHTML(l.meal,R.RECIPES[l.meal].variants[0].id):A.icon('heart')}`;
 let controls='';
 if(!l.meal){controls=`<div class="lunch-choices">${R.LUNCH_MENU.map(d=>`<button class="day-choice" data-action="lunch-pick" data-meal="${d}" aria-label="Choose ${R.RECIPES[d].name} for your lunch">${foodHTML(d,R.RECIPES[d].variants[0].id)}</button>`).join('')}</div>`;}
 else if(ready){controls=`<button class="day-big" data-action="lunch-return" aria-label="Finish lunch and reopen restaurant">${A.icon('chef')}${A.icon('arrow')}</button>`;}
 else{controls=`<div class="lunch-progress">${l.bites<3?dotRow(3,l.bites):dotRow(2,l.sips)}</div><button class="day-big" data-action="lunch-act" aria-label="${l.bites<3?'Take a bite of your lunch':'Take a sip of your drink'}">${l.bites<3?foodHTML(l.meal,R.RECIPES[l.meal].variants[0].id):imageHTML('milk')}</button>`;}
 dayScreen.innerHTML=dayHeader(pictures,false)+`<div class="day-scene"><canvas id="day-canvas" tabindex="0" aria-label="Lunch break. Tap your lunch to eat, then drink."></canvas></div><div class="day-controls">${controls}</div>`;
 prepareDayCanvas();
}
function lunchAction(){if(mode!=='lunch')return;if(engine.lunchAct()){feedback('hello');dayPulse=1;save();renderLunch();}}
function openClean(id){if(engine.s.phase!=='cleaning')return;const t=engine.cleanTargets().find(q=>q.id===id);if(!t)return;stopControls();cleanTask=t;cleanDone=false;mode='scrub';dom.kitchen.hidden=true;dom.customizer.hidden=true;dom.ui.hidden=true;dayScreen.hidden=false;dayScreen.classList.remove('lunch-screen');dayScreen.classList.add('scrub-screen');dayPoint={x:260,y:220};
 dayScreen.innerHTML=dayHeader(`${taskPicture(t)}${A.icon('arrow')}${imageHTML(t.kind==='floor'?'mop':'sponge')}`)+`<div class="day-scene"><canvas id="day-canvas" tabindex="0" aria-label="${t.kind==='floor'?'Mop the floor':'Wipe the '+t.kind}. Rub anywhere, or tap the big picture button."></canvas></div><div class="day-controls" id="clean-tools"></div>`;
 updateCleanUI();prepareDayCanvas();save();announce(t.kind==='floor'?'Mop the floor. Rub or tap.':'Wipe this part of the restaurant. Rub or tap.');
}
function updateCleanUI(){if(mode!=='scrub'||!cleanTask)return;const q=engine.s.cleaning.find(q=>q.id===cleanTask.id);$('clean-tools').innerHTML=`${dotRow(cleanTask.need,q.p)}<button class="day-big" data-action="${cleanDone?'day-return':'clean-act'}" aria-label="${cleanDone?'All sparkling. Return to restaurant':cleanTask.kind==='floor'?'Mop floor':'Wipe surface'}">${cleanDone?A.icon('check'):imageHTML(cleanTask.kind==='floor'?'mop':'sponge')}</button>`;}
function cleanAction(){if(mode!=='scrub'||cleanDone||!cleanTask)return;const result=engine.cleanAct(cleanTask.id);if(!result.ok)return;dayPulse=1;feedback(result.done?'wash':'tap');save();if(result.done){cleanDone=true;dayPointer=null;burst(cleanTask.artX,cleanTask.artY,20,'#a3dfd5');announce('Sparkling clean.');}updateCleanUI();updateProgress();}
function bindDayCanvas(){
 dayCanvas.addEventListener('pointerdown',e=>{if(e.button>0||dayPointer!==null||!['lunch','scrub'].includes(mode))return;e.preventDefault();sound.unlock();dayPointer=e.pointerId;dayDistance=0;dayLast=clock;dayDidAct=false;const r=dayCanvas.getBoundingClientRect();dayPoint={x:(e.clientX-r.left)/r.width*520,y:(e.clientY-r.top)/r.height*360};dayCanvas._prev={x:e.clientX,y:e.clientY};try{dayCanvas.setPointerCapture(e.pointerId);}catch(_){};});
 dayCanvas.addEventListener('pointermove',e=>{if(e.pointerId!==dayPointer||!dayCanvas._prev)return;const q=dayCanvas._prev,r=dayCanvas.getBoundingClientRect();dayDistance+=Math.hypot(e.clientX-q.x,e.clientY-q.y);dayCanvas._prev={x:e.clientX,y:e.clientY};dayPoint={x:(e.clientX-r.left)/r.width*520,y:(e.clientY-r.top)/r.height*360};if(mode==='scrub'&&dayDistance>=32&&clock-dayLast>.12){dayDistance=0;dayLast=clock;dayDidAct=true;cleanAction();}});
 dayCanvas.addEventListener('pointerup',e=>{if(e.pointerId!==dayPointer)return;dayPointer=null;if(mode==='lunch')lunchAction();else if(!dayDidAct)cleanAction();});
 dayCanvas.addEventListener('pointercancel',()=>{dayPointer=null;});dayCanvas.addEventListener('lostpointercapture',()=>{dayPointer=null;});
 dayCanvas.addEventListener('contextmenu',e=>e.preventDefault());
}
function sceneImage(c,key,x,y,w,h){const im=A.images[key];if(!im)return;const sc=Math.min(w/im.width,h/im.height);c.drawImage(im,x+(w-im.width*sc)/2,y+(h-im.height*sc)/2,im.width*sc,im.height*sc);}
function drawCleanTargets(){const s=engine.s;if(!['cleaning','complete'].includes(s.phase))return;
 const targets=engine.cleanTargets(),tNow=engine.s.settings.reduced?0:clock;
 for(const t of R.CLEAN_TASKS){const q=s.cleaning.find(q=>q.id===t.id);if(q.p>=t.need){A.star(ctx,t.artX,t.artY-10,11,'#fff1b3',0);continue;}if(!targets.some(z=>z.id===t.id))continue;
  const bx=t.artX,by=t.kind==='floor'?t.artY:t.artY-30;
  ctx.save();ctx.globalAlpha=.7;for(let i=0;i<6;i++){A.ellipse(ctx,bx-38+(i*29)%78,by-7+(i*17)%24,8+i%3,4,'#8c6a668c',null);}ctx.restore();
  const yy=by-37-Math.sin(tNow*2+t.need)*3;A.ellipse(ctx,bx,yy,34,32,'#fff5dc','#735180',4);sceneImage(ctx,t.kind==='floor'?'mop':'sponge',bx-25,yy-25,50,50);
  A.ellipse(ctx,t.x,t.y,45,19,'#fff2c522','#ffeab5',3);
 }
}
function drawDayScene(){if(!dayCanvas||!dayContext||!['lunch','scrub'].includes(mode))return;const c=dayContext,w=dayCanvas.width/dpr,h=dayCanvas.height/dpr,s=engine.s,t=s.settings.reduced?0:clock;
 c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 // Continuous floor material is safe to repeat/crop; no cropped scene background.
 const floor=A.images['room_floor_'+s.decor.flooring];if(floor)c.drawImage(floor,0,0,w,h);
 c.fillStyle=mode==='lunch'?'#fff4cd18':'#dbccef26';c.fillRect(0,0,w,h);
 const sc=Math.min(w/520,h/360),ox=(w-520*sc)/2,oy=(h-360*sc)/2;c.save();c.translate(ox,oy);c.scale(sc,sc);
 if(mode==='lunch'){
  // A comfortable little lunch nook uses the real parent + babies from the game.
  A.rect(c,28,25,464,302,44,A.grad(c,25,327,'#a891c366','#6c507488'),'#fff0c780',3);
  const l=s.lunch,ready=l.bites>=3&&l.sips>=2;
  sceneImage(c,'room_plant',33,40,75,113);sceneImage(c,'room_plant',414,40,75,113);
  sceneImage(c,'room_sofa',139,65,242,150);
  A.sprite(c,ready||dayPulse>0?'u_happy'+Math.floor(t*4)%3:'u_idle0',260,202+(Math.sin(t*2)*2),175,164);
  const baby=ready?'4':'0';A.sprite(c,'baby_pink_'+baby,94,240+Math.sin(t*4)*3,107,117);A.sprite(c,'baby_blue_'+baby,427,240+Math.cos(t*4)*3,107,117);
  A.drawTableFurniture(c,259,240,{...s.decor,decoration:'stars'},'heart','#e98bb1',t,false);
  if(l.meal&&l.bites<3){const scale=1-l.bites*.23;drawMeal(c,l.meal,R.RECIPES[l.meal].variants[0].id,238,244,126*scale,105*scale);}
  else if(l.meal){A.ellipse(c,236,230,41,12,'#fff9ed','#d6bbd8',3);A.star(c,235,228,12,'#f1c86a',t*.3);}
  if(l.meal)sceneImage(c,'milk',314,172,44,66-l.sips*6);
  if(dayPulse>0){A.heart(c,287,126-dayPulse*17,22,'#f19cbd');for(let i=0;i<4;i++)A.star(c,193+i*39,87+(i%2)*15,6,'#ffeb9c',t*.5);}
  if(!l.meal)sceneImage(c,'lunch',210,220,95,93);
  if(ready)for(let i=0;i<7;i++)A.star(c,95+i*54,47+(i%2)*19,9,'#ffe890',t*.2);
 }else if(cleanTask){
  const task=cleanTask,q=s.cleaning.find(q=>q.id===task.id),frac=q.p/task.need;
  A.rect(c,27,27,466,303,34,A.grad(c,27,330,'#fff1d5','#e5c9b6'),'#856587',5);
  if(task.kind==='table'){A.drawTableFurniture(c,260,167,{...s.decor,decoration:'stars'},R.TABLES[task.table].symbol,R.TABLES[task.table].colour,t);}
  else if(task.kind==='window')sceneImage(c,'room_window',92,53,334,231);
  else if(task.kind==='sink')sceneImage(c,'painted_sink',116,36,287,262);
  else if(task.kind==='counter')sceneImage(c,'painted_kitchen',38,58,445,220);
  else if(floor){c.save();A.rect(c,37,37,446,282,27,null,null);c.clip();c.drawImage(floor,37,37,446,282);c.restore();}
  // Each stroke clears a stable group of crumbs/smudges. No time-based fading of
  // remaining dirt: interrupted/reloaded progress matches the visible result.
  for(let i=0;i<20;i++){if(i<frac*20)continue;const x=78+(i*71)%368,y=96+(i*59)%173;c.save();c.translate(x,y);c.rotate(i*.83);A.ellipse(c,0,0,12+(i%3)*4,8,'#8e665c8c',null);A.ellipse(c,-6,-2,5,3,'#cfa986',null);c.restore();}
  if(!cleanDone){sceneImage(c,task.kind==='floor'?'mop':'sponge',R.clamp(dayPoint.x,70,440)-48,R.clamp(dayPoint.y,65,278)-36,108,112);}
  if(dayPulse>0||cleanDone){for(let i=0;i<12;i++){const x=66+(i*59)%390,y=66+(i*71)%235;if(cleanDone)A.star(c,x,y,7+(i%3)*3,['#fff7b3','#b6ebde','#f8b9d4'][i%3],t*.4);else A.ellipse(c,dayPoint.x-33+(i*13)%71,dayPoint.y-30+(i*19)%72,6+i%3*3,6+i%3*3,'#e7f9ffbb','#b8dee7',2);}}
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
 if(portraitBlocked)save();else resize();
}
portraitQuery.addEventListener('change',syncOrientation);
// Installed browsers may grant the lock; the portrait gate also works when they cannot.
function requestLandscape(){
 if(!matchMedia('(pointer: coarse)').matches||!screen.orientation?.lock)return;
 screen.orientation.lock('landscape').catch(()=>{});
}
document.addEventListener('pointerdown',requestLandscape,{passive:true});
document.addEventListener('fullscreenchange',requestLandscape);
requestAnimationFrame(animationFrame);boot();syncOrientation();
})();
