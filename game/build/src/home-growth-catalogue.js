/* Load after new home artwork; ready means renderable, never automatically owned. */
(function(root){'use strict';const art=root.UWHomeDesignV1,cache=new Map();
root.UWHomeGrowthCatalogue=art?art.catalogue.map(q=>Object.freeze({id:q.id,target:'home',category:q.group,name:q.name.replaceAll('-',' '),ready:!!art.sprites[q.id]})):[];
root.UWHomeGrowthPreview=function(id){const s=art?.sprites[id];if(!s)return null;if(cache.has(id))return cache.get(id);const c=document.createElement('canvas');c.width=s.width;c.height=s.height;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;art.draw(ctx,id,s.anchor[0],s.anchor[1]);const url=c.toDataURL();cache.set(id,url);return url;};
})(typeof window==='undefined'?globalThis:window);
