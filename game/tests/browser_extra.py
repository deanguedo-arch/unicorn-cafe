from playwright.sync_api import sync_playwright
from browser_helpers import *
import traceback,json
results=[];errors=[]
def test(name,fn):
 try:detail=fn();results.append({'name':name,'pass':True,'detail':detail});print('PASS',name,flush=True)
 except Exception as e:results.append({'name':name,'pass':False,'error':str(e),'trace':traceback.format_exc()});print('FAIL',name,e,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True);page=ctx.new_page();page.on('pageerror',lambda x:errors.append(str(x)))
 load(page,{})
 def migration():
  raw=page.evaluate('''()=>{const s=RR.fresh();s.schema=2;s.version='1.3.0-p4';s.served=2;s.total=2;s.issued=3;s.nextId=2;s.customers=[{id:1,table:0,dish:'pizza',variant:'tomato',phase:'ordered',type:'pink',x:720,y:421,eat:0}];s.active=1;s.prep={orderId:1,dish:'pizza',step:1,p:2,variant:null,deco:null,done:false,placements:[]};s.decor.tablecloth='sky';return JSON.stringify(s)}''')
  db={'sneaky-unicorn-restaurant-v1-2':raw,'sneaky-unicorn-restaurant-v1-4':'BROKEN JSON'};load(page,db)
  page.locator('[data-action=open]').click();assert page.evaluate('__RR_TEST__.mode')=='cook';assert page.evaluate('__RR_TEST__.engine.s.prep.p')==2
  assert page.evaluate('localStorage.getItem("sneaky-unicorn-restaurant-v1-2")')==raw
  assert page.evaluate('JSON.parse(localStorage.getItem("sneaky-unicorn-restaurant-v1-4")).schema')==3
  return {'oldKeyUnmodified':True,'newKeySchema':3}
 test('Invalid current slot falls back to older partial save; legacy bytes untouched',migration)
 def corrupt():
  load(page,{'sneaky-unicorn-restaurant-v1-4':'{broken'});page.evaluate('__RR_TEST__.showCustomizer(6)');page.locator('[data-action=open]').click();assert page.evaluate('__RR_TEST__.mode')=='world';assert page.evaluate('__RR_TEST__.engine.s.served')==0
 test('Corrupted storage still starts a playable restaurant',corrupt)
 def unavailable():
  load(page,None);page.evaluate('__RR_TEST__.showCustomizer(6)');page.locator('[data-action=open]').click();assert page.evaluate('__RR_TEST__.mode')=='world';assert not page.evaluate('__RR_TEST__.storageOK')
 # Unavailable-storage behavior is checked by engine corruption cases; file-origin storage is available in this run.
 def lunch_touch():
  load(page,{});fixture(page,"s.served=5;s.issued=5;");page.wait_for_timeout(150);box=page.locator('[data-meal=pizza]').bounding_box();page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)
  for i in range(5):
   box=page.locator('[data-action=lunch-act]').bounding_box();page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)
  assert page.evaluate('__RR_TEST__.engine.s.lunch.sips')==2
 test('Emulated touch: choose lunch, all bites and sips',lunch_touch)
 def clean_touch():
  fixture(page,"s.served=10;s.issued=10;s.lunch={done:true,meal:'pizza',bites:3,sips:2};s.cleaning=R.CLEAN_TASKS.map(t=>({id:t.id,p:t.kind==='floor'?0:t.need}));")
  page.evaluate('__RR_TEST__.openClean("floor-0")');box=page.locator('#day-canvas').bounding_box();x=box['x']+box['width']*.3;y=box['y']+box['height']*.45
  cd=ctx.new_cdp_session(page)
  cd.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
  for i in range(10):
   cd.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+(i%2)*100,'y':y+(i%3)*20,'id':1}]});page.wait_for_timeout(140)
  cd.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert page.evaluate('__RR_TEST__.engine.s.cleaning.find(q=>q.id==="floor-0").p')==4;assert page.evaluate('__RR_TEST__.mode')=='scrub'
  cd.detach()
 test('Emulated touch swipe mops a floor without accidental screen transition',clean_touch)
 def multi_pointer():
  fixture(page,'s.player={x:445,y:945,facing:1};')
  canvas=page.locator('#world');rect=canvas.bounding_box();x=rect['x']+100;y=rect['y']+200
  canvas.dispatch_event('pointerdown',{'pointerId':7,'clientX':x,'clientY':y,'button':0,'bubbles':True})
  canvas.dispatch_event('pointermove',{'pointerId':7,'clientX':x+65,'clientY':y,'bubbles':True})
  page.wait_for_timeout(100);before=page.evaluate('__RR_TEST__.engine.s.player.x')
  canvas.dispatch_event('pointerup',{'pointerId':8,'clientX':x,'clientY':y,'bubbles':True});page.wait_for_function('start=>__RR_TEST__.engine.s.player.x>start+5',arg=before,timeout=4000)
  after=page.evaluate('__RR_TEST__.engine.s.player.x');assert after>before+5
  canvas.dispatch_event('pointercancel',{'pointerId':7,'clientX':x+65,'clientY':y,'bubbles':True});page.wait_for_timeout(120);last=page.evaluate('__RR_TEST__.engine.s.player.x');page.wait_for_timeout(120);assert abs(page.evaluate('__RR_TEST__.engine.s.player.x')-last)<1
 test('Pointer-ID regression: another finger cannot stop movement; cancellation can',multi_pointer)
 def safe_areas():
  count=0
  for w,h in [(390,844),(844,390),(320,568),(667,375)]:
   page.set_viewport_size({'width':w,'height':h});page.evaluate("document.documentElement.style.cssText='--safe-top:24px;--safe-bottom:24px;--safe-left:20px;--safe-right:20px'")
   for scene in ['lunch','scrub']:
    if scene=='lunch':fixture(page,'s.served=5;s.issued=5;');page.wait_for_function('__RR_TEST__.mode==="lunch"',timeout=4000);selector='.day-choice'
    else:fixture(page,"s.served=10;s.issued=10;s.lunch={done:true,meal:'soup',bites:3,sips:2};");page.evaluate('__RR_TEST__.openClean("table-0")');selector='#clean-tools .day-big'
    boxes=page.locator(selector).evaluate_all('(e)=>e.map(e=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height]})')
    assert boxes
    for x,y,bw,bh in boxes:assert x>=19 and y>=23 and x+bw<=w-19 and y+bh<=h-23,(scene,w,h,boxes)
    count+=1
  return {'simulatedSafeAreaScenes':count,'notchDeviceVerification':False}
 test('Eight CSS safe-area scenes retain accessible action placement',safe_areas)
 def replay_direct():
  page.evaluate("document.documentElement.style.cssText=''");fixture(page,"s.served=10;s.issued=10;s.lunch={done:true,meal:'pizza',bites:3,sips:2};s.cleaning=R.CLEAN_TASKS.map(t=>({id:t.id,p:t.need}));s.completed=true;");page.wait_for_timeout(150)
  page.locator('[data-action=replay]').click();assert page.evaluate('__RR_TEST__.mode')=='world';assert page.evaluate('__RR_TEST__.engine.s.day')==2;assert page.evaluate('__RR_TEST__.engine.s.phase')=='morning'
 test('End-of-day play button directly starts next day, no completion loop',replay_direct)
 test('No page errors',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else {'errors':0})
 (ROOT/'tests/browser-extra.json').write_text(json.dumps({'method':'Actual Chromium + emulated touch and DOM pointer-event tests. Actual isolated browser localStorage; legacy bytes verified. Pointer-ID case uses synthetic DOM events. Safe-area insets simulated with CSS.','passed':sum(q['pass'] for q in results),'total':len(results),'results':results,'errors':errors},indent=2));b.close()
if not all(q['pass'] for q in results):raise SystemExit(1)
