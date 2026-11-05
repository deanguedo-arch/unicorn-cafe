/* Pixel presentation contract. Deliberately not enabled for legacy illustrated assets.
   Coordinates are projected, never written back into profile storage. */
(function(root){'use strict';
const WORLD_PER_PIXEL=2;
function viewport(width,height,{desiredWidth=512,desiredHeight=320,dpr=1}={}){
 const w=Math.max(1,Math.floor(width)),h=Math.max(1,Math.floor(height));
 const scale=Math.max(1,Math.floor(Math.min(w/desiredWidth,h/desiredHeight)));
 const logicalWidth=Math.floor(w/scale),logicalHeight=Math.floor(h/scale);
 return{logicalWidth,logicalHeight,scale,left:Math.floor((w-logicalWidth*scale)/2),top:Math.floor((h-logicalHeight*scale)/2),deviceScale:scale*Math.max(1,Math.round(dpr))};
}
function camera(player,view,bounds){const w=view.logicalWidth*WORLD_PER_PIXEL,h=view.logicalHeight*WORLD_PER_PIXEL;const snap=n=>Math.floor(n/WORLD_PER_PIXEL)*WORLD_PER_PIXEL;return{x:snap(w>=bounds.w?bounds.x-(w-bounds.w)/2:Math.max(bounds.x,Math.min(bounds.x+bounds.w-w,player.x-w/2))),y:snap(h>=bounds.h?bounds.y-(h-bounds.h)/2:Math.max(bounds.y,Math.min(bounds.y+bounds.h-h,player.y-h/2)))};}
function toScreen(p,cam,view){return{x:view.left+Math.round((p.x-cam.x)/WORLD_PER_PIXEL)*view.scale,y:view.top+Math.round((p.y-cam.y)/WORLD_PER_PIXEL)*view.scale};}
function toWorld(p,cam,view){return{x:cam.x+(p.x-view.left)/view.scale*WORLD_PER_PIXEL,y:cam.y+(p.y-view.top)/view.scale*WORLD_PER_PIXEL};}
function validateSprite(s,image){if(!s||!s.id||!Array.isArray(s.sourceRect)||s.sourceRect.length!==4)throw Error('Missing pixel sprite metadata');const[x,y,w,h]=s.sourceRect,scale=s.sourceScale||1;if(![x,y,w,h,s.width,s.height,scale].every(Number.isInteger)||x<0||y<0||w<1||h<1||s.width<1||s.height<1||scale<1)throw Error('Non-integer pixel sprite geometry: '+s.id);if(w!==s.width*scale||h!==s.height*scale)throw Error('Unverified native-grid ratio: '+s.id);if(image&&(x+w>image.width||y+h>image.height))throw Error('Pixel source out of bounds: '+s.id);return true;}
function sprite(c,image,s,x,y,{flip=false}={}){validateSprite(s,image);c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);c.drawImage(image,...s.sourceRect,-Math.floor(s.width/2),-s.height,s.width,s.height);c.restore();}
function ordered(layers){return layers.map((q,i)=>({...q,_order:i})).sort((a,b)=>(a.depth??a.y)-(b.depth??b.y)||a._order-b._order);}
function present(c,logical,view){c.save();c.imageSmoothingEnabled=false;c.drawImage(logical,0,0,logical.width,logical.height,view.left,view.top,logical.width*view.scale,logical.height*view.scale);c.restore();}
const api={WORLD_PER_PIXEL,viewport,camera,toScreen,toWorld,validateSprite,sprite,ordered,present};root.UWPixelPresentation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
