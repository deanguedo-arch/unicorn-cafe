/* Owner-approved character exception: composite the existing precisely fitted pose
   and outfit together on one low-resolution surface. No saved art or fit is changed. */
(function(root){'use strict';let surface,context;
function draw(c,art,x,y,height=128,outfit={},frame='u_idle0',flip=false,ride=null){
 if(!surface){surface=document.createElement('canvas');surface.width=192;surface.height=128;context=surface.getContext('2d');}
 context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,192,128);context.imageSmoothingEnabled=false;
 art.unicorn(context,96,112,Math.max(1,Math.round(height/2)),outfit,frame,flip,ride);
 const unit=2;c.save();c.imageSmoothingEnabled=false;c.drawImage(surface,Math.round(x/2)*2-96*unit,Math.round(y/2)*2-112*unit,192*unit,128*unit);c.restore();
}
const bitmapCache=new WeakMap();function bitmap(c,image,x,y,width,height){if(!image)return;const w=Math.max(1,Math.round(width/2)),h=Math.max(1,Math.round(height/2)),key=w+'x'+h;let sizes=bitmapCache.get(image);if(!sizes){sizes=new Map();bitmapCache.set(image,sizes);}let cv=sizes.get(key);if(!cv){cv=document.createElement('canvas');cv.width=w;cv.height=h;const cc=cv.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(image,0,0,w,h);sizes.set(key,cv);}c.save();c.imageSmoothingEnabled=false;c.drawImage(cv,Math.round(x/2)*2-cv.width,Math.round(y/2)*2-cv.height*2,cv.width*2,cv.height*2);c.restore();}
root.UWPixelCharacters={draw,bitmap};
})(typeof window==='undefined'?globalThis:window);
