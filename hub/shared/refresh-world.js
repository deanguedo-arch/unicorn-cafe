/* Presentation-only fixture images: native footprints and interaction geometry remain unchanged. */
(function(root){'use strict';
const outdoor={oak:'leafy-tree',blossom_tree:'blossom-tree',hedge:'hedge',hedge_corner:'hedge-corner',flower_planter:'planter',fountain:'fountain',mailbox:'mailbox',flower_cart:'flower-cart',bench:'bench',streetlamp:'lamp'};
const retail={wallrack:'wall-rack',workbench:'workbench','photo-booth':'photo-booth',mirror:'mirror',checkout:'checkout',bench:'bench','retail-island':'display-island','arcade-cabinet':'arcade-cabinet'};
const images={};for(const file of new Set([...Object.values(outdoor),...Object.values(retail)])){const image=new Image();image.src='assets/refresh-world/'+file+'.png';images[file]=image;}
function draw(c,group,id,x,y,w,h){const im=images[(group==='outdoor'?outdoor:retail)[id]];if(!im?.complete||!im.naturalWidth)return false;const count=group==='retail'&&id==='retail-island'?3:1,cell=w/count,z=Math.min(cell/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*z,dh=im.naturalHeight*z;c.save();c.imageSmoothingEnabled=false;for(let i=0;i<count;i++){const cx=x-w/2+cell*(i+.5);c.drawImage(im,Math.round(cx-dw/2),Math.round(y-dh),Math.round(dw),Math.round(dh));}c.restore();return true;}
root.UWRefreshWorld={draw};
})(window);
