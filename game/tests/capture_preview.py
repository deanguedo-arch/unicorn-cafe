from browser_helpers import *
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=CHROMIUM_PATH);p=b.new_page(viewport={'width':1180,'height':780});load(p,{})
 fixture(p,"s.decor={flooring:'moonstone',wallpaper:'starlight',tableType:'cloud',tablecloth:'rainbow',decoration:'plant',chairs:'sky'};s.player={x:980,y:670,facing:1};s.customers=[{id:1,table:0,dish:'pizza',variant:'tomato',type:'pink',phase:'ordered',x:720,y:421,eat:0},{id:2,table:1,dish:'pancakes',variant:'berries',type:'human',phase:'waiting',x:1233,y:649,eat:0},{id:3,table:2,dish:'smoothie',variant:'mango',type:'blue',phase:'waiting',x:188,y:684,eat:0}];s.issued=3;s.nextId=4;s.active=1;");p.wait_for_timeout(180);snap(p,'final-world.png')
 fixture(p,"s.served=10;s.issued=10;s.total=10;s.lunch={done:true,meal:'pizza',bites:3,sips:2};s.player={x:980,y:670,facing:1};s.cleaning=R.CLEAN_TASKS.map(t=>({id:t.id,p:t.kind==='floor'?0:t.need}));");p.wait_for_timeout(150);snap(p,'final-floor-targets.png')
 b.close()
# Documentary preview sheet, not generated game-concept artwork.
frames=[('final-world.png','Restaurant and new decor'),('04-lunch-pancakes.png','Halfway lunch break'),('05-clean-table.png','Wipe every surface'),('final-floor-targets.png','Mop the restaurant to finish')]
canvas=Image.new('RGB',(1440,1040),'#f8efdF');draw=ImageDraw.Draw(canvas)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
draw.text((22,14),'Rainbow Restaurant v1.4.0  |  actual production-renderer captures',font=font,fill='#593e6d')
for i,(name,label) in enumerate(frames):
 im=Image.open(ROOT/'tests'/name).convert('RGB');im.thumbnail((698,447),Image.Resampling.LANCZOS);x=15+(i%2)*715;y=64+(i//2)*479;canvas.paste(im,(x+(698-im.width)//2,y));draw.text((x+8,y+451),label,font=small,fill='#593e6d')
canvas.save(ROOT/'Preview.jpg',quality=90,optimize=True)
