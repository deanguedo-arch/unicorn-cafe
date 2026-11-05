/* Review-only loading watchdog: progress can extend the idle deadline, not the cap. */
(function(root){'use strict';
function create({onStall,now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout,idle=15000,maximum=120000}){
 let stopped=false,handle=null,count=0;const phases=new Set(),end=now()+maximum;
 function arm(){if(stopped)return;cancel(handle);handle=schedule(()=>{if(stopped)return;stopped=true;onStall();},Math.max(0,Math.min(idle,end-now())));}
 arm();return {progress(n){if(stopped||!Number.isFinite(n)||n<=count)return;count=n;arm();},phase(name){if(stopped||!['script-start','dom-ready','load'].includes(name)||phases.has(name))return;phases.add(name);arm();},stop(){stopped=true;cancel(handle);}};
}
root.UWTownLoadWatchdog={create};if(typeof module!=='undefined'&&module.exports)module.exports=root.UWTownLoadWatchdog;
})(typeof window!=='undefined'?window:globalThis);
