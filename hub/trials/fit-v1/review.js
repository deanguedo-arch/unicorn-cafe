(async function(){'use strict';
const $=id=>document.getElementById(id),names={u_idle0:'Standing',u_run2:'Running sample',u_happy1:'Celebrating',bike0:'Bike sample',skateboard0:'Skateboard sample'};
let frame='u_idle0',flip=false,moving=false,x=320,y=380,last=0,phase=0,portrait=false,drag=null,ready=false;
function outfit(){return {head:$('bow').checked?'bow':null,body:$('tee').checked?'tee':null,accessory:$('beads').checked?'beads':null};}
function resize(){portrait=innerHeight>innerWidth;$('rotate').hidden=!portrait;if(portrait)drag=null;last=0;}addEventListener('resize',resize);resize();
function draw(t){requestAnimationFrame(draw);if(!ready||portrait||document.hidden){last=0;return;}const dt=last?Math.min((t-last)/1000,.05):0;last=t;if(moving&&!drag)phase+=dt;
 const scale=Number($('size').value)/100,dx=moving&&!drag?Math.sin(phase*1.4)*70:0,dy=moving&&!drag?Math.sin(phase*2)*4:0,angle=moving&&!drag?Math.sin(phase*1.4)*.03:0;
 for(const id of ['current','trial']){const c=$(id).getContext('2d');c.clearRect(0,0,640,440);c.save();c.strokeStyle='#c9b6cf';c.beginPath();c.moveTo(0,380);c.lineTo(640,380);c.stroke();c.restore();}
 UWFitTrial.draw($('trial').getContext('2d'),frame,x+dx,y+dy,{scale,flip,angle,outfit:outfit()});
 const c=$('current').getContext('2d'),p=UWArt.poses[frame],[l,top,r,b]=p.bounds,ride=frame.startsWith('bike')?'bike':frame.startsWith('skateboard')?'skateboard':null;
 // Both actors use the trial's uniform native-unit scale. Current clothes use the unchanged game renderer.
 c.save();c.translate(x+dx,y+dy);c.rotate(angle);
 if(!ride)c.translate(((l+r)/2-96)*scale*2*(flip?-1:1),(b-184.5)*scale*2);
 let h=(b-top)*scale*2;if(ride)h-=ride==='bike'?42:22;
 UWArt.unicorn(c,0,0,h,outfit(),ride?'u_idle0':frame,flip,ride);c.restore();
}
for(const id of ['current','trial']){
 const canvas=$(id),pos=e=>{const b=canvas.getBoundingClientRect();return[(e.clientX-b.left)*640/b.width,(e.clientY-b.top)*440/b.height];};
 canvas.addEventListener('pointerdown',e=>{if(!ready||portrait)return;const [px,py]=pos(e);drag={id:e.pointerId,dx:x-px,dy:y-py};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const [px,py]=pos(e);x=Math.max(120,Math.min(520,px+drag.dx));y=Math.max(260,Math.min(420,py+drag.dy));});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
}
$('flip').onclick=()=>{flip=!flip;$('flip').setAttribute('aria-pressed',flip);$('flip').textContent=flip?'Face right':'Face left';};
$('move').onclick=()=>{moving=!moving;$('move').setAttribute('aria-pressed',moving);$('move').textContent=moving?'Stop':'Move';};
$('reset').onclick=()=>{x=320;y=380;phase=0;};
requestAnimationFrame(draw);
try{
 // The pack includes the exact old sources, avoiding a load of the entire wardrobe for a three-item review.
 const sources={'item:bow':'original_bow.png','item:tee':'original_tee-v2.png','item:beads':'original_beads.png',
  [UWArtSprites.bodies.tee.u_idle0.source]:'original_tee-v2.png',
  [UWArtSprites.rides.bike.bike0.source]:'original_bike-riding-v2.png',
  [UWArtSprites.rides.skateboard.skateboard0.source]:'original_skateboard-riding-v2.png',
  u_idle0:'original_u_idle0.webp',u_run2:'original_u_run2.webp',u_happy1:'original_u_happy1.webp'};
 const current=Promise.all(Object.entries(sources).map(([key,file])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{UWArt.images[key]=im;resolve();};im.onerror=()=>reject(Error('Current source unavailable: '+file));im.src='sources/'+file;})));
 const [manifest]=await Promise.all([UWFitTrial.load(),current]);
 for(const r of manifest.records){const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',names[r.frame_id]);button.setAttribute('aria-pressed',r.frame_id===frame);const img=new Image();img.src=r.base_file;img.alt='';button.append(img);const span=document.createElement('span');span.textContent=names[r.frame_id];button.append(span);button.onclick=()=>{frame=r.frame_id;for(const b of $('poses').children)b.setAttribute('aria-pressed',b===button);};$('poses').append(button);}
 ready=true;$('status').textContent='Five poses · local trial';
 window.__FIT_REVIEW__={get state(){return {frame,flip,moving,portrait,ready,x,y,outfit:outfit()};}};
}catch(e){$('status').textContent='Could not load trial: '+e.message;console.error(e);}
})();
