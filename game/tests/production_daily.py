from browser_helpers import *
from playwright.sync_api import sync_playwright
import json
report={};errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);p=b.new_page(viewport={'width':844,'height':390});p.on('pageerror',lambda e:errors.append(str(e)));load(p,{});p.locator('[data-action=open]').click();fixture(p,'s.pace.next=99999;s.pace.remaining=99999;')
 # Faster deterministic QA timing: fixtures skip customer walking/eating waits, while all recipe/serve/wash/day controls run in the production browser.
 dishes=[]
 for num in range(10):
  if num==5:
   p.wait_for_function('__RR_TEST__.mode===\"lunch\"',timeout=5000);p.locator('[data-meal=pizza]').click()
   for i in range(5):p.locator('[data-action=lunch-act]').click()
   p.locator('[data-action=lunch-return]').click()
  d=['pizza','icecream','burger','cupcake','soup','coffee','chicken','pancakes','smoothie','pizza'][num]
  v=p.evaluate('d=>RR.RECIPES[d].variants[0].id',d)
  p.evaluate("q=>{const e=__RR_TEST__.engine;s=e.s;s.pace.next=99999;s.pace.remaining=99999;const c=e.spawn(1);if(!c)throw Error('No guest');c.dish=q.d;c.variant=q.v;e.arrive(c.id);__RR_TEST__.setPlayer(RR.TABLES[c.table].meet.x,RR.TABLES[c.table].meet.y);}",{'d':d,'v':v})
  p.wait_for_function('__RR_TEST__.engine.s.customers.some(c=>c.phase===\"ordered\")',timeout=5000)
  p.evaluate('__RR_TEST__.setPlayer(RR.KITCHEN.x,RR.KITCHEN.y)');p.wait_for_function('__RR_TEST__.mode===\"recipes\"',timeout=5000);p.locator(f'[data-recipe="{d}"]').click()
  while not p.evaluate('__RR_TEST__.engine.s.prep.done'):
   action=p.evaluate('RR.RECIPES[__RR_TEST__.engine.s.prep.dish].steps[__RR_TEST__.engine.s.prep.step].action')
   selector=f'[data-variant="{v}"]' if action=='choice' else '[data-decoration=rainbow]' if action=='decorate' else '[data-action=prep]';p.locator(selector).click()
  p.wait_for_timeout(1500);p.locator('[data-action=carry]').click();p.wait_for_function('__RR_TEST__.mode===\"world\"',timeout=5000)
  p.evaluate('()=>{const c=__RR_TEST__.engine.customer(__RR_TEST__.engine.s.tray.orderId);const m=RR.TABLES[c.table].meet;__RR_TEST__.setPlayer(m.x,m.y)}');p.wait_for_function(f'__RR_TEST__.engine.s.served==={num+1}',timeout=5000)
  # Advance deterministic engine eating/exit timing to avoid ten long idle waits.
  p.evaluate('()=>{const e=__RR_TEST__.engine;for(const c of [...e.s.customers]){e.finishEating(c.id);e.startLeaving(c.id);e.remove(c.id)}}');p.evaluate('()=>{const i=__RR_TEST__.engine.s.tables.findIndex(t=>t.status===\"dirty\");const m=RR.TABLES[i].meet;__RR_TEST__.setPlayer(m.x,m.y)}');p.wait_for_function('__RR_TEST__.engine.s.dirtyTray!==null',timeout=5000)
  p.evaluate('__RR_TEST__.setPlayer(RR.SINK.x,RR.SINK.y)');p.wait_for_function('__RR_TEST__.mode===\"wash\"',timeout=5000)
  for i in range(5):p.locator('[data-action=wash]').click()
  p.locator('[data-action=wash-return]').click();p.evaluate('()=>{const e=__RR_TEST__.engine;for(const c of [...e.s.customers]){e.finishEating(c.id);e.startLeaving(c.id);e.remove(c.id)}}');dishes.append(d);print('DAY GUEST',num+1,d,flush=True)
 p.wait_for_function('__RR_TEST__.engine.s.phase===\"cleaning\"',timeout=5000)
 for task in p.evaluate('RR.CLEAN_TASKS.map(t=>({id:t.id,need:t.need}))'):
  p.evaluate('__RR_TEST__.openClean',task['id'])
  for i in range(task['need']):p.locator('[data-action=clean-act]').click()
  p.locator('#clean-tools [data-action=day-return]').click()
 p.wait_for_function('__RR_TEST__.engine.s.completed',timeout=5000);p.screenshot(path=str(ROOT/'tests/v2-daily-complete.png'))
 report={'passed':True,'method':'Actual standalone browser; all10 guests through actual recipe, carry, wash, lunch and cleanup buttons. Deterministic QA spawn and timer acceleration; player positions set to station for dwell. Not unassisted child-play or physical-device testing.','dishes':dishes,'surfaces':9,'floorZones':6,'pageErrors':errors};assert not errors;b.close()
(ROOT/'tests/production-daily.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
