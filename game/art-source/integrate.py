from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];dest=root/'working-v2/build/assets';im=Image.open(root/'production-art/ChatGPT-B-Kitchen-Pizza-Icecream.png').convert('RGBA')
print(im.size)
boxes={'painted_kitchen':(80,55,1375,409),'pizza_dough':(18,480,285,709),'pizza_sauce':(280,480,536,709),'pizza_cheese':(539,480,793,709),'pizza_tomato':(792,530,960,697),'pizza_mushroom':(961,530,1129,695),'prep_board':(1135,480,1438,710),'ice_cone':(231,746,443,1049),'ice_strawberry':(484,790,720,1020),'ice_vanilla':(754,790,989,1020),'ice_sprinkles':(1025,820,1253,1008)}
# Coordinates measured from inspected sheet; original preserved. Trim transparent margins only.
for key,box in boxes.items():
 piece=im.crop(box);bb=piece.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();piece=piece.crop(bb);piece.save(dest/(key+'.webp'),'WEBP',lossless=True)
 print(key,piece.size)
assets={p.stem:'./assets/'+p.name for p in sorted(dest.glob('*.webp'))};(root/'working-v2/build/src/assets.js').write_text('window.RR_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n')
(root/'production-art/SPRITE-MAP.json').write_text(json.dumps({'source':'ChatGPT-B-Kitchen-Pizza-Icecream.png','chat':'https://chatgpt.com/c/6ac268d3-2ab8-83e8-95ba-79c3f3972af1','boxes':boxes},indent=2))
