/* Rainbow Restaurant v1.3.0 Part 4 — separated room/station/furniture renderer plus the Part 3 cooking-art presentation.
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
function swirl(c,x,y,r,turns=3,col="#ffffff88"){
 c.save();c.strokeStyle=col;c.lineWidth=3;c.beginPath();
 for(let i=0;i<=28;i++){const k=i/28,ang=k*Math.PI*turns*2;const rr=r*(.2+.8*k);const px=x+Math.cos(ang)*rr*.48,py=y+Math.sin(ang)*rr*.22;c[i?"lineTo":"moveTo"](px,py);}c.stroke();c.restore();
}
function syrup(c,x,y,w=82,h=40){
 c.save();path(c,()=>{c.moveTo(x-w*.45,y-h*.1);c.bezierCurveTo(x-w*.35,y-h*.4,x-w*.1,y-h*.35,x,y-h*.18);c.bezierCurveTo(x+w*.12,y-h*.05,x+w*.28,y-h*.12,x+w*.4,y-h*.32);c.lineTo(x+w*.34,y+h*.2);c.bezierCurveTo(x+w*.17,y+h*.35,x-w*.2,y+h*.32,x-w*.38,y+h*.14);c.closePath();},grad(c,y-h*.35,y+h*.2,'#f0be62','#c9824e'),'#9c654a',3);c.restore();
}
function drawFood(c,dish,variant,prep=null,t=0){
 const recipe=RR.RECIPES[dish],steps=recipe.steps.length;
 const s=prep?prep.step:steps,p=prep?prep.p:0;
 const f=i=>clamp(s-i+(s===i?p/(recipe.steps[i]?.need||1):0),0,1);
 c.save();c.lineCap='round';c.lineJoin='round';
 // Production food states use the inspected ChatGPT B sprites in all runtime contexts.
 if(dish==='chicken'&&images.chicken_raw){
  plate(c);if(f(0)>0)sprite(c,'chicken_raw',146,231,163,183);
  if(f(1)>0)for(let i=0;i<Math.ceil(f(1)*3);i++)sprite(c,'chicken_wedge',219+i*21,219-(i%2)*28,49,69);
  if(f(2)>0){c.save();c.globalAlpha=f(2);sprite(c,'chicken_glaze',146,231,163,183);c.restore();}
  if(variant&&f(3)>0)sprite(c,variant==='corn'?'veg_corn':'veg_peas',86,219,71,64);
  if(f(4)>0){c.save();c.globalAlpha=f(4);sprite(c,'chicken_roast',146,231,163,183);c.restore();steam(c,156,59,t);}
  c.restore();return;
 }
 if(dish==='pancakes'&&images.pancake_batter){
  if(s<=0){sprite(c,'pancake_batter',160,238,260,218);if(p>0)swirl(c,160,127,47,3,'#fff7d6');}
  else{plate(c);const count=prep?Math.ceil(f(1)*3):3;for(let i=0;i<count;i++){const y=229-i*29;sprite(c,'pancake_raw',160,y,211-i*5,81);if(f(2)>0){c.save();c.globalAlpha=f(2);sprite(c,'pancake_brown',160,y,211-i*5,81);c.restore();}}
  if(variant&&f(4)>0){sprite(c,'pancake_syrup',160,149,101,68);for(let i=0;i<Math.ceil(f(4)*6);i++)sprite(c,variant==='banana'?'fruit_banana':'fruit_berries',110+(i*29)%103,143+(i%3)*13,34,30);}}
  c.restore();return;
 }
 if(dish==='smoothie'&&images.smoothie_blender){
  if(s<4){const shake=s===3&&p>0&&!prep?.done?Math.sin(t*24)*3:0;c.save();c.translate(shake,0);sprite(c,'smoothie_blender',160,267,174,239);
   if(variant){const key=variant==='mango'?'fruit_mango':'fruit_strawberry',n=Math.ceil(f(1)*3);for(let i=0;i<n;i++){c.save();c.globalAlpha=1-f(3)*.65;sprite(c,key,139+(i%2)*36,135+i*21,36,39);c.restore();}}
   if(f(2)>0){c.save();c.globalAlpha=f(2)*.6;ellipse(c,160,163,49,29,'#fff7dd');c.restore();}
   if(f(3)>0){c.save();c.globalAlpha=f(3);ellipse(c,160,164,47,27,variant==='mango'?'#ffc875':'#f49cc2');swirl(c,160,161,33,3,'#fff3dbaa');c.restore();}c.restore();
  }else{plate(c);c.save();c.globalAlpha=.25+.75*f(4);sprite(c,variant==='mango'?'smoothie_mango':'smoothie_strawberry',160,244,156,218);c.restore();}
  c.restore();return;
 }
 if(dish==='coffee'&&images.coffee_empty){
  plate(c);if(s===0){sprite(c,'coffee_beans',160,230,223,172);if(p>0){c.save();c.globalAlpha=f(0);swirl(c,160,159,46,3,'#ead2a7');c.restore();}}
  else{sprite(c,'coffee_empty',160,239,218,204);if(f(1)>0){c.save();c.globalAlpha=f(1);sprite(c,'coffee_black',160,239,218,204);c.restore();}if(variant&&f(2)>0)sprite(c,'coffee_'+variant,160,239,218,204);if(f(3)>0)swirl(c,148,81,37,2.5,'#fff0cdaa');if(f(1))steam(c,152,50,t);}
  c.restore();return;
 }
 if(dish==='cupcake'&&images.cupcake_plain){
  if(s<=2){sprite(c,s===0?'cupcake_flour':'cupcake_batter',160,238,260,214);if(s===1&&p>0){c.save();c.globalAlpha=f(1);sprite(c,'cupcake_batter',160,238,260,214);c.restore();}if(s===2)swirl(c,160,136,48,2.7,'#ffffff99');}
  else{plate(c);sprite(c,'cupcake_plain',160,236,183,167);if(variant&&f(4)>0)sprite(c,'cupcake_'+variant,160,236,183,209);if(f(5)>0){if(prep?.deco==='hearts')for(let i=0;i<7;i++)heart(c,117+i*13,75+(i%3)*18,9,'#fff0b8');else if(prep?.deco==='stars')for(let i=0;i<7;i++)star(c,117+i*13,75+(i%3)*18,6,'#ffe17f');else sprite(c,'ice_sprinkles',160,113,77,60);}}
  c.restore();return;
 }
 if(dish==='burger'&&images.burger_bottom){
  plate(c);if(f(0)>0)sprite(c,'burger_bottom',160,239,231,117);
  if(f(1)>0){c.save();c.globalAlpha=f(1);sprite(c,'burger_patty',160,209,221,119);c.restore();}
  if(variant&&f(2)>0){if(variant==='cheese')sprite(c,'burger_cheese',160,187,235,104);else for(let i=0;i<3;i++)sprite(c,'pizza_tomato',104+i*55,181,76,60);}
  if(f(3)>0){c.save();c.globalAlpha=f(3);sprite(c,'burger_lettuce',160,164,240,105);c.restore();}
  if(f(4)>0)sprite(c,'burger_top',160,151,237,136);
  if(s===1&&p>0)steam(c,160,100,t);c.restore();return;
 }
 if(dish==='soup'&&images.soup_empty){
  sprite(c,'soup_empty',160,251,270,213);
  if(f(0)>0){c.save();c.globalAlpha=f(0);sprite(c,'soup_broth',160,251,270,213);c.restore();}
  if(variant&&s>=2){c.save();c.globalAlpha=f(2);sprite(c,'soup_'+variant,160,251,270,213);c.restore();if(s===2&&variant==='carrot')for(let i=0;i<Math.ceil(p);i++)sprite(c,'soup_chunk',112+i*45,107+(i%2)*10,29,26);}
  if(f(3)>0)swirl(c,160,95,45,2.8,'#ffffff99');if(f(4)>0)steam(c,160,45,t);c.restore();return;
 }
 if(dish==='pizza'&&images.pizza_dough){
  plate(c);const size=230*(.72+.28*f(0));sprite(c,'pizza_dough',160,229,size,158);
  for(const [key,progress] of [['pizza_sauce',f(1)],['pizza_cheese',f(2)]])if(progress>0){c.save();c.globalAlpha=progress;sprite(c,key,160,229,230,158);c.restore();}
  const pts=prep?.placements?.length?prep.placements:[{x:.32,y:.4},{x:.5,y:.6},{x:.68,y:.4}];
  if(variant&&s>=4)for(let i=0;i<(prep?pts.length:3);i++){const q=pts[i];sprite(c,variant==='mushroom'?'pizza_mushroom':'pizza_tomato',160+(q.x-.5)*190,167+(q.y-.5)*95,37,31);}
  if(f(5)>0)steam(c,160,70,t);
  c.restore();return;
 }
 if(dish==='icecream'&&images.ice_cone){
  // The three-scoop stack must fit the same 320x280 food frame as every card.
  c.translate(160,28);c.scale(.88,.88);c.translate(-160,0);
  if(f(0)>0)sprite(c,'ice_cone',160,270,112,163);
  const count=Math.max(0,Math.min(3,s>2?3:s===2?Math.ceil(p):0));
  if(variant)for(let i=0;i<count;i++)sprite(c,variant==='strawberry'?'ice_strawberry':'ice_vanilla',160,154-i*33,115,107);
  if(s>=3&&f(3)>0){c.save();c.globalAlpha=f(3);sprite(c,'ice_sprinkles',160,96,80,65);c.restore();}
  c.restore();return;
 }
 if(dish==='pizza'){
  plate(c);const dough=.7+.3*f(0);c.save();c.translate(160,164);c.scale(dough,dough);
  ellipse(c,0,3,118,69,grad(c,-63,67,'#ffe6a3',f(5)?'#d38b53':'#efc78f'),ink,5);ellipse(c,0,-7,99,54,'#fff4ce',null);
  if(f(0)<1)for(let i=0;i<8;i++)line(c,[[-75+i*20,-20+(i%2)*9],[-88+i*22,18-(i%3)*5]],'#e2ba84',2);
  if(f(1)>0){ellipse(c,0,-7,97*Math.sqrt(f(1)),50*Math.sqrt(f(1)),'#e97970',null);swirl(c,0,-7,46,2,'#fff0df55');}
  if(f(2)>0){ellipse(c,0,-10,92*Math.sqrt(f(2)),45*Math.sqrt(f(2)),grad(c,-50,35,'#fff4af','#f6cf79'),null);for(let i=0;i<16*f(2);i++)ellipse(c,-68+(i*37)%138,-32+(i*17)%50,4,2,'#e2aa57',null);}
  if(variant&&f(4)>0){const defaults=[[-54,-27],[-12,-34],[30,-26],[-60,9],[-8,5],[46,8]],pts=prep?.placements?.length?prep.placements.map(q=>[(q.x-.5)*175,(q.y-.5)*88]):defaults;const n=prep?Math.max(0,Math.ceil(f(4)*pts.length)):pts.length;for(let i=0;i<Math.min(n,pts.length);i++){const [x,y]=pts[i];(variant==='mushroom'?mushroom:tomato)(c,x,y,13);}}
  shine(c,-44,-47,28,5);c.restore();if(f(5)>0)steam(c,161,79,t);
 }else if(dish==='coffee'){
  plate(c);
  if(s===0){rect(c,68,88,184,112,28,'#c7dce1',ink,5);ellipse(c,160,89,74,26,'#eadcc5',ink,5);for(let i=0;i<9;i++){const x=111+(i*19)%98,y=86+(i%3)*11;if(i<p*3)ellipse(c,x,y,8,5,'#775043');else bean(c,x,y,10);}line(c,[[160,58],[160,36],[209,36]],ink,8);ellipse(c,216,37,12,8,'#eeb587',ink,3);}
  else{
   ellipse(c,241,148,38,41,'#fff3ea',ink,6);ellipse(c,241,148,21,24,'#e9def2',ink,4);
   path(c,()=>{c.moveTo(67,95);c.lineTo(79,204);c.bezierCurveTo(86,244,220,244,227,204);c.lineTo(239,95);c.closePath();},grad(c,95,232,'#ffc7d8','#e696bc'),ink,5);
   ellipse(c,153,94,86,30,'#fff6e8',ink,5);ellipse(c,153,98,73,22,f(1)?(variant==='cocoa'?'#996d5a':variant==='milk'?'#d9b78d':'#7b5645'):'#eedcca');
   if(variant&&f(2)){heart(c,155,109,17,variant==='cocoa'?'#e1c1a8':'#fff6e7');}
   if(f(3)>0){swirl(c,153,98,35,2.2,'#fff7efaa');}
   heart(c,151,178,26,'#fff1dc');shine(c,93,148,6,25);if(f(1))steam(c,158,58,t);
  }
 }else if(dish==='cupcake'){
  if(s<=2){bowl(c,s===0?'#fff2cf':s===1?'#ffe192':'#f1c47f');for(let i=0;i<8;i++)ellipse(c,110+(i*17)%102,132+(i*11)%18,4+s*2,3,'#fff5d49f');if(s<2&&p<1){ellipse(c,173,132,21,14,'#ffe074');ellipse(c,169,128,7,3,'#fff5b0');}if(s===2||f(2)>0)swirl(c,160,138,34,2.6,'#d7a66f');}
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
  const count=Math.max(0,Math.min(3,s>2?3:(s===2?Math.ceil(p):0)));
  if(f(0)>0){poly(c,[[95,139],[225,139],[160,266]],grad(c,130,265,'#f8d28e','#c98a56'),ink,5);for(let i=0;i<5;i++){line(c,[[108+i*19,146],[166+i*8,219-i*15]],'#d29b60',2);line(c,[[210-i*19,146],[153-i*8,219-i*15]],'#d29b60',2);}shine(c,126,165,3,11);}
  if(variant&&s>=1){const scCol=variant==='strawberry'?['#ffe3f0','#eb9cc0']:['#fff9df','#ecd8ab'];const pos=[[160,160],[126,129],[194,129]];for(let i=0;i<count;i++){const [xx,yy]=pos[i];ellipse(c,xx,yy,45,39,grad(c,yy-39,yy+39,...scCol),ink,4);for(let j=0;j<3;j++)ellipse(c,xx-22+j*21,yy+28,15,11,scCol[1],null);shine(c,xx-14,yy-20,18,7);}if(prep&&s===2&&count<3){const [xx,yy]=pos[Math.min(count,2)];c.save();c.globalAlpha=.25;ellipse(c,xx,yy,45,39,scCol[0],ink,3);c.restore();}}
  if(s>=3&&f(3))sprinkles(c,Math.ceil(f(3)*18),97);
  if(!f(0)){ellipse(c,160,229,97,19,'#a694b822');}
 }else if(dish==='burger'){
  plate(c);
  if(f(0)>0){path(c,()=>{c.moveTo(60,198);c.bezierCurveTo(62,255,257,252,260,198);c.closePath();},grad(c,196,242,'#ffdf93','#d9a35d'),ink,5);ellipse(c,160,198,100,24,'#f9d599',ink,4);}
  if(f(1)>0){rect(c,58,164,204,42,22,grad(c,164,206,'#9a6753','#644743'),ink,5);for(let i=0;i<5;i++)line(c,[[91+i*33,171],[79+i*33,189]],'#492f38',4);} 
  if(variant&&f(2)>0){if(variant==='cheese')poly(c,[[61,160],[130,143],[260,159],[245,181],[195,175],[174,193],[153,172],[77,177]],'#ffe07d',ink,4);else{tomato(c,116,161,18);tomato(c,160,157,18);tomato(c,204,161,18);}}
  if(f(3)>0)path(c,()=>{c.moveTo(58,144);c.bezierCurveTo(75,129,86,149,100,131);c.bezierCurveTo(121,116,129,147,149,128);c.bezierCurveTo(165,109,178,146,197,127);c.bezierCurveTo(219,113,239,143,259,136);c.lineTo(250,155);c.lineTo(227,164);c.lineTo(200,151);c.lineTo(176,169);c.lineTo(145,153);c.lineTo(124,167);c.lineTo(90,153);c.lineTo(63,160);c.closePath();},'#a8d98b',ink,4);
  if(f(4)>0){path(c,()=>{c.moveTo(58,129);c.bezierCurveTo(53,38,270,38,261,129);c.closePath();},grad(c,63,131,'#ffe5a0','#e5b25f'),ink,5);for(const [x,y] of [[93,104],[117,82],[161,89],[211,92],[185,66]]){c.save();c.translate(x,y);c.rotate(x*.07);ellipse(c,0,0,8,3,'#fff4ca');c.restore();}}
  if(s===1&&p>0)steam(c,160,126,t);
 }else if(dish==='soup'){
  ellipse(c,60,152,29,18,'#8fb5ba',ink,4);ellipse(c,260,152,29,18,'#8fb5ba',ink,4);
  path(c,()=>{c.moveTo(68,112);c.lineTo(73,204);c.bezierCurveTo(82,258,239,258,248,204);c.lineTo(252,112);c.closePath();},grad(c,110,249,'#c3e6df','#71abae'),ink,5);
  ellipse(c,160,114,94,36,'#e6f8ea',ink,5);ellipse(c,160,117,80,27,f(0)?(variant==='peas'?'#a2c97b':variant==='carrot'?'#e8b476':'#c0dfdf'):'#749eac');
  if(variant&&f(1)>0){const amount=prep?Math.max(1,Math.ceil(f(2)*14)):14;for(let i=0;i<amount;i++){const x=102+(i*29)%118,y=102+(i*13)%28;if(variant==='peas')pea(c,x,y,s>=3?6:8);else{c.save();c.translate(x,y);c.rotate(i*.4);rect(c,-6,-5,s>=3?10:16,s>=3?8:11,3,'#f7a45f','#bd8059',2);c.restore();}}}
  if(f(3)>0){swirl(c,160,117,48,2.4,'#ffffff99');swirl(c,160,117,31,1.7,'#ffffff77');}
  shine(c,98,165,7,23);heart(c,160,191,23,'#edf8e7');if(f(4)>0)steam(c,160,66,t);
 }else if(dish==='pancakes'){
  plate(c);const made=prep?Math.max(0,Math.ceil(f(1)*3)):3, flipped=prep?f(2):1;
  if(!f(1)&&f(0)>0){bowl(c,'#f2d390');swirl(c,160,138,35,2.2,'#d7b05d');}
  for(let i=0;i<made;i++){const yy=202-i*28,sc=1-i*.04;ellipse(c,160,yy,84*sc,23*sc,grad(c,yy-20,yy+20,flipped?'#f4ca7b':'#f7dda1','#dca45d'),ink,4);shine(c,128,yy-10,24,5);} 
  if(variant&&f(3)>0){const n=prep?Math.max(0,Math.ceil(f(4)*8)):8;if(variant==='berries'){for(let i=0;i<n;i++){ellipse(c,105+(i*29)%112,128+(i*17)%45,9,8,'#7180d8','#4e4b89',2);shine(c,102+(i*29)%112,125+(i*17)%45,3,2);}}else{for(let i=0;i<n;i++){c.save();c.translate(103+(i*27)%118,129+(i*15)%48);c.rotate(i*.35);ellipse(c,0,0,14,8,'#ffe081','#d5a54f',2);c.restore();}}}
  if(f(4)>0)syrup(c,161,102,74,28);
 }else if(dish==='smoothie'){
  plate(c);rect(c,102,62,116,166,27,grad(c,62,228,variant==='mango'?'#ffd26f':'#f49cc0',variant==='mango'?'#f0a45c':'#c66ca7'),ink,5);ellipse(c,160,66,58,19,'#fff5e7',ink,4);rect(c,151,28,12,50,5,'#9bcfd4',ink,3);ellipse(c,160,222,54,16,'#ffffff55',null);shine(c,127,107,9,37);
  if(!variant||s===0){c.save();c.globalAlpha=.3;ellipse(c,160,145,37,37,'#fff1d7',ink,3);c.restore();}
  if(variant&&f(1)>0){const n=prep?Math.max(1,Math.ceil(f(1)*6)):6;for(let i=0;i<n;i++){if(variant==='mango')rect(c,120+(i*21)%80,105+(i*23)%70,13,13,4,'#f8b856','#c88745',2);else{ellipse(c,125+(i*23)%78,110+(i*19)%70,10,9,'#ef779a','#b95b7d',2);}}}
  if(f(2)>0){c.save();c.globalAlpha=.28*f(2);ellipse(c,160,132,46,62,'#fff9e8',null);c.restore();}
  if(f(3)>0){for(let i=0;i<3;i++)path(c,()=>c.ellipse(160,143,22+i*13,13+i*7,t*2+i,0,Math.PI*1.7),null,'#ffffff99',3);} 
  if(f(4)>0){path(c,()=>{c.moveTo(160,87);c.lineTo(183,126);c.lineTo(137,126);c.closePath();},'#fff0d0','#7b5d6f',3);} 
 }else if(dish==='chicken'){
  plate(c);
  if(f(0)>0)boneChicken(c,131,151,f(4)>0||s>=4,.9);
  for(let i=0;i<Math.ceil(f(1)*5);i++)wedge(c,219+(i%2)*28,146+Math.floor(i/2)*30,-.4+i*.35);
  if(f(2)>0){for(let i=0;i<3;i++)line(c,[[86+i*21,144],[111+i*18,156]],'#edb765',5);shine(c,108,145,18,4);} 
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
 settings:'<path d="M32 8 37 10 41 7 47 13 44 17 46 22 52 23 52 32 47 34 45 39 48 44 41 51 37 48 32 50 28 48 23 51 16 44 19 39 17 34 12 32 12 23 18 22 20 17 17 13 24 7 28 10Z" fill="#d8b6e8"/><circle cx="32" cy="29" r="9" fill="#fff1b0"/>',
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
 cloth:'<path d="M6 23q26-23 52 0v25q-8 13-16 4-10 14-21 0-8 9-15-4Z" fill="#ecc5d8"/><path d="M6 24q26 20 52 0M18 33v18m27-18v18" stroke="#b08db9"/><path d="m23 15 7-5 7 6-7 5Z" fill="#fff3c4"/>',
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
 const painted={tomato:'pizza_tomato',mushroom:'pizza_mushroom',cone:'ice_cone',vanilla:'ice_vanilla',scoop:'ice_strawberry',sprinkles:'ice_sprinkles',beans:'coffee_beans',flour:'cupcake_flour',egg:'cupcake_batter',bun:'burger_top',pan:'burger_patty',cheese:'burger_cheese',lettuce:'burger_lettuce',carrots:'soup_chunk',chopper:'soup_chunk',chicken:'chicken_raw',sweetpotato:'chicken_wedge',peas:'veg_peas',corn:'veg_corn',whisk:'pancake_batter',ladle:'pancake_batter',blueberries:'fruit_berries',banana:'fruit_banana',blender:'smoothie_blender',milk:'smoothie_milk',strawberry:'fruit_strawberry',mango:'fruit_mango',fruit:'fruit_strawberry',cup:'smoothie_strawberry'};if(painted[name]&&images[painted[name]])return window.RR_ASSETS[painted[name]];
 if(images[name])return window.RR_ASSETS[name];
 const key='tool:'+name;if(!cache[key])cache[key]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(iconSVG(name));return cache[key];
}
function foodData(dish,variant){
 const key=dish+':'+variant;
 if(!cache[key]){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=280;
  const context=canvas.getContext('2d');drawFood(context,dish,variant);
  if(dish==='icecream'){
   // Tight portrait artwork lets object-fit contain scale the complete cone,
   // rather than sizing a wide transparent canvas around a narrow drawing.
   const pixels=context.getImageData(0,0,320,280).data;let left=320,top=280,right=-1,bottom=-1;
   for(let y=0;y<280;y++)for(let x=0;x<320;x++)if(pixels[(y*320+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   if(right>=left){const margin=8,crop=document.createElement('canvas');crop.width=right-left+1+margin*2;crop.height=bottom-top+1+margin*2;crop.getContext('2d').drawImage(canvas,left,top,right-left+1,bottom-top+1,margin,margin,right-left+1,bottom-top+1);cache[key]=crop.toDataURL('image/png');}
  }
  if(!cache[key])cache[key]=canvas.toDataURL('image/png');
 }
 return cache[key];
}
function badge(c,name,x,y,r,col){
 c.save();ellipse(c,x,y,r,r,col,'#fffdf2',5);ellipse(c,x,y,r-4,r-4,col,'#4f3864',2);
 if(name==='heart')heart(c,x,y+4,r*.65,'#fffdf2');
 else if(name==='star')star(c,x,y,r*.63,'#fffdf2');
 else if(name==='moon'){c.save();c.translate(x,y);path(c,()=>{c.moveTo(r*.35,-r*.62);c.bezierCurveTo(-r*.75,-r*.45,-r*.75,r*.52,r*.3,r*.66);c.bezierCurveTo(-r*.22,r*.32,-r*.18,-r*.25,r*.35,-r*.62);},'#fffdf2',null);c.restore();}
 else if(name==='diamond')poly(c,[[x,y-r*.7],[x+r*.62,y],[x,y+r*.7],[x-r*.62,y]],'#fffdf2',null);
 else{for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(c,x+Math.cos(a)*r*.32,y+Math.sin(a)*r*.32,r*.28,r*.28,'#fffdf2');}ellipse(c,x,y,r*.19,r*.19,'#efd286');}
 c.restore();
}
// v1.3.0 Part 1 rendering foundation: architecture is cached separately from
// stations/furniture. Theme changes can never bake or duplicate a sink, kitchen,
// sofa, plant, table or chair beneath the selected objects.
const shellCache={};
function drawRoomShell(c,d){
 const key=d.flooring+':'+d.wallpaper;
 if(!shellCache[key]){
  for(const stale of Object.keys(shellCache))delete shellCache[stale];
  const layer=document.createElement('canvas');layer.width=1800;layer.height=1100;const z=layer.getContext('2d');
  z.fillStyle='#3d2f58';z.fillRect(0,0,1800,1100);
  z.drawImage(images['room_floor_'+d.flooring],35,20,1730,1060);
  z.drawImage(images['room_wall_'+d.wallpaper],35,20,1730,300);
  // Architectural frame only. No movable furniture or cooking stations.
  rect(z,25,12,1750,18,7,grad(z,12,30,'#a99ac1','#56446e'),'#423257',3);
  rect(z,29,308,1742,23,6,grad(z,308,331,'#bd94ae','#705574'),'#654867',3);
  rect(z,12,20,27,1060,10,grad(z,20,1078,'#9375a9','#554068'),'#413052',4);
  rect(z,1762,20,26,1060,10,grad(z,20,1078,'#9375a9','#554068'),'#413052',4);
  rect(z,25,1063,1749,23,9,grad(z,1063,1086,'#bda2c4','#614969'),'#4b365b',4);
  sprite(z,'room_window',227,229,252,206);sprite(z,'room_window',1527,241,266,219);
  for(const x of [394,1380]){z.save();z.shadowColor='#ffd99099';z.shadowBlur=28;ellipse(z,x,359,34,7,'#47325235');sprite(z,'room_lamp',x,365,76,181);z.restore();}
  // The customer entrance is architecture, not a foreground mask.
  sprite(z,'room_door',1490,1045,162,166);
  shellCache[key]=layer;
 }
 c.drawImage(shellCache[key],0,0);
}
function drawStationLayer(c,t=0){
 c.save();
 // Hard room clip prevents any station shadow/alpha fringe from ever exposing
 // pixels outside the playable room shell on narrow camera crops.
 c.beginPath();c.rect(35,20,1730,1043);c.clip();
 c.save();c.shadowColor='#3d254144';c.shadowBlur=17;c.shadowOffsetY=9;sprite(c,'painted_kitchen',895,365,909,298);c.restore();
 ellipse(c,220,600,135,17,'#47325235');sprite(c,'station_dj',220,600,280,260);
 ellipse(c,1620,650,110,15,'#47325235');sprite(c,'station_cashier',1620,650,240,245);
 ellipse(c,1450,359,105,10,'#47325235');sprite(c,'painted_sink',1450,365,234,216);
 for(let i=0;i<3;i++){const a=.45+.18*Math.sin(t*2+i);c.globalAlpha=a;star(c,1395+i*28,238+(i%2)*19,5+i,'#fff1ad',t*.1);}
 c.restore();
}
// Compatibility helpers for editor/tests. Runtime uses the explicit shell/station calls.
function drawRoom(c,d){drawRoomShell(c,d);}
function drawDecorLayer(c,d,t=0){drawRoomShell(c,d);drawStationLayer(c,t);}
function clothOf(d){return d.tablecloth||d.tabletop||'honey';}
function tableSpriteKey(d){return 'dining_'+d.tableType;}
const diningCache={};
function tableImage(d){
 const im=images[tableSpriteKey(d)],cloth=clothOf(d),key=d.tableType+':'+cloth;
 if(!im||cloth==='cream')return im;if(diningCache[key])return diningCache[key];
 const v=document.createElement('canvas');v.width=im.width;v.height=im.height;const z=v.getContext('2d');z.drawImage(im,0,0);
 const data=z.getImageData(0,0,v.width,v.height),a=data.data;
 const colours={honey:[255,230,158],sky:[184,219,241],berry:[238,168,201],gingham:[249,205,221]},rainbow=[[243,183,202],[248,211,154],[235,226,167],[188,220,200],[181,210,235],[212,190,228]];
 for(let y=0;y<v.height;y++)for(let x=0;x<v.width;x++){
  const i=(y*v.width+x)*4,r=a[i],g=a[i+1],b=a[i+2];
  // Only neutral fabric, leaving purple wood, gold edging and transparent pixels intact.
  if(!a[i+3]||r<150||g<135||b<110||r-g>40||g-b>65||b>g+12)continue;
  let col=colours[cloth]||rainbow[Math.min(5,Math.floor(x/v.width*6))];
  if(cloth==='gingham'&&(Math.floor(x/26)+Math.floor(y/19))%2)col=[232,162,192];
  const shade=(r+g+b)/3/235,mix=cloth==='honey'?.62:.78;
  for(let k=0;k<3;k++)a[i+k]=clamp(a[i+k]*(1-mix)+col[k]*shade*mix,0,255);
 }
 z.putImageData(data,0,0);diningCache[key]=v;return v;
}
function drawTableFurniture(c,x,y,d,symbol,col,t=0,marker=true,seatGuest=null){
 c.save();
 // Independent floor shadows and foreground chairs preserve furniture depth.
 ellipse(c,x,y+80,80,15,'#47325225');
 for(const dx of [-125,125])ellipse(c,x+dx,y+105,48,13,'#47325225');
 const im=tableImage(d);
 if(im){const w=d.tableType==='oval'?170:156,h=132;c.drawImage(im,x-w/2,y-55,w,h);}
 // The chosen prop is independent; generated fixed props were removed offline.
 if(d.decoration==='flowers')sprite(c,'flowers',x,y-1,40,42);
 else if(d.decoration==='teapot')sprite(c,'teapot',x,y-2,40,38);
 else if(d.decoration==='plant')sprite(c,'room_plant',x,y-2,36,45);
 else if(d.decoration==='cupcake')sprite(c,'cupcake',x,y-2,39,41);
 else if(d.decoration==='cookies'){sprite(c,'cookie',x-10,y,28,22);sprite(c,'cookie',x+10,y-3,28,23);}
 else{sprite(c,'star',x,y-3,35,34);}
 // Chairs are nearer the viewer than the table; its cloth cannot cut their arms.
 sprite(c,'chair_'+d.chairs,x-125,y+105,124,128,false);
 sprite(c,'chair_'+d.chairs,x+125,y+105,124,128,true);
 // Foreground seats keep the face, lap and bent legs clear of the table.
 if(seatGuest)seatGuest();
 // Table identities sit on the floor in front of the furniture.
 if(marker)badge(c,symbol,x,y+135,27,col);
 c.restore();
}
function drawSinkWorld(c,t=0){
 // Backward-compatible sink-only helper. New world rendering uses drawStationLayer.
 c.save();ellipse(c,1450,359,105,10,'#47325235');sprite(c,'painted_sink',1450,365,234,216);
 for(let i=0;i<3;i++){const a=.45+.18*Math.sin(t*2+i);c.globalAlpha=a;star(c,1395+i*28,238+(i%2)*19,5+i,'#fff1ad',t*.1);}
 c.restore();
}
function customData(stage,id,decor){
 const d={...decor,[stage]:id};const key='custom:'+stage+':'+id+':'+d.tableType+':'+clothOf(d)+':'+d.decoration+':'+d.chairs;
 if(cache[key])return cache[key];
 const v=document.createElement('canvas');v.width=240;v.height=190;const c=v.getContext('2d');
 if(stage==='chairs'){sprite(c,'chair_'+id,120,182,169,172);}
 else if(stage==='decoration'){const k=id==='stars'?'star':id==='cookies'?'cookie':id==='plant'?'room_plant':id;sprite(c,k,120,168,138,150);}
 else if(stage==='flooring'||stage==='wallpaper'){
  const im=images[(stage==='flooring'?'room_floor_':'room_wall_')+id];c.save();rect(c,12,20,216,148,24,'#fff8ec','#725479',5);c.clip();c.drawImage(im,12,20,216,148);c.restore();
 }else{
  const im=tableImage(d);if(im){const w=d.tableType==='oval'?223:198;c.drawImage(im,120-w/2,2,w,184);}
 }
 cache[key]=v.toDataURL('image/png');return cache[key];
}

function drawDirtyDish(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,0,0,56,17,'#ece4ef','#5a426d',4);ellipse(c,0,-4,45,12,'#fff9ef','#cbb9d3',3);for(const q of [[-22,-8],[7,-7],[24,-1],[-5,3]])ellipse(c,q[0],q[1],6,3,'#b98265',null);line(c,[[-25,5],[20,2]],'#bd9aaa',3);c.restore();}
function drawWash(c,progress,t=0){
 if(images.painted_sink)c.drawImage(images.painted_sink,24,6,272,259);
 ellipse(c,149,113,63,20,'#83d7ed77','#defbff',2);
 if(progress<1)drawDirtyDish(c,149,113,.77);else{ellipse(c,149,113,43,13,'#fffbee','#bcb1d9',3);shine(c,140,108,16,4);}
 const n=progress*5+4;for(let i=0;i<n;i++){const a=i*1.7+t*.4,rr=25+(i%4)*8;ellipse(c,149+Math.cos(a)*rr,108+Math.sin(a)*rr*.3,5+(i%3)*2,5+(i%3)*2,['#e9fbffdd','#f5eaffdd','#fff8dadd'][i%3],'#a7d4dc',2);}
 if(progress>=1)for(let i=0;i<7;i++)star(c,84+i*25,61+(i%2)*18,7,['#fff0a8','#f6b4d1','#b4e4df'][i%3],t*.4);
}

async function load(){const failures=[];await Promise.all(Object.entries(window.RR_ASSETS).map(([key,url])=>new Promise(resolve=>{const im=new Image();im.crossOrigin='anonymous';let settled=false;const end=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(ok)images[key]=im;else failures.push(key);resolve();};const timer=setTimeout(()=>end(false),15000);im.onload=()=>end(true);im.onerror=()=>end(false);im.src=url;})));if(failures.length)throw new Error('Could not load: '+failures.join(', '));return images;}
Object.assign(A,{images,load,sprite,drawFood,foodData,toolData,icon,iconSVG,badge,drawRoom,drawRoomShell,drawStationLayer,customData,tableSpriteKey,drawDecorLayer,drawTableFurniture,drawSinkWorld,drawDirtyDish,drawWash,rect,ellipse,poly,line,heart,star,steam,grad,shine,plate});window.RRArt=A;
})();
