/* Shared by the isolated town wrapper and its non-save recovery fixture. */
(function(root){'use strict';
 function show(id,frame,active,loading,announce){if(id!=='cafe'||active!==id||frame.ready)return false;frame.watchdog?.stop();frame.node.hidden=false;loading.hidden=true;announce('Café artwork did not load. You can retry or return to town.');return true;}
 root.UWCafeRevealV6={show};if(typeof module!=='undefined'&&module.exports)module.exports=root.UWCafeRevealV6;
})(typeof window!=='undefined'?window:globalThis);
