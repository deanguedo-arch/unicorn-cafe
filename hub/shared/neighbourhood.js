/* Modular neighbourhood: separate terrain, y-sorted props, collision and a safe additive outing. */
(function(root){'use strict';
const map=root.UWNeighbourhoodMap||(typeof require==='function'?require('./neighbourhood-map.js'):null);
const sourceRects={"tree":[34,31,279,314],"bush":[367,152,213,181],"flowers":[650,179,275,149],"rock":[1026,200,167,137],"fence":[45,462,260,140],"fenceVertical":[410,393,135,211],"gate":[631,388,309,215],"picnic":[971,422,257,172],"parcel":[84,708,171,168],"star":[383,682,170,188],"pond":[636,687,300,195],"bench":[974,694,250,170],"home":[28,906,285,291],"cafe":[343,914,262,293],"mall":[634,911,300,294],"arch":[957,906,279,291]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function walkable(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=96&&y>=160&&x<=map.width-96&&y<=map.height-64&&!map.colliders.some(o=>{const[a,b,w,h]=o.rect;return x>a-14&&x<a+w+14&&y>b-12&&y<b+h+12;});}
let viewport={width:768,height:512};
function setViewport(width,height){viewport={width:Math.max(320,Math.floor(width/2)*2),height:Math.max(240,Math.floor(height/2)*2)};return {...viewport};}
function view(player){const {width,height}=viewport;const axis=(p,size,total,bias)=>Math.floor((size>=total?(total-size)/2:clamp(p-size*bias,0,total-size))/2)*2;return{x:axis(player.x,width,map.width,.5),y:axis(player.y,height,map.height,.64)};}
// Only this outing key is written. No profile, wallet, native game or old hub save migration.
class Outing{
 constructor(storage,id,onError=()=>{}){this.storage=storage;this.key='unicorn-neighbourhood-outing-v1:'+id;this.onError=onError;this.state={version:1,stage:0,keepsake:false};this.read();}
 read(){try{const s=JSON.parse(this.storage.getItem(this.key)||'null');if(s?.version===1&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=5)this.state={...s,keepsake:s.stage===5};}catch(e){this.onError(e);}return this.state;}
 advance(event){this.read();const s=this.state,expected=['home','cafe-payment','garden','picnic','home'][s.stage];if(event!==expected||s.stage>=5)return false;const next={version:1,stage:s.stage+1,keepsake:s.stage===4};try{this.storage.setItem(this.key,JSON.stringify(next));this.state=next;return true;}catch(e){this.onError(e);return false;}}
 get carried(){return this.state.stage===2||this.state.stage===3;}
 get next(){return ['home-exterior','cafe','garden-stop','neighbourhood-picnic','home-exterior',null][this.state.stage];}
}
class World{
 constructor({player,art,announce}){this.player=player;this.art=art;this.announce=announce;this.images={};this.outing=null;this.ready=false;}
 async load(id){this.outing=new Outing(localStorage,id,()=>this.announce('Your outing could not save. Your existing games and coins have not changed.'));const load=(key,file)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{this.images[key]=i;resolve();};i.onerror=()=>reject(Error('Neighbourhood artwork unavailable: '+file));i.src='./assets/neighbourhood/'+file;});if(!root.UWPixelOutdoors)await Promise.all([load('props','props.png'),load('terrain','terrain.png')]);this.ready=true;}
 prop(c,kind,x,y,w,h){if(root.UWPixelIcons&&root.UWPixelIcons.draw(c,kind,x,y))return;const im=this.images.props,index=map.atlas.kinds.indexOf(kind);if(!im||index<0)return;const rect=sourceRects[kind];if(kind==='gate'){const half=rect[2]/2,pw=Math.min(w*.3,h*half/rect[3]),ph=pw*rect[3]/half;c.drawImage(im,rect[0],rect[1],half,rect[3],x-w/2,y-ph,pw,ph);c.drawImage(im,rect[0]+half,rect[1],half,rect[3],x+w/2-pw,y-ph,pw,ph);return;}const scale=Math.min(w/rect[2],h/rect[3]),dw=rect[2]*scale,dh=rect[3]*scale;c.drawImage(im,...rect,x-dw/2,y-dh,dw,dh);}
 destinationAt(x,y){const stage=this.outing?.state.stage,goal=map.doors.find(d=>d.id===this.outing?.next);if(!goal)return null;if(this.edgeCue&&Math.hypot(x-this.edgeCue.x,y-this.edgeCue.y)<=34)return goal;if(y>=viewport.height-60&&y<=viewport.height-12&&Math.abs(x-(42+stage*62))<=28)return goal;return null;}
 draw(c,{time,moving,outfit,riding,focused,target,drawCarry}){
 const cam=view(this.player),{width:vw,height:vh}=viewport;c.save();c.beginPath();c.rect(0,0,vw,vh);c.clip();c.translate(-cam.x,-cam.y);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 const worldEnv={time,player:this.player,moving};const modular=root.UWWorldRenderer?.has('neighbourhood');if(modular)root.UWWorldRenderer.background(c,'neighbourhood',worldEnv);if(!modular){const terrain=this.images.terrain,tw=terrain.width/2,th=terrain.height/2;
 for(let y=Math.max(0,Math.floor(cam.y/32));y<Math.min(map.tiles.length,Math.ceil((cam.y+vh)/32));y++)for(let x=Math.max(0,Math.floor(cam.x/32));x<Math.min(map.tiles[0].length,Math.ceil((cam.x+vw)/32));x++){const tile=map.tiles[y][x];c.save();c.translate(x*32+(x%2?32:0),y*32+(y%2?32:0));c.scale(x%2?-1:1,y%2?-1:1);c.drawImage(terrain,tile%2*tw,Math.floor(tile/2)*th,tw,th,0,0,32,32);c.restore();}
 // Narrow authored edging makes the terrain transitions intentional without changing walkability.
 c.imageSmoothingEnabled=false;
 for(let y=Math.max(0,Math.floor(cam.y/32));y<Math.min(map.tiles.length,Math.ceil((cam.y+vh)/32));y++)for(let x=Math.max(0,Math.floor(cam.x/32));x<Math.min(map.tiles[0].length,Math.ceil((cam.x+vw)/32));x++){
 const t=map.tiles[y][x];if(!t)continue;const px=x*32,py=y*32;c.fillStyle=t===1?'#caa671':t===2?'#825e42':'#797589';
 if(map.tiles[y-1]?.[x]===0)c.fillRect(px,py,32,2);if(map.tiles[y+1]?.[x]===0)c.fillRect(px,py+30,32,2);if(map.tiles[y]?.[x-1]===0)c.fillRect(px,py,2,32);if(map.tiles[y]?.[x+1]===0)c.fillRect(px+30,py,2,32);
 }
 }const next=this.outing?.next;
 for(const d of map.doors){const y=d.y+(d.approachOffset||0);if(d.id===focused||d.id===next){c.strokeStyle=d.id===focused?'#fff1b0':'#eecf85';c.fillStyle='#fff8d92a';c.lineWidth=3;c.beginPath();c.ellipse(d.x,y,28+(d.id===next?Math.sin(time*3)*3:0),12,0,0,Math.PI*2);c.fill();c.stroke();} }
 if(target){c.strokeStyle='#fff0c4';c.lineWidth=3;c.beginPath();c.ellipse(target.x,target.y,12,7,0,0,7);c.stroke();}
 const layers=modular?root.UWWorldRenderer.layers('neighbourhood',worldEnv).map(l=>({y:l.y,draw:()=>l.draw(c)})):map.objects.map(o=>({y:o.y,draw:()=>this.prop(c,o.kind,o.x,o.y,o.w,o.h)}));
 layers.push({y:this.player.y,draw:()=>{const p=this.player,frame=riding?riding+(moving?Math.floor(time*10)%4:0):moving?'u_run'+Math.floor(time*10)%6:'u_idle'+Math.floor(time*2)%2;c.imageSmoothingEnabled=true;this.art.ellipse(c,p.x,p.y,23,8,'#49384c38',null);if(root.UWPixelCharacters)root.UWPixelCharacters.draw(c,this.art,p.x,p.y,128,outfit,frame,p.facing<0,riding);else this.art.unicorn(c,p.x,p.y,map.heroHeight||96,outfit,frame,p.facing<0,riding);drawCarry?.(c);c.imageSmoothingEnabled=false;if(this.outing?.carried)this.prop(c,'parcel',p.x+p.facing*35,p.y+4,30,30);}});
 if(this.outing?.state.stage>=4){const q=map.rewards?.picnic||{x:784,y:916,depth:964};layers.push({y:q.depth,draw:()=>this.prop(c,'parcel',q.x,q.y,48,48)});}
 if(this.outing?.state.keepsake){const q=map.rewards?.home||{x:1264,y:410,depth:418};layers.push({y:q.depth,draw:()=>this.prop(c,'star',q.x,q.y,52,52)});}
 layers.sort((a,b)=>a.y-b.y).forEach(l=>l.draw());const marker=map.doors.find(d=>d.id===(focused||next));if(marker){const mx=marker.x-70,my=marker.y+(marker.approachOffset||0)-12;c.fillStyle='#fff6dfea';c.strokeStyle='#c8a267';c.lineWidth=2;c.beginPath();c.arc(mx,my,25,0,Math.PI*2);c.fill();c.stroke();const key=marker.picture==='room_door'?'door':marker.picture,plain=this.art.images[key];if(root.UWPixelIcons)root.UWPixelIcons.draw(c,key,mx,my+19);else if(plain)this.art.sprite(c,plain,mx,my+19,38,38);else this.art.picture(c,key,mx,my+19,38,38);}if(this.outing?.state.stage>=3){for(let i=0;i<3;i++)this.prop(c,'star',(map.rewards?.garden?.x||1016)-54+i*54,(map.rewards?.garden?.y||674)+Math.sin(time*2+i)*5,18,18);}c.restore();
 // Compact picture sequence, no labels or interruptions. Completed steps are marked visually.
 c.save();const stage=this.outing?.state.stage||0,goal=map.doors.find(d=>d.id===next);this.edgeCue=null;
 if(goal){const gx=goal.x-cam.x,gy=goal.y+(goal.approachOffset||0)-cam.y;if(gx<32||gx>vw-32||gy<70||gy>vh-80){const x=clamp(gx,42,vw-42),y=clamp(gy,80,vh-108),angle=Math.atan2(gy-y,gx-x);this.edgeCue={x,y};c.fillStyle='#fff5d9';c.strokeStyle='#bc8c46';c.lineWidth=3;c.beginPath();c.arc(x,y,29,0,Math.PI*2);c.fill();c.stroke();const kind={'home-exterior':'home',cafe:'cafe','garden-stop':'flowers','neighbourhood-picnic':'picnic'}[next];if(kind)this.prop(c,kind,x,y+21,42,42);c.save();c.translate(x+Math.cos(angle)*38,y+Math.sin(angle)*38);c.rotate(angle);c.fillStyle='#ac7940';c.beginPath();c.moveTo(8,0);c.lineTo(-5,-6);c.lineTo(-5,6);c.closePath();c.fill();c.restore();}}
 c.fillStyle='#fff5e7e8';c.beginPath();c.roundRect(12,vh-60,312,48,16);c.fill();['home','cafe','flowers','picnic',stage===5?'star':'home'].forEach((kind,i)=>{if(i===stage){c.fillStyle='#ffe5a4';c.strokeStyle='#b2803d';c.lineWidth=3;c.beginPath();c.roundRect(17+i*62,vh-57,50,42,10);c.fill();c.stroke();}this.prop(c,kind,42+i*62,vh-18,40,40);if(i<stage){c.fillStyle='#7aa576';c.beginPath();c.arc(59+i*62,vh-26,5,0,7);c.fill();}});c.restore();
 }
}
const api={map,walkable,view,setViewport,getViewport:()=>({...viewport}),Outing,World};if(typeof module!=='undefined')module.exports=api;root.UWNeighbourhood=api;
})(typeof window==='undefined'?globalThis:window);
