/* Illustrated wardrobe and controls. Canonical unicorn pixels remain unchanged. */
(function(root){'use strict';
const C=root.UWCatalog,M=root.UWArtSprites,images={},pending={},ink='#694574';
const scriptURL=document.currentScript.src,assetRoot=new URL('../assets/',scriptURL),siteRoot=new URL('../../',scriptURL);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function path(c,fn,fill,stroke=ink,w=2){c.beginPath();fn(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function ellipse(c,x,y,rx,ry,fill,stroke=ink,w=2){path(c,()=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2),fill,stroke,w);}
function rect(c,x,y,w,h,r,fill,stroke=ink,lw=2){path(c,()=>c.roundRect(x,y,w,h,r),fill,stroke,lw);}
function line(c,pts,col=ink,w=2){path(c,()=>pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p)),null,col,w);}
function star(c,x,y,r,col='#f5d67d'){path(c,()=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,n=i%2?r*.43:r;c[i?'lineTo':'moveTo'](x+Math.cos(a)*n,y+Math.sin(a)*n);}c.closePath();},col,null);}
const poses={
 u_idle0:{bounds:[33,44,159,185],head:[114,70],body:[98,137],eyes:[130,108],neck:[130,128],fit:[72,118,64,45]},
 u_idle1:{bounds:[40,43,152,185],head:[114,68],body:[98,137],eyes:[128,105],neck:[127,126],fit:[73,116,61,46]},
 u_run0:{bounds:[30,54,161,185],head:[129,82],body:[105,137],eyes:[137,111],neck:[135,130],fit:[79,119,67,44]},
 u_run1:{bounds:[26,50,165,186],head:[128,76],body:[102,140],eyes:[139,110],neck:[137,132],fit:[77,120,70,46]},
 u_run2:{bounds:[22,53,170,185],head:[136,76],body:[103,137],eyes:[148,108],neck:[145,129],fit:[73,118,80,47]},
 u_run3:{bounds:[20,56,172,186],head:[132,78],body:[108,139],eyes:[145,110],neck:[143,129],fit:[74,120,79,47]},
 u_run4:{bounds:[25,51,167,185],head:[128,73],body:[100,138],eyes:[142,107],neck:[139,129],fit:[75,118,73,46]},
 u_run5:{bounds:[19,53,173,186],head:[132,76],body:[105,139],eyes:[150,108],neck:[145,129],fit:[71,118,84,47]},
 u_happy0:{bounds:[31,41,160,185],head:[110,70],body:[111,139],eyes:[120,108],neck:[116,126],fit:[85,113,69,52]},
 u_happy1:{bounds:[37,32,155,185],head:[102,61],body:[107,134],eyes:[111,97],neck:[110,120],fit:[64,100,87,61]},
 u_happy2:{bounds:[35,44,158,184],head:[103,75],body:[105,136],eyes:[112,111],neck:[108,131],fit:[84,116,70,47]}
};
for(const id of ['bike','skateboard'])for(let i=0;i<4;i++){
 const source=M.rides[id][id+i],[sx,sy,sw,sh]=source.rect,[cx,cy,cw]=source.cell,f=192/cw;
 poses[id+i]={bounds:[(sx-cx)*f,(sy-cy)*f,(sx-cx+sw)*f,(sy-cy+sh)*f],source,unit:f,
  head:id==='bike'?[110,64]:[114,76],body:id==='bike'?[86,131]:[98,143],eyes:id==='bike'?[122,94]:[128,113],neck:id==='bike'?[117,112]:[130,129],
  fit:id==='bike'?[67,111,61,39]:[72,123,68,43]};
}
function bitmap(key,url){if(images[key])return Promise.resolve(images[key]);if(pending[key])return pending[key];return pending[key]=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[key]=im;resolve(im);};im.onerror=()=>{delete pending[key];reject(Error('Missing illustrated sprite '+key));};im.src=url;});}
function sourceURL(file){return new URL(file,assetRoot).href;}
// Fitted production records use full-stage registration, never generic body boxes.
let fitted=null,fittedPromise=null;
const phases=['rear','body','body_foreground','accessory','head','head_foreground'];
async function loadFitted(){if(!fittedPromise)fittedPromise=(async()=>{
 const folder=new URL('wardrobe/production/',assetRoot);
 // Classic script data keeps the existing cross-origin legacy iframe launches working without CORS changes.
 if(!root.UWFittedData)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('runtime.js',folder).href;script.onload=resolve;script.onerror=()=>reject(Error('Missing fitted wardrobe manifest'));document.head.append(script);});
 const {manifest,index}=root.UWFittedData;
 const frames=Object.fromEntries(manifest.original_bases.map(b=>[b.frame_id,b])),records={};
 for(const r of manifest.records){if(!C.byId[r.item_id]||C.byId[r.item_id].slot!==r.slot||!frames[r.frame_id])throw Error('Invalid fitted wardrobe record');
  (records[r.item_id]||={})[r.frame_id]=r;
  for(const layer of Object.values(r.layers))if(!phases.includes(layer.phase)||!index.assets[layer.asset_id])throw Error('Invalid fitted layer');
 }
 await Promise.all([
  ...[...new Set(Object.values(index.assets).map(a=>a.atlas))].map(file=>bitmap('fitted:'+file,new URL(file,folder).href)),
  ...manifest.original_bases.map(b=>bitmap('fitted:'+b.base_file,new URL(b.base_file,folder).href))
 ]);
 fitted={manifest,index,frames,records};return fitted;
})().catch(e=>{fittedPromise=null;throw e;});return fittedPromise;}
function fittedPiece(c,layer){
 const a=fitted.index.assets[layer.asset_id],im=images['fitted:'+a.atlas];
 c.drawImage(im,...a.rect,...a.trim_offset,...a.trim_size);
}
function fittedLayers(c,outfit,frame,stage){
 for(const phase of phases){if((phase==='rear')!==(stage==='back'))continue;
  // Slot order is significant for far branches as well as near pieces.
  for(const slot of ['body','accessory','head']){
   const record=fitted.records[outfit?.[slot]]?.[frame];if(!record||record.slot!==slot)continue;
   for(const name of record.local_order){const layer=record.layers[name];if(layer?.phase===phase)fittedPiece(c,layer);}
  }
 }
}
function clothes(c,outfit,h=150,flip=false,frame='u_idle0',atlas=false,stage='front'){
 if(!fitted)return;
 const base=fitted.frames[frame];if(!base)throw Error('Missing fitted pose '+frame);
 const [left,top,right,bottom]=base.source_pose_anchors_logical.bounds;
 const factor=atlas?h/192:h/(bottom-top),pivot=atlas?base.pivot_stage:[base.logical_to_stage.origin[0]+left+right,base.logical_to_stage.origin[1]+bottom*2];
 c.save();if(flip)c.scale(-1,1);c.scale(factor/2,factor/2);c.translate(-pivot[0],-pivot[1]);
 fittedLayers(c,outfit,frame,stage);c.restore();
}
function sprite(c,im,x,y,w,h,flip=false){if(!im)return;c.save();c.translate(x,y);if(flip)c.scale(-1,1);const s=Math.min(w/im.width,h/im.height);c.drawImage(im,-im.width*s/2,-im.height*s,im.width*s,im.height*s);c.restore();}
function vehicle(c,id,x,y,h=150,flip=false){sprite(c,images['item:'+id],x,y,h*1.1,h*.8,flip);}
function unicorn(c,x,y,h=150,outfit={},frame='u_idle0',flip=false,ride=null){
 if(!fitted)return;
 // Callers choose riding frames from their four-frame clock. No six-frame modulo fallback.
 if(ride&&M.rides[ride])frame=frame.startsWith(ride)?frame:ride+'0';
 const base=fitted.frames[frame];if(!base)throw Error('Missing fitted pose '+frame);
 const [l,t,r,b]=base.source_pose_anchors_logical.bounds,fullHeight=h+(frame.startsWith('bike')?42:frame.startsWith('skateboard')?22:0),scale=fullHeight/(2*(b-t));
 c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.scale(scale,scale);c.translate(-base.pivot_stage[0],-base.pivot_stage[1]);
 fittedLayers(c,outfit,frame,'back');c.drawImage(images['fitted:'+base.base_file],0,0);fittedLayers(c,outfit,frame,'front');c.restore();
}
function imagePiece(item){return item?sourceURL(M.items[item.id].file):'';}
const iconAliases={head:'sunhat',body:'tee',accessory:'scarf',wheel:'bike'};
function iconURL(key){if(iconAliases[key])return imagePiece(C.byId[iconAliases[key]]);const entry=M.icons[key];if(!entry)throw Error('Missing picture control '+key);return sourceURL(entry.file);}
function icon(key){return '<img class="picture-sprite" src="'+iconURL(key)+'" alt="" aria-hidden="true" draggable="false">';}
function picture(c,key,x,y,w,h,flip=false){sprite(c,images['icon:'+key]||images['prop:'+key]||images['item:'+key],x,y,w,h,flip);}
let wardrobePromise=null;
async function loadWardrobe(){if(!wardrobePromise){
 wardrobePromise=Promise.all([
  loadFitted(),
  ...Object.entries(M.items).map(([id,e])=>bitmap('item:'+id,sourceURL(e.file))),
  ...Object.entries(M.icons).map(([id,e])=>bitmap('icon:'+id,sourceURL(e.file))),
  ...Object.entries(M.props).map(([id,e])=>bitmap('prop:'+id,sourceURL(e.file))),
  bitmap('bowling-background',sourceURL(M.bowlingBackground)),
  ...M.frames.map(k=>bitmap(k,new URL('game/build/assets/'+k+'.webp',siteRoot).href))
 ]).catch(e=>{wardrobePromise=null;throw e;});
 }await wardrobePromise;return images;}
async function load(base='..'){
 const keys=['u_idle0','u_idle1','u_happy0','u_happy1','u_happy2',...Array.from({length:6},(_,i)=>'u_run'+i),'baby_pink_0','baby_blue_0','h_idle0','h_happy','w_0_0','m_0_0','pizza','cupcake','ice_vanilla','pancake_syrup','smoothie_strawberry','coffee_black','burger','soup_carrot','chicken_roast','room_plant','room_door','room_window','fruit_strawberry','cookie','donut'];
 await Promise.all([loadWardrobe(),...keys.map(k=>bitmap(k,new URL('game/build/assets/'+k+'.webp',new URL(base,location.href).href.replace(/\/?$/,'/')).href))]);return images;
}
root.UWArt={images,poses,load,loadWardrobe,loadFitted,get fitted(){return fitted;},clothes,unicorn,vehicle,imagePiece,icon,iconURL,picture,star,ellipse,rect,line,sprite,clamp};
})(window);
