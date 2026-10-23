/* Bedroom play is transient: toys and outfits return unchanged when play ends. */
(()=>{'use strict';
const A=UWArt, $=id=>document.getElementById(id);
const parts={sleep:[0,0,850,512],water:[865,0,671,530],track:[0,530,870,494],sun:[875,530,661,494]};
class Bedroom {
 constructor(play){this.play=play;this.m=play.m;this.mode='idle';this.age=0;this.actor={x:760,y:730};this.raf=0;this.last=0;this.ready=false;this.failed=false;this.sheet=new Image();this.sheet.onload=()=>{this.ready=true;this.failed=false;this.buttons();};this.sheet.onerror=()=>{this.ready=false;this.failed=true;this.buttons();this.m.w.announce('Bedroom pictures could not load. Tap retry.');};this.load();}
 load(){this.ready=false;this.failed=false;this.buttons();this.loadVersion=(this.loadVersion||0)+1;this.sheet.src='./assets/playbook/bedroom-play.png'+(this.loadVersion>1?'?retry='+this.loadVersion:'');}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.mode='idle';this.target=null;this.pointer=null;}
 mount(){this.stop();this.actor={x:760,y:730};$('panel-body').innerHTML='<canvas id="bedroom-canvas" aria-label="Play in your bedroom. Tap the bed, toys, plant or a picture button."></canvas><nav id="bedroom-actions" aria-label="Bedroom activities"></nav>';
 this.cv=$('bedroom-canvas');this.cv.onpointerdown=e=>{if(e.button>0)return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};this.cv.setPointerCapture(e.pointerId);};this.cv.onpointerup=e=>{const start=this.pointer;this.pointer=null;if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)return;const r=this.play.rect(this.cv);this.tap({x:(e.clientX-r.r.left-r.left)/r.s,y:(e.clientY-r.r.top-r.top)/r.s});};this.cv.onpointercancel=this.cv.onlostpointercapture=()=>{this.pointer=null;};
 this.buttons();const next=ms=>{if(this.m.kind!=='room-play')return;this.raf=requestAnimationFrame(next);const paused=document.hidden||innerHeight>innerWidth,dt=this.last&&!paused?Math.min(.04,(ms-this.last)/1000):0;this.last=paused?0:ms;this.tick(dt);this.draw();};this.raf=requestAnimationFrame(next);const pending=this.play.roomAction;this.play.roomAction=null;if(pending)this.act(pending);}
 button(id,label,art){return '<button data-action="book-room-action" data-room-action="'+id+'" aria-label="'+label+'" aria-pressed="'+(this.mode===id)+'">'+art+'</button>';}
 picture(part){return '<span class="bedroom-sprite bedroom-'+part+'" aria-hidden="true"></span>';}
 buttons(){const n=$('bedroom-actions');if(!n||this.m.kind!=='room-play')return;
 n.innerHTML=this.button('jump','Bounce on the bed','<canvas id="bedroom-jump-picture" width="120" height="100" aria-hidden="true"></canvas>')+this.button(this.mode==='sleep'?'wake':'sleep',this.mode==='sleep'?'Wake up':'Go to sleep',this.mode==='sleep'?this.picture('sun'):A.icon('moon'))+this.button('teddy','Cuddle your teddy',this.play.art('teddy'))+this.button('train','Play with your train',this.play.art('train'))+this.button('water','Water your plant',this.play.art('plant'))+this.button('decorate','Arrange your room',A.icon('hanger'))+this.button('sound',this.m.p().settings.muted?'Turn sound on':'Mute sound',A.icon(this.m.p().settings.muted?'mute':'sound'));
 const jump=$('bedroom-jump-picture').getContext('2d');if(this.play.room.complete&&this.play.room.naturalWidth)jump.drawImage(this.play.room,960,210,470,310,0,35,120,65);A.unicorn(jump,62,60,58,this.m.p().outfit,'u_happy1',false,null);
 if(this.failed)n.insertAdjacentHTML('beforeend',this.button('retry','Retry bedroom pictures',A.icon('retry')));if(!this.ready)for(const id of ['sleep','water','train'])n.querySelector('[data-room-action="'+id+'"]')?.setAttribute('disabled','');
 }
 location(id,fallback){const p=this.m.p().decor.placements[id];return p?{x:p.x*1536,y:p.y*1024}:fallback;}
 act(id){if(this.m.kind!=='room-play')return;if(id==='decorate'){this.m.open('decorate');return;}if(id==='retry'){this.load();return;}if(id==='sound'){this.m.toggleSound();return;}if(['sleep','water','train'].includes(id)&&!this.ready){this.m.w.announce('Bedroom pictures are loading.');return;}if(!['jump','sleep','wake','teddy','train','water'].includes(id))return;
 this.target=null;this.age=0;this.mode=id==='wake'?'idle':id;this.pointer=null;
 if(id==='jump')this.actor={x:1180,y:340};else if(id==='wake')this.actor={x:1050,y:600};else if(id==='water'){const plant=this.location('plant',{x:650,y:735});this.actor={x:Math.max(150,plant.x-180),y:Math.max(200,Math.min(970,plant.y+20))};}else if(id==='train')this.actor={x:1080,y:760};else if(id==='teddy')this.actor={x:850,y:735};
 this.buttons();this.m.sound();this.m.w.announce({jump:'Boing! Tap the bed picture to bounce again.',sleep:'Good night. Tap the sun to wake up.',wake:'Good morning!',teddy:'A cuddle for teddy.',train:'Round goes the train. Tap it to send it around again.',water:'A drink for your flowers.'}[id]);}
 tap(p){if(this.mode==='sleep'){this.act('wake');return;}if(p.x<0||p.x>1536||p.y<0||p.y>1024)return;
 const placements=this.m.p().decor.placements;for(const id of ['teddy','train','plant']){const q=placements[id];if(q&&Math.abs(p.x-q.x*1536)<110&&p.y<q.y*1024+25&&p.y>q.y*1024-150){this.act(id==='plant'?'water':id);return;}}
 if(p.x>970&&p.x<1460&&p.y>160&&p.y<500){this.act('jump');return;}
 // Floor taps end the current activity. The stairs and furniture remain clear.
 if(p.x>=370&&p.x<=1430&&p.y>=565&&p.y<=930&&(p.x>=500||p.y>=800)){if(this.mode==='jump')this.actor={x:1050,y:600};this.mode='idle';this.age=0;this.target=p;this.buttons();}}
 tick(dt){this.age+=dt;if(this.target){const dx=this.target.x-this.actor.x,dy=this.target.y-this.actor.y,d=Math.hypot(dx,dy),step=330*dt;if(d<=step){this.actor={...this.target};this.target=null;}else{this.actor.x+=dx/d*step;this.actor.y+=dy/d*step;}}
 if((this.mode==='jump'&&this.age>=3.3)||(this.mode==='teddy'&&this.age>=4)||(this.mode==='water'&&this.age>=4.5)||(this.mode==='train'&&this.age>=10)){this.mode='idle';this.age=0;this.actor={x:850,y:735};this.buttons();}}
 sprite(c,id,x,y,w){if(!this.ready)return;const r=parts[id];c.drawImage(this.sheet,...r,x-w/2,y-w*r[3]/r[2],w,w*r[3]/r[2]);}
 draw(){const cv=this.cv;if(!cv?.isConnected)return;const {r,left,top,s}=this.play.rect(cv),d=Math.min(devicePixelRatio||1,2);if(cv.width!==Math.round(r.width*d)||cv.height!==Math.round(r.height*d)){cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);}const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);c.fillStyle='#503a63';c.fillRect(0,0,r.width,r.height);c.save();c.translate(left,top);c.scale(s,s);c.beginPath();c.rect(0,0,1536,1024);c.clip();const backdrop=this.play.room.naturalWidth?this.play.room:this.m.w.images['home-upstairs'];if(backdrop?.complete&&backdrop.naturalWidth)c.drawImage(backdrop,0,0,1536,1024);
 const omit=this.mode==='train'?['train']:this.mode==='teddy'?['teddy']:[];const layers=[];
 if(this.mode==='sleep'){this.play.drawRoomObjects(c,omit);const breath=Math.sin(this.age*1.5)*1.6;this.sprite(c,'sleep',1245,350+breath,310);c.fillStyle='rgba(35,27,83,.35)';c.fillRect(0,0,1536,1024);c.restore();return;}
 if(this.mode==='train'){layers.push({y:-Infinity,draw:()=>this.sprite(c,'track',750,850,590)});const a=this.age*Math.PI*.6;const x=750+245*Math.cos(a),y=655+105*Math.sin(a);layers.push({y,draw:()=>{c.save();c.translate(x,y);if(Math.sin(a)<0)c.scale(-1,1);this.play.drawSprite(c,'train',0,0,145);c.restore();}});}
 let x=this.actor.x,y=this.actor.y,frame=this.target?'u_run'+Math.floor(this.age*10)%6:'u_idle'+Math.floor(this.age*2)%2;
 if(this.mode==='jump'){const phase=(this.age%1.1)/1.1;y-=Math.sin(phase*Math.PI)*100;frame='u_happy'+Math.floor(this.age*6)%3;}
 if(this.mode==='teddy'){x+=Math.sin(this.age*3)*5;frame='u_happy'+Math.floor(this.age*3)%3;}
 layers.push({y:this.actor.y,draw:()=>{A.unicorn(c,x,y,155,this.m.p().outfit,frame,false,null);
 if(this.mode==='teddy')this.play.drawSprite(c,'teddy',x+22,y-10,105);}});
 this.play.drawRoomObjects(c,omit,layers);
 if(this.mode==='water'){const plant=this.location('plant',{x:650,y:735});if(!this.m.p().decor.placements.plant)this.play.drawSprite(c,'plant',plant.x,plant.y,180);this.sprite(c,'water',plant.x-40,plant.y+15+Math.sin(this.age*4)*5,140);if(this.age>2){c.save();c.globalAlpha=Math.sin((this.age-2)*Math.PI/2)*.8;A.picture(c,'flower',plant.x,plant.y-145,45,45);c.restore();}}
 c.restore();}
}
window.UWBedroom=Bedroom;
})();
