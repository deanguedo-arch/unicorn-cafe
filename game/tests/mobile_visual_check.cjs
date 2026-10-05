/* Landscape visual audit. Uses isolated storage and explicit game-state fixtures. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=process.env.VISUAL_OUTPUT||'/tmp/unicorn-mobile-visual';fs.mkdirSync(out,{recursive:true});
const sizes=[[568,320],[667,375],[740,300],[844,390],[932,430],[740,300,44,20]],results=[],errors=[];
let page;
async function fixture(kind,data={}){await page.evaluate(({kind,data})=>{
 const R=RR,s=R.fresh(),d=data.dish||'pizza',v=data.variant||R.RECIPES[d].variants[0].id;
 s.customers=[{id:1,table:0,dish:d,variant:v,type:'pink',phase:'ordered',x:R.TABLES[0].seat.x,y:R.TABLES[0].seat.y,eat:0}];s.issued=1;s.nextId=2;s.active=1;s.player={...R.KITCHEN,facing:1};
 if(kind==='cook'){const steps=R.RECIPES[d].steps;s.prep={orderId:1,dish:d,step:data.step,p:0,variant:steps[data.step]?.action==='choice'?null:v,deco:data.deco||'rainbow',done:data.step===steps.length,placements:[]};}
 if(kind==='wash'){s.tables[0]={status:'carried',dirty:null};s.dirtyTray={table:0,dish:d,variant:v,orderId:1,wash:0};}
 if(kind==='lunch'){s.customers=[];s.active=null;s.served=5;s.issued=5;s.lunch={done:false,meal:data.meal||null,packed:data.packed??(data.meal?3:0),bites:data.bites||0,sips:data.sips||0};}
 if(kind==='lunch-cook'){s.customers=[];s.active=null;s.served=5;s.issued=5;s.prep=null;s.lunch={done:false,meal:d,packed:3,bites:0,sips:0,cooked:false,variant:null,prep:{orderId:0,dish:d,step:data.step,p:0,variant:RR.RECIPES[d].steps[data.step]?.action==='choice'?null:v,done:data.step===RR.RECIPES[d].steps.length,placements:[],deco:null}};}
 if(kind==='clean'||kind==='complete'||kind==='mop'){s.customers=[];s.active=null;s.served=10;s.issued=10;s.lunch={done:true,meal:'pizza',bites:3,sips:2};if(data.task?.startsWith('floor')||kind==='complete'||kind==='mop')s.cleaning=R.CLEAN_TASKS.map(t=>({id:t.id,p:t.kind==='floor'&&kind!=='complete'?0:t.need}));if(kind==='mop'){s.mopEquipped=!!data.equipped;s.player={...R.safePoint(data.near?R.CLEAN_TASKS.find(t=>t.id==='floor-0'):R.SINK),facing:1};}}
 if(kind==='mismatch'){s.tray={orderId:1,dish:'icecream',variant:'strawberry'};s.player={...R.TABLES[0].meet,facing:1};}
 __RR_TEST__.loadFixture(s);
 if(kind==='designer')__RR_TEST__.showCustomizer(data.stage);
 if(kind==='menu')__RR_TEST__.openRecipeMenu();
 if(kind==='cook')__RR_TEST__.openCooking();
 if(kind==='wash')__RR_TEST__.openWash();
 if(kind==='lunch'||kind==='lunch-cook')__RR_TEST__.openLunch();
 if(kind==='clean')__RR_TEST__.openClean(data.task);
 if(kind==='complete')__RR_TEST__.showComplete();
 if(kind==='mismatch')__RR_TEST__.route('table',1);
 },{kind,data});await page.waitForTimeout(kind==='mismatch'?160:35);}
async function inspect(label,w,h,capture=false){const issues=await page.evaluate(()=>{
 const issues=[],rect=e=>e.getBoundingClientRect(),visible=e=>e.getClientRects().length&&rect(e).width&&rect(e).height;
 const desc=e=>e.getAttribute('aria-label')||e.className||e.tagName;
 const dialog=document.querySelector('.dialog');for(const e of document.querySelectorAll('button')){if(!visible(e)||(dialog&&!dialog.contains(e)))continue;const r=rect(e),name=desc(e);
 if(r.width<43.5||r.height<43.5)issues.push({type:'small-control',name,width:r.width,height:r.height});
 if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)issues.push({type:'outside-screen',name,rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
 const hit=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.x+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.y+r.height/2)));
 if(!e.disabled&&hit!==e&&!e.contains(hit))issues.push({type:'covered-control',name});
 for(let p=e.parentElement;p&&p.id!=='app';p=p.parentElement){const c=getComputedStyle(p),pr=rect(p);if(/hidden|auto|scroll|clip/.test(c.overflowY)&&r.bottom>pr.bottom+.5) {issues.push({type:'clipped-control',name,parent:desc(p)});break;}}
 }
 for(const e of document.querySelectorAll('.dish-card>img,.customer-order img,.cook-order .ticket img,.cook-order .ticket svg,.kitchen-screen>.ticket img,.kitchen-screen>.ticket svg,.cook-tools img,.designer-picker img,.compare-card img')){if(!visible(e))continue;const r=rect(e),p=e.closest('button,.customer-order,.ticket,.compare-card');if(!p)continue;const pr=rect(p);if(r.left<pr.left-.5||r.right>pr.right+.5||r.top<pr.top-.5||r.bottom>pr.bottom+.5)issues.push({type:'image-overflow',name:desc(p)});}
 const a=document.querySelector('.cook-layout .work-area'),b=document.querySelector('.cook-layout .cook-tools');if(a&&b){const x=rect(a),y=rect(b);if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1)issues.push({type:'tools-overlap-food-area'});}
 return issues;
 });results.push({width:w,height:h,screen:label,issues});if(capture)await page.screenshot({path:path.join(out,`${w}x${h}-${label.replace(/[^a-z0-9-]/gi,'-')}.png`)});}
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});page=await browser.newPage({hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(e.message));
 for(const [w,h,inset=0,bottom=0] of sizes){await page.setViewportSize({width:w,height:h});await page.goto(pathToFileURL(path.join(root,'Sneaky-Unicorn-Restaurant-v2.0.0.html')).href+'?qa=1');await page.waitForFunction(()=>window.__RR_TEST__);if(inset)await page.addStyleTag({content:`:root{--safe-left:${inset}px;--safe-right:${inset}px;--safe-bottom:${bottom}px}`});
 for(let stage=0;stage<6;stage++){await fixture('designer',{stage});await inspect(`designer-${stage}`,w,h,stage===3);}
 for(const kind of ['world','menu','wash','mismatch','complete']){await fixture(kind);await inspect(kind,w,h,true);}
 for(const data of [{},{meal:'pizza',packed:0},{meal:'pizza',packed:1},{meal:'pizza',packed:2},{meal:'pizza'},{meal:'pizza',bites:3},{meal:'pizza',bites:3,sips:2}]){await fixture('lunch',data);await inspect(`lunch-${data.meal||'choose'}-${data.packed??3}-${data.bites||0}-${data.sips||0}`,w,h,true);}
 for(const dish of ['pizza','pancakes','soup','smoothie']){const steps=await page.evaluate(d=>RR.RECIPES[d].steps,dish);for(const step of [0,steps.findIndex(s=>s.action==='choice'),steps.length]){await fixture('lunch-cook',{dish,step});await inspect(`my-lunch-${dish}-${step}`,w,h,true);}}
 for(const task of ['table-0','kitchen','sink','window-left','floor-0']){await fixture('clean',{task});await inspect(`clean-${task}`,w,h,task==='floor-0');}
 for(const data of [{},{equipped:true},{equipped:true,near:true}]){await fixture('mop',data);await inspect(`mop-${data.equipped?'held':'pickup'}-${data.near?'near':'far'}`,w,h,true);}
 const recipes=await page.evaluate(()=>Object.fromEntries(RR.MENU.map(d=>[d,{steps:RR.RECIPES[d].steps.map(s=>s.action),variants:RR.RECIPES[d].variants.map(v=>v.id)}])));
 for(const [dish,{steps,variants}] of Object.entries(recipes)){for(let step=0;step<=steps.length;step++){await fixture('cook',{dish,step});await inspect(`cook-${dish}-${step}-${steps[step]||'ready'}`,w,h,w===568||w===844);}for(const variant of variants.slice(1)){await fixture('cook',{dish,step:steps.length,variant});await inspect(`cook-${dish}-ready-${variant}`,w,h,w===568);}if(dish==='cupcake')for(const deco of ['stars','hearts']){await fixture('cook',{dish,step:steps.length,deco});await inspect(`cook-cupcake-ready-${deco}`,w,h,w===568);}}
 await fixture('world');await page.locator('#menu').click();await inspect('settings',w,h,true);await page.locator('[data-action=collection]').click();await inspect('collection',w,h,true);await page.locator('[data-action=resume]').click();await page.locator('#menu').click();await page.locator('[data-action=reset-question]').click();await inspect('reset-confirmation',w,h,true);await fixture('cook',{dish:'pizza',step:1});await page.locator('[data-action=restart-recipe]').click();await inspect('restart-confirmation',w,h,true);await fixture('cook',{dish:'pizza',step:1});await page.locator('[data-action=leave-kitchen]').click();await inspect('pause-cooking',w,h,true);
 }
 await browser.close();const report={method:'Isolated Chromium, actual built standalone; fixtures for every cooking step and other screens, five landscape sizes; DOM bounds, image containment and control hit-tests. No physical-device certification.',configurations:sizes,states:results.length,failed:results.filter(r=>r.issues.length).length,errors,results};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({states:report.states,failed:report.failed,errors,output:out,examples:results.filter(r=>r.issues.length).slice(0,12)},null,2));if(report.failed||errors.length)process.exitCode=1;
})();
