/* Presentation-only mapping. Persisted normalized decoration values and IDs stay unchanged. */
(function(root){'use strict';
const clamp=n=>Math.max(0,Math.min(1,n));
function zone(){return root.UWHomeAreas?.layout?.['home-upstairs']?.decorZone||{x:0,y:0,w:1536,h:1024};}
function toWorld(p){const z=zone();return{x:z.x+p.x*z.w,y:z.y+p.y*z.h};}
function toNormalized(p){const z=zone();return{x:(p.x-z.x)/z.w,y:(p.y-z.y)/z.h};}
function metadata(id){return root.UWHomeDesignV1?.catalogue.find(m=>m.id===id)||null;}
function size(id){const m=metadata(id);if(m)return m.nativeSize[0]*m.worldScale;if(root.UWPixelBedroom?.productionEnabled&&root.UWPixelEnvironment?.sprites[id])return root.UWPixelEnvironment.sprites[id].width*2;return({rug:260,'cushion-pink':90,'cushion-blue':90,teddy:100,train:140,plant:110,'picnic-basket':105,'star-lamp':105,'rainbow-beanbag':145})[id]||120;}
function contains(id,q,p){const a=toWorld(q),w=size(id),m=metadata(id);if(m){const h=m.hit;return p.x>=a.x+h.x&&p.x<=a.x+h.x+h.w&&p.y>=a.y+h.y&&p.y<=a.y+h.y+h.h;}return Math.abs(p.x-a.x)<w/2&&p.y<=a.y+12&&p.y>=a.y-(root.UWPixelBedroom?.productionEnabled&&root.UWPixelEnvironment?.sprites[id]?root.UWPixelEnvironment.sprites[id].height*2:w*2/3);}
function walkable(p){return root.UWWorldRenderer?.walkable('home-upstairs',p.x,p.y)===true;}
function clearLine(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));for(let i=0;i<=n;i++)if(!walkable({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
function route(start,goal){
 if(!walkable(start)||!walkable(goal))return[];if(clearLine(start,goal))return[{...goal}];
 const step=24,queue=[{...start,key:'0,0'}],seen=new Set(['0,0']),parents=new Map();let end=null;
 for(let i=0;i<queue.length;i++){const a=queue[i];if(Math.hypot(a.x-goal.x,a.y-goal.y)<step*1.5&&clearLine(a,goal)){end=a;break;}
 for(const[dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const q={x:a.x+dx,y:a.y+dy},key=Math.round((q.x-start.x)/step)+','+Math.round((q.y-start.y)/step);if(seen.has(key)||!clearLine(a,q))continue;seen.add(key);q.key=key;parents.set(key,a);queue.push(q);}}
 if(!end)return[];const points=[{...goal}];for(let p=end;p&&p.key!=='0,0';p=parents.get(p.key))points.unshift({x:p.x,y:p.y});const smooth=[];let a=start;for(let i=0;i<points.length;){let j=i;while(j+1<points.length&&clearLine(a,points[j+1]))j++;smooth.push(points[j]);a=points[j];i=j+1;}return smooth;
}
function foot(id,q){const m=metadata(id);if(!m)return null;const a=toWorld(q);return{x:a.x+m.foot[0],y:a.y+m.foot[1],w:m.foot[2],h:m.foot[3]};}
root.UWRoomCoordinates={metadata,foot,walkable,clearLine,route,zone,toWorld,toNormalized,size,contains,clamp:p=>({x:clamp(p.x),y:clamp(p.y)})};
})(typeof window==='undefined'?globalThis:window);
