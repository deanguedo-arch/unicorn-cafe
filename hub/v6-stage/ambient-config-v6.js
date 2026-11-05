/* Provisional traced interior portions of v6 water and lanterns, artwork pixels. */
(function(root){'use strict';
const s=p=>p.map(v=>v*2),poly=p=>p.map(s), line=(x,y,length)=>({at:s([x,y]),length:length*2});
const lamp=(x,y)=>({clip:poly([[x-4,y-4],[x+4,y-4],[x+4,y+4],[x-4,y+4]]),center:s([x,y]),radius:8});
root.UWTownAmbientGeometry=UWTownAmbient.compile({
 water:[
  {clip:poly([[473,706],[495,706],[495,713],[473,713]]),lines:[line(475,708,14),line(478,711,14)]},
  {clip:poly([[820,699],[850,699],[850,708],[820,708]]),lines:[line(822,702,20),line(825,706,16)]},
  {clip:poly([[252,986],[318,987],[321,1034],[252,1034]]),lines:[line(265,993,25),line(280,1002,22),line(263,1016,30),line(277,1028,25)]},
  {clip:poly([[1007,986],[1049,986],[1049,1030],[1008,1030]]),lines:[line(1015,993,25),line(1032,1003,20),line(1021,1017,29),line(1041,1026,25)]},
  {clip:poly([[625,882],[637,882],[637,895],[625,895]]),lines:[line(627,885,8),line(628,891,8)]},
  {clip:poly([[733,882],[744,882],[744,895],[733,895]]),lines:[line(735,885,7),line(735,891,7)]}
 ],
 fountains:[{clip:poly([[607,826],[625,826],[625,860],[607,860]]),jets:[{at:s([616,858]),height:54,width:8}]},
 {clip:poly([[738,828],[754,828],[754,862],[738,862]]),jets:[{at:s([746,860]),height:50,width:8}]}],
 lights:[lamp(610,570),lamp(757,578),lamp(308,704),lamp(202,856),lamp(1165,855),lamp(518,956),lamp(851,956),lamp(1075,104)]
});
})(typeof window!=='undefined'?window:globalThis);
