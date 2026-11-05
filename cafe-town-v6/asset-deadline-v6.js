/* Isolated review loader: tolerate slow assets while keeping stalls bounded. */
(function(root){'use strict';
 function create({now=()=>Date.now(),schedule=setTimeout,cancel=clearTimeout,minimum=30000,quiet=15000,maximum=75000}={}){
  let lastProgress=-Infinity;
  return {progress(){lastProgress=now();},watch(onTimeout){const started=now();let timer,done=false;
   function check(){if(done)return;const t=now();if(t-started>=maximum||t-lastProgress>=quiet){done=true;onTimeout();return;}timer=schedule(check,Math.min(quiet-(t-lastProgress),maximum-(t-started)));}
   timer=schedule(check,Math.min(minimum,maximum));
   return {cancel(){if(done)return;done=true;cancel(timer);}};
  }};
 }
 root.UWCafeAssetDeadlineV6={create};if(typeof module!=='undefined'&&module.exports)module.exports=root.UWCafeAssetDeadlineV6;
})(typeof window!=='undefined'?window:globalThis);
