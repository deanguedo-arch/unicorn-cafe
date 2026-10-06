/* Shared, stable ownership IDs. Native adventure treasure capacity is unrelated. */
(function(root){'use strict';
const items=[
 ['bow','head',0,'bow','#ee9cc8'],['tee','body',0,'shirt','#c2e6df'],['beads','accessory',0,'beads','#edd078'],
 ['flower-crown','head',3,'crown','#edb0cf'],['sunhat','head',3,'hat','#f5d995'],['helmet','head',3,'helmet','#96d4d6'],
 ['star-jacket','body',6,'jacket','#aa91d2'],['rainbow-dress','body',6,'dress','#ec9bbc'],['raincoat','body',6,'coat','#e6c65e'],
 ['scarf','accessory',3,'scarf','#de91b3'],['glasses','accessory',3,'glasses','#a080bd'],['satchel','accessory',3,'bag','#c38dc5'],
 ['skateboard','equipment',15,'skateboard','#b294dc'],['bike','equipment',25,'bike','#85c6d0'],
 ['prize-star-bow','head',null,'starbow','#eeb0d1'],['prize-rainbow-cape','body',null,'cape','#cb9be4'],
 ['prize-comet-helmet','head',null,'helmet','#b2a2e0'],['prize-gold-scarf','accessory',null,'scarf','#f0ce70'],
 ['prize-bubble-glasses','accessory',null,'glasses','#98d7d2'],['prize-moon-bag','accessory',null,'bag','#9a86c8'],
 ['legacy-princess','head',null,'crown','#f0cf6f'],['legacy-hero','body',null,'cape','#f083b2'],
 ['legacy-mask','accessory',null,'glasses','#694b78'],['legacy-chef','head',null,'chef','#fff6e9'],['legacy-space','head',null,'space','#c6e7ec']
].map(([id,slot,price,art,color])=>({id,slot,price,art,color,name:id.replaceAll('-',' '),ride:slot==='equipment',games:slot==='equipment'?['village','street','track']:['village','mall','cafe','adventure']}));
const byId=Object.fromEntries(items.map(i=>[i.id,i]));
const starters=['bow','tee','beads'],prizes=items.filter(i=>i.id.startsWith('prize-')).map(i=>i.id);
const themes=['unicorns','animals','food','outfits','vehicles','places'];
const puzzles=themes.flatMap((theme,t)=>Array.from({length:8},(_,i)=>({id:theme+'-'+(i+1),theme,index:i,seed:t*8+i,title:theme+' '+(i+1)})));
function cleanOutfit(o,owned){const r={head:null,body:null,accessory:null};for(const slot of Object.keys(r)){const id=o?.[slot];if(byId[id]?.slot===slot&&(!owned||owned.includes(id)))r[slot]=id;}return r;}
const api={items,byId,starters,prizes,themes,puzzles,cleanOutfit,slots:['head','body','accessory'],speed:{skateboard:1.2,bike:1.35}};
root.UWCatalog=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

