/* Presentation adapter only: current cafe engine, bridge, state, and recipes remain authoritative. */
(()=>{'use strict';const current=window.RRArt,original=window.RRLegacyArt;
const modern={load:current.load,drawRoomShell:current.drawRoomShell,drawStationLayer:current.drawStationLayer,drawTableFurniture:current.drawTableFurniture,customData:current.customData,drawSinkWorld:current.drawSinkWorld,drawWash:current.drawWash};
const owns=(key)=>Object.prototype.hasOwnProperty.call(window.RR_LEGACY_ASSETS,key);
const supportedRoom=d=>owns('room_floor_'+d.flooring)&&owns('room_wall_'+d.wallpaper);
const supportedTable=d=>owns('dining_'+d.tableType)&&owns('chair_'+d.chairs)&&['flowers','teapot','plant','cupcake','cookies','stars'].includes(d.decoration)&&['honey','cream','berry','sky','gingham','rainbow'].includes(d.tablecloth||d.tabletop||'honey');
current.load=async()=>{const [result]=await Promise.all([modern.load(),original.load()]);return result;};
current.drawRoomShell=(c,d)=>supportedRoom(d)?original.drawRoomShell(c,d):modern.drawRoomShell(c,d);
current.drawStationLayer=(c,t)=>original.drawStationLayer(c,t);
current.drawTableFurniture=(c,x,y,d,symbol,col,t,marker,seatGuest)=>supportedTable(d)?original.drawTableFurniture(c,x,y,d,symbol,col,t,marker,seatGuest):modern.drawTableFurniture(c,x,y,d,symbol,col,t,marker,seatGuest);
current.customData=(stage,id,d)=>{const n={...d,[stage]:id};return supportedRoom(n)&&supportedTable(n)?original.customData(stage,id,d):modern.customData(stage,id,d);};
current.drawSinkWorld=(c,t)=>original.drawSinkWorld(c,t);
current.drawWash=(c,p,t)=>original.drawWash(c,p,t);
})();
