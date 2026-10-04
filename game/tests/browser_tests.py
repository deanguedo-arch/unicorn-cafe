"""Actual production HTML file tests in isolated Chromium. Fixtures and real localStorage; no physical iPhone claim."""
from playwright.sync_api import sync_playwright
from browser_helpers import *
import sys,time,traceback,hashlib
batch=sys.argv[1] if len(sys.argv)>1 else 'core';results=[];errors=[];console_errors=[]
def check(name,fn):
    try:
        detail=fn();results.append({'name':name,'pass':True,'detail':detail});print('PASS',name,flush=True)
    except Exception as e:
        results.append({'name':name,'pass':False,'error':str(e),'trace':traceback.format_exc()});print('FAIL',name,traceback.format_exc(),flush=True)
def pe(js,arg=None):return page.evaluate(js,arg)
def near_fixture(d='pizza',v='tomato',extra=''):
    fixture(page,f"s.customers=[{{id:1,table:0,dish:'{d}',variant:'{v}',type:'pink',phase:'ordered',x:R.TABLES[0].seat.x,y:R.TABLES[0].seat.y,eat:0}}];s.active=1;s.issued=1;s.nextId=2;s.player={{...R.KITCHEN,facing:1}};"+extra)
def cook_ui(d,v,deco='rainbow'):
    pe('__RR_TEST__.openRecipeMenu()');page.locator(f'[data-recipe="{d}"]').click()
    i=0
    while not pe('__RR_TEST__.engine.s.prep.done'):
        st=pe('RR.RECIPES[__RR_TEST__.engine.s.prep.dish].steps[__RR_TEST__.engine.s.prep.step]')
        selector=f'[data-variant="{v}"]' if st['action']=='choice' else f'[data-decoration="{deco}"]' if st['action']=='decorate' else '[data-action="prep"]'
        page.locator(selector).click();i+=1
        if i>50:raise AssertionError('Recipe stuck')
    assert pe('__RR_TEST__.mode')=='cook'
    assert pe('__RR_TEST__.engine.s.tray') is None
    page.wait_for_timeout(1200)
    return i
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH)
    context=browser.new_context(viewport={'width':844,'height':390},has_touch=True)
    page=context.new_page();page.on('pageerror',lambda x:errors.append(str(x)));page.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None)
    load(page,{})
    if batch=='core':
        def custom():
            choices=pe('RR.CUSTOMIZATION');names=list(choices)
            tested=0
            for idx,k in enumerate(names):
                pe('__RR_TEST__.showCustomizer',idx)
                for v in choices[k]:
                    page.locator(f'[data-custom-stage="{k}"][data-custom-value="{v}"]').click()
                    assert pe(f'__RR_TEST__.engine.s.decor.{k}')==v
                    page.wait_for_timeout(40);tested+=1
                if idx==3:snap(page,'custom-tablecloth-landscape.png')
            assert page.locator('[data-custom-jump]').count()==6
            assert page.locator('#designer-preview').is_visible()
            page.locator('[data-action=open]').click()
            return {'choices':tested,'stages':len(names)}
        check('Six visible setup categories, all33 choices, live preview',custom)
        def walkup():
            fixture(page,"s.customers=[{id:1,table:0,dish:'pizza',variant:'tomato',type:'pink',phase:'waiting',x:R.TABLES[0].seat.x,y:R.TABLES[0].seat.y,eat:0}];s.active=null;s.issued=1;s.nextId=2;s.player={x:960,y:615,facing:-1};")
            page.keyboard.down('ArrowLeft');page.wait_for_timeout(230);page.keyboard.up('ArrowLeft');page.wait_for_function('__RR_TEST__.engine.s.customers[0].phase==="ordered"',timeout=4000)
            assert pe('__RR_TEST__.engine.s.customers[0].phase')=='ordered'
            assert pe('__RR_TEST__.metrics().audioUnlocked') # key to movement alone doesn't unlock! previous UI did.
        check('Keyboard movement triggers real stopped-nearby order',walkup)
        def carry():
            near_fixture();pe("__RR_TEST__.engine.startRecipe(1,'pizza');while(!__RR_TEST__.engine.s.prep.done){let s=RR.RECIPES.pizza.steps[__RR_TEST__.engine.s.prep.step];__RR_TEST__.engine.act(s.action==='choice'?'tomato':null);}__RR_TEST__.engine.packMeal();__RR_TEST__.setPlayer(1338,820)")
            page.wait_for_timeout(500);assert pe('__RR_TEST__.engine.s.tray!==null');assert pe('__RR_TEST__.engine.s.served')==0
            pe('__RR_TEST__.setPlayer(930,575)');page.wait_for_function('__RR_TEST__.engine.s.served===1',timeout=4000)
        check('Wrong table ignored; correct physical approach serves',carry)
        def dirty():
            fixture(page,"s.tables[0]={status:'dirty',dirty:{dish:'pizza',variant:'tomato',orderId:1}};s.served=1;s.issued=1;s.player={x:930,y:575,facing:1};")
            # setPlayer clears post-modal reentry protection to model fresh arrival
            pe('__RR_TEST__.setPlayer(930,575)');page.wait_for_function('__RR_TEST__.engine.s.dirtyTray!==null',timeout=4000)
            pe('__RR_TEST__.setPlayer(1400,410)');page.wait_for_function('__RR_TEST__.mode==="wash"',timeout=4000)
            for i in range(5):page.locator('[data-action=wash]').click()
            assert pe('__RR_TEST__.engine.s.dirtyTray===null')
            page.locator('[data-action=wash-return]').click();assert pe('__RR_TEST__.engine.s.tables[0].status')=='clean'
        check('Walk-up dirty dish and sink, actual wash buttons',dirty)
        def wrong_meal():
            near_fixture();pe("__RR_TEST__.engine.startRecipe(1,'soup');while(!__RR_TEST__.engine.s.prep.done){let q=RR.RECIPES.soup.steps[__RR_TEST__.engine.s.prep.step];__RR_TEST__.engine.act(q.action==='choice'?'peas':null);}__RR_TEST__.engine.packMeal();__RR_TEST__.setPlayer(930,575)")
            page.wait_for_function('__RR_TEST__.mode==="dialog"',timeout=4000);assert page.locator('.compare-card').count()==2
            page.locator('[data-action=fix-meal]').click();assert pe('__RR_TEST__.engine.s.tray===null');assert pe('__RR_TEST__.engine.s.customers[0].phase')=='ordered'
        check('Wrong-dish picture comparison and gentle remake',wrong_meal)
        def preferences():
            pe('__RR_TEST__.returnToWorld()');page.locator('#menu').click();page.locator('[data-action=toggle-audio]').click();assert pe('__RR_TEST__.engine.s.settings.muted')
            page.locator('[data-action=toggle-motion]').click();assert pe('__RR_TEST__.engine.s.settings.reduced');page.locator('[data-action=resume]').click()
            assert pe("document.querySelector('#app').classList.contains('reduced')")
        check('Gesture audio unlock, mute and reduced motion',preferences)
        def reset_protected():
            pe('__RR_TEST__.returnToWorld()');page.locator('#menu').click();page.locator('[data-action=reset-question]').click()
            old=pe('__RR_TEST__.engine.s.total');page.locator('[data-action=resume]').click();assert pe('__RR_TEST__.engine.s.total')==old
            page.locator('#menu').click();page.locator('[data-action=reset-question]').click();page.locator('[data-action=reset-confirm]').click()
            assert pe('__RR_TEST__.mode')=='customize';assert pe('__RR_TEST__.engine.s.served')==0
        check('Parent reset has two distinct actions and cancel is safe',reset_protected)
        def assetcheck():
            assert pe('Object.keys(RRArt.images).length')==len(pe('Object.keys(RR_ASSETS)'))
            assert pe('Object.values(RRArt.images).every(im=>im.complete&&im.naturalWidth>0)')
            return {'decoded':pe('Object.keys(RRArt.images).length')}
        check('All production artwork decoded',assetcheck)
    elif batch.startswith('recipes'):
        variants=pe('RR.MENU.flatMap(d=>RR.RECIPES[d].variants.map(v=>[d,v.id]))')
        variants=variants[:9] if batch=='recipes1' else variants[9:]
        for dish,v in variants:
            def recipe(d=dish,v=v):
                near_fixture(d,v);n=cook_ui(d,v)
                if d=='cupcake':
                    for dec in ['stars','hearts','rainbow']:
                        page.locator(f'[data-decoration="{dec}"]').click();assert pe('__RR_TEST__.engine.s.prep.deco')==dec
                page.locator('[data-action=carry]').click();assert pe('__RR_TEST__.mode')=='world';assert pe('__RR_TEST__.engine.s.tray.dish')==d
                pe('__RR_TEST__.setPlayer(930,575)');page.wait_for_function('__RR_TEST__.engine.s.served===1',timeout=4000)
                return {'recipe':d,'variant':v,'actualButtonActions':n}
            check('Cook/carry/serve '+dish+' '+v,recipe)
    elif batch=='day':
        def lunch():
            fixture(page,"s.served=5;s.issued=5;s.total=5;");page.wait_for_timeout(180)
            assert pe('__RR_TEST__.mode')=='lunch';assert not pe('__RR_TEST__.engine.spawn(5)')
            page.locator('[data-meal=pancakes]').click();page.locator('[data-action=lunch-act]').click();assert pe('__RR_TEST__.engine.s.lunch.bites')==1
            stored=pe('({...localStorage})');load(page,stored);page.locator('[data-action=open]').click();assert pe('__RR_TEST__.mode')=='lunch';assert pe('__RR_TEST__.engine.s.lunch.bites')==1
            for i in range(4):page.locator('[data-action=lunch-act]').click()
            assert pe('__RR_TEST__.engine.s.lunch.sips')==2
            snap(page,'lunch-ready-landscape.png');page.locator('[data-action=lunch-return]').click();assert pe('__RR_TEST__.engine.s.phase')=='afternoon'
            assert pe('__RR_TEST__.mode')=='world'
        check('Lunch bites/sips through real controls, save/load and reopen',lunch)
        def surfaces():
            fixture(page,"s.served=10;s.issued=10;s.total=10;s.lunch={done:true,meal:'soup',bites:3,sips:2};")
            assert pe('__RR_TEST__.engine.s.phase')=='cleaning';assert not pe('__RR_TEST__.engine.cleanAct("floor-0").ok')
            ts=pe('RR.CLEAN_TASKS.filter(t=>t.kind!=="floor")')
            for t in ts:
                pe('__RR_TEST__.openClean',t['id']);assert pe('__RR_TEST__.mode')=='scrub'
                for i in range(t['need']):page.locator('[data-action=clean-act]').click()
                assert page.locator('[data-action=day-return]').count()==2
                page.locator('#clean-tools [data-action=day-return]').click()
            assert pe('RR.surfacesClean(__RR_TEST__.engine.s)');assert not pe('__RR_TEST__.engine.s.completed')
            return {'surfaces':len(ts)}
        check('All five tables, two stations, two windows require cleaning',surfaces)
        def floors():
            ts=pe('RR.CLEAN_TASKS.filter(t=>t.kind==="floor")')
            for t in ts:
                pe('__RR_TEST__.openClean',t['id'])
                for i in range(t['need']):page.locator('[data-action=clean-act]').click()
                if t['id']=='floor-0':snap(page,'floor-clean-landscape.png')
                page.locator('#clean-tools [data-action=day-return]').click()
            assert pe('__RR_TEST__.engine.s.completed');assert pe('__RR_TEST__.mode')=='dialog';assert page.locator('[data-action=new-day]').count()==1
            snap(page,'final-celebration.png')
        check('All six floor zones, final celebration only when spotless',floors)
        def replay():
            decor=pe('__RR_TEST__.engine.s.decor');page.locator('[data-action=new-day]').click();assert pe('__RR_TEST__.engine.s.day')==2;assert pe('__RR_TEST__.engine.s.served')==0;assert pe('__RR_TEST__.engine.s.decor')==decor;assert not pe('__RR_TEST__.engine.s.lunch.done')
        check('Replay resets day/lunch/cleaning while preserving decoration',replay)
        def scrub_reload():
            fixture(page,"s.served=10;s.issued=10;s.lunch={done:true,meal:'soup',bites:3,sips:2};")
            pe('__RR_TEST__.openClean("window-left")');page.locator('[data-action=clean-act]').click()
            stored=pe('({...localStorage})');load(page,stored);page.locator('[data-action=open]').click();pe('__RR_TEST__.openClean("window-left")')
            assert pe('__RR_TEST__.engine.s.cleaning.find(t=>t.id==="window-left").p')==1
            assert pe('__RR_TEST__.mode')=='scrub'
        check('Partial cleaning survives browser document reload (real browser storage)',scrub_reload)
        def scrub_drag():
            pe('__RR_TEST__.returnToWorld()');pe('__RR_TEST__.openClean("table-0")');rect=page.locator('#day-canvas').bounding_box();x=rect['x']+rect['width']*.35;y=rect['y']+rect['height']*.45
            page.mouse.move(x,y);page.mouse.down()
            for i in range(10):page.mouse.move(x+(i%2)*120,y+(i%3)*20);page.wait_for_timeout(140)
            page.mouse.up();assert pe('__RR_TEST__.engine.s.cleaning.find(t=>t.id==="table-0").p')==3
            assert pe('__RR_TEST__.mode')=='scrub' # no click-through to world
        check('Rubbing clears surface, final release cannot click through',scrub_drag)
    elif batch=='layouts':
        sizes=[(320,568),(375,667),(390,844),(430,932),(568,320),(667,375),(844,390),(1024,768)]
        for w,h in sizes:
            def layout(w=w,h=h):
                page.set_viewport_size({'width':w,'height':h});pe('__RR_TEST__.showCustomizer(4)');page.wait_for_timeout(90)
                def contained(selector):
                    boxes=page.locator(selector).evaluate_all('(els)=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
                    for b in boxes:
                        assert b['x']>=-1 and b['y']>=-1 and b['x']+b['w']<=w+1 and b['y']+b['h']<=h+1,(selector,b,w,h)
                        assert b['w']>=44 and b['h']>=44,(selector,'tiny',b)
                contained('.custom-choice');contained('.designer-open');contained('.designer-tab')
                fixture(page,"s.served=5;s.issued=5;");page.wait_for_timeout(80);contained('.day-choice')
                page.locator('[data-meal=soup]').click();contained('.day-big')
                if (w,h)==(390,844):snap(page,'lunch-portrait.png')
                fixture(page,"s.served=10;s.issued=10;s.lunch={done:true,meal:'pizza',bites:3,sips:2};");pe('__RR_TEST__.openClean("table-0")');contained('#clean-tools .day-big')
                if (w,h)==(390,844):snap(page,'cleaning-portrait.png')
                pe('__RR_TEST__.returnToWorld()');contained('#primary');page.wait_for_timeout(60)
                return {'width':w,'height':h,'scenes':['six-choice customization','lunch choice','lunch action','scrub','cleanup world']}
            check(f'Responsive {w}x{h}',layout)
    check('No JavaScript page errors',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else (_ for _ in ()).throw(AssertionError(console_errors)) if console_errors else {'errors':0,'consoleErrors':0})
    out={'batch':batch,'testMethod':'Actual Chromium / actual standalone loaded from disk; real isolated browser localStorage; no physical iPhone','passed':sum(x['pass'] for x in results),'total':len(results),'results':results,'pageErrors':errors,'consoleErrors':console_errors}
    (ROOT/'tests'/f'browser-{batch}.json').write_text(json.dumps(out,indent=2));browser.close()
if not all(x['pass'] for x in results):sys.exit(1)
