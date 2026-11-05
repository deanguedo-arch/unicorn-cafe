/* Optional refreshed room art. Existing scenery coordinates and collision stay authoritative. */
(function(root){'use strict';
const files={sofa:'sofa',bed:'bed',wardrobe:'wardrobe',shelf:'bookcase',toybox:'toy-chest',stairs:'stairs-up',window:'window',desk:'desk',lamp:'floor-lamp',plant:'plant',nightstand:'nightstand','kitchen-sink':'kitchen-sink','kitchen-hob':'kitchen-hob','dining-table':'dining-table','chair-east':'chair-rose','chair-west':'chair-rose','chair-north':'chair-rose','clubhouse-arttable':'art-table','clubhouse-canopy':'fort-canopy','clubhouse-theatre':'puppet-theatre'};
const images={};for(const [id,file] of Object.entries(files)){const image=new Image();image.src='assets/refresh-home/'+file+'.png';images[id]=image;}
function draw(c,id,x,y,width){const im=images[id];if(!im?.complete||!im.naturalWidth)return false;const w=width??im.naturalWidth*2,h=w*im.naturalHeight/im.naturalWidth;c.save();c.imageSmoothingEnabled=false;c.drawImage(im,x-w/2,y-h,w,h);c.restore();return true;}
root.UWRefreshHome={draw};
})(window);
