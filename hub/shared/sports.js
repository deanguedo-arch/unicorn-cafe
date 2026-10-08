/* Sports Park V3: supplied art, isolated progression, continuous three-region terrain. */
(()=>{'use strict';const D=UWSportsData,A=UWArt,root=new URL('../assets/sports/v3/',document.currentScript.src),clamp=A.clamp,STORE='unicorn-world-sports-v3',S=.28;
const stations=[{id:'bike',x:600,y:650,picture:'wheel'},{id:'skate',x:1040,y:740,picture:'wheel'},{id:'basketball',x:359,y:1616,picture:'ball'},{id:'tennis',x:1180,y:1665,picture:'ball'},{id:'volleyball',x:488,y:2580,picture:'ball'}];
const LEVELS=[{speed:1.75,ai:65,reaction:.45,tolerance:32},{speed:1.25,ai:130,reaction:.25,tolerance:43},{speed:.9,ai:210,reaction:.12,tolerance:50}],SPOTS=[{x:359,y:1460},{x:230,y:1570},{x:500,y:1570}];
const gates=[{x:280,y:220},{x:140,y:500},{x:570,y:665}],ramps=[{id:'shallow-bank',x:1190,y:370},{id:'rounded-roller',x:1180,y:610}];
const poly=(x,y,pts)=>{let hit=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [a,b]=pts[i],[c,d]=pts[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;};
const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
const rect=(x,y,a,b,w,h)=>x>a&&x<a+w&&y>b&&y<b+h;
class Park{
 constructor(w){this.w=w;this.im={};this.ready=false;this.loading=null;this.mode=null;this.pose=null;this.age=0;this.ball=null;this.pointer=null;this.queued=false;this.aim=0;this.progress={bike:[],skate:[],basketball:0,tennis:0,volleyball:0,completed:[]};this.camera={x:0,y:0};this.volleyStage=0;this.time=0;this.opponentScores={tennis:0,volleyball:0};this.opponent={x:1143,y:1315,moving:false};this.rallyIndex=0;this.matchOver=false;this.ladder={tennis:{level:0,unlocked:0,wins:[]},volleyball:{level:0,unlocked:0,wins:[]}};this.charging=false;this.charge=0;
 try{const p=JSON.parse(localStorage.getItem(STORE));if(p?.version===1){for(const k of ['bike','skate'])this.progress[k]=Array.isArray(p.progress?.[k])?[...new Set(p.progress[k].filter(n=>Number.isInteger(n)&&n>=0&&n<(k==='bike'?3:2)))]:[];for(const k of ['basketball','tennis','volleyball'])this.progress[k]=clamp(Number(p.progress?.[k])||0,0,3);this.progress.completed=(p.progress?.completed||[]).filter(k=>stations.some(s=>s.id===k));this.mode=stations.some(s=>s.id===p.mode)&&!['bike','skate'].includes(p.mode)?p.mode:null;for(const k of ['tennis','volleyball'])this.opponentScores[k]=clamp(Number(p.opponentScores?.[k])||0,0,3);}}catch(_){}
 try{const p=JSON.parse(localStorage.getItem(STORE));for(const id of ['tennis','volleyball']){const l=p?.ladder?.[id];if(l)this.ladder[id]={level:clamp(Math.floor(l.level)||0,0,2),unlocked:clamp(Math.floor(l.unlocked)||0,0,2),wins:(l.wins||[]).filter(n=>[0,1,2].includes(n))};if(!l&&this.progress.completed.includes(id)){this.ladder[id].unlocked=1;this.ladder[id].wins=[0];}this.ladder[id].level=Math.min(this.ladder[id].level,this.ladder[id].unlocked);}}catch(_){}
 this.installUI();if(this.mode){this.opponent={x:this.mode==='tennis'?1143:1085,y:this.mode==='tennis'?1315:2580,moving:false};this.matchOver=(this.opponentScores[this.mode]||0)>=(3);this.resetRally();if(this.ball)this.ball.phase='waiting';}
 }
 save(){try{localStorage.setItem(STORE,JSON.stringify({version:1,mode:this.mode,progress:this.progress,opponentScores:this.opponentScores,ladder:this.ladder}));}catch(_){this.w.announce('Sports progress could not save. Your world purchases are unchanged.');}}
 installUI(){this.hud=document.createElement('div');this.hud.id='sports-tools';this.hud.hidden=true;this.hud.innerHTML='<div id="sports-levels"></div><div id="sports-progress" role="status"></div><button id="sports-retry" aria-label="Play this activity again">'+A.icon('play')+'</button>';document.body.append(this.hud);document.getElementById('sports-retry').onclick=()=>{if(this.mode)this.begin(this.mode,true);};this.hud.querySelector('#sports-levels').onclick=e=>{const b=e.target.closest('button[data-level]');if(b&&!b.disabled){this.ladder[this.mode].level=Number(b.dataset.level);this.begin(this.mode,true);}};const enter=document.getElementById('enter');enter.addEventListener('pointerdown',e=>{if(this.mode==='basketball'&&!enter.disabled&&!this.flight&&this.ball?.phase!=='loose'&&!this.w.paused?.()){e.preventDefault();this.suppressClick=false;this.powerShot=true;this.charging=true;this.charge=0;this.chargeId=e.pointerId;enter.setPointerCapture(e.pointerId);}});enter.addEventListener('pointerup',e=>{if(this.charging&&e.pointerId===this.chargeId){this.charging=false;this.action();this.suppressClick=true;setTimeout(()=>this.suppressClick=false,500);}});enter.addEventListener('click',e=>{if(this.suppressClick){e.stopImmediatePropagation();e.preventDefault();this.suppressClick=false;}},true);enter.addEventListener('pointercancel',()=>{this.powerShot=false;this.charging=false;this.charge=0;this.suppressClick=true;setTimeout(()=>this.suppressClick=false,500);});}
 async load(){if(this.ready)return;if(this.loading)return this.loading;this.loading=(async()=>{const paths=[...D.world.world.regions.map(r=>r.file),...D.seams.placements.map(s=>'seams/'+s.png),...new Set(D.actions.frames.map(f=>'actions/'+f.source)),...D.props.assets.map(p=>'props/'+p.file),'props/volleyball.png','props/volleyball-net-receding.png','props/basketball-front-coverage-mask.png'];await Promise.all(paths.map(async file=>{const im=new Image();im.src=new URL(file,root);await im.decode();this.im[file]=im;}));const opponents=new Image();opponents.src=new URL('../opponents/challengers.png',root);await opponents.decode();this.opponents=opponents;this.seams=D.seams.placements.map(s=>{const im=this.im['seams/'+s.png],cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const c=cv.getContext('2d');c.drawImage(im,0,0);c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,0,0,cv.height);for(const [y,a]of D.seams.blend_contract.local_y_opacity_knots)g.addColorStop(y/cv.height,`rgba(0,0,0,${a})`);c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);return{canvas:cv,x:s.world_origin[0],y:s.world_origin[1]};});const source=this.im['props/basketball-hoop.png'],mask=this.im['props/basketball-front-coverage-mask.png'],cv=document.createElement('canvas');cv.width=source.width;cv.height=source.height;const c=cv.getContext('2d');c.drawImage(source,0,0);const src=c.getImageData(0,0,cv.width,cv.height);c.clearRect(0,0,cv.width,cv.height);c.drawImage(mask,0,0);const m=c.getImageData(0,0,cv.width,cv.height);for(let i=3;i<src.data.length;i+=4)src.data[i]=Math.round(src.data[i]*m.data[i-3]/255);c.putImageData(src,0,0);this.hoopFront=cv;this.makeIcons();this.ready=true;})().finally(()=>this.loading=null);return this.loading;}
 makeIcons(){this.icons={};for(const id of ['basketball','tennis','volleyball']){const key=id==='tennis'?'tennis-ball':id,p=D.actions.props[key],cv=document.createElement('canvas');cv.width=100;cv.height=100;const b=p.bounds;const ctx=cv.getContext('2d');ctx.drawImage(this.im['props/'+key+'.png'],b[0],b[1],b[2]-b[0],b[3]-b[1],4,4,92,92);this.icons[id]=cv.toDataURL();}for(const f of D.actions.frames){const cv=document.createElement('canvas');cv.width=100;cv.height=100;const [l,t,r,b]=f.source_rect_xyxy,s=Math.min(94/(r-l),94/(b-t)),ctx=cv.getContext('2d');ctx.drawImage(this.im['actions/'+f.source],l,t,r-l,b-t,50-(r-l)*s/2,50-(b-t)*s/2,(r-l)*s,(b-t)*s);this.icons[f.id]=cv.toDataURL();}this.opponentIcons={tennis:[],volleyball:[]};for(const id of ['tennis','volleyball'])for(let row=0;row<2;row++){const cv=document.createElement('canvas');cv.width=cv.height=100;const c=cv.getContext('2d');c.drawImage(this.opponents,id==='tennis'?0:768,row?500:0,768,row?524:490,0,16,100,68);this.opponentIcons[id].push(cv.toDataURL());}}
 walkable(x,y){if(x<65||x>1470||y<20||y>3030)return false;
 let ok=false;if(y<1024){ok=poly(x,y,[[900,0],[1030,0],[990,65],[890,118],[805,160],[810,260],[845,430],[842,570],[875,700],[860,880],[890,1024],[705,1024],[720,880],[732,760],[717,625],[730,530],[732,410],[725,300],[705,180],[685,135],[825,100],[900,55]])|| (ellipse(x,y,385,430,330,320)&&!ellipse(x,y,455,400,250,180))||poly(x,y,[[960,210],[1250,190],[1430,315],[1480,590],[1370,685],[980,660],[900,430]])||rect(x,y,180,620,640,100)||rect(x,y,770,670,660,75);if(ellipse(x,y,455,400,250,180))ok=false;}
 else if(y<2048){const q=y-1024;ok=rect(x,q,690,0,155,1024)||rect(x,q,565,555,420,85)||poly(x,q,[[160,210],[570,210],[620,710],[95,710]])||poly(x,q,[[970,210],[1335,210],[1440,735],[925,735]])||(ellipse(x,q,768,225,190,170)&&!ellipse(x,q,768,225,96,90))||poly(x,q,D.world.geometry.courts.basketball.play_surface_polygon)||poly(x,q,D.world.geometry.courts.tennis.play_surface_polygon)||rect(x,q,120,800,1290,65)||rect(x,q,305,680,95,140)||rect(x,q,1170,675,100,155);if(ellipse(x,q,768,225,96,90)||rect(x,q,320,222,80,40)||rect(x,q,983,430,347,30))ok=false;}
 else{const q=y-2048;ok=rect(x,q,690,0,165,320)||rect(x,q,260,260,1010,95)||rect(x,q,110,180,1295,100)||rect(x,q,140,250,160,495)||rect(x,q,1240,250,150,495)||poly(x,q,D.world.geometry.courts.volleyball.play_surface_polygon)||rect(x,q,100,735,1320,95)||rect(x,q,705,710,130,315)||rect(x,q,380,680,130,100)||rect(x,q,1070,680,130,100);if(rect(x,q,730,320,80,380))ok=false;}
 return ok;}
 stations(){return stations.map(s=>({...s,r:90}));}
 iconFor(id){return this.icons[id]||(['bike','skate'].includes(id)?A.imagePiece(UWCatalog.byId[id==='skate'?'skateboard':'bike']):A.iconURL('door'));}
 actionURL(){if(this.progress.completed.includes(this.mode)||this.matchOver)return A.iconURL('play');if(this.mode!=='basketball')return this.ball?.phase==='waiting'?this.iconFor(this.mode):A.iconURL('hand');if(this.mode==='tennis')return this.icons.tennis_contact;return this.mode==='volleyball'?this.icons[this.volleyStage===0?'volleyball_bump':this.volleyStage===1?'volleyball_set':'volleyball_hit']:this.iconFor(this.mode);}
 focus(player){if(this.mode)return{id:this.mode,x:player.x,y:player.y,action:true};if(player.y<140&&Math.abs(player.x-990)<110)return{id:'park-exit',exit:true,to:'village',x:990,y:45,picture:'home'};const x=player.x,y=player.y,court=x<650&&y>1240&&y<1760?'basketball':x>925&&y>1230&&y<1760?'tennis':x>240&&x<1310&&y>2320&&y<2790?'volleyball':null;return (court?stations.find(s=>s.id===court):stations.find(s=>Math.hypot(x-s.x,y-s.y)<130))||null;}
 begin(id,replay=false){
  if(['bike','skate'].includes(id)){this.stop();this.w.equipment?.();return;}
  if(!stations.some(s=>s.id===id))return;
  this.mode=id;this.cancel();this.queued=false;this.aim=0;this.time=0;this.charging=false;this.charge=0;this.rallyIndex=0;this.matchOver=false;this.opponent={x:id==='tennis'?1143:1085,y:id==='tennis'?1315:2580,moving:false};
  document.getElementById('guide').classList.remove('show');
  if(replay){this.progress[id]=0;this.opponentScores[id]=0;this.progress.completed=this.progress.completed.filter(k=>k!==id);}
  this.matchOver=(this.opponentScores[id]||0)>=(3);const place=stations.find(s=>s.id===id);Object.assign(this.w.player,{x:place.x,y:place.y,facing:1});this.resetRally();if(['tennis','volleyball'].includes(id)&&!this.matchOver&&!this.progress.completed.includes(id)){this.ball.phase='waiting';}this.save();
  this.w.announce({basketball:'Move onto the glowing shooting spot. Hold the ball picture and release as the power bar reaches its marker and the aim ring crosses the hoop. Each basket changes the shooting spot. Collect missed balls.',tennis:'Press the ball to serve, then move onto the landing circle. Returns are automatic. First to three unlocks the next opponent.',volleyball:'Press the ball to serve, then move to the landing circle. Automatic bumps keep the rally going. First to three unlocks the next opponent.'}[id]);
 }
 stop(){const old=this.mode;this.mode=null;this.pose=null;this.ball=null;this.pointer=null;this.queued=false;this.hud.hidden=true;this.save();if(old==='tennis')this.w.player.y=1720;}
 resetRally(){this.age=0;this.queued=false;this.flight=null;this.volleyStage=0;this.ball=null;this.pose=this.mode==='basketball'?'basketball_ready':null;if(this.mode==='tennis'||this.mode==='volleyball')this.serve();}
 cancel(){this.powerShot=false;if(this.charging){this.suppressClick=true;try{document.getElementById('enter').releasePointerCapture(this.chargeId);}catch(_){}}this.charging=false;this.charge=0;const id=this.pointer?.id;this.pointer=null;if(id!==undefined)try{this.w.canvas.releasePointerCapture(id);}catch(_){}}
 leaveWorld(){this.hud.hidden=true;this.cancel();this.save();}
 frame(id=this.pose){return D.actions.frames.find(f=>f.id===id);}
 anchor(id=this.pose,x=this.w.player.x,y=this.w.player.y,facing=this.w.player.facing,exit=false,scale=S){const f=this.frame(id),a=exit?f.ball_handoff_on_exit:f.ball;if(!a)return null;const [px,py]=f.ground_pivot_source,[bx,by]=a.center_source;return{x:x+(bx-px)*f.scale_to_logical*scale*facing,y:y+(by-py)*f.scale_to_logical*scale,diameter:a.visible_diameter_source*f.scale_to_logical*scale,logicalDiameter:a.visible_diameter_source*f.scale_to_logical,kind:a.kind};}
 actor(c,id,x,y,facing=1,scale=S){const f=this.frame(id),[l,t,r,b]=f.source_rect_xyxy,[px,py]=f.ground_pivot_source;c.save();c.translate(x,y);c.scale(facing*scale,scale);c.drawImage(this.im['actions/'+f.source],l,t,r-l,b-t,(l-px)*f.scale_to_logical,(t-py)*f.scale_to_logical,(r-l)*f.scale_to_logical,(b-t)*f.scale_to_logical);c.restore();}
 ballDraw(c,b){if(!b||b.hidden)return;const p=D.actions.props[b.kind],a=p.bounds,im=this.im['props/'+b.kind+'.png'];c.drawImage(im,a[0],a[1],a[2]-a[0],a[3]-a[1],b.x-(a[2]-a[0])*b.diameter/Math.max(a[2]-a[0],a[3]-a[1])/2,b.y-(b.z||0)-(a[3]-a[1])*b.diameter/Math.max(a[2]-a[0],a[3]-a[1])/2,(a[2]-a[0])*b.diameter/Math.max(a[2]-a[0],a[3]-a[1]),(a[3]-a[1])*b.diameter/Math.max(a[2]-a[0],a[3]-a[1]));}
 prop(c,id,x,y,width){const p=D.props.assets.find(p=>p.file===id+'.png'),im=this.im['props/'+id+'.png'],a=p.visible_bounds_alpha_at_least_10_xyxy,s=width/(a[2]-a[0]),pivot=p.suggested_pivot_px;c.drawImage(im,x-pivot[0]*s,y-pivot[1]*s,im.width*s,im.height*s);}
 hoop(){return{x:359-611.5*.1,y:1269-1222*.1,scale:.1,mouth:{x:359.05,y:1269+(570-1222)*.1},bottom:1269+(849-1222)*.1};}
 drawHoop(c){const h=this.hoop(),im=this.im['props/basketball-hoop.png'];c.drawImage(im,h.x,h.y,im.width*h.scale,im.height*h.scale);}
 occludeHoop(c,b){if(!b)return;const h=this.hoop(),cy=b.y-(b.z||0),r=b.diameter/2,zone=D.hoop.clip_bounds_xyxy;if(b.x+r<h.x+zone[0]*h.scale||b.x-r>h.x+zone[2]*h.scale||cy+r<h.y+zone[1]*h.scale||cy-r>h.y+zone[3]*h.scale)return;c.save();c.beginPath();c.rect(b.x-r,cy-r,b.diameter,b.diameter);c.clip();c.drawImage(this.hoopFront,h.x,h.y,this.hoopFront.width*h.scale,this.hoopFront.height*h.scale);c.restore();}
 serve(){
  this.age=0;this.queued=false;this.volleyStage=0;this.pose=null;this.rallyIndex++;
  if(this.progress.completed.includes(this.mode)||this.matchOver){this.ball=null;return;}
  const cycle=(this.rallyIndex*0.381966)%1;
  if(this.mode==='tennis'){
   this.incomingTarget=this.projectCourt('tennis',.15+cycle*.7,.85);
   const start=this.opponentAnchor('tennis');
   const contact=this.anchor('tennis_contact',0,1665,1);
   this.ball={kind:'tennis-ball',diameter:22.4*S,x:start.x,y:start.y,z:0,phase:'in',age:0,start,target:{x:this.incomingTarget.x,y:contact.y},duration:LEVELS[this.ladder.tennis.level].speed*(1-.07*Math.min(4,this.rallyIndex%5))};
  }else if(this.mode==='volleyball'){
   this.incomingTarget={x:488,y:2445+cycle*245};
   const start=this.opponentAnchor('volleyball');
   const contact=this.anchor('volleyball_bump',488,this.incomingTarget.y,1);
   this.ball={kind:'volleyball',diameter:96.815*S,x:start.x,y:start.y,z:0,phase:'in',age:0,start,target:contact,duration:LEVELS[this.ladder.volleyball.level].speed*(1-.07*Math.min(4,this.rallyIndex%5))};
  }
 }
 projectCourt(id,u,v){const q=D.world.geometry.courts[id],p=q.play_surface_polygon,top={x:p[0][0]+(p[1][0]-p[0][0])*u,y:p[0][1]+(p[1][1]-p[0][1])*u},bottom={x:p[3][0]+(p[2][0]-p[3][0])*u,y:p[3][1]+(p[2][1]-p[3][1])*u};return{x:top.x+(bottom.x-top.x)*v,y:1024+top.y+(bottom.y-top.y)*v};}
 action(){
  if(this.suppressClick)return;if(!this.mode)return;if(this.progress.completed.includes(this.mode)||this.matchOver){this.begin(this.mode,true);return;}
  if(this.mode==='basketball'){
   if(this.flight||this.ball?.phase==='loose'||this.pose==='basketball_release')return;
   const spot=SPOTS[this.progress.basketball%3],near=Math.hypot(this.w.player.x-spot.x,this.w.player.y-spot.y)<65;this.shotOffset=(this.aimCursor||0)+(this.powerShot||this.charge>0?(this.charge-.65)*75:0)+(near?0:45);this.charge=0;this.powerShot=false;this.pose='basketball_aim';this.age=0;this.queued=true;
  }else if(this.ball?.phase==='waiting'){this.ball.phase='in';this.ball.age=0;}

 }
 move(dx,dy,dt){
  const p=this.w.player,before={x:p.x,y:p.y};
  if(this.mode==='basketball'){
   if(this.pose==='basketball_aim'||this.pose==='basketball_release')return false;
   const len=Math.max(1,Math.hypot(dx,dy));const x=clamp(p.x+dx/len*185*dt,165,585),y=clamp(p.y+dy/len*185*dt,1335,1660);
   if(this.walkable(x,p.y))p.x=x;if(this.walkable(p.x,y))p.y=y;p.facing=1;
  }else if(this.mode==='tennis'){p.x=clamp(p.x+dx*220*dt,985,1305);p.facing=1;}
  else if(this.mode==='volleyball'){if(['hold','set','hit'].includes(this.ball?.phase))return false;p.y=clamp(p.y+dy*240*dt,2430,2700);p.facing=1;}
  else return null;
  return Math.hypot(p.x-before.x,p.y-before.y)>.1;
 }
 down(e,p){
  if(!['tennis','volleyball'].includes(this.mode))return false;
  if(this.pointer||e.button>0)return true;this.pointer={id:e.pointerId};this.w.canvas.setPointerCapture(e.pointerId);this.pointerMove(e,p);return true;
 }
 pointerMove(e,p){
  if(this.pointer?.id!==e.pointerId)return false;
  if(this.mode==='tennis')this.w.player.x=clamp(p.x,985,1305);
  else if(this.mode==='volleyball'&&!['hold','set','hit'].includes(this.ball?.phase))this.w.player.y=clamp(p.y,2430,2700);
  return true;
 }
 up(e,p,cancel=false){if(this.pointer?.id!==e.pointerId)return false;if(!cancel)this.pointerMove(e,p);this.pointer=null;try{this.w.canvas.releasePointerCapture(e.pointerId);}catch(_){}return true;}
 credit(id){this.point(true,id);}
 point(playerWon,id=this.mode){
  const goal=3;if(playerWon)this.progress[id]=Math.min(goal,this.progress[id]+1);else this.opponentScores[id]=Math.min(goal,(this.opponentScores[id]||0)+1);
  if(this.progress[id]===goal){if(!this.progress.completed.includes(id))this.progress.completed.push(id);this.w.announce('You won! Press the play picture for a new game.');}
  else if((this.opponentScores[id]||0)===goal){this.matchOver=true;this.w.announce('Opponent won this game. Press play to try again.');}
  else this.w.announce(playerWon?'Your point!':'Opponent point. Try the next ball.');
  if(playerWon&&this.progress[id]===3&&this.ladder[id]){const l=this.ladder[id];if(!l.wins.includes(l.level))l.wins.push(l.level);l.unlocked=Math.max(l.unlocked,Math.min(2,l.level+1));}this.save();if(id!=='basketball'){this.pose=null;this.ball={phase:'pause',age:0};}
 }
 opponentFrame(id){const row=this.ladder[id].level-1,col=id==='tennis'?0:768;if(row<0)return null;return{rect:[col,row===0?0:500,768,row===0?490:524],pivot:[id==='tennis'?(row===0?300:326):(row===0?385:422),row===0?474:485],contact:[id==='tennis'?(row===0?639:655):(row===0?640:694),row===0?(id==='tennis'?244:327):(id==='tennis'?245:317)],scale:(id==='tennis'?60:80)/(row===0?430:479)};}
 opponentOffset(id){const f=this.opponentFrame(id);if(!f)return this.anchor(id==='tennis'?'tennis_contact':'volleyball_bump',0,0,-1,false,id==='tennis'?.21:S);return{x:-(f.contact[0]-f.pivot[0])*f.scale,y:(f.contact[1]-f.pivot[1])*f.scale};}
 opponentAnchor(id){const a=this.opponentOffset(id);return {...a,x:this.opponent.x+a.x,y:this.opponent.y+a.y};}
 drawOpponent(c,id,time){const f=this.opponentFrame(id),o=this.opponent;if(!f){this.actor(c,id==='tennis'?'tennis_contact':'volleyball_bump',o.x,o.y,-1,id==='tennis'?.21:S);return;}const [x,y,w,h]=f.rect;c.save();c.translate(o.x,o.y-(o.moving?Math.abs(Math.sin(time*10))*2:0));c.scale(-f.scale,f.scale);c.drawImage(this.opponents,x,y,w,h,-f.pivot[0],-f.pivot[1],w,h);c.restore();}
 opponentMove(target,dt,axis){const speed=LEVELS[this.ladder[this.mode]?.level||0].ai;const o=this.opponent,before=o[axis];o[axis]+=clamp(target-o[axis],-speed*dt,speed*dt);o.moving=Math.abs(before-o[axis])>.1;}
 strokeReturn(id){
  const b=this.ball,a=this.anchor(id==='tennis'?'tennis_contact':'volleyball_bump');this.pose=id==='tennis'?'tennis_contact':'volleyball_bump';this.age=0;
  const impact=(id==='tennis'?b.x-a.x:b.y-a.y);const target=id==='tennis'?this.projectCourt('tennis',clamp((this.w.player.x-985)/320+impact/150,.02,.98),.07):{x:this.opponentAnchor('volleyball').x,y:clamp(this.w.player.y+impact*3+85*Math.sin(this.time),2430,2700)+this.opponentOffset('volleyball').y};
  if(id==='tennis')target.y=this.opponentAnchor('tennis').y;
  Object.assign(b,a,{phase:'out',age:0,start:a,target,duration:LEVELS[this.ladder[id].level].speed*.85,hidden:false});
 }
 tick(dt,moving){
  if(!this.ready)return;this.age+=dt;this.time+=dt;this.moving=moving;const p=this.w.player,b=this.ball;
  if(this.mode==='basketball'){
   const distance=Math.hypot(p.x-359,p.y-1269);if(this.charging)this.charge=Math.min(1,this.charge+dt*.7);this.aimCursor=Math.sin(this.time*2.3)*(10+distance*.12);
   if(this.pose==='basketball_aim'&&this.age>=.18){this.pose='basketball_release';this.age=0;this.queued=false;}
   else if(this.pose==='basketball_release'&&this.age>=.15){const a=this.anchor(),h=this.hoop();this.flight={start:a,target:{x:h.mouth.x+this.shotOffset,y:h.mouth.y},t:0,hit:Math.abs(this.shotOffset)<15};this.pose=null;this.age=0;}
   if(this.flight){const f=this.flight;f.t+=dt;const t=clamp(f.t/1.15,0,1);this.ball={kind:'basketball',diameter:85*S,x:f.start.x+(f.target.x-f.start.x)*t,y:f.start.y+(f.target.y-f.start.y)*t-170*Math.sin(Math.PI*t)};
    if(f.t>1.15)this.ball.y=f.target.y+(f.t-1.15)*190;
    if(f.t>1.7){if(f.hit){this.credit('basketball');this.ball=null;this.pose='basketball_ready';}else{this.ball={kind:'basketball',diameter:85*S,x:clamp(f.target.x,200,550),y:1490+90*Math.sin(this.time),phase:'loose',z:0};this.w.announce('Move to the ball to pick it up.');}this.flight=null;}
   }else if(b?.phase==='loose'&&Math.hypot(p.x-b.x,p.y-b.y)<52){this.ball=null;this.pose='basketball_ready';this.w.announce('Ball collected. Move closer and time your shot.');}
  }
  if(['tennis','volleyball'].includes(this.mode)&&b){
   b.age+=dt;if(b.phase==='pause'){if(b.age>1.0&&!this.matchOver&&!this.progress.completed.includes(this.mode))this.serve();}
   else if(b.phase==='in'){
    const t=clamp(b.age/b.duration,0,1);b.x=b.start.x+(b.target.x-b.start.x)*t;b.y=b.start.y+(b.target.y-b.start.y)*t;b.z=(this.mode==='tennis'?25:105)*Math.sin(Math.PI*t);
    const axis=this.mode==='tennis'?'x':'y';this.opponentMove(this.mode==='tennis'?1143+70*Math.sin(this.time*.8):2580+55*Math.sin(this.time*.8),dt,axis);
    if(t>=1){const contact=this.anchor(this.mode==='tennis'?'tennis_contact':'volleyball_bump'),distance=Math.hypot(b.x-contact.x,b.y-contact.y);
     if(distance<48){this.queued=false;this.strokeReturn(this.mode);}
     else if(b.age>b.duration+.35)this.point(false);
    }
   }   else if(b.phase==='out'){
    const t=clamp(b.age/b.duration,0,1);b.x=b.start.x+(b.target.x-b.start.x)*t;b.y=b.start.y+(b.target.y-b.start.y)*t;b.z=(this.mode==='tennis'?35:160)*Math.sin(Math.PI*t);
    if(this.age>(this.mode==='tennis'?.09:.1))this.pose=null;
    const axis=this.mode==='tennis'?'x':'y',needed=this.mode==='tennis'?b.target.x-this.opponentOffset('tennis').x:b.target.y-this.opponentOffset('volleyball').y;
    if(b.age>LEVELS[this.ladder[this.mode].level].reaction)this.opponentMove(needed,dt,axis);
    if(t>=1){const a=this.opponentAnchor(this.mode);
     if(Math.hypot(b.target.x-a.x,b.target.y-a.y)<LEVELS[this.ladder[this.mode].level].tolerance)this.serve();else this.point(true);
    }
   }
  }
  this.updateUI();
 }
 updateUI(){
  this.hud.hidden=!this.mode;if(!this.mode)return;const n=this.progress[this.mode]||0,goal=3,other=this.opponentScores[this.mode]||0,finished=this.progress.completed.includes(this.mode)||this.matchOver,signature=[this.mode,n,other,finished,this.ladder[this.mode]?.level,this.ladder[this.mode]?.unlocked].join(':');if(this.uiSignature===signature)return;this.uiSignature=signature;
  const levels=document.getElementById('sports-levels');levels.hidden=!this.ladder[this.mode];levels.innerHTML=this.ladder[this.mode]?[0,1,2].map(i=>'<button data-level="'+i+'" aria-label="Opponent '+(i+1)+'" aria-pressed="'+(i===this.ladder[this.mode].level)+'" '+(i>this.ladder[this.mode].unlocked?'disabled':'')+'>'+'<img class="picture-sprite" src="'+(i?this.opponentIcons?.[this.mode]?.[i-1]:this.icons[this.mode+'_ready'])+'" alt="">'+'</button>').join(''):'';document.getElementById('sports-progress').innerHTML='<img class="picture-sprite" src="'+this.icons[this.mode]+'" alt=""><span>'+n+(this.mode==='basketball'?' / '+goal:' : '+other)+'</span>'+(finished?A.icon('check'):'');document.getElementById('sports-retry').hidden=!finished;
 }
 view(){const p=this.w.player;let x=p.x-384,y=p.y-270;if(this.mode==='basketball'){x=0;y=1125;}if(this.mode==='tennis'){x=768;y=1200;}if(this.mode==='volleyball'){x=380;y=2275;}this.camera={x:clamp(x,0,768),y:clamp(y,0,2560)};return this.camera;}
 draw(c,time,moving,outfit){if(!this.ready)return;const camera=this.view();c.save();c.translate(-camera.x,-camera.y);for(const r of D.world.world.regions)if(r.origin[1]<camera.y+512&&r.origin[1]+1024>camera.y)c.drawImage(this.im[r.file],...r.origin);for(const s of this.seams)if(s.y<camera.y+512&&s.y+1024>camera.y)c.drawImage(s.canvas,s.x,s.y);
 const freeActor=!['basketball','tennis','volleyball'].includes(this.mode),p=this.w.player;let freeDrawn=false;const drawFree=()=>{if(!freeActor||freeDrawn)return;freeDrawn=true;const ride=this.w.service.value.owned.includes(this.w.service.value.vehicle)?this.w.service.value.vehicle:null,frame=ride?ride+(moving?Math.floor(time*10)%4:0):moving?'u_run'+Math.floor(time*10)%6:'u_idle'+Math.floor(time*2)%2;const lift=ride==='skateboard'?Math.max(0,...ramps.map(r=>Math.abs(this.w.player.x-r.x)<80?14*Math.max(0,1-Math.abs(this.w.player.y-(r.y-25))/45):0)):0;A.unicorn(c,this.w.player.x,this.w.player.y-lift,80,outfit,frame,this.w.player.facing<0,ride);};
 if(this.mode==='volleyball'&&this.ball?.phase==='in')A.ellipse(c,488,this.incomingTarget.y,44,15,null,'#fff2bd',3);if(this.mode==='tennis'&&this.ball?.phase==='in')A.ellipse(c,this.incomingTarget.x-this.anchor('tennis_contact',0,0,1).x,p.y,44,15,null,'#fff2bd',3);for(const r of ramps)this.prop(c,r.id,r.x,r.y,190);for(const g of gates)this.prop(c,'checkpoint-arch',g.x,g.y,115);if(freeActor&&p.x<650&&p.y>1220&&p.y<1269)drawFree();this.drawHoop(c);
 if(freeActor&&p.x>965&&p.y>1220&&p.y<1469)drawFree();if(this.mode!=='tennis')this.prop(c,'tennis-net',1156.5,1469,347);
 const fit=D.net.court_fit,drawVolleyNet=()=>{const im=this.im['props/volleyball-net-receding.png'];c.drawImage(im,fit.recommended_translation_for_centered_baseline[0],2048+fit.recommended_translation_for_centered_baseline[1],im.width*fit.uniform_scale_to_y_span,im.height*fit.uniform_scale_to_y_span);};
 const drawPlayer=()=>{if(this.pose||['tennis','volleyball'].includes(this.mode))this.actor(c,this.pose||this.mode+'_ready',p.x,p.y-(moving&&!this.pose?Math.abs(Math.sin(time*10))*2:0),p.facing);else A.unicorn(c,p.x,p.y,80,null,moving?'u_run'+Math.floor(time*10)%6:'u_idle'+Math.floor(time*2)%2,false,null);};
 const drawOpponent=()=>this.drawOpponent(c,this.mode,time);
 if(this.mode==='volleyball'){
  drawOpponent();if(this.ball?.kind&&this.ball.x>=768&&(this.ball.z||0)<120)this.ballDraw(c,this.ball);drawVolleyNet();drawPlayer();if(this.ball?.kind&&(this.ball.x<768||(this.ball.z||0)>=120))this.ballDraw(c,this.ball);

 }else{if(freeActor&&p.x>=768&&p.y>2320&&p.y<2780)drawFree();drawVolleyNet();}
 if(this.mode==='basketball'){
  const held=!this.flight&&!this.ball&&this.pose?this.anchor():null;
  if(held&&this.frame().ball.layer==='back')this.ballDraw(c,held);
  drawPlayer();if(held&&this.frame().ball.layer==='front')this.ballDraw(c,held);
  if(this.ball){this.ballDraw(c,this.ball);this.occludeHoop(c,this.ball);}
  if(!this.flight&&!this.ball){const spot=SPOTS[this.progress.basketball%3];A.ellipse(c,spot.x,spot.y,42,16,null,'#fff2bd',4);if(this.charging){c.fillStyle='#fff2bd';c.fillRect(p.x-50,p.y+12,100*this.charge,12);c.strokeStyle='#b789a0';c.strokeRect(p.x-50,p.y+12,100,12);c.fillStyle='#ec8fbd';c.fillRect(p.x+5,p.y+9,20,18);}const h=this.hoop();A.ellipse(c,h.mouth.x+(this.pose==='basketball_aim'||this.pose==='basketball_release'?this.shotOffset:this.aimCursor||0),h.mouth.y,13,9,null,Math.abs(this.aimCursor||0)<15?'#fff2bd':'#eda3cf',3);}
 }else if(this.mode==='tennis'){
  drawOpponent();if(this.ball?.kind&&this.ball.y<1469&&(this.ball.z||0)<30)this.ballDraw(c,this.ball);this.prop(c,'tennis-net',1156.5,1469,347);drawPlayer();if(this.ball?.kind&&(this.ball.y>=1469||(this.ball.z||0)>=30))this.ballDraw(c,this.ball);

 }else if(this.mode!=='volleyball')drawFree();
 if(!this.mode){for(const s of stations){c.save();c.globalAlpha=.9;A.ellipse(c,s.x,s.y,30,13,'#fff1d088','#b789a0',2);if(this.icons[s.id]){const im=this.im['props/'+(s.id==='tennis'?'tennis-ball':s.id)+'.png'];this.ballDraw(c,{kind:s.id==='tennis'?'tennis-ball':s.id,x:s.x,y:s.y-18,diameter:25});}else{const im=A.images['item:'+(s.id==='skate'?'skateboard':'bike')];if(im)A.sprite(c,im,s.x,s.y-10,35,30);}c.restore();}}

 c.restore();}
}
window.UWSportsPark=Park;
})();
