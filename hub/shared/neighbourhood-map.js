/* Original modular world. World units, not screenshot coordinates. */
(function(root){'use strict';
const T=32,W=48,H=36,tiles=Array.from({length:H},()=>Array(W).fill(0)),objects=[];
function fill(x,y,w,h,t){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)tiles[j][i]=t;}
function prop(id,kind,x,y,w,h,solid){objects.push({id,kind,x,y,w,h,solid});}
fill(3,14,42,4,1);fill(21,4,4,28,1);fill(7,7,34,3,1);fill(7,24,34,3,1);fill(7,7,3,20,1);fill(38,7,3,20,1);
fill(29,20,7,3,2);fill(29,25,7,3,2);fill(4,4,10,9,3);fill(32,4,10,9,3);
prop('cafe-building','cafe',288,416,288,256,[176,200,224,216]);
prop('home-building','home',1184,416,288,256,[1072,200,224,216]);
prop('mall-building','mall',288,832,256,224,[192,652,192,180]);
prop('adventure-building','arch',1200,864,224,192,[1112,712,48,112]);
prop('picnic-table','picnic',784,960,160,112,[720,898,128,48]);
prop('pond','pond',496,1008,224,160,[402,878,188,114]);
for(let x=64;x<1536;x+=96){if(x!==736)prop('north-'+x,'tree',x,140,96,128,[x-18,100,36,32]);prop('south-'+x,'bush',x,1148,80,64,[x-28,1108,56,32]);}
for(let y=240;y<1088;y+=128){prop('west-'+y,'tree',48,y,96,128,[30,y-32,36,32]);prop('east-'+y,'tree',1490,y,96,128,[1472,y-32,36,32]);}
for(let i=0;i<6;i++){if(i!==2&&i!==3)prop('flowers-a'+i,'flowers',944+i*32+(i>=4?32:0),714,48,48,[930+i*32+(i>=4?32:0),684,24,20]);prop('flowers-b'+i,'flowers',944+i*32,874,48,48,[930+i*32,844,24,20]);}
for(let x=912;x<=1168;x+=64)if(x<950||x>1130)prop('garden-fence-'+x,'fence',x,620,64,64,[x-26,594,52,20]);
prop('garden-gate','gate',1040,620,224,96,null);
for(const [x,y] of [[600,300],[900,290],[560,760],[1320,600]])prop('tree-'+x,'tree',x,y,112,144,[x-20,y-32,40,32]);
prop('legacy-gateway','gate',736,180,224,96,null);
prop('home-bench','bench',976,384,96,64,[936,366,80,18]);
prop('home-planter','flowers',976,340,80,44,[942,320,68,20]);
prop('picnic-rock','rock',896,1040,48,40,[880,1020,32,20]);
const doors=[
{id:'home-exterior',x:1184,y:416,approachOffset:28,rx:72,ry:60,picture:'home',spawn:{x:1184,y:480}},
{id:'cafe',x:288,y:416,approachOffset:28,rx:72,ry:60,picture:'pizza',spawn:{x:288,y:480}},
{id:'mall',x:288,y:832,approachOffset:28,rx:72,ry:60,picture:'bag'},
{id:'adventure',x:1200,y:864,approachOffset:28,rx:72,ry:60,picture:'room_door',spawn:{x:1200,y:928}},
{id:'garden-stop',x:1040,y:660,approachOffset:0,rx:64,ry:52,picture:'flower'},
{id:'neighbourhood-picnic',x:784,y:960,approachOffset:45,rx:72,ry:60,picture:'basket'},
{id:'village',x:736,y:160,approachOffset:16,rx:58,ry:36,picture:'ball'}
];
const targets={'home-exterior':'home-building',cafe:'cafe-building',mall:'mall-building',adventure:'adventure-building','neighbourhood-picnic':'picnic-table'};for(const d of doors){const o=objects.find(o=>o.id===targets[d.id]);if(o)d.hit={x:o.x-o.w/2,y:o.y-o.h,w:o.w,h:o.h};}doors.find(d=>d.id==='garden-stop').hit={x:912,y:640,w:256,h:240};
const colliders=objects.filter(o=>o.solid).map(o=>({id:o.id,rect:o.solid}));colliders.push({id:'adventure-right-pillar',rect:[1240,712,48,112]});
const data={version:1,tileSize:T,width:W*T,height:H*T,viewport:{w:768,h:512},spawn:{x:1184,y:480},tiles,objects,doors,colliders,atlas:{columns:4,rows:4,kinds:['tree','bush','flowers','rock','fence','fenceVertical','gate','picnic','parcel','star','pond','bench','home','cafe','mall','arch']}};
const authored=root.UWExteriorLayout?.neighbourhood;if(authored){data.version=2;data.spawn={...authored.spawn};data.doors=authored.doors.map(d=>({...d}));data.rewards=authored.rewards;data.heroHeight=authored.heroHeight;const area=root.UWWorldRenderer?.areas.neighbourhood;if(area){data.objects=area.props.map(p=>({...p,solid:p.foot||null}));data.colliders=[...area.props.filter(p=>p.foot).map(p=>({id:p.id,rect:p.foot})),...(area.colliders||[]).map((rect,i)=>({id:'authored-'+i,rect}))];}}
if(typeof module!=='undefined')module.exports=data;root.UWNeighbourhoodMap=data;
})(typeof window==='undefined'?globalThis:window);
