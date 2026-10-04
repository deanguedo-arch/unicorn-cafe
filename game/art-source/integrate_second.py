from PIL import Image
from crop_util import main_bounds
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];dest=root/'working-v2/build/assets';im=Image.open(root/'production-art/ChatGPT-B-Coffee-Cupcake-Burger-Soup.png').convert('RGBA');print(im.size)
# Pixel-inspected row/column bounds, deliberately excluding adjoining silhouettes.
cols=[(12,293),(300,580),(585,845),(845,1128),(1129,1415)]
rows=[(48,338),(335,591),(619,823),(845,1080)]
keys=[['coffee_beans','coffee_empty','coffee_black','coffee_milk','coffee_cocoa'],['cupcake_flour','cupcake_batter','cupcake_plain','cupcake_strawberry','cupcake_cocoa'],['burger_bottom','burger_patty','burger_cheese','burger_lettuce','burger_top'],['soup_empty','soup_broth','soup_carrot','soup_peas','soup_chunk']]
boxes={}
for j,row in enumerate(keys):
 for i,key in enumerate(row):
  x0,x1=([(12,290),(290,570),(570,850),(850,1130),(1145,1390)] if j==3 else [(10,285),(295,557),(563,842),(847,1125),(1128,1395)] if j==2 else cols)[i];y0,y1=rows[j];piece=im.crop((x0,y0,x1,y1));bb=main_bounds(piece);piece=piece.crop(bb);piece.save(dest/(key+'.webp'),'WEBP',lossless=True);boxes[key]=[x0,y0,x1,y1];print(key,piece.size)
assets={p.stem:'./assets/'+p.name for p in sorted(dest.glob('*.webp'))};(root/'working-v2/build/src/assets.js').write_text('window.RR_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n');(root/'production-art/SPRITE-MAP-SECOND.json').write_text(json.dumps({'source':'ChatGPT-B-Coffee-Cupcake-Burger-Soup.png','boxes':boxes},indent=2))
