/* Original picture-object catalogue. Stable collection IDs are unchanged. */
(function(root){'use strict';const {Pixels,palette,glyphs}=root.UWPixelArtCore,sprites={},urls={};function add(id,f){const p=new Pixels(24,24);f(p);sprites[id]=p.finish(id);}
add('apple',p=>{p.ellipse(8,14,6,8,12).ellipse(16,14,6,8,12).ellipse(8,12,4,5,13).line(11,6,13,1,8).ellipse(16,3,4,2,19).dot(6,9,5);});
add('banana',p=>p.poly([[2,4],[5,3],[7,12],[12,17],[18,17],[22,13],[21,19],[16,23],[8,22],[3,15]],15).poly([[4,6],[6,13],[12,19],[18,19],[21,16],[19,21],[10,21],[5,17]],17).rect(2,2,3,4,8));
add('ball',p=>{p.ellipse(12,12,11,11,0).ellipse(12,12,9,9,5).line(5,5,19,19,21).line(5,19,19,5,21).line(12,3,12,21,21);});
add('book',p=>p.frame(3,2,18,21,0,3).rect(5,4,14,15,4).rect(5,20,15,2,5).line(5,4,5,18,2).frame(9,7,7,7,15,17));
add('bread',p=>{p.ellipse(12,12,11,9,8).ellipse(12,10,10,8,10).ellipse(11,8,8,5,11);for(const x of[6,11,16])p.line(x,5,x-2,10,5);});
add('burger',p=>{p.frame(2,15,20,6,8,10).rect(3,13,18,4,8).rect(2,11,20,3,19).rect(4,10,16,3,13).ellipse(12,9,11,6,8).ellipse(12,7,10,5,11).dot(7,5,5).dot(13,4,5).dot(17,6,5);});
add('cake',p=>p.poly([[3,5],[20,9],[20,21],[3,21]],0).poly([[5,7],[18,10],[18,19],[5,19]],11).rect(5,12,13,3,13).poly([[3,5],[15,2],[22,8],[20,10]],5).ellipse(15,4,3,3,12));
add('candy',p=>p.poly([[1,5],[7,9],[16,9],[23,5],[23,20],[17,16],[7,16],[1,20]],0).poly([[2,7],[7,10],[7,15],[2,18]],14).poly([[17,10],[22,7],[22,18],[17,15]],14).ellipse(12,12,7,7,12).ellipse(11,11,5,5,13).line(9,7,14,15,5));
add('carrots',p=>{p.poly([[4,7],[15,10],[7,23]],8).poly([[5,9],[13,11],[7,20]],10).line(7,13,11,14,11).line(7,4,8,9,18).line(4,3,8,8,19).line(12,3,8,8,20);p.poly([[13,9],[22,13],[17,23]],15).poly([[15,11],[20,14],[17,20]],16).line(18,6,17,11,19);});
for(const[id,col]of[['cereal',16],['chips',10],['milk',22]])add(id,p=>{p.frame(4,3,16,20,0,5).poly([[4,3],[8,0],[17,0],[20,3]],col).rect(6,6,12,14,col).frame(8,10,8,7,7,5).ellipse(12,14,3,2,col);});
add('cherries',p=>{p.line(8,14,15,2,18).line(18,14,15,2,18).ellipse(7,17,6,6,12).ellipse(17,17,5,6,12).ellipse(6,15,3,3,13).dot(16,14,14);});
add('cookie',p=>{p.ellipse(12,12,11,11,8).ellipse(11,11,10,10,11);for(const[x,y]of[[7,7],[16,7],[11,13],[6,16],[17,16]])p.ellipse(x,y,2,2,8);});
add('cupcake',p=>{p.poly([[4,12],[20,12],[18,23],[6,23]],0).poly([[6,14],[18,14],[16,21],[8,21]],13);p.ellipse(12,11,10,5,5).ellipse(12,7,7,5,6).ellipse(12,3,3,3,13).dot(10,7,16).dot(16,11,22);});
add('donut',p=>{p.ellipse(12,13,11,10,8).ellipse(12,11,10,9,13).ellipse(12,11,4,4,8).ellipse(12,10,3,3,0);for(const[x,y]of[[6,6],[15,5],[18,13],[8,18]])p.line(x,y,x+2,y,17);});
add('flowers',p=>{for(const[x,y,col]of[[6,7,13],[16,5,3],[12,11,16]]){p.line(x,y,12,22,18).ellipse(x,y,5,5,col).ellipse(x,y,2,2,17);}p.rect(9,18,6,3,14);});
add('grapes',p=>{for(const[x,y]of[[7,8],[15,8],[5,14],[12,14],[18,14],[9,20],[15,20]])p.ellipse(x,y,4,4,2).ellipse(x-1,y-1,2,2,3);p.line(12,1,11,6,8).ellipse(16,3,5,2,19);});
add('icecream',p=>{p.poly([[5,10],[19,10],[12,23]],8).poly([[7,12],[17,12],[12,21]],11).ellipse(12,8,9,8,12).ellipse(11,6,8,6,14).dot(8,3,5);});
add('lamp',p=>{p.rect(11,8,3,12,8).ellipse(12,21,7,2,0).ellipse(12,20,5,2,10).poly([[6,1],[18,1],[22,12],[2,12]],0).poly([[7,3],[17,3],[19,10],[5,10]],17);});
add('milkshake',p=>{p.poly([[5,6],[19,6],[17,22],[7,22]],0).poly([[7,8],[17,8],[15,20],[9,20]],13).ellipse(12,6,8,4,5).rect(15,0,2,9,22).ellipse(10,4,4,3,6);});
add('picture',p=>{p.frame(1,1,22,22,0,15).frame(3,3,18,18,17,23).poly([[4,18],[9,10],[14,17],[19,11],[19,20],[4,20]],19).ellipse(15,7,3,3,17);});
add('pillow',p=>p.poly([[4,2],[20,2],[23,6],[23,19],[20,22],[4,22],[1,19],[1,6]],0).frame(3,4,18,16,12,13).line(5,5,18,5,14).ellipse(12,12,3,2,12));
add('pizza',p=>p.poly([[2,3],[22,3],[12,23]],8).poly([[4,6],[20,6],[12,20]],17).line(3,3,21,3,10).ellipse(8,9,2,2,12).ellipse(15,9,2,2,12).ellipse(12,15,2,2,12));
add('puzzle',p=>{p.frame(1,2,22,20,0,5).rect(3,4,9,7,13).rect(13,4,8,7,22).rect(3,12,9,8,19).rect(13,12,8,8,16).rect(10,6,4,3,13).rect(5,10,3,4,19).rect(17,10,3,4,22);});
add('robot',p=>{p.frame(5,3,14,10,0,22).rect(11,0,2,3,8).dot(12,0,13).frame(6,14,12,7,0,7).rect(2,14,3,7,21).rect(19,14,3,7,21).rect(7,21,3,3,0).rect(14,21,3,3,0).rect(8,6,2,3,0).rect(14,6,2,3,0).rect(9,17,6,2,13);});
add('teapot',p=>{p.ellipse(11,14,9,8,0).ellipse(10,13,8,7,5).frame(5,4,12,4,0,22).ellipse(11,3,3,2,21).frame(18,9,6,9,21,22).rect(19,11,3,5,0).poly([[3,11],[0,5],[0,14],[4,17]],22).ellipse(11,13,3,3,13);});
add('teddy',p=>{for(const x of[5,19])p.ellipse(x,4,4,4,8).ellipse(x,4,2,2,11);p.ellipse(12,9,9,8,8).ellipse(11,8,8,7,11).ellipse(12,19,7,5,10).ellipse(5,21,4,3,8).ellipse(19,21,4,3,8).dot(8,7,0).dot(16,7,0).ellipse(12,11,2,2,8).line(8,15,16,15,13);});
add('toyunicorn',p=>{p.ellipse(12,13,8,6,0).ellipse(12,12,7,5,6).ellipse(18,7,5,6,0).ellipse(17,7,4,5,6).poly([[16,2],[18,0],[19,4]],17).rect(6,16,3,7,5).rect(15,16,3,7,5).rect(2,9,5,5,13).rect(1,13,4,5,22).rect(13,3,3,8,13).dot(19,6,0);});
add('star_happy',p=>{p.poly([[12,0],[16,7],[24,9],[18,15],[20,24],[12,19],[4,24],[6,15],[0,9],[8,7]],15).poly([[12,3],[15,9],[20,10],[16,14],[17,20],[12,17],[7,20],[8,14],[4,10],[9,9]],17).dot(9,12,0).dot(15,12,0).line(10,15,14,15,8);});
sprites.star=sprites.star_happy;
add('door',p=>{p.frame(3,0,18,24,0,8).frame(5,2,14,22,10,1).rect(7,4,10,18,2).rect(8,5,8,3,3).dot(15,14,17).rect(2,22,20,2,11);});
/* Collectibles use a dedicated accent ramp; environment and actor palettes stay unchanged.
   Same indexed silhouettes, dimensions, anchors and collision targets. */
const lootPalette=palette.slice();Object.assign(lootPalette,{2:'#7255AF',3:'#AA7CDF',4:'#E3CBF6',10:'#DB9547',11:'#FFD28A',12:'#C63D69',13:'#F76A9D',14:'#FFB8D3',15:'#AA6E22',16:'#F4B737',17:'#FFE87E',18:'#397146',19:'#66BB6A',20:'#B8E883',21:'#376BA4',22:'#68C7EA',23:'#D8F4FC'});
const surfaces=new Map();
function surface(id){if(surfaces.has(id))return surfaces.get(id);const s=sprites[id];if(!s)throw Error('Missing new collection picture '+id);const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(24,24):document.createElement('canvas');cv.width=cv.height=24;const cc=cv.getContext('2d');for(let yy=0;yy<24;yy++)for(let xx=0;xx<24;xx++){const v=glyphs.indexOf(s.rows[yy][xx]);if(v>=0){cc.fillStyle=lootPalette[v];cc.fillRect(xx,yy,1,1);}}surfaces.set(id,cv);return cv;}
function draw(c,id,x,y,size=48,alpha=1){const k=size<35?1:2;c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;c.drawImage(surface(id),Math.round(x/k)*k-12*k,Math.round(y/k)*k-24*k,24*k,24*k);c.restore();}

function url(id){if(!sprites[id])return null;if(!urls[id]){const cv=document.createElement('canvas');cv.width=24;cv.height=24;draw(cv.getContext('2d'),id,12,24,24);urls[id]=cv.toDataURL();}return urls[id];}
root.UnicornPixelLoot={sprites,draw,url,palette:lootPalette};})(typeof window==='undefined'?globalThis:window);
