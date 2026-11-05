/* Preserve unknown save fields and the original neighbourhood location when mapping it to the recovered hub. */
(function(root){'use strict';
function resolve(saved, scenes){
 if(!saved||saved.version!==1)return {scene:'village',saved:null,locked:!!saved};
 // Never rewrite a layout introduced by a newer version of the game.
 if(saved.townLayoutVersion!==undefined&&saved.townLayoutVersion!==6)
  return {scene:'village',saved,locked:true};
 const aliases={street:'mall',fitting:'boutique',photo:'mall'};
 if(saved.scene==='neighbourhood')return {scene:'village',saved,relocated:true};
 // The old village and the new town use different coordinate systems. Keep
 // the old position for recovery and start at the new town's safe spawn.
 if(saved.scene==='village'&&saved.townLayoutVersion===undefined)
  return {scene:'village',saved,relocated:true};
 const scene=aliases[saved.scene]||saved.scene;
 return scenes[scene]?{scene,saved}:{scene:'village',saved,locked:true};
}
function update(saved, scene, player, visited, relocated){
 const prior=saved&&typeof saved==='object'?saved:{};
 const copy={...prior,version:1,townLayoutVersion:6,scene,x:player.x,y:player.y,facing:player.facing,visited:[...new Set([...(Array.isArray(prior.visited)?prior.visited:[]),...visited])]};
 if(relocated&&!Object.prototype.hasOwnProperty.call(copy,'recoveryPreviousLocation'))copy.recoveryPreviousLocation={scene:prior.scene,x:prior.x,y:prior.y,facing:prior.facing,travelReturn:prior.travelReturn};
 return copy;
}
const api={resolve,update};if(typeof module!=='undefined')module.exports=api;root.UWRecoverySave=api;
})(typeof window==='undefined'?globalThis:window);
