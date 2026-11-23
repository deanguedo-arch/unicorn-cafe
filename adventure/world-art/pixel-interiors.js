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
function bank(c,r,{soil=false,wall=false}={}){
 const[x,y,w,h]=r,face=Math.min(34,h*.42),top=h-face;
 c.save();
 c.fillStyle='rgba(75,38,94,0.22)';c.beginPath();c.roundRect(x+4,y+6,w,h,8);c.fill();
 if(wall){
  c.fillStyle='#613775';c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
  const wg=c.createLinearGradient(0,y,0,y+h);wg.addColorStop(0,'#fff5e2');wg.addColorStop(.5,'#f3dcf5');wg.addColorStop(1,'#d5b0e3');
  c.fillStyle=wg;c.beginPath();c.roundRect(x+3,y+3,w-6,h-6,5);c.fill();
  c.fillStyle='#f6cb6d';c.fillRect(x+3,y+3,w-6,8);
  c.fillStyle='#fff9e6';c.fillRect(x+5,y+4,w-10,3);
  c.fillStyle='#cfa3df';c.fillRect(x+3,y+top,w-6,Math.max(4,face-4));
  c.fillStyle='#e8b55d';c.fillRect(x+3,y+top-2,w-6,4);
  for(let xx=x+26;xx<x+w-16;xx+=44){c.fillStyle='rgba(105,62,126,0.18)';c.fillRect(xx,y+top+4,2,Math.max(0,face-10));}
 }else if(soil){
  c.fillStyle='#5c366b';c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
  c.fillStyle='#8c5c49';c.fillRect(x+3,y+3,w-6,top);
  c.fillStyle='#d8a873';c.fillRect(x+3,y+top,w-6,face-3);
  c.fillStyle='#f2cb93';c.fillRect(x+5,y+top,w-10,3);
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
function drawObstacle(c,s,o){const[x,y,w,h]=o.r,k=old.kind(o),cx=x+w/2,foot=y+h;c.save();c.imageSmoothingEnabled=false;
 if(o.facing){sprite(c,o.facing==='east'?'chair-east':'chair-west',cx,foot);c.restore();return;}
 const simple={bed:'bed',sofa:'sofa',chair:'armchair-east',lamp:'lamp',stairs:'stairs',fridge:'fridge',tv:'tv','tv-front':'tv',bath:'bath',cabinet:'nightstand',box:'toybox',pumpkin:'pumpkin','narrow-kitchen':'kitchen-sink',booth:'sofa'};
 if((k==='tv'||k==='tv-front')&&s.place==='house'){bank(c,[x,y,w,h]);rect(c,cx-54,y-76,108,72,0);rect(c,cx-50,y-72,100,64,1);for(let yy=y-62;yy<y-20;yy+=8)rect(c,cx-36,yy,72,2,2);rect(c,cx-8,y-8,16,14,8);}else if(simple[k])sprite(c,simple[k],cx,foot);
 else if(k==='table'){if(!root.UWAdventureRefresh?.draw(c,'table',x,y,w,h+14)){bank(c,o.r);rect(c,x+6,foot,8,14,8);rect(c,x+w-14,foot,8,14,8);}}
 else if(k==='wall')bank(c,[x,y-36,w,h+36],{wall:true});
 else if(k==='water'){rect(c,x,y,w,h,21);rect(c,x+4,y+4,w-8,h-8,22);for(let yy=y+18;yy<foot;yy+=30)for(let xx=x+14;xx<x+w-20;xx+=58)rect(c,xx,yy,24,2,23);}
 else if(k==='cart'){bank(c,o.r,{wall:true});const n=Math.max(1,Math.floor(w/96));for(let i=0;i<n;i++)sprite(c,'cart',x+(i+.5)*w/n,foot-4);}
 else stocks(c,s,o,k==='festival'?'counter':k);
 c.restore();}
function drawStorybookRug(c,r,place){
 const[x,y,w,h]=r;
 const pal=place==='toys'?['#b2c8f7','#8aa8e8']:place==='market'?['#a8e0c5','#7ec8a7']:place==='restaurant'?['#f7b3cc','#e48bb0']:['#d7b4f0','#b98cde'];
 c.save();
 c.fillStyle='rgba(78,40,98,0.18)';c.beginPath();c.roundRect(x+4,y+6,w,h,24);c.fill();
 c.fillStyle='#6c3e80';c.beginPath();c.roundRect(x,y,w,h,22);c.fill();
 c.fillStyle=pal[1];c.beginPath();c.roundRect(x+4,y+4,w-8,h-8,19);c.fill();
 c.fillStyle=pal[0];c.beginPath();c.roundRect(x+12,y+12,w-24,h-24,14);c.fill();
 c.strokeStyle='#ffe7a6';c.lineWidth=3.5;c.beginPath();c.roundRect(x+16,y+16,w-32,h-32,12);c.stroke();
 c.fillStyle='#fff4cc';
 for(const[sx,sy]of[[x+32,y+32],[x+w-32,y+32],[x+32,y+h-32],[x+w-32,y+h-32]]){c.beginPath();c.arc(sx,sy,6,0,Math.PI*2);c.fill();}
 c.restore();
}
function floor(c,rs,wood){c.save();c.beginPath();for(const r of rs)c.rect(...r);c.clip();for(const r of rs){const[x,y,w,h]=r;if(wood){
 c.fillStyle='#f5d4aa';c.fillRect(x,y,w,h);
 for(let yy=Math.floor(y/34)*34;yy<y+h;yy+=34){
  c.fillStyle=(Math.floor(yy/34)%2)?'#f7dcb6':'#efc99b';c.fillRect(x,yy,w,32);
  c.fillStyle='#d4a272';c.fillRect(x,yy+32,w,2);
  c.fillStyle='rgba(255,250,235,0.45)';c.fillRect(x,yy+1,w,2);
  for(let xx=Math.floor(x/112)*112+((Math.floor(yy/34)%2)?56:0);xx<x+w;xx+=112){c.fillStyle='#d4a272';c.fillRect(xx,yy,2,34);}
 }
 const sheen=c.createRadialGradient(x+w*.5,y+h*.35,40,x+w*.5,y+h*.5,Math.max(w,h)*.75);
 sheen.addColorStop(0,'rgba(255,250,224,0.22)');sheen.addColorStop(1,'rgba(98,54,116,0.08)');c.fillStyle=sheen;c.fillRect(x,y,w,h);
}else{const colors=['#fff4e4','#fde6f0','#e8f5e5','#faeede'];for(let yy=Math.floor(y/64)*64;yy<y+h;yy+=64)for(let xx=Math.floor(x/64)*64;xx<x+w;xx+=64){c.fillStyle=colors[((Math.floor(xx/64)+Math.floor(yy/64))%4+4)%4];c.fillRect(xx,yy,64,64);c.fillStyle='#e5cfb9';c.fillRect(xx,yy,64,2);c.fillRect(xx,yy,2,64);}}}c.restore();}
function drawFloor(c,s){const w=s.baseW||s.w,h=s.baseH||s.h;
 c.save();
 c.fillStyle='#4b2b63';c.fillRect(0,0,w,h);
 const rs=s.floors.filter(r=>r[0]<w);floor(c,rs,s.place==='house');
 const wallTop=s.place==='market'?'#e7f7ec':s.place==='toys'?'#e8f0ff':s.place==='restaurant'?'#ffecf3':'#f6e7fc';
 const wallBot=s.place==='market'?'#c5e5cf':s.place==='toys'?'#cad8fa':s.place==='restaurant'?'#f5cde0':'#dfbef0';
 for(const e of old.boundary(s)){
  if(e.side==='north'){
   const wg=c.createLinearGradient(0,e.y-108,0,e.y);wg.addColorStop(0,wallTop);wg.addColorStop(1,wallBot);
   c.fillStyle=wg;c.fillRect(e.x,e.y-108,e.w,108);
   c.fillStyle='rgba(105,62,126,0.12)';for(let xx=e.x+32;xx<e.x+e.w-16;xx+=64)c.fillRect(xx,e.y-46,2,38);
   c.fillStyle='#683b7a';c.fillRect(e.x-4,e.y-112,e.w+8,10);c.fillStyle='#f6ca6c';c.fillRect(e.x-2,e.y-110,e.w+4,6);
   c.fillStyle='#683b7a';c.fillRect(e.x-4,e.y-10,e.w+8,12);c.fillStyle='#f0be64';c.fillRect(e.x-2,e.y-8,e.w+4,7);
   const sh=c.createLinearGradient(0,e.y+2,0,e.y+22);sh.addColorStop(0,'rgba(78,40,98,0.22)');sh.addColorStop(1,'rgba(78,40,98,0)');c.fillStyle=sh;c.fillRect(e.x,e.y+2,e.w,20);
   for(let x=e.x+96;x<e.x+e.w-80;x+=320)sprite(c,'window',x,e.y-18);
  }else if(e.side==='south'){
   c.fillStyle='#683b7a';c.fillRect(e.x-4,e.y,e.w+8,12);c.fillStyle='#e8b35a';c.fillRect(e.x,e.y+2,e.w,7);
  }else{
   c.fillStyle='#683b7a';c.fillRect(e.x-6,e.y-4,12,e.h+8);c.fillStyle='#e8b35a';c.fillRect(e.x-4,e.y,8,e.h);
  }
 }
 for(const r of s.soft||[])drawStorybookRug(c,r,s.place);
 c.restore();
}
function drawSecret(c,r){
 c.save();
 c.fillStyle='#4b2b63';c.fillRect(r.x,r.y-108,r.w,r.h+108);
 floor(c,[[r.x+25,r.y+25,r.w-50,r.h-50]],true);
 const wg=c.createLinearGradient(0,r.y-84,0,r.y+25);wg.addColorStop(0,'#f9e8ff');wg.addColorStop(1,'#debdf2');
 c.fillStyle=wg;c.fillRect(r.x+25,r.y-84,r.w-50,109);
 c.fillStyle='#683b7a';c.fillRect(r.x+20,r.y-88,r.w-40,10);c.fillStyle='#f6ca6c';c.fillRect(r.x+22,r.y-86,r.w-44,6);
 c.fillStyle='#683b7a';c.fillRect(r.x+20,r.y+18,r.w-40,10);c.fillStyle='#f0be64';c.fillRect(r.x+22,r.y+20,r.w-44,6);
 sprite(c,'window',r.x+r.w/2,r.y+6);
 c.fillStyle='#e8b35a';c.fillRect(r.x+19,r.y+20,8,r.h-40);c.fillRect(r.x+r.w-27,r.y+20,8,r.h-40);c.fillRect(r.x+19,r.y+r.h-26,r.w-38,8);
 c.restore();
}
root.UnicornInteriors=Object.freeze({...old,VERSION:'native-pixel-interiors-1',drawFloor,drawObstacle,drawSecret});root.UnicornPixelInteriors={extra,sprite,bank,drawFloor,drawObstacle,drawSecret,door(c,x,y,progress=1){c.save();c.globalAlpha=progress;const glow=c.createRadialGradient(x,y-48,8,x,y-48,78);glow.addColorStop(0,'rgba(255,236,158,0.55)');glow.addColorStop(1,'rgba(255,236,158,0)');c.fillStyle=glow;c.beginPath();c.arc(x,y-48,78,0,Math.PI*2);c.fill();sprite(c,'secret-door',x,y);c.restore();},portal(c,p){c.save();const g=c.createRadialGradient(p.x,p.y-18,6,p.x,p.y-18,68);g.addColorStop(0,'rgba(255,222,145,0.5)');g.addColorStop(1,'rgba(178,136,232,0)');c.fillStyle=g;c.beginPath();c.ellipse(p.x,p.y-18,68,34,0,0,Math.PI*2);c.fill();sprite(c,'portal-pad',p.x,p.y);c.restore();}};
})(typeof window==='undefined'?globalThis:window);
