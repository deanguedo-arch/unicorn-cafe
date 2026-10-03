/* Sneaky Unicorn — Rainbow Restaurant 1.1.0
 * Top-down service loop, pointer controls, cooking interactions, local save and audio.
 * All visible production characters and the restaurant are actual sourcepack assets.
 */
(function(){'use strict';
const R=window.RR,A=window.RRArt,$=id=>document.getElementById(id);
const dom={app:$('app'),world:$('world'),stage:$('stage'),title:$('title'),kitchen:$('kitchen-screen'),dock:$('dock'),ui:$('world-ui'),modal:$('modal-root')};
const ctx=dom.world.getContext('2d',{alpha:false});
let storageOK=true,saved=null;
try{const raw=localStorage.getItem(R.SAVE_KEY);if(raw)saved=JSON.parse(raw);}catch(_){storageOK=false;}
let engine=new R.Engine(saved),mode='loading',lastMode='world',loaded=false;
if(!saved&&window.matchMedia)engine.s.settings.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=1,height=1,dpr=1,clock=0,lastTime=0,worldTime=0,saveClock=0,spawnClock=0,idle=0;
let view={x:0,y:0,scale:1},path=[],goal=null,playerMoving=false,playerAnim=0;
let npcPaths=new Map(),npcFacing=new Map(),particles=[],hits=[],toastUntil=0,joyUntil=0;
let pointer=null,keys=new Set(),cookPointer=null,cookLast=0,cookStepLock=-1,cookDistance=0,cookPrev=null,cookBump=0,cookAngle=0;
let suppressCookClick=false;
let cookCanvas=null,cookContext=null,kitchenSignature='',hudSignature='',modalReturn='world',modalKind=null,previousFocus=null;
let offlineReady=false,saveTimer=0,loadError='',bootCount=0;
const sound={context:null,master:null,unlocked:false,
 unlock(){if(this.unlocked){if(this.context?.state==='suspended')this.context.resume().catch(()=>{});return;}try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.context=new AC();this.master=this.context.createGain();this.master.gain.value=engine.s.settings.muted?0:.08;this.master.connect(this.context.destination);this.context.resume().catch(()=>{});this.unlocked=true;}catch(_){}},
 mute(){if(this.master)this.master.gain.setTargetAtTime(engine.s.settings.muted?0:.08,this.context.currentTime,.02);},
 play(kind='tap'){if(!this.unlocked||engine.s.settings.muted)return;try{const ac=this.context,now=ac.currentTime;const notes=kind==='serve'?[523,659,784,1047]:kind==='ready'?[523,698,880]:kind==='hello'?[587,784]:kind==='pour'?[370,440]:kind==='tap'?[460+Math.random()*130]:[392,523];notes.forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f,now+i*.105);o.frequency.exponentialRampToValueAtTime(f*1.09,now+i*.105+.13);g.gain.setValueAtTime(0,now+i*.105);g.gain.linearRampToValueAtTime(.55,now+i*.105+.018);g.gain.exponentialRampToValueAtTime(.001,now+i*.105+.23);o.connect(g);g.connect(this.master);o.start(now+i*.105);o.stop(now+i*.105+.25);});}catch(_){}},
};
function imageHTML(key,cls='',alt=''){return `<img class="${cls}" src="${window.RR_ASSETS[key]||A.toolData(key)}" alt="${alt}" draggable="false">`;}
function foodHTML(dish,variant,cls=''){return `<img class="${cls}" src="${A.foodData(dish,variant)}" alt="${R.RECIPES[dish].name}" draggable="false">`;}
function variantInfo(dish,id){return R.RECIPES[dish].variants.find(x=>x.id===id)||R.RECIPES[dish].variants[0];}
function variantHTML(dish,id,cls=''){const v=variantInfo(dish,id);return `<img class="${cls}" src="${A.toolData(v.icon)}" alt="${v.name}" draggable="false">`;}
function guestKey(c,moving=false){const happy=c.phase==='eating';if(c.type==='pink'||c.type==='blue')return 'baby_'+c.type+'_'+(happy?(Math.floor(clock*2)%2?4:5):moving?1+Math.floor(clock*6+c.id)%3:0);if(c.type==='human')return happy?'h_happy':moving?'h_run'+Math.floor(clock*6)%4:'h_idle0';if(c.type==='worker')return happy?'w_5_3':'w_0_'+(moving?Math.floor(clock*5)%3:0);return happy?'m_4_5':'m_0_'+(moving?Math.floor(clock*5)%3:0);}
function save(){try{localStorage.setItem(R.SAVE_KEY,JSON.stringify(engine.snapshot()));storageOK=true;}catch(_){storageOK=false;}}
function feedback(kind='tap'){sound.play(kind);try{if(navigator.vibrate&&!engine.s.settings.reduced)navigator.vibrate(kind==='serve'?22:8);}catch(_){} }
function announce(text){$('announcer').textContent=text;}
function toast(text,seconds=2.8){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=clock+seconds;announce(text);}
function stopControls(){pointer=null;keys.clear();path=[];goal=null;cookPointer=null;playerMoving=false;}
function syncPrefs(){dom.app.classList.toggle('reduced',engine.s.settings.reduced);$('mute').innerHTML=A.icon(engine.s.settings.muted?'mute':'sound');$('mute').setAttribute('aria-label',engine.s.settings.muted?'Turn sound on':'Mute sound');sound.mute();}
function updateProgress(){const s=engine.s;$('day-progress').innerHTML=`<small>DAY ${s.day}</small>`+Array.from({length:7},(_,i)=>`<span class="meal-pip ${i<s.served?'filled':''}"></span>`).join('');$('day-progress').setAttribute('aria-label',`${s.served} of 7 meals served today`);}
function showTitle(){stopControls();mode='title';dom.title.hidden=false;dom.kitchen.hidden=true;dom.ui.hidden=true;dom.dock.hidden=true;dom.modal.innerHTML='';const s=engine.s,has=s.issued>0||s.total>0;
 dom.title.innerHTML=`<div class="welcome"><div class="welcome-copy"><span class="eyebrow">A LITTLE PLACE TO MAKE PEOPLE HAPPY</span><h1>Rainbow<br><em>Restaurant</em></h1><p>Welcome your guests. Make their favourites.<br>Bring a little magic to every table.</p><div class="welcome-strip" aria-label="Take a picture order, cook, then bring it to the table"><div class="mini-scene">${imageHTML('baby_pink_0')}${A.icon('order')}</div>${A.icon('arrow')}<div class="mini-scene">${A.icon('oven')}</div>${A.icon('arrow')}<div class="mini-scene">${imageHTML('pizza')}${A.icon('table')}</div></div><button class="welcome-play" data-action="start">${A.icon('play')}<span>${has&&!s.completed?'Keep playing':'Open restaurant'}</span></button>${has?`<button class="title-small" data-action="collection">Your recipe collection · ${s.stickers.length} / 7</button>`:''}<div class="welcome-foot">DRAG TO WALK · TAP TO COOK · NO RUSH<br>Seven dishes. Your very own restaurant. &nbsp; v${R.VERSION}</div></div><div class="welcome-art">${imageHTML('hero','hero','Sneaky Unicorn with rainbow mane and golden horn')}<div class="art-sticker">${['pizza','cupcake','burger','icecream'].map(x=>imageHTML(x)).join('')}<br>Picture orders. Handmade happiness.</div></div></div>`;
 updateProgress();syncPrefs();resize();
}
function openRestaurant(){sound.unlock();feedback('hello');dom.title.hidden=true;dom.kitchen.hidden=true;dom.modal.innerHTML='';dom.dock.hidden=false;dom.ui.hidden=false;mode='world';lastMode='world';hudSignature='';npcPaths.clear();idle=0;spawnClock=0;
 if(engine.s.completed)engine.newDay();
 if(!engine.s.customers.length&&engine.s.issued<7)engine.spawn();
 save();updateHUD(true);resize();if(engine.s.prep)openCooking();
}
function targetCustomer(){const s=engine.s;return (s.tray&&engine.customer(s.tray.orderId))||(s.prep&&engine.customer(s.prep.orderId))||engine.customer(s.active)||engine.nextOrder()||s.customers.find(c=>c.phase==='waiting')||s.customers.find(c=>c.phase==='arriving')||null;}
function primaryInfo(){const s=engine.s,p=s.player,c=targetCustomer();if(s.completed)return {label:'Open again',icon:'play',type:'new-day'};if(s.tray){const near=c&&Math.hypot(p.x-R.TABLES[c.table].meet.x,p.y-R.TABLES[c.table].meet.y)<105;return {label:near?'Serve meal':'To the table',icon:'tray',type:'table',id:c?.id,food:s.tray};}if(c?.phase==='ordered'){const near=Math.hypot(p.x-R.KITCHEN.x,p.y-R.KITCHEN.y)<100;return {label:near?'Make a meal':'To the kitchen',icon:'oven',type:'kitchen',id:c.id};}if(c&&['waiting','arriving'].includes(c.phase)){const near=Math.hypot(p.x-R.TABLES[c.table].meet.x,p.y-R.TABLES[c.table].meet.y)<105;return {label:near&&c.phase==='waiting'?'Take order':'Say hello',icon:'order',type:'table',id:c.id};}return {label:'Guests coming',icon:'heart',type:'wait'};}
function updateHUD(force=false){
 const s=engine.s,info=primaryInfo();const sig=JSON.stringify([s.customers.map(c=>[c.id,c.table,c.phase]),s.active,s.tray,s.served,info.label,s.day]);if(!force&&sig===hudSignature)return;hudSignature=sig;
 $('tables').innerHTML=R.TABLES.map((t,i)=>{const c=engine.atTable(i);return `<button class="table-card ${c?c.phase:'empty'} ${(s.tray?.orderId===c?.id||s.active===c?.id)&&c?'active':''}" data-table="${i}" aria-label="${t.name}${c?', '+R.RECIPES[c.dish].name+', '+variantInfo(c.dish,c.variant).name+', '+c.phase:', no customer'}"><span class="table-symbol">${A.icon(t.symbol)}</span>${c?`${imageHTML(guestKey(c),'guest-mini')}${['waiting','ordered'].includes(c.phase)?foodHTML(c.dish,c.variant,'dish-mini'):A.icon(c.phase==='eating'?'heart':'hand')}<span class="table-state">${A.icon(c.phase==='ordered'?'check':c.phase==='waiting'?'order':c.phase==='eating'?'heart':'arrow')}</span>${['waiting','ordered'].includes(c.phase)?variantHTML(c.dish,c.variant,'variant-mini'):''}`:A.icon('table')}</button>`;}).join('');
 $('primary').innerHTML=(info.food?foodHTML(info.food.dish,info.food.variant):A.icon(info.icon))+`<span>${info.label}</span>`;$('primary').disabled=info.type==='wait';
 const c=targetCustomer();let text='A guest is on the way',icon=A.icon('hand');
 if(s.tray&&c){text=`For the ${R.TABLES[c.table].name.toLowerCase()}`;icon=A.icon(R.TABLES[c.table].symbol);}
 else if(c?.phase==='ordered'){text='Let’s make their favourite';icon=foodHTML(c.dish,c.variant);}
 else if(c?.phase==='waiting'){text='A picture order for you';icon=A.icon('order');}
 $('goal-hint').innerHTML=icon+`<span>${text}</span>`;
 $('movement-hint').innerHTML=A.icon('hand')+`<span>${s.total<1?'Drag to walk · tap a table':'Tap a table or drag to walk'}</span>`;
 updateProgress();
}
function route(kind,id=null,auto=true){
 if(mode!=='world')return;const c=id!==null?engine.customer(id):null;
 if(kind==='kitchen'&&!engine.s.tray){if(c?.phase==='ordered')engine.selectOrder(c.id);else if(!engine.customer(engine.s.active)&&engine.nextOrder())engine.selectOrder(engine.nextOrder().id);}
 const dest=kind==='kitchen'?R.KITCHEN:kind==='table'&&c?R.TABLES[c.table].meet:null;if(!dest)return;
 path=R.pathfind(engine.s.player,dest);goal={kind,id,auto,x:dest.x,y:dest.y};idle=0;updateHUD(true);
}
function onTable(index){const c=engine.atTable(index);if(!c){toast('More friends will visit soon.');return;}if(['eating','leaving'].includes(c.phase)){toast('A happy guest!');feedback('hello');return;}
 if(c.phase==='ordered'&&!engine.s.tray){engine.selectOrder(c.id);route('kitchen',c.id);}
 else route('table',c.id);
}
function mainAction(){sound.unlock();if(mode==='world'){const info=primaryInfo();if(info.type==='new-day')showComplete();else if(info.type!=='wait')route(info.type,info.id);}}
function performGoal(){if(!goal)return;const g=goal,c=engine.customer(g.id);
 if(g.kind==='kitchen'){goal=null;if(engine.s.tray){openCarryQuestion();return;}if(engine.s.prep){openCooking();return;}const chosen=engine.customer(engine.s.active)||engine.nextOrder();if(!chosen){toast('First, say hello to a customer.');return;}engine.selectOrder(chosen.id);openRecipeMenu();return;}
 if(g.kind==='table'&&c){if(c.phase==='arriving')return;goal=null;
  if(engine.s.tray){serve(c);return;}
  if(c.phase==='waiting'){engine.takeOrder(c.id);save();feedback('hello');burst(c.x,c.y-75,12,R.TABLES[c.table].colour);toast('Let’s make '+R.RECIPES[c.dish].name.toLowerCase()+'!');updateHUD(true);}
  else if(c.phase==='ordered'){engine.selectOrder(c.id);save();updateHUD(true);}
 }else goal=null;
}
function serve(c){const result=engine.serve(c.table);if(result.ok){feedback('serve');save();joyUntil=clock+1.5;burst(R.TABLES[c.table].food.x,R.TABLES[c.table].food.y-65,30,R.TABLES[c.table].colour);toast(['Made with magic!','A very happy tummy!','You made their favourite!'][engine.s.served%3]);updateHUD(true);if(result.completed)showComplete();}
 else if(result.reason==='table'){const target=engine.customer(engine.s.tray?.orderId);toast(target?'This one goes to the '+R.TABLES[target.table].name.toLowerCase()+'.':'Let’s check the picture order.',3.5);feedback('hello');}
 else if(result.reason==='dish'||result.reason==='variant')showMismatch(c);
}
function ticketHTML(c){if(!c)return '';return `<div class="ticket"><div class="ticket-symbol">${imageHTML(guestKey(c),'customer-portrait')}<span>${A.icon(R.TABLES[c.table].symbol)}</span></div><div class="ticket-caption">PICTURE ORDER<strong>${R.TABLES[c.table].name}</strong></div>${A.icon('arrow').replace('<svg ','<svg class="arrow" ')}${foodHTML(c.dish,c.variant,'order-food')}${variantHTML(c.dish,c.variant,'order-variant')}</div>`;}
function kitchenHeader(title,kicker='THE TOY KITCHEN',retry=false){return `<div class="kitchen-bar"><button class="icon-button" data-action="leave-kitchen" aria-label="Back to the restaurant">${A.icon('back')}</button><div><span class="eyebrow">${kicker}</span><h2>${title}</h2></div>${retry?`<button class="icon-button retry-button" data-action="restart-recipe" aria-label="Start this meal again">${A.icon('retry')}</button>`:''}</div>`;}
function openRecipeMenu(){toastUntil=0;$('toast').classList.remove('show');stopControls();mode='recipes';dom.ui.hidden=true;dom.dock.hidden=true;dom.title.hidden=true;dom.kitchen.hidden=false;const c=engine.customer(engine.s.active)||engine.nextOrder();if(!c){returnToWorld();return;}engine.selectOrder(c.id);save();
 dom.kitchen.innerHTML=kitchenHeader('What shall we make?')+ticketHTML(c)+`<div class="menu-grid">${R.MENU.map(d=>{const r=R.RECIPES[d];return `<button data-recipe="${d}" class="dish-card ${d===c.dish?'requested':''}" aria-label="Make ${r.name}${d===c.dish?', requested':''}">${foodHTML(d,d===c.dish?c.variant:r.variants[0].id)}<span>${r.name}</span>${d===c.dish?`<span class="request-mark">${A.icon('star')}</span>`:''}</button>`;}).join('')}</div><div class="menu-caption">Match the picture. Every meal is made by you.</div>`;resize();announce('Choose a dish. The picture order is '+R.RECIPES[c.dish].name+' with '+variantInfo(c.dish,c.variant).name+'.');
}
function startRecipe(dish){const c=engine.customer(engine.s.active);if(!c||!engine.startRecipe(c.id,dish))return;feedback('tap');save();openCooking();}
function openCooking(){toastUntil=0;$('toast').classList.remove('show');stopControls();mode='cook';dom.ui.hidden=true;dom.dock.hidden=true;dom.title.hidden=true;dom.kitchen.hidden=false;kitchenSignature='';const p=engine.s.prep;if(!p){openRecipeMenu();return;}const c=engine.customer(p.orderId);engine.s.active=p.orderId;
 dom.kitchen.innerHTML=kitchenHeader(R.RECIPES[p.dish].name,'MAKE IT YOURSELF',true)+ticketHTML(c)+`<div class="cooking-body"><div class="work-area"><canvas id="work-canvas" aria-label="Food preparation area. Tap or drag to prepare the food." tabindex="0"></canvas><div id="step-label" class="step-label"></div><div id="gesture-cue" class="gesture-cue">${A.icon('hand')}</div></div><div id="step-dots" class="step-dots"></div><div id="cook-tools" class="cook-tools"></div></div>`;
 cookCanvas=$('work-canvas');cookContext=cookCanvas.getContext('2d');bindCookCanvas();updateCookUI(true);resize();save();
}
function updateCookUI(force=false){const p=engine.s.prep;if(!p||mode!=='cook')return;const r=R.RECIPES[p.dish],st=r.steps[p.step],sig=[p.dish,p.step,p.p,p.variant,p.done].join('|');if(!force&&sig===kitchenSignature)return;kitchenSignature=sig;
 $('step-label').innerHTML=p.done?`${A.icon('check')}<span>Made by you!</span>`:`<span class="step-number">${p.step+1}</span><span>${st.label}</span>`;
 $('step-dots').innerHTML=r.steps.map((s,i)=>`<span class="step-dot ${i<p.step?'finished':i===p.step?'current':''}">${i<p.step?A.icon('check'):s.action==='choice'?A.icon('star'):`<img src="${A.toolData(s.tool)}" alt="">`}</span>`).join('');
 const tools=$('cook-tools');
 if(p.done){tools.innerHTML=`<button class="carry-button" data-action="carry">${A.icon('tray')}<span>Carry to the table</span></button>`;}
 else if(st.action==='choice'){const customer=engine.customer(p.orderId);tools.innerHTML=r.variants.map(v=>`<button class="choice-button ${customer?.dish===p.dish&&customer.variant===v.id?'hint':''}" data-variant="${v.id}" aria-label="Choose ${v.name}"><img src="${A.toolData(v.icon)}" alt=""><span>${v.name}</span></button>`).join('');}
 else{tools.innerHTML=`<button id="prep-action" data-action="prep" aria-label="${st.label}. Tap, or hold for pouring and cooking."><img src="${A.toolData(st.tool)}" alt=""><span class="button-label">${st.label}<span class="progress-beads">${Array.from({length:st.need},(_,i)=>`<i class="${i<p.p?'lit':''}"></i>`).join('')}</span></span></button>`;const btn=$('prep-action');btn.addEventListener('pointerdown',cookDown);btn.addEventListener('pointermove',cookMove);btn.addEventListener('pointerup',cookUp);btn.addEventListener('pointercancel',cookUp);}
 $('gesture-cue').hidden=p.done||st?.action==='choice';
 if(force||p.p===0)announce(p.done?'Meal ready. Carry it to the table.':st.label);
}
function doPrep(variant){if(mode!=='cook')return;const old=engine.s.prep?.step,result=engine.act(variant);if(!result.ok)return;cookBump=1;feedback(result.done?'ready':'tap');save();if(result.advanced){cookPointer=null;cookStepLock=-1;idle=0;}updateCookUI();if(result.done)announce('Your meal is ready to carry.');}
function cookDown(e){if(mode!=='cook'||e.button>0)return;const p=engine.s.prep,st=p&&R.RECIPES[p.dish].steps[p.step];if(!p||p.done||st.action==='choice'||cookPointer!==null)return;e.preventDefault();suppressCookClick=true;sound.unlock();cookPointer=e.pointerId;cookStepLock=p.step;cookPrev={x:e.clientX,y:e.clientY};cookDistance=0;cookLast=clock;
 // Capture on the stable kitchen pane, not the button that updates after a tap.
 try{dom.kitchen.setPointerCapture(e.pointerId);}catch(_){}doPrep();}
function cookMove(e){if(cookPointer!==e.pointerId||mode!=='cook'||!engine.s.prep||engine.s.prep.step!==cookStepLock)return;const dx=e.clientX-cookPrev.x,dy=e.clientY-cookPrev.y;cookDistance+=Math.hypot(dx,dy);cookPrev={x:e.clientX,y:e.clientY};cookAngle=Math.atan2(e.clientY-window.innerHeight/2,e.clientX-window.innerWidth/2);if(cookDistance>36&&clock-cookLast>.13){cookDistance=0;cookLast=clock;doPrep();}}
function cookUp(e){if(cookPointer===e.pointerId){cookPointer=null;cookStepLock=-1;cookPrev=null;}try{if(dom.kitchen.hasPointerCapture(e.pointerId))dom.kitchen.releasePointerCapture(e.pointerId);}catch(_){} }
function bindCookCanvas(){cookCanvas.addEventListener('pointerdown',cookDown);cookCanvas.addEventListener('pointermove',cookMove);cookCanvas.addEventListener('pointerup',cookUp);cookCanvas.addEventListener('pointercancel',cookUp);}
// A preparation tap must never click the replacement choice/carry control on release.
// A fresh pointer-down clears this guard, so the child's next deliberate tap still works.
dom.kitchen.addEventListener('pointerdown',()=>{suppressCookClick=false;},true);
dom.kitchen.addEventListener('click',e=>{if(suppressCookClick&&e.detail!==0){suppressCookClick=false;e.preventDefault();e.stopPropagation();}},true);
// Capture remains on the stable pane while the preparation button is redrawn.
dom.kitchen.addEventListener('pointermove',cookMove);dom.kitchen.addEventListener('pointerup',cookUp);dom.kitchen.addEventListener('pointercancel',cookUp);
function returnToWorld(){stopControls();mode='world';lastMode='world';dom.kitchen.hidden=true;dom.ui.hidden=false;dom.dock.hidden=false;dom.title.hidden=true;cookCanvas=null;cookContext=null;save();updateHUD(true);resize();}
function carryMeal(){if(!engine.packMeal())return;feedback('ready');save();returnToWorld();toast('Carry it to the matching table.');}
function leaveKitchen(){if(engine.s.prep){showDialog('Keep your cooking?',`<p>Your food can wait right here.</p><div class="dialog-buttons"><button class="wide good" data-action="resume">${A.icon('spoon')}Keep cooking</button><button class="wide" data-action="pause-cooking">${A.icon('table')}Visit the restaurant</button></div>`,'pause-cooking');}else returnToWorld();}
function showDialog(title,body,kind='menu'){previousFocus=document.activeElement;modalReturn=mode;modalKind=kind;stopControls();mode='dialog';dom.modal.innerHTML=`<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2>${body}</section></div>`;const focus=dom.modal.querySelector('button');if(focus)focus.focus({preventScroll:true});}
function closeDialog(){dom.modal.innerHTML='';mode=modalReturn;modalKind=null;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});if(mode==='world')updateHUD(true);}
function menuDialog(){if(!loaded)return;if(mode==='dialog'){closeDialog();return;}showDialog('A little breather',`<div class="dialog-buttons"><button class="wide good" data-action="resume">${A.icon('play')}Keep playing</button><button class="wide" data-action="toggle-audio">${A.icon(engine.s.settings.muted?'mute':'sound')}${engine.s.settings.muted?'Sound off':'Sound on'}</button><button class="wide" data-action="toggle-motion">${A.icon('star')}${engine.s.settings.reduced?'Gentle motion on':'Gentle motion off'}</button><button class="wide" data-action="collection">${A.icon('order')}Recipe collection</button><button class="wide" data-action="title">${A.icon('home')}Save & home</button><button class="quiet" data-action="reset-question">Grown-ups: start fresh</button></div><p class="tiny">${storageOK?'Saved on this device only.':'Saving is unavailable in this browser session.'} ${offlineReady?'Ready to play offline.':'Offline works after the hosted app finishes caching.'}<br>v${R.VERSION} · No ads, accounts or purchases.</p>`,'menu');}
function showMismatch(c){const t=engine.s.tray;showDialog('Let’s check the picture',`${imageHTML(guestKey(c),'dialog-portrait')}<p>They were dreaming of this one.<br>Their table is still yours.</p><div class="meal-compare"><div><span>YOUR MEAL</span>${foodHTML(t.dish,t.variant)}${variantHTML(t.dish,t.variant,'mini-flavour')}</div>${A.icon('arrow')}<div><span>THEIR WISH</span>${foodHTML(c.dish,c.variant)}${variantHTML(c.dish,c.variant,'mini-flavour')}</div></div><div class="dialog-buttons"><button class="wide good" data-action="fix-meal">${A.icon('oven')}Let’s make that one</button><button class="wide" data-action="resume">${A.icon('tray')}Keep carrying</button></div>`,'mismatch');}
function openCarryQuestion(){showDialog('A meal on your tray',`<p>Your customer is ready when you are.</p>${foodHTML(engine.s.tray.dish,engine.s.tray.variant,'dialog-portrait')}<div class="dialog-buttons"><button class="wide good" data-action="resume">${A.icon('tray')}Keep this meal</button><button class="wide" data-action="fix-meal">${A.icon('retry')}Make it again</button></div>`,'carry-question');}
function showCollection(){const from=mode==='dialog'?modalReturn:mode;if(mode==='dialog')closeDialog();showDialog('Your recipe collection',`<p>A little souvenir from every kind of meal you’ve served.</p><div class="collection">${R.MENU.map(d=>`<img style="opacity:${engine.s.stickers.includes(d)?1:.2}" src="${A.foodData(d,R.RECIPES[d].variants[0].id)}" alt="${R.RECIPES[d].name}${engine.s.stickers.includes(d)?', collected':', not yet served'}">`).join('')}</div><p>${engine.s.stickers.length} of 7 recipes · ${engine.s.total} happy meals</p><div class="dialog-buttons"><button class="wide good" data-action="resume">${A.icon('back')}Back to playing</button></div>`,'collection');modalReturn=from;}
function showComplete(){showDialog('A whole day of happy guests!',`${imageHTML('u_happy1','dialog-portrait')}<p>Seven meals made and delivered by you.<br>Your restaurant is full of magic.</p><div class="collection">${R.MENU.map(d=>foodHTML(d,R.RECIPES[d].variants[0].id)).join('')}</div><div class="dialog-buttons"><button class="wide good" data-action="new-day">${A.icon('play')}Open again</button><button class="wide" data-action="title">${A.icon('home')}Save & home</button></div>`,'complete');save();}
function resetQuestion(){if(mode==='dialog')closeDialog();showDialog('Start completely fresh?',`<p>This clears only this restaurant’s saved meals and recipe collection on this browser. It does not touch the adventure game.</p><div class="dialog-buttons"><button class="wide good" data-action="resume">${A.icon('back')}Keep our progress</button><button class="wide" data-action="reset-confirm">${A.icon('retry')}Yes, start fresh</button></div>`,'reset');}
function handleAction(action,e){sound.unlock();switch(action){
 case 'start':openRestaurant();break;
 case 'load-retry':boot();break;
 case 'leave-kitchen':leaveKitchen();break;
 case 'restart-recipe':showDialog('Mix it again?',`<p>Your picture order will stay safe.</p><div class="dialog-buttons"><button class="wide good" data-action="resume">${A.icon('spoon')}Keep cooking</button><button class="wide" data-action="restart-confirm">${A.icon('retry')}Start this meal again</button></div>`,'restart');break;
 case 'restart-confirm':closeDialog();engine.restartPrep();save();openCooking();break;
 case 'prep':if(e.detail===0)doPrep();break;
 case 'carry':carryMeal();break;
 case 'resume':closeDialog();break;
 case 'pause-cooking':closeDialog();returnToWorld();break;
 case 'fix-meal':closeDialog();engine.remake();save();returnToWorld();route('kitchen',engine.s.active);break;
 case 'toggle-audio':engine.s.settings.muted=!engine.s.settings.muted;save();syncPrefs();closeDialog();menuDialog();break;
 case 'toggle-motion':engine.s.settings.reduced=!engine.s.settings.reduced;save();syncPrefs();closeDialog();menuDialog();break;
 case 'collection':showCollection();break;
 case 'title':save();dom.modal.innerHTML='';showTitle();break;
 case 'new-day':engine.newDay();npcPaths.clear();particles=[];save();openRestaurant();break;
 case 'reset-question':resetQuestion();break;
 case 'reset-confirm':engine.reset();npcPaths.clear();particles=[];save();syncPrefs();showTitle();break;
}}
dom.app.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.disabled)return;idle=0;if(button.dataset.action)handleAction(button.dataset.action,e);else if(button.dataset.table!==undefined&&mode==='world')onTable(Number(button.dataset.table));else if(button.dataset.recipe&&mode==='recipes')startRecipe(button.dataset.recipe);else if(button.dataset.variant&&mode==='cook')doPrep(button.dataset.variant);});
$('primary').addEventListener('click',mainAction);
$('kitchen-nav').addEventListener('click',()=>{sound.unlock();route('kitchen',engine.s.active);});
$('mute').addEventListener('click',()=>{sound.unlock();engine.s.settings.muted=!engine.s.settings.muted;syncPrefs();save();if(!engine.s.settings.muted)feedback('tap');});
$('menu').addEventListener('click',menuDialog);
function resize(){const r=dom.stage.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);if(dom.world.width!==Math.round(width*dpr)||dom.world.height!==Math.round(height*dpr)){dom.world.width=Math.round(width*dpr);dom.world.height=Math.round(height*dpr);}
 if(cookCanvas){const cr=cookCanvas.getBoundingClientRect();const w=Math.max(1,Math.round(cr.width*dpr)),h=Math.max(1,Math.round(cr.height*dpr));if(cookCanvas.width!==w||cookCanvas.height!==h){cookCanvas.width=w;cookCanvas.height=h;}}
}
window.addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(dom.stage);
function screenToWorld(x,y){return {x:x/view.scale+view.x,y:y/view.scale+view.y};}
function worldToScreen(x,y){return {x:(x-view.x)*view.scale,y:(y-view.y)*view.scale};}
function canvasPosition(e){const r=dom.world.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
dom.world.addEventListener('pointerdown',e=>{if(mode!=='world'||e.button>0||pointer)return;e.preventDefault();sound.unlock();const p=canvasPosition(e);pointer={id:e.pointerId,x:p.x,y:p.y,dx:0,dy:0,moved:0};path=[];goal=null;idle=0;try{dom.world.setPointerCapture(e.pointerId);}catch(_){} });
dom.world.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=canvasPosition(e);pointer.dx=p.x-pointer.x;pointer.dy=p.y-pointer.y;pointer.moved=Math.max(pointer.moved,Math.hypot(pointer.dx,pointer.dy));idle=0;});
function endPointer(e,cancel=false){if(!pointer||pointer.id!==e.pointerId)return;const tap=pointer.moved<9,p=canvasPosition(e);pointer=null;try{if(dom.world.hasPointerCapture(e.pointerId))dom.world.releasePointerCapture(e.pointerId);}catch(_){}if(tap&&!cancel&&mode==='world')worldTap(p.x,p.y);}
dom.world.addEventListener('pointerup',e=>endPointer(e));dom.world.addEventListener('pointercancel',e=>endPointer(e,true));dom.world.addEventListener('lostpointercapture',e=>{if(pointer?.id===e.pointerId)pointer=null;});
dom.world.addEventListener('contextmenu',e=>e.preventDefault());
function worldTap(x,y){for(let i=hits.length-1;i>=0;i--){const h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){onTable(h.table);return;}}
 const p=screenToWorld(x,y);if(p.x>790&&p.x<1280&&p.y<365){route('kitchen',engine.s.active);return;}
 for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i];if(Math.hypot(p.x-t.food.x,p.y-t.food.y)<145||Math.hypot(p.x-t.seat.x,p.y-t.seat.y)<125){onTable(i);return;}}
 if(R.walkable(p.x,p.y)){path=R.pathfind(engine.s.player,p);goal=null;}
}
window.addEventListener('keydown',e=>{if(e.key===' '&&document.activeElement?.tagName==='BUTTON')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='Tab'&&mode==='dialog'){const buttons=[...dom.modal.querySelectorAll('button')];if(buttons.length){const index=buttons.indexOf(document.activeElement);const next=e.shiftKey?(index<=0?buttons.length-1:index-1):(index+1)%buttons.length;e.preventDefault();buttons[next].focus();}return;}
 if(e.key==='Escape'){if(mode==='dialog')closeDialog();else if(mode==='cook'||mode==='recipes')leaveKitchen();else if(loaded)menuDialog();return;}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)&&mode==='world'){keys.add(e.key.toLowerCase());path=[];goal=null;idle=0;}
 if(!e.repeat&&[' ','e','E'].includes(e.key)){sound.unlock();if(mode==='world')mainAction();else if(mode==='cook'){const p=engine.s.prep;if(p?.done)carryMeal();else if(R.RECIPES[p.dish].steps[p.step].action!=='choice')doPrep();}}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{pointer=null;keys.clear();cookPointer=null;});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{save();pointer=null;keys.clear();cookPointer=null;lastTime=0;});
function moveAlong(object,points,speed,dt){let remaining=speed*dt,moved=false;while(points.length&&remaining>0){const q=points[0],dx=q.x-object.x,dy=q.y-object.y,d=Math.hypot(dx,dy);if(d<1){points.shift();continue;}moved=true;const part=Math.min(d,remaining);object.x+=dx/d*part;object.y+=dy/d*part;if(Math.abs(dx)>1)object.facing=dx<0?-1:1;remaining-=part;if(d<=part+.01)points.shift();}return moved;}
function movePlayer(dx,dy,dt){const p=engine.s.player,len=Math.hypot(dx,dy);if(len<.08)return false;const strength=Math.min(1,len);dx=dx/len*292*dt*strength;dy=dy/len*292*dt*strength;const before={x:p.x,y:p.y};if(R.walkable(p.x+dx,p.y))p.x+=dx;if(R.walkable(p.x,p.y+dy))p.y+=dy;if(Math.abs(dx)>1)p.facing=dx<0?-1:1;return Math.hypot(p.x-before.x,p.y-before.y)>.1;}
function updateWorld(dt){const s=engine.s;worldTime+=dt;saveClock+=dt;spawnClock+=dt;idle+=dt;
 const desired=s.served<1?1:s.served<3?2:3;
 if(spawnClock>1.8&&s.customers.length<desired&&s.issued<7){if(engine.spawn()){spawnClock=0;feedback('hello');updateHUD(true);save();}}
 playerMoving=false;let dx=0,dy=0;if(pointer&&pointer.moved>9){dx=pointer.dx/55;dy=pointer.dy/55;}if(keys.has('arrowleft')||keys.has('a'))dx=-1;if(keys.has('arrowright')||keys.has('d'))dx=1;if(keys.has('arrowup')||keys.has('w'))dy=-1;if(keys.has('arrowdown')||keys.has('s'))dy=1;
 if(dx||dy){playerMoving=movePlayer(dx,dy,dt);idle=0;}
 else if(path.length){playerMoving=moveAlong(s.player,path,290,dt);}
 if(playerMoving)playerAnim+=dt*8;
 if(goal&&!path.length&&Math.hypot(s.player.x-goal.x,s.player.y-goal.y)<105)performGoal();
 if(mode!=='world')return;
 for(const c of [...s.customers]){
  if(c.phase==='arriving'||c.phase==='leaving'){
   let data=npcPaths.get(c.id);if(!data||data.phase!==c.phase){const t=R.TABLES[c.table];let points=c.phase==='arriving'?[...R.pathfind(c,t.meet),{...t.seat}]:[{...t.meet},...R.pathfind(t.meet,R.ENTRY)];data={phase:c.phase,points};npcPaths.set(c.id,data);}
   const oldX=c.x;moveAlong(c,data.points,177,dt);if(Math.abs(c.x-oldX)>.2)npcFacing.set(c.id,c.x<oldX?-1:1);
   if(!data.points.length){if(c.phase==='arriving'){engine.arrive(c.id);feedback('hello');burst(c.x,c.y-85,7,R.TABLES[c.table].colour);}else engine.remove(c.id);npcPaths.delete(c.id);updateHUD(true);save();}
  }else if(c.phase==='eating'){c.eat+=dt;if(c.eat>4.4){engine.leave(c.id);updateHUD(true);save();}}
 }
 if(saveClock>2.5){saveClock=0;save();}
 updateHUD();$('movement-hint').style.opacity=s.total>0&&idle<8?'.18':'.95';
}
function burst(x,y,n=16,colour='#e4a8d1'){if(engine.s.settings.reduced)n=Math.min(7,n);for(let i=0;i<n;i++){const a=i*Math.PI*2/n;particles.push({x,y,vx:Math.cos(a)*(30+Math.random()*100),vy:Math.sin(a)*80-70,life:1.2+Math.random()*.6,max:1.8,size:4+Math.random()*5,colour:i%3===0?'#fff0b4':i%3===1?colour:'#b9daca'});}}
function drawMeal(c,dish,variant,x,y,w,h){c.save();c.translate(x-w/2,y-h);c.scale(w/320,h/280);A.drawFood(c,dish,variant,null,clock);c.restore();}
function drawActor(key,x,y,h,flip=false,bounce=0){const im=A.images[key];if(!im)return;A.ellipse(ctx,x,y,Math.min(38,h*.29),h*.092,'#62496b24');A.sprite(ctx,key,x,y-bounce,h*1.35,h,flip);}
function drawWorld(){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#baaccb';ctx.fillRect(0,0,width,height);
 const p=engine.s.player;const sc=Math.max(width/1800,height/1100,width<600?.52:.46);view.scale=sc;
 const vw=width/sc,vh=height/sc;
 const targetX=R.clamp((mode==='title'||mode==='loading'?900:p.x)-vw*.5,0,Math.max(0,1800-vw));
 const targetY=R.clamp((mode==='title'||mode==='loading'?550:p.y-65)-vh*.5,0,Math.max(0,1100-vh));
 view.x=targetX;view.y=targetY;
 ctx.save();ctx.scale(sc,sc);ctx.translate(-view.x,-view.y);
 if(A.images.restaurant)ctx.drawImage(A.images.restaurant,0,0,1800,1100);
 if(mode!=='title'&&mode!=='loading'){
  // A readable route leads around the furniture; the avatar never teleports.
  if(path.length){ctx.save();ctx.strokeStyle='#fff6cfb8';ctx.lineWidth=8;ctx.setLineDash([2,24]);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);for(const q of path)ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();}
  for(let i=0;i<R.TABLES.length;i++){const t=R.TABLES[i],c=engine.atTable(i);A.badge(ctx,t.symbol,t.food.x-84,t.food.y+23,22,t.colour);if(c&&['waiting','ordered'].includes(c.phase)){ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle=c.id===engine.s.active||c.id===engine.s.tray?.orderId?'#fff0bc':t.colour;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(t.meet.x,t.meet.y,45+(engine.s.settings.reduced?0:Math.sin(clock*3)*4),20,0,0,Math.PI*2);ctx.stroke();ctx.restore();}}
  if(engine.nextOrder()&&!engine.s.tray){ctx.save();ctx.globalAlpha=.52+.16*Math.sin(clock*3);ctx.strokeStyle='#fff0b4';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(R.KITCHEN.x,R.KITCHEN.y,71,29,0,0,Math.PI*2);ctx.stroke();ctx.restore();A.star(ctx,997,315,12,'#fff2bb',clock*.25);}
  const actors=engine.s.customers.map(c=>({type:'guest',y:c.y,c}));actors.push({type:'player',y:p.y});actors.sort((a,b)=>a.y-b.y);
  for(const act of actors){
   if(act.type==='guest'){const c=act.c,moving=['arriving','leaving'].includes(c.phase),bounce=engine.s.settings.reduced?0:moving?Math.abs(Math.sin(clock*9+c.id))*6:c.phase==='eating'?Math.abs(Math.sin(clock*6))*4:Math.sin(clock*2+c.id)*1.3;
    drawActor(guestKey(c,moving),c.x,c.y,c.type==='pink'||c.type==='blue'?109:130,(npcFacing.get(c.id)||1)<0,bounce);
    if(c.phase==='eating'){const t=R.TABLES[c.table];drawMeal(ctx,c.dish,c.variant,t.food.x,t.food.y,94*(1-c.eat/11),82*(1-c.eat/11));A.heart(ctx,c.x+54,c.y-116-(clock%1)*12,13,t.colour);}
   }else{
    const celebrate=clock<joyUntil;const key=celebrate?'u_happy'+Math.floor(clock*6)%3:playerMoving?'u_run'+Math.floor(playerAnim)%6:'u_idle'+(Math.floor(clock*.7)%5===0?1:0);
    const bounce=engine.s.settings.reduced?0:playerMoving?Math.abs(Math.sin(playerAnim*Math.PI))*4:Math.sin(clock*2)*1.5;
    drawActor(key,p.x,p.y,134,p.facing<0,bounce);
    if(engine.s.tray){const t=engine.s.tray,x=p.x+p.facing*46,y=p.y-37-bounce;A.ellipse(ctx,x,y-1,43,10,'#d9c1df', '#fff4e5',3);drawMeal(ctx,t.dish,t.variant,x,y,91,77);}
   }
  }
  for(const q of particles){ctx.save();ctx.globalAlpha=R.clamp(q.life/.8,0,1);A.star(ctx,q.x,q.y,q.size,q.colour,clock*.4);ctx.restore();}
 }
 ctx.restore();hits=[];
 if(mode==='world'||(mode==='dialog'&&modalReturn==='world'))drawBubbles();
 if(pointer&&pointer.moved>9&&mode==='world'){ctx.save();ctx.globalAlpha=.6;A.ellipse(ctx,pointer.x,pointer.y,39,39,'#fff8ee22','#fff7df',2);A.ellipse(ctx,pointer.x+R.clamp(pointer.dx,-35,35),pointer.y+R.clamp(pointer.dy,-35,35),15,15,'#fff6e3a8',null);ctx.restore();}
}
function drawBubbles(){for(const c of engine.s.customers){if(!['waiting','ordered'].includes(c.phase))continue;const t=R.TABLES[c.table],pt=worldToScreen(c.x,c.y),h=height<320?82:96,w=height<320?107:119;
 if(pt.x< -40||pt.x>width+40||pt.y< -60||pt.y>height+95)continue;
 let x=pt.x-w/2,y=pt.y-139*view.scale-h-10;
 if(y<8){x=pt.x+50*view.scale+10;y=pt.y-h-7;if(x+w>width-7)x=pt.x-50*view.scale-w-10;}
 x=R.clamp(x,7,width-w-7);y=R.clamp(y,8,Math.max(8,height-h-7));
 // Keep side-positioned order cards clear of the two navigation controls.
 if(y<77&&(x<95||x+w>width-245))y=78;
 ctx.save();ctx.shadowColor='#3f285a30';ctx.shadowBlur=13;ctx.shadowOffsetY=3;A.rect(ctx,x,y,w,h,23,'#fff9ed',t.colour,3);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 A.poly(ctx,[[x+w*.46,y+h-1],[x+w*.61,y+h-1],[x+w*.53,y+h+9]],'#fff9ed',t.colour,2);
 drawMeal(ctx,c.dish,c.variant,x+w*.47,y+h-17,73,62);
 A.badge(ctx,t.symbol,x+16,y+14,13,t.colour);
 const vi=variantInfo(c.dish,c.variant),img=getToolImage(vi.icon);A.ellipse(ctx,x+w-24,y+h-35,18,18,'#f6e9ef','#d9c5e1',2);if(img?.complete&&img.naturalWidth)ctx.drawImage(img,x+w-39,y+h-50,30,30);
 ctx.fillStyle='#95779a';ctx.textAlign='center';ctx.font='800 10px "Trebuchet MS",sans-serif';ctx.fillText(c.phase==='waiting'?'HELLO!':'MY ORDER',x+w/2,y+h-7);
 if(c.phase==='waiting'){A.heart(ctx,x+w-14,y+18,8,t.colour);}
 ctx.restore();hits.push({x:x-7,y:y-5,w:w+14,h:h+20,table:c.table});
}}
const toolImages={};function getToolImage(name){if(A.images[name])return A.images[name];if(!toolImages[name]){const im=new Image();im.src=A.toolData(name);toolImages[name]=im;}return toolImages[name];}
function drawCooking(){if(!cookCanvas||!cookContext||mode!=='cook')return;const p=engine.s.prep;if(!p)return;const c=cookContext,w=cookCanvas.width/dpr,h=cookCanvas.height/dpr;const r=R.RECIPES[p.dish],st=r.steps[p.step];
 c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 // A warm, rounded physical worktop, with distinct before/after food states.
 const scale=Math.min(w/420,Math.max(.36,(h-34)/300),1.5),cx=w/2,cy=(h+26)/2;
 c.save();c.translate(cx,cy);c.scale(scale,scale);A.ellipse(c,0,116,175,28,'#71826917');
 A.rect(c,-184,-132,368,265,38,A.grad(c,-120,120,'#e9d0ae','#d8bda1'),'#b69e8b',3);A.rect(c,-173,-121,346,242,30,'#f0dfc1','#f7edcf',2);
 for(let i=0;i<7;i++){c.save();c.globalAlpha=.16;A.line(c,[[-142,-92+i*32],[145,-89+i*32]],'#b5977d',1);c.restore();}
 const hot=st&&['oven','stove'].includes(st.tool);if(hot){A.rect(c,-166,-118,332,245,30,'#9c91b4','#726587',5);A.rect(c,-154,-106,308,209,23,'#67617b','#c4b6d2',4);A.rect(c,-145,-97,290,182,18,A.grad(c,-90,90,'#ffdb9366','#eea268aa'),null);for(let i=0;i<st.need;i++)A.ellipse(c,-55+i*27,114,6,6,i<p.p?'#ffeac0':'#655b79');}
 const bump=engine.s.settings.reduced?1:1+Math.sin(cookBump*Math.PI)*.035;c.save();c.scale(bump,bump);c.translate(-160,-143);A.drawFood(c,p.dish,p.variant,p,clock);c.restore();
 if(st&&!p.done&&['stir','rub'].includes(st.action)&&p.p>0){c.save();c.translate(48+Math.cos(clock*3)*18,8);c.rotate(st.action==='stir'?Math.sin(clock*3)*.3:-.5);const tool=getToolImage(st.tool);if(tool?.complete&&tool.naturalWidth)c.drawImage(tool,-23,-99,67,99);c.restore();}
 if(p.done){for(let i=0;i<6;i++){const a=i*Math.PI/3+clock*.25;A.star(c,Math.cos(a)*154,Math.sin(a)*99-8,7+(i%2)*4,['#d4a4ca','#f4cf76','#afd0bc'][i%3],clock*.5);}}
 c.restore();
}
function animationFrame(ms){requestAnimationFrame(animationFrame);const dt=lastTime?Math.min(.04,(ms-lastTime)/1000):0;lastTime=ms;if(document.hidden)return;clock+=dt;cookBump=Math.max(0,cookBump-dt*2.7);if(mode==='world')updateWorld(dt);
 if(mode==='cook'&&cookPointer!==null){const p=engine.s.prep,st=p&&R.RECIPES[p.dish].steps[p.step];if(p&&p.step===cookStepLock&&st?.action==='hold'&&clock-cookLast>.4){cookLast=clock;doPrep();}}
 for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=55*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0);
 if(toastUntil&&clock>toastUntil){$('toast').classList.remove('show');toastUntil=0;}
 if(loaded){drawWorld();drawCooking();}
}
async function offline(){if(window.RR_STANDALONE||!('serviceWorker'in navigator)||!['http:','https:'].includes(location.protocol))return;try{await navigator.serviceWorker.register('./sw.js',{scope:'./'});await navigator.serviceWorker.ready;offlineReady=true;}catch(_){offlineReady=false;}}
async function boot(){const current=++bootCount;mode='loading';dom.title.hidden=false;dom.title.innerHTML='<div class="welcome"><div class="loading"><span class="loading-dot"></span><strong>Setting the tables…</strong><small>Bringing your unicorn friends in.</small></div></div>';$('menu').innerHTML=A.icon('pause');syncPrefs();resize();try{await A.load();if(current!==bootCount)return;loaded=true;$('brand-picture').innerHTML=imageHTML('u_idle0');$('kitchen-nav').innerHTML=A.icon('oven')+'<span>Kitchen</span>';showTitle();offline();}catch(err){loadError=String(err.message||err);dom.title.innerHTML=`<div class="welcome"><div class="welcome-copy"><h2>The artwork didn’t finish loading.</h2><p>Nothing was lost. Keep the assets folder beside index.html, then try again.</p><p class="error-message" id="load-details"></p><button class="welcome-play" data-action="load-retry">Try loading again</button></div></div>`;$('load-details').textContent=loadError;}}
if(window.RR_QA===true||new URLSearchParams(location.search).get('qa')==='1'){
 // Explicit opt-in local QA hooks. Absent from normal play; not a network interface.
 window.__RR_TEST__={get engine(){return engine;},get mode(){return mode;},get view(){return {...view};},get goal(){return goal?{...goal}:null;},get path(){return path.map(x=>({...x}));},get assetsLoaded(){return loaded;},get storageOK(){return storageOK;},get offlineReady(){return offlineReady;},snapshot:()=>engine.snapshot(),save,resize,worldToScreen,
 loadFixture(raw){dom.modal.innerHTML='';modalKind=null;modalReturn='world';engine=new R.Engine(raw);npcPaths.clear();path=[];goal=null;particles=[];hudSignature='';kitchenSignature='';save();if(mode==='cook'&&engine.s.prep)openCooking();else returnToWorld();},
 resumeCooking:openCooking,openRestaurant,route,updateHUD,showTitle,metrics(){return {width,height,dpr,mode,hitboxes:hits.map(x=>({...x})),audioUnlocked:sound.unlocked,audioState:sound.context?.state||'not-created'};}
 };
}
requestAnimationFrame(animationFrame);boot();
})();
