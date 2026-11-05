/* Original modular scene renderer. Visuals only: never writes scene, saves or simulation.
 * The authoritative LEVELS floor/obstacle rectangles remain the placement contract.
 * Existing canonical sprite artwork is reused; no flattened world image is drawn.
 */
(function(root){'use strict';
const VERSION='modular-interiors-5';
// Legacy free-standing art already belongs to these collision objects; draw each once.
const EXTRA_BINDINGS=Object.freeze({easy_market:['bonus-crate'],sneak_restaurant:['extra-table-a','extra-table-b'],sneak_toys:['extra-display-a','extra-display-b']});
const KIT_RECTS={"furniture:bed":[57,20,228,313],"furniture:sofa":[349,86,289,223],"furniture:armchair":[701,79,189,230],"furniture:table":[964,99,250,217],"furniture:chair":[104,394,127,243],"furniture:bookshelf":[381,352,209,292],"furniture:wardrobe":[691,351,205,293],"furniture:toy_chest":[987,416,215,216],"furniture:counter":[40,737,288,169],"furniture:stove":[372,705,291,206],"furniture:vanity":[729,676,162,247],"furniture:lamp":[1049,660,112,259],"furniture:plant":[69,942,218,251],"furniture:books":[374,1002,214,175],"furniture:picture":[685,999,169,183],"furniture:booth":[931,954,290,248],"shops:rack":[40,56,283,230],"shops:mirror":[395,12,174,279],"shops:checkout":[653,83,263,206],"shops:planter":[959,33,269,256],"shops:arcade":[71,311,191,310],"shops:claw_machine":[380,319,217,302],"shops:prize_shelf":[650,364,276,242],"shops:bike_workbench":[967,332,260,291],"shops:helmet_rack":[34,723,293,160],"shops:photo_booth":[372,638,235,284],"shops:camera":[701,656,244,258],"shops:track_barrier":[945,758,291,141],"shops:produce_bin":[18,957,323,239],"shops:toy_display":[357,991,282,205],"shops:pantry_shelf":[668,984,264,187],"shops:bakery_display":[957,949,282,260]};
const STRUCT_RECTS={"wall_plain":[32,55,253,249],"wall_window":[347,55,250,249],"wall_doorway":[660,55,248,249],"wall_reading":[970,55,250,249],"wall_kitchen":[33,366,254,252],"wall_bathroom":[348,366,248,252],"wall_shop":[660,366,247,251],"stone_wall":[947,421,291,188],"pillar":[418,660,101,266],"curtains":[673,680,220,242],"terrace_railing":[951,753,282,148],"rug_square":[33,966,255,232],"rug_stripe":[329,1008,286,158],"vegetable_bed":[639,1021,306,144],"star_sign":[945,1022,238,142]};
const FIXTURE_RECTS={"tv":[232,75,170,430],"fridge":[636,62,267,426],"bed":[1126,40,237,455],"narrow_kitchen":[218,528,200,455],"bedside":[623,596,291,352],"pumpkin":[1033,532,437,445]};
const themes={house:{floor:'#b58d72',seam:'#a3816c',light:'#c19a7d',wall:'#8e78a8',cap:'#c7b9db',trim:'#57476e',rug:'#b084bb'},market:{floor:'#d4dacb',seam:'#bec6b9',light:'#dfe2d1',wall:'#6fa69c',cap:'#b8ddd0',trim:'#365e67',rug:'#739b98'},restaurant:{floor:'#d1b9a1',seam:'#c0a88f',light:'#d9c4ac',wall:'#9a7288',cap:'#e2b2bd',trim:'#684252',rug:'#ac747e'},toys:{floor:'#c4c9d2',seam:'#b6bdc9',light:'#cdd0d5',wall:'#718bab',cap:'#aecfdf',trim:'#475c82',rug:'#8d9fc8'},police:{floor:'#b69da4',seam:'#927b90',light:'#cbb4b1',wall:'#686b91',cap:'#aca3c4',trim:'#41435f',rug:'#8b77a0'}};
function theme(s){return themes[s.police?'police':s.place||s.id.split('_')[1]]||themes.house;}
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function sprite(c,art,id,x,foot,w,maxH){const im=art[id];if(!im)return;let h=w*im.height/im.width;if(maxH&&h>maxH){w*=maxH/h;h=maxH;}c.drawImage(im,Math.round(x-w/2),Math.round(foot-h),Math.round(w),Math.round(h));}
function panel(c,r,top,face,depth=20){const[x,y,w,h]=r;box(c,x+5,y+7,w,h,'#302f4025');box(c,x,y,w,h,face);box(c,x,y,w,Math.max(8,h-depth),top);box(c,x+4,y+4,w-8,3,'#ffffff40');box(c,x,y+h-5,w,5,'#423b5655');box(c,x,y,4,h,'#322d4340');box(c,x+w-4,y,4,h,'#322d4340');}
function floorPath(c,rs){c.beginPath();for(const r of rs)c.rect(...r);}
function boundary(s){const rs=s.floors.filter(r=>r[0]<(s.baseW||s.w)),xs=[...new Set(rs.flatMap(r=>[r[0],r[0]+r[2]]))].sort((a,b)=>a-b),ys=[...new Set(rs.flatMap(r=>[r[1],r[1]+r[3]]))].sort((a,b)=>a-b),inside=(x,y)=>rs.some(r=>x>r[0]&&x<r[0]+r[2]&&y>r[1]&&y<r[1]+r[3]),edges=[];
for(let j=0;j<ys.length-1;j++)for(let i=0;i<xs.length-1;i++){const x=xs[i],y=ys[j],w=xs[i+1]-x,h=ys[j+1]-y;if(!inside(x+w/2,y+h/2))continue;if(!inside(x+w/2,y-1))edges.push({x,y,w,side:'north'});if(!inside(x+w/2,y+h+1))edges.push({x,y:y+h,w,side:'south'});if(!inside(x-1,y+h/2))edges.push({x,y,h,side:'west'});if(!inside(x+w+1,y+h/2))edges.push({x:x+w,y,h,side:'east'});}return edges;}
const cache=new WeakMap();
function edges(s){if(!cache.has(s))cache.set(s,boundary(s));return cache.get(s);}
function rug(c,r,color,kind){const[x,y,w,h]=r;box(c,x,y,w,h,'#604d7350');box(c,x+4,y+4,w-8,h-8,color);box(c,x+11,y+11,w-22,3,'#e9ddc887');box(c,x+11,y+h-14,w-22,3,'#e9ddc887');box(c,x+11,y+11,3,h-22,'#e9ddc887');box(c,x+w-14,y+11,3,h-22,'#e9ddc887');for(let px=x+27;px<x+w-22;px+=42){box(c,px,y+19,5,5,'#f9e3b4aa');box(c,px,y+h-23,5,5,'#f9e3b4aa');}if(kind==='toys')for(let py=y+46;py<y+h-35;py+=80)for(let px=x+45;px<x+w-35;px+=80){box(c,px-3,py-9,6,18,'#e8dca586');box(c,px-9,py-3,18,6,'#e8dca586');}}
function drawFloor(c,s,art){const t=theme(s),bw=s.baseW||s.w,bh=s.baseH||s.h;c.save();c.imageSmoothingEnabled=false;box(c,0,0,bw,bh,t.trim); // Nonwalkable recesses are visibly dark, never fake traversable space.
for(let y=0;y<bh;y+=24)for(let x=0;x<bw;x+=48){box(c,x+(y%48?24:0),y,45,21,'#ffffff04');}
const rs=s.floors.filter(r=>r[0]<bw);const north=Math.min(...rs.map(r=>r[1]));
box(c,0,Math.max(0,north-170),bw,110,t.wall);box(c,0,north-174,bw,5,t.cap);for(let x=20;x<bw;x+=90){box(c,x,north-150,58,62,'#ffffff0d');box(c,x,north-150,58,3,'#ffffff16');box(c,x,north-150,3,62,'#34294119');}
c.save();floorPath(c,rs);c.clip();box(c,0,0,bw,bh,t.floor);
const wood=s.place==='house'||s.id.includes('house');if(wood){for(let y=0;y<bh;y+=32){box(c,0,y,bw,2,t.seam);for(let x=(y/32%2)*78;x<bw;x+=156){box(c,x,y,2,32,t.seam);box(c,x+9,y+8,83,1,'#ffffff16');box(c,x+37,y+23,102,1,'#5f475316');}}}else{for(let y=0;y<bh;y+=48)for(let x=0;x<bw;x+=48){if(((x+y)/48)%2===0)box(c,x+2,y+2,45,45,t.light);box(c,x,y,48,2,t.seam);box(c,x,y,2,48,t.seam);}}
for(const r of s.soft||[])rug(c,r,t.rug,s.place); // Soft/noisy materials still correspond exactly to native footprints.
// Clear, quiet walkway runners are floor decoration, not collision furniture.
if(!s.soft?.length){const r=rs[0];box(c,r[0]+13,r[1]+r[3]-24,r[2]-26,7,t.wall);box(c,r[0]+13,r[1]+r[3]-13,r[2]-26,3,t.cap);}
c.restore();
for(const e of edges(s)){if(e.side==='north'){box(c,e.x,e.y-54,e.w,54,t.wall);box(c,e.x,e.y-61,e.w,9,t.cap);box(c,e.x,e.y-5,e.w,5,t.trim);box(c,e.x,e.y+1,e.w,8,'#44314c20');for(let x=e.x+12;x<e.x+e.w-12;x+=64){box(c,x,e.y-43,2,30,'#ffffff20');box(c,x+5,e.y-16,46,2,'#ffffff18');}
for(let x=e.x+72;x<e.x+e.w-70;x+=245){if(!art.world_structure)windowFrame(c,x,e.y-63,76,50,t);}}
else if(e.side==='south'){box(c,e.x,e.y,e.w,10,t.cap);box(c,e.x,e.y+10,e.w,19,t.wall);box(c,e.x,e.y+27,e.w,4,t.trim);}else{const x=e.x-(e.side==='west'?10:0);box(c,x,e.y,10,e.h,t.cap);box(c,x+3,e.y,3,e.h,'#ffffff35');}}
drawPerimeter(c,s,art,t);drawWallArt(c,s,art);c.restore();}
function windowFrame(c,x,y,w,h,t){box(c,x-5,y-5,w+10,h+10,t.trim);box(c,x-2,y-2,w+4,h+4,t.cap);box(c,x,y,w,h,'#567e9f');box(c,x+4,y+4,w-8,h-8,'#9ac7cf');box(c,x+7,y+5,w/3,h-11,'#d6e7dd');box(c,x+w/2-2,y,4,h,t.cap);box(c,x,y+h/2-2,w,4,t.cap);box(c,x-8,y+h+3,w+16,7,t.cap);}
function kind(o){if(o.artKind)return o.artKind;const id=o.id;if(id==='bedside'||id==='hall-dresser')return'cabinet';if(id==='kitchen-side')return'narrow-kitchen';if(id==='extra-display-a')return'box';if(id==='extra-display-b')return'shelf';if(id==='center-pumpkin')return'pumpkin';if(/top-left-stalls|top-right-stalls|top-stage/.test(id))return'festival';if(/divider|partition|play-wall/.test(id))return'wall';if(/lamp/.test(id))return'lamp';if(/armchair|^chair$/.test(id))return'chair';if(/sofa/.test(id))return'sofa';if(/^bed$/.test(id))return'bed';if(/stairs/.test(id))return'stairs';if(/fridge/.test(id))return'fridge';if(/^tv$/.test(id))return'tv';if(/bath/.test(id))return'bath';if(/booth/.test(id))return'booth';if(/dining|coffee|table/.test(id))return'table';if(/flower|garden/.test(id))return'flowers';if(/cart|trolleys|baskets/.test(id))return'cart';if(/produce/.test(id))return'produce';if(/checkout/.test(id))return'checkout';if(/counter|kitchen|bakery|dessert/.test(id))return'counter';if(/plush|toy-island|extra-display/.test(id))return'toys';if(/puzzle|box|crate|foyer/.test(id))return'box';if(/water/.test(id))return'water';return'shelf';}

function structure(c,art,name,x,foot,w,maxH){const r=STRUCT_RECTS[name],im=art.world_structure;if(!r||!im)return false;let h=w*r[3]/r[2];if(maxH&&h>maxH){w*=maxH/h;h=maxH;}c.drawImage(im,...r,Math.round(x-w/2),Math.round(foot-h),Math.round(w),Math.round(h));return true;}
function kit(c,art,name,x,foot,w,maxH){const group=KIT_RECTS['furniture:'+name]?'furniture':'shops',r=KIT_RECTS[group+':'+name],im=art['world_'+group];if(!r||!im)return false;let h=w*r[3]/r[2];if(maxH&&h>maxH){w*=maxH/h;h=maxH;}c.drawImage(im,...r,Math.round(x-w/2),Math.round(foot-h),Math.round(w),Math.round(h));return true;}
function furnish(c,art,name,x,foot,w){if(!kit(c,art,name,x,foot,w))sprite(c,art,name,x,foot,w);}
// Fixed-height material modules: world footprint is never an enlarged full cabinet.
const MATERIAL_RECTS={"wood": [56, 80, 420, 412], "fascia": [554, 244, 615, 241], "post": [1307, 91, 110, 409], "soil": [54, 563, 424, 395], "stone": [550, 718, 601, 176], "edge": [1190, 754, 304, 88]};
function material(c,art,id,x,y,w,h){const im=art.world_materials,rr=MATERIAL_RECTS[id];if(!im)return; c.drawImage(im,...rr,Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function bank(c,art,r,soil=false){const[x,y,w,h]=r,face=Math.min(34,h*.34),top=h-face;
 // Material tiles have a fixed 104-world-unit grain scale; clip at footprint edges.
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();box(c,x,y,w,h,'#705568');
 for(let yy=y;yy<y+top;yy+=104)for(let xx=x;xx<x+w;xx+=104)material(c,art,soil?'soil':'wood',xx,yy,104,104);
 const unit=soil?114:88,n=Math.ceil(w/unit),cw=w/n;for(let i=0;i<n;i++)material(c,art,soil?'stone':'fascia',x+i*cw,y+top,cw+.5,face);
 if(!soil){for(let xx=x;xx<x+w;xx+=100)material(c,art,'edge',xx,y-3,101,14);}else{for(let xx=x;xx<x+w;xx+=110)material(c,art,'stone',xx,y-3,111,13);box(c,x+1,y,5,top,'#c1b18c');box(c,x+w-6,y,5,top,'#918c73');}
 box(c,x,y,3,top,'#705368');box(c,x+w-3,y,3,top,'#705368');c.restore();
}

function detail(c,art,rect,x,foot,w){const im=art.world_shops;if(im)c.drawImage(im,...rect,Math.round(x-w/2),Math.round(foot-w*rect[3]/rect[2]),Math.round(w),Math.round(w*rect[3]/rect[2]));}
function cartBay(c,o,art){const[x,y,w,h]=o.r;box(c,x,y,w,h,'#687f8b');box(c,x+4,y+4,w-8,h-8,'#aebbb6');for(let yy=y+9;yy<y+h-6;yy+=13){box(c,x+6,yy,w-12,2,'#718c94');box(c,x+6,yy+2,w-12,1,'#d4d7c8');}c.strokeStyle='#e2cf9a';c.lineWidth=5;c.strokeRect(x+3,y+3,w-6,h-6);const cols=Math.max(1,Math.floor(w/82));for(let i=0;i<cols;i++)sprite(c,art,o.id==='baskets'?'hamper':'cart',x+(i+.5)*w/cols,y+h-8,Math.min(78,w/cols-10));}
function stockBank(c,s,o,art,k){const[x,y,w,h]=o.r;if(k==='cart'){cartBay(c,o,art);return;}bank(c,art,o.r,k==='flowers');const topH=h-Math.min(32,h*.34),cols=Math.max(1,Math.floor((w-12)/112)),cw=(w-12)/cols;
 if(k==='shelf'&&(s.place==='house'||s.place==='toys'||/book|library/.test(o.id))){const n=Math.max(1,Math.ceil(w/140));for(let i=0;i<n;i++)furnish(c,art,'bookshelf',x+(i+.5)*w/n,y+h,Math.min(128,w/n-5));return;}
 if(k==='checkout'){detail(c,art,[656,84,258,119],x+w*.7,y+topH-2,Math.min(112,w-12));return;}
 if(k==='cart'){const n=Math.max(1,Math.floor(w/85));for(let i=0;i<n;i++)sprite(c,art,o.id==='baskets'?'hamper':'cart',x+(i+.5)*w/n,y+topH,Math.min(76,w/n-8));return;}
 const crop=k==='flowers'?[970,37,245,137]:k==='produce'?[32,972,295,136]:k==='toys'?[373,993,248,137]:k==='shelf'?[684,1001,229,69]:(/dessert|bakery/.test(o.id)||s.police)?[978,982,237,139]:/kitchen/.test(o.id)?null:[688,1086,225,65];
 const rows=/kitchen/.test(o.id)?1:Math.max(1,Math.ceil(topH/76));for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const xx=x+6+(col+.5)*cw,foot=y+8+(row+1)*(topH-12)/rows;const dw=Math.min(k==='flowers'?94:102,cw-8);if(crop)detail(c,art,crop,xx,foot,dw);else if(/kitchen/.test(o.id)){// fixed-size inset hob, not an entire repeated oven
 if(col%3===1){box(c,xx-30,foot-40,60,37,'#907c80');box(c,xx-25,foot-35,50,27,'#b9cbd0');box(c,xx-21,foot-32,42,20,'#7f9da8');box(c,xx+10,foot-48,5,22,'#e7d6b0');continue;}if(col%3===2){detail(c,art,[688,1086,225,65],xx,foot,Math.min(85,cw-10));continue;}box(c,xx-32,foot-43,64,39,'#6c5964');box(c,xx-29,foot-40,58,33,'#a9a39b');for(let a=0;a<2;a++)for(let b=0;b<2;b++){c.strokeStyle='#564a56';c.lineWidth=3;c.beginPath();c.arc(xx-15+a*30,foot-31+b*15,5,0,Math.PI*2);c.stroke();}}
 else{box(c,xx-23,foot-28,46,25,'#c5a580');box(c,xx-19,foot-24,38,17,'#e6cfab');}}
}
function kitObstacle(c,s,o,art){const[x,y,w,h]=o.r,k=kind(o),foot=y+h;let name=null;
if(k==='sofa')name='sofa';if(k==='chair')name='armchair';if(k==='bed')name='bed';if(k==='lamp')name='lamp';if(k==='booth')name='booth';if(k==='bath')name='vanity';if(k==='cabinet')name='counter';if(k==='box')name=/toy|puzzle|foyer|extra-display-a/.test(o.id)?'toy_chest':'crate';if(k==='table')name='table';
if(name){furnish(c,art,name,x+w/2,foot,w+3);if(k==='table'&&s.place!=='restaurant'){kit(c,art,'books',x+w*.68,foot-h*.33,35,25);}return true;}
if(['cart','flowers','counter','checkout','produce','toys','shelf'].includes(k)){stockBank(c,s,o,art,k);return true;}
return false;}

function drawObstacle(c,s,o,art){const[x,y,w,h]=o.r,t=theme(s),k=kind(o),foot=y+h;c.save();c.imageSmoothingEnabled=false;
if(o.facing&&art.world_chairs){const rr=o.facing==='east'?[1326,129,381,594]:[747,129,381,594];c.drawImage(art.world_chairs,...rr,x,foot-w*rr[3]/rr[2],w,w*rr[3]/rr[2]);c.restore();return;}
if(k==='tv-front'){bank(c,art,[x,y,w,h]);box(c,x+8,y-54,w-16,58,'#48384d');box(c,x+12,y-50,w-24,47,'#9cbfbe');box(c,x+16,y-46,w-32,35,'#b5d4cc');box(c,x+w*.45,y+3,w*.1,10,'#74616d');c.restore();return;}
if(['tv','fridge','bed','narrow-kitchen','cabinet','pumpkin','stairs'].includes(k)){const id=k==='narrow-kitchen'?'narrow_kitchen':k==='cabinet'?'bedside':k,rr=id==='stairs'?[140,130,760,1260]:FIXTURE_RECTS[id],im=id==='stairs'?art.world_stairs:art.world_fixtures;if(im&&rr){const ratio=rr[3]/rr[2],dw=Math.max(w,h/ratio),dh=dw*ratio;c.drawImage(im,...rr,Math.round(x+w/2-dw/2),Math.round(foot-dh),Math.round(dw),Math.round(dh));c.restore();return;}}
if(k==='festival'){stockBank(c,s,o,art,o.id==='top-stage'?'toys':'counter');c.restore();return;}
if(kitObstacle(c,s,o,art)){c.restore();return;}
if(k==='wall'){panel(c,[x,y-36,w,h+36],t.cap,t.wall,30);c.restore();return;}
if(k==='water'){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const g=c.createLinearGradient(x,y,x,foot);g.addColorStop(0,'#78c8cc');g.addColorStop(.2,'#5dafbc');g.addColorStop(1,'#427d9b');c.fillStyle=g;c.fillRect(x,y,w,h);for(let row=0;row<Math.ceil(h/26);row++){for(let col=0;col<Math.ceil(w/57);col++){const xx=x+col*57+(row%2)*21,yy=y+row*26+((col*13+row*7)%19);c.strokeStyle=(col+row)%3?'#b9e4dc50':'#e7f1d88a';c.lineWidth=2;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+13,yy-5,xx+28,yy);c.quadraticCurveTo(xx+36,yy+2,xx+43,yy-2);c.stroke();}}c.restore();const n=Math.ceil(w/130);for(let j=0;j<n;j++)structure(c,art,'stone_wall',x+(j+.5)*w/n,y+18,w/n+3);c.restore();return;}

c.restore();}


function drawPerimeter(c,s,art,t){const rs=s.floors.filter(r=>r[0]<(s.baseW||s.w));const left=Math.min(...rs.map(r=>r[0])),right=Math.max(...rs.map(r=>r[0]+r[2])),north=Math.min(...rs.map(r=>r[1]));
// Furnish the wall-top/recess band, wholly outside walkable floor. Original sprites keep modular identity.
for(let x=left+70,i=0;x<right-40;x+=170,i++){if(s.obstacles.some(o=>x>o.r[0]-45&&x<o.r[0]+o.r[2]+45&&o.r[1]<north+20))continue;const id=s.place==='toys'?['teddy','robot','toyunicorn','book'][i%4]:s.place==='market'?['plant','flowers','hamper'][i%3]:['plant','picture','flowers'][i%3];box(c,x-42,north-75,84,8,t.cap);if(!kit(c,art,id==='flowers'?'plant':id,x,north-77,50,72))sprite(c,art,id,x,north-77,50,72);}
// Edge trim and tiny carved rosettes make the architectural border intentional.
for(const e of edges(s))if(e.side==='south')for(let x=e.x+24;x<e.x+e.w-16;x+=76){box(c,x,e.y+14,7,7,t.cap);box(c,x+2,e.y+12,3,11,t.cap);}
}


function drawWallArt(c,s,art){if(!art.world_structure)return;
// Reusable front-facing wall inserts, never the rejected angled corner.
for(const e of edges(s)){if(e.side!=='north'||e.w<175)continue;const n=Math.max(1,Math.floor(e.w/215));for(let i=0;i<n;i++){const w=e.w/n,mid=e.x+(i+.5)*w;if(s.obstacles.some(o=>mid>o.r[0]-50&&mid<o.r[0]+o.r[2]+50&&o.r[1]<e.y+20))continue;const name=(i%3===0)?'wall_window':s.place==='restaurant'?'wall_kitchen':s.place==='house'?'wall_reading':s.place==='market'?'wall_shop':'wall_shop';structure(c,art,name,mid,e.y-3,w-3,177);}}
}

function drawSecret(c,r,art,parent){const t=theme(parent||{id:'secret_toys',place:'toys'});c.save();c.imageSmoothingEnabled=false;box(c,r.x,r.y-80,r.w,r.h+80,t.trim);box(c,r.x+25,r.y+25,r.w-50,r.h-50,t.floor);for(let y=r.y+25;y<r.y+r.h-25;y+=32){box(c,r.x+25,y,r.w-50,1,t.seam);for(let x=r.x+25;x<r.x+r.w-25;x+=96)box(c,x,y,1,32,t.seam);}box(c,r.x,r.y-60,r.w,85,t.wall);box(c,r.x,r.y-65,r.w,6,t.cap);for(let i=0;i<3;i++)structure(c,art,i===1?'wall_window':parent?.place==='house'?'wall_reading':parent?.place==='restaurant'?'wall_kitchen':'wall_shop',r.x+100+i*180,r.y+25,150,110);structure(c,art,r.index?'rug_stripe':'rug_square',r.x+300,r.y+310,190,145);box(c,r.x,r.y+r.h-25,r.w,25,t.wall);box(c,r.x,r.y,25,r.h,t.cap);box(c,r.x+r.w-25,r.y,25,r.h,t.cap);c.restore();}

const api={VERSION,EXTRA_BINDINGS,drawFloor,drawObstacle,drawSecret,kind,boundary,theme};root.UnicornInteriors=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
