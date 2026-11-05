/* Original indexed-pixel retail fixtures. Native pixel = two world units.
 * Pixels are authored here, never sampled from historical production art.
 * Surfaces/feet/openings use native top-left coordinates; IDs are visual only. */
(function(root){'use strict';
const core=typeof module!=='undefined'?require('./pixel-art-core.js'):root.UWPixelArtCore;
const {Pixels,palette,glyphs}=core,sprites={};
function add(id,w,h,meta,f){const p=new Pixels(w,h);f(p);sprites[id]=Object.assign(p.finish(id),meta);}
function board(p,x,y,w,h){p.frame(x,y,w,h,0,9).rect(x+1,y+1,w-2,2,11).line(x+2,y+h-2,x+w-3,y+h-2,8);}
function drawer(p,x,y,w,h){p.frame(x,y,w,h,8,10).line(x+2,y+1,x+w-3,y+1,11).rect(x+Math.floor(w/2)-2,y+Math.floor(h/2),4,2,15).line(x+Math.floor(w/2)-1,y+Math.floor(h/2),x+Math.floor(w/2)+1,y+Math.floor(h/2),17);}
function post(p,x,y,h){p.frame(x,y,8,h,0,9).rect(x+1,y+1,3,h-2,10).line(x+2,y+2,x+2,y+h-4,11);}
function hanger(p,x,y){p.line(x,y,x+2,y-2,15).line(x+2,y-2,x+4,y,15).line(x+4,y,x+2,y+3,15).line(x+2,y+3,x-8,y+9,10).line(x-8,y+9,x+12,y+9,11).line(x+12,y+9,x+2,y+3,10);}
function storefront(kind){add('storefront-'+kind,160,128,{foot:null,collisionRects:[[3,110,9,18],[78,110,79,18]],opening:[12,40,66,84],surface:[94,53,48,48]},p=>{
 // Solid wall, corner returns and deep canopy establish top/front volume.
 p.poly([[5,10],[12,3],[150,3],[158,11],[158,122],[151,128],[5,128],[0,121],[0,17]],0);
 p.rect(5,17,148,107,4).rect(7,19,144,102,5).rect(8,20,3,98,14).rect(149,19,4,103,3);
 p.poly([[3,15],[12,5],[148,5],[156,15]],11).line(13,6,147,6,6).line(5,14,153,14,10);
 p.frame(2,16,156,16,0,12).rect(4,17,152,4,14).rect(4,21,152,7,13).rect(4,28,152,3,12);
 for(let x=5;x<154;x+=16){p.rect(x,20,7,8,3).rect(x,20,7,2,4);}p.line(4,31,155,31,1);
 // Clear walk-through aperture. No painted door or fake handle.
 p.frame(8,35,74,91,15,16).rect(12,39,66,85,-1).rect(12,39,66,3,1).rect(12,42,3,79,2);
 p.rect(9,36,72,3,17).rect(9,39,3,85,16).rect(79,39,3,85,15);
 p.poly([[12,119],[77,119],[81,125],[8,125]],7).line(11,120,77,120,6).rect(8,125,74,2,8);
 // Deep display window, sill top and knee-height panel below it.
 p.frame(88,35,61,70,0,16).frame(92,39,53,62,15,21).rect(94,41,49,58,22).rect(95,42,47,2,23);
 p.poly([[96,44],[108,44],[96,57]],23).poly([[131,44],[141,44],[141,49],[123,67],[119,67]],23);
 p.rect(94,94,49,6,21).line(94,94,142,94,23).rect(91,101,56,5,8);
 p.poly([[89,100],[147,100],[151,105],[85,105]],11).rect(85,106,66,5,9).line(86,106,149,106,10);
 p.frame(89,112,58,11,8,10).line(91,113,144,113,11).line(91,121,144,121,9);
 // Destination emblems, not catalogue merchandise or labels.
 if(kind==='clothes'){p.poly([[109,61],[116,58],[121,61],[128,58],[135,64],[131,71],[126,69],[126,86],[111,86],[111,69],[106,71],[102,64]],0);p.poly([[110,63],[116,60],[121,64],[128,60],[132,65],[129,68],[124,66],[124,84],[113,84],[113,66],[108,68],[105,65]],19).line(115,62,120,66,20).line(114,83,123,83,18);}
 else{for(const x of[105,132])p.ellipse(x,80,9,9,0).ellipse(x,80,7,7,23).ellipse(x,80,5,5,22).dot(x,80,15);p.line(105,80,115,64,18).line(115,64,124,80,19).line(124,80,105,80,19).line(115,64,128,64,20).line(128,64,132,80,19).line(128,64,127,58,0).line(127,58,133,58,0).line(113,62,119,62,8).line(124,80,128,84,8);}
 });}
storefront('clothes');storefront('wheels');
add('retail-island',240,64,{foot:[8,42,224,22],surface:[9,4,222,29]},p=>{
 // Broad clean top reserved for live products, short front and feet.
 p.poly([[10,1],[230,1],[239,32],[239,42],[0,42],[0,32]],0).poly([[11,3],[229,3],[236,31],[3,31]],11);
 p.line(12,4,228,4,6).line(4,30,235,30,10);for(let x=25;x<228;x+=48)p.line(x,7,x+3,27,10);
 p.rect(2,32,235,7,9).line(3,32,235,32,11).line(3,38,235,38,8);
 p.frame(7,40,226,19,0,9);for(const x of[12,84,156]){p.frame(x,43,68,12,8,10).line(x+2,44,x+65,44,11).line(x+3,53,x+64,53,9);}
 for(const x of[10,222])p.frame(x,59,8,5,0,9).rect(x+1,59,3,3,10);
});
add('wallrack',80,96,{foot:[3,79,74,17],surface:[10,22,60,53]},p=>{
 p.frame(4,4,72,86,0,9).rect(7,8,66,67,8).rect(8,9,64,65,7).rect(10,10,60,63,5);
 p.poly([[3,5],[8,0],[72,0],[77,5]],0).poly([[6,4],[10,1],[70,1],[74,4]],11).line(11,2,69,2,6);post(p,2,6,86);post(p,70,6,86);
 p.frame(8,17,64,4,8,15).line(10,17,69,17,17);for(const x of[20,38,56])hanger(p,x,22);
 // Empty lower shoe/display shelf; live owned stock stays separate.
 p.poly([[10,72],[69,72],[75,81],[5,81]],11).rect(5,82,70,7,9).line(6,82,73,82,10);
 p.frame(8,89,64,4,0,8).rect(4,91,7,5,0).rect(69,91,7,5,0);
});
add('workbench',96,88,{foot:[5,65,86,23],surface:[6,40,84,16]},p=>{
 p.frame(8,0,80,43,0,9).rect(10,2,76,39,10).line(12,3,84,3,11);
 for(let y=8;y<39;y+=6)for(let x=14;x<84;x+=7)p.dot(x,y,8);
 // Hand tools have individual silhouettes, not decorative color blocks.
 for(const[x,h]of[[20,18],[35,23]]){p.frame(x,10,4,h,0,21).rect(x+1,11,1,h-2,23).frame(x-2,6,8,7,0,7).rect(x,5,4,4,10);}
 p.line(50,10,50,30,8).frame(47,7,10,5,0,7).rect(48,8,8,2,23).frame(48,27,5,9,0,12);
 p.ellipse(72,22,13,13,0).ellipse(72,22,10,10,7).ellipse(72,22,8,8,9);for(const [dx,dy]of[[10,0],[0,10],[7,7],[-7,7]])p.line(72-dx,22-dy,72+dx,22+dy,11);p.ellipse(72,22,2,2,15);
 p.poly([[6,41],[90,41],[96,55],[96,61],[0,61],[0,55]],0).poly([[7,43],[89,43],[93,54],[3,54]],11).line(8,44,88,44,6).rect(2,56,92,4,9).line(3,56,92,56,10);
 post(p,6,61,27);post(p,82,61,27);p.frame(59,61,28,22,0,9);drawer(p,61,63,24,8);drawer(p,61,73,24,8);
 p.rect(15,77,43,4,8).line(16,77,57,77,10);p.frame(28,65,12,11,0,21).rect(30,66,8,2,23);p.frame(43,69,9,7,0,12);
});
add('bike-stand',64,32,{foot:[2,19,60,13],surface:[9,5,46,18]},p=>{
 p.poly([[5,22],[58,22],[63,28],[61,31],[2,31],[0,28]],0).rect(3,27,58,3,21).line(5,25,58,25,23);
 for(const x of[12,27,42]){p.line(x,26,x,9,0).line(x,9,x+3,4,0).line(x+3,4,x+8,4,0).line(x+8,4,x+11,9,0).line(x+11,9,x+11,26,0);p.line(x+1,25,x+1,10,22).line(x+1,10,x+4,6,22).line(x+4,6,x+7,6,23).line(x+10,10,x+10,25,21);}
});
add('photo-booth',96,128,{foot:[4,105,88,23],opening:[40,31,45,82]},p=>{
 p.poly([[4,14],[15,3],[80,3],[92,14],[94,122],[88,128],[4,128],[0,121],[0,18]],0).rect(4,19,87,104,7).rect(6,21,82,99,5);
 p.poly([[4,15],[16,5],[79,5],[90,15]],11).line(17,6,78,6,6).frame(3,16,89,13,0,12).rect(5,17,85,3,14).rect(5,20,85,6,13);
 p.frame(36,30,52,89,8,1).rect(39,33,46,79,2).rect(40,34,43,3,3);
 // Opened pleated curtain leaves seat and back wall legible.
 p.rect(40,35,12,72,12);for(let x=41;x<52;x+=4)p.rect(x,36,2,69,13);p.line(40,105,51,105,1).rect(79,35,5,72,12).line(79,36,79,105,14);
 p.rect(62,94,4,17,8).ellipse(64,110,13,4,0).ellipse(64,108,10,3,9).ellipse(64,89,15,5,0).ellipse(64,87,14,4,12).ellipse(63,86,11,3,14);
 p.poly([[39,112],[85,112],[90,120],[34,120]],11).rect(34,121,56,4,9).line(36,121,87,121,10);
 // Camera lens, preview recess, button and print slot all part of body.
 p.ellipse(20,42,8,8,8).ellipse(20,41,6,6,0).ellipse(20,41,4,4,21).dot(18,39,23);
 p.frame(9,57,22,22,8,21).rect(11,59,18,16,22).line(12,60,26,60,23).rect(12,73,16,2,21);
 p.ellipse(20,89,5,5,0).ellipse(20,88,4,4,15).dot(19,86,17);p.frame(10,102,20,5,8,0).rect(14,104,12,10,7).rect(15,105,10,7,6).rect(17,107,6,3,22);
});
add('puzzle-table',96,64,{foot:[7,44,82,20],surface:[7,5,82,30]},p=>{
 p.poly([[8,1],[88,1],[95,34],[95,41],[0,41],[0,34]],0).poly([[9,3],[87,3],[92,33],[3,33]],11).line(10,4,86,4,6).rect(2,35,91,5,9).line(3,35,91,35,10);
 // Bounded felt top accepts actual puzzle image as a separate renderer layer.
 p.poly([[13,8],[83,8],[87,29],[9,29]],8).poly([[14,9],[82,9],[85,27],[11,27]],19).line(14,10,81,10,20);
 post(p,7,41,23);post(p,81,41,23);p.rect(15,54,66,4,8).line(16,54,79,54,10);
});
add('bowling-lane',96,192,{foot:[0,0,96,192],surface:[13,11,70,167],foulLine:[13,176,70,3]},p=>{
 p.frame(0,0,96,192,0,8).rect(3,3,90,187,9).rect(10,5,76,181,8).rect(13,7,70,176,11);
 for(let x=13;x<83;x+=10){p.line(x,7,x,182,10);for(let y=19+(x%3)*13;y<173;y+=37)p.line(x+1,y,Math.min(x+9,82),y,10);}
 p.rect(4,7,7,177,1).line(5,8,5,182,2).rect(85,7,7,177,1).line(86,8,86,182,2);p.rect(13,7,70,6,9).line(14,8,81,8,10);
 for(const[x,y]of[[29,31],[41,31],[53,31],[65,31],[35,42],[47,42],[59,42],[41,53],[53,53],[47,64]]){p.ellipse(x,y,3,5,0).ellipse(x,y-1,2,4,6).rect(x-1,y-1,3,1,12);}
 for(const x of[30,39,48,57,66])p.poly([[x,134],[x-2,138],[x+2,138]],8);
 p.rect(13,176,70,3,0).line(14,179,81,179,6).rect(3,186,90,4,10).line(4,186,91,186,11);
});
const api={palette,glyphs,sprites,draw(c,id,x,y){const s=sprites[id];if(!s)throw Error('Unknown retail sprite '+id);const ox=Math.round(x)-s.anchor[0],oy=Math.round(y)-s.anchor[1];for(let j=0;j<s.height;j++)for(let i=0;i<s.width;i++){const v=glyphs.indexOf(s.rows[j][i]);if(v>=0){c.fillStyle=palette[v];c.fillRect(ox+i,oy+j,1,1);}}}};
root.UWPixelRetail=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
