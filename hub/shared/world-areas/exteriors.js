/* Authored town blocks, private garden and sports grounds; each item is independently placed. */
(function(){'use strict';const R=UWWorldRenderer,atlas='./assets/neighbourhood/props.png';
const sr={tree:[34,31,279,314],bush:[367,152,213,181],flowers:[650,179,275,149],rock:[1026,200,167,137],fence:[45,462,260,140],picnic:[971,422,257,172],pond:[636,687,300,195],bench:[974,694,250,170],home:[28,906,285,291],cafe:[343,914,262,293],mall:[634,911,300,294],arch:[957,906,279,291]};
const exteriorRects={"oak":[23,39,299,315],"cypress":[415,25,119,327],"blossom_tree":[646,86,276,266],"fruit_tree":[983,105,244,247],"bush":[42,432,224,162],"hedge":[322,470,292,112],"hedge_corner":[692,393,209,221],"flower_planter":[986,404,217,184],"fountain":[42,642,243,246],"mailbox":[398,635,134,250],"flower_cart":[631,642,311,246],"bench":[963,692,265,184],"stepping_straight":[105,930,115,283],"stepping_corner":[345,951,220,214],"pergola":[634,931,299,266],"streetlamp":[1053,906,90,301]},furnitureRects={"bed":[57,20,228,313],"sofa":[349,86,289,223],"armchair":[701,79,189,230],"table":[964,99,250,217],"chair":[104,394,127,243],"bookshelf":[381,352,209,292],"wardrobe":[691,351,205,293],"toy_chest":[987,416,215,216],"counter":[40,737,288,169],"stove":[372,705,291,206],"vanity":[729,676,162,247],"lamp":[1049,660,112,259],"plant":[69,942,218,251],"books":[374,1002,214,175],"picture":[685,999,169,183],"booth":[931,954,290,248]};
const variant=id=>[...id].reduce((a,c)=>a+c.charCodeAt(0),0)%4;
const art=(id,kind,x,y,w,h,foot)=>{const key=kind==='tree'?['oak','blossom_tree','fruit_tree','cypress'][variant(id)]:kind==='bench'?'bench':kind==='bush'?'bush':null;return{id,kind,x,y,w,h,image:key?'assets/world-kit/exterior-atlas-v1.webp':atlas,sourceRect:key?exteriorRects[key]:sr[kind],foot:foot||(kind==='tree'?[x-12,y-16,24,16]:kind==='bench'?[x-w*.43,y-14,w*.86,14]:null)};};
const obj=(id,kind,x,y,w,h,color,accent,foot)=>{const k={fountain:'fountain',flower:'flower_planter',planter:'flower_planter',bench:'bench',lamp:'streetlamp'}[kind]||(id.includes('mail')?'mailbox':id.includes('shade')?'pergola':null),fk={table:'table',chair:'chair',counter:'counter',shelf:'bookshelf'}[kind];return{id,kind,x,y,w,h,color,accent,foot:foot||(['fountain','shelf','counter','crate'].includes(kind)?[x-w*.35,y-18,w*.7,18]:null),...(k?{image:'assets/world-kit/exterior-atlas-v1.webp',sourceRect:exteriorRects[k]}:fk?{image:'assets/world-kit/furniture-atlas-v1.webp',sourceRect:furnitureRects[fk]}:{})};};
const exterior=(id,k,x,y,w,h,foot)=>({id,kind:k,x,y,w,h,foot:foot||(['oak','cypress','blossom_tree','fruit_tree','streetlamp','mailbox'].includes(k)?[x-10,y-14,20,14]:['hedge','hedge_corner','flower_cart','fountain'].includes(k)?[x-w*.36,y-15,w*.72,15]:null),image:'assets/world-kit/exterior-atlas-v1.webp',sourceRect:exteriorRects[k]});
// Ground is composed once beneath every scenery/actor layer. The masks are unioned
// before applying art, so crossing paths cannot create rectangular paint seams.
const groundAtlas='assets/world-kit/ground-materials-v1.webp',lawnAtlas='assets/world-kit/quiet-lawn-v1.webp',earthAtlas='assets/world-kit/quiet-earth-v1.webp',groundCache=new Map();
let groundCapture=null;
function groundCanvas(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;}
function lawn(c,H,w,h){if(groundCapture){groundCapture.w=w;groundCapture.h=h;return;}H.rect(c,0,0,w,h,'#77936c');}
function path(c,H,points,width=100){const q=groundCapture?.earth||c;q.save();q.lineJoin='round';q.lineCap='round';H.line(q,points,groundCapture?'#fff':'#e5d1a5',width);q.restore();}
function patio(c,H,x,y,w,h,col='#c6baa2'){
 const q=groundCapture?.stone||c,r=Math.min(w,h)*.24;
 q.save();q.beginPath();q.moveTo(x+r,y+3);q.bezierCurveTo(x+w*.48,y-5,x+w*.7,y+5,x+w-r,y);q.quadraticCurveTo(x+w+3,y,x+w,y+r);q.bezierCurveTo(x+w-5,y+h*.5,x+w+4,y+h*.7,x+w-3,y+h-r);q.quadraticCurveTo(x+w,y+h,x+w-r,y+h-2);q.bezierCurveTo(x+w*.6,y+h+5,x+w*.4,y+h-4,x+r,y+h);q.quadraticCurveTo(x-3,y+h,x,y+h-r);q.bezierCurveTo(x+4,y+h*.6,x-4,y+h*.4,x+1,y+r);q.quadraticCurveTo(x,y,x+r,y+3);q.closePath();q.fillStyle=groundCapture?'#fff':col;q.fill();q.restore();
}
function material(c,image,rect,w,h,size){
 c.save();c.imageSmoothingEnabled=false;
 // Alternating reflection matches boundary pixels without altering provider bytes.
 // Small, quiet original fields avoid the prior giant non-seamless terrain blocks.
 for(let row=0,y=0;y<h;row++,y+=size)for(let col=0,x=0;x<w;col++,x+=size){c.save();c.translate(x+(col%2?size:0),y+(row%2?size:0));c.scale(col%2?-1:1,row%2?-1:1);c.drawImage(image,...rect,0,0,size,size);c.restore();}c.restore();
}
function softenEarthEdge(mask){
 const c=mask.getContext('2d'),w=mask.width,h=mask.height,data=c.getImageData(0,0,w,h).data;
 // Sparse blade-sized notches break the vector-cut turf edge without changing routes.
 c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#000';
 for(let y=3;y<h-3;y+=5)for(let x=3;x<w-3;x+=5){const at=(xx,yy)=>data[(yy*w+xx)*4+3];if(at(x,y)>200&&(at(x-3,y)<20||at(x+3,y)<20||at(x,y-3)<20||at(x,y+3)<20)){const n=(x*17+y*31)%11;if(n<5)continue;c.beginPath();c.ellipse(x+(n%3)-1,y+((n*3)%5)-2,1+n*.07,1.6+n*.08,(n-5)*.2,0,Math.PI*2);c.fill();}}
 c.restore();
}
function nativeExterior(id,d,original){
 const A=UWPixelOutdoors;d.images=[];d.props=d.props.filter(q=>q.id!=='front-pond-bench').map(q=>{let key=q.kind;if(q.id.includes('vegetable')||q.id.startsWith('garden-bed-'))key='planter';if(key==='tree')key='oak';if(!A.sprites[key]){if(q.id.endsWith('-destination'))return{...q,image:undefined,draw(c){const x=Math.round(q.x/2)*2,y=Math.round(q.y/2)*2;c.fillStyle=A.palette[8];c.fillRect(x-22,y-38,44,38);c.fillStyle=A.palette[9];c.fillRect(x-20,y-36,40,34);c.fillStyle=A.palette[17];if(q.id.includes('adventure')){c.beginPath();c.moveTo(x,y-32);c.lineTo(x+15,y-20);c.lineTo(x,y-4);c.lineTo(x-15,y-20);c.closePath();c.fill();}else if(q.id.includes('exit')){c.fillRect(x-12,y-21,26,6);c.fillRect(x-16,y-25,8,14);c.fillRect(x-20,y-21,4,6);}else if(q.id.includes('neighbourhood')){c.fillStyle=A.palette[13];for(const[dx,dy]of[[-7,0],[7,0],[0,-7],[0,7]])c.fillRect(x+dx-5,y-20+dy-5,10,10);c.fillStyle=A.palette[17];c.fillRect(x-4,y-24,8,8);}else if(q.id.includes('park')){c.fillRect(x-12,y-27,24,24);c.fillStyle=A.palette[21];c.fillRect(x-2,y-27,4,24);c.fillRect(x-12,y-17,24,4);}else{c.fillRect(x-12,y-21,24,15);c.fillRect(x-5,y-29,10,8);}}};throw Error('Unmapped native exterior '+q.id+' / '+key);}
 const sprite=A.sprites[key],w=sprite.width*2,h=sprite.height*2;const refreshId=({'v-home':'home','v-cafe':'cafe','v-mall':'mall','v-adventure':'adventure','v-park-gate':'sports','v-neighbourhood-gate':'neighbourhood','house':'home','cafe':'cafe','mall':'mall','adventure':'adventure'}[q.id]);const refresh=refreshId?'assets/refresh/refresh_hub_'+refreshId+'.png':null;if(refresh)d.images.push(refresh);let foot=q.foot;if(['home','cafe','mall'].includes(key))foot=[q.x-w*.43,q.y-h*.64,w*.86,h*.64];if(key==='arch')foot=null;return{...q,w,h,foot,image:undefined,sourceRect:undefined,pixel:key,draw(c){const im=refresh&&R.images[refresh];if(im){const z=Math.min(w/im.width,h/im.height);c.save();c.imageSmoothingEnabled=false;c.drawImage(im,Math.round(q.x-im.width*z/2),Math.round(q.y-im.height*z),Math.round(im.width*z),Math.round(im.height*z));c.restore();return;}if(window.UWRefreshWorld?.draw(c,'outdoor',key,q.x,q.y,w,h))return;c.save();c.scale(2,2);A.draw(c,key,Math.round(q.x/2),Math.round(q.y/2));c.restore();}};});
 d.colliders=d.props.filter(q=>q.pixel==='arch').flatMap(q=>[[q.x-98,q.y-180,32,180],[q.x+66,q.y-180,32,180]]);
 const spec=window.UWExteriorLayout?.[id];for(const door of [...(spec?.doors||[]),...(spec?.exit?[spec.exit]:[])]){const p=d.props.find(q=>['home','cafe','mall','arch','picnic'].includes(q.pixel)&&Math.abs(q.x-door.x)<2&&Math.abs(q.y-door.y)<30);if(p)door.hit={x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h};}
 d.ground=function(c,e,H){let cached=groundCache.get('native:'+id);if(!cached){const w=d.width,h=d.height,overlay=groundCanvas(w,h),earth=groundCanvas(w,h),stone=groundCanvas(w,h);groundCapture={w,h,earth:earth.getContext('2d'),stone:stone.getContext('2d')};try{original(overlay.getContext('2d'),e,H);}finally{groundCapture=null;}
 const ed=earth.getContext('2d').getImageData(0,0,w,h).data,sd=stone.getContext('2d').getImageData(0,0,w,h).data;cached=groundCanvas(w,h);const g=cached.getContext('2d');for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){const at=(y*w+x)*4+3,nx=x/2,ny=y/2;let col=19;if(ed[at]>127)col=((nx*13+ny*7)%127===0)?10:11;if(sd[at]>127){const row=Math.floor(ny/14),xx=(nx+(row%2)*12)%24;col=ny%14===0||xx===0?7:5;}else if(ed[at]<=127&&(nx*17+ny*29)%2053<2)col=20;g.fillStyle=A.palette[col];g.fillRect(x,y,2,2);}groundCache.set('native:'+id,cached);}c.save();c.imageSmoothingEnabled=false;c.drawImage(cached,0,0);c.restore();};R.register(id,d);
}
function registerExterior(id,d){
 const original=d.ground;if(window.UWPixelOutdoors&&id!=='park'){nativeExterior(id,d,original);return;}d.images=[...(d.images||[]).filter(p=>!p.includes('neighbourhood/terrain')),groundAtlas,lawnAtlas,earthAtlas];
 d.ground=function(c,e,H){let cached=groundCache.get(id);if(!cached){const w=d.width,h=d.height,overlay=groundCanvas(w,h),earth=groundCanvas(w,h),stone=groundCanvas(w,h);groundCapture={w,h,earth:earth.getContext('2d'),stone:stone.getContext('2d')};try{original(overlay.getContext('2d'),e,H);}finally{groundCapture=null;}
 softenEarthEdge(earth);const im=R.images[groundAtlas];if(!im)throw Error('Ground material artwork is not loaded');const halfW=im.width/2,halfH=im.height/2,rects={grass:[0,0,halfW,halfH],earth:[halfW,0,halfW,halfH],stone:[0,halfH,halfW,halfH]};
 cached=groundCanvas(w,h);const g=cached.getContext('2d');const turf=R.images[lawnAtlas];if(!turf)throw Error('Lawn material artwork is not loaded');material(g,turf,[0,0,turf.width,turf.height],w,h,256);
 for(const [mask,kind,size]of [[earth,'earth',144],[stone,'stone',144]]){const layer=groundCanvas(w,h),lc=layer.getContext('2d');const surface=kind==='earth'?R.images[earthAtlas]:im;if(!surface)throw Error('Path material artwork is not loaded');material(lc,surface,kind==='earth'?[0,0,surface.width,surface.height]:rects[kind],w,h,kind==='earth'?256:size);lc.globalCompositeOperation='destination-in';lc.drawImage(mask,0,0);lc.globalCompositeOperation='source-over';g.save();g.shadowColor=kind==='earth'?'#43573f70':'#59513f80';g.shadowBlur=5;g.shadowOffsetY=2;g.drawImage(layer,0,0);g.restore();}
 // Sports court markings remain above ground, but below all props and actors.
 g.drawImage(overlay,0,0);groundCache.set(id,cached);}c.drawImage(cached,0,0);
 };R.register(id,d);
}
function flowerbed(c,H,x,y,w,h){H.rect(c,x,y,w,h,'#6a6451','#b9a179',6);for(let yy=y+10;yy<y+h;yy+=24)for(let xx=x+10;xx<x+w;xx+=24){H.rect(c,xx,yy,11,8,((xx+yy)%3)?'#bda1b2':'#e2c68e');H.rect(c,xx+3,yy+5,5,10,'#82a079');}}
function treeCluster(props,id,x,y,n=3){for(let i=0;i<n;i++)props.push(art(id+i,'tree',x+(i%2)*62,y+Math.floor(i/2)*67,94+(i%3)*12,130+(i%2)*10));}
function terrace(props,id,x,y){props.push(art(id+'picnic','picnic',x,y,138,96,[x-50,y-20,100,20]));}

function gateBadge(props,id,key,x,y,h=230){props.push({id:id+'-destination',x,y:y-h+66,w:62,h:62,depth:y+1,image:'assets/controls/icons/'+key+'.png'});}
// Spatial layout v2: inhabitable frontage, commons, cultivated garden and pond-side rest.
const outsideBounds=(w,h)=>(x,y)=>x>=70&&y>=150&&x<=w-70&&y<=h-60;
const neigh=[];
const building=(id,kind,x,y,w,h)=>art(id,kind,x,y,w,h,[x-w*.43,y-h*.64,w*.86,h*.64]);
neigh.push(building('house','home',1110,430,410,420),building('cafe','cafe',310,430,400,420),building('mall','mall',270,1030,370,370));
neigh.push(art('adventure','arch',1300,1050,255,280,[1182,855,38,195]));
// Outdoor furniture is human-scale; seating belongs to a destination, never a through-route.
neigh.push(art('cafe-table-west','picnic',180,610,160,108,[120,590,120,20]),art('cafe-table-east','picnic',450,610,160,108,[390,590,120,20]),exterior('cafe-flower-cart','flower_cart',105,490,98,105));
neigh.push(exterior('home-mailbox','mailbox',1330,455,42,88),exterior('home-bench','bench',1300,565,140,100),exterior('home-entry-lamp','streetlamp',900,470,45,130));
neigh.push(exterior('commons-fountain','fountain',760,680,160,155,[709,650,102,30]),exterior('commons-bench','bench',520,720,140,100),exterior('commons-planter','flower_planter',875,755,75,70));
for(const [i,x,y]of [[0,1100,670],[1,1360,670],[2,1100,820],[3,1360,820]])neigh.push({id:'garden-bed-'+i,kind:'planter',x,y,w:172,h:81,image:'assets/world-kit/structure-atlas-v1.webp',sourceRect:[639,1021,306,144],foot:[x-78,y-29,156,29]});
neigh.push(exterior('garden-edge-left','hedge',970,835,130,58),exterior('garden-edge-right','hedge',1430,555,130,58));
neigh.push(art('picnic-table','picnic',960,950,185,124,[890,920,140,30]),art('pond','pond',1140,1120,220,143,[1051,1085,178,35]),exterior('pond-bench','bench',970,1120,140,100));
for(const [i,x,y,kind]of [[0,80,320,'oak'],[2,1450,350,'fruit_tree'],[3,85,825,'oak'],[4,540,1090,'blossom_tree']])neigh.push(exterior('town-tree-'+i,kind,x,y,235,300));
for(const [i,x,y]of [[0,70,680],[1,610,960],[2,925,325],[3,1450,735]])neigh.push(exterior('town-border-'+i,'bush',x,y,110,85));
const neighbourhoodLayout={version:2,heroHeight:120,spawn:{x:1110,y:505},rewards:{picnic:{x:960,y:906,depth:952},home:{x:1250,y:430,depth:432},garden:{x:1240,y:755}},doors:[
 {id:'home-exterior',x:1110,y:430,approachOffset:70,rx:82,ry:55,picture:'home',spawn:{x:1110,y:505},hit:{x:905,y:10,w:410,h:420}},
 {id:'cafe',x:310,y:430,approachOffset:70,rx:82,ry:55,picture:'pizza',spawn:{x:310,y:505},hit:{x:110,y:10,w:400,h:420}},
 {id:'mall',x:270,y:1030,approachOffset:45,rx:82,ry:52,picture:'bag',hit:{x:85,y:660,w:370,h:370}},
 {id:'adventure',x:1300,y:1050,approachOffset:25,rx:76,ry:50,picture:'diamond',spawn:{x:1300,y:1080},hit:{x:1172,y:770,w:255,h:280}},
 {id:'garden-stop',x:1240,y:735,approachOffset:0,rx:70,ry:55,picture:'flower',hit:{x:1180,y:675,w:120,h:120}},
 {id:'neighbourhood-picnic',x:960,y:950,approachOffset:60,rx:76,ry:50,picture:'basket',hit:{x:868,y:826,w:185,h:124}},
 {id:'village',x:760,y:305,approachOffset:0,rx:65,ry:35,picture:'home',hit:{x:655,y:70,w:210,h:230}}]};
neigh.push(art('village-gateway','arch',760,300,210,230,[663,140,30,160]));gateBadge(neigh,'village-gateway','home',760,300);gateBadge(neigh,'adventure','diamond',1300,1050,280);
window.UWExteriorLayout={neighbourhood:neighbourhoodLayout};
registerExterior('neighbourhood',{width:1536,height:1152,props:neigh,colliders:[[1380,855,38,195],[827,140,30,160]],walkable:outsideBounds(1536,1152),npcs:[{id:'cafe-host',x:590,y:620,role:'host',color:'blue',h:94},{id:'garden-friend',x:1470,y:830,role:'gardener',h:94}],ground(c,e,H){
 lawn(c,H,1536,1152);
 // Entry street serves both north doors; smaller walks branch to actual activity zones.
 path(c,H,[[760,305],[760,460],[650,535]],92);path(c,H,[[310,500],[650,535],[1110,500]],115);
 path(c,H,[[650,535],[925,570],[1240,570],[1240,735],[1240,900],[1300,1080]],88);
 path(c,H,[[650,535],[650,840],[550,1075],[270,1075]],88);
 path(c,H,[[650,840],[790,860],[790,1080]],80);
 patio(c,H,100,420,465,240);patio(c,H,920,425,465,155);patio(c,H,440,585,470,195);patio(c,H,95,1000,370,100);path(c,H,[[790,1010],[960,1010]],60);patio(c,H,855,830,195,300);
 }});
// Civic village: three frontage destinations share one legible public square.
const village=[building('v-home','home',280,450,350,360),building('v-cafe','cafe',790,450,350,360),building('v-mall','mall',1290,450,350,360)];
village.push(art('v-neighbourhood-gate','arch',480,860,210,230,[383,700,30,160]),art('v-adventure','arch',1470,860,210,230,[1373,700,30,160]));
village.push(art('v-park-gate','arch',1210,880,180,200,[1127,740,26,140]));gateBadge(village,'v-neighbourhood-gate','flower',480,860);gateBadge(village,'v-park-gate','ball',1210,880,200);gateBadge(village,'v-adventure','diamond',1470,860);
village.push(exterior('v-fountain','fountain',790,750,160,155,[738,722,104,28]),exterior('v-west-bench','bench',650,760,140,100));
// The arrival commons has one fountain focal point and an open northward sightline.
// Removed four decorative seating/vendor pieces; no activity or owned item lived here.
village.push(exterior('v-home-mail','mailbox',425,475,42,88),exterior('v-home-bench','bench',160,625,140,100));
for(const [i,x,y]of [[0,75,340],[1,560,285],[2,1050,285],[3,1580,325],[4,110,850]])village.push(exterior('v-mature-tree'+i,i%2?'blossom_tree':'oak',x,y,230,295));
for(const [i,x,y]of [[0,160,690],[1,1140,655],[2,1290,685]])village.push(exterior('v-planter'+i,'flower_planter',x,y,70,66));
window.UWExteriorLayout.village={w:1672,h:941,spawn:{x:810,y:850},doors:[
{id:'neighbourhood',x:480,y:875,approachOffset:0,rx:70,ry:35,picture:'flower',hit:{x:375,y:630,w:210,h:230}},
{id:'home-exterior',x:280,y:450,approachOffset:65,rx:85,ry:50,picture:'home',hit:{x:105,y:90,w:350,h:360}},
{id:'cafe',x:790,y:450,approachOffset:65,rx:85,ry:50,picture:'pizza',spawn:{x:790,y:530},hit:{x:615,y:90,w:350,h:360}},
{id:'mall',x:1290,y:450,approachOffset:65,rx:85,ry:50,picture:'bag',hit:{x:1115,y:90,w:350,h:360}},
{id:'adventure',x:1470,y:860,approachOffset:20,rx:70,ry:35,picture:'diamond',spawn:{x:1470,y:890},hit:{x:1365,y:630,w:210,h:230}},
{id:'park',x:1210,y:885,approachOffset:0,rx:65,ry:30,picture:'ball',hit:{x:1120,y:680,w:180,h:200}}]};
registerExterior('village',{width:1672,height:941,props:village,colliders:[[547,700,30,160],[1537,700,30,160],[1277,740,26,140]],walkable:(x,y)=>x>=65&&x<=1605&&y>=455&&y<=905,npcs:[{id:'v-greeter',x:1035,y:585,role:'host',h:94,color:'blue'},{id:'v-reader',x:235,y:625,role:'reader',h:94}],ground(c,e,H){
 lawn(c,H,1672,941);path(c,H,[[280,515],[790,515],[1290,515]],112);path(c,H,[[480,515],[480,875]],100);path(c,H,[[1110,515],[1110,870],[1470,880]],100);path(c,H,[[480,850],[810,850],[1110,870]],96);
 patio(c,H,105,440,350,220);patio(c,H,590,440,435,225);patio(c,H,1115,440,350,140);patio(c,H,580,650,470,170);
}});
// Compact private garden: front court, cultivated west pocket and pond-side east seating.
const front=[building('front-house','home',600,420,420,420),exterior('front-mail','mailbox',850,445,42,88),exterior('front-entry-bench','bench',760,570,140,100),exterior('front-entry-lamp','streetlamp',365,465,45,130),
 art('front-pond','pond',960,770,220,143,[871,735,178,35]),art('front-picnic','picnic',950,575,175,118,[885,550,130,25]),exterior('front-pond-bench','bench',755,760,140,100),
 {id:'front-vegetable-a',x:185,y:540,w:172,h:81,image:'assets/world-kit/structure-atlas-v1.webp',sourceRect:[639,1021,306,144],foot:[107,511,156,29]},
 {id:'front-vegetable-b',x:185,y:710,w:172,h:81,image:'assets/world-kit/structure-atlas-v1.webp',sourceRect:[639,1021,306,144],foot:[107,681,156,29]},
 exterior('front-garden-cart','flower_cart',345,745,98,105),exterior('front-orchard','fruit_tree',170,300,230,295),exterior('front-shade','blossom_tree',1090,390,230,295)];
front.push(art('front-exit-gate','arch',600,840,185,200,[514,700,27,140]));gateBadge(front,'front-exit-gate','back',600,840,200);
window.UWExteriorLayout['home-exterior']={w:1200,h:900,spawn:{x:610,y:620},exit:{x:600,y:840,rx:65,ry:30,picture:'back',hit:{x:507,y:640,w:185,h:200}},doors:[{id:'home-main',x:600,y:420,approachOffset:65,rx:85,ry:50,picture:'home',hit:{x:390,y:-10,w:420,h:430}}]};
registerExterior('home-exterior',{width:1200,height:900,props:front,colliders:[[659,700,27,140]],walkable:(x,y)=>x>=70&&x<=1130&&y>=440&&y<=855,npcs:[{id:'front-reader',x:1100,y:790,role:'reader',color:'blue',h:94}],ground(c,e,H){
 lawn(c,H,1200,900);path(c,H,[[600,840],[600,485]],100);patio(c,H,365,420,520,180);path(c,H,[[600,660],[320,660],[320,555],[185,595]],70);path(c,H,[[600,660],[800,660],[950,640]],75);patio(c,H,870,485,190,175);path(c,H,[[800,660],[755,800]],55);
}});
// Sports keeps every native court/station coordinate and fitted action sprite.
const sport=[];
// Safety run-off belongs to the courts; amenities occupy connected off-court bays.
for(const [id,x,y]of [['riding-seat',900,760],['court-seat-west',100,1450],['court-seat-east',1445,1450],['court-rest',925,1880],['volley-seat',150,2560]])sport.push(exterior(id,'bench',x,y,105,78));
sport.push(art('park-picnic-table','picnic',1040,890,125,84,[993,872,94,18]));
sport.push({id:'riding-helmet-stand',kind:'rack',x:1320,y:830,w:105,h:75,image:'assets/world-kit/shops-atlas-v1.webp',sourceRect:[34,723,293,160],foot:[1278,812,84,18]});
for(const [i,x,y]of [[0,630,150],[1,1360,900],[2,710,1110],[3,835,1980],[4,145,2860]])sport.push(exterior('park-lamp'+i,'streetlamp',x,y,30,95));
for(const [i,x,y]of [[0,85,410],[1,1450,440],[2,85,1160],[3,1450,1180],[4,85,1690],[5,1450,1730],[6,130,2230],[7,1430,2240],[8,90,2900],[9,1450,2950]])sport.push(exterior('park-tree'+i,i%2?'blossom_tree':'oak',x,y,150,195));
for(const [i,x,y]of [[0,330,420],[1,440,570]])sport.push(exterior('riding-infield-shrub'+i,'bush',x,y,90,65));
for(const [i,x,y]of [[0,140,1140],[1,290,1140],[2,440,1140],[3,1000,1140],[4,1150,1140],[5,1300,1140],[6,380,2250],[7,540,2250],[8,1000,2250],[9,1160,2250]])sport.push(exterior('court-landscape-edge'+i,'hedge',x,y,125,56));
for(const [i,x,y]of [[0,225,150],[1,400,150],[2,575,150]])sport.push(exterior('riding-north-edge'+i,'hedge',x,y,135,58));
window.UWExteriorLayout.park={picnic:{id:'picnic',x:1040,y:940,approachOffset:45,rx:70,ry:40,picture:'basket',hit:{x:977,y:806,w:125,h:84}},zones:{riding:{entry:[600,800]},skating:{entry:[1040,800]},basketball:{entry:[359,1770]},tennis:{entry:[1180,1790]},volleyball:{entry:[488,2800]}}};
registerExterior('park',{width:1536,height:3072,images:['./assets/neighbourhood/terrain.png'],props:sport,walkable:(x,y)=>x>=65&&x<=1470&&y>=20&&y<=3030,colliders:[[346,1257,26,24],[995,1464,325,12],[758,2378,20,365]],npcs:[{id:'park-coach',x:865,y:1100,role:'host',h:76,color:'blue'},{id:'park-spectator',x:785,y:1840,role:'reader',h:76},{id:'park-player',x:1370,y:2460,role:'player',h:78,color:'blue'},{id:'park-picnic-friend',x:1190,y:1000,role:'reader',h:76},{id:'park-court-visitor',x:680,y:1740,role:'player',h:76,color:'blue'},{id:'park-tennis-visitor',x:1410,y:1800,role:'reader',h:76},{id:'park-volley-visitor',x:210,y:2810,role:'player',h:76}],ground(c,e,H){lawn(c,H,1536,3072);path(c,H,[[990,35],[800,200],[768,1030],[768,1980],[768,3000]],105);path(c,H,[[180,195],[600,195],[600,740],[180,740],[180,195]],75);patio(c,H,1020,210,290,550,'#9eaaa0');for(let y=240;y<730;y+=110)H.line(c,[[1040,y],[1290,y]],'#c7cebc',3);path(c,H,[[600,740],[600,820],[768,850],[1040,800],[1040,740]],70);patio(c,H,950,810,225,220);path(c,H,[[768,970],[1040,970]],65);path(c,H,[[768,1770],[359,1770],[359,1700]],75);path(c,H,[[768,1810],[1180,1810],[1180,1700]],75);patio(c,H,855,1820,140,110);path(c,H,[[768,1880],[925,1910]],55);path(c,H,[[768,2820],[488,2820],[488,2730]],75);const polygon=(pts,fill,stroke)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=5;c.stroke();};polygon([[174,1249],[586,1249],[623,1708],[114,1708]],'#be997c','#efe1bd');H.line(c,[[150,1480],[608,1480]],'#efdfbc',3);H.ellipse(c,359,1480,73,61,null,'#efdfbc');H.rect(c,283,1264,152,150,null,'#efdfbc',3);H.ellipse(c,359,1414,76,50,null,'#efdfbc');H.line(c,[[196,1260],[196,1325],[240,1390],[478,1390],[532,1325],[532,1260]],'#efdfbc',3);polygon([[994,1266],[1280,1266],[1382,1714],[965,1714]],'#83a99c','#e8e3be');H.line(c,[[976,1469],[1330,1469]],'#e8e3be',3);H.line(c,[[1138,1266],[1174,1714]],'#e8e3be',3);H.line(c,[[1018,1277],[1000,1698],[1340,1698],[1260,1277],[1018,1277]],'#e8e3be',2);H.line(c,[[1008,1370],[1280,1370]],'#e8e3be',2);H.line(c,[[1000,1585],[1315,1585]],'#e8e3be',2);polygon([[282,2372],[1252,2372],[1298,2737],[240,2737]],'#dbcaa0','#f5e6c0');for(let yy=2390;yy<2720;yy+=23)for(let xx=300;xx<1240;xx+=35)H.rect(c,xx+(yy%7),yy,3,2,'#cbbc91');H.line(c,[[768,2372],[768,2737]],'#f9edcd',4);H.line(c,[[540,2377],[525,2732]],'#f9edcd',3);H.line(c,[[990,2377],[1005,2732]],'#f9edcd',3);path(c,H,[[768,2030],[1365,2030],[1365,2820],[768,2820]],75);}});
})();
