/* Staged v6 geometry in artwork pixels, doubled to world units. Not visually verified. */
(function(root){'use strict';
const factor=2,width=1371*factor,height=1148*factor,viewW=1672,viewH=941;
const points=[
 ['cafe','pizza',300,178],['mall','bag',685,207],['home-exterior','home',1110,185],
 ['boutique','hanger',172,440],['wheels','wheel',439,408],['arcade','pins',997,409],
 ['take-photo','camera',1253,477],['adventure','room_door',194,619],
 ['park','ball',365,643],['tennis','ball',861,625],['volleyball','ball',1124,637],['bowling','pins',1271,666]
];
// The photo pad's usual south return falls inside the adjoining flowerbed.
const zones=points.map(([id,picture,x,y])=>({id,picture,x:x*factor,y:y*factor,approachOffset:0,rx:60,ry:38,hit:{x:(x-35)*factor,y:(y-22)*factor,w:70*factor,h:44*factor},spawn:{x:(x+(id==='take-photo'?20:0))*factor,y:(y+20)*factor}}));
// Corridors run down the photographed paving and into the central plaza. The
// radius is conservative; individual trees, railings and courts still need QA.
const paths=[
 [[300,178],[380,250],65],[[380,250],[590,270],75],[[685,207],[685,280],55],
 [[1110,185],[1010,260],65],[[1010,260],[800,270],75],[[590,270],[800,270],90],
 [[172,440],[350,430],60],[[439,408],[350,430],55],[[350,430],[560,470],75],
 [[997,409],[870,450],65],[[1253,477],[1120,460],65],[[1120,460],[870,450],65],
 [[590,270],[560,470],95],[[800,270],[870,450],95],[[560,470],[870,450],105],
 [[194,619],[200,520],45],[[200,520],[350,430],55],
 [[194,619],[315,654],38],[[315,654],[380,703],38],[[380,703],[440,764],38],
 [[315,654],[365,643],22],[[365,643],[365,615],12],
 [[1082,455],[1082,515],18],[[1082,515],[1080,555],18],
 [[685,470],[685,720],78],[[685,720],[685,760],70]
];
const plaza=[[462,755],[565,737],[612,720],[755,720],[842,744],[921,785],[950,842],[937,909],[870,969],[754,1006],[621,1006],[505,972],[440,919],[414,860],[425,799]];
const court=[[822,611],[876,570],[917,535],[988,539],[1058,523],[1095,543],[1178,572],[1248,590],[1310,610],[1346,623],[1336,690],[1284,709],[1217,685],[1120,671],[1030,650],[950,641],[873,639],[824,637]];
const basketball=[[332,579],[421,538],[455,535],[528,575],[451,625],[400,617],[362,604]];
// Approximate ground footprints; the raster still needs ordinary-input visual QA.
const courtHedges=[[[286,548],[421,500],[454,504],[569,530],[574,548],[453,531],[421,535],[318,581],[299,578]],[[407,624],[469,619],[533,601],[553,615],[533,640],[468,651],[419,646]]];
const structures=[[165,8,390,152],[545,0,825,191],[1040,0,1265,161],[20,225,247,419],[275,256,490,388],[909,222,1137,397],[1188,278,1368,453]];
const foliage=[[685,375,79,54],[360,492,74,53],[872,494,70,47],[1190,500,80,26]];
// Ground outlines of the two planted beds flanking the shopping-hall pad.
// They leave the central entrance and the pavement around their outside open.
const mallBeds=[[[484,178],[497,161],[520,160],[528,174],[550,181],[570,190],[580,205],[605,218],[626,231],[630,245],[615,253],[590,252],[560,244],[530,231],[500,215],[482,201]],[[742,230],[750,215],[772,204],[788,193],[806,181],[820,176],[837,162],[856,158],[873,166],[883,181],[889,198],[883,210],[867,218],[842,227],[819,237],[793,247],[766,253],[747,247]]];
// Ground footprint of the flowered shrub just west of the court opening.
const courtShrub=[[960,493],[965,484],[976,482],[982,471],[1023,471],[1028,482],[1039,483],[1048,491],[1051,499],[1059,504],[1061,520],[1055,528],[1036,533],[1019,532],[1007,529],[990,527],[975,522],[963,518]];
// The flowerbed protruding from the right side of the wheels shop.
const wheelsBed=[[487,285],[499,286],[511,295],[523,307],[533,318],[537,332],[533,347],[523,360],[509,370],[489,374]];
const fountain={x:685,y:864,rx:124,ry:67};
// Feet collide at the drawn bottom edge of each net, not its elevated top.
// Coordinates were checked against the V6 source pixels; do not block the
// paved space immediately behind the mesh.
const nets=[[[875,585],[982,617]],[[1105,591],[1220,625]]];
function segment(x,y,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(x-a[0]-vx*t,y-a[1]-vy*t);}
function inside(x,y,poly){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
function walkable(wx,wy){const x=wx/factor,y=wy/factor;if(x<20||x>1350||y<80||y>1020)return false;
 const pad=points.some(([, ,px,py])=>((x-px)/35)**2+((y-py)/23)**2<=1);
 if(!pad&&structures.some(([x1,y1,x2,y2])=>x>x1&&x<x2&&y>y1&&y<y2))return false;
 if(foliage.some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1))return false;
 if(mallBeds.some(poly=>inside(x,y,poly)))return false;
 if(inside(x,y,courtShrub))return false;
 if(inside(x,y,wheelsBed))return false;
 if(((x-fountain.x)/fountain.rx)**2+((y-fountain.y)/fountain.ry)**2<1)return false;
 if(nets.some(([a,b])=>segment(x,y,a,b)<6))return false;
 if(courtHedges.some(poly=>inside(x,y,poly)))return false;
 // Suppress legacy broad corridors across the hedge and riverbank, while
 // keeping the narrow, pictured northern court opening connected end to end.
 const courtOpening=segment(x,y,[1082,515],[1080,555])<=18;
 if(x>780&&y>530&&y<720&&!inside(x,y,court)&&!pad&&!courtOpening)return false;
 // Ground footprints of the two stone bridge parapets and their posts.
 if(y>=595&&y<=740&&((x>=594&&x<=630)||(x>=739&&x<=774)))return false;
 return pad||inside(x,y,plaza)||inside(x,y,court)||inside(x,y,basketball)||paths.some(([a,b,r])=>segment(x,y,a,b)<=r);
}
function camera(p){return{x:Math.max(0,Math.min(width-viewW,p.x-viewW/2)),y:Math.max(0,Math.min(height-viewH,p.y-viewH/2))};}
root.UWTownMap={width,height,zones,walkable,camera};if(typeof module!=='undefined'&&module.exports)module.exports=root.UWTownMap;
})(typeof window!=='undefined'?window:globalThis);
