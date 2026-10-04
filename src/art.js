/* Rainbow Restaurant v1.2.0 — original editable food/furniture illustrations + sourcepack sprite renderer.
 * Production character pixels live in assets/. No emoji or remote fonts.
 */
(function(){'use strict';
const A={},images={},cache={};
const ink='#563d68',cream='#fff8e5';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function path(c,coords,fill,stroke=ink,width=4){c.beginPath();coords(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke=null,width=4){path(c,()=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2),fill,stroke,width);}
function rect(c,x,y,w,h,r,fill,stroke=ink,width=4){r=Math.min(r,w/2,h/2);path(c,()=>{c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();},fill,stroke,width);}
function poly(c,pts,fill,stroke=ink,width=4){path(c,()=>{pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();},fill,stroke,width);}
function line(c,pts,col=ink,width=4){path(c,()=>pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p)),null,col,width);}
function grad(c,y1,y2,top,bottom){const g=c.createLinearGradient(0,y1,0,y2);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;}
function heart(c,x,y,size,fill='#ef8cad'){c.save();c.translate(x,y);c.scale(size/28,size/28);path(c,()=>{c.moveTo(0,9);c.bezierCurveTo(-35,-12,-14,-34,0,-18);c.bezierCurveTo(14,-34,35,-12,0,9);},fill,null);c.restore();}
function star(c,x,y,r,col='#ffe283',rotation=0){const pts=[];for(let i=0;i<10;i++){const a=rotation-Math.PI/2+i*Math.PI/5;pts.push([x+Math.cos(a)*(i%2?r*.47:r),y+Math.sin(a)*(i%2?r*.47:r)]);}poly(c,pts,col,null);}
function shine(c,x,y,rx=25,ry=7){ellipse(c,x,y,rx,ry,'#ffffff88');}
function sprite(c,key,x,y,w,h,flip=false){const im=images[key];if(!im)return;c.save();c.translate(x,y);if(flip)c.scale(-1,1);const s=Math.min(w/im.width,h/im.height);c.drawImage(im,-im.width*s/2,-im.height*s,im.width*s,im.height*s);c.restore();}
function plate(c){ellipse(c,160,239,125,27,'#68527922');ellipse(c,160,227,131,31,'#ece1f4',ink,4);ellipse(c,160,221,117,26,'#fffef8','#cbb7d8',3);}
function sprinkles(c,n=18,y=89){const cols=['#f1b44f','#ef7cbd','#6ecdd4','#9576df','#b5d96e'];for(let i=0;i<n;i++){const x=94+(i*37)%127,yy=y+(i*19)%47;c.save();c.translate(x,yy);c.rotate(i*.9);rect(c,-3,-5,5,10,2,cols[i%5],null);c.restore();}}
function steam(c,x,y,t,col='#fffdf4'){c.save();c.globalAlpha=.7;for(let i=0;i<3;i++){const xx=x+(i-1)*26;path(c,()=>{c.moveTo(xx,y);c.bezierCurveTo(xx-14,y-13,xx+14,y-27,xx+Math.sin(t*2+i)*7,y-43);},null,col,5);}c.restore();}
function tomato(c,x,y,r=16){ellipse(c,x,y,r,r*.75,'#f26970',ink,3);ellipse(c,x,y,r*.67,r*.48,'#ffa183',null);for(let i=0;i<3;i++)ellipse(c,x-6+i*6,y+(i%2?3:-3),2,2,'#fff4c2');}
function mushroom(c,x,y,r=16){rect(c,x-5,y-3,10,20,4,'#fff2d4',ink,2);path(c,()=>{c.moveTo(x-r,y);c.bezierCurveTo(x-r,y-r*1.5,x+r,y-r*1.5,x+r,y);c.closePath();},'#dabb96',ink,3);}
function bean(c,x,y,r=13){c.save();c.translate(x,y);c.rotate(.3);ellipse(c,0,0,r,r*.7,'#885247',ink,3);path(c,()=>{c.moveTo(-6,0);c.quadraticCurveTo(0,-5,6,0);},null,'#e7b387',2);c.restore();}
function corn(c,x,y,r=11){ellipse(c,x,y,r*.65,r,'#ffda6e','#c39446',2);shine(c,x-2,y-4,2,4);}
function pea(c,x,y,r=9){ellipse(c,x,y,r,r,'#8ecd7a','#57995f',2);shine(c,x-2,y-3,r*.3,r*.16);}
function wedge(c,x,y,a=0){c.save();c.translate(x,y);c.rotate(a);path(c,()=>{c.moveTo(-22,9);c.quadraticCurveTo(-16,-27,21,-14);c.lineTo(12,18);c.closePath();},'#e8a15b','#a36b58',3);line(c,[[-13,6],[11,-8]],'#ffc77b',5);c.restore();}
function boneChicken(c,x,y,cooked=1,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);path(c,()=>{c.moveTo(22,20);c.lineTo(64,51);c.bezierCurveTo(75,43,84,55,73,65);c.bezierCurveTo(74,77,61,78,56,66);c.lineTo(13,40);},'#fff4dc',ink,4);path(c,()=>{c.moveTo(-63,-26);c.bezierCurveTo(-82,-73,-8,-83,18,-53);c.bezierCurveTo(68,-57,75,-8,36,21);c.bezierCurveTo(4,69,-82,36,-63,-26);},cooked?grad(c,-65,37,'#f5b45e','#be7159'):grad(c,-65,37,'#f2c1ac','#d79790'),ink,4);shine(c,-28,-42,28,9);if(cooked){line(c,[[-37,-5],[-13,4]],'#a86651',4);line(c,[[-9,-18],[15,-8]],'#a86651',4);}c.restore();}
function bowl(c,fill,level=1){path(c,()=>{c.moveTo(63,135);c.bezierCurveTo(62,250,253,254,257,135);c.closePath();},grad(c,130,240,'#c6d7f0','#8c9fc9'),ink,5);ellipse(c,160,136,96,33,'#f8f4ff',ink,5);ellipse(c,160,139,83,25,fill);shine(c,103,176,7,21);}
function drawFood(c,dish,variant,prep=null,t=0){
 const recipe=RR.RECIPES[dish],steps=recipe.steps.length;
 const s=prep?prep.step:steps,p=prep?prep.p:0;
 const f=i=>clamp(s-i+(s===i?p/(recipe.steps[i]?.need||1):0),0,1);
 c.save();c.lineCap='round';c.lineJoin='round';
 if(dish==='pizza'){
  plate(c);const dough=.72+.28*f(0);c.save();c.translate(160,162);c.scale(dough,dough);
  ellipse(c,0,3,116,68,grad(c,-63,67,'#ffe2a0',f(5)?'#df9453':'#edc28b'),ink,5);ellipse(c,0,-7,99,54,'#fff2c9',null);
  if(f(1)>0)ellipse(c,0,-7,95*Math.sqrt(f(1)),49*Math.sqrt(f(1)),'#e87973',null);
  if(f(2)>0){ellipse(c,0,-10,91*Math.sqrt(f(2)),45*Math.sqrt(f(2)),grad(c,-50,35,'#fff2aa','#f5ca74'),null);for(let i=0;i<12*f(2);i++)ellipse(c,-65+(i*43)%135,-30+(i*17)%46,3,2,'#dfa254');}
  if(variant&&f(4)>0){const defaults=[[-41,-26],[24,-32],[-58,5],[2,3],[54,5]], pts=prep?.placements?.length?prep.placements.map(q=>[(q.x-.5)*175,(q.y-.5)*88]):defaults;const n=prep?Math.max(0,Math.ceil(f(4)*3)):pts.length;for(let i=0;i<Math.min(n,pts.length);i++){const [x,y]=pts[i];(variant==='mushroom'?mushroom:tomato)(c,x,y,14);}}
  shine(c,-50,-47,27,4);c.restore();if(f(5)>0)steam(c,161,83,t);
 }else if(dish==='coffee'){
  plate(c);
  if(s===0){rect(c,67,89,186,109,25,'#b5ced6',ink,5);ellipse(c,160,90,75,27,'#ead9c1',ink,5);for(let i=0;i<8;i++){if(i>=p)bean(c,115+(i*27)%100,82+(i%3)*10,12);else ellipse(c,113+i*13,93,10,6,'#765044');}line(c,[[160,59],[160,39],[209,39]],ink,8);ellipse(c,216,40,12,8,'#eeb587',ink,3);}
  else{
   ellipse(c,241,148,38,41,'#fff3ea',ink,6);ellipse(c,241,148,21,24,'#e9def2',ink,4);
   path(c,()=>{c.moveTo(67,95);c.lineTo(79,204);c.bezierCurveTo(86,244,220,244,227,204);c.lineTo(239,95);c.closePath();},grad(c,95,232,'#ffc2d3','#e895b9'),ink,5);
   ellipse(c,153,94,86,30,'#fff6e8',ink,5);ellipse(c,153,98,73,22,f(1)?(variant==='cocoa'?'#a0755e':variant==='milk'?'#dab693':'#795345'):'#eedcca');
   if(variant&&f(2)){heart(c,155,109,18,variant==='cocoa'?'#ddb99d':'#fff6e7');}
   heart(c,151,178,26,'#fff1dc');shine(c,93,148,6,25);if(f(1))steam(c,158,58,t);
  }
 }else if(dish==='cupcake'){
  if(s<=2){bowl(c,s===0?'#fff2cf':s===1?'#ffe192':'#f1c47f');for(let i=0;i<7;i++)ellipse(c,113+(i*17)%100,132+(i*11)%18,4+s*2,3,'#fff5d49f');if(s<2&&p<1){ellipse(c,172,133,20,14,'#ffe074');ellipse(c,169,129,7,3,'#fff5b0');}if(s===2){for(let i=0;i<3;i++)path(c,()=>c.ellipse(160,138,19+i*15,7+i*5,t*.7,0,Math.PI*1.65),null,'#e6ae6c',3);}}
  else{
   plate(c);
   for(const [cx,cy,sc] of [[92,169,.69],[224,169,.69],[157,192,1]]){c.save();c.translate(cx-160*sc,cy-180*sc);c.scale(sc,sc);
    poly(c,[[88,151],[101,233],[219,233],[231,151]],grad(c,150,235,'#df9cda','#b578b6'),ink,4);for(let i=0;i<6;i++)line(c,[[102+i*22,161],[111+i*19,220]],'#f3bbe6',5);
    path(c,()=>{c.moveTo(86,151);c.bezierCurveTo(81,98,119,81,160,98);c.bezierCurveTo(208,76,242,110,233,151);c.closePath();},grad(c,92,163,'#ffe3a6','#d99968'),ink,4);
    if(variant&&f(4)>0){path(c,()=>{c.moveTo(88,130);c.bezierCurveTo(60,112,89,87,112,90);c.bezierCurveTo(90,69,132,59,140,62);c.bezierCurveTo(133,34,161,49,168,34);c.bezierCurveTo(174,67,213,55,207,90);c.bezierCurveTo(246,90,254,135,231,139);c.bezierCurveTo(203,153,190,134,168,146);c.bezierCurveTo(140,158,117,136,88,130);},variant==='cocoa'?grad(c,35,148,'#ca9d85','#8a6263'):grad(c,35,148,'#ffe4ed','#ea9ac4'),ink,4);shine(c,128,88,21,6);if(f(5)){if((prep?.deco||'rainbow')==='stars'){for(let k=0;k<8;k++)star(c,104+(k*31)%121,82+(k*17)%42,5,['#f3c65e','#d28be1','#72c8db'][k%3],k*.4);}else if((prep?.deco||'rainbow')==='hearts'){for(let k=0;k<8;k++)heart(c,104+(k*31)%121,88+(k*17)%38,7,['#ef80ad','#9ed4e1','#f2c86d'][k%3]);}else sprinkles(c,18,85);}heart(c,167,58,13,'#ef83b5');}
    c.restore();
   }
  }
 }else if(dish==='icecream'){
  const count=Math.max(0,Math.min(3,s>2?3:(s===2?p:0)));
  if(f(0)>0){poly(c,[[95,139],[225,139],[160,266]],grad(c,130,265,'#f6cf8b','#ca8d5c'),ink,5);for(let i=0;i<5;i++){line(c,[[108+i*19,146],[166+i*8,219-i*15]],'#d29b60',2);line(c,[[210-i*19,146],[153-i*8,219-i*15]],'#d29b60',2);}shine(c,126,165,3,11);}
  if(variant&&s>=2){for(let i=0;i<count;i++){const xx=i===0?160:i===1?126:190,yy=i===0?150:119;const col=variant==='strawberry'?['#ffe1ed','#ee9ac1']:['#fff9df','#eed6aa'];ellipse(c,xx,yy,45,39,grad(c,yy-39,yy+39,...col),ink,4);for(let j=0;j<3;j++)ellipse(c,xx-22+j*21,yy+28,15,11,col[1],null);shine(c,xx-14,yy-20,18,7);}
  if(count===0){c.save();c.globalAlpha=.24;ellipse(c,160,126,60,47,variant==='strawberry'?'#f1a9c9':'#fff5d9',ink,3);c.restore();}}
  if(s>=3&&f(3))sprinkles(c,Math.ceil(f(3)*18),101);
  if(!f(0)){ellipse(c,160,229,97,19,'#a694b822');}
 }else if(dish==='burger'){
  plate(c);
  if(f(0)>0){path(c,()=>{c.moveTo(60,198);c.bezierCurveTo(62,255,257,252,260,198);c.closePath();},grad(c,196,242,'#ffdf93','#d9a35d'),ink,5);ellipse(c,160,198,100,24,'#f9d599',ink,4);}
  if(f(1)>0){rect(c,58,164,204,42,22,grad(c,164,206,'#92614f','#644743'),ink,5);for(let i=0;i<5;i++)line(c,[[91+i*33,171],[79+i*33,189]],'#492f38',4);}
  if(variant&&f(2)>0){if(variant==='cheese')poly(c,[[61,160],[130,143],[260,159],[245,181],[195,175],[174,193],[153,172],[77,177]],'#ffe07d',ink,4);else{tomato(c,116,161,49);tomato(c,204,161,46);}}
  if(f(3)>0)path(c,()=>{c.moveTo(58,144);c.bezierCurveTo(75,129,86,149,100,131);c.bezierCurveTo(121,116,129,147,149,128);c.bezierCurveTo(165,109,178,146,197,127);c.bezierCurveTo(219,113,239,143,259,136);c.lineTo(250,155);c.lineTo(227,164);c.lineTo(200,151);c.lineTo(176,169);c.lineTo(145,153);c.lineTo(124,167);c.lineTo(90,153);c.lineTo(63,160);c.closePath();},'#a8d98b',ink,4);
  if(f(4)>0){path(c,()=>{c.moveTo(58,129);c.bezierCurveTo(53,38,270,38,261,129);c.closePath();},grad(c,63,131,'#ffe5a0','#e5b25f'),ink,5);for(const [x,y] of [[93,104],[117,82],[161,89],[211,92],[185,66]]){c.save();c.translate(x,y);c.rotate(x*.07);ellipse(c,0,0,8,3,'#fff4ca');c.restore();}}
  if(s===1&&p>0)steam(c,160,126,t);
 }else if(dish==='soup'){
  // Pot stays visible throughout pouring, chopping, stirring and warming.
  ellipse(c,62,152,28,17,'#90b9ba',ink,4);ellipse(c,258,152,28,17,'#90b9ba',ink,4);
  path(c,()=>{c.moveTo(69,112);c.lineTo(73,204);c.bezierCurveTo(82,258,239,258,248,204);c.lineTo(252,112);c.closePath();},grad(c,110,249,'#bce0d9','#73acae'),ink,5);
  ellipse(c,160,114,93,36,'#e4f6e9',ink,5);ellipse(c,160,117,79,27,f(0)?(variant==='peas'?'#a2c97b':variant==='carrot'?'#e8b476':'#c0dfdf'):'#749eac');
  if(variant&&f(1)>0){const amount=prep?Math.max(1,Math.ceil(f(2)*12)):12;for(let i=0;i<amount;i++){const x=105+(i*31)%116,y=105+(i*13)%26;if(variant==='peas')pea(c,x,y,s>=3?6:9);else{c.save();c.translate(x,y);c.rotate(i);rect(c,-6,-5,s>=3?10:16,s>=3?8:11,3,'#f7a45f','#bd8059',2);c.restore();}}}
  if(f(3)>0){path(c,()=>c.ellipse(160,117,56,17,t,0,Math.PI*1.5),null,'#ffffff88',3);}
  shine(c,96,165,7,23);heart(c,160,191,23,'#edf8e7');if(f(4)>0)steam(c,160,66,t);
 }else if(dish==='pancakes'){
  plate(c);const made=prep?Math.max(0,Math.ceil(f(1)*3)):3, flipped=prep?f(2):1;
  for(let i=0;i<made;i++){const yy=202-i*28,sc=1-i*.04;ellipse(c,160,yy,84*sc,23*sc,grad(c,yy-20,yy+20,flipped?'#f4ca7b':'#f7dda1','#dca45d'),ink,4);shine(c,128,yy-10,24,5);}
  if(f(0)>0&&made===0){bowl(c,'#f2d390');}
  if(variant&&f(3)>0){const n=prep?Math.max(0,Math.ceil(f(4)*8)):8;if(variant==='berries'){for(let i=0;i<n;i++){ellipse(c,105+(i*29)%112,128+(i*17)%45,9,8,'#7180d8','#4e4b89',2);shine(c,102+(i*29)%112,125+(i*17)%45,3,2);}}else{for(let i=0;i<n;i++){c.save();c.translate(103+(i*27)%118,129+(i*15)%48);c.rotate(i*.35);ellipse(c,0,0,14,8,'#ffe081','#d5a54f',2);c.restore();}}}
  if(f(4)>0)path(c,()=>{c.moveTo(139,101);c.bezierCurveTo(157,88,178,92,184,108);c.bezierCurveTo(170,120,151,119,139,101);},'#f6c75f','#b17d47',3);
 }else if(dish==='smoothie'){
  plate(c);rect(c,102,62,116,166,27,grad(c,62,228,variant==='mango'?'#ffd26f':'#f49cc0',variant==='mango'?'#f0a45c':'#c66ca7'),ink,5);ellipse(c,160,66,58,19,'#fff5e7',ink,4);rect(c,151,28,12,50,5,'#9bcfd4',ink,3);ellipse(c,160,222,54,16,'#ffffff55',null);shine(c,127,107,9,37);
  if(!variant||s===0){c.save();c.globalAlpha=.3;ellipse(c,160,145,37,37,'#fff1d7',ink,3);c.restore();}
  if(variant&&f(1)>0){const n=prep?Math.max(1,Math.ceil(f(1)*6)):6;for(let i=0;i<n;i++){if(variant==='mango')rect(c,120+(i*21)%80,105+(i*23)%70,13,13,4,'#f8b856','#c88745',2);else{ellipse(c,125+(i*23)%78,110+(i*19)%70,10,9,'#ef779a','#b95b7d',2);}}}
  if(f(2)>0){c.save();c.globalAlpha=.28*f(2);ellipse(c,160,132,46,62,'#fff9e8',null);c.restore();}
  if(f(3)>0){for(let i=0;i<3;i++)path(c,()=>c.ellipse(160,143,22+i*13,13+i*7,t*2+i,0,Math.PI*1.7),null,'#ffffff99',3);}
 }else if(dish==='chicken'){
  plate(c);
  if(f(0)>0)boneChicken(c,131,151,f(4)>0||s>=4,.9);
  for(let i=0;i<Math.ceil(f(1)*5);i++)wedge(c,219+(i%2)*28,146+Math.floor(i/2)*30,-.4+i*.35);
  if(f(2)>0){for(let i=0;i<3;i++)line(c,[[86+i*21,144],[111+i*18,156]],'#edb765',5);}
  if(variant&&f(3)>0)for(let i=0;i<11;i++)(variant==='peas'?pea:corn)(c,81+(i*17)%96,213+(i*7)%17,6);
  if(f(4)>0)steam(c,133,58,t);
 }
 c.restore();
}
function iconSVG(name){
 const p={
 chicken:'<path d="m33 32 17 12q12-6 10 5 8 11-4 11L36 42Z" fill="#fff1d9"/><path d="M10 10C-3 24 9 52 26 47 58 44 48 12 29 15 24 1 12 4 10 10Z" fill="#e6a073"/><path d="m17 23 10 5m-11 8 10 4" stroke="#ba795f"/>',
 play:'<path d="M24 14 49 32 24 50Z" fill="#fff8e5"/>',
 back:'<path d="m38 16-17 16 17 16M22 32h29"/>',
 arrow:'<path d="M12 32h39M37 18l15 14-15 14"/>',
 pause:'<path d="M24 17v30M42 17v30" stroke-width="8"/>',
 home:'<path d="m9 29 23-19 23 19M17 26v27h30V26M27 53V37h10v16"/>',
 mute:'<path d="M9 25h11l14-12v38L20 39H9Z"/><path d="m44 24 13 16m0-16L44 40"/>',
 sound:'<path d="M9 25h11l14-12v38L20 39H9Z"/><path d="M44 24q10 8 0 16m7-25q17 17 0 34"/>',
 check:'<path d="m13 33 12 12 27-28" stroke-width="7"/>',
 retry:'<path d="M13 27a21 21 0 1 1 2 18M13 12v16h17"/>',
 hand:'<path d="M25 34V14q0-8 7-8t7 8v15q16-2 16 9v8q-2 12-16 12H27L14 42q-5-8 1-10t10 2Z" fill="#ffe4c5"/>',
 chef:'<path d="M19 36C0 32 5 11 22 16 26 0 47 5 46 17 64 13 65 34 47 36v19H19Z" fill="#fff7e4"/><path d="M20 43h26"/>',
 oven:'<rect x="9" y="13" width="46" height="45" rx="8" fill="#aea8d6"/><path d="M9 25h46"/><rect x="17" y="32" width="30" height="18" rx="4" fill="#ffe0a2"/><circle cx="19" cy="19" r="2" fill="#fff"/><circle cx="32" cy="19" r="2" fill="#fff"/><path d="M19 6h9m9 0h9"/>',
 stove:'<rect x="9" y="13" width="46" height="45" rx="8" fill="#aea8d6"/><ellipse cx="32" cy="28" rx="16" ry="9" fill="#ffdf98"/><path d="m22 40 6 8 6-8 7 8"/>',
 heart:'<path d="M32 53C-7 28 11 1 32 21 53 1 71 28 32 53Z" fill="#ed87ac"/>',
 star:'<path d="m32 6 8 17 18 3-13 13 3 18-16-9-16 9 3-18L6 26l18-3Z" fill="#ffe18b"/>',
 flower:'<path d="M32 19c-21-31-40 8-15 16-15 25 23 34 20 8 28 15 32-25 6-22 13-26-25-25-11-2Z" fill="#a2d9bb"/><circle cx="31" cy="30" r="8" fill="#fff0b0"/>',
 table:'<ellipse cx="32" cy="24" rx="25" ry="12" fill="#edbd8c"/><path d="m13 30-3 21m41-21 3 21M29 36v16"/>',
 tray:'<path d="M5 45h54M11 40h42c0-29-42-29-42 0ZM32 12v7"/><circle cx="32" cy="10" r="3" fill="#efd28b"/>',
 order:'<rect x="13" y="9" width="39" height="47" rx="7" fill="#fff5dc"/><path d="M23 20h20M23 31h20M23 42h11"/>',
 spoon:'<ellipse cx="39" cy="18" rx="11" ry="15" transform="rotate(25 39 18)" fill="#d6dae9"/><path d="m33 30-16 27" stroke-width="7"/>',
 whisk:'<path d="m17 54 12-20M27 35C10-3 55-7 46 25L27 35ZM27 35C27 1 47 0 39 20Z" fill="#d1d6e7"/>',
 roller:'<path d="m6 50 11-10m32-24 9-10" stroke-width="8"/><rect x="21" y="11" width="23" height="44" rx="7" transform="rotate(45 32 33)" fill="#e8b77b"/>',
 kettle:'<path d="M19 23 8 16l1 18 12 7M43 20q23-5 17 15-2 8-15 5M20 21h25l5 29q-17 11-33 0ZM23 15h19M31 9h4" fill="#bda5df"/>',
 flour:'<path d="m19 8 27 0-2 12 9 34H12l8-34Z" fill="#fff0d0"/><path d="M20 20h24M32 28v17m0-9-6-5m6 10 6-6"/>',
 egg:'<path d="M33 6C18 6-3 55 32 57 68 57 47 6 33 6Z" fill="#ffe7c1"/><path d="m25 26 8 7-7 9"/>',
 scoop:'<path d="m34 28-15 27" stroke-width="9"/><circle cx="42" cy="18" r="15" fill="#c6e0e6"/><path d="M31 24q17 12 24-6"/>',
 cone:'<path d="m13 10 20 47 19-47Z" fill="#edba75"/><path d="m20 18 20 23m6-23L28 42"/>',
 chopper:'<path d="M11 12h31v25H11Z" fill="#c4d8dc"/><path d="M42 23h16" stroke-width="10"/><path d="M6 50h52" stroke="#c2956c" stroke-width="9"/>',
 brush:'<path d="m27 33 16-26q4-5 9 0l-15 28" fill="#e5b881"/><path d="M24 27 42 37 30 57 12 47Z" fill="#d8a1ce"/><path d="m20 42 9 5"/>',
 beans:'<ellipse cx="23" cy="22" rx="16" ry="11" transform="rotate(-35 23 22)" fill="#a46b57"/><ellipse cx="42" cy="43" rx="16" ry="11" transform="rotate(-35 42 43)" fill="#a46b57"/><path d="m14 28 15-12m4 34 15-12"/>',
 cocoa:'<path d="M12 12h40v41H12Z" fill="#a87561"/><path d="M12 31h40M32 12v41"/><path d="M18 18h8m12 0h8" stroke="#d8a88b"/>',
 tomato:'<circle cx="32" cy="34" r="23" fill="#f08886"/><path d="m32 13 0-8m0 12-12-6m12 6 12-6" stroke="#83ad6e"/>',
 mushroom:'<path d="m26 33-4 23h20l-4-23Z" fill="#fff0d1"/><path d="M7 34C4 0 60 0 57 34Z" fill="#cdaaaa"/><circle cx="24" cy="22" r="4" fill="#fff4e4"/>',
 peas:'<path d="M5 42Q25 6 58 16 44 53 5 42Z" fill="#badc96"/><circle cx="20" cy="34" r="8" fill="#85bd6f"/><circle cx="34" cy="29" r="8" fill="#85bd6f"/><circle cx="47" cy="23" r="7" fill="#85bd6f"/>',
 corn:'<path d="M19 49C7 34 22 3 37 5c24 1 13 36-1 47Z" fill="#ffdd7b"/><path d="m24 14 17 6m-21 7 18 6m-20 7 16 5M28 53 9 39l10 15 14 4 19-19Z" fill="#aed28f"/>',
 vanilla:'<path d="m15 45 28-33" stroke="#997263" stroke-width="10"/><path d="M37 18C25-7 13 24 35 23 12 40 48 48 42 27 61 37 67 3 44 18Z" fill="#fff4c9"/><circle cx="41" cy="22" r="6" fill="#e6bf6e"/>',
 sprinkles:'<rect x="18" y="12" width="29" height="42" rx="7" fill="#d7c4e8"/><path d="M20 21h25m-20-7h2m8 0h2m-9 18 4 5m6 4 3-4m-12 9 4 3"/><path d="M50 13 55 9M10 32l-5-3M48 60l5-4" stroke="#e9b668"/>',
 bun:'<path d="M6 35C4 2 59 2 58 35ZM6 43q26 23 52 0Z" fill="#f2ca86"/><path d="m20 20 4-3m14 1 4 3" stroke="#fff9df"/>',
 lettuce:'<path d="M8 22C2 8 25 2 28 14 39-4 59 15 49 22 71 37 44 52 34 43 18 68-5 42 14 35Z" fill="#a8d38f"/><path d="m24 51 15-30m-8 17-12-9" stroke="#729967"/>',
 pan:'<ellipse cx="25" cy="34" rx="22" ry="16" fill="#999abd"/><ellipse cx="25" cy="32" rx="15" ry="9" fill="#b47f61"/><path d="m44 28 15-10" stroke-width="9"/>',
 sauce:'<path d="M17 20h30v36H17ZM20 10h24v10H20Z" fill="#efaaa1"/><circle cx="32" cy="38" r="10" fill="#e67670"/>',
 sweetpotato:'<path d="M7 39C5 19 50 6 57 19 71 42 20 62 7 39Z" fill="#c69281"/><path d="M16 35 45 21 50 38 22 48Z" fill="#f4b06c"/>',
 milk:'<path d="m17 18 8-11h18l5 11v39H17ZM17 18h31M25 7v11" fill="#e8f6ed"/><path d="M21 33h22v15H21Z" fill="#a4c5dc"/>',
 carrot:'<path d="m20 22 24 12-32 24Z" fill="#efa26e"/><path d="m33 28 11-19m-11 19L30 6m3 22 23-8" stroke="#94be7c"/>',
 pancakes:'<ellipse cx="32" cy="44" rx="24" ry="9" fill="#e7ad61"/><ellipse cx="32" cy="34" rx="24" ry="9" fill="#f2c879"/><ellipse cx="32" cy="24" rx="24" ry="9" fill="#f6d58d"/><path d="m28 18 8-6 7 8-8 6Z" fill="#f3c55a"/>',
 smoothie:'<path d="M15 12h34l-4 45H19Z" fill="#ef9ec2"/><ellipse cx="32" cy="13" rx="17" ry="6" fill="#fff2e6"/><path d="M34 3 32 21" stroke="#8ecbd4" stroke-width="6"/>',
 blueberries:'<circle cx="22" cy="35" r="12" fill="#6f7fd1"/><circle cx="40" cy="30" r="12" fill="#7f8ce0"/><circle cx="34" cy="45" r="12" fill="#5968bd"/><path d="m21 22 3 6 6-3m10-8 2 7 7-1" stroke="#9fc493"/>',
 banana:'<path d="M11 20q9 29 39 24l5-10Q30 43 20 16Z" fill="#ffe177"/><path d="m18 17 2-7m31 34 5 4" stroke="#b88a43"/>',
 mango:'<path d="M18 12c-18 22 2 47 21 43 28-6 21-48-4-44-6-7-13-5-17 1Z" fill="#f7b45a"/><path d="M34 11q4-9 15-5M36 12q8 0 13 8" stroke="#7db477"/>',
 ladle:'<circle cx="43" cy="18" r="13" fill="#c9d5df"/><path d="m35 28-20 28" stroke-width="8"/>',
 spatula:'<path d="m22 7 16 0 3 26-22 0Z" fill="#c9d5df"/><path d="M30 33v25" stroke-width="8"/><path d="M26 13v12m8-12v12"/>',
 blender:'<path d="M17 12h30l-5 29H22Z" fill="#b8dfe0"/><path d="M21 41h22l5 14H16Z" fill="#aa91c7"/><circle cx="32" cy="48" r="3" fill="#fff1b3"/>',
 cup:'<path d="M16 11h32l-4 45H20Z" fill="#f8e8f0"/><path d="M21 27h22"/>',
 bubbles:'<circle cx="19" cy="39" r="10" fill="#dff8ff"/><circle cx="36" cy="25" r="13" fill="#f6ecff"/><circle cx="49" cy="44" r="9" fill="#dff8ff"/><circle cx="13" cy="18" r="6" fill="#fff"/>',
 sink:'<path d="M7 20h50v32H7Z" fill="#b9d3d7"/><ellipse cx="32" cy="30" rx="18" ry="10" fill="#7ca8b4"/><path d="M32 20V8h13q8 0 8 8"/>',
 floor:'<path d="M6 9h52v46H6Z" fill="#e5d7e8"/><path d="M6 25h52M6 41h52M23 9v46M41 9v46"/>',
 wall:'<path d="M7 8h50v49H7Z" fill="#b8a8d0"/><path d="m13 45 10-8 9 6 13-12 12 9"/>',
 chair:'<path d="M16 9h32v29H16Z" fill="#ad8bc3"/><path d="M19 38 14 57m31-19 5 19M12 36h40"/>',
 moon:'<path d="M43 8C18 12 12 45 36 55 15 58 2 39 8 22 14 5 31 0 43 8Z" fill="#fff3b0"/>',
 diamond:'<path d="m32 5 24 21-24 33L8 26Z" fill="#fff0d0"/><path d="m8 26 48 0M32 5 22 26l10 33 10-33Z"/>',
 sprinkleStars:'<path d="m18 8 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Zm30 19 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#f2c75a"/>',
 sprinkleHearts:'<path d="M19 31C-2 17 9 5 19 15 29 5 40 17 19 31Zm27 22C24 38 35 27 46 37c11-10 22 1 0 16Z" fill="#ee86b2"/>'
 };
 const data=p[name]||p.chef;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#61496f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+data+'</svg>';
}
function icon(name){return iconSVG(name);}
function toolData(name){
 if(images[name])return window.RR_ASSETS[name];
 const key='tool:'+name;if(!cache[key])cache[key]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(iconSVG(name));return cache[key];
}
function foodData(dish,variant){const key=dish+':'+variant;if(!cache[key]){const c=document.createElement('canvas');c.width=320;c.height=280;drawFood(c.getContext('2d'),dish,variant);cache[key]=c.toDataURL('image/png');}return cache[key];}
function badge(c,name,x,y,r,col){
 c.save();ellipse(c,x,y,r,r,col,'#fffdf2',5);ellipse(c,x,y,r-4,r-4,col,'#4f3864',2);
 if(name==='heart')heart(c,x,y+4,r*.65,'#fffdf2');
 else if(name==='star')star(c,x,y,r*.63,'#fffdf2');
 else if(name==='moon'){c.save();c.translate(x,y);path(c,()=>{c.moveTo(r*.35,-r*.62);c.bezierCurveTo(-r*.75,-r*.45,-r*.75,r*.52,r*.3,r*.66);c.bezierCurveTo(-r*.22,r*.32,-r*.18,-r*.25,r*.35,-r*.62);},'#fffdf2',null);c.restore();}
 else if(name==='diamond')poly(c,[[x,y-r*.7],[x+r*.62,y],[x,y+r*.7],[x-r*.62,y]],'#fffdf2',null);
 else{for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(c,x+Math.cos(a)*r*.32,y+Math.sin(a)*r*.32,r*.28,r*.28,'#fffdf2');}ellipse(c,x,y,r*.19,r*.19,'#efd286');}
 c.restore();
}
function drawDecorLayer(c,d){
 c.save();c.beginPath();c.rect(38,325,1723,705);c.clip();
 if(d.flooring==='mint'){c.fillStyle='#bce4d833';c.fillRect(38,325,1723,705);for(let y=350;y<1030;y+=95)for(let x=65;x<1760;x+=95){c.save();c.translate(x+(y%190?47:0),y);c.rotate(Math.PI/4);rect(c,-8,-8,16,16,4,'#79bea833',null);c.restore();}}
 else if(d.flooring==='peach'){c.fillStyle='#f7c7a32b';c.fillRect(38,325,1723,705);for(let y=355;y<1030;y+=86)for(let x=65;x<1760;x+=86)ellipse(c,x+(y%172?43:0),y,19,8,'#efac8b25',null);}
 else{c.fillStyle='#cdb7e22b';c.fillRect(38,325,1723,705);for(let y=340;y<1030;y+=92){c.strokeStyle='#ab8cc722';c.lineWidth=2;c.beginPath();c.moveTo(38,y);c.lineTo(1761,y);c.stroke();}}
 c.restore();
 c.save();c.beginPath();c.rect(38,28,1723,285);c.clip();
 if(d.wallpaper==='rainbow'){const cols=['#f2a8c5','#f4c77b','#a9d9cb','#abcce8','#c7afe3'];for(let i=0;i<10;i++){c.fillStyle=cols[i%cols.length]+'22';c.fillRect(38+i*173,28,175,285);}}
 else if(d.wallpaper==='garden'){c.fillStyle='#9ed1b522';c.fillRect(38,28,1723,285);for(let x=75;x<1750;x+=115){heart(c,x,70+(x%230),8,'#f3b6c755');star(c,x+35,115+(x%170),7,'#ffe2a455');}}
 else{c.fillStyle='#745c9a1f';c.fillRect(38,28,1723,285);for(let x=80;x<1750;x+=120)star(c,x,72+(x%180),5,'#fff3b055');}
 c.restore();
}
function chairColour(kind,i=0){if(kind==='mint')return ['#9ad6c4','#74bba9'][i%2];if(kind==='rainbow')return ['#ef92b9','#efc66f','#85cfc3','#91bde2','#b598db'][i%5];return ['#ab78ca','#885bad'][i%2];}
function drawChair(c,x,y,kind,i=0,flip=false){c.save();c.translate(x,y);if(flip)c.scale(-1,1);const col=chairColour(kind,i);rect(c,-39,-31,78,58,18,col,'#5a426d',4);rect(c,-33,14,66,27,14,grad(c,14,41,col,'#7e5d90'),'#5a426d',4);line(c,[[-26,38],[-31,61],[25,38],[31,61]],'#5a426d',7);heart(c,0,-4,12,'#fff1d7');c.restore();}
function drawTableFurniture(c,x,y,d,symbol,col,t=0){
 drawChair(c,x-86,y+34,d.chairs,0,false);drawChair(c,x+86,y+34,d.chairs,1,true);
 c.save();c.translate(x,y);const top=d.tabletop==='cream'?'#f9e7ca':d.tabletop==='berry'?'#d99bb7':'#d99b62',rim=d.tabletop==='cream'?'#c59a85':d.tabletop==='berry'?'#9c627e':'#945f51';
 if(d.tableType==='oval'){ellipse(c,0,0,110,55,grad(c,-55,55,top,rim),'#594064',5);}
 else if(d.tableType==='clover'){for(const [xx,yy] of [[-47,0],[47,0],[0,-29],[0,29]])ellipse(c,xx,yy,64,46,top,'#594064',4);ellipse(c,0,0,73,48,grad(c,-45,48,top,rim),null);}
 else ellipse(c,0,0,91,60,grad(c,-60,60,top,rim),'#594064',5);
 line(c,[[-38,46],[-48,90],[38,46],[48,90]],'#6d4751',10);
 if(d.decoration==='flowers'){rect(c,-15,-19,30,34,8,'#9f86c4','#594064',3);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(c,Math.cos(a)*16,-22+Math.sin(a)*9,9,7,['#fff2b0','#f2a4c2','#fff8e8'][i%3],'#8b688d',2);}}
 else if(d.decoration==='stars'){star(c,0,-14,24,'#ffe18b',t*.2);star(c,-28,-7,9,'#ef9fc0',t*.3);star(c,30,-4,8,'#9fd4d0',t*.4);}
 else if(d.decoration==='teapot'){rect(c,-21,-28,42,33,14,'#b7a4d8','#594064',3);ellipse(c,0,-28,15,7,'#e8daf4','#594064',2);heart(c,0,-11,10,'#fff0b0');line(c,[[20,-18],[36,-11],[22,-3]],'#594064',5);}
 else {ellipse(c,-17,-11,15,11,'#be8057','#6e4e54',2);ellipse(c,16,-7,15,11,'#c98c61','#6e4e54',2);for(const q of [[-21,-13],[-13,-6],[11,-10],[20,-4]])ellipse(c,q[0],q[1],3,3,'#6b514b',null);}
 c.restore();badge(c,symbol,x,y+72,21,col);
}
function drawSinkWorld(c,t=0){c.save();c.translate(1460,314);rect(c,-86,-27,172,60,18,'#c5d8dc','#604a6d',4);ellipse(c,0,-1,55,21,'#759da7','#ffffffcc',4);line(c,[[0,-22],[0,-57],[35,-57],[35,-38]],'#755b7f',7);ellipse(c,36,-34,5,8,'#a7e4ee',null);for(let i=0;i<3;i++)ellipse(c,-30+i*28,16+Math.sin(t*2+i)*3,8,7,'#ebfbffcc','#a2cfda',2);c.restore();}
function drawDirtyDish(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,0,0,56,17,'#ece4ef','#5a426d',4);ellipse(c,0,-4,45,12,'#fff9ef','#cbb9d3',3);for(const q of [[-22,-8],[7,-7],[24,-1],[-5,3]])ellipse(c,q[0],q[1],6,3,'#b98265',null);line(c,[[-25,5],[20,2]],'#bd9aaa',3);c.restore();}
function drawWash(c,progress,t=0){
 rect(c,38,34,244,208,38,grad(c,34,242,'#d9eef0','#9fc9d1'),'#5c496c',5);ellipse(c,160,143,91,48,'#79aeb8','#e7fbff',5);drawDirtyDish(c,160,142,1.05);const n=progress*5+4;for(let i=0;i<n;i++){const a=i*1.7+t*.4,rr=35+(i%4)*13;ellipse(c,160+Math.cos(a)*rr,135+Math.sin(a)*rr*.55,7+(i%3)*3,7+(i%3)*3,['#e9fbffdd','#f5eaffdd','#fff8dadd'][i%3],'#a7d4dc',2);}if(progress>=1){for(let i=0;i<7;i++)star(c,84+i*25,67+(i%2)*22,7,['#fff0a8','#f6b4d1','#b4e4df'][i%3],t*.4);}
}

async function load(){const failures=[];await Promise.all(Object.entries(window.RR_ASSETS).map(([key,url])=>new Promise(resolve=>{const im=new Image();let settled=false;const end=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(ok)images[key]=im;else failures.push(key);resolve();};const timer=setTimeout(()=>end(false),15000);im.onload=()=>end(true);im.onerror=()=>end(false);im.src=url;})));if(failures.length)throw new Error('Could not load: '+failures.join(', '));return images;}
Object.assign(A,{images,load,sprite,drawFood,foodData,toolData,icon,iconSVG,badge,drawDecorLayer,drawTableFurniture,drawSinkWorld,drawDirtyDish,drawWash,rect,ellipse,poly,line,heart,star,steam,grad,shine,plate});window.RRArt=A;
})();
