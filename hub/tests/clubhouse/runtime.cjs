/* Runtime method contracts for the clubhouse UI without a DOM/browser dependency. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../shared/clubhouse.js'),'utf8');
const document={hidden:false,addEventListener(){}};
const callbacks=[];
const context={document,innerHeight:500,innerWidth:800,matchMedia:()=>({matches:false}),
  addEventListener(){},requestAnimationFrame(fn){callbacks.push(fn);return callbacks.length;},cancelAnimationFrame(){},
  performance:{now:()=>1000},console,Map,Set,Math,JSON,Date,Error,Promise,Array,Object,Number,String,RegExp,setTimeout,clearTimeout,
  window:null,globalThis:null};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(source,context);
const Clubhouse=context.UWClubhouse;
const blank=()=>({version:1,ops:[]});
const make=()=>{const c=Object.create(Clubhouse.prototype);c.kind='art';c.art={id:null,revision:0,picture:blank(),edit:0,ack:0,loaded:true,error:null};c.gallery=null;c.finishing=false;c.draftSaving=null;c.paper={setAttribute(){}};c.backup=()=>{};c.removeBackup=()=>{};c.paintPaper=()=>{};c.artControls=()=>{};c.queueDraft=()=>{};c.notice=()=>{};c.status=()=>{};c.refreshStack=()=>{};c.w={draw(){}};c.epoch=1;c.root=null;return c;};
let count=0;const pass=name=>{count++;console.log('PASS',name);};
(async()=>{
 {
  const c=make();let calls=0;c.service={value:{clubhouse:{draft:null}},async run(action,args){calls++;assert.equal(action,'clubhouse-draft');return {value:{id:args.id,revision:args.expectedRevision+1}};}};
  assert.equal(await c.saveDraft(),true);assert.equal(calls,0,'opening a blank canvas must not create an empty draft receipt');
  assert.equal(c.addMark({tool:'stamp',shape:'heart',color:'#ed87b8',x:.4,y:.5,size:.15}),true);
  assert.equal(await c.saveDraft(true),true);assert.equal(calls,1);assert.equal(c.art.picture.ops.length,1);
  pass('Blank art reopen remains receipt-free until drawing, then saves that drawing');
 }
 {
  const c=make();c.addMark({tool:'stamp',shape:'flower',color:'#ed87b8',x:.2,y:.2,size:.15});
  c.addMark({tool:'stamp',shape:'rainbow',color:'#8e79c7',x:.8,y:.8,size:.15});
  const node={hasPointerCapture:()=>false,releasePointerCapture(){}};
  c.pointer={id:1,node,type:'art',tool:'brush',color:'#6dbbaa',points:[[.1,.1],[.2,.3]],point:{x:.2,y:.3}};
  c.endPointer(null,true);assert.equal(c.art.picture.ops.length,3);assert.equal(JSON.stringify(c.art.picture.ops.slice(0,2).map(x=>x.shape)),JSON.stringify(['flower','rainbow']));assert.equal(JSON.stringify(c.art.picture.ops[2].points),JSON.stringify([[.1,.1],[.2,.3]]));
  pass('Suspending an in-flight brush stroke retains its preview and earlier marks');
 }
 {
  const c=make();c.gallery={id:'a',picture:{version:1,ops:[]}};c.root={dataset:{gallery:'true'},querySelector(selector){if(selector==='.uwc-gallery-nav')return {hidden:false};return {setAttribute(){}};}};c.paper={setAttribute(){}};
  c.leaveGallery();assert.equal(c.gallery,null);assert.equal(Object.hasOwn(c.root.dataset,'gallery'),false);
  pass('Leaving the saved-picture gallery clears gallery state for a later reopen');
 }
 {
  const c=make();let backups=0;c.backup=()=>backups++;c.service={value:{clubhouse:{draft:null}},async run(){const e=new Error('conflict');e.code='conflict';throw e;}};
  c.addMark({tool:'stamp',shape:'heart',color:'#ed87b8',x:.5,y:.5,size:.15});const saved=JSON.stringify(c.art.picture);assert.equal(await c.saveDraft(true),false);assert.equal(JSON.stringify(c.art.picture),saved);assert.equal(c.art.error.code,'conflict');assert.ok(backups>0);
  pass('Failed draft saves keep all marks locally for recovery');
 }
 {
  const c=make();c.kind='puppets';c.states={puppets:{friend:'pink'}};let saved=0;c.changeConfig=()=>saved++;c.sound=()=>{};c.announce=()=>{};c.click({dataset:{uwc:'wave'}});assert.equal(saved,1);assert.equal(c.action,'wave');
  pass('Puppet actions persist the default friend configuration');
 }
 {
  const c=make();c.kind='ball';c.action='play';c.actionAge=4.99;c.last=1000;c.raf=0;c.noteIndex=2;c.ballLanded=false;c.drawScene=()=>{};c.reduced=()=>false;c.sound=()=>{};
  c.start();callbacks.shift()(1050);assert.equal(c.ballLanded,true);assert.equal(c.action,null);
  pass('Ball animation reaches and retains the terminal basket state');
 }
 console.log(`${count} clubhouse UI runtime checks passed`);
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
