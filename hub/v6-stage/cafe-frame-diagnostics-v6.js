/* Isolated V6 café: readiness plus bounded, non-save artwork diagnostics. */
(()=>{'use strict';let last=0;
 const send=(event,detail)=>{if(parent===window)return;parent.postMessage({type:'V5_LOAD_DIAG',event,detail},location.origin);};
 const clean=u=>{try{const p=new URL(u,location.href);return p.origin===location.origin?p.pathname:'other-origin';}catch(_){return 'unavailable';}};
 send('script-start',{path:location.pathname});
 addEventListener('error',e=>send('error',{message:String(e.message||'resource error').slice(0,180),path:clean(e.filename||e.target?.src||'')}),true);
 addEventListener('DOMContentLoaded',()=>send('dom-ready',{}));
 addEventListener('load',()=>send('load',{}));
 addEventListener('rr-cafe-load-failed',()=>send('asset-failed',{key:'startup'}));
 addEventListener('rr-assets',e=>{const d=e.detail||{};if(d.type!=='failed')return;
   // The existing visible retry notice omits the cause; keep only bounded
   // manifest key and loader error, never save data or query strings.
   console.warn('[V6 café artwork]',String(d.key||'unknown').slice(0,100),String(d.error||'unknown').slice(0,180));
   send('asset-failed',{key:String(d.key||'unknown').slice(0,100)});
 });
 setInterval(()=>{const entries=performance.getEntriesByType('resource'),fresh=entries.slice(last);last=entries.length;
   send('progress',{ready:document.readyState,resources:entries.length,recent:fresh.slice(-15).map(e=>({path:clean(e.name),duration:Math.round(e.duration),status:e.responseStatus||0}))});
 },3000);
})();
