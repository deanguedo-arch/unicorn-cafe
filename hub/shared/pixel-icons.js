/* Original native picture cues; no labels or legacy bitmap references. */
(function(root){'use strict';const {Pixels,palette,glyphs}=root.UWPixelArtCore,sprites={};function add(id,f){const p=new Pixels(20,20);f(p);sprites[id]=p.finish(id);}
add('home',p=>{p.poly([[1,9],[10,1],[19,9]],0).poly([[3,9],[10,3],[17,9]],3).frame(4,9,12,10,0,5).frame(8,12,5,7,8,10).frame(5,11,3,4,21,23);});
add('cafe',p=>{p.poly([[2,4],[18,4],[10,19]],0).poly([[4,6],[16,6],[10,16]],16).line(3,4,17,4,9).ellipse(8,8,2,2,12).ellipse(12,10,2,2,12).dot(9,13,18);});
add('flowers',p=>{p.line(10,7,10,16,18).ellipse(6,12,4,2,19);for(const[x,y]of[[7,5],[13,5],[10,2],[10,8]])p.ellipse(x,y,3,3,13);p.ellipse(10,5,2,2,17).frame(4,16,12,4,8,10);});
add('picnic',p=>{p.frame(1,5,18,6,0,10).line(3,6,16,6,11).frame(1,13,18,3,0,9).line(4,11,2,19,8).line(15,11,17,19,8);});
add('star',p=>{p.poly([[10,0],[13,6],[19,7],[15,12],[16,19],[10,15],[4,19],[5,12],[0,7],[7,6]],15).poly([[10,3],[12,8],[16,9],[12,12],[13,16],[10,13],[6,16],[7,11],[3,9],[8,8]],17);});
add('parcel',p=>{p.frame(2,6,16,13,0,10).frame(1,4,18,5,0,11).rect(8,5,4,13,13).poly([[9,4],[4,1],[2,2],[4,5],[9,6]],12).poly([[11,4],[16,1],[18,2],[16,5],[11,6]],13);});
add('bag',p=>{p.frame(6,1,8,6,0,16).rect(8,3,4,3,5).frame(2,6,16,13,0,16).line(4,7,15,7,17).line(4,16,15,16,15);});
add('diamond',p=>{p.poly([[4,2],[16,2],[20,8],[10,19],[0,8]],0).poly([[5,4],[15,4],[17,8],[10,16],[3,8]],22).line(3,8,17,8,23).line(10,4,7,8,23).line(7,8,10,16,21);});
add('games',p=>{p.ellipse(10,10,9,9,0).ellipse(10,10,7,7,5).line(5,5,15,15,21).line(5,15,15,5,21).line(10,3,10,17,21);});
const aliases={pizza:'cafe',flower:'flowers',basket:'picnic',ball:'games',room_door:'diamond',door:'home',back:'home'};function draw(c,id,x,y){const s=sprites[aliases[id]||id];if(!s)return false;c.save();c.scale(2,2);x=Math.round(x/2);y=Math.round(y/2);for(let j=0;j<20;j++)for(let i=0;i<20;i++){const v=glyphs.indexOf(s.rows[j][i]);if(v>=0){c.fillStyle=palette[v];c.fillRect(x-10+i,y-20+j,1,1);}}c.restore();return true;}root.UWPixelIcons={sprites,draw};})(typeof window==='undefined'?globalThis:window);
