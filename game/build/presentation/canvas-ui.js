/* Additive canvas chrome primitives. Draw-only: no input, game state, actors, or content art. */
(() => {
  'use strict';
  const tokenVars={ivory:'--uw-ivory',plum:'--uw-plum',lavender:'--uw-lavender',gold:'--uw-gold',wood:'--uw-wood',outline:'--uw-outline',disabled:'--uw-disabled',surfaceAlt:'--uw-surface-alt',lavenderPale:'--uw-lavender-pale'};
  // Read the single canonical token source at draw time; do not fork palette values in JS.
  const palette={};for(const [key,varName]of Object.entries(tokenVars))Object.defineProperty(palette,key,{enumerable:true,get(){const root=globalThis.document?.documentElement;if(!root)return '';return globalThis.getComputedStyle?.(root)?.getPropertyValue(varName).trim()||'';}});
  const shapes={
    nav:[['M9 24 24 9l15 15M14 21v18h20V21M21 39V27h7v12']],
    back:[['M21 10 7 24l14 14M8 24h23a10 10 0 0 1 10 10v4']],
    close:[['m13 13 22 22M35 13 13 35']],
    play:[['M16 9v30l24-15z','fill']], pause:[['M15 11h7v26h-7zM27 11h7v26h-7z','fill']],
    retry:[['M11 20a15 15 0 1 1-1 10M10 10v11h11']],
    settings:[['M20 7h8l1 5 4 2 4-2 5 7-3 4v4l3 4-5 7-5-2-4 2-1 5h-8l-1-5-4-2-4 2-5-7 3-4v-4l-3-4 5-7 5 2 4-2zM17 24a7 7 0 1 0 14 0 7 7 0 1 0-14 0']],
    sound:[['M8 19h8l11-9v28l-11-9H8zM33 18a9 9 0 0 1 0 12M37 13a16 16 0 0 1 0 22']],
    bag:[['M9 18h30l3 24H6zM16 19v-5a8 8 0 0 1 16 0v5']],
    coin:[['M24 6a18 18 0 1 0 0 36 18 18 0 1 0 0-36zM24 12a12 12 0 1 0 0 24 12 12 0 1 0 0-24zM27 16c-1-2-8-2-8 2 0 5 10 2 10 8 0 5-7 7-11 3M24 13v22']],
    check:[['m9 25 10 10 21-23']],
    home:[['m6 23 18-16 18 16M11 21v20h26V21M20 41V28h8v13']],
    help:[['M24 6a18 18 0 1 0 0 36 18 18 0 1 0 0-36zM18 18a6 6 0 1 1 10 5c-3 2-4 3-4 7M24 35v1']],
    photo:[['M7 16h8l4-6h11l4 6h7v25H7zM16 27a8 8 0 1 0 16 0 8 8 0 1 0-16 0z']],
    puzzle:[['M7 7h13c-3 7 8 9 8 2 0-1 0-1-1-2h14v14c-7-3-9 8-2 8 1 0 1 0 2-1v13H27c3-7-8-9-8-2 0 1 0 1 1 2H7V27c7 3 9-8 2-8-1 0-1 0-2 1z']],
    paint:[['M24 7a17 17 0 0 0 0 34h4c4 0 5-5 2-7-2-2-1-5 2-5h4c11 0 10-22-12-22zM15 20h.1M23 14h.1M33 18h.1']],
    wardrobe:[['M15 10 24 15l9-5 9 6-5 8-5-3v17H16V21l-5 3-5-8zM24 15v28']],
    left:[['m29 9-15 15 15 15M15 24h25']], right:[['m19 9 15 15-15 15M33 24H8']],
    star:[['m24 5 6 12 13 2-9 9 2 14-12-7-12 7 2-14-9-9 13-2z','fill']],
    hand:[['M16 25V12a4 4 0 0 1 8 0v10-14a4 4 0 0 1 8 0v14-10a4 4 0 0 1 8 0v14-6a4 4 0 0 1 8 0v12c0 8-5 13-13 13h-5c-6 0-9-2-12-6l-7-9a4 4 0 0 1 6-5z']],
    rotate:[['M7 18A17 17 0 0 1 37 12l4 4M41 7v9H32M41 30A17 17 0 0 1 11 36l-4-4M7 41v-9h9']],
    grid:[['M7 7h14v14H7zM27 7h14v14H27zM7 27h14v14H7zM27 27h14v14H27z']],
    grid4:[['M7 7h34v34H7zM24 7v34M7 24h34']],grid9:[['M6 6h36v36H6zM18 6v36M30 6v36M6 18h36M6 30h36']],grid16:[['M6 6h36v36H6zM15 6v36M24 6v36M33 6v36M6 15h36M6 24h36M6 33h36']],
    mute:[['M7 18h8l12-9v30l-12-9H7zM34 18l10 12m0-12L34 30']],
    door:[['M8 42V8h28v34M8 42h34M17 42V13l15-3v32M26 27h.1']],
    headwear:[['M7 31h34l-4-7a13 13 0 0 0-26 0zM7 31v7h34v-7M22 16l2-5 2 5']],
    shirt:[['m15 8 9 5 9-5 11 7-5 11-6-3v17H15V23l-6 3-5-11zM18 10q6 9 12 0']],
    accessory:[['M12 8q0 16 12 21 12-5 12-21M24 29v6m0-1 7 6-7 5-7-5z']],
    mirror:[['M24 6c-9 0-15 8-15 19s6 17 15 17 15-6 15-17S33 6 24 6zM24 42v4m-8 0h16M17 17q3-5 7-5']]
  };
  const allowed=new Set(Object.keys(shapes));
  let materialAtlas=null,materialRects=null;
  function setMaterialAtlas(atlas,sourceRects){
    if(!atlas||!sourceRects?.wood||('complete'in atlas&&!atlas.complete)||(Number(atlas.naturalWidth??atlas.width)||0)<1)return false;materialAtlas=atlas;materialRects=sourceRects;return true;
  }
  function pathFor(d){return new Path2D(d);}
  function roundedPath(ctx,x,y,w,h,r){const q=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();ctx.moveTo(x+q,y);ctx.lineTo(x+w-q,y);ctx.arcTo(x+w,y,x+w,y+q,q);ctx.lineTo(x+w,y+h-q);ctx.arcTo(x+w,y+h,x+w-q,y+h,q);ctx.lineTo(x+q,y+h);ctx.arcTo(x,y+h,x,y+h-q,q);ctx.lineTo(x,y+q);ctx.arcTo(x,y,x+q,y,q);ctx.closePath();}
  function icon(ctx,name,cx,cy,size,opts={}){
    if(!allowed.has(name)||!ctx||!Number.isFinite(size)||size<=0)return false;
    const p={...palette,...opts.palette};ctx.save();if(Number.isFinite(opts.opacity))ctx.globalAlpha*=opts.opacity;ctx.translate(cx-size/2,cy-size/2);ctx.scale(size/48,size/48);ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=opts.ink||p.plum;
    for(const [d,kind] of shapes[name]){const q=pathFor(d);if(kind==='fill'){ctx.fillStyle=opts.accent||p.gold;ctx.fill(q);ctx.stroke(q);}else ctx.stroke(q);}
    ctx.restore();return true;
  }
  function rounded(ctx,x,y,w,h,r,fill,stroke,lineWidth=2,opacity=1){ctx.save();ctx.globalAlpha*=opacity;roundedPath(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=lineWidth;ctx.strokeStyle=stroke;ctx.stroke();ctx.restore();}
  function materialTile(ctx,name,x,y,w,h,radius=0,opts={}){
    const rect=materialRects?.[name];if(!ctx||!materialAtlas||!rect)return false;const [sx,sy,sw,sh]=rect;ctx.save();
    roundedPath(ctx,x,y,w,h,radius);ctx.clip();ctx.globalAlpha*=opts.opacity??1;
    for(let dy=0;dy<h;dy+=sh)for(let dx=0;dx<w;dx+=sw){const cw=Math.min(sw,w-dx),ch=Math.min(sh,h-dy);ctx.drawImage(materialAtlas,sx,sy,cw,ch,x+dx,y+dy,cw,ch);}
    ctx.restore();return true;
  }
  function panel(ctx,x,y,w,h,opts={}){const p={...palette,...opts.palette};rounded(ctx,x,y,w,h,opts.radius||20,opts.fill||p.ivory,opts.stroke||p.outline,opts.lineWidth||3,opts.opacity??1);}
  function button(ctx,x,y,size,name,state='normal',opts={}){
    const p={...palette,...opts.palette},s=Math.max(44,size),fill=state==='pressed'?p.lavender:state==='disabled'?p.disabled:p.ivory;
    rounded(ctx,x,y,s,s,s/2,fill,state==='focus'?p.gold:p.outline,state==='focus'?4:2,opts.opacity??1);
    icon(ctx,name,x+s/2,y+s/2,s*.62,{palette:p,ink:state==='disabled'?p.outline:p.plum,accent:p.gold});
  }
  function routeArrow(ctx,cx,cy,size,radians,opts={}){ctx.save();ctx.translate(cx,cy);ctx.rotate(radians);icon(ctx,'right',0,0,size,{...opts,ink:opts.ink||palette.plum});ctx.restore();}
  function arcadeStage(ctx,w,h){
    if(!ctx||w<=0||h<=0)return;ctx.save();
    // Keep the entire original catcher playfield open: basket extremes reach x≈6..894
    // and stars descend almost to the bottom. Only the 6px exterior rails frame it.
    ctx.fillStyle=palette.lavender;ctx.fillRect(0,0,w,h);
    const x=6,y=0,fieldW=w-12,fieldH=h-8;
    ctx.fillStyle=palette.outline;ctx.fillRect(0,0,6,h);ctx.fillRect(w-6,0,6,h);ctx.fillRect(0,h-8,w,8);
    // A light pixel-tile field keeps falling stars and the basket easy to see.
    ctx.fillStyle='#fff0dd';ctx.fillRect(x,y,fieldW,fieldH);
    for(let yy=y;yy<fieldH;yy+=48)for(let xx=x;xx<x+fieldW;xx+=48){ctx.fillStyle=((Math.floor(xx/48)+Math.floor(yy/48))%2)?'#f6dfdc':'#fff2df';ctx.fillRect(xx,yy,Math.min(48,x+fieldW-xx),Math.min(48,fieldH-yy));}
    ctx.restore();
  }
  function bowlingLane(ctx,w,h){
    if(!ctx||w<=0||h<=0)return;ctx.save();ctx.fillStyle=palette.ivory;ctx.fillRect(0,0,w,h);
    const scale=h/500,wallH=48*scale,x=278,y=60*scale,laneW=344,laneH=h-y-12*scale;
    ctx.fillStyle=palette.lavender;ctx.fillRect(0,0,w,wallH);
    ctx.fillStyle=palette.outline;ctx.fillRect(0,wallH-2*scale,w,2*scale);
    // A centered toy-bowling wood lane and shallow gutters preserve the existing aim path/coordinates.
    rounded(ctx,x-18,y,laneW+36,laneH,12,palette.plum,palette.outline,3);
    const g=ctx.createLinearGradient(x,y,x+laneW,y);g.addColorStop(0,palette.wood);g.addColorStop(.5,palette.surfaceAlt);g.addColorStop(1,palette.wood);
    const deckY=y+4*scale,deckH=laneH-8*scale;rounded(ctx,x,deckY,laneW,deckH,8,g,palette.outline,2);
    if(materialRects?.wood&&materialAtlas){
      // Rotate the source plank grain 90° so its long boards run toward the pins.
      ctx.save();roundedPath(ctx,x,deckY,laneW,deckH,8);ctx.clip();ctx.translate(x+laneW/2,deckY+deckH/2);ctx.rotate(Math.PI/2);materialTile(ctx,'wood',-deckH/2,-laneW/2,deckH,laneW,0);ctx.restore();
    }
    ctx.restore();
  }
  function jigsawBoard(ctx,x,y,w,h){
    if(!ctx||w<=0||h<=0)return;ctx.save();ctx.fillStyle=palette.lavenderPale;ctx.fillRect(0,0,900,500);
    materialTile(ctx,'wood',x-7,y-7,w+14,h+14,12)||rounded(ctx,x-7,y-7,w+14,h+14,12,palette.wood,palette.outline,3);
    rounded(ctx,x,y,w,h,6,palette.ivory,palette.outline,2);ctx.restore();
  }
  function jigsawSeams(ctx,path,x,y,opts={}){if(!ctx||!path)return;const p={...palette,...opts.palette};ctx.save();ctx.translate(x,y);ctx.globalAlpha*=opts.opacity??1;ctx.strokeStyle=opts.color||p.lavender;ctx.lineWidth=opts.lineWidth||1;ctx.stroke(path);ctx.restore();}
  function meter(ctx,x,y,w,h,value,opts={}){const p={...palette,...opts.palette},v=Math.max(0,Math.min(1,Number(value)||0));ctx.save();rounded(ctx,x,y,w,h,h/2,opts.track||p.lavenderPale,opts.outline||p.outline,opts.lineWidth||2);if(v>0)rounded(ctx,x+2,y+2,Math.max(2,(w-4)*v),h-4,(h-4)/2,opts.fill||p.gold,opts.fill||p.gold,1);ctx.restore();}
  function focusRing(ctx,cx,cy,radius,opts={}){const p={...palette,...opts.palette};ctx.save();ctx.globalAlpha*=opts.opacity??1;ctx.strokeStyle=opts.color||p.gold;ctx.lineWidth=opts.lineWidth||3;ctx.setLineDash(opts.dash||[6,5]);ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();ctx.restore();}
  function selectionOutline(ctx,x,y,w,h,radius=12,opts={}){const p={...palette,...opts.palette};ctx.save();ctx.globalAlpha*=opts.opacity??1;ctx.setLineDash(opts.dash||[8,6]);ctx.lineWidth=opts.lineWidth||4;ctx.strokeStyle=opts.color||p.gold;roundedPath(ctx,x,y,w,h,radius);ctx.stroke();ctx.restore();}
  window.UWCanvasPresentation={palette:{...palette},icons:[...allowed],setMaterialAtlas,materialTile,icon,rounded,panel,button,routeArrow,arcadeStage,bowlingLane,jigsawBoard,jigsawSeams,meter,focusRing,selectionOutline};
})();
