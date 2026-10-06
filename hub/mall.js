/* Mall activities. Visual trial state never grants ownership or changes native saves. */
(()=>{'use strict';const A=UWArt,C=UWCatalog,$=id=>document.getElementById(id),clone=o=>JSON.parse(JSON.stringify(o));
class Mall{
 constructor(world){this.w=world;this.service=world.service;this.previewOutfit=null;this.trialVehicle=null;this.kind=null;this.tab='head';this.selected='flower-crown';this.theme='unicorns';this.puzzle='unicorns-1';this.pieces=4;this.round=null;this.busy=false;this.epoch=0;this.last=0;this.saveAt=0;this.drag=null;this.photo=null;this.audio=null;this.previousFocus=null;this.iconCache=new Map();this.thumbs=new Map();
  $('panel-close').innerHTML=A.icon('close');$('panel-close').onclick=()=>this.close();$('panel-body').onclick=e=>{const b=e.target.closest('button');if(b&&!b.disabled)this.action(b.dataset.action,b.dataset);};
  window.addEventListener('blur',()=>{this.drag=null;this.saveRound();});
 }
 ready(){this.artReady=true;this.changed();}
 cancelControls(){this.drag=null;this.last=0;if(document.hidden||innerHeight>innerWidth)this.audio?.suspend?.();this.saveRound();}
 p(){return this.service.value;}
 img(id){if(!this.iconCache.has(id))this.iconCache.set(id,A.imagePiece(C.byId[id],100));return this.iconCache.get(id);}
 btn(action,picture,label,data='',disabled=false){return`<button class="picture-button ${['start','buy','buy-ride','wear','apply-outfit','roll','save-photo','next-piece'].includes(action)?'primary-action':''}" data-action="${action}" ${data} aria-label="${label}" ${disabled?'disabled':''}>${A.icon(picture)}</button>`;}
 price(n){return`<span class="coin-price">${A.icon('coin')}<span>${n}</span></span>`;}
 piecesPicture(n){return A.icon('grid'+n);}
 toast(icon,number='',label=''){const n=$('picture-toast');n.innerHTML=A.icon(icon)+(number!==''?`<span>${number}</span>`:'');n.hidden=false;this.w.announce(label);clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>n.hidden=true,2200);}
 sound(win=false){if(this.p().settings.muted)return;try{if(!this.audio)this.audio=new (window.AudioContext||window.webkitAudioContext)();this.audio.resume();const ac=this.audio,now=ac.currentTime;for(let i=0;i<(win?3:1);i++){const osc=ac.createOscillator(),g=ac.createGain();osc.frequency.value=[523,659,784][i];g.gain.setValueAtTime(.08,now+i*.11);g.gain.exponentialRampToValueAtTime(.001,now+i*.11+.15);osc.connect(g);g.connect(ac.destination);osc.start(now+i*.11);osc.stop(now+i*.11+.17);}}catch(_){}}
 async toggleSound(){try{await this.service.run('settings',{...this.p().settings,muted:!this.p().settings.muted});if(this.p().settings.muted)this.audio?.suspend?.();this.changed();}catch(e){this.error(e);}}
 error(e){if(e.code==='coins')this.toast('coin','?', 'More coins are needed. Try it on for free or earn coins in another game.');else{this.toast('save','!', 'This change could not be saved. Try again.');}}
 async tx(action,args={}){this.busy=true;try{return await this.service.run(action,args);}catch(e){this.error(e);return null;}finally{this.busy=false;}}
 changed(){if(!this.artReady)return;$('world-sound').innerHTML=A.icon(this.p().settings.muted?'mute':'sound');$('world-sound').setAttribute('aria-label',this.p().settings.muted?'Turn world sound on':'Mute world sound');if(!this.kind)return;
  if(['backpack','shop','closet','wheel-shop','test-ride','prizes','album'].includes(this.kind)&&!this.busy)this.render();
 }
 leaveScene(from,to){if((from==='fitting'&&to!=='fitting')||!['boutique','fitting'].includes(to))this.previewOutfit=null;if(to!=='track')this.trialVehicle=null;}
 async open(kind){if(!this.artReady)return;if(kind==='take-photo')kind='photo';if(kind==='jigsaws')kind='library';$('picture-toast').hidden=true;$('panel').classList.remove('playing');this.previousFocus=document.activeElement;this.kind=kind;this.epoch++;this.drag=null;
  if(kind==='shop'||kind==='closet'){if(!C.slots.includes(this.tab))this.tab='head';this.previewOutfit=clone(this.p().outfit);this.selected=C.byId[this.selected]?.slot===this.tab?this.selected:C.items.find(i=>i.slot===this.tab&&i.price>0).id;}
  const epoch=this.epoch;await this.w.setPanel(true);if(epoch!==this.epoch)return;$('panel').hidden=false;$('panel-close').focus();
  if(kind==='library'){this.renderLoading();try{await UWPuzzles.load(this.w.images);if(this.kind==='library')this.render();}catch(e){this.error(e);}}else this.render();
 }
 async close(){this.epoch++;await this.saveRound();this.kind=null;this.round=null;this.drag=null;cancelAnimationFrame(this.raf);clearTimeout(this.toastTimer);$('picture-toast').hidden=true;$('panel').hidden=true;$('panel').classList.remove('playing');await this.w.setPanel(false);if(!['boutique','fitting'].includes(this.w.scene()))this.previewOutfit=null;this.previousFocus?.focus?.();this.w.draw();}
 renderLoading(){this.header('puzzle');$('panel-body').innerHTML='<div class="storage-note">'+A.icon('puzzle')+'</div>';}
 header(icon){$('panel-symbol').innerHTML=A.icon(icon);$('panel').setAttribute('aria-label',{shop:'Dress-up boutique',closet:'Fitting room',backpack:'Travelling backpack',library:'Choose a jigsaw',catcher:'Star Catcher',bowling:'Bowling',prizes:'Choose an arcade prize',album:'Photo album',photo:'Photo booth','wheel-shop':'Wheels shop','test-ride':'Try a bike or skateboard'}[this.kind]||'Mall activity');}
 render(){if(!this.kind)return;$('round-meter')?.remove();const kinds={shop:'hanger',closet:'mirror',backpack:'bag','wheel-shop':'wheel','test-ride':'wheel',catcher:'basket',bowling:'pins',library:'puzzle',prizes:'star',photo:'camera',album:'album'};this.header(kinds[this.kind]);
  const body=$('panel-body');
  if(this.kind==='shop'||this.kind==='closet')return this.shop(this.kind==='closet');
  if(this.kind==='backpack')return this.backpack();
  if(this.kind==='wheel-shop')return this.wheels();
  if(this.kind==='test-ride')return this.testRide();
  if(this.kind==='library')return this.library();
  if(this.kind==='catcher'||this.kind==='bowling')return this.intro(this.kind);
  if(this.kind==='prizes')return this.prizes();
  if(this.kind==='photo')return this.photoBooth();
  if(this.kind==='album'){body.innerHTML=this.p().photos.length?`<div class="photo-grid">${this.p().photos.map(p=>`<img src="${p.image}" alt="Your saved outfit photo">`).join('')}</div>`:'<div class="storage-note">'+A.icon('album')+A.icon('camera')+'</div>';}
 }
 tabs(slots,action,current){return`<nav class="panel-tabs" aria-label="Picture categories">${slots.map(s=>`<button data-action="${action}" data-slot="${s}" aria-label="${s}" aria-pressed="${current===s}">${A.icon(s==='head'?'head':s==='body'?'body':s==='accessory'?'accessory':s==='equipment'?'wheel':s==='outfits'?'outfits':'hanger')}</button>`).join('')}</nav>`;}
 itemTiles(list,action,selected){return`<div class="item-grid">${list.map(i=>`<button class="item-button" data-action="${action}" data-item="${i.id}" aria-label="${i.name}${this.p().owned.includes(i.id)?', owned':i.price!==null?', '+i.price+' coins':''}" aria-pressed="${selected===i.id}"><img src="${this.img(i.id)}" alt="">${this.p().owned.includes(i.id)?`<span class="owned-mark">${A.icon('check')}</span>`:i.price!==null?this.price(i.price):A.icon('star')}</button>`).join('')}</div>`;}
 previewCanvas(canvas,outfit,h=170,mirror=false){
 const c=canvas.getContext('2d'),w=canvas.width,hh=canvas.height;c.clearRect(0,0,w,hh);
 if(mirror){A.sprite(c,A.images['icon:mirror'],w/2,hh-2,w-10,hh-5);c.save();c.beginPath();c.ellipse(w/2,hh*.43,w*.29,hh*.36,0,0,Math.PI*2);c.clip();A.unicorn(c,w/2,hh*.77,hh*.55,outfit||this.p().outfit,'u_idle0');c.restore();}
 else{A.ellipse(c,w/2,hh-13,h*.3,8,'#b994bb38',null);A.unicorn(c,w/2,hh-18,h,outfit||this.p().outfit,'u_idle0');}
 }
 shop(closet){if(this.tab==='outfits'){$('panel-body').innerHTML=this.tabs([...C.slots,'outfits'],'shop-tab',this.tab)+this.outfitCards(true);this.drawOutfits();return;}const i=C.byId[this.selected],list=C.items.filter(i=>i.slot===this.tab&&(i.price!==null||this.p().owned.includes(i.id))),isOwned=this.p().owned.includes(i.id);
  $('panel-body').innerHTML=this.tabs([...C.slots,'outfits'],'shop-tab',this.tab)+`<div class="shop-layout"><div class="mirror-pane"><canvas id="outfit-preview" width="250" height="240" aria-label="Unicorn trying on the selected outfit"></canvas></div><div class="shop-right">${this.itemTiles(list,'try',this.selected)}<div class="shop-actions">${this.btn(isOwned?(Object.values(this.previewOutfit||{}).every(id=>!id||this.p().owned.includes(id))?'apply-outfit':'wear'):'buy',isOwned?'check':'buy',isOwned?'Wear '+i.name:'Buy '+i.name+' for '+i.price+' coins','data-item="'+i.id+'"',!isOwned&&this.p().coins<i.price)}${!isOwned?this.price(i.price):''}${this.btn('wish','heart','Save '+i.name+' to your wishlist','data-item="'+i.id+'"',isOwned||i.price===null)}${this.btn('remove','close','Remove this clothing category','data-slot="'+this.tab+'"')}</div></div></div>`;this.previewCanvas($('outfit-preview'),this.previewOutfit,185,true);
 }
 outfitCards(save=false){return`<div class="outfit-grid">${this.p().outfits.map((o,n)=>`<div class="outfit-cell"><canvas id="outfit-${n}" width="180" height="155" aria-label="Saved outfit ${n+1}"></canvas>${this.btn('wear-preset','check','Wear saved outfit '+(n+1),'data-slot="'+n+'"',!o)}${save?this.btn('save-preset','save','Save current owned outfit in slot '+(n+1),'data-slot="'+n+'"',Object.values(this.previewOutfit||{}).some(id=>id&&!this.p().owned.includes(id))):''}</div>`).join('')}</div>`;}
 drawOutfits(){this.p().outfits.forEach((o,n)=>{const cv=$('outfit-'+n);if(!cv)return;if(o)this.previewCanvas(cv,o,125);else{const c=cv.getContext('2d');c.font='40px system-ui';c.fillStyle='#a88caf';c.textAlign='center';c.fillText(n+1,90,100);}});}
 backpack(){if(!['clothes','outfits','equipment'].includes(this.bagTab))this.bagTab='clothes';if(!C.slots.includes(this.tab))this.tab='head';const wish=C.byId[this.p().wishlist];$('panel-body').innerHTML=this.tabs(['clothes','outfits','equipment'],'bag-tab',this.bagTab)+
  (this.bagTab==='clothes'?this.tabs(C.slots,'bag-slot',this.tab)+this.itemTiles(C.items.filter(i=>i.slot===this.tab&&this.p().owned.includes(i.id)),'wear',this.p().outfit[this.tab]):this.bagTab==='outfits'?this.outfitCards(true):`<div class="equipment-grid">${C.items.filter(i=>i.ride&&this.p().owned.includes(i.id)).map(i=>`<div class="equipment-cell"><img src="${this.img(i.id)}" alt="${i.name}">${this.btn('ride','check','Use '+i.name+' outdoors','data-item="'+i.id+'"')}</div>`).join('')}${this.btn('park','close','Park your vehicle')}</div>`)+
  (wish?`<div class="wishlist-row">${A.icon('heart')}<img src="${this.img(wish.id)}" alt="Saving for ${wish.name}">${this.price(Math.min(this.p().coins,wish.price))}<span>/</span>${this.price(wish.price)}</div>`:'');if(this.bagTab==='outfits')this.drawOutfits();}
 wheels(){
 const p=this.p();this.selectedRide=this.selectedRide||'skateboard';
 $('panel-body').innerHTML='<div class="equipment-layout"><div class="ride-preview"><canvas id="ride-preview" width="440" height="310" aria-label="Unicorn riding the selected vehicle"></canvas></div><div class="equipment-grid">'+C.items.filter(i=>i.ride).map(i=>'<div class="equipment-cell"><button class="vehicle-choice" data-action="preview-ride" data-item="'+i.id+'" aria-label="Preview riding '+i.name+'" aria-pressed="'+(this.selectedRide===i.id)+'"><img src="'+this.img(i.id)+'" alt=""></button>'+this.price(i.price)+'<div class="vehicle-controls">'+this.btn('trial','hand','Try '+i.name+' for free on the practice track','data-item="'+i.id+'"')+this.btn(p.owned.includes(i.id)?'ride':'buy-ride',p.owned.includes(i.id)?'check':'buy',p.owned.includes(i.id)?'Use '+i.name:'Buy '+i.name+' for '+i.price+' coins','data-item="'+i.id+'"',!p.owned.includes(i.id)&&p.coins<i.price)+'</div></div>').join('')+'</div></div>';this.animateRide();
 }
 animateRide(){cancelAnimationFrame(this.previewRAF);const cv=$('ride-preview');if(!cv)return;const epoch=this.epoch,draw=ms=>{if(this.epoch!==epoch||this.kind!=='wheel-shop'||!cv.isConnected)return;const c=cv.getContext('2d');c.clearRect(0,0,440,310);c.drawImage(this.w.images.wheels,0,0,440,310);c.fillStyle='#72528550';c.fillRect(0,0,440,310);A.ellipse(c,220,287,115,13,'#51386855',null);A.unicorn(c,220,280,173,this.p().outfit,'u_run'+Math.floor(ms/240)%4,false,this.selectedRide);this.previewRAF=requestAnimationFrame(draw);};this.previewRAF=requestAnimationFrame(draw);}
 testRide(){$('panel-body').innerHTML=`<div class="track-picker">${['skateboard','bike'].map(id=>`<div><img src="${this.img(id)}" alt="${id}">${this.btn('trial','play','Try '+id+' for free','data-item="'+id+'"')}</div>`).join('')}</div>`;}
 stamps(){const p=this.p();return`<div class="stamp-row" aria-label="${p.stamps} of five stamps toward the next prize">${Array.from({length:5},(_,n)=>`<span class="${n<p.stamps?'':'empty'}">${A.icon('star')}</span>`).join('')}${p.prize?`<img src="${this.img(p.prize)}" alt="Next prize ${C.byId[p.prize].name}">`:A.icon('check')}</div>`;}
 prizes(){$('panel-body').innerHTML=this.stamps()+`<div class="item-grid prize-grid">${C.prizes.map(id=>`<button class="item-button" data-action="prize" data-item="${id}" aria-label="Choose ${C.byId[id].name} as the next prize" aria-pressed="${this.p().prize===id}" ${this.p().owned.includes(id)?'disabled':''}><img src="${this.img(id)}" alt="">${this.p().owned.includes(id)?A.icon('check'):A.icon('star')}</button>`).join('')}</div>`;}
 intro(game){
 const existing=this.p().sessions[game],resume=existing?.status==='play';
 $('panel-body').innerHTML=this.stamps()+'<div class="round-intro"><div class="arcade-preview"><canvas id="arcade-preview" width="900" height="310" aria-label="'+(game==='bowling'?'Bowling preview with ten pins':'Star Catcher preview')+'"></canvas></div><div class="arcade-entry">'+A.icon(game==='bowling'?'pins':'basket')+'<div class="entry-price">'+this.price(resume?0:1)+A.icon('arrow')+A.icon(game==='bowling'?'ball':'star')+'</div><div class="entry-controls">'+this.btn('demo','hand','Try a free demonstration','data-game="'+game+'"')+this.btn('start','play',resume?'Resume your paid round':'Start '+game+' for one coin','data-game="'+game+'"',!resume&&this.p().coins<1)+'</div></div></div>';
 const cv=$('arcade-preview'),r=cv.getBoundingClientRect();cv.height=Math.max(150,Math.round(900*r.height/r.width));const c=cv.getContext('2d');if(game==='bowling')this.paintBowling(c,{aim:0,throws:0,score:0},null);else this.paintCatcher(c,{elapsed:8,basket:.5,caught:[]},true);
 }
 library(){
 const p=this.p(),selected=this.puzzle,old=p.sessions[selected+':'+this.pieces],resume=old?.status==='play';
 const thumb=id=>{if(!this.thumbs.has(id)){const cv=document.createElement('canvas');cv.width=240;cv.height=165;cv.getContext('2d').drawImage(UWPuzzles.picture(id),0,0,240,165);this.thumbs.set(id,cv.toDataURL());}return this.thumbs.get(id);};
 const themes='<nav class="panel-tabs theme-tabs" aria-label="Puzzle themes">'+C.themes.map(t=>'<button data-action="theme" data-theme="'+t+'" aria-label="'+t+', eight puzzles" aria-pressed="'+(t===this.theme)+'"><img src="'+thumb(t+'-1')+'" alt=""></button>').join('')+'</nav>';
 const tiles='<div class="puzzle-grid">'+C.puzzles.filter(q=>q.theme===this.theme).map(q=>{const done=[4,9,16].some(n=>p.sessions[q.id+':'+n]?.status==='done'),started=[4,9,16].some(n=>p.sessions[q.id+':'+n]?.status==='play');return '<button class="puzzle-tile" data-action="picture" data-puzzle="'+q.id+'" aria-label="'+q.title+(started?', unfinished':'')+(done?', completed':'')+'" aria-pressed="'+(selected===q.id)+'"><img src="'+thumb(q.id)+'" alt="">'+(done||started?'<span class="owned-mark">'+A.icon(done?'check':'save')+'</span>':'')+'</button>';}).join('')+'</div>';
 $('panel-body').innerHTML='<div class="library-layout"><div class="puzzle-preview"><img src="'+thumb(selected)+'" alt="Selected jigsaw picture"></div><div class="puzzle-choices">'+themes+tiles+'</div></div><div class="puzzle-footer">'+[4,9,16].map(n=>'<button data-action="pieces" data-pieces="'+n+'" aria-label="'+n+' pieces" aria-pressed="'+(n===this.pieces)+'">'+this.piecesPicture(n)+'<span>'+n+'</span></button>').join('')+this.btn('start','play',resume?'Resume this jigsaw for free':'Start this jigsaw for one coin','data-game="jigsaw"',!resume&&p.coins<1)+this.price(resume?0:1)+'</div>';
 }
 photoBooth(){
 $('panel-body').innerHTML='<div class="photo-layout"><canvas class="photo-preview" width="960" height="440" aria-label="Your unicorn in the photo booth"></canvas><div class="photo-controls">'+A.icon('camera')+(this.p().photos.length?'<img src="'+this.p().photos.at(-1).image+'" alt="Latest saved photo">':A.icon('album'))+this.btn('album','album','Open your photo album')+this.btn('save-photo','camera','Take and save this outfit photo')+'</div></div>';
 const cv=$('panel-body').querySelector('.photo-preview'),r=cv.getBoundingClientRect();cv.width=Math.max(500,Math.round(440*(r.width-10)/(r.height-10)));cv.height=440;const c=cv.getContext('2d'),im=this.w.images.photo,scale=Math.max(cv.width/im.width,cv.height/im.height);c.drawImage(im,(cv.width-im.width*scale)/2,(cv.height-im.height*scale)/2,im.width*scale,im.height*scale);A.unicorn(c,cv.width/2,410,250,this.p().outfit,'u_happy1');this.photo=cv.toDataURL();
 }
 async action(action,d){if(!action||this.busy)return;this.sound();
  switch(action){
  case'shop-tab':this.tab=d.slot;if(d.slot!=='outfits')this.selected=C.items.find(i=>i.slot===d.slot&&i.price>0).id;this.render();break;
  case'try':this.selected=d.item;this.previewOutfit={...this.previewOutfit,[C.byId[d.item].slot]:d.item};this.render();this.w.draw();break;
  case'remove':this.previewOutfit={...this.previewOutfit,[d.slot]:null};this.render();this.w.draw();break;
  case'apply-outfit':if(await this.tx('outfit',{outfit:this.previewOutfit})){this.toast('check','', 'Outfit saved.');this.render();}break;
  case'buy':case'buy-ride':{const r=await this.tx('buy',{item:d.item,equip:true});if(r){if(!C.byId[d.item].ride)this.previewOutfit={...this.previewOutfit,[C.byId[d.item].slot]:d.item};this.toast('check','', 'Purchased '+C.byId[d.item].name);this.sound(true);this.render();}break;}
  case'wear':if(await this.tx('equip',{item:d.item})){if(this.previewOutfit)this.previewOutfit={...this.p().outfit};this.render();this.w.draw();}break;
  case'wish':if(await this.tx('wishlist',{item:d.item}))this.toast('heart','', 'Wishlist saved.');break;
  case'bag-tab':this.bagTab=d.slot;this.render();break;
  case'bag-slot':this.tab=d.slot;this.render();break;
  case'save-preset':if(this.previewOutfit&&!Object.values(this.previewOutfit).some(id=>id&&!this.p().owned.includes(id))&&!await this.tx('outfit',{outfit:this.previewOutfit}))break;if(await this.tx('save-outfit',{slot:Number(d.slot)}))this.toast('save','', 'Favourite outfit saved.');this.render();break;
  case'wear-preset':if(await this.tx('wear-outfit',{slot:Number(d.slot)})){this.previewOutfit=clone(this.p().outfit);this.render();this.w.draw();}break;
  case'ride':if(await this.tx('equip',{item:d.item}))this.toast('wheel','', 'Ready to ride outdoors.');this.render();break;
  case'park':await this.tx('park');this.render();break;
  case'preview-ride':this.selectedRide=d.item;this.render();break;
  case'trial':this.trialVehicle=d.item;await this.close();this.w.navigate('track');this.trialVehicle=d.item;this.toast('wheel','', 'Free practice ride.');break;
  case'prize':await this.tx('prize',{item:d.item});this.render();break;
  case'theme':this.theme=d.theme;this.puzzle=d.theme+'-1';this.render();break;
  case'picture':this.puzzle=d.puzzle;this.render();break;
  case'pieces':this.pieces=Number(d.pieces);this.render();break;
  case'demo':await this.start(d.game,true);break;
  case'start':await this.start(d.game);break;
  case'roll':this.roll();break;
  case'guide':if(this.round){this.round.state.guide=!this.round.state.guide;await this.saveRound();this.drawRound();$('guide-toggle')?.setAttribute('aria-pressed',this.round.state.guide);}break;
  case'next-piece':this.selectPiece(1);break;
  case'prev-piece':this.selectPiece(-1);break;
  case'play-again':this.kind=d.game==='jigsaw'?'library':d.game;this.round=null;this.render();break;
  case'prizes':this.round=null;this.kind='prizes';this.render();break;
  case'save-photo':if(await this.tx('photo',{image:this.photo})){this.toast('camera','', 'Photo saved to your album.');this.sound(true);}break;
  case'album':this.kind='album';this.render();break;
  }
 }
 async start(game,demo=false){const epoch=this.epoch,args={game};if(game==='jigsaw')Object.assign(args,{puzzle:this.puzzle,pieces:this.pieces});const r=demo?{value:{session:{id:'demo:'+epoch,game,status:'play',state:game==='bowling'?{throws:0,score:0,aim:0}:{elapsed:0,basket:.5,caught:[]}}}}:await this.tx('start',args);if(!r)return;if(epoch!==this.epoch)return;this.demo=demo;this.ball=null;
  this.round=clone(r.value.session);this.kind='round';$('panel').classList.add('playing');this.last=0;this.saveAt=0;this.drag=null;this.selection=0;this.header(game==='catcher'?'basket':game==='bowling'?'pins':'puzzle');
  $('panel-body').innerHTML=`<div class="game-layout"><div class="game-toolbar" id="round-meter"></div><canvas class="game-canvas" id="round-canvas" width="900" height="500" tabindex="0" aria-label="${game==='catcher'?'Drag to move your basket':game==='bowling'?'Drag to aim your bowling ball':'Drag each puzzle piece into its matching space. Arrow keys move the piece; Enter places it.'}"></canvas><div class="game-footer">${game==='bowling'?'<div class="throw-pictures" aria-label="Three throws">'+A.icon('ball')+A.icon('ball')+A.icon('ball')+'</div>'+this.btn('roll','ball','Roll the bowling ball'):game==='jigsaw'?this.btn('prev-piece','back','Previous puzzle piece')+`<button id="guide-toggle" data-action="guide" aria-label="Show or hide the puzzle picture guide" aria-pressed="${this.round.state.guide}">${A.icon('mirror')}</button>`+this.btn('next-piece','play','Next puzzle piece'):A.icon('hand')}</div></div>`;
  const meter=$('round-meter');$('panel-head').insertBefore(meter,$('panel-close'));this.cv=$('round-canvas');if(game==='jigsaw')this.cv.height=430;this.cc=this.cv.getContext('2d');this.selection=this.remaining()[0]||0;
  this.cv.onpointerdown=e=>this.roundDown(e);this.cv.onpointermove=e=>this.roundMove(e);this.cv.onpointerup=e=>this.roundUp(e);this.cv.onpointercancel=()=>{this.drag=null;};this.cv.onlostpointercapture=()=>{this.drag=null;};
  this.cv.onkeydown=e=>{if(innerHeight>innerWidth||this.round?.game!=='jigsaw')return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();if(!this.drag){const p=this.puzzleRects();this.drag={id:-1,x:p.tray.x,y:p.tray.y,piece:this.selection};}if(e.key==='ArrowLeft')this.drag.x-=15;if(e.key==='ArrowRight')this.drag.x+=15;if(e.key==='ArrowUp')this.drag.y-=15;if(e.key==='ArrowDown')this.drag.y+=15;if(e.key==='Enter'||e.key===' ')this.dropPiece();this.drawRound();}};
  this.cv.focus();this.drawRound();this.raf=requestAnimationFrame(ms=>this.tick(ms));
 }
 remaining(){if(!this.round||this.round.game!=='jigsaw')return[];return Array.from({length:this.round.pieces},(_,n)=>n).filter(n=>!this.round.state.placed.includes(n));}
 selectPiece(dir){const rem=this.remaining();if(!rem.length)return;const n=rem.indexOf(this.selection);this.selection=rem[(n+dir+rem.length)%rem.length];this.drag=null;this.drawRound();}
 pointer(e){const r=this.cv.getBoundingClientRect(),fit=Math.min(r.width/this.cv.width,r.height/this.cv.height),left=r.left+(r.width-this.cv.width*fit)/2,top=r.top+(r.height-this.cv.height*fit)/2;return{x:(e.clientX-left)/fit,y:(e.clientY-top)/fit};}
 roundDown(e){if(!this.round||this.round.status!=='play'||e.button>0)return;e.preventDefault();this.cv.focus();const p=this.pointer(e);this.cv.setPointerCapture(e.pointerId);
  if(this.round.game==='jigsaw'){const r=this.puzzleRects();if(Math.abs(p.x-r.tray.x)<r.cw*.7&&Math.abs(p.y-r.tray.y)<r.ch*.7)this.drag={id:e.pointerId,piece:this.selection,x:p.x,y:p.y};}
  else{this.drag={id:e.pointerId};this.updateAim(p);}
 }
 roundMove(e){if(this.drag?.id!==e.pointerId)return;const p=this.pointer(e);if(this.round.game==='jigsaw')Object.assign(this.drag,p);else this.updateAim(p);this.drawRound();}
 roundUp(e){if(this.drag?.id!==e.pointerId)return;if(this.round.game==='jigsaw'){Object.assign(this.drag,this.pointer(e));this.dropPiece();}else{this.drag=null;this.saveRound();}try{this.cv.releasePointerCapture(e.pointerId);}catch(_){}this.drawRound();}
 updateAim(p){if(this.round.game==='catcher')this.round.state.basket=A.clamp((p.x-70)/760,0,1);else if(this.round.game==='bowling')this.round.state.aim=A.clamp((p.x-450)/280,-1,1);}
 puzzleRects(){const n=Math.sqrt(this.round.pieces),bw=540,bh=371.25;return{n,bw,bh,x:28,y:25,cw:bw/n,ch:bh/n,tray:{x:736,y:220}};}
 dropPiece(){if(!this.drag||!this.round)return;const r=this.puzzleRects(),i=this.drag.piece,cx=r.x+(i%r.n+.5)*r.cw,cy=r.y+(Math.floor(i/r.n)+.5)*r.ch;
  if(Math.abs(this.drag.x-cx)<r.cw*.48&&Math.abs(this.drag.y-cy)<r.ch*.48){this.round.state.placed.push(i);this.selection=this.remaining()[0]||0;this.sound();this.saveRound().then(()=>{if(this.round?.state.placed.length===this.round.pieces)this.finish();});}
  this.drag=null;
 }
 async saveRound(){const s=this.round;if(!s||s.status!=='play'||this.demo)return;try{await this.service.run('progress',{session:s.id,state:clone(s.state)});}catch(e){this.error(e);}}
 async finish(){if(this.demo){cancelAnimationFrame(this.raf);this.round.status='done';this.result({session:{...this.round,result:{score:this.round.game==='bowling'?this.round.state.score:this.round.state.caught.length,coins:0}}});return;}if(!this.round||this.round.status!=='play'||this.finishing)return;this.finishing=true;const s=this.round,epoch=this.epoch;const r=await this.tx('finish',{session:s.id,state:clone(s.state)});this.finishing=false;if(!r||epoch!==this.epoch)return;cancelAnimationFrame(this.raf);this.round=clone(r.value.session);this.sound(true);this.result(r.value);}
 result(v){$('panel').classList.remove('playing');$('round-meter')?.remove();const s=v.session;$('panel-body').innerHTML=`<div class="round-result">${A.icon('check')}<div class="earned">${A.icon(s.game==='catcher'?'star':s.game==='bowling'?'pins':'puzzle')}<span>${s.result.score}</span>${this.price(s.result.coins)}</div>${v.prize?`<img src="${this.img(v.prize)}" width="90" height="90" alt="New arcade prize">`:''}${this.btn('play-again','play',s.game==='jigsaw'?'Choose another puzzle':'Play another round','data-game="'+s.game+'"')}${this.btn('prizes','star','Choose your next prize')}</div>${this.stamps()}`;this.w.announce(this.demo?'Free demonstration finished. Your wallet and prize stamps are unchanged.':'Round complete. '+s.result.coins+' coins returned and one prize stamp earned.');}
 tick(ms){if(this.kind!=='round'||!this.round||this.round.status!=='play')return;const dt=this.last?Math.min(.06,(ms-this.last)/1000):0;this.last=ms;
  if(!document.hidden&&innerWidth>=innerHeight){if(this.round.game==='catcher'){const s=this.round.state;s.elapsed=Math.min(30,s.elapsed+dt);for(let i=0;i<20;i++){const y=(s.elapsed-i*1.3)/4*385;if(y>=372&&y<=414&&Math.abs(this.starX(i)-(70+s.basket*760))<62&&!s.caught.includes(i))s.caught.push(i);}if(s.elapsed>=30){this.finish();return;}}
   if(this.ball){this.ball.t+=dt;if(this.ball.t>=1.7){const n=this.ball.pins;this.round.state.throws++;this.round.state.score+=n;this.ball=null;this.sound(n>=7);this.saveRound().then(()=>{if(this.round?.state.throws===3)this.finish();});}}
   this.saveAt+=dt;if(this.saveAt>1){this.saveAt=0;this.saveRound();}}
  this.drawRound();this.raf=requestAnimationFrame(t=>this.tick(t));
 }
 starX(i){return 90+((i*193+71)%720);}
 roll(){
 if(!this.round||this.round.game!=='bowling'||this.round.status!=='play'||this.ball||this.round.state.throws>=3||innerHeight>innerWidth)return;
 const aim=this.round.state.aim,n=Math.abs(aim)>.85?0:Math.max(1,Math.round(10-Math.abs(aim)*8));
 const target=450+aim*125,ordered=this.pinPositions().map((p,i)=>({i,d:Math.abs(p.x-target)})).sort((a,b)=>a.d-b.d);
 this.ball={t:0,aim,pins:n,hits:ordered.slice(0,n).map(p=>p.i)};this.drawRound();
 }
 paintCatcher(c,state,preview=false){
 const ratio=c.canvas.height/500;c.drawImage(this.w.images.arcade,0,0,900,c.canvas.height);
 for(let i=0;i<20;i++){const y=(state.elapsed-i*1.3)/4*385;if(y>=-25&&y<410&&!state.caught.includes(i))A.picture(c,'star',this.starX(i),(y+23)*ratio,48,48);}
 const x=70+state.basket*760;A.picture(c,'catching-basket',x,460*ratio,128,86);A.unicorn(c,52,493*ratio,74,this.p().outfit,preview?'u_idle0':'u_happy1');
 }
 pinPositions(){const pins=[];for(let row=3;row>=0;row--)for(let j=0;j<=row;j++)pins.push({x:450+(j-row/2)*34,y:161-row*15});return pins;}
 paintBowling(c,state,ball){
 const ratio=c.canvas.height/500;c.drawImage(A.images['bowling-background'],0,0,900,c.canvas.height);
 const pins=this.pinPositions(),after=ball?Math.max(0,ball.t-1):0;
 pins.forEach((p,n)=>{const hit=ball?.hits.includes(n)&&after>0,cascade=Math.max(0,after-n*.012);c.save();c.translate(p.x+(hit?Math.sign(p.x-450||1)*cascade*29:0),p.y*ratio+(hit?cascade*14:0));if(hit)c.rotate(Math.sign(p.x-450||1)*Math.min(1.5,cascade*3.4));A.picture(c,'bowling-pin',0,0,19,43);c.restore();});
 const aim=ball?.aim??state.aim,target=450+aim*125;
 if(!ball){c.save();c.setLineDash([9,9]);A.line(c,[[450,450*ratio],[target,160*ratio]],'#fff6cf',4);c.restore();A.picture(c,'hand',target,189*ratio,30,30);}
 const t=ball?Math.min(1,ball.t):0,x=450+(target-450)*t,y=(450-t*292)*ratio,size=58-t*31;
 if(!ball||ball.t<1.2){c.save();c.translate(x,y);if(ball)c.rotate(t*7);A.picture(c,'ball',0,size/2,size,size);c.restore();}
 }
 drawRound(){const s=this.round;if(!s||!this.cc||this.kind!=='round')return;const c=this.cc;if(s.game!=='jigsaw'){const r=this.cv.getBoundingClientRect(),height=Math.max(150,Math.round(900*r.height/r.width));if(this.cv.height!==height)this.cv.height=height;}c.clearRect(0,0,900,this.cv.height);
  if(s.game==='jigsaw'){const r=this.puzzleRects(),pic=UWPuzzles.picture(s.puzzle);c.fillStyle='#e6d3e5';c.fillRect(0,0,900,500);A.rect(c,r.x-5,r.y-5,r.bw+10,r.bh+10,4,'#fdf0dc','#997cae',3);
   if(s.state.guide){c.save();c.globalAlpha=.22;c.drawImage(pic,r.x,r.y,r.bw,r.bh);c.restore();}
   for(let i=0;i<s.pieces;i++){const col=i%r.n,row=Math.floor(i/r.n),x=r.x+col*r.cw,y=r.y+row*r.ch;if(s.state.placed.includes(i))c.drawImage(pic,col*pic.width/r.n,row*pic.height/r.n,pic.width/r.n,pic.height/r.n,x,y,r.cw,r.ch);c.strokeStyle='#b994bf';c.lineWidth=1;c.strokeRect(x,y,r.cw,r.ch);}
   const i=this.drag?.piece??this.selection;if(!s.state.placed.includes(i)){const pos=this.drag||r.tray;c.save();c.shadowColor='#73517d';c.shadowBlur=5;c.drawImage(pic,(i%r.n)*pic.width/r.n,Math.floor(i/r.n)*pic.height/r.n,pic.width/r.n,pic.height/r.n,pos.x-r.cw/2,pos.y-r.ch/2,r.cw,r.ch);c.restore();c.strokeStyle='#765287';c.lineWidth=3;c.strokeRect(pos.x-r.cw/2,pos.y-r.ch/2,r.cw,r.ch);}
   $('round-meter').innerHTML=A.icon('puzzle')+`<span>${s.state.placed.length} / ${s.pieces}</span>`;
  }else if(s.game==='catcher'){
   this.paintCatcher(c,s.state);$('round-meter').innerHTML=A.icon('star')+'<span>'+s.state.caught.length+' / 20</span>'+A.icon('basket')+'<span>'+Math.ceil(30-s.state.elapsed)+'</span>';
  }else{
   this.paintBowling(c,s.state,this.ball);$('round-meter').innerHTML=(this.demo?A.icon('hand'):'')+A.icon('pins')+'<span>'+s.state.score+' / 30</span><span>'+s.state.throws+' / 3</span>';
   const b=$('panel-body').querySelector('[data-action="roll"]');$('panel-body').querySelectorAll('.throw-pictures img').forEach((im,n)=>im.classList.toggle('used',n<s.state.throws));if(b){b.disabled=!!this.ball||s.state.throws>=3;b.setAttribute('aria-label',this.ball?'Bowling ball rolling':'Roll the bowling ball');}
  }
 }
}
window.UWMall=Mall;
})();
