/* Review-copy adapter: native source coordinates and independent wardrobe slots. */
(()=>{'use strict';
 const D=UWFullSportsFitData,root=new URL(document.currentScript.dataset.assetsRoot||'./assets/',document.currentScript.src),images={},skateRasters=new Map(),records={},frames=Object.fromEntries(D.frames.map(f=>[f.id,f]));let ready=false,pending;
 for(const r of D.records)(records[r.item_id]||={})[r.frame_id]=r;
 async function load(){if(ready)return;if(!pending)pending=(async()=>{await Promise.all([...Object.values(D.assets).map(a=>a.file),...D.frames.map(f=>f.base_file)].map(async file=>{const im=new Image();im.src=new URL(file,root);await im.decode();images[file]=im;}));
  ready=true;})().catch(e=>{pending=null;throw e;});return pending;}
 function selection(id,outfit){return D.slot_order.map(slot=>{const r=records[outfit?.[slot]]?.[id];return r?.slot===slot?r:null;}).filter(Boolean);}
 function layers(c,id,outfit,back){const selected=selection(id,outfit);for(const phase of D.phases){if((phase==='rear')!==back)continue;for(const r of selected)for(const key of r.local_order){const l=r.layers[key];if(l?.phase!==phase)continue;const a=D.assets[l.asset_id];c.drawImage(images[a.file],...a.trim_offset);}}}
 function actor(c,f,im,x,y,facing,scale,outfit){if(!ready||!frames[f.id]||!selection(f.id,outfit).length)return false;const [l,t,r,b]=f.source_rect_xyxy,[px,py]=f.ground_pivot_source;c.save();c.translate(x,y);c.scale(facing*scale*f.scale_to_logical,scale*f.scale_to_logical);c.translate(l-px,t-py);layers(c,f.id,outfit,true);c.drawImage(im,l,t,r-l,b-t,0,0,r-l,b-t);layers(c,f.id,outfit,false);c.restore();return true;}
 function frameAt(ms){let t=((ms%D.skate_cycle.total_ms)+D.skate_cycle.total_ms)%D.skate_cycle.total_ms;for(let i=0;i<4;i++){if(t<D.skate_cycle.durations_ms[i])return frames[D.skate_cycle.frame_ids[i]];t-=D.skate_cycle.durations_ms[i];}return frames.skate_land;}
 function skateRaster(f,outfit,pixelScaleX,pixelScaleY,c){
  const key=JSON.stringify([f.id,pixelScaleX,pixelScaleY,c.imageSmoothingEnabled,c.imageSmoothingQuality,...D.slot_order.map(slot=>outfit[slot]||null)]);if(skateRasters.has(key))return skateRasters.get(key);
  const [px,py]=f.pivot_local,left=Math.floor(-px*pixelScaleX),top=Math.floor(-py*pixelScaleY),right=Math.ceil((f.canvas[0]-px)*pixelScaleX),bottom=Math.ceil((f.canvas[1]-py)*pixelScaleY),cv=document.createElement('canvas');cv.width=right-left;cv.height=bottom-top;
  const r=cv.getContext('2d',{willReadFrequently:true});r.imageSmoothingEnabled=c.imageSmoothingEnabled;r.imageSmoothingQuality=c.imageSmoothingQuality;r.translate(-left,-top);r.scale(pixelScaleX,pixelScaleY);r.translate(-px,-py);layers(r,f.id,outfit,true);r.drawImage(images[f.base_file],0,0);layers(r,f.id,outfit,false);
  const result={canvas:cv,left,top};skateRasters.set(key,result);if(skateRasters.size>32)skateRasters.delete(skateRasters.keys().next().value);return result;
 }
 function drawHop(c,ms,x,y,facing,profile,scale=.4){if(!ready||profile?.vehicle!=='skateboard'||!profile.owned?.includes('skateboard'))return false;const f=frameAt(ms),[px,py]=f.pivot_local,outfit=UWCatalog.cleanOutfit(profile.outfit,profile.owned),sourceScale=scale*f.scale_to_logical;
  c.save();c.translate(x,y);const m=c.getTransform(),axisAligned=m.b===0&&m.c===0&&m.a>0&&m.d>0,pixelScaleX=sourceScale*m.a,pixelScaleY=sourceScale*m.d;
  if(axisAligned&&pixelScaleX>0&&pixelScaleY>0&&pixelScaleX<1&&pixelScaleY<1){
   // Filter one complete right-facing actor, then reflect its pixels at 1:1.
   // Device-pixel bounds retain the pivot and caller viewport/DPR scale.
   const raster=skateRaster(f,outfit,pixelScaleX,pixelScaleY,c);c.setTransform(facing,0,0,1,m.e,m.f);c.drawImage(raster.canvas,raster.left,raster.top);
  }else{c.scale(facing*sourceScale,sourceScale);c.translate(-px,-py);layers(c,f.id,outfit,true);c.drawImage(images[f.base_file],0,0);layers(c,f.id,outfit,false);}
  c.restore();return f.id;
 }
 UWArt.fullSportsFits={load,actor,layers,selection,frameAt,drawHop,frames,images,manifest:D,get ready(){return ready;}};
})();
