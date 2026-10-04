from pathlib import Path
import json,os,shutil
CHROMIUM_PATH=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'pages/index.html').read_text()
# Actual built standalone loaded from disk in an isolated Chromium context.
# Fixtures set game state; browser storage is real, never replaced with a mock.
def load(page,storage=None):
    # Seed actual isolated storage before app boot; pagehide cannot overwrite it.
    if not getattr(page,'_rr_seed_script',False):
        page.add_init_script("""(()=>{try{const seed=JSON.parse(window.name||'null');if(seed&&seed.__rrQASeed){localStorage.clear();for(const [k,v] of Object.entries(seed.__rrQASeed))localStorage.setItem(k,v);window.name='';}}catch(e){}})()""")
        page._rr_seed_script=True
    page.goto('about:blank')
    if storage is not None:page.evaluate("data=>{window.name=JSON.stringify({__rrQASeed:data})}",storage)
    page.goto((ROOT/'Sneaky-Unicorn-Restaurant-v2.0.0.html').as_uri()+'?qa=1',wait_until='load',timeout=30000)
    page.wait_for_function("window.__RR_TEST__ && __RR_TEST__.mode==='customize'",timeout=25000)
    page.wait_for_timeout(100)
def fixture(page,js):
    page.evaluate("src=>{let s=RR.fresh();(new Function('s','R',src))(s,RR);__RR_TEST__.loadFixture(s);}",js)
    page.wait_for_timeout(40)
def snap(page,name):
    page.screenshot(path=str(ROOT/'tests'/name))
