/* Native environment replacement. Scene geometry, pickups, actors, saving and rules are not edited here. */
(function(root){'use strict';const old=root.UnicornInteriors,C=root.UWPixelArtCore,E=root.UWPixelEnvironment,H=root.UWPixelHomeExtra,O=root.UWPixelOutdoors,{Pixels,palette,glyphs}=C,extra={};function add(id,w,h,fn){const p=new Pixels(w,h);fn(p);extra[id]=p.finish(id);}
add('fridge',48,82,p=>{p.frame(3,1,42,80,0,7).rect(5,3,37,76,5).rect(37,4,5,73,7).frame(7,7,32,24,7,6).frame(7,34,32,42,7,6).rect(10,18,3,10,8).rect(10,39,3,14,8).line(9,8,36,8,5).rect(7,79,7,3,0).rect(34,79,7,3,0);});
add('tv',64,56,p=>{p.frame(2,1,60,42,0,8).frame(5,4,54,35,1,21).rect(8,7,48,28,22).poly([[8,30],[23,15],[38,30],[48,20],[56,31],[56,35],[8,35]],19).ellipse(47,13,4,4,17).rect(28,43,8,8,8).frame(17,50,30,5,0,9).dot(55,41,16);});
add('bath',64,48,p=>{p.ellipse(32,19,31,17,0).ellipse(32,17,29,15,7).ellipse(31,15,26,12,6).ellipse(31,16,22,8,22).rect(2,20,60,17,7).rect(5,23,54,13,5).line(8,24,55,24,6).rect(8,37,7,9,8).rect(49,37,7,9,8).frame(47,1,4,16,8,16).frame(42,0,10,4,8,17);});
add('pumpkin',72,72,p=>{p.frame(34,1,7,17,0,18).rect(36,2,3,12,19);p.ellipse(36,43,34,28,0).ellipse(36,42,32,26,15);for(const[x,rx,col]of[[20,12,16],[50,12,16],[35,15,17]])p.ellipse(x,42,rx,24,col);p.line(28,22,24,31,5).line(25,34,24,41,5);p.ellipse(27,43,3,4,0).ellipse(44,43,3,4,0).line(29,53,41,53,8).dot(31,55,8).dot(39,55,8);});
add('cart',48,48,p=>{p.line(6,5,11,34,8).line(1,4,8,4,0).poly([[8,10],[45,10],[39,31],[12,31]],0).poly([[11,12],[42,12],[37,28],[14,28]],22);for(let x=16;x<39;x+=6)p.line(x,13,x-2,27,21);for(const y of[18,24])p.line(12,y,39,y,21);p.line(11,34,39,34,8).ellipse(15,40,5,5,0).ellipse(35,40,5,5,0).ellipse(15,40,2,2,7).ellipse(35,40,2,2,7);});
add('secret-door',80,96,p=>{p.poly([[4,92],[4,27],[10,14],[23,4],[40,0],[57,4],[70,14],[76,27],[76,92]],0).poly([[8,89],[8,29],[14,18],[25,8],[40,5],[55,8],[66,18],[72,29],[72,89]],9).poly([[16,88],[16,31],[21,22],[30,15],[40,12],[50,15],[59,22],[64,31],[64,88]],0).poly([[19,86],[19,33],[25,25],[32,19],[40,17],[48,19],[55,25],[61,33],[61,86]],2).rect(23,40,34,43,3).frame(28,47,24,28,1,4).ellipse(40,32,8,8,16).line(40,26,40,38,17).line(34,32,46,32,17).frame(1,90,78,6,0,10).line(3,91,76,91,11);for(const x of[9,67])p.line(x,32,x,87,11);});
add('portal-pad',96,56,p=>{p.ellipse(48,35,47,20,0).ellipse(48,33,44,18,2).ellipse(48,32,40,15,3).ellipse(48,31,34,12,22).ellipse(48,31,29,9,1);for(const[x,y,col]of[[14,30,13],[32,19,16],[65,21,19],[81,33,23],[55,44,14]]){p.line(x-3,y,x+3,y,col).line(x,y-3,x,y+3,col);}p.line(27,34,38,34,23).line(57,28,67,28,4);});
// Bounded native-sprite raster cache: pixel content, not positions/anchors, is cached.
const fixtureSurfaces=new Map(),MAX_FIXTURE_SURFACES=64,MAX_FIXTURE_BYTES=8*1024*1024;let fixtureBytes=0;
function fixtureSurface(s){
 const signature=s.width+'x'+s.height+'|'+palette.join(',')+'|'+glyphs+'|'+s.rows.join('\n');
 let entry=fixtureSurfaces.get(s);
 if(entry&&entry.signature===signature){fixtureSurfaces.delete(s);fixtureSurfaces.set(s,entry);return entry.canvas;}
 if(entry){fixtureBytes-=entry.bytes;fixtureSurfaces.delete(s);}
 const bytes=s.width*s.height*4;
 if(bytes>MAX_FIXTURE_BYTES)return null;
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(s.width,s.height):document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;
 const cc=canvas.getContext('2d');cc.imageSmoothingEnabled=false;
 for(let j=0;j<s.height;j++)for(let i=0;i<s.width;i++){const n=glyphs.indexOf(s.rows[j][i]);if(n>=0){cc.fillStyle=palette[n];cc.fillRect(i,j,1,1);}}
 while(fixtureSurfaces.size&&(fixtureSurfaces.size>=MAX_FIXTURE_SURFACES||fixtureBytes+bytes>MAX_FIXTURE_BYTES)){const key=fixtureSurfaces.keys().next().value;fixtureBytes-=fixtureSurfaces.get(key).bytes;fixtureSurfaces.delete(key);}
 fixtureSurfaces.set(s,{canvas,signature,bytes});fixtureBytes+=bytes;return canvas;
}
function drawSprite(c,s,x,y){c.save();c.scale(2,2);x=Math.round(x/2);y=Math.round(y/2);const surface=fixtureSurface(s);if(surface){c.imageSmoothingEnabled=false;c.drawImage(surface,x-s.anchor[0],y-s.height);}else{for(let j=0;j<s.height;j++)for(let i=0;i<s.width;i++){const n=glyphs.indexOf(s.rows[j][i]);if(n>=0){c.fillStyle=palette[n];c.fillRect(x-s.anchor[0]+i,y-s.height+j,1,1);}}}c.restore();}
function sprite(c,id,x,y){const s=extra[id]||E.sprites[id]||H.sprites[id]||O.sprites[id];if(!s)throw Error('Unmapped Adventure pixel fixture '+id);if(root.UWAdventureRefresh?.draw(c,id,x-s.width,y-s.height*2,s.width*2,s.height*2))return;drawSprite(c,s,x,y);}
const rect=(c,x,y,w,h,col)=>{c.fillStyle=palette[col];c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.ceil(w/2)*2,Math.ceil(h/2)*2);};
const matImg=(()=>{const im=new Image();im.src='world-art/materials-atlas-v1.webp';return im;})();
const structImg=(()=>{const im=new Image();im.src='world-art/structure-atlas-v1.webp';return im;})();
const MAT={wood:[48,73,438,427],dirt:[48,500,438,468],wainscot:[551,241,619,247],stone:[547,718,653,177],pillar:[1305,89,113,415],ledge:[1150,727,350,119]};
const STR={wall_plain:[32,55,253,249],wall_kitchen:[33,366,254,252],wall_shop:[660,366,247,251],stone_wall:[947,421,291,188],rug_square:[33,966,255,232],rug_stripe:[329,1008,286,158]};
function readyImg(im){return im&&im.complete&&im.naturalWidth>0;}
function drawStarryBackdrop(c,x,y,w,h){
 const g=c.createRadialGradient(x+w*.5,y+h*.42,Math.min(w,h)*.15,x+w*.5,y+h*.5,Math.max(w,h)*.85);
 g.addColorStop(0,'#693c8a');g.addColorStop(.65,'#4b2764');g.addColorStop(1,'#381c4d');
 c.fillStyle=g;c.fillRect(x,y,w,h);
 c.save();c.fillStyle='#ffeaa8';
 for(let i=0;i<36;i++){
  const sx=x+((i*197+43)%Math.max(100,w)),sy=y+((i*131+29)%Math.max(100,h));
  c.globalAlpha=.14+(i%4)*.08;c.beginPath();c.arc(sx,sy,1.5+(i%3)*.8,0,Math.PI*2);c.fill();
 }
 c.restore();
}
function bank(c,r,{soil=false,wall=false}={}){
 const[x,y,w,h]=r,face=Math.min(34,h*.42),top=h-face;
 c.save();
 c.imageSmoothingEnabled=true;
 c.fillStyle='rgba(64,28,84,0.26)';c.beginPath();c.roundRect(x+4,y+6,w,h,8);c.fill();
 if(wall&&readyImg(matImg)){
  if(h>w*1.35){
   const segH=Math.max(54,Math.min(112,w*2.4));
   c.beginPath();c.roundRect(x,y,w,h,8);c.clip();
   for(let yy=y;yy<y+h;yy+=segH)c.drawImage(matImg,...MAT.pillar,x-2,yy,w+4,Math.min(segH+4,y+h-yy+4));
  }else{
   const segW=Math.max(96,Math.min(200,h*2.2));
   c.beginPath();c.roundRect(x,y,w,h,8);c.clip();
   for(let xx=x;xx<x+w;xx+=segW)c.drawImage(matImg,...MAT.wainscot,xx,y,Math.min(segW+2,x+w-xx+2),h);
  }
  c.restore();
  c.save();c.strokeStyle='#5c306e';c.lineWidth=3;c.beginPath();c.roundRect(x+1,y+1,w-2,h-2,7);c.stroke();c.restore();
  return;
 }
 if(soil&&readyImg(matImg)){
  c.fillStyle='#5c366b';c.beginPath();c.roundRect(x,y,w,h,8);c.fill();
  c.save();c.beginPath();c.roundRect(x+4,y+4,w-8,h-8,6);c.clip();
  for(let yy=y+4;yy<y+h-4;yy+=96)for(let xx=x+4;xx<x+w-4;xx+=96)c.drawImage(matImg,...MAT.dirt,xx,yy,96,96);
  c.restore();
  c.strokeStyle='#e8b35a';c.lineWidth=3;c.beginPath();c.roundRect(x+3,y+3,w-6,h-6,6);c.stroke();
  c.restore();return;
 }
 if(wall){
  c.fillStyle='#613775';c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
  const wg=c.createLinearGradient(0,y,0,y+h);wg.addColorStop(0,'#fff5e2');wg.addColorStop(.5,'#f3dcf5');wg.addColorStop(1,'#d5b0e3');
  c.fillStyle=wg;c.beginPath();c.roundRect(x+3,y+3,w-6,h-6,5);c.fill();
  c.fillStyle='#f6cb6d';c.fillRect(x+3,y+3,w-6,8);
  c.fillStyle='#cfa3df';c.fillRect(x+3,y+top,w-6,Math.max(4,face-4));
 }else if(soil){
  c.fillStyle='#5c366b';c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
  c.fillStyle='#8c5c49';c.fillRect(x+3,y+3,w-6,top);
  c.fillStyle='#d8a873';c.fillRect(x+3,y+top,w-6,face-3);
 }else{
  c.fillStyle='#603670';c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
  c.fillStyle='#fce8c4';c.fillRect(x+3,y+3,w-6,top);
  c.fillStyle='#fff8e8';c.fillRect(x+5,y+4,w-10,4);
  c.fillStyle='#dba36b';c.fillRect(x+3,y+top,w-6,face-3);
  c.fillStyle='#f4c887';c.fillRect(x+5,y+top,w-10,3);
  for(let xx=x+34;xx<x+w-12;xx+=48){c.fillStyle='#9b644a';c.fillRect(xx,y+top+5,2,Math.max(0,face-10));c.fillStyle='#ffd966';c.beginPath();c.arc(xx-22,y+top+11,3.5,0,Math.PI*2);c.fill();}
 }
 c.restore();
}
function gondola(c,r){const[x,y,w,h]=r;rect(c,x,y-44,w,h+44,0);rect(c,x+3,y-41,w-6,h+38,9);rect(c,x+5,y-39,w-10,10,11);rect(c,x+w/2-5,y-35,10,h+30,8);for(let yy=y-20;yy<y+h-32;yy+=38){for(const side of[-1,1]){const bx=side<0?x+6:x+w/2+7,bw=w/2-13;rect(c,bx,yy,bw,28,8);for(let xx=bx+3;xx<bx+bw-7;xx+=14){rect(c,xx,yy+4,10,20,[13,22,16,19][Math.floor((xx+yy)/14)%4]||13);rect(c,xx+2,yy+7,6,4,5);rect(c,xx+2,yy+16,6,2,7);}rect(c,bx-2,yy+27,bw+4,5,11);}}rect(c,x+2,y+h-5,w-4,5,8);}
function plantedBed(c,r){const[x,y,w,h]=r;bank(c,r,{soil:true});for(let yy=y+12;yy<y+h-30;yy+=34)for(let xx=x+17;xx<x+w-12;xx+=28){rect(c,xx-2,yy-5,4,20,18);rect(c,xx-8,yy+4,7,4,19);rect(c,xx+2,yy,7,4,20);rect(c,xx-7,yy-8,14,10,13);rect(c,xx-3,yy-6,6,6,17);}}
function stocks(c,s,o,k){const[x,y,w,h]=o.r;if(k==='flowers'){plantedBed(c,o.r);return;}if(k==='shelf'&&h>w*1.25){gondola(c,o.r);return;}if(k==='toys'||k==='counter'){bank(c,o.r,{soil:false});const count=Math.max(1,Math.ceil(w/160)),cell=w/count;for(let j=0;j<count;j++)root.UWAdventureRefresh?.draw(c,'display-island',x+j*cell,y,cell,h);}else if(!root.UWAdventureRefresh?.draw(c,k==='produce'?'produce-bin':k==='checkout'?'checkout':'',x,y,w,h))bank(c,o.r,{soil:false});const cols=Math.max(1,Math.floor(w/100));for(let i=0;i<cols;i++){const xx=x+(i+.5)*w/cols,yy=y+Math.max(22,h-38);if(k==='flowers')sprite(c,'plant',xx,yy);else if(k==='toys')sprite(c,i%2?'train':'teddy',xx,yy);else if(k==='shelf')sprite(c,'toybox',xx,yy);else if(k==='checkout'){rect(c,xx-20,yy-32,40,30,0);rect(c,xx-16,yy-28,32,18,22);rect(c,xx-12,yy-24,24,8,23);}else{for(let n=0;n<3;n++){const qx=xx-20+n*20;rect(c,qx-7,yy-15,14,14,k==='produce'?18:8);rect(c,qx-5,yy-17,10,12,k==='produce'?(n%2?16:13):16);rect(c,qx-4,yy-17,4,2,17);}}}}
const loadImg=src=>{const im=new Image();im.src=src;return im;};
const furnImg=loadImg('world-art/furniture-atlas-v1.webp');
const fixtImg=loadImg('world-art/fixtures-atlas-v1.webp');
const shopsImg=loadImg('world-art/shops-atlas-v1.webp');
const stairsImg=loadImg('world-art/stairs-atlas-v1.webp');
const chairsImg=loadImg('world-art/directional-chairs-v1.webp');
function paintedArtMap(art){
 const m={...(art||{})};
 if(readyImg(furnImg))m.world_furniture=furnImg;
 if(readyImg(fixtImg))m.world_fixtures=fixtImg;
 if(readyImg(shopsImg))m.world_shops=shopsImg;
 if(readyImg(stairsImg))m.world_stairs=stairsImg;
 if(readyImg(chairsImg))m.world_chairs=chairsImg;
 if(readyImg(structImg))m.world_structure=structImg;
 if(readyImg(matImg))m.world_materials=matImg;
 return m;
}
function drawObstacle(c,s,o,art){
 const[x,y,w,h]=o.r,k=old.kind(o);
 if(k==='wall'){bank(c,[x,y-36,w,h+36],{wall:true});return;}
 if(k==='tv-front'){
  bank(c,[x,y,w,h],{wall:true});
  c.save();
  c.fillStyle='#5c306e';c.beginPath();c.roundRect(x+8,y-64,w-16,62,12);c.fill();
  c.fillStyle='#f0be64';c.beginPath();c.roundRect(x+11,y-61,w-22,56,10);c.fill();
  const sg=c.createLinearGradient(0,y-56,0,y-10);sg.addColorStop(0,'#9de0ff');sg.addColorStop(.55,'#d4c2ff');sg.addColorStop(1,'#f8c4e4');
  c.fillStyle=sg;c.beginPath();c.roundRect(x+16,y-56,w-32,46,7);c.fill();
  c.fillStyle='rgba(255,255,255,0.45)';c.beginPath();c.ellipse(x+w*.34,y-42,14,5,-.3,0,Math.PI*2);c.fill();
  c.restore();return;
 }
 if(readyImg(furnImg)||readyImg(shopsImg)||readyImg(fixtImg)){
  c.save();c.imageSmoothingEnabled=true;
  old.drawObstacle(c,s,o,paintedArtMap(art));
  c.restore();return;
 }
 const cx=x+w/2,foot=y+h;c.save();c.imageSmoothingEnabled=true;
 if(o.facing){sprite(c,o.facing==='east'?'chair-east':'chair-west',cx,foot);c.restore();return;}
 bank(c,o.r,{soil:false});
 c.restore();
}
function drawStorybookRug(c,r,place){
 const[x,y,w,h]=r;
 c.save();
 c.imageSmoothingEnabled=true;
 if(readyImg(structImg)){
  c.fillStyle='rgba(66,30,86,0.20)';c.beginPath();c.roundRect(x+4,y+6,w,h,16);c.fill();
  const rectSrc=(w>h*1.35||place==='restaurant'||place==='toys')?STR.rug_stripe:STR.rug_square;
  c.drawImage(structImg,...rectSrc,x,y,w,h);
  c.restore();return;
 }
 const pal=place==='toys'?['#b2c8f7','#8aa8e8']:place==='market'?['#a8e0c5','#7ec8a7']:place==='restaurant'?['#f7b3cc','#e48bb0']:['#d7b4f0','#b98cde'];
 c.fillStyle='rgba(78,40,98,0.18)';c.beginPath();c.roundRect(x+4,y+6,w,h,24);c.fill();
 c.fillStyle='#6c3e80';c.beginPath();c.roundRect(x,y,w,h,22);c.fill();
 c.fillStyle=pal[1];c.beginPath();c.roundRect(x+4,y+4,w-8,h-8,19);c.fill();
 c.fillStyle=pal[0];c.beginPath();c.roundRect(x+12,y+12,w-24,h-24,14);c.fill();
 c.strokeStyle='#ffe7a6';c.lineWidth=3.5;c.beginPath();c.roundRect(x+16,y+16,w-32,h-32,12);c.stroke();
 c.restore();
}
function floor(c,rs,wood,place){
 c.save();c.beginPath();for(const r of rs)c.rect(...r);c.clip();
 c.imageSmoothingEnabled=true;
 const hasMat=readyImg(matImg);
 const wash=place==='market'?'rgba(235,252,238,0.34)':place==='toys'?'rgba(255,246,220,0.26)':place==='restaurant'?'rgba(255,234,242,0.28)':place==='halloween'?'rgba(176,128,205,0.26)':'rgba(255,238,208,0.18)';
 for(const r of rs){
  const[x,y,w,h]=r;
  if(hasMat){
   const tile=132;
   for(let yy=Math.floor(y/tile)*tile;yy<y+h;yy+=tile)for(let xx=Math.floor(x/tile)*tile;xx<x+w;xx+=tile){
    c.drawImage(matImg,...MAT.wood,xx,yy,tile+1,tile+1);
   }
   c.fillStyle=wash;c.fillRect(x,y,w,h);
   if(!wood&&place!=='house'){
    // Subtle sunlit checkerboard sheen for boutique/market/bakery floors matching boutique.png
    const sq=76;
    for(let yy=Math.floor(y/sq)*sq;yy<y+h;yy+=sq)for(let xx=Math.floor(x/sq)*sq;xx<x+w;xx+=sq){
     if(((Math.floor(xx/sq)+Math.floor(yy/sq))%2)===0){c.fillStyle='rgba(255,250,235,0.22)';c.fillRect(xx,yy,sq,sq);}
    }
   }
  }else{
   c.fillStyle='#f5d4aa';c.fillRect(x,y,w,h);
   for(let yy=Math.floor(y/34)*34;yy<y+h;yy+=34){c.fillStyle=(Math.floor(yy/34)%2)?'#f7dcb6':'#efc99b';c.fillRect(x,yy,w,32);c.fillStyle='#d4a272';c.fillRect(x,yy+32,w,2);}
  }
  const sheen=c.createRadialGradient(x+w*.5,y+h*.35,50,x+w*.5,y+h*.5,Math.max(w,h)*.78);
  sheen.addColorStop(0,'rgba(255,250,224,0.28)');sheen.addColorStop(.7,'rgba(255,236,198,0.04)');sheen.addColorStop(1,'rgba(82,38,98,0.18)');
  c.fillStyle=sheen;c.fillRect(x,y,w,h);
 }
 c.restore();
}
function drawFloor(c,s){const w=s.baseW||s.w,h=s.baseH||s.h;
 c.save();
 const rs=s.floors.filter(r=>r[0]<w);floor(c,rs,s.place==='house',s.place);
 const hasStruct=readyImg(structImg);
 const wallSrc=s.place==='restaurant'?STR.wall_kitchen:s.place==='market'||s.place==='toys'?STR.wall_shop:STR.wall_plain;
 const wallTint=s.place==='market'?'rgba(218,248,224,0.20)':s.place==='toys'?'rgba(224,234,255,0.20)':s.place==='restaurant'?'rgba(255,222,236,0.20)':'rgba(244,224,255,0.14)';
 for(const e of old.boundary(s)){
  if(e.side==='north'){
   const wh=118;
   if(hasStruct){
    c.save();c.beginPath();c.rect(e.x,e.y-wh,e.w,wh);c.clip();c.imageSmoothingEnabled=true;
    const panelW=118;
    for(let xx=e.x,idx=0;xx<e.x+e.w;xx+=panelW,idx++){
     const isWin=(idx%3===1)&&(xx+panelW<=e.x+e.w);
     const useSrc=isWin?[347,55,250,249]:(s.place==='house'&&idx%3===2)?[970,55,250,249]:wallSrc;
     c.drawImage(structImg,...useSrc,xx,e.y-wh,panelW+1,wh+2);
    }
    c.fillStyle=wallTint;c.fillRect(e.x,e.y-wh,e.w,wh);
    c.restore();
   }else{
    const wg=c.createLinearGradient(0,e.y-wh,0,e.y);wg.addColorStop(0,'#f6e7fc');wg.addColorStop(1,'#dfbef0');
    c.fillStyle=wg;c.fillRect(e.x,e.y-wh,e.w,wh);
   }
   c.fillStyle='#5d3070';c.fillRect(e.x-5,e.y-wh-6,e.w+10,11);c.fillStyle='#f6ca6c';c.fillRect(e.x-3,e.y-wh-4,e.w+6,6);
   c.fillStyle='#5d3070';c.fillRect(e.x-5,e.y-8,e.w+10,11);c.fillStyle='#f0be64';c.fillRect(e.x-3,e.y-6,e.w+6,6);
   const sh=c.createLinearGradient(0,e.y+2,0,e.y+26);sh.addColorStop(0,'rgba(72,34,94,0.26)');sh.addColorStop(1,'rgba(72,34,94,0)');c.fillStyle=sh;c.fillRect(e.x,e.y+2,e.w,24);
  }else if(e.side==='south'){
   c.fillStyle='#5d3070';c.fillRect(e.x-6,e.y,e.w+12,13);c.fillStyle='#f0be64';c.fillRect(e.x-2,e.y+3,e.w+4,7);
  }else{
   c.fillStyle='#5d3070';c.fillRect(e.x-6,e.y-6,13,e.h+12);c.fillStyle='#f0be64';c.fillRect(e.x-3,e.y-2,7,e.h+4);
  }
 }
 for(const r of s.soft||[])drawStorybookRug(c,r,s.place);
 c.restore();
}
function drawSecret(c,r){
 c.save();
 drawStarryBackdrop(c,r.x,r.y-114,r.w,r.h+114);
 floor(c,[[r.x+25,r.y+25,r.w-50,r.h-50]],true,'house');
 if(readyImg(structImg)){
  c.save();c.beginPath();c.rect(r.x+25,r.y-88,r.w-50,114);c.clip();c.imageSmoothingEnabled=true;
  for(let xx=r.x+25,idx=0;xx<r.x+r.w-25;xx+=116,idx++){
   const src=(idx===2)?[347,55,250,249]:STR.wall_plain;
   c.drawImage(structImg,...src,xx,r.y-88,117,115);
  }
  c.fillStyle='rgba(244,224,255,0.22)';c.fillRect(r.x+25,r.y-88,r.w-50,114);
  c.restore();
 }else{
  const wg=c.createLinearGradient(0,r.y-84,0,r.y+25);wg.addColorStop(0,'#f9e8ff');wg.addColorStop(1,'#debdf2');
  c.fillStyle=wg;c.fillRect(r.x+25,r.y-84,r.w-50,109);
 }
 c.fillStyle='#5d3070';c.fillRect(r.x+20,r.y-92,r.w-40,10);c.fillStyle='#f6ca6c';c.fillRect(r.x+22,r.y-90,r.w-44,6);
 c.fillStyle='#5d3070';c.fillRect(r.x+20,r.y+18,r.w-40,10);c.fillStyle='#f0be64';c.fillRect(r.x+22,r.y+20,r.w-44,6);
 c.fillStyle='#f0be64';c.fillRect(r.x+19,r.y+20,8,r.h-40);c.fillRect(r.x+r.w-27,r.y+20,8,r.h-40);c.fillRect(r.x+19,r.y+r.h-26,r.w-38,8);
 c.restore();
}
function drawStorybookDoor(c,x,y,progress=1){
 c.save();c.globalAlpha=progress;c.imageSmoothingEnabled=true;
 const glow=c.createRadialGradient(x,y-64,10,x,y-64,86);
 glow.addColorStop(0,'rgba(255,232,140,0.65)');glow.addColorStop(.6,'rgba(218,158,255,0.28)');glow.addColorStop(1,'rgba(255,232,140,0)');
 c.fillStyle=glow;c.beginPath();c.arc(x,y-64,86,0,Math.PI*2);c.fill();
 // Glowing golden-lavender fairy portal arch
 c.fillStyle='#5c306e';c.beginPath();c.moveTo(x-52,y);c.lineTo(x-52,y-92);c.arc(x,y-92,52,Math.PI,0);c.lineTo(x+52,y);c.closePath();c.fill();
 const frame=c.createLinearGradient(x-46,y-140,x+46,y);frame.addColorStop(0,'#fff3be');frame.addColorStop(.5,'#f3be5a');frame.addColorStop(1,'#d4923a');
 c.fillStyle=frame;c.beginPath();c.moveTo(x-47,y-3);c.lineTo(x-47,y-92);c.arc(x,y-92,47,Math.PI,0);c.lineTo(x+47,y-3);c.closePath();c.fill();
 const inner=c.createRadialGradient(x,y-76,8,x,y-72,62);inner.addColorStop(0,'#fffbe0');inner.addColorStop(.45,'#f9c2e8');inner.addColorStop(1,'#8c56ba');
 c.fillStyle=inner;c.beginPath();c.moveTo(x-36,y-5);c.lineTo(x-36,y-90);c.arc(x,y-90,36,Math.PI,0);c.lineTo(x+36,y-5);c.closePath();c.fill();
 // Golden star crest at center
 c.fillStyle='#fff7cc';c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?8:18;c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y-80+Math.sin(a)*rr);}c.closePath();c.fill();
 c.restore();
}
function drawStorybookPortal(c,p){
 c.save();c.imageSmoothingEnabled=true;
 const x=p.x,y=p.y-12;
 const g=c.createRadialGradient(x,y,8,x,y,74);g.addColorStop(0,'rgba(255,232,148,0.65)');g.addColorStop(.6,'rgba(202,140,248,0.28)');g.addColorStop(1,'rgba(178,136,232,0)');
 c.fillStyle=g;c.beginPath();c.ellipse(x,y,74,36,0,0,Math.PI*2);c.fill();
 c.fillStyle='#5c306e';c.beginPath();c.ellipse(x,y,58,25,0,0,Math.PI*2);c.fill();
 c.fillStyle='#f3be5a';c.beginPath();c.ellipse(x,y-2,53,22,0,0,Math.PI*2);c.fill();
 const rg=c.createRadialGradient(x,y-4,4,x,y-2,44);rg.addColorStop(0,'#fffbe2');rg.addColorStop(.5,'#d69ef7');rg.addColorStop(1,'#7d46ad');
 c.fillStyle=rg;c.beginPath();c.ellipse(x,y-2,45,17,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#fff4b8';c.lineWidth=2.5;c.beginPath();c.ellipse(x,y-2,32,11,0,0,Math.PI*2);c.stroke();
 c.fillStyle='#fffbe2';
 for(const[sx,sy,r]of[[x-24,y-5,4],[x+22,y+3,3.5],[x,y-9,5]]){c.beginPath();c.arc(sx,sy,r,0,Math.PI*2);c.fill();}
 c.restore();
}
root.UnicornInteriors=Object.freeze({...old,VERSION:'native-pixel-interiors-1',drawFloor,drawObstacle,drawSecret});root.UnicornPixelInteriors={extra,sprite,bank,drawFloor,drawObstacle,drawSecret,door:drawStorybookDoor,portal:drawStorybookPortal};
})(typeof window==='undefined'?globalThis:window);
