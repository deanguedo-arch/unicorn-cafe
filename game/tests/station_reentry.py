from browser_helpers import *
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);p=b.new_page(viewport={'width':844,'height':390});load(p,{})
 fixture(p,"s.customers=[{id:1,table:0,dish:'pizza',variant:'tomato',type:'pink',phase:'ordered',x:720,y:421,eat:0}];s.issued=1;s.nextId=2;s.active=1;s.pace.next=99999;")
 p.evaluate('__RR_TEST__.setPlayer(RR.KITCHEN.x,RR.KITCHEN.y)');p.wait_for_function('__RR_TEST__.mode===\"recipes\"',timeout=10000);p.locator('[data-action=leave-kitchen]').click();p.wait_for_timeout(1800);assert p.evaluate('__RR_TEST__.mode')=='world';assert p.evaluate('__RR_TEST__.metrics().auto.inside')
 p.keyboard.down('ArrowDown');p.wait_for_function('Math.hypot(__RR_TEST__.engine.s.player.x-RR.KITCHEN.x,__RR_TEST__.engine.s.player.y-RR.KITCHEN.y)>155',timeout=5000);p.keyboard.up('ArrowDown');p.wait_for_timeout(100);assert not p.evaluate('__RR_TEST__.metrics().auto.inside')
 p.keyboard.down('ArrowUp');p.wait_for_function('__RR_TEST__.engine.s.player.y<RR.KITCHEN.y+80',timeout=5000);p.keyboard.up('ArrowUp');p.wait_for_function('__RR_TEST__.mode===\"recipes\"',timeout=5000)
 report={'passed':True,'method':'Actual standalone Chromium, close menu while still in station does not repeat; actual keyboard exit and return triggers once after stopping'};b.close()
(ROOT/'tests/station-reentry.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
