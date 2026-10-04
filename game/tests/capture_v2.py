from browser_helpers import *
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);p=b.new_page(viewport={'width':1180,'height':780});load(p,{})
 p.evaluate('__RR_TEST__.showCustomizer(3)');p.wait_for_timeout(150);snap(p,'v2-designer-desktop.png')
 fixture(p,"s.player={x:980,y:670,facing:1};s.customers=[{id:1,table:0,dish:'pizza',variant:'tomato',type:'pink',phase:'ordered',x:720,y:421,eat:0}];s.issued=1;s.nextId=2;s.active=1;");p.wait_for_timeout(500);snap(p,'v2-world-desktop.png')
 for d,v in [('pizza','tomato'),('icecream','strawberry')]:
  fixture(p,f"s.customers=[{{id:1,table:0,dish:'{d}',variant:'{v}',type:'pink',phase:'ordered',x:720,y:421,eat:0}}];s.issued=1;s.nextId=2;s.active=1;s.prep={{orderId:1,dish:'{d}',step:R.RECIPES['{d}'].steps.length,p:0,variant:'{v}',deco:'rainbow',done:true,placements:[{{x:.3,y:.4}},{{x:.55,y:.65}},{{x:.7,y:.45}}]}};")
  p.evaluate('__RR_TEST__.openCooking()');p.wait_for_timeout(250);snap(p,f'v2-{d}-desktop.png')
 fixture(p,"s.tables[0]={status:'carried',dirty:null};s.dirtyTray={table:0,dish:'pizza',variant:'tomato',orderId:1,wash:2};s.served=1;s.issued=1;");p.evaluate('__RR_TEST__.openWash()');p.wait_for_timeout(180);snap(p,'v2-wash-desktop.png')
 p.set_viewport_size({'width':320,'height':568});p.evaluate('__RR_TEST__.showCustomizer(3)');p.wait_for_timeout(100);snap(p,'v2-designer-small-phone.png')
 b.close()
