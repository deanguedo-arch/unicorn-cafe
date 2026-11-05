/* Shared modular scenery. Visual scene definitions do not own progress or economy. */
(function(root){'use strict';
const areas={},images={},pending=new Set();
const rect=(c,x,y,w,h,fill,stroke,lw=2)=>{if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h);}};
const ellipse=(c,x,y,rx,ry,fill,stroke)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
const line=(c,pts,color,width=3)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
function image(c,path,s,x,y,w,h){const im=images[path];if(!im)return false;c.save();c.imageSmoothingEnabled=false;if(s)c.drawImage(im,...s,x-w/2,y-h,w,h);else c.drawImage(im,x-w/2,y-h,w,h);c.restore();return true;}
function prop(c,p,env={}){if(p.draw){p.draw(c,env,H);return;}const {x,y}=p,w=p.w||100,h=p.h||90,col=p.color||'#b97770',a=p.accent||'#e9d9ac',ink='#514453';if(p.image){const im=images[p.image],sw=p.sourceRect?.[2]||im?.width,sh=p.sourceRect?.[3]||im?.height,fit=p.stretch?1:Math.min(w/sw,h/sh),dw=p.stretch?w:sw*fit,dh=p.stretch?h:sh*fit;if(image(c,p.image,p.sourceRect,x,y,dw,dh))return;}c.save();ellipse(c,x,y-2,w*.43,h*.09,'#30453a22');const X=x-w/2,Y=y-h;
switch(p.kind){
case'tree':rect(c,x-w*.08,y-h*.52,w*.16,h*.5,'#806346');rect(c,X+w*.18,Y,w*.64,h*.55,col);rect(c,X,Y+h*.2,w,h*.45,col);rect(c,X+w*.13,Y+h*.08,w*.58,h*.12,a);break;
case'bush':case'planter':case'flower':if(p.kind!=='bush'){rect(c,X,y-h*.3,w,h*.3,'#ad785c',ink);rect(c,X-4,y-h*.34,w+8,9,'#d8a774');}for(let i=0;i<5;i++){const px=X+w*(.13+i*.18),py=Y+h*.22+(i%2)*h*.13;rect(c,px-7,py,14,h*.48,'#658760');if(p.kind!=='bush'){rect(c,px-12,py-8,24,17,col);rect(c,px-5,py-4,10,9,a);}}break;
case'bench':case'sofa':case'chair':rect(c,X,Y,w,h*.45,col,ink);rect(c,X-5,Y+h*.4,w+10,h*.34,a,ink);rect(c,X+6,y-h*.27,9,h*.27,ink);rect(c,X+w-15,y-h*.27,9,h*.27,ink);if(p.kind==='sofa'){rect(c,X-9,Y+h*.25,16,h*.5,col);rect(c,X+w-7,Y+h*.25,16,h*.5,col);}break;
case'table':case'counter':rect(c,X+8,Y+h*.38,w-16,h*.62,col,ink);rect(c,X,Y,w,h*.55,a,ink);rect(c,X+8,Y+7,w-16,h*.18,'#ffffff22');if(p.kind==='counter'){rect(c,X+w*.1,y-h*.34,w*.35,h*.24,'#806453');rect(c,X+w*.55,y-h*.34,w*.35,h*.24,'#806453');}break;
case'shelf':case'rack':case'cabinet':rect(c,X,Y,w,h,col,ink);for(let j=0;j<3;j++){rect(c,X+7,Y+8+j*h*.29,w-14,h*.22,'#65545b');for(let i=0;i<4;i++)rect(c,X+11+i*(w-20)/4,Y+14+j*h*.29,(w-26)/5,h*.13,[a,'#85a69b','#ce9b9f','#d8bd77'][(i+j)%4]);rect(c,X+4,Y+h*.25+j*h*.29,w-8,7,a);}break;
case'bed':rect(c,X,Y,w,h,a,ink);rect(c,X+8,Y+10,w-16,h*.25,'#fff3d7',ink);rect(c,X+5,Y+h*.38,w-10,h*.57,col,ink);line(c,[[X+12,Y+h*.55],[X+w-12,Y+h*.55]],a,8);break;
case'lamp':rect(c,x-5,Y+h*.32,10,h*.65,ink);rect(c,X,Y,w,h*.34,a,ink);rect(c,x-w*.25,y-7,w*.5,7,ink);break;
case'crate':rect(c,X,Y,w,h,col,ink);for(let i=1;i<4;i++)line(c,[[X,Y+i*h/4],[X+w,Y+i*h/4]],a,4);line(c,[[X+5,Y+5],[X+w-5,y-5]],a,7);break;
case'fountain':ellipse(c,x,y-h*.2,w*.5,h*.2,'#beb49c',ink);ellipse(c,x,y-h*.24,w*.4,h*.14,'#87bbbd');rect(c,x-9,Y+h*.25,18,h*.55,'#ddd3b6');ellipse(c,x,Y+h*.3,w*.26,h*.12,'#c6c2a7',ink);ellipse(c,x,Y+h*.28,w*.22,h*.07,'#99d7dd');break;
case'arch':rect(c,X,Y,w*.16,h,col,ink);rect(c,X+w*.84,Y,w*.16,h,col,ink);rect(c,X,Y,w,h*.2,a,ink);break;
case'trackBarrier':rect(c,X,Y,w,h,a,ink);for(let i=0;i<w;i+=30)rect(c,X+i,Y,14,h,col);break;
case'sign':rect(c,x-5,Y+h*.4,10,h*.6,'#7e6650');rect(c,X,Y,w,h*.55,a,ink);ellipse(c,x,Y+h*.25,w*.18,h*.14,col);break;
default:rect(c,X,Y,w,h,col,ink);rect(c,X+6,Y+6,w-12,Math.max(4,h*.18),a);
}c.restore();}
function npcPoint(n,time){if(!n.route?.length)return{x:n.x,y:n.y};const pts=[[n.x,n.y],...n.route],t=(time||0)*.09,seg=Math.floor(t)%pts.length,f=t%1,a=pts[seg],b=pts[(seg+1)%pts.length],s=f*f*(3-2*f);return{x:a[0]+(b[0]-a[0])*s,y:a[1]+(b[1]-a[1])*s};}
function npc(c,n,e){const p=npcPoint(n,e.time),h=n.h||92,path=n.image||'../game/build/assets/baby_'+(n.color==='blue'?'blue':'pink')+'_'+(n.route&&!e.reduced?Math.floor((e.time||0)*5)%6:0)+'.webp';ellipse(c,p.x,p.y,25,8,'#40504325');if(root.UWPixelCharacters&&images[path]&&!n.sourceRect)root.UWPixelCharacters.bitmap(c,images[path],p.x,p.y,h*.88,h);else image(c,path,n.sourceRect,p.x,p.y,h*.88,h);/* Residents use their original sprite without geometric role stickers over their face. */}

const H={rect,ellipse,line,prop,npc,image};
function register(id,d){if(areas[id])throw Error('Duplicate world scene '+id);areas[id]=d;for(const p of d.props||[])if(p.image)pending.add(p.image);for(const n of d.npcs||[]){if(n.image)pending.add(n.image);else for(let i=0;i<(n.route?6:1);i++)pending.add('../game/build/assets/baby_'+(n.color==='blue'?'blue':'pink')+'_'+i+'.webp');}for(const im of d.images||[])pending.add(im);}
async function load(){await Promise.all([...pending].map(path=>new Promise((resolve,reject)=>{if(images[path])return resolve();const im=new Image();im.onload=()=>{images[path]=im;resolve();};im.onerror=()=>reject(Error('World asset unavailable '+path));im.src=path;})));}
function layers(id,e={}){const a=areas[id];if(!a)return[];return[...(a.props||[]).map(p=>({id:p.id,y:p.depth??p.y,draw:c=>prop(c,p,e)})),...(a.npcs||[]).map(n=>({id:n.id,y:npcPoint(n,e.time).y,draw:c=>npc(c,n,e)}))];}
function blocked(id,x,y){const a=areas[id];if(!a)return false;const rs=[...(a.colliders||[]),...(a.props||[]).map(p=>p.foot).filter(Boolean)];return rs.some(r=>x>r[0]-16&&x<r[0]+r[2]+16&&y>r[1]-12&&y<r[1]+r[3]+12);}
const api={register,load,has:id=>!!areas[id],background(c,id,e={}){areas[id]?.ground?.(c,e,H);},layers,blocked,walkable(id,x,y){return areas[id]?.walkable?areas[id].walkable(x,y)&&!blocked(id,x,y):null;},areas,helpers:H,images};root.UWWorldRenderer=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
