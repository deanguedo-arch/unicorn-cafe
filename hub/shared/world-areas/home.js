/* Original modular Unicorn home. Never writes profile, decorations, or activity state. */
(()=>{'use strict';
const R=window.UWWorldRenderer;if(!R)return;
const P={ink:'#57445f',edge:'#846982',wall:'#f5dfba',light:'#fff0ce',wood:'#cda47c',plank:'#dcb58b',pink:'#df9dbd',purple:'#9b86b5',mint:'#91bda6',blue:'#9bc4ce'};
const structureImage='assets/world-kit/structure-atlas-v1.webp',structureRects={"wall_plain":[32,55,253,249],"wall_window":[347,55,250,249],"wall_doorway":[660,55,248,249],"wall_reading":[970,55,250,249],"wall_kitchen":[33,366,254,252],"wall_bathroom":[348,366,248,252],"wall_shop":[660,366,247,251],"stone_wall":[947,421,291,188],"pillar":[418,660,101,266],"curtains":[673,680,220,242],"terrace_railing":[951,753,282,148],"rug_square":[33,966,255,232],"rug_stripe":[329,1008,286,158],"vegetable_bed":[639,1021,306,144],"star_sign":[945,1022,238,142]};
const stairImage='assets/world-kit/stairs-atlas-v1.webp',stairSourceRect=[140,130,760,1260];
const stairPlacements={mainUp:{x:304,y:414,w:112,direction:'up',connection:'upper-wall'},mainDown:{x:304,y:740,w:96,direction:'down',connection:'floor-well'},bedroomExit:{x:336,y:720,w:96,direction:'down',connection:'floor-well'},clubhouseExit:{x:224,y:450,w:96,direction:'up',connection:'upper-wall'}};
for(const p of Object.values(stairPlacements)){p.h=p.w*1260/760;p.bottom=p.y+8;p.bounds={x:p.x,y:p.bottom-p.h,w:p.w,h:p.h};const z=p.w/760;p.visibleBounds={x:p.x+5*z,y:p.bottom-p.h+5*z,w:750*z,h:1249*z};}
const rect=(c,x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);};
function rug(c,x,y,w,h,color){const r=structureRects[w<=128||w/h>1.55?'rug_stripe':'rug_square'];if(R.images[structureImage]&&r){const z=Math.min(w/r[2],h/r[3]);R.helpers.image(c,structureImage,r,x+w/2,y+h,r[2]*z,r[3]*z);return;}rect(c,x,y,w,h,P.ink);rect(c,x+4,y+4,w-8,h-8,color);rect(c,x+12,y+12,w-24,4,P.light);rect(c,x+12,y+h-16,w-24,4,P.light);for(let a=x+12;a<x+w-10;a+=16){rect(c,a,y-4,4,4,color);rect(c,a,y+h,4,4,color);}}
function windowPanel(c,x,y,w=112){rect(c,x-8,y-8,w+16,112,P.ink);rect(c,x-4,y-4,w+8,104,P.wood);rect(c,x,y,w,92,P.blue);rect(c,x+8,y+58,w-16,34,P.mint);rect(c,x+14,y+16,28,8,P.light);rect(c,x+22,y+8,16,8,P.light);rect(c,x+w-40,y+28,24,8,P.light);rect(c,x+12,y+72,18,20,'#70997e');rect(c,x+w-30,y+64,18,28,'#70997e');rect(c,x+w/2-4,y,8,92,P.light);rect(c,x,y+42,w,8,P.light);rect(c,x-16,y-16,w+32,8,P.wood);rect(c,x-12,y-12,w+24,4,P.light);rect(c,x-12,y+92,w+24,12,P.light);rect(c,x-16,y+104,w+32,6,P.wood);rect(c,x-16,y-8,16,104,P.pink);rect(c,x+w,y-8,16,104,P.pink);}
function stairConnection(c,p){const b=p.bounds,x=b.x,y=b.y,w=b.w,h=b.h;
 if(p.direction==='down'){
  // The room's planks end at a framed floor opening; the upper end recedes below floor level.
  const wall=x===336?320:288;rect(c,wall,y-12,x-wall+w+12,h+24,P.wood);rect(c,wall,y-12,5,h+24,P.light);rect(c,x-8,y-8,w+16,h+16,P.ink);
  rect(c,x-3,y-3,w+6,h+6,'#3d304c');rect(c,x-12,y-12,w+24,5,P.light);
  rect(c,x-12,y-7,5,h+19,'#ad8665');rect(c,x+w+7,y-7,5,h+19,'#ad8665');
  rect(c,x-12,y+h+8,w+24,4,P.light);
 }else if(p.connection==='upper-wall'){
  // The flight terminates in an upper-level doorway cut into the north wall, not blank wallpaper.
  const top=154;rect(c,x+8,top,w-16,y-top+24,P.ink);rect(c,x+16,top+8,w-32,y-top+16,'#79647f');
  rect(c,x+8,top,w-16,7,P.wood);rect(c,x+8,top,5,y-top+24,P.light);rect(c,x+w-13,top,5,y-top+24,P.light);
  rect(c,x+16,y-5,w-32,12,P.plank);
 }else{
  // A raised landing joins the side wall; the staircase meets its front edge.
  const left=112,top=y-40;rect(c,left,top,x+w-left,48,P.wood);rect(c,left,top,x+w-left,5,P.light);
  for(let xx=left+32;xx<x+w;xx+=48)rect(c,xx,top+5,2,28,'#b28b66');
  rect(c,left,y-6,x+w-left,14,P.edge);rect(c,left,y-6,x+w-left,4,P.light);
  rect(c,left,top-14,12,54,P.wall);rect(c,left,top-14,12,4,P.light);
  // Back-edge balustrade is attached to the landing, not an isolated floor prop.
  rect(c,left,top-16,x+w-left,5,P.wood);for(let xx=left+24;xx<x+w-8;xx+=32)rect(c,xx,top-12,6,15,P.light);
 }
}
function stairs(c,x,y,w=112){const p=Object.values(stairPlacements).find(p=>p.x===x&&p.y===y&&p.w===w);if(p)stairConnection(c,p);if(R.helpers.image(c,stairImage,stairSourceRect,x+w/2,y+8,w,w*1260/760)){
 if(p?.direction==='down'){const b=p.bounds;c.save();c.beginPath();c.rect(b.x+10,b.y,b.w-20,b.h*.65);c.clip();const shade=c.createLinearGradient(0,b.y,0,b.y+b.h*.65);shade.addColorStop(0,'#30233c99');shade.addColorStop(1,'#30233c00');c.fillStyle=shade;c.fillRect(b.x,b.y,b.w,b.h*.65);c.restore();}return;}
 // Missing-art fallback remains visibly simple; normal startup preloads the actual stair asset.
 rect(c,x,y-148,w,156,P.edge);for(let i=0;i<6;i++)rect(c,x+8,y-140+i*24,w-16,14,P.plank);
}
function architecture(c,theme,env={}){
 const left=theme==='bedroom'?320:theme==='main'?288:208,right=theme==='bedroom'?1360:1408,bottom=theme==='bedroom'?800:theme==='main'?820:912,wallTop=108,wallBottom=332;
 rect(c,0,0,1536,1024,'#716079');rect(c,left-16,92,right-left+32,bottom-76,P.ink);rect(c,left,108,right-left,bottom-108,P.plank);
 // The perimeter and straight plank rows establish room volume before furniture.
 for(let y=wallBottom;y<bottom;y+=32){rect(c,left,y,right-left,1,'#bb936e');for(let x=left+((y/32|0)%2)*64;x<right;x+=128)rect(c,x,y,1,Math.min(32,bottom-y),'#c39b75');}
 const keys=theme==='main'?['wall_plain','wall_plain','wall_window','wall_plain','wall_kitchen','wall_window']:theme==='bedroom'?['wall_plain','wall_plain','wall_window','wall_plain','wall_plain','wall_window']:['wall_plain','wall_window','wall_plain','wall_plain','wall_window','wall_plain'];
 const pw=(right-left)/6;for(let i=0;i<6;i++){const r=structureRects[keys[i]],trim=[r[0]+3,r[1]+3,r[2]-6,r[3]-6];R.helpers.image(c,structureImage,trim,left+pw*(i+.5),wallBottom,pw+2,224);}
 rect(c,left-16,92,right-left+32,12,P.purple);rect(c,left-16,92,right-left+32,4,P.light);rect(c,left-16,108,16,bottom-108,P.edge);rect(c,right,108,16,bottom-108,P.edge);rect(c,left,bottom-4,right-left,12,P.wood);rect(c,left,bottom-4,right-left,4,P.light);
 const stairKeys=theme==='main'?['mainUp','mainDown']:theme==='bedroom'?['bedroomExit']:['clubhouseExit'];for(const key of stairKeys){const q=stairPlacements[key];stairs(c,q.x,q.y,q.w);}
 if(theme==='main'){
  rug(c,492,420,310,230,P.pink);rug(c,1030,590,280,200,P.mint);
  // Kitchen and lounge share an unobstructed central circulation path.

  // A visible threshold gives the front exit a place in the architecture.
  rect(c,752,bottom-12,112,20,P.ink);rect(c,760,bottom-10,96,14,P.light);
 }
 if(theme==='bedroom'){rug(c,1042,350,238,158,P.pink);
  // Sleeping group and owner-play floor share an open south passage.

  // Fixed play carpet belongs to the room, not to the user's owned-decoration state.
  if(!env.profile?.decor?.placements?.rug)rug(c,700,520,360,230,P.purple);
 }
 if(theme==='clubhouse'){rug(c,510,485,320,132,P.mint);rug(c,995,330,245,148,P.pink);rug(c,990,550,310,170,P.purple);rug(c,510,760,320,120,P.blue);rug(c,996,835,220,72,P.pink);}
}
// Sprite slots are bound to the shared original atlas once supplied; native geometry is explicitly fallback only.
function furnishing(id,kind,x,y,w,h,foot,extra={}){return{id,kind,x,y,w,h,foot,color:P.purple,accent:P.pink,...extra};}
function books(id,x,y){return{id,assetKey:'books',x,y,w:48,h:34,draw(c){for(let i=0;i<3;i++){rect(c,x-24+i*3,y-12-i*9,43-i*4,8,[P.pink,P.mint,P.purple][i]);rect(c,x-18+i*3,y-10-i*9,30-i*4,3,P.light);}}};}
function picture(id,x,y){return{id,assetKey:'picture',x,y,w:64,h:52,draw(c){rect(c,x-32,y-52,64,52,P.wood);rect(c,x-26,y-46,52,40,P.light);rect(c,x-20,y-20,40,8,P.mint);rect(c,x-8,y-38,16,18,P.pink);rect(c,x-2,y-32,4,4,P.light);}};}
function basket(id,x,y,color=P.pink){return{id,x,y,w:64,h:52,draw(c){const{x,y}=this;rect(c,x-28,y-36,56,36,P.edge);rect(c,x-32,y-32,64,28,P.wood);rect(c,x-32,y-38,64,8,'#d2a876');rect(c,x-24,y-30,48,8,color);for(let i=-24;i<30;i+=12)rect(c,x+i,y-20,3,16,'#a27955');rect(c,x-28,y-12,56,3,'#b98e62');rect(c,x-28,y-4,56,4,P.edge);rect(c,x-12,y-48,24,4,P.wood);rect(c,x-16,y-44,4,8,P.wood);rect(c,x+12,y-44,4,8,P.wood);}};}
function lamp(id,x,y){return furnishing(id,'lamp',x,y,48,104,null,{color:P.light,accent:P.pink});}
function plant(id,x,y){return furnishing(id,'planter',x,y,64,88,null,{color:P.mint,accent:P.pink});}
const main=[
 furnishing('main-sofa','sofa',730,536,224,128,[630,502,200,34]),furnishing('main-armchair','chair',584,634,80,96,[550,606,68,28]),
 furnishing('main-coffee-table','table',764,652,128,80,[712,628,104,24]),books('main-table-books',754,598),lamp('main-reading-lamp',880,524),
 furnishing('main-lounge-shelf','shelf',530,376,128,128,[474,352,112,24]),picture('main-family-picture',540,254),
 furnishing('main-kitchen-counter','counter',1208,408,224,112,[1100,372,216,36]),furnishing('main-stove','counter',1380,408,144,112,[1320,376,120,32]),
 plant('main-kitchen-herbs',1270,304),basket('main-produce',1140,310,P.mint),
 furnishing('main-dining-table','table',1080,844,160,112,[1008,810,144,34]),furnishing('main-dining-chair-left','chair',952,830,64,80,[926,808,52,22]),furnishing('main-dining-chair-right','chair',1200,870,64,80,[1174,848,52,22]),
 furnishing('main-entry-cabinet','cabinet',344,900,112,104,[296,874,96,26]),basket('main-entry-basket',452,914),plant('main-front-plant',1396,912),picture('main-dining-picture',1064,268),
 furnishing('main-low-bookcase','cabinet',670,928,160,100,[598,904,144,24]),books('main-cabinet-books',342,848)
];
const upstairs=[
 furnishing('bedroom-bed','bed',1184,468,224,224,[1080,412,208,56]),furnishing('bedroom-nightstand','cabinet',1368,430,80,80,[1336,410,64,20]),lamp('bedroom-bed-lamp',1368,384),
 furnishing('bedroom-wardrobe','cabinet',460,356,144,152,[396,328,128,28]),furnishing('bedroom-reading-shelf','shelf',610,368,128,128,[554,344,112,24]),
 furnishing('bedroom-reading-chair','chair',594,480,80,96,[560,454,68,26]),lamp('bedroom-reading-lamp',710,444),books('bedroom-reading-books',670,500),
 furnishing('bedroom-scrapbook-desk','table',1372,590,128,96,[1316,568,112,22]),picture('bedroom-memory-frame',1370,516),books('bedroom-album-stack',1404,542),
 furnishing('bedroom-toy-storage','cabinet',920,356,128,100,[864,332,112,24]),basket('bedroom-soft-storage',836,358),picture('bedroom-wall-memory',960,268),
 plant('bedroom-window-plant',818,324),basket('bedroom-laundry',1404,912,P.mint),furnishing('bedroom-low-shelf','shelf',934,928,128,100,[878,904,112,24])
];
const downstairs=[
 furnishing('clubhouse-art-supply-shelf','shelf',704,366,128,128,[648,342,112,24]),basket('clubhouse-brush-box',704,246,P.mint),
 furnishing('clubhouse-paper-cabinet','cabinet',526,496,112,100,[478,472,96,24]),books('clubhouse-paper-stack',520,440),
 furnishing('clubhouse-costume-cabinet','cabinet',856,350,112,128,[808,326,96,24]),picture('clubhouse-star-picture',1000,264),
 basket('clubhouse-costume-basket',1150,366),furnishing('clubhouse-fort-storage','shelf',1380,368,112,100,[1332,344,96,24]),
 basket('clubhouse-cushion-box',1380,284,P.purple),plant('clubhouse-window-plant',1240,320),
 furnishing('clubhouse-ball-store','cabinet',1412,820,64,96,[1388,798,48,22]),basket('clubhouse-ball-basket',1408,900,P.blue),
 furnishing('clubhouse-reading-bench','sofa',654,914,176,88,[574,890,160,24]),books('clubhouse-story-books',786,920),lamp('clubhouse-reading-lamp',490,900),
 picture('clubhouse-wall-picture',592,268),plant('clubhouse-entry-plant',330,928)
];
function original(id,file,x,y,w,h,depth=y){return{id,image:'../game/build/assets/'+file+'.webp',x,y,w,h,depth};}
main.push(
 furnishing('main-side-table','table',956,550,72,64,[928,532,56,18]),original('main-reading-tea','teapot',956,506,46,46,551),
 original('main-sofa-cup','coffee_black',790,592,28,34,654),original('main-coffee-flowers','flowers',718,584,42,52,654),
 original('main-kitchen-fruit','fruit_berries',1196,310,46,38,410),original('main-stove-pan','teapot',1368,336,40,40,410),
 original('main-dining-cake','cupcake',1084,780,38,42,845),original('main-dining-cup','coffee_black',1034,782,26,32,845),
 furnishing('main-entry-wardrobe','cabinet',184,434,112,152,[136,410,96,24]),plant('main-entry-flowers',182,572),
 furnishing('main-side-bench','chair',188,790,88,104,[152,766,72,24]),books('main-bench-reading',254,798),
 picture('main-entry-family-picture',188,234),picture('main-kitchen-wall-picture',1390,224),
 furnishing('main-wall-sideboard','counter',1000,382,112,80,[952,360,96,22]),original('main-sideboard-flowers','flowers',1000,328,44,52,383));
upstairs.push(furnishing('bedroom-entry-storage','cabinet',188,460,112,100,[140,438,96,22]),plant('bedroom-entry-flowers',184,568),picture('bedroom-entry-picture',184,234),original('bedroom-desk-flowers','flowers',1336,524,36,42,592),books('bedroom-sideboard-books',934,876));
downstairs.push(furnishing('clubhouse-entry-storage','shelf',184,438,112,128,[136,414,96,24]),plant('clubhouse-entry-side-plant',188,572),picture('clubhouse-entry-art',184,234),basket('clubhouse-soft-basket',186,868,P.mint));
const topDepth={'main-table-books':653,'main-kitchen-herbs':409,'main-produce':409,'main-cabinet-books':901,'main-bench-reading':791,'bedroom-sideboard-books':929,'bedroom-bed-lamp':431,'bedroom-memory-frame':591,'bedroom-album-stack':591,'clubhouse-brush-box':367,'clubhouse-paper-stack':497,'clubhouse-cushion-box':369};
for(const list of [main,upstairs,downstairs])for(const p of list)if(topDepth[p.id])p.depth=topDepth[p.id];
const atlasRects={"bed":[57,20,228,313],"sofa":[349,86,289,223],"armchair":[701,79,189,230],"table":[964,99,250,217],"chair":[104,394,127,243],"bookshelf":[381,352,209,292],"wardrobe":[691,351,205,293],"toy_chest":[987,416,215,216],"counter":[40,737,288,169],"stove":[372,705,291,206],"vanity":[729,676,162,247],"lamp":[1049,660,112,259],"plant":[69,942,218,251],"books":[374,1002,214,175],"picture":[685,999,169,183],"booth":[931,954,290,248]};
const atlasImage='assets/world-kit/furniture-atlas-v1.webp';
for(const list of [main,upstairs,downstairs])for(const p of list){
 let key=p.assetKey|| (p.id==='bedroom-bed'?'bed':p.id.includes('wardrobe')||p.id.includes('costume-cabinet')?'wardrobe':p.id==='bedroom-toy-storage'?'toy_chest':p.id.includes('stove')?'stove':p.id.includes('counter')||p.kind==='counter'?'counter':p.kind==='sofa'?'sofa':p.id.includes('dining-chair')?'chair':p.kind==='chair'?'armchair':p.kind==='table'?'table':p.kind==='shelf'?'bookshelf':p.kind==='lamp'?'lamp':p.kind==='planter'?'plant':p.kind==='cabinet'?'counter':p.id.includes('books')||p.id.includes('paper-stack')||p.id.includes('album-stack')?'books':p.id.includes('picture')||p.id.includes('memory-frame')||p.id==='bedroom-wall-memory'?'picture':null);
 if(key&&!p.image){p.image=atlasImage;p.sourceRect=atlasRects[key];p.h=p.w*p.sourceRect[3]/p.sourceRect[2];delete p.draw;}
}
// One scale per furniture family, measured against the canonical 120-unit hero.
// Small storage units use a half-width cabinet module, never a miniaturized kitchen.
const removed=new Set(['bedroom-reading-chair','bedroom-reading-lamp','bedroom-reading-books','bedroom-desk-flowers','main-armchair','main-kitchen-wall-picture','clubhouse-star-picture','main-produce','bedroom-soft-storage','clubhouse-costume-basket','clubhouse-ball-basket','main-coffee-flowers','main-reading-tea','clubhouse-brush-box','clubhouse-cushion-box','main-entry-cabinet','main-entry-basket','main-low-bookcase','main-cabinet-books','main-side-table','main-entry-wardrobe','main-entry-flowers','main-side-bench','main-bench-reading','main-entry-family-picture','main-wall-sideboard','main-sideboard-flowers','bedroom-entry-storage','bedroom-entry-flowers','bedroom-entry-picture','bedroom-low-shelf','bedroom-sideboard-books','bedroom-laundry','clubhouse-entry-storage','clubhouse-entry-side-plant','clubhouse-entry-art','clubhouse-soft-basket']);
for(const list of [main,upstairs,downstairs])for(let i=list.length-1;i>=0;i--)if(removed.has(list[i].id))list.splice(i,1);
const widths={bed:160,sofa:156,armchair:72,table:110,chair:42,bookshelf:120,wardrobe:120,toy_chest:92,counter:164,stove:164,lamp:38,plant:48,books:30,picture:44};
for(const list of [main,upstairs,downstairs])for(const p of list){
 if(p.image!==atlasImage)continue;
 const key=Object.keys(atlasRects).find(k=>p.sourceRect===atlasRects[k]);
 if(!key)continue;
 p.w=widths[key];
 if(key==='counter'&&p.kind==='cabinet'){p.sourceRect=[40,737,144,169];p.w=82;}
 p.h=p.w*p.sourceRect[3]/p.sourceRect[2];
 if(p.foot){const fh=Math.min(30,p.h*.25);p.foot=[p.x-p.w*.43,p.y-fh,p.w*.86,fh];}
}
function reposition(list,id,x,y){const p=list.find(p=>p.id===id);if(!p)return;const dx=x-p.x,dy=y-p.y;p.x=x;p.y=y;if(p.foot){p.foot[0]+=dx;p.foot[1]+=dy;}if(p.depth!==undefined)p.depth+=dy;}
for(const p of main){if(p.image?.startsWith('../game/build/')){const ratio=p.h/p.w;p.w=Math.min(p.w,30);p.h=p.w*ratio;}}
// Kitchen modules share the same ground line and scale; lounge and dining have clear roles.
reposition(main,'main-kitchen-counter',1216,408);reposition(main,'main-stove',1380,408);
reposition(main,'main-reading-tea',780,600);reposition(main,'main-dining-chair-left',1000,830);reposition(main,'main-dining-chair-right',1160,870);
reposition(upstairs,'bedroom-scrapbook-desk',1372,548);reposition(upstairs,'bedroom-bed-lamp',1310,466);reposition(upstairs,'bedroom-window-plant',818,354);reposition(downstairs,'clubhouse-window-plant',1240,354);reposition(downstairs,'clubhouse-story-books',696,868);downstairs.find(p=>p.id==='clubhouse-story-books').depth=915;
// Composition v2: groups are arranged around two-actor-width circulation,
// not around inherited painted-room coordinates. Only built-in scenery moves.
const moves=[
 [main,{'main-sofa':[640,514],'main-armchair':[458,670],'main-coffee-table':[640,632],'main-reading-lamp':[796,544],'main-lounge-shelf':[560,380],'main-family-picture':[570,248],'main-kitchen-counter':[1136,428],'main-stove':[1300,428],'main-dining-table':[1170,710],'main-dining-chair-left':[1065,710],'main-dining-chair-right':[1265,754],'main-front-plant':[1348,782],'main-dining-picture':[990,260],'main-kitchen-wall-picture':[1300,250]}],
 [upstairs,{'bedroom-bed':[1160,480],'bedroom-nightstand':[1308,470],'bedroom-bed-lamp':[1280,502],'bedroom-wardrobe':[430,384],'bedroom-reading-shelf':[800,390],'bedroom-reading-chair':[560,510],'bedroom-reading-lamp':[684,506],'bedroom-reading-books':[544,630],'bedroom-scrapbook-desk':[600,410],'bedroom-toy-storage':[920,384],'bedroom-wall-memory':[600,230],'bedroom-window-plant':[1000,354]}],
 [downstairs,{'clubhouse-art-supply-shelf':[610,396],'clubhouse-paper-cabinet':[830,400],'clubhouse-costume-cabinet':[1320,400],'clubhouse-star-picture':[1130,235],'clubhouse-fort-storage':[1330,624],'clubhouse-window-plant':[930,354],'clubhouse-ball-store':[454,854],'clubhouse-reading-bench':[1100,896],'clubhouse-story-books':[1130,850],'clubhouse-reading-lamp':[1238,896],'clubhouse-wall-picture':[700,250],'clubhouse-entry-plant':[242,866]}]
];
for(const[list,map]of moves)for(const[id,xy]of Object.entries(map))reposition(list,id,...xy);
// Different functions need different sizes: a two-seat sofa is not an armchair;
// the dining table is larger than the compact lounge table, not a random scale.
for(const[list,id,w]of [[main,'main-sofa',200],[main,'main-dining-table',140],[upstairs,'bedroom-bed',168],[downstairs,'clubhouse-reading-bench',180]]){const q=list.find(p=>p.id===id);q.w=w;q.h=w*q.sourceRect[3]/q.sourceRect[2];if(q.foot)q.foot=[q.x-w*.43,q.y-30,w*.86,30];}
// Reading and scrapbook are usable clusters, with actual supports/seating.
upstairs.push({id:'bedroom-scrapbook-chair',image:atlasImage,sourceRect:atlasRects.chair,x:600,y:490,w:42,h:42*243/127,foot:[582,470,36,20]});
// Purpose-built inward-facing seats: never rotate a front-facing chair into a false pose.
const chairImage='assets/world-kit/directional-chairs-v1.webp';
for(const[list,id,sr,x,y]of [[main,'main-dining-chair-left',[1326,129,381,594],1065,710],[main,'main-dining-chair-right',[747,129,381,594],1270,710],[upstairs,'bedroom-scrapbook-chair',[200,170,348,553],600,470]]){const q=list.find(p=>p.id===id);q.image=chairImage;q.sourceRect=sr;q.h=80;q.w=80*sr[2]/sr[3];q.x=x;q.y=y;q.foot=[x-q.w*.4,y-20,q.w*.8,20];}
// Bind every surface object to its actual support. This also prevents floating book strips.
const supports=[
 [main,'main-table-books','main-coffee-table',-25,.58],[main,'main-sofa-cup','main-coffee-table',25,.48],[main,'main-coffee-flowers','main-coffee-table',-34,.72],[main,'main-reading-tea','main-coffee-table',16,.70],
 [main,'main-kitchen-herbs','main-kitchen-counter',54,.72],[main,'main-produce','main-kitchen-counter',-48,.72],[main,'main-kitchen-fruit','main-kitchen-counter',0,.72],[main,'main-stove-pan','main-stove',-28,.70],
 [main,'main-dining-cake','main-dining-table',12,.55],[main,'main-dining-cup','main-dining-table',-25,.55],
 [upstairs,'bedroom-memory-frame','bedroom-scrapbook-desk',0,.70],[upstairs,'bedroom-album-stack','bedroom-scrapbook-desk',28,.45],[upstairs,'bedroom-desk-flowers','bedroom-scrapbook-desk',-28,.65],
 [downstairs,'clubhouse-paper-stack','clubhouse-paper-cabinet',0,.72]];
for(const [list,id,parent,dx,f]of supports){const p=list.find(p=>p.id===id),q=list.find(p=>p.id===parent);if(p&&q){reposition(list,id,q.x+dx,q.y-q.h*f);p.depth=q.y+1;}}
// The bed projects much farther into the floor than upright cabinets: a generic 30-unit foot is incorrect.
upstairs.find(p=>p.id==='bedroom-bed').foot=[1084,350,152,130];
// This is now a floor lamp, not a tabletop accessory.
upstairs.find(p=>p.id==='bedroom-bed-lamp').depth=502;
downstairs.find(p=>p.id==='clubhouse-story-books').depth=897;
// Jigsaw activity display: existing puzzle preview, not a saved/in-progress puzzle.
// Its final sprite treatment follows the shared pixel-art production contract.
upstairs.push({id:'bedroom-jigsaw-table',image:atlasImage,sourceRect:atlasRects.table,x:1240,y:670,w:140,h:140*217/250,foot:[1178,640,124,30]});
const puzzlePreview='assets/puzzles/whimsy-2026/uw-puzzle-whimsy-2026-01.webp';
upstairs.push({id:'bedroom-jigsaw-picture',image:puzzlePreview,x:1240,y:616,w:104,h:54,depth:671,draw(c){
 rect(c,1186,560,108,58,P.ink);const im=R.images[puzzlePreview];if(im)c.drawImage(im,1189,563,102,52);
 c.save();c.strokeStyle='#fff0ce';c.lineWidth=1.3;
 // Three-by-two joined picture pieces are a wordless interaction cue.
 for(const x of [1223,1257]){c.beginPath();c.moveTo(x,563);c.lineTo(x,578);c.bezierCurveTo(x+7,575,x+7,587,x,584);c.lineTo(x,615);c.stroke();}
 c.beginPath();c.moveTo(1189,589);c.lineTo(1232,589);c.bezierCurveTo(1229,582,1241,582,1238,589);c.lineTo(1291,589);c.stroke();c.restore();
}});
// Preserve all user-owned placements and live station anchors: this normalization only changes built-in scenery.
const common={width:1536,height:1024,images:[structureImage,stairImage]};

const point=(x,y)=>({x,y});
function exit(key,target,approach){const p=stairPlacements[key],b=p.bounds;return{target,x:b.x+b.w/2,y:b.y+b.h/2,approach:point(...approach),hit:{...b},radius:90};}
function activity(x,y,width,approach,foot){return{x,y,width,approach:point(...approach),hit:{x:x-width/2,y:y-width*.72,w:width,h:width*.8},radius:110,foot};}
const layout={
 'home-main':{bounds:{x:288,y:332,w:1120,h:488},spawn:point(850,640),exits:{upstairs:exit('mainUp','home-upstairs',[360,480]),downstairs:exit('mainDown','home-downstairs',[352,790]),outside:{target:'neighbourhood',x:808,y:818,approach:point(808,760),hit:{x:752,y:800,w:112,h:32},radius:85}},activities:{}},
 'home-upstairs':{bounds:{x:320,y:332,w:1040,h:468},decorZone:{x:740,y:550,w:270,h:200},spawn:point(620,750),exits:{main:exit('bedroomExit','home-main',[384,780])},activities:{jigsaws:{x:1240,y:670,width:140,approach:point(1240,750),hit:{x:1162,y:536,w:156,h:144},radius:95,foot:[1178,640,124,30]},'room-play':{x:840,y:650,approach:point(840,740),hit:{x:708,y:540,w:264,h:210},radius:120},decorate:{x:920,y:384,approach:point(920,470),hit:{x:864,y:292,w:112,h:110},radius:95},scrapbook:{x:600,y:410,approach:point(690,470),hit:{x:536,y:302,w:128,h:110},radius:90}}},
 'home-downstairs':{bounds:{x:208,y:332,w:1200,h:580},spawn:point(460,550),exits:{main:exit('clubhouseExit','home-main',[272,520])},activities:{art:activity(670,580,300,[670,662],[540,545,260,35]),puppets:activity(1120,440,210,[1120,510],[1030,415,180,25]),fort:activity(1140,700,290,[1140,778],[1010,645,260,55]),ball:activity(670,850,285,[670,740],[550,805,240,45])}}
};
// Saved photo aperture measured from the tilted original frame's inner border.
// Bounding box is for image cover-fit; clip to quad so media never paints over gold trim.
const memoryFrame=upstairs.find(p=>p.id==='bedroom-wall-memory'),fz=memoryFrame.w/169;
const photoQuad=[[46,44],[122,36],[135,133],[60,143]].map(([x,y])=>({x:memoryFrame.x-memoryFrame.w/2+x*fz,y:memoryFrame.y-memoryFrame.h+y*fz}));
const fx=Math.min(...photoQuad.map(p=>p.x)),fy=Math.min(...photoQuad.map(p=>p.y));
layout['home-upstairs'].photoFrame={x:fx,y:fy,w:Math.max(...photoQuad.map(p=>p.x))-fx,h:Math.max(...photoQuad.map(p=>p.y))-fy,quad:photoQuad,depth:memoryFrame.y+1};
R.register('home-main',{...common,ground:(c)=>architecture(c,'main'),props:main,npcs:[{id:'home-reader',x:790,y:560,role:'reader',color:P.mint},{id:'home-kitchen-helper',x:1240,y:530,role:'host',color:'blue'}],walkable:(x,y)=>x>=312&&x<=1384&&y>=352&&y<=800});
R.register('home-upstairs',{...common,ground:(c,env)=>architecture(c,'bedroom',env),props:upstairs,npcs:[],walkable:(x,y)=>x>=344&&x<=1336&&y>=352&&y<=788});
R.register('home-downstairs',{...common,ground:(c)=>architecture(c,'clubhouse'),props:downstairs,npcs:[],colliders:Object.values(layout['home-downstairs'].activities).map(a=>a.foot),walkable:(x,y)=>x>=232&&x<=1384&&y>=352&&y<=890});
for(const[id,list]of Object.entries({'home-main':main,'home-upstairs':upstairs,'home-downstairs':downstairs}))layout[id].props=list.map(p=>({id:p.id,x:p.x,y:p.y,w:p.w,h:p.h,foot:p.foot}));
window.UWHomeAreas={layout,stairPlacements,stairImage,stairSourceRect,palette:P,props:{'home-main':main,'home-upstairs':upstairs,'home-downstairs':downstairs},bed:{x:1160,y:480,w:168,h:168*313/228},atlasImage,atlasRects};
})();
