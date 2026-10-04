from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];report={}
server=subprocess.Popen([sys.executable,'-m','http.server','8769','--bind','127.0.0.1','--directory',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=os.environ['CHROMIUM_PATH']);ctx=b.new_context();p=ctx.new_page();p.goto('http://127.0.0.1:8769/pages/index.html?qa=1');p.wait_for_function('window.__RR_TEST__ && __RR_TEST__.mode===\"customize\"');p.wait_for_function('__RR_TEST__.offlineReady',timeout=20000);p.reload();p.wait_for_function('!!navigator.serviceWorker.controller',timeout=20000)
  version=p.evaluate('RR.VERSION');cache=p.evaluate('caches.keys()');ctx.set_offline(True);p.reload();p.wait_for_function('window.__RR_TEST__ && __RR_TEST__.mode===\"customize\"',timeout=20000);assert p.evaluate('RR.VERSION')==version;p.locator('[data-action=open]').click();assert p.evaluate('__RR_TEST__.mode')=='world'
  report={'passed':True,'version':version,'method':'Actual Pages index served at localhost /pages/, real service worker installed, network disabled and reloaded, then picture Play clicked','caches':cache,'physicalIPhone':False};p.screenshot(path=str(ROOT/'tests/pwa-offline-world.png'));b.close()
finally:
 server.terminate();server.wait(timeout=5)
(ROOT/'tests/pwa-real.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
