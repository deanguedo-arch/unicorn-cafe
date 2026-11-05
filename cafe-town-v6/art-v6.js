/* Rainbow Restaurant v1.3.0 Part 4 — separated room/station/furniture renderer plus the Part 3 cooking-art presentation.
 * Production character pixels live in assets/. No emoji or remote fonts.
 */
(function(){'use strict';
const A={},images={},cache={};
const P=window.RRPixelCafeArt;if(!P)throw new Error('Missing native pixel café art');
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
function sprite(c,key,x,y,w,h,flip=false){const im=images[key];if(!im){requireAsset(key);return;}c.save();c.imageSmoothingEnabled=false;c.translate(x,y);if(flip)c.scale(-1,1);const s=Math.min(w/im.width,h/im.height);c.drawImage(im,-im.width*s/2,-im.height*s,im.width*s,im.height*s);c.restore();}
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
function nativeImage(c,key,x,y,w,h){
 if(window.UWCafeNativeCues?.has(key))return window.UWCafeNativeCues.drawFit(c,key,x,y,w,h);
 const fixture={painted_kitchen:'kitchen',painted_sink:'sink',prep_board:'prep_board',station_cashier:'cashier_counter',station_dj:'dj_console'}[key];if(fixture){const q=P.fixture(fixture),scale=Math.min(w/q.width,h/q.height);P.draw(c,q,x+(w-q.width*scale)/2,y+(h-q.height*scale)/2,scale);return true;}
 if(key==='room_window'){c.save();c.fillStyle='#76543d';c.fillRect(x,y,w,h);c.fillStyle='#c6dde1';c.fillRect(x+6,y+6,w-12,h-12);c.fillStyle='#e9c18d';c.fillRect(x+w/2-2,y+6,4,h-12);c.fillRect(x+6,y+h/2-2,w-12,4);c.restore();return true;}
 const food={pizza_dough:['pizza','tomato',0],pancake_batter:['pancakes','berries',0],soup_chunk:['soup','carrot',2],cupcake:['cupcake','strawberry',null],coffee:['coffee','milk',null]}[key];if(food){const q=P.food(food[0],food[1],food[2]===null?null:{step:food[2],p:0}),scale=Math.min(w/64,h/56);P.draw(c,q,x+(w-64*scale)/2,y+(h-56*scale)/2,scale);return true;}
 const ingredient={fruit_strawberry:'strawberry',fruit_banana:'banana',fruit_berries:'berries',veg_peas:'peas',veg_corn:'corn'}[key]||key;try{const q=P.ingredient(ingredient),scale=Math.min(w,h)/24;P.draw(c,q,x+(w-24*scale)/2,y+(h-24*scale)/2,scale);return true;}catch(e){}return false;
}
const nativeDataCache=new Map();
function nativeData(key){if(nativeDataCache.has(key))return nativeDataCache.get(key);const v=document.createElement('canvas');v.width=128;v.height=128;const result=nativeImage(v.getContext('2d'),key,0,0,128,128)?v.toDataURL():null;if(nativeDataCache.size>=128)nativeDataCache.delete(nativeDataCache.keys().next().value);nativeDataCache.set(key,result);return result;}
function materialData(d,wall=false){const v=document.createElement('canvas');v.width=900;v.height=wall?160:380;const z=v.getContext('2d'),room=document.createElement('canvas');room.width=1800;room.height=1100;drawRoomShell(room.getContext('2d'),d);z.imageSmoothingEnabled=false;z.drawImage(room,36,wall?26:326,1728,wall?278:740,0,0,v.width,v.height);return v;}
const originalFoodKeys=['prep_board','painted_tools_controls','pizza_dough','pizza_sauce','pizza_cheese','pizza_tomato','pizza_mushroom','coffee_beans','coffee_empty','coffee_black','coffee_milk','coffee_cocoa','cupcake_flour','cupcake_batter','cupcake_plain','cupcake_strawberry','cupcake_cocoa','ice_cone','ice_vanilla','ice_strawberry','ice_sprinkles','burger_bottom','burger_patty','burger_cheese','burger_lettuce','burger_top','soup_empty','soup_broth','soup_carrot','soup_peas','chicken_raw','chicken_glaze','chicken_roast','chicken_wedge','pancake_batter','pancake_raw','pancake_brown','pancake_syrup','smoothie_blender','smoothie_milk','smoothie_strawberry','smoothie_mango','fruit_strawberry','fruit_berries','fruit_banana','fruit_mango','veg_peas','veg_corn'];
const originalFoodSet=new Set(originalFoodKeys),originalPixelCache=new Map();
function originalPixel(key){const im=images[key];if(!im?.complete||!im.naturalWidth)return null;if(originalPixelCache.has(key))return originalPixelCache.get(key);const scale=Math.min(64/im.naturalWidth,56/im.naturalHeight),v=document.createElement('canvas');v.width=Math.max(1,Math.round(im.naturalWidth*scale));v.height=Math.max(1,Math.round(im.naturalHeight*scale));const z=v.getContext('2d');z.imageSmoothingEnabled=false;z.drawImage(im,0,0,v.width,v.height);originalPixelCache.set(key,v);return v;}
function originalPart(c,key,x,y,w,h){const im=originalPixel(key);if(!im)return false;const k=Math.min(w/im.width,h/im.height),dw=im.width*k,dh=im.height*k;c.save();c.imageSmoothingEnabled=false;c.drawImage(im,Math.round(x+(w-dw)/2),Math.round(y+(h-dh)/2),Math.round(dw),Math.round(dh));c.restore();return true;}
function drawFood(c,dish,variant,prep=null,t=0){if(variant&&!RR.validVariant(dish,variant))throw Error('Unknown food variant');const steps=RR.RECIPES[dish].steps.length,step=prep?Math.min(steps,Math.max(0,prep.step||0)):steps,done=n=>step>n||step===n&&(prep?.p||0)>0,chosen=variant||RR.RECIPES[dish].variants[0].id;c.save();c.imageSmoothingEnabled=false;
 const full=key=>originalPart(c,key,20,10,280,250),small=(key,x,y,w=48,h=45)=>originalPart(c,key,x,y,w,h);
 const growth=()=>{const F=window.UWCafeFoodCatalogueV1;if(F?.variants.some(v=>v.family===dish&&v.variant===chosen)){const n=document.createElement('canvas');n.width=32;n.height=32;F.draw(n.getContext('2d'),F.choice(dish,chosen),0,0,1);c.drawImage(n,235,25,48,48);}};
 if(dish==='pizza'){full(done(2)?'pizza_cheese':done(1)?'pizza_sauce':'pizza_dough');if(done(4)){if(chosen==='tomato'||chosen==='mushroom'){for(const [x,y]of [[92,72],[160,68],[130,132]])small(chosen==='tomato'?'pizza_tomato':'pizza_mushroom',x,y,50,43);}else growth();}}
 else if(dish==='coffee'){full(!done(0)?'coffee_beans':!done(1)?'coffee_empty':!done(2)?'coffee_black':chosen==='cocoa'?'coffee_cocoa':'coffee_milk');if(done(2))growth();}
 else if(dish==='cupcake'){full(!done(0)?'cupcake_flour':!done(2)?'cupcake_batter':!done(4)?'cupcake_plain':chosen==='cocoa'?'cupcake_cocoa':'cupcake_strawberry');if(done(4))growth();}
 else if(dish==='icecream'){originalPart(c,'ice_cone',70,76,180,188);if(done(2))originalPart(c,chosen==='vanilla'?'ice_vanilla':'ice_strawberry',67,13,186,130);if(done(3))small('ice_sprinkles',178,32,55,45);if(done(2))growth();}
 else if(dish==='burger'){originalPart(c,'burger_bottom',48,140,224,105);if(done(1))originalPart(c,'burger_patty',53,105,214,92);if(done(2)&&chosen==='cheese')originalPart(c,'burger_cheese',64,91,190,72);if(done(3))originalPart(c,'burger_lettuce',60,72,200,70);if(done(4))originalPart(c,'burger_top',48,28,224,98);if(done(2))growth();}
 else if(dish==='soup'){full(!done(0)?'soup_empty':!done(2)?'soup_broth':chosen==='peas'?'soup_peas':chosen==='carrot'?'soup_carrot':'soup_broth');if(done(2))growth();}
 else if(dish==='chicken'){originalPart(c,done(4)?'chicken_roast':done(2)?'chicken_glaze':'chicken_raw',45,35,180,210);if(done(1))small('chicken_wedge',200,155,68,74);if(done(3)){if(chosen==='peas'||chosen==='corn')small(chosen==='peas'?'veg_peas':'veg_corn',210,65,55,55);else growth();}}
 else if(dish==='pancakes'){full(!done(0)?'pancake_batter':!done(2)?'pancake_raw':done(4)?'pancake_syrup':'pancake_brown');if(done(4)){if(chosen==='banana'||chosen==='berries')small(chosen==='banana'?'fruit_banana':'fruit_berries',195,65,65,60);else growth();}}
 else if(dish==='smoothie'){full(!done(3)?'smoothie_blender':chosen==='mango'?'smoothie_mango':'smoothie_strawberry');if(done(3))growth();}
 c.restore();}
function iconSVG(name){if(name==='back')return "<svg class=\"uw-icon uw-back-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\" shape-rendering=\"crispEdges\"><path fill=\"#352C46\" d=\"M2 7H4V5H6V3H8V6H14V10H8V13H6V11H4V9H2Z\"/><path fill=\"#FFF2D4\" d=\"M4 7H6V5H7V7H13V9H7V11H6V9H4Z\"/><path fill=\"#D9AF52\" d=\"M7 8H13V9H7Z\"/></svg>";
 const p={
 chicken:'<path d="m33 32 17 12q12-6 10 5 8 11-4 11L36 42Z" fill="#fff1d9"/><path d="M10 10C-3 24 9 52 26 47 58 44 48 12 29 15 24 1 12 4 10 10Z" fill="#e6a073"/><path d="m17 23 10 5m-11 8 10 4" stroke="#ba795f"/>',
 play:'<path d="M24 14 49 32 24 50Z" fill="#f2d084"/><path d="M27 22v18" stroke="#fff8e5" stroke-width="2"/>',
 back:'<path d="M29 13 8 32l21 19V39h26V25H29Z" fill="#e3bd70"/><path d="M15 30 25 21" stroke="#fff7d8" stroke-width="2"/>',
 arrow:'<path d="M35 13 56 32 35 51V39H9V25h26Z" fill="#e3bd70"/><path d="M14 28h20" stroke="#fff7d8" stroke-width="2"/>',
 pause:'<path d="M24 17v30M42 17v30" stroke-width="8"/>',
 settings:'<path d="M32 8 37 10 41 7 47 13 44 17 46 22 52 23 52 32 47 34 45 39 48 44 41 51 37 48 32 50 28 48 23 51 16 44 19 39 17 34 12 32 12 23 18 22 20 17 17 13 24 7 28 10Z" fill="#d8b6e8"/><circle cx="32" cy="29" r="9" fill="#fff1b0"/>',
 home:'<path d="m9 29 23-19 23 19M17 26v27h30V26M27 53V37h10v16"/>',
 mute:'<path d="M9 25h11l14-12v38L20 39H9Z" fill="#d8b6e8"/><path d="m44 24 13 16m0-16L44 40"/>',
 sound:'<path d="M9 25h11l14-12v38L20 39H9Z" fill="#d8b6e8"/><path d="M44 24q10 8 0 16m7-25q17 17 0 34"/>',
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
 tray:'<ellipse cx="32" cy="46" rx="27" ry="7" fill="#edcd83"/><path d="M11 40h42c0-29-42-29-42 0Z" fill="#d9c4ed"/><path d="M19 34q2-10 10-11" stroke="#fff8e5" stroke-width="3"/><circle cx="32" cy="17" r="4" fill="#efd28b"/>',
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
 spatula:'<g transform="rotate(22 32 32)"><rect x="27" y="28" width="10" height="30" rx="5" fill="#b18bdb"/><rect x="25" y="28" width="14" height="7" rx="3" fill="#ebc575"/><path d="M21 7h22q4 0 3 5l-3 16q-1 4-5 4H26q-4 0-5-4l-3-16q-1-5 3-5Z" fill="#bcdedc"/><path d="M26 13v10m6-10v10m6-10v10" stroke="#719aab" stroke-width="2.5"/><path d="M30 40v10M23 10h17" stroke="#fff8df" stroke-width="2"/></g>',
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
 let data=p[name]||p.chef,defs='';let n=0;
 data=data.replace(/fill="(#[0-9a-f]{6})"/gi,(_,colour)=>{const id='rr-'+name+'-'+n++;defs+=`<linearGradient id="${id}" x2="0" y2="1"><stop stop-color="${colour}"/><stop offset="1" stop-color="${colour}"/></linearGradient>`;const rgb=[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16));const light='#'+rgb.map(v=>Math.round(v+(255-v)*.3).toString(16).padStart(2,'0')).join('');defs=defs.replace(`stop-color="${colour}"`, `stop-color="${light}"`);return `fill="url(#${id})"`;});
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#61496f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs>'+defs+'</defs><g style="filter:drop-shadow(0px 1px 0px #b18d6355)">'+data+'</g></svg>';
}
const PAINTED_CONTROLS={spatula:0,spoon:1,roller:2,kettle:3,brush:4,oven:5,stove:6,settings:7,arrow:8,back:9,retry:10,chef:11};
function paintedControl(name){
 const cell=PAINTED_CONTROLS[name],sheet=images.painted_tools_controls;if(cell===undefined||!sheet)return null;
 const key='painted-control:'+name;if(cache[key])return cache[key];
 const w=sheet.width/4,h=sheet.height/3,canvas=document.createElement('canvas');canvas.width=Math.round(w);canvas.height=Math.round(h);const c=canvas.getContext('2d');c.drawImage(sheet,(cell%4)*w,Math.floor(cell/4)*h,w,h,0,0,w,h);
 const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;let x1=canvas.width,y1=canvas.height,x2=0,y2=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>48){x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);}
 if(x1>x2)return null;const icon=document.createElement('canvas');icon.width=32;icon.height=32;const z=icon.getContext('2d'),iw=x2-x1+1,ih=y2-y1+1,scale=Math.min(29/iw,29/ih);z.imageSmoothingEnabled=false;z.drawImage(canvas,x1,y1,iw,ih,(32-iw*scale)/2,(32-ih*scale)/2,iw*scale,ih*scale);return cache[key]=icon.toDataURL();
}
function icon(name){const shared={back:'back',close:'close',settings:'settings',sound:'sound',retry:'retry',help:'help',check:'confirm',star:'star',coin:'coin'}[name];if(shared)return '<img class=\"uw-icon\" src=\"./assets/refresh-'+shared+'.png\" alt=\"\" aria-hidden=\"true\" draggable=\"false\">';const refresh={play:'play',chef:'cook',oven:'cook',tray:'serve',table:'tables'}[name];if(refresh)return '<img class="uw-icon" src="./assets/refresh_icons_'+refresh+'.png" alt="" aria-hidden="true" draggable="false">';if(name==='back')return "<svg class=\"uw-icon uw-back-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\" shape-rendering=\"crispEdges\"><path fill=\"#352C46\" d=\"M2 7H4V5H6V3H8V6H14V10H8V13H6V11H4V9H2Z\"/><path fill=\"#FFF2D4\" d=\"M4 7H6V5H7V7H13V9H7V11H6V9H4Z\"/><path fill=\"#D9AF52\" d=\"M7 8H13V9H7Z\"/></svg>";const native=window.UWCafeNativeCues?.dataURL(name);if(native)return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><image href="${native}" width="64" height="64" style="image-rendering:pixelated"/></svg>`;const painted=paintedControl(name);return painted?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><image href="${painted}" width="64" height="64"/></svg>`:iconSVG(name);}
function toolData(name){
 if(name.startsWith('growth-choice:')){const [,dish,variant]=name.split(':'),F=window.UWCafeFoodCatalogueV1,sp=F.choice(dish,variant),v=document.createElement('canvas');v.width=32;v.height=32;F.draw(v.getContext('2d'),sp,0,0,1);return v.toDataURL();}
 const painted=paintedControl(name);if(painted&&['spatula','spoon','roller','kettle','brush'].includes(name))return painted;
 const original={tomato:'pizza_tomato',mushroom:'pizza_mushroom',cone:'ice_cone',vanilla:'ice_vanilla',scoop:'ice_strawberry',sprinkles:'ice_sprinkles',beans:'coffee_beans',flour:'cupcake_flour',egg:'cupcake_batter',bun:'burger_top',pan:'burger_patty',cheese:'burger_cheese',sauce:'pizza_sauce',cocoa:'cupcake_cocoa',lettuce:'burger_lettuce',carrots:'soup_chunk',chicken:'chicken_raw',sweetpotato:'chicken_wedge',peas:'veg_peas',corn:'veg_corn',blueberries:'fruit_berries',banana:'fruit_banana',blender:'smoothie_blender',milk:'smoothie_milk',strawberry:'fruit_strawberry',mango:'fruit_mango',fruit:'fruit_strawberry',cup:'smoothie_strawberry'}[name];
 if(original||originalFoodSet.has(name)){const im=originalPixel(original||name);if(im)return im.toDataURL('image/png');}
 const key='legacy-tool:'+name;if(!cache[key])cache[key]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(iconSVG(name));return cache[key];
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
// Whole-world café art pass: fitted, non-interactive dressing only. The
// existing station/table footprints, gallery, actors and room choices stay intact.
function cafePrepDetails(c){
 c.save();
 // Everything rests on the unused right-hand countertop. Burner, oven and
// cleanup indicators remain clear; these are display details, not new stations.
 rect(c,1002,213,102,31,5,'#d9b58c','#9b6f66',2);
 line(c,[[1010,219],[1094,219]],'#ecd0aa',2);
 sprite(c,'bread',1030,237,47,28);
 sprite(c,'pizza_tomato',1077,237,25,24);
 sprite(c,'carrots',1125,239,43,40);
 rect(c,1162,210,21,28,4,'#9ec6be','#6b647a',2);
 for(const q of [[1166,196],[1173,192],[1179,198]]){line(c,[[q[0],q[1]],[q[0],219]],'#b58c68',3);ellipse(c,q[0],q[1],4,6,'#d8e0d6','#7b7385',1);}
 c.restore();
}
const shellCache={};
const CAFE_FLOORS={lavender:['#d7c8d8','#c4afca'],mint:['#ced9cd','#b8c9b8'],peach:['#ead1bb','#d8b99e'],moonstone:['#d1d8dc','#b8c4cc'],confetti:['#e4d5bf','#d2bfa9']};
const CAFE_WALLS={twilight:['#d8c9e5','#b39bcc'],rainbow:['#f7ebd5','#d2bedb'],garden:['#edf0dc','#b8c7a1'],sunrise:['#f9e9cd','#e2ba91'],starlight:['#d6d6e8','#a1a9c9']};
function cafeMaterial(c,d,x,y,w,h,wall=false){
 const pal=(wall?CAFE_WALLS[d.wallpaper]:CAFE_FLOORS[d.flooring])||(wall?CAFE_WALLS.twilight:CAFE_FLOORS.lavender);
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle=pal[0];c.fillRect(x,y,w,h);
 if(wall){
  c.fillStyle=pal[1];c.fillRect(x,y+h*.66,w,h*.34);
  // Theme identity remains visible in the material swatch and the full room.
  for(let xx=x+40;xx<x+w;xx+=112)for(let yy=y+35;yy<y+h*.6;yy+=76){
   c.save();c.globalAlpha=.20;
   if(d.wallpaper==='rainbow'){for(let i=0;i<3;i++){c.beginPath();c.arc(xx,yy,15-i*4,Math.PI,0);c.strokeStyle=['#bf7294','#d5a94c','#78956b'][i];c.lineWidth=3;c.stroke();}}
   else if(d.wallpaper==='garden'){line(c,[[xx-7,yy+9],[xx+6,yy-8]],'#78956b',2);ellipse(c,xx-4,yy,6,3,'#78956b');ellipse(c,xx+5,yy-6,5,3,'#78956b');}
   else if(d.wallpaper==='sunrise'){ellipse(c,xx,yy,7,7,'#d5a94c');for(let k=0;k<8;k++){const a=k*Math.PI/4;line(c,[[xx+Math.cos(a)*11,yy+Math.sin(a)*11],[xx+Math.cos(a)*15,yy+Math.sin(a)*15]],'#d5a94c',2);}}
   else if(d.wallpaper==='starlight')star(c,xx,yy,8,'#5b435d');
   else{ellipse(c,xx,yy,8,9,'#5b435d');ellipse(c,xx+4,yy-3,7,8,pal[0]);}
   c.restore();
  }

  for(let xx=x;xx<x+w;xx+=92){line(c,[[xx,y+h*.69],[xx,y+h]],'#49344f20',2);line(c,[[xx+4,y+h*.69],[xx+4,y+h]],'#ffffff50',2);}
  rect(c,x,y+h*.65,w,8,0,'#d7b184',null);line(c,[[x,y+h*.65],[x+w,y+h*.65]],'#fff3db',2);
 }else{
  // Continuous staggered plank material, not repeated bitmap patches.
  const row=65;for(let yy=y;yy<y+h;yy+=row){let i=Math.floor((yy-y)/row);c.fillStyle=i%2?pal[1]+'35':'#fff7e619';c.fillRect(x,yy,w,row);
   line(c,[[x,yy],[x+w,yy]],'#49344f26',2);line(c,[[x,yy+3],[x+w,yy+3]],'#fff8e735',1);
   for(let xx=x-280+(i%2)*140;xx<x+w;xx+=280){line(c,[[xx,yy],[xx,yy+row]],'#49344f23',2);line(c,[[xx+24,yy+17],[xx+123,yy+17]],'#49344f09',2);}
  }
  if(d.flooring==='confetti')for(let xx=x+31;xx<x+w;xx+=91)for(let yy=y+21;yy<y+h;yy+=83){c.fillStyle=['#b39bcc50','#78956b50','#d5a94c50'][Math.floor(xx+yy)%3];c.fillRect(xx,yy,5,3);}
 }
 c.restore();
}
const CAFE_STRUCTURE={plain:[35,58,247,243],window:[350,58,244,243],kitchen:[36,369,248,246]};
function cafeWallAssembly(c,d,x,y,w,h){
 const atlas=images.cafe_structure;if(!atlas)return;
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.imageSmoothingEnabled=true;
 const types=['window','plain','kitchen','kitchen','plain','window'],pw=w/6;
 for(let i=0;i<6;i++){const r=CAFE_STRUCTURE[types[i]];c.drawImage(atlas,...r,x+i*pw,y,pw+.5,h);}
 for(let i=1;i<6;i++){line(c,[[x+i*pw,y+5],[x+i*pw,y+h-3]],'#77566e',5);line(c,[[x+i*pw-2,y+7],[x+i*pw-2,y+h-5]],'#d9b78f',1);}
 // A translucent material glaze preserves the selected theme without covering
// the shaded atlas with an unrelated opaque panel or changing physical anchors.
 const pal=CAFE_WALLS[d.wallpaper]||CAFE_WALLS.twilight;
 c.globalAlpha=.19;c.fillStyle=pal[1];c.fillRect(x,y,w,h);c.globalAlpha=1;
 // Wallpaper motifs live only on clear wall bays, away from windows and shelves.
 for(const bay of [1,4]){c.save();c.translate(x+bay*pw,y);c.beginPath();c.rect(pw*.06,h*.15,pw*.88,h*.49);c.clip();
  const pattern=document.createElement('canvas');pattern.width=Math.ceil(pw);pattern.height=Math.ceil(h);const z=pattern.getContext('2d');cafeMaterial(z,d,0,0,pw,h,true);
  c.globalAlpha=.16;c.drawImage(pattern,0,0);c.restore();}
 c.restore();
}
function drawReturnPortal(c,p){P.draw(c,'portal',p.x-110,p.y-44,2);}
function drawRoomShell(c,d){
 const key='pixel:'+d.flooring+':'+d.wallpaper+':'+(images.refresh_details_window?'window2':'window1');if(!shellCache[key]){const layer=document.createElement('canvas');layer.width=900;layer.height=550;const z=layer.getContext('2d');
 const floors={lavender:['#d7bed6','#ae8faf'],mint:['#b9ce8d','#83a56b'],peach:['#e9c18d','#d3a26b'],moonstone:['#c6dde1','#83b3cb'],confetti:['#fff2d4','#d8c8aa']},walls={twilight:'#d7bed6',rainbow:'#fff2d4',garden:'#b9ce8d',sunrise:'#e9c18d',starlight:'#c6dde1'},f=floors[d.flooring]||floors.peach;
 z.fillStyle='#352c46';z.fillRect(0,0,900,550);z.save();z.beginPath();z.rect(18,160,864,376);z.clip();z.fillStyle=f[0];z.fillRect(18,160,864,376);for(let y=160;y<536;y+=32){z.fillStyle=f[1];z.fillRect(18,y,864,2);for(let x=18+(y%64?45:0);x<882;x+=90){z.fillRect(x,y,2,32);z.fillRect(x+18,y+14,14,1);}}
 z.restore();window.UWCafeDesignRewards?.drawSurfaceMaterial(z,d,18,160,864,376,false);z.fillStyle=walls[d.wallpaper]||walls.twilight;z.fillRect(18,13,864,147);z.fillStyle='#76543d';z.fillRect(14,155,872,8);z.fillRect(14,13,4,523);z.fillRect(882,13,4,523);z.fillRect(14,533,872,8);z.fillStyle='#e9c18d';z.fillRect(18,153,864,3);
 window.UWCafeDesignRewards?.drawSurfaceMaterial(z,d,18,13,864,147,true);
 z.save();z.globalAlpha=.28;z.fillStyle='#fff9eb';for(let x=30;x<880;x+=48){z.fillRect(x,20,2,125);for(let y=32;y<145;y+=40){z.fillRect(x-3,y,8,2);z.fillRect(x,y-3,2,8);}}z.restore();
 for(const x of [82,365,680]){if(images.refresh_details_window){const im=images.refresh_details_window,k=Math.min(116/im.width,91/im.height),w=im.width*k,h=im.height*k;z.imageSmoothingEnabled=false;z.drawImage(im,x+(116-w)/2,125-h,w,h);continue;}z.fillStyle='#352c46';z.fillRect(x,34,116,91);z.fillStyle='#a5754d';z.fillRect(x+2,36,112,87);z.fillStyle='#c6dde1';z.fillRect(x+6,40,104,77);z.fillStyle='#83b3cb';z.fillRect(x+8,80,100,35);z.fillStyle='#e9c18d';z.fillRect(x+56,40,4,77);z.fillRect(x+6,75,104,4);z.fillStyle='#76543d';z.fillRect(x-4,120,124,5);window.UWCafeDesignRewards?.drawWindowSurround?.(z,d,x,34,116,91);}
 // The portal is deliberately inset into the floor, not an upright floating doorway.
 const portal=window.RR.LAYOUT.portal;P.draw(z,'portal',portal.x/2-55,portal.y/2-22,1);shellCache[key]=layer;}
 c.save();c.imageSmoothingEnabled=false;c.drawImage(shellCache[key],0,0,1800,1100);c.restore();
}
// Local origin is the centre of the preparation stage, shared by every recipe.
function drawPrepBoard(c){originalPart(c,'prep_board',-170,-143,340,286);}
function drawStationLayer(c,t=0){
 const station=window.RR.STATIONS;c.save();c.imageSmoothingEnabled=false;
 function fixture(id,s){const q=P.fixture(id),key={kitchen:'refresh_kitchen_range',sink:'refresh_kitchen_sink',cashier_counter:'refresh_kitchen_cashier_counter',dj_console:'refresh_props_dj_console'}[id];if(key&&images[key]){const w=id==='kitchen'?400:id==='sink'?200:q.width*2,h=id==='kitchen'?220:q.height*3;sprite(c,key,s.x,s.y,w,h);}else P.draw(c,q,s.x-q.width,s.y-q.height*2,2);}
 function actor(key,rect,s,offsetX=0,raise=0){const im=images[key];if(!im)return;const h=55,w=Math.round(h*rect[2]/rect[3]),bottom=s.y-100-raise,ck='actor-native:'+key;if(!cache[ck]){const v=document.createElement('canvas');v.width=w;v.height=h;const vctx=v.getContext('2d');vctx.imageSmoothingEnabled=false;vctx.drawImage(im,...rect,0,0,w,h);cache[ck]=v;}c.drawImage(cache[ck],Math.round(s.x+offsetX-w),Math.round(bottom-h*2),w*2,h*2);}
 fixture('kitchen',station.kitchen);fixture('sink',station.sink);if(images.refresh_kitchen_pastry_counter)sprite(c,'refresh_kitchen_pastry_counter',1480,310,180,180);
 actor('cafe_dj_actor',[302,30,926,944],station.dj);fixture('dj_console',station.dj);
 actor('cafe_cashier_actor',[285,61,801,1056],station.cashier,65,25);fixture('cashier_counter',station.cashier);c.restore();
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
function pixelTable(d){const key='native-table:'+d.tableType+':'+clothOf(d);if(cache[key])return cache[key];const p=new window.UWPixelArtCore.Pixels(153,62),base=P.fixture('table');for(let y=46;y<62;y++)for(let x=0;x<153;x++){const ch=base.rows[y][x];if(ch!=='.')p.dot(x,y,P.glyphs.indexOf(ch));}
 const col=({honey:10,cream:5,berry:13,sky:22,gingham:3,rainbow:19})[clothOf(d)]??10;
 function surface(y,colour){if(d.tableType==='heart')p.poly([[76,y+2],[61,y-9],[40,y-8],[25,y+2],[28,y+17],[76,y+37],[124,y+17],[127,y+2],[111,y-8],[91,y-9]],colour);else if(d.tableType==='clover'){for(const [x,yy]of [[54,y],[99,y],[54,y+23],[99,y+23]])p.ellipse(x,yy,29,15,colour);p.rect(52,y,48,24,colour);}else if(d.tableType==='cloud'){p.ellipse(76,y+13,66,20,colour);p.ellipse(44,y+3,27,15,colour);p.ellipse(76,y-1,29,17,colour);p.ellipse(106,y+5,27,15,colour);}else p.ellipse(76,y+12,d.tableType==='oval'?74:59,23,colour);}
 surface(18,0);surface(15,8);surface(13,16);surface(10,col);p.line(51,16,99,16,col===5?7:11);for(const x of [28,40,112,124]){p.dot(x,34,17);p.dot(x,36,10);}return cache[key]=p.finish(key);}
function refreshedChair(choice){const baseKey={rose:'refresh_chair_rose',mint:'refresh_chair_teal',plum:'refresh_chair_lavender',gold:'refresh_chair_lavender',sky:'refresh_chair_lavender',rainbow:'refresh_chair_lavender'}[choice],im=images[baseKey];if(!im)return null;if(['rose','mint','plum'].includes(choice))return im;const key='chair-colour:'+choice;if(cache[key])return cache[key];const cv=document.createElement('canvas');cv.width=im.naturalWidth||im.width;cv.height=im.naturalHeight||im.height;const z=cv.getContext('2d');z.imageSmoothingEnabled=false;z.drawImage(im,0,0);const data=z.getImageData(0,0,cv.width,cv.height),a=data.data,targets={gold:[222,164,69],sky:[103,173,210]},rainbow=[[230,125,158],[226,180,91],[125,192,163],[116,168,215],[174,134,198]];for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const i=(y*cv.width+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]<32||r<70||b<r*1.06||b<g*1.15)continue;const target=targets[choice]||rainbow[Math.min(4,Math.floor(y/cv.height*5))],light=(r+g+b)/390;for(let k=0;k<3;k++)a[i+k]=Math.min(255,Math.round(target[k]*light));}z.putImageData(data,0,0);return cache[key]=cv;}
function drawChairImage(c,choice,x,y,w,h){const im=refreshedChair(choice);if(!im)return false;const k=Math.min(w/im.width,h/im.height),dw=im.width*k,dh=im.height*k;c.save();c.imageSmoothingEnabled=false;c.drawImage(im,Math.round(x-dw/2),Math.round(y-dh),Math.round(dw),Math.round(dh));c.restore();return true;}
function drawTableFurniture(c,x,y,d,symbol,col,t=0,marker=true,seatGuest=null){
 const layout=window.RR.LAYOUT.dining,D=window.UWCafeDesignRewards;c.save();const newTable=D?.drawTable(c,x,y,d),tableKey={honey:'refresh_table_honey',berry:'refresh_table_rose',sky:'refresh_table_teal'}[clothOf(d)];if(!newTable&&d.tableType==='round'&&tableKey&&images[tableKey])sprite(c,tableKey,x,y+90,210,220);else if(!newTable)P.draw(c,pixelTable(d),x-153,y-34,2);
 // Keep all saved options visible as palette/trim choices; geometry and seat IDs unchanged.
 const colours={honey:'#d9af52',cream:'#fff2d4',berry:'#dd83a7',sky:'#83b3cb',gingham:'#d7bed6',rainbow:'#b9ce8d'};c.fillStyle=colours[clothOf(d)]||colours.honey;
 for(const dx of [-layout.chairDX,layout.chairDX]){if(D?.drawChair(c,x+dx-48,y+layout.chairY-112,d,dx<0?'east':'west'))continue;const refreshed=drawChairImage(c,d.chairs,x+dx,y+layout.chairY,90,130);if(!refreshed)P.draw(c,'chair',x+dx-48,y+layout.chairY-100,2);c.fillStyle=({plum:'#80617e',mint:'#83a56b',rainbow:'#d9af52',rose:'#dd83a7',gold:'#d9af52',sky:'#83b3cb'})[d.chairs]||'#80617e';if(!refreshed)c.fillRect(x+dx-34,y+layout.chairY-48,68,10);}
 if(D?.drawCenterpiece(c,x,y,d)){}else if(d.decoration==='flowers'&&images.refresh_props_flower_centrepiece)sprite(c,'refresh_props_flower_centrepiece',x,y-20,48,48);else if(d.decoration==='cupcake')P.draw(c,P.food('cupcake','strawberry'),x-24,y-40,.75);else{const colors={flowers:'#dd83a7',teapot:'#83b3cb',plant:'#83a56b',cookies:'#d3a26b',stars:'#d9af52'};c.fillStyle='#76543d';c.fillRect(x-6,y-19,12,12);c.fillStyle=colors[d.decoration]||'#d9af52';c.fillRect(x-10,y-28,20,10);}
 if(seatGuest)seatGuest();if(marker)badge(c,symbol,x,y+layout.markerY,27,col);c.restore();
}
function drawSinkWorld(c,t=0){const s=window.RR.STATIONS.sink;if(images.refresh_kitchen_sink)sprite(c,'refresh_kitchen_sink',s.x,s.y,160,222);else P.draw(c,'sink',s.x-80,s.y-148,2);}
function customData(stage,id,decor){if(id.startsWith('cafe-design-v1:'))return window.UWCafeDesignRewards.previewData(id,decor);const d={...decor,[stage]:id},v=document.createElement('canvas');v.width=240;v.height=190;const c=v.getContext('2d');c.imageSmoothingEnabled=false;if(stage==='flooring'||stage==='wallpaper')c.drawImage(materialData(d,stage==='wallpaper'),0,0,240,190);else if(stage==='chairs'){if(!drawChairImage(c,id,120,168,110,140)){P.draw(c,'chair',72,30,2);c.fillStyle=({plum:'#80617e',mint:'#83a56b',rainbow:'#d9af52',rose:'#dd83a7',gold:'#d9af52',sky:'#83b3cb'})[id];c.fillRect(86,82,68,10);}}else{c.save();c.translate(120,62);c.scale(.7,.7);drawTableFurniture(c,0,0,d,'heart','#dd83a7',0,false);c.restore();}return v.toDataURL();}

function drawDirtyDish(c,x,y,scale=1,count=1){for(let i=Math.min(3,count)-1;i>=0;i--)P.draw(c,'dirty_plate',x-60*scale,y-18*scale+i*5,3*scale);}
function drawWash(c,progress,t=0){const step=Math.max(0,Math.min(5,Math.round(progress*5)));P.draw(c,'sink',0,0,4);P.draw(c,'wash_plate_'+step,120,75,2);for(let i=0;i<5-step;i++)P.draw(c,'wash_bubble',100+i*24,112+(i%2)*8,2);for(let i=0;i<5;i++){c.fillStyle=i<step?'#80a973':'#c6dde1';c.fillRect(113+i*20,158,14,10);c.fillStyle='#fff9eb';c.fillRect(115+i*20,160,4,2);}}

// Native presentation demand loader. Manifest/content IDs remain unchanged.
const obsoleteKey=key=>!originalFoodSet.has(key)&&(/^(table_|dining_|chair_|room_floor_|room_wall_)/.test(key)||['room_door','room_lamp','room_sofa','room_window','painted_board','painted_kitchen','painted_sink','prep_board','station_cashier','station_dj','cafe_structure','coffee_black','coffee_cocoa','coffee_empty','coffee_milk','cupcake_plain','cupcake_strawberry','chicken_roast','chicken_glaze','pancake_brown','pancake_raw','pancake_syrup','soup_broth','soup_carrot','soup_empty','soup_peas'].includes(key));
const bootKeys=['u_idle0','u_idle1',...Array.from({length:6},(_,i)=>'u_run'+i),...Array.from({length:3},(_,i)=>'u_happy'+i),'cafe_cashier_actor','cafe_dj_actor'];
const worldKeys=[...originalFoodKeys,...Object.keys(window.RR_ASSETS).filter(k=>/^(refresh_kitchen_|refresh_props_)/.test(k)),...['refresh_table_honey','refresh_details_window','refresh_table_rose','refresh_table_teal','refresh_table_lavender','refresh_chair_rose','refresh_chair_teal','refresh_chair_lavender'],...Object.keys(window.RR_ASSETS).filter(k=>/^(baby_(blue|pink)_|guest_seated_|h_(happy|idle0|run)|w_|m_)/.test(k)),'mop','sponge','room_plant','lunch'];
const recipeKeys={pizza:['pizza_sauce'],coffee:[],cupcake:['cupcake_batter'],icecream:['ice_cone','ice_vanilla','ice_strawberry'],burger:['burger_patty'],soup:['soup_chunk'],chicken:[],pancakes:['pancake_batter'],smoothie:['smoothie_blender','smoothie_strawberry','smoothie_mango']};
const pendingAssets=new Map(),assetFailures=new Map(),requests=[];
const v6AssetDeadline=window.UWCafeAssetDeadlineV6.create();
function assetEvent(type,key,error){window.dispatchEvent(new CustomEvent('rr-assets',{detail:{type,key,error:error?.message||null}}));}
function ensureKey(key){if(images[key])return Promise.resolve(images[key]);if(pendingAssets.has(key))return pendingAssets.get(key);if(!window.RR_ASSETS[key]||obsoleteKey(key)){const error=new Error('Unexpected native raster dependency: '+key);assetFailures.set(key,error.message);assetEvent('failed',key,error);return Promise.reject(error);}
 const promise=new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';let settled=false;const finish=error=>{if(settled)return;settled=true;timer.cancel();pendingAssets.delete(key);if(error){assetFailures.set(key,error.message);assetEvent('failed',key,error);reject(error);}else{v6AssetDeadline.progress();images[key]=im;assetFailures.delete(key);assetEvent('ready',key);resolve(im);}};const timer=v6AssetDeadline.watch(()=>finish(new Error('Artwork timed out: '+key))); im.onload=()=>finish();im.onerror=()=>finish(new Error('Artwork unavailable: '+key));requests.push(key);im.src=window.RR_ASSETS[key];});pendingAssets.set(key,promise);return promise;}
async function ensure(keys){const unique=[...new Set(keys)],errors=[];let at=0;await Promise.all(Array.from({length:Math.min(4,unique.length)},async()=>{while(at<unique.length){const key=unique[at++];try{await ensureKey(key);}catch(e){errors.push(e);}}}));if(errors.length)throw errors[0];return images;}
function requireAsset(key){if(images[key])return true;if(!pendingAssets.has(key)&&!assetFailures.has(key)){assetEvent('needed',key);ensure([key]).catch(()=>{});}return false;}
function assetURL(key){if(!window.RR_ASSETS[key])return null;requireAsset(key);return obsoleteKey(key)?null:window.RR_ASSETS[key];}
function keysForState(kind,dish){return kind==='recipe'?(recipeKeys[dish]||[]):kind==='world'||kind==='lunch'||kind==='scrub'?worldKeys:bootKeys;}
function isReady(keys){return keys.every(key=>!!images[key]);}
async function load(){return ensure(bootKeys);}
function memoryInventory(){return{bootKeys:[...bootKeys],worldKeys:[...worldKeys],recipeKeys,skipped:Object.keys(window.RR_ASSETS).filter(obsoleteKey),loaded:Object.keys(images),pending:[...pendingAssets.keys()],failed:[...assetFailures.keys()],requests:[...requests],decodedRGBA:Object.values(images).reduce((n,im)=>n+im.width*im.height*4,0)};}

Object.assign(A,{isReady,ensure,requireAsset,assetURL,keysForState,memoryInventory,nativeImage,nativeData,materialData,images,load,sprite,drawFood,foodData,toolData,icon,iconSVG,badge,drawRoom,drawRoomShell,drawStationLayer,customData,tableSpriteKey,drawDecorLayer,drawTableFurniture,drawSinkWorld,drawDirtyDish,drawWash,drawPrepBoard,rect,ellipse,poly,line,heart,star,steam,grad,shine,plate});window.RRArt=A;
})();
