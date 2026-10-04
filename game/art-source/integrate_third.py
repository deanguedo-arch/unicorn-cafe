from PIL import Image
from pathlib import Path
from crop_util import main_bounds
import json
root=Path(__file__).resolve().parents[1];dest=root/'working-v2/build/assets';im=Image.open(root/'production-art/ChatGPT-B-Chicken-Pancakes-Smoothie.png').convert('RGBA');print(im.size)
boxes={
'chicken_raw':(15,85,266,362),'chicken_wedge':(270,85,472,362),'chicken_glaze':(482,85,729,362),'chicken_roast':(734,85,988,362),'veg_peas':(1005,135,1209,354),'veg_corn':(1225,135,1435,354),
'pancake_batter':(12,398,298,641),'pancake_raw':(301,418,558,634),'pancake_brown':(560,418,824,634),'fruit_berries':(826,425,1042,637),'fruit_banana':(1050,449,1225,634),'pancake_syrup':(1230,460,1437,637),
'smoothie_blender':(22,648,323,1042),'fruit_strawberry':(327,788,511,994),'fruit_mango':(532,788,715,994),'smoothie_strawberry':(725,717,952,1042),'smoothie_mango':(966,717,1199,1042),'smoothie_milk':(1205,717,1442,1042)}
for key,box in boxes.items():
 piece=im.crop(box);piece=piece.crop(main_bounds(piece));piece.save(dest/(key+'.webp'),'WEBP',lossless=True);print(key,piece.size)
assets={p.stem:'./assets/'+p.name for p in sorted(dest.glob('*.webp'))};(root/'working-v2/build/src/assets.js').write_text('window.RR_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n');(root/'production-art/SPRITE-MAP-THIRD.json').write_text(json.dumps({'source':'ChatGPT-B-Chicken-Pancakes-Smoothie.png','boxes':boxes},indent=2))
