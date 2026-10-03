/* Rainbow Kitchen v1.0.0. Plain JavaScript; local-only progress and original sound. */
(() => {
  'use strict';
  const VERSION = '1.0.0';
  const SAVE_KEY = 'sneaky-unicorn-rainbow-kitchen:v1';
  const $ = id => document.getElementById(id);
  const recipes = window.RECIPES;
  const recipeById = Object.assign(Object.create(null),Object.fromEntries(recipes.map(r => [r.id, r])));
  const ids = recipes.map(r => r.id);
  const isRecipeId = id => typeof id==='string' && ids.includes(id);
  const iconPaths = {
    home:'<path d="M3 11 12 3l9 8v10h-6v-7H9v7H3Z"/>',
    sound:'<path d="M4 9h4l5-5v16l-5-5H4Z"/><path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted:'<path d="M4 9h4l5-5v16l-5-5H4Z"/><path d="m17 9 5 6m0-6-5 6"/>',
    book:'<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15"/><path d="M5 8h3m8 0h3M5 12h3m8 0h3"/>',
    star:'<path d="m12 2 3 6.5 7 .8-5.2 4.9 1.5 7L12 17.5 5.7 21l1.5-6.8L2 9.3l7-.8Z"/>',
    heart:'<path d="M12 21S2 15 2 8.5C2 2.5 10 1.5 12 7c2-5.5 10-4.5 10 1.5C22 15 12 21 12 21Z"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    retry:'<path d="M4 9a9 9 0 1 1 0 7M4 3v6h6"/>',
    check:'<path d="m5 12 4 4L20 5"/>',
    arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
    hand:'<path d="M8 12V4a2 2 0 0 1 4 0v6-3a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v6c0 4-2 7-6 7h-1c-3 0-4-2-6-4l-4-5c-1-2 2-4 3-2l2 2Z"/>',
    spoon:'<path d="m7 15 9-9m1-4c-4 0-7 5-4 7s7-1 7-4c0-2-1-3-3-3ZM7 14l3 3-5 5-3-3Z"/>',
    oven:'<rect x="3" y="3" width="18" height="19" rx="3"/><path d="M3 8h18M7 5h.01M12 5h.01M17 5h.01"/><rect x="7" y="11" width="10" height="7" rx="1"/>',
    serve:'<path d="M3 16h18M5 15a7 7 0 0 1 14 0M12 5v2M8 20h8"/>'
  };
  const icon = name => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+(iconPaths[name] || iconPaths.star)+'</svg>';
  document.querySelectorAll('[data-icon]').forEach(el => {el.innerHTML=icon(el.dataset.icon);});

  let storageAvailable = true;
  const fresh = () => ({schema:1, version:VERSION, bag:ids.slice(), position:0, served:0, stamps:{}, muted:false, active:null, pending:null, collectionCelebrated:false});
  function readSave() {
    const result = fresh();
    let parsed;
    try {const raw=localStorage.getItem(SAVE_KEY);if(!raw)return result;parsed=JSON.parse(raw);} catch(e){if(e && e.name !== 'SyntaxError')storageAvailable=false;return result;}
    if(!parsed || parsed.schema!==1 || typeof parsed!=='object')return result;
    if(Array.isArray(parsed.bag) && parsed.bag.length===7 && new Set(parsed.bag).size===7 && parsed.bag.every(isRecipeId))result.bag=parsed.bag.slice();
    if(Number.isInteger(parsed.position)&&parsed.position>=0&&parsed.position<7)result.position=parsed.position;
    if(Number.isInteger(parsed.served)&&parsed.served>=0)result.served=Math.min(parsed.served,1000000);
    ids.forEach(id=>{if(parsed.stamps && Number.isFinite(parsed.stamps[id]) && parsed.stamps[id]>0)result.stamps[id]=Math.min(1000000,Math.floor(parsed.stamps[id]));});
    result.muted=parsed.muted===true;result.collectionCelebrated=parsed.collectionCelebrated===true;
    const a=parsed.active;
    if(a && isRecipeId(a.recipeId) && Number.isInteger(a.stepIndex)){
      const recipe=recipeById[a.recipeId];
      const stepIndex=Math.max(0,Math.min(recipe.steps.length,a.stepIndex));
      const ready=stepIndex>=recipe.steps.length;
      const maxTaps=ready?0:recipe.steps[stepIndex].count;
      const taps=Number.isFinite(a.taps)?Math.max(0,Math.min(maxTaps,a.taps)):0;
      result.active={recipeId:a.recipeId,stepIndex,taps,phase:ready?'ready':'cooking'};
      // A saved full step is normalized to the next safe step. Never replay its reward.
      if(!ready && taps>=maxTaps){result.active.stepIndex++;result.active.taps=0;if(result.active.stepIndex===recipe.steps.length)result.active.phase='ready';}
    }
    const p=parsed.pending;
    if(p && ['correct','wrong'].includes(p.type) && isRecipeId(p.dishId) && isRecipeId(p.orderId)){
      result.pending={type:p.type,dishId:p.dishId,orderId:p.orderId,customerIndex:Number.isInteger(p.customerIndex)?Math.max(0,p.customerIndex)%3:0,newSticker:p.newSticker===true,complete:p.complete===true};
      if(p.type==='wrong' && (!result.active || result.active.recipeId!==p.dishId))result.pending=null;
    }
    return result;
  }
  let saved=readSave();
  let images={},scene=null,view='home',activeModal=null,lastFocus=null,offlineReady=false;
  let transitionUntil=0,transitionTimer=0,toastTimer=0,guideTimer=0,saveTimer=0;
  let lastInteraction=0,pointer=null,booting=false,booted=false,resultShown=false;
  const customers=[
    {name:'Pip',idle:'babyPink',happy:'babyPinkCelebrate'},
    {name:'Milo',idle:'babyBlue',happy:'babyBlueCelebrate'},
    {name:'Sunny',idle:'customerHappy',happy:'customerHappy'}
  ];
  function orderId(){return saved.bag[saved.position];}
  function customerIndex(){return saved.served%customers.length;}
  function customer(){return customers[customerIndex()];}
  function earnedCount(){return ids.filter(id=>saved.stamps[id]>0).length;}
  function currentRecipe(){return saved.active?recipeById[saved.active.recipeId]:null;}
  function currentStep(){const r=currentRecipe();return r?r.steps[saved.active.stepIndex]:null;}
  function saveNow(){
    clearTimeout(saveTimer);
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));storageAvailable=true;}catch(e){storageAvailable=false;}
    renderSaveNote();
  }
  function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,160);}
  function renderSaveNote(){$('save-note').textContent=storageAvailable?(offlineReady?'Saved here · offline ready':'Saved on this device'):'Playing without a save';}
  function art(el,key){if(el && window.ART[key])el.src=window.ART[key];}
  function announce(message){$('announcer').textContent=message;}

  const sound = {
    ctx:null, master:null, unlocked:false,
    unlock(){
      if(saved.muted)return;
      try{
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        if(!AudioContext)return;
        if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.2;this.master.connect(this.ctx.destination);}
        if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
        this.unlocked=true;
      }catch(e){}
    },
    note(freq,duration=.15,delay=0,kind='sine',volume=.32){
      if(saved.muted || !this.ctx || !this.master || this.ctx.state!=='running')return;
      try{
        const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();
        o.type=kind;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.82),t+duration);
        g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
        o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
      }catch(e){}
    },
    tap(gesture){if(gesture==='stir'||gesture==='pour')this.note(260+Math.random()*130,.11,0,'sine',.16);else this.note(430+Math.random()*230,.09,0,'sine',.22);},
    step(){this.note(660,.16);this.note(880,.23,.09);},
    happy(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.note(f,.25,i*.095,'sine',.25));},
    gentle(){this.note(523,.18);this.note(587,.2,.12);},
    updateMute(){if(this.master&&this.ctx)this.master.gain.setTargetAtTime(saved.muted?0:.2,this.ctx.currentTime,.02);}
  };
  function tactile(){try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}}
  function setMute(){saved.muted=!saved.muted;if(!saved.muted)sound.unlock();sound.updateMute();renderMute();saveNow();if(!saved.muted)sound.note(660,.14);}
  function renderMute(){['mute-button','home-mute'].forEach(id=>{$(id).innerHTML=icon(saved.muted?'muted':'sound');$(id).setAttribute('aria-label',saved.muted?'Turn sound on':'Mute sound');$(id).setAttribute('aria-pressed',String(saved.muted));});}
  function renderGlobal(){
    $('sticker-count').textContent=earnedCount()+' / 7';
    $('home-sticker-line').textContent=earnedCount()?earnedCount()+' of 7 recipe stickers · '+saved.served+' happy orders':'Seven yummy things to make';
    $('start-label').textContent=saved.active||saved.pending?'Keep cooking!':saved.served?'Let’s cook again!':'Let’s cook!';
    renderSaveNote();
    renderMute();
  }
  function showHome(){
    endPointer();clearTimeout(transitionTimer);transitionUntil=0;clearTimeout(guideTimer);
    // Store only stable recipe states, including a completed step if home was hit mid-animation.
    normalizeFullStep();closeModal();view='home';$('play-screen').hidden=true;$('home-screen').hidden=false;
    saveNow();renderGlobal();$('start-button').focus({preventScroll:true});
  }
  function showPlay(){
    sound.unlock();view='play';$('home-screen').hidden=true;$('play-screen').hidden=false;renderGlobal();renderCustomer();
    if(saved.pending){if(saved.active)renderCooking();showResult();}
    else if(saved.active){renderCooking();scheduleGuide();}
    else{renderEmpty();openMenu();}
    requestAnimationFrame(()=>scene.resize());
  }
  function renderCustomer(){
    const c=customer(),r=recipeById[orderId()];
    art($('customer-image'),c.idle);$('customer-image').alt=c.name+', waiting happily';
    art($('order-image'),r.finalArt);$('order-image').alt='Picture order: '+r.name;$('order-name').textContent=r.name;
    $('customer-name').textContent=c.name;$('order-word').textContent='Yes, please!';
    $('customer-card').setAttribute('aria-label',c.name+' would like '+r.name+'. No rush.');
  }
  function renderEmpty(){
    $('recipe-name').textContent='What shall we make?';$('recipe-kicker').textContent='A LITTLE SOMETHING YUMMY';
    scene.setState({recipeId:orderId(),stepIndex:0,progress:0,phase:'cooking'});
    $('cook-button').disabled=true;$('step-track').innerHTML='';
  }
  function openModal(id){
    if(activeModal===id)return;
    if(activeModal)$(activeModal).hidden=true;
    lastFocus=document.activeElement;activeModal=id;$(id).hidden=false;endPointer();clearTimeout(guideTimer);
    $('home-screen').inert=true;$('play-screen').inert=true;
    requestAnimationFrame(()=>{const first=$(id).querySelector('button:not([disabled])');if(first)first.focus({preventScroll:true});});
  }
  function closeModal(){
    if(activeModal)$(activeModal).hidden=true;activeModal=null;
    $('home-screen').inert=false;$('play-screen').inert=false;
    if(lastFocus && lastFocus.isConnected && !lastFocus.closest('[hidden]'))lastFocus.focus({preventScroll:true});
    lastFocus=null;
  }
  function openMenu(){
    if(saved.pending)return;
    const wanted=orderId();$('recipe-grid').innerHTML='';
    recipes.forEach(recipe=>{
      const button=document.createElement('button');button.className='recipe-card'+(recipe.id===wanted?' requested':'');button.dataset.recipe=recipe.id;
      button.setAttribute('aria-label','Make '+recipe.name+(recipe.id===wanted?' — requested picture order':''));
      const img=document.createElement('img');art(img,recipe.finalArt);img.alt='';button.appendChild(img);
      const label=document.createElement('span');label.className='recipe-card-label';label.textContent=recipe.name;button.appendChild(label);
      if(recipe.id===wanted){const badge=document.createElement('span');badge.className='match-tag';badge.innerHTML=icon('heart');button.appendChild(badge);}
      button.addEventListener('click',()=>beginRecipe(recipe.id));$('recipe-grid').appendChild(button);
    });
    art($('menu-customer'),customer().idle);art($('menu-request'),recipeById[wanted].finalArt);$('menu-request').alt=recipeById[wanted].name+' requested';
    $('menu-close').hidden=!saved.active;$('menu-footnote').textContent=saved.active?'Pick a recipe to start a fresh tray. Your stickers stay safe.':'Every recipe is ready to play.';
    openModal('menu-modal');announce(customer().name+' would like '+recipeById[wanted].name+'. Pick its picture, or make something else.');
  }
  function beginRecipe(id){
    if(!isRecipeId(id))return;
    clearTimeout(transitionTimer);transitionUntil=0;endPointer();
    saved.active={recipeId:id,stepIndex:0,taps:0,phase:'cooking'};saved.pending=null;resultShown=false;
    closeModal();renderCooking();saveNow();sound.note(550,.12);scheduleGuide();
    announce('Making '+recipeById[id].name+'. '+recipeById[id].steps[0].label+'. Tap the food or the big tool button.');
    $('cook-button').focus({preventScroll:true});
  }
  function renderCooking(){
    const a=saved.active,r=currentRecipe();if(!a||!r)return;
    const s=currentStep(),ready=a.phase==='ready'||a.stepIndex>=r.steps.length;
    $('recipe-kicker').textContent=ready?'MADE BY YOU':'TODAY’S LITTLE CREATION';$('recipe-name').textContent=r.name;
    $('cook-button').classList.toggle('ready',ready);$('cook-button').disabled=performance.now()<transitionUntil;
    $('restart-button').disabled=!!saved.pending;
    $('action-label').textContent=ready?'Serve with a smile!':s.label;
    $('action-hint').textContent=ready?'Tap to give it to your friend':gestureHint(s.gesture,s.id);
    art($('tool-image'),ready?r.finalArt:s.tool);$('action-dock').setAttribute('aria-label',ready?'Serve the finished food':s.label);
    $('cook-button').setAttribute('aria-label',ready?'Serve '+r.name:s.label+'. Tap this button, tap the food, or drag on the worktop.');
    $('kitchen-canvas').setAttribute('aria-label',ready?'Finished '+r.name+'. Tap to serve.':r.name+': '+s.label+'. Tap, drag or press Space.');
    $('cook-button').querySelector('.action-arrow').innerHTML=icon(ready?'serve':s.gesture==='bake'&&!['grill','simmer'].includes(s.id)?'oven':'hand');
    $('step-track').innerHTML='';
    r.steps.forEach((step,index)=>{
      if(index){const line=document.createElement('span');line.className='step-line'+(index<=a.stepIndex?' done':'');line.setAttribute('aria-hidden','true');$('step-track').appendChild(line);}
      const dot=document.createElement('span');dot.className='step-dot'+(index<a.stepIndex?' done':index===a.stepIndex?' current':'');dot.innerHTML=icon(index<a.stepIndex?'check':step.gesture==='bake'?'oven':step.gesture==='stir'?'spoon':'star');dot.setAttribute('aria-label',step.label+': '+(index<a.stepIndex?'complete':index===a.stepIndex?'current':'later'));$('step-track').appendChild(dot);
    });
    const progress=ready?1:Math.min(1,a.taps/s.count);
    scene.setState({recipeId:r.id,stepIndex:a.stepIndex,progress,phase:ready?'ready':'cooking'});
    $('scene-status').textContent=ready?'Made with love':s.gesture==='bake'?'Tap to add a little warmth':'Tap, drag, make a little magic';
    const guide=$('gesture-guide');guide.classList.remove('visible','stir','pour');if(s&&s.gesture==='stir')guide.classList.add('stir');if(s&&['pour','spread','scoop'].includes(s.gesture))guide.classList.add('pour');
  }
  function gestureHint(kind,id){if(id==='grill')return 'Tap to make it sizzle';if(id==='simmer')return 'Tap for happy little bubbles';return ({stir:'Stir around — or tap, tap, tap',spread:'Spread with your finger — or tap',pour:'Tip and pour — or tap',sprinkle:'Sprinkle with little taps',bake:'Tap the oven for a cozy bake',scoop:'Scoop with your finger — or tap',stack:'Add it with a tap',tap:'Tap to add a little magic'})[kind]||'Tap or move your finger';}
  function normalizeFullStep(){
    const s=currentStep();if(saved.active && s && saved.active.taps>=s.count){saved.active.stepIndex++;saved.active.taps=0;if(saved.active.stepIndex>=currentRecipe().steps.length)saved.active.phase='ready';}
  }
  function scheduleGuide(){
    clearTimeout(guideTimer);$('gesture-guide').classList.remove('visible');
    if(view==='play'&&!activeModal&&saved.active&&saved.active.phase==='cooking')guideTimer=setTimeout(()=>{$('gesture-guide').classList.add('visible');},2500);
  }
  function toast(text){clearTimeout(toastTimer);$('step-toast').textContent=text;$('step-toast').classList.add('show');toastTimer=setTimeout(()=>$('step-toast').classList.remove('show'),1000);}
  function cheer(){const el=document.querySelector('.chef-badge');art($('chef-image'),'chefHappy');el.classList.remove('cheer');void el.offsetWidth;el.classList.add('cheer');setTimeout(()=>art($('chef-image'),'chefIdle'),600);}
  function cook(amount=1,x=.5,y=.5){
    if(view!=='play'||activeModal||!saved.active||saved.pending||performance.now()<transitionUntil)return;
    if(saved.active.phase==='ready'){serve();return;}
    const s=currentStep();if(!s)return;
    sound.unlock();scene.interact(x,y);sound.tap(s.gesture);tactile();lastInteraction=performance.now();scheduleGuide();
    saved.active.taps=Math.min(s.count,saved.active.taps+amount);
    scene.setState({recipeId:saved.active.recipeId,stepIndex:saved.active.stepIndex,progress:saved.active.taps/s.count,phase:'cooking'});
    if(saved.active.taps>=s.count){
      const recipe=currentRecipe(),finishedIndex=saved.active.stepIndex;
      const duration=s.gesture==='bake'?1150:550;
      transitionUntil=performance.now()+duration;$('cook-button').disabled=true;endPointer();sound.step();cheer();
      toast(s.id==='grill'?'Sizzle, sizzle!':s.id==='simmer'?'Bubble, bubble!':s.gesture==='bake'?'A cozy little bake…':['Lovely!','A little magic!','Looking yummy!','Made by you!'][finishedIndex%4]);
      saveNow();
      transitionTimer=setTimeout(()=>{
        if(!saved.active||saved.active.recipeId!==recipe.id||saved.active.stepIndex!==finishedIndex)return;
        saved.active.stepIndex++;saved.active.taps=0;
        if(saved.active.stepIndex>=recipe.steps.length){saved.active.phase='ready';toast('Ready for a hungry friend!');sound.happy();announce(recipe.name+' is ready. Tap Serve.');}
        else announce(recipe.steps[saved.active.stepIndex].label);
        transitionUntil=0;renderCooking();saveNow();scheduleGuide();
      },duration);
    }else scheduleSave();
  }
  function point(event){const b=$('kitchen-canvas').getBoundingClientRect();return{x:Math.max(0,Math.min(1,(event.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(event.clientY-b.top)/b.height))};}
  function endPointer(){if(pointer){try{$('kitchen-canvas').releasePointerCapture(pointer.id);}catch(e){}pointer=null;}}
  function pointerDown(event){
    if(pointer||event.button>0||activeModal||view!=='play'||!saved.active||performance.now()<transitionUntil)return;
    event.preventDefault();sound.unlock();const p=point(event);
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,distance:0,lastTick:performance.now()};
    try{$('kitchen-canvas').setPointerCapture(event.pointerId);}catch(e){}
    cook(1,p.x,p.y);
  }
  function pointerMove(event){
    if(!pointer||event.pointerId!==pointer.id)return;
    event.preventDefault();const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    pointer.distance+=Math.min(60,Math.hypot(dx,dy));pointer.x=event.clientX;pointer.y=event.clientY;
    const threshold=Math.max(27,Math.min(55,$('kitchen-canvas').clientWidth*.08));
    if(pointer.distance>=threshold && performance.now()-pointer.lastTick>110){const p=point(event);pointer.distance=0;pointer.lastTick=performance.now();cook(1,p.x,p.y);}
  }
  function restartRecipe(){if(!saved.active||saved.pending)return;const id=saved.active.recipeId;beginRecipe(id);toast('A fresh little tray!');}
  function advanceOrder(){
    saved.position++;
    if(saved.position>=saved.bag.length){const previous=saved.bag[saved.bag.length-1];saved.bag=ids.slice();for(let i=saved.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[saved.bag[i],saved.bag[j]]=[saved.bag[j],saved.bag[i]];}if(saved.bag[0]===previous)[saved.bag[0],saved.bag[1]]=[saved.bag[1],saved.bag[0]];saved.position=0;}
  }
  function serve(){
    if(!saved.active||saved.active.phase!=='ready'||saved.pending||activeModal||view!=='play')return;
    endPointer();const dishId=saved.active.recipeId,wanted=orderId(),cIndex=customerIndex(),correct=dishId===wanted;
    if(correct){
      const newSticker=!saved.stamps[dishId];saved.stamps[dishId]=(saved.stamps[dishId]||0)+1;saved.served++;
      const complete=earnedCount()===7&&!saved.collectionCelebrated;if(complete)saved.collectionCelebrated=true;
      saved.pending={type:'correct',dishId,orderId:wanted,customerIndex:cIndex,newSticker,complete};
      saved.active=null;advanceOrder();sound.happy();
    }else{saved.pending={type:'wrong',dishId,orderId:wanted,customerIndex:cIndex,newSticker:false,complete:false};sound.gentle();}
    saveNow();renderGlobal();showResult();
  }
  function showResult(){
    const p=saved.pending;if(!p)return;
    const correct=p.type==='correct',r=recipeById[p.dishId],wanted=recipeById[p.orderId],c=customers[p.customerIndex];
    const panel=$('result-modal').querySelector('.result-panel');panel.classList.toggle('wrong',!correct);
    $('result-kicker').textContent=correct?(p.complete?'SEVEN DELICIOUS LITTLE CREATIONS':'MADE WITH A LITTLE MAGIC'):'A LITTLE SNACK FOR BABY';
    $('result-title').textContent=correct?(p.complete?'Rainbow chef!':'Yummy!'):'One more little try';
    $('result-message').textContent=correct?(p.complete?'You made the whole menu! The café stays open for more.':p.newSticker?'A happy friend. A new recipe sticker!':'Another delicious dish, made by you.'):'Baby enjoyed your '+r.shortName.toLowerCase()+'. '+c.name+' would love this:';
    art($('result-customer'),correct?c.happy:'babyBlueHappy');$('result-customer').alt=correct?c.name+' celebrating':'Baby enjoying a surprise snack';
    art($('result-food'),correct?r.finalArt:wanted.finalArt);$('result-food').alt=correct?r.name:'Requested dish: '+wanted.name;
    $('next-label').textContent=correct?(p.complete?'Let’s cook again!':'Another little order'):'Make '+wanted.shortName.toLowerCase();
    $('next-icon').innerHTML=correct?icon('arrow'):'';
    if(!correct){const wantedPicture=document.createElement('img');art(wantedPicture,wanted.finalArt);wantedPicture.alt='';wantedPicture.style.cssText='width:40px;height:40px;object-fit:contain';$('next-icon').appendChild(wantedPicture);}
    $('result-stickers').innerHTML='';recipes.forEach(recipe=>{const img=document.createElement('img');art(img,recipe.finalArt);img.alt=recipe.name+(saved.stamps[recipe.id]?' sticker collected':' not yet collected');img.className=saved.stamps[recipe.id]?'earned':'';$('result-stickers').appendChild(img);});
    $('confetti-field').innerHTML='';
    if(correct&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){for(let i=0;i<24;i++){const bit=document.createElement('i');bit.style.left=(i*4.17)+'%';bit.style.background=['#deb0e9','#efafc3','#9fd6c3','#f2cd7e'][i%4];bit.style.animationDelay=(i%7*.12)+'s';bit.style.rotate=(i*27)+'deg';$('confetti-field').appendChild(bit);}}
    openModal('result-modal');resultShown=true;announce(correct?'Yummy! '+c.name+' is happy. '+(p.complete?'You made all seven recipes.':'Another little order is ready.'):'That was '+r.name+'. '+c.name+' would like '+wanted.name+'. Tap the big picture button to make it.');
  }
  function nextOrder(){
    const pending=saved.pending;if(!pending)return;
    saved.pending=null;resultShown=false;closeModal();renderCustomer();
    if(pending.type==='wrong'){beginRecipe(pending.orderId);}
    else{saved.active=null;saveNow();renderEmpty();openMenu();}
  }
  function openBook(){
    if(activeModal==='result-modal')return;
    $('sticker-grid').innerHTML='';
    recipes.forEach(r=>{const card=document.createElement('div');card.className='sticker-item'+(saved.stamps[r.id]?' earned':'');const img=document.createElement('img');art(img,r.finalArt);img.alt=r.name+(saved.stamps[r.id]?' sticker collected':' sticker waiting');card.appendChild(img);const label=document.createElement('span');label.textContent=r.shortName;card.appendChild(label);$('sticker-grid').appendChild(card);});
    $('book-message').textContent=earnedCount()===7?'A whole menu of magic! Keep cooking for your friends.':earnedCount()+' of 7 collected. Make a dish for a friend to add its sticker.';
    openModal('book-modal');
  }
  function closeBook(){closeModal();if(view==='play'&&!saved.active){openMenu();}else scheduleGuide();}

  $('start-button').addEventListener('click',showPlay);$('home-button').addEventListener('click',showHome);
  $('mute-button').addEventListener('click',setMute);$('home-mute').addEventListener('click',setMute);
  $('menu-button').addEventListener('click',openMenu);$('menu-close').addEventListener('click',()=>{if(saved.active){closeModal();scheduleGuide();}});
  $('cook-button').addEventListener('click',()=>cook());$('restart-button').addEventListener('click',restartRecipe);
  $('next-button').addEventListener('click',nextOrder);$('sticker-button').addEventListener('click',openBook);$('home-book').addEventListener('click',openBook);
  $('book-close').addEventListener('click',closeBook);$('book-done').addEventListener('click',closeBook);
  $('kitchen-canvas').addEventListener('pointerdown',pointerDown);
  $('kitchen-canvas').addEventListener('pointermove',pointerMove);
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>$('kitchen-canvas').addEventListener(type,event=>{if(pointer&&event.pointerId===pointer.id)endPointer();}));
  $('kitchen-canvas').addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)&&!event.repeat){event.preventDefault();cook();}});
  document.addEventListener('pointerdown',()=>sound.unlock(),{passive:true});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(activeModal==='book-modal')closeBook();else if(activeModal==='menu-modal'&&saved.active){closeModal();scheduleGuide();}
    }
    if(event.key==='Tab'&&activeModal){const buttons=Array.from($(activeModal).querySelectorAll('button:not([hidden]):not([disabled])'));const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
  window.addEventListener('blur',endPointer);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){endPointer();saveNow();}else if(view==='play')scheduleGuide();});
  window.addEventListener('pagehide',saveNow);window.addEventListener('resize',()=>{endPointer();if(scene)scene.resize();});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{if(scene)scene.resize();});

  async function loadImages(){
    const entries=Object.entries(window.ART);let completed=0;
    await Promise.all(entries.map(([key,url])=>new Promise((resolve,reject)=>{
      const img=new Image();img.decoding='async';
      img.onload=()=>{if(!img.naturalWidth){reject(new Error('Empty artwork: '+key));return;}images[key]=img;completed++;$('load-note').textContent='Setting the table · '+Math.round(completed/entries.length*100)+'%';resolve();};
      img.onerror=()=>reject(new Error('Artwork could not load: '+key));img.src=url;
    })));
  }
  async function boot(){
    if(booting||booted)return;booting=true;$('load-retry').hidden=true;
    try{
      if(!window.ART||!recipes||!window.KitchenScene)throw new Error('The game files are incomplete.');
      await loadImages();
      document.querySelectorAll('[data-art]').forEach(el=>art(el,el.dataset.art));
      document.querySelector('.home-room').style.backgroundImage='url("'+window.ART.restaurant+'")';
      document.querySelector('.customer-room').style.backgroundImage='url("'+window.ART.restaurant+'")';
      scene=new window.KitchenScene($('kitchen-canvas'),images);
      offlineReady=window.RAINBOW_STANDALONE===true;
      $('loading').hidden=true;$('home-screen').hidden=false;booted=true;renderGlobal();
      // This package registers its own offline cache only from HTTPS or localhost.
      if('serviceWorker' in navigator && /^(https?:)$/.test(location.protocol) && !window.RAINBOW_STANDALONE){
        navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;renderSaveNote();}).catch(()=>{/* Offline installation is optional; cooking remains available. */});
      }
    }catch(error){$('load-note').textContent=error.message+' Please open the complete game folder, or use the standalone HTML.';$('load-retry').hidden=false;}
    finally{booting=false;}
  }
  $('load-retry').addEventListener('click',()=>{images={};boot();});
  // Read-only diagnostics make a delivered build inspectable without alternate gameplay paths.
  window.RainbowKitchen=Object.freeze({version:VERSION,snapshot:()=>JSON.parse(JSON.stringify({view,modal:activeModal,orderId:orderId(),customer:customer().name,progress:saved,artLoaded:Object.keys(images).length,ready:booted,storageAvailable})),recipeIds:ids.slice()});
  boot();
})();
