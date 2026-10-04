from browser_helpers import *
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);p=b.new_page(viewport={'width':844,'height':390});load(p,{})
 for d in p.evaluate('RR.MENU'):
  v=p.evaluate('d=>RR.RECIPES[d].variants[0].id',d)
  fixture(p,f"s.customers=[{{id:1,table:0,dish:'{d}',variant:'{v}',type:'pink',phase:'ordered',x:720,y:421,eat:0}}];s.issued=1;s.nextId=2;s.active=1;s.prep={{orderId:1,dish:'{d}',step:R.RECIPES['{d}'].steps.length,p:0,variant:'{v}',deco:'rainbow',done:true,placements:[{{x:.3,y:.4}},{{x:.55,y:.65}},{{x:.7,y:.45}}]}};")
  p.evaluate('__RR_TEST__.openCooking()');p.wait_for_timeout(180);snap(p,f'v2-food-{d}.png')
 b.close()
files=list((ROOT/'tests').glob('v2-food-*.png'));sheet=Image.new('RGB',(1266,645),'#fff4df');draw=ImageDraw.Draw(sheet)
for i,f in enumerate(files):
 im=Image.open(f);im.resize((422,195)).save(ROOT/'tests'/('thumb-'+f.name));sheet.paste(im.resize((422,195)),(i%3*422,i//3*215));draw.text((i%3*422+8,i//3*215+199),f.stem.removeprefix('v2-food-'),fill='#543663')
sheet.save(ROOT/'tests/v2-all-foods-preview.png')
