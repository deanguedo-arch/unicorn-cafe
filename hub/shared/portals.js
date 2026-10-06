/* Picture-guided walking areas. Small floor cues, generous approach areas and a single nearby highlight. */
(function(root){'use strict';
const images={},assetRoot=new URL('../assets/',document.currentScript.src);
async function load(){await Promise.all(['floor-footprints','floor-exit-arrow'].map(key=>new Promise((resolve,reject)=>{
 const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(Error('Navigation art: '+key));im.src=new URL('navigation/'+key+'.png',assetRoot).href;
})));}
function approach(door){return {x:door.x,y:door.y+(door.approachOffset??55),rx:door.rx||150,ry:door.ry||78};}
function distance(zone,p){return ((p.x-zone.x)/zone.rx)**2+((p.y-zone.y)/zone.ry)**2;}
function contains(zone,p){return !!zone&&distance(zone,p)<=1;}
function hit(door,p){const z=door.exit?door:approach(door),r=door.hit;
 return contains(z,p)||(door.exit&&door.builtInDoor&&p.x>=z.x-260&&p.x<=z.x+80&&p.y>=z.y-215&&p.y<=z.y+30)||(r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)||(!door.exit&&Math.abs(p.x-door.x)<110&&p.y>door.y-160&&p.y<door.y+40);
}
function glow(c,z){c.save();const g=c.createRadialGradient(z.x,z.y,12,z.x,z.y,z.rx);g.addColorStop(0,'#fff4bf48');g.addColorStop(1,'#fff4bf00');c.fillStyle=g;c.beginPath();c.ellipse(z.x,z.y,z.rx,z.ry,0,0,Math.PI*2);c.fill();c.strokeStyle='#fff0caa0';c.lineWidth=3;c.stroke();c.restore();}
function cue(c,key,z,w,h){const im=images[key];if(!im)return;c.save();c.translate(z.x,z.y);if(z.flipArrow)c.scale(-1,1);c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
function entrance(c,door,focus=false){const z=approach(door);if(focus)glow(c,z);cue(c,'floor-footprints',z,125,62);}
function exit(c,z,focus=false){if(focus)glow(c,z);cue(c,'floor-exit-arrow',z,z.cueWidth||165,z.cueHeight||62);}
// Arriving/reloading on an exit never leaves immediately. Leave the marked area to arm
// it again. Pauses reset dwell, and each crossing can request only one return.
function latch(){let armed=false,initialized=false,pending=false,dwell=0;
 return {reset(p,z){armed=!contains(z,p);initialized=true;pending=false;dwell=0;},
  step(p,z,dt,settled=true){if(!initialized)this.reset(p,z);if(!contains(z,p)){armed=true;pending=false;dwell=0;return false;}if(!armed||pending)return false;if(!settled){dwell=0;return false;}dwell+=dt;if(dwell<.36)return false;pending=true;return true;},
  snapshot(){return {armed,pending,dwell};}};
}
root.UWPortals={load,approach,distance,contains,hit,entrance,exit,latch,images};
})(window);
