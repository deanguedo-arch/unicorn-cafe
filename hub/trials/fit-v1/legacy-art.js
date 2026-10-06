/* Illustrated wardrobe and controls. Canonical unicorn pixels remain unchanged. */
(function(root){'use strict';
const C=root.UWCatalog,M=root.UWArtSprites,images={},pending={},ink='#694574';
const scriptURL=document.currentScript.src,assetRoot=new URL('../assets/',scriptURL),siteRoot=new URL('../../',scriptURL);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function path(c,fn,fill,stroke=ink,w=2){c.beginPath();fn(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke=ink,w=2){path(c,()=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2),fill,stroke,w);}
function rect(c,x,y,w,h,r,fill,stroke=ink,lw=2){path(c,()=>c.roundRect(x,y,w,h,r),fill,stroke,lw);}
function line(c,pts,col=ink,w=2){path(c,()=>pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p)),null,col,w);}
function star(c,x,y,r,col='#f5d67d'){path(c,()=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,n=i%2?r*.43:r;c[i?'lineTo':'moveTo'](x+Math.cos(a)*n,y+Math.sin(a)*n);}c.closePath();},col,null);}
const poses={
 u_idle0:{bounds:[33,44,159,185],head:[114,70],body:[98,137],eyes:[130,108],neck:[130,128],fit:[72,118,64,45]},
 u_idle1:{bounds:[40,43,152,185],head:[114,68],body:[98,137],eyes:[128,105],neck:[127,126],fit:[73,116,61,46]},
 u_run0:{bounds:[30,54,161,185],head:[129,82],body:[105,137],eyes:[137,111],neck:[135,130],fit:[79,119,67,44]},
 u_run1:{bounds:[26,50,165,186],head:[128,76],body:[102,140],eyes:[139,110],neck:[137,132],fit:[77,120,70,46]},
 u_run2:{bounds:[22,53,170,185],head:[136,76],body:[103,137],eyes:[148,108],neck:[145,129],fit:[73,118,80,47]},
 u_run3:{bounds:[20,56,172,186],head:[132,78],body:[108,139],eyes:[145,110],neck:[143,129],fit:[74,120,79,47]},
 u_run4:{bounds:[25,51,167,185],head:[128,73],body:[100,138],eyes:[142,107],neck:[139,129],fit:[75,118,73,46]},
 u_run5:{bounds:[19,53,173,186],head:[132,76],body:[105,139],eyes:[150,108],neck:[145,129],fit:[71,118,84,47]},
 u_happy0:{bounds:[31,41,160,185],head:[110,70],body:[111,139],eyes:[120,108],neck:[116,126],fit:[85,113,69,52]},
 u_happy1:{bounds:[37,32,155,185],head:[102,61],body:[107,134],eyes:[111,97],neck:[110,120],fit:[64,100,87,61]},
 u_happy2:{bounds:[35,44,158,184],head:[103,75],body:[105,136],eyes:[112,111],neck:[108,131],fit:[84,116,70,47]}
};
for(const id of ['bike','skateboard'])for(let i=0;i<4;i++){
 const source=M.rides[id][id+i],[sx,sy,sw,sh]=source.rect,[cx,cy,cw]=source.cell,f=192/cw;
 poses[id+i]={bounds:[(sx-cx)*f,(sy-cy)*f,(sx-cx+sw)*f,(sy-cy+sh)*f],source,unit:f,
  head:id==='bike'?[110,64]:[114,76],body:id==='bike'?[86,131]:[98,143],eyes:id==='bike'?[122,94]:[128,113],neck:id==='bike'?[117,112]:[130,129],
  fit:id==='bike'?[67,111,61,39]:[72,123,68,43],clothFrame:id==='bike'?'u_happy2':'u_idle0'};
}
function bitmap(key,url){if(images[key])return Promise.resolve(images[key]);if(pending[key])return pending[key];return pending[key]=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve(im);};im.onerror=()=>{delete pending[key];reject(Error('Missing illustrated sprite '+key));};im.src=url;});}
function sourceURL(file){return new URL(file,assetRoot).href;}
function draw(c,im,box){if(im)c.drawImage(im,...box);}
function cut(c,entry,box){const im=images[entry?.source];if(im)c.drawImage(im,...entry.rect,...box);}
function original(c,frame,p){const [l,t,r,b]=p.bounds;if(p.source)cut(c,p.source,[l,t,r-l,b-t]);else draw(c,images[frame],[l,t,r-l,b-t]);}
function facePath(c,p){
 // Keep fabric and neck accessories outside the face and mane silhouette.
 const [hx,hy]=p.head,[ex,ey]=p.eyes,[nx,ny]=p.neck;
 c.moveTo(hx-37,hy-43);c.lineTo(hx+36,hy-43);c.lineTo(ex+25,ey-13);c.lineTo(ex+23,ey+9);c.lineTo(nx+18,ny+7);c.lineTo(nx-5,ny+7);c.lineTo(hx-18,ey+7);c.lineTo(hx-25,ny+4);c.lineTo(hx-38,ny+1);c.closePath();
}
function horn(c,frame,p){const [hx,hy]=p.head;c.save();c.beginPath();c.moveTo(hx+17,hy-32);c.lineTo(hx+28,hy-29);c.lineTo(hx+19,hy-5);c.lineTo(hx+11,hy+10);c.lineTo(hx+1,hy+6);c.lineTo(hx+9,hy-10);c.closePath();c.clip();original(c,frame,p);c.restore();}
function bodyBox(item,p){const b=p.fit.slice();if(item.art==='dress'){b[0]-=5;b[2]+=12;b[3]+=11;}return b;}
function sleeves(c,frame,p,item){
 // The original foreleg pixels show through the illustrated sleeve openings.
 const box=bodyBox(item,p),pose=p.clothFrame||frame,n=M.frames.indexOf(pose);
 const openings=n<2?[[.14,.48,.055,.12]]:n<8?[[.13,.34,.05,.12],[.48,.9,.075,.045]]:n===8?[[.1,.43,.04,.12],[.91,.14,.055,.09]]:n===9?[[.1,.23,.05,.1],[.9,.14,.05,.09]]:[[.11,.46,.045,.1],[.83,.77,.05,.08]];
 for(const [x,y,rx,ry]of openings){c.save();c.beginPath();c.ellipse(box[0]+box[2]*x,box[1]+box[3]*y,box[2]*rx,box[3]*ry,0,0,Math.PI*2);c.clip();original(c,frame,p);c.restore();}
}
function capeBox(p){return[p.neck[0]-90,p.neck[1]-14,91,67];}
function wearable(c,item,p){
 const im=images['item:'+item.id];if(!im)return;
 const [hx,hy]=p.head,[ex,ey]=p.eyes,[nx,ny]=p.neck;
 const collarX=nx-(nx-p.body[0])*.35,collarY=Math.max(ny+7,p.body[1]-1);
 let b;
 if(item.art==='space')b=[ex-51,ey-70,96,113];
 else if(item.slot==='head'){
  const fits={bow:[-23,-17,34,25],starbow:[-24,-18,36,27],crown:item.id==='flower-crown'?[-28,-15,56,30]:[-26,-27,58,36],hat:[-38,-30,76,43],helmet:[-31,-25,62,46],chef:[-30,-40,61,49]};
  const q=fits[item.art]||fits.bow;b=[hx+q[0],hy+q[1],q[2],q[3]];
 }else if(item.art==='glasses')b=item.id==='legacy-mask'?[ex-35,ey-15,58,29]:[ex-37,ey-15,60,29];
 else if(item.art==='beads')b=[collarX-14,collarY,28,18];
 else if(item.art==='scarf')b=[collarX-16,collarY-5,32,29];
 else if(item.art==='bag')b=[p.body[0]-22,p.body[1]-14,32,43];
 if(b)draw(c,im,b);
}
function clothes(c,outfit,h=150,flip=false,frame='u_idle0',atlas=false,stage='front'){
 const p=poses[frame]||poses.u_idle0,[left,top,right,bottom]=p.bounds,factor=atlas?h/192:h/(bottom-top),pivotX=atlas?96:(left+right)/2,pivotY=atlas?184.5:bottom;
 c.save();if(flip)c.scale(-1,1);c.scale(factor,factor);c.translate(-pivotX,-pivotY);
 const item=C.byId[outfit?.body],pose=p.clothFrame||frame,entry=M.bodies[item?.id]?.[pose];
 if(stage==='back'){if(item?.art==='cape'&&entry)cut(c,entry,capeBox(p));c.restore();return;}
 const accessory=C.byId[outfit?.accessory]||{};
 c.save();c.beginPath();c.rect(-300,-300,800,800);facePath(c,p);c.clip('evenodd');
 if(entry){
  if(item.art==='cape'){c.save();c.beginPath();c.rect(p.neck[0]-31,p.neck[1]-12,40,22);c.clip();cut(c,entry,capeBox(p));c.restore();}
  else{cut(c,entry,bodyBox(item,p));sleeves(c,frame,p,item);}
 }
 if(accessory.art!=='glasses')wearable(c,accessory,p);
 c.restore();
 // The original face stays untouched. Eyewear intentionally sits in front.
 if(accessory.art==='glasses')wearable(c,accessory,p);
 wearable(c,C.byId[outfit?.head]||{},p);
 if(outfit?.head&&C.byId[outfit.head]?.art!=='space')horn(c,frame,p);
 c.restore();
}
function sprite(c,im,x,y,w,h,flip=false){if(!im)return;c.save();c.translate(x,y);if(flip)c.scale(-1,1);const s=Math.min(w/im.width,h/im.height);c.drawImage(im,-im.width*s/2,-im.height*s,im.width*s,im.height*s);c.restore();}
function vehicle(c,id,x,y,h=150,flip=false){sprite(c,images['item:'+id],x,y,h*1.1,h*.8,flip);}
function unicorn(c,x,y,h=150,outfit={},frame='u_idle0',flip=false,ride=null){
 if(ride&&M.rides[ride]){
  const n=frame.startsWith('u_run')?Number(frame.slice(-1))%4:0,key=ride+n,p=poses[key],[l,t,r,b]=p.bounds,fullHeight=h+(ride==='bike'?42:22),factor=fullHeight/(b-t);
  c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.scale(factor,factor);c.translate(-(l+r)/2,-b);
  const body=C.byId[outfit?.body],entry=M.bodies[body?.id]?.[p.clothFrame];if(body?.art==='cape'&&entry)cut(c,entry,capeBox(p));original(c,key,p);c.restore();
  c.save();c.translate(x,y);clothes(c,outfit,fullHeight,flip,key);c.restore();return;
 }
 c.save();c.translate(x,y);clothes(c,outfit,h,flip,frame,false,'back');c.restore();
 sprite(c,images[frame]||images.u_idle0,x,y,h*1.3,h,flip);
 c.save();c.translate(x,y);clothes(c,outfit,h,flip,frame);c.restore();
}
function imagePiece(item){return item?sourceURL(M.items[item.id].file):'';}
const iconAliases={head:'sunhat',body:'tee',accessory:'scarf',wheel:'bike'};
function iconURL(key){if(iconAliases[key])return imagePiece(C.byId[iconAliases[key]]);const entry=M.icons[key];if(!entry)throw Error('Missing picture control '+key);return sourceURL(entry.file);}
function icon(key){return '<img class="picture-sprite" src="'+iconURL(key)+'" alt="" aria-hidden="true" draggable="false">';}
function picture(c,key,x,y,w,h,flip=false){sprite(c,images['icon:'+key]||images['prop:'+key]||images['item:'+key],x,y,w,h,flip);}
let wardrobePromise=null;
async function loadWardrobe(){if(!wardrobePromise){
 const sources=new Set([...Object.values(M.bodies).flatMap(o=>Object.values(o).map(e=>e.source)),...Object.values(M.rides).flatMap(o=>Object.values(o).map(e=>e.source))]);
 wardrobePromise=Promise.all([
  ...[...sources].map(file=>bitmap(file,sourceURL(file))),
  ...Object.entries(M.items).map(([id,e])=>bitmap('item:'+id,sourceURL(e.file))),
  ...Object.entries(M.icons).map(([id,e])=>bitmap('icon:'+id,sourceURL(e.file))),
  ...Object.entries(M.props).map(([id,e])=>bitmap('prop:'+id,sourceURL(e.file))),
  bitmap('bowling-background',sourceURL(M.bowlingBackground)),
  ...M.frames.map(k=>bitmap(k,new URL('game/build/assets/'+k+'.webp',siteRoot).href))
 ]).catch(e=>{wardrobePromise=null;throw e;});
 }await wardrobePromise;return images;}
async function load(base='..'){
 const keys=['u_idle0','u_idle1','u_happy0','u_happy1','u_happy2',...Array.from({length:6},(_,i)=>'u_run'+i),'baby_pink_0','baby_blue_0','h_idle0','h_happy','w_0_0','m_0_0','pizza','cupcake','ice_vanilla','pancake_syrup','smoothie_strawberry','coffee_black','burger','soup_carrot','chicken_roast','room_plant','room_door','room_window','fruit_strawberry','cookie','donut'];
 await Promise.all([loadWardrobe(),...keys.map(k=>bitmap(k,new URL('game/build/assets/'+k+'.webp',new URL(base,location.href).href.replace(/\/?$/,'/')).href))]);return images;
}
root.UWArt={images,poses,load,loadWardrobe,clothes,unicorn,vehicle,imagePiece,icon,iconURL,picture,star,ellipse,rect,line,sprite,clamp};
})(window);
