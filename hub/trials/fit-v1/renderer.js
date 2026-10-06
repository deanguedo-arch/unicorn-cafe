/* Sample-pose adapter. Missing poses deliberately fail rather than stretching a garment. */
(function(root){'use strict';
const base=new URL('./',document.currentScript.src),images=new Map();let manifest;
async function load(){
 if(manifest)return manifest;
 const response=await fetch(new URL('manifest.json',base));if(!response.ok)throw Error('Fit manifest unavailable');
 const data=await response.json();
 await Promise.all(data.records.flatMap(r=>[r.base_file,...Object.values(r.layers).map(l=>l.file)]).map(file=>new Promise((resolve,reject)=>{
  const im=new Image();im.onload=()=>{images.set(file,im);resolve();};im.onerror=()=>reject(Error('Fit image unavailable: '+file));im.src=new URL(file,base);
 })));
 manifest=data;return data;
}
function draw(c,frame,x,y,{scale=1,flip=false,angle=0,outfit={head:'bow',body:'tee',accessory:'beads'}}={}){
 const r=manifest?.records.find(r=>r.frame_id===frame);if(!r)throw Error('No registered fit for '+frame);
 c.save();c.translate(x,y);c.rotate(angle);c.scale(flip?-scale:scale,scale);c.translate(-r.pivot_stage[0],-r.pivot_stage[1]);
 for(const id of r.layer_order){
  if(id==='base'){c.drawImage(images.get(r.base_file),0,0);continue;}
  if(id==='foreground'){if(outfit.body==='tee')c.drawImage(images.get(r.layers[id].file),0,0);continue;}
  if(Object.values(outfit).includes(id))c.drawImage(images.get(r.layers[id].file),0,0);
 }
 c.restore();
}
root.UWFitTrial={load,draw,images,get manifest(){return manifest;}};
})(window);
