/* V6 source-art silhouettes. Coordinates are artwork pixels; the game world is 2x. */
(function(root){'use strict';
// Inner contours of the two northern bridge lamps/piers. No rectangular background crop.
const left=[[31,28],[32,25],[30,20],[30,15],[32,9],[37,7],[44,8],[47,12],[48,19],[46,24],[45,28],[55,30],[56,33],[56,72],[61,76],[65,83],[65,117],[56,117],[55,115],[30,115],[29,109],[28,78],[24,75],[24,35],[22,32]];
const right=[[181,30],[180,25],[179,20],[181,12],[184,9],[191,9],[195,13],[196,20],[194,26],[192,30],[202,33],[202,70],[204,74],[201,79],[201,114],[194,117],[174,117],[173,84],[169,82],[166,87],[165,117],[165,84],[168,76],[171,71],[171,36],[170,33]];
const pillars=[left,right].map(poly=>poly.map(([x,y])=>[570+x,550+y]));
// Tight opaque post silhouettes only: the mesh contains baked-in ground and
// cannot be copied as a rectangle without covering the character with paving.
const posts=[
 {x:1105,base:592,poly:[[1102,557],[1103,555],[1106,555],[1108,557],[1108,588],[1107,590],[1103,590],[1102,589]]},
 {x:1220,base:627,poly:[[1217,592],[1218,590],[1221,590],[1223,592],[1223,623],[1222,625],[1218,625],[1217,623]]}
];
function paint(ctx,image,poly){ctx.save();ctx.beginPath();ctx.moveTo(poly[0][0]*2,poly[0][1]*2);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i][0]*2,poly[i][1]*2);ctx.closePath();ctx.clip();ctx.drawImage(image,0,0,1371*2,1148*2);ctx.restore();}
function draw(ctx,image,player){if(!image)return;const px=player.x/2,py=player.y/2;
 if(py>=530&&py<667)for(const poly of pillars){const xs=poly.map(p=>p[0]),lo=Math.min(...xs),hi=Math.max(...xs);if(px>=lo-45&&px<=hi+45)paint(ctx,image,poly);}
 for(const post of posts)if(Math.abs(px-post.x)<=45&&py<post.base&&py>post.base-90)paint(ctx,image,post.poly);
}
root.UWTownForeground=Object.freeze({draw,pillars,posts});if(typeof module!=='undefined'&&module.exports)module.exports=root.UWTownForeground;
})(typeof window!=='undefined'?window:globalThis);
