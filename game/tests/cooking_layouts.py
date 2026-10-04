from browser_helpers import *
from playwright.sync_api import sync_playwright
import json
results=[];errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);p=b.new_page();p.on('pageerror',lambda e:errors.append(str(e)));load(p,{})
 for w,h in [(320,568),(390,844),(568,320),(844,390)]:
  p.set_viewport_size({'width':w,'height':h})
  for d in p.evaluate('RR.MENU'):
   v=p.evaluate('d=>RR.RECIPES[d].variants[0].id',d)
   for stage in ['choice','done']:
    step=p.evaluate('d=>RR.RECIPES[d].steps.findIndex(s=>s.action===\"choice\")',d) if stage=='choice' else p.evaluate('d=>RR.RECIPES[d].steps.length',d)
    fixture(p,f"s.customers=[{{id:1,table:0,dish:'{d}',variant:'{v}',type:'pink',phase:'ordered',x:720,y:421,eat:0}}];s.issued=1;s.nextId=2;s.active=1;s.prep={{orderId:1,dish:'{d}',step:{step},p:0,variant:{repr(v) if stage=='done' else 'null'},deco:'rainbow',done:{str(stage=='done').lower()},placements:[]}};")
    p.evaluate('__RR_TEST__.openCooking()');p.wait_for_timeout(30)
    boxes=p.locator('.cook-tools button').evaluate_all('(es)=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
    for box in boxes:assert box['x']>=0 and box['y']>=0 and box['x']+box['w']<=w+.5 and box['y']+box['h']<=h+.5 and box['w']>=44 and box['h']>=44,(w,h,d,stage,box)
    # Actual hit-test catches cards intercepting decoration buttons.
    assert p.locator('.cook-tools button').evaluate_all('(es)=>es.every(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===e||e.contains(hit)})'),(w,h,d,stage,'obscured')
    results.append({'width':w,'height':h,'recipe':d,'stage':stage,'pass':True})
 b.close()
assert not errors
(ROOT/'tests/cooking-layouts.json').write_text(json.dumps({'passed':len(results),'total':72,'method':'Actual standalone Chromium, interactive button bounds44px and DOM hit-tests, four phone dimensions nine recipes choice and ready states','results':results,'errors':errors},indent=2));print('PASS72 cooking layout states')
