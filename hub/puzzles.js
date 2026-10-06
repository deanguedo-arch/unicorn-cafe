/* 48 distinct story pictures composed from preserved illustration pixels. */
(()=>{'use strict';const A=UWArt,C=UWCatalog,cache=new Map(),extra={};let promise=null,backgrounds=null;
const sources=['dog_idle','dog_happy','teddy','toyunicorn','ball','robot','apple','banana','cookie','donut','cupcake','icecream','bread','strawberry','cherries','grapes','peach','flowers','cake','milkshake','easy_house','easy_market','easy_restaurant','easy_toys','house','store','plant','picture','book'];
async function load(bgs){backgrounds=bgs;if(!promise)promise=Promise.all(sources.map(k=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{extra[k]=im;resolve();};im.onerror=()=>reject(Error('Puzzle illustration '+k));im.src='./assets/puzzles/'+k+'.webp';})));await promise;}
function art(c,key,x,y,w,h,flip=false){A.sprite(c,extra[key]||A.images[{pancake:'pancake_syrup',coffee:'coffee_black',soup:'soup_carrot',chicken:'chicken_roast'}[key]||key],x,y,w,h,flip);}
function picture(id){if(cache.has(id))return cache.get(id);const q=C.puzzles.find(p=>p.id===id);if(!q)throw Error('Unknown picture');const cv=document.createElement('canvas');cv.width=640;cv.height=440;const c=cv.getContext('2d'),i=q.index;
 const bg={unicorns:'street',animals:'street',food:'boutique',outfits:'boutique',vehicles:'wheels',places:['village','street','mall','boutique','wheels','arcade','photo','boutique'][i]}[q.theme];c.drawImage(backgrounds[bg],0,0,640,440);
 if(q.theme==='places'){
  const detail=['house','flowers','plant','picture','ball','robot','book','toyunicorn'][i];art(c,detail,115,405,140,160);A.unicorn(c,415,416,125,{head:['bow','flower-crown','sunhat','helmet'][i%4]},i%2?'u_happy1':'u_idle0');
 }else if(q.theme==='unicorns'){
  const poses=['u_idle0','u_happy1','u_run2','u_happy2','u_idle1','u_run4','u_happy0','u_run0'];
  A.unicorn(c,280+i%3*42,390,225,{head:['bow','sunhat','flower-crown','legacy-princess','helmet','bow','sunhat','flower-crown'][i]},poses[i],i%2===1);
  if(i!==2)art(c,i%2?'baby_pink_0':'baby_blue_0',105,388,115,120);if(i>3)art(c,'baby_blue_0',525,390,115,120);
  art(c,['flowers','ball','cake','toyunicorn','strawberry','book','robot','donut'][i],470,395,145,150);
 }else if(q.theme==='animals'){
  const plans=[['dog_idle','ball'],['dog_happy','flowers'],['teddy','bread'],['dog_idle','teddy'],['teddy','strawberry'],['dog_happy','book'],['teddy','ball'],['dog_happy','teddy']];
  art(c,plans[i][0],280,390,260,245,i%2===1);art(c,plans[i][1],480,394,170,185);art(c,['plant','apple','cookie','flowers','cake','robot','banana','book'][i],100,397,135,145);
 }else if(q.theme==='food'){
  const foods=[['pizza','cupcake','milkshake'],['pancake','strawberry','banana'],['icecream','cherries','donut'],['burger','apple','cookie'],['cake','milkshake','grapes'],['bread','soup','peach'],['cupcake','donut','strawberry'],['chicken','banana','cookie']][i];
  A.ellipse(c,320,363,265,56,'#fff3dc','#b796be',5);foods.forEach((k,j)=>art(c,k,135+j*185,366,190,j===1?225:190));
 }else if(q.theme==='outfits'){
  const looks=[{head:'bow',body:'tee',accessory:'beads'},{head:'sunhat',body:'rainbow-dress',accessory:'satchel'},{head:'helmet',body:'star-jacket',accessory:'scarf'},{head:'flower-crown',body:'rainbow-dress',accessory:'beads'},{head:'legacy-chef',body:'tee',accessory:'scarf'},{head:'legacy-space',body:'star-jacket',accessory:'glasses'},{head:'prize-star-bow',body:'prize-rainbow-cape',accessory:'prize-moon-bag'},{head:'sunhat',body:'raincoat',accessory:'glasses'}];
  A.unicorn(c,300,406,275,looks[i],i%2?'u_happy1':'u_idle0',i%3===0);art(c,['flowers','bag','ball','picture','cupcake','robot','toyunicorn','plant'][i],500,400,130,135);
 }else if(q.theme==='vehicles'){
  const id=i%2?'bike':'skateboard';A.unicorn(c,305,345,175,{head:i%2?'helmet':'bow',body:i<4?'star-jacket':'raincoat'},i%2?'u_idle0':'u_run2',i%4>1,id);
  art(c,['ball','dog_happy','flowers','robot','toyunicorn','dog_idle','teddy','plant'][i],515,395,130,150);for(let j=0;j<=i%4;j++)A.star(c,100+j*70,265-(j%2)*40,18,'#ffdd81');
 }
 cache.set(id,cv);return cv;}
window.UWPuzzles={load,picture,cache};
})();
