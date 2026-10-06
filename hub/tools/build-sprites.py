"""Exact alpha-preserving atlas packaging; no repainting or original asset edits."""
from pathlib import Path
from PIL import Image
import json, hashlib

HUB = Path(__file__).resolve().parents[1]
ART = HUB / 'assets'
frames = ['u_idle0','u_idle1']+[f'u_run{i}' for i in range(6)]+[f'u_happy{i}' for i in range(3)]
ids = ['bow','tee','beads','flower-crown','sunhat','helmet','star-jacket','rainbow-dress','raincoat','scarf','glasses','satchel','skateboard','bike','prize-star-bow','prize-rainbow-cape','prize-comet-helmet','prize-gold-scarf','prize-bubble-glasses','prize-moon-bag','legacy-princess','legacy-hero','legacy-mask','legacy-chef','legacy-space']
keys = json.loads((ART/'controls/PROMPTS.json').read_text())['keys']
data={'version':2,'frames':frames,'items':{},'bodies':{},'icons':{},'rides':{},'props':{}}
outputs={}

def record(path):
    im=Image.open(path)
    outputs[str(path.relative_to(HUB))]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':list(im.size),'mode':im.mode}

def cells(path,cols,rows,names,dest=None):
    im=Image.open(path).convert('RGBA')
    assert im.getpixel((0,0))[3]==0, f'Nontransparent sheet: {path}'
    result={}
    for n,name in enumerate(names):
        x0=round(n%cols*im.width/cols);y0=round(n//cols*im.height/rows)
        x1=round((n%cols+1)*im.width/cols);y1=round((n//cols+1)*im.height/rows)
        cell=im.crop((x0,y0,x1,y1))
        bbox=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
        assert bbox is not None, f'Empty sprite {name} in {path}'
        l,t,r,b=bbox;l=max(0,l-2);t=max(0,t-2);r=min(cell.width,r+2);b=min(cell.height,b+2)
        result[name]={'source':str(path.relative_to(ART)),'rect':[x0+l,y0+t,r-l,b-t],'cell':[x0,y0,x1-x0,y1-y0]}
        if dest:
            dest.mkdir(parents=True,exist_ok=True)
            out=dest/(name+'.png');cell.crop((l,t,r,b)).save(out)
            result[name]['file']=str(out.relative_to(ART));record(out)
    record(path)
    return result

def controls(path,names,dest):
    """Recover full generated glyphs where their outlines cross nominal grid edges.

    Component bounds identify crop rectangles only. The original RGBA pixels,
    transparency and source atlas are never modified or repainted.
    """
    im=Image.open(path).convert('RGBA')
    assert im.getpixel((0,0))[3]==0
    width,height=im.size
    alpha=im.getchannel('A').load()
    seen=bytearray(width*height)
    groups={name:[] for name in names}
    for y in range(height):
        for x in range(width):
            pos=y*width+x
            if seen[pos] or alpha[x,y]<=32:
                continue
            seen[pos]=1
            queue=[(x,y)];count=0;l=r=x;t=b=y
            while queue:
                xx,yy=queue.pop();count+=1
                l=min(l,xx);r=max(r,xx);t=min(t,yy);b=max(b,yy)
                for nx,ny in [(xx+1,yy),(xx-1,yy),(xx,yy+1),(xx,yy-1)]:
                    if 0<=nx<width and 0<=ny<height:
                        p=ny*width+nx
                        if not seen[p] and alpha[nx,ny]>32:
                            seen[p]=1;queue.append((nx,ny))
            if count<32:
                continue
            col=min(5,int((l+r+1)/2/(width/6)))
            row=min(5,int((t+b+1)/2/(height/6)))
            groups[names[row*6+col]].append((l,t,r+1,b+1))
    dest.mkdir(parents=True,exist_ok=True)
    result={}
    for n,name in enumerate(names):
        bounds=groups[name]
        assert bounds, f'Missing complete control {name}'
        l=max(0,min(b[0] for b in bounds)-1);t=max(0,min(b[1] for b in bounds)-1)
        r=min(width,max(b[2] for b in bounds)+1);b=min(height,max(b[3] for b in bounds)+1)
        out=dest/(name+'.png');im.crop((l,t,r,b)).save(out);record(out)
        result[name]={'source':str(path.relative_to(ART)),'rect':[l,t,r-l,b-t],
                      'cell':[round(n%6*width/6),round(n//6*height/6),round(width/6),round(height/6)],
                      'file':str(out.relative_to(ART))}
    record(path)
    return result

data['items']=cells(ART/'wardrobe/catalogue-v2.png',5,5,ids,ART/'wardrobe/items')
data['items'].update(cells(ART/'wardrobe/source/clear-eyewear-v2.png',2,2,['glasses','prize-bubble-glasses','legacy-mask','legacy-space'],ART/'wardrobe/worn'))
for key in ['tee','star-jacket','rainbow-dress','raincoat','prize-rainbow-cape','legacy-hero']:
    data['bodies'][key]=cells(ART/'wardrobe'/f'{key}-v2.png',4,3,frames)
data['icons']=controls(ART/'controls/source/controls-v2.png',keys,ART/'controls/icons')
for key in ['bike','skateboard']:
    data['rides'][key]=cells(ART/'wardrobe/source'/f'{key}-riding-v2.png',4,1,[key+str(i) for i in range(4)])
for key in ['bowling-pin','catching-basket']:
    data['props'][key]=cells(ART/'controls/source'/f'{key}-v2.png',1,1,[key],ART/'controls/props')[key]
data['bowlingBackground']='controls/source/bowling-lane-v2.png'
record(ART/data['bowlingBackground'])
(HUB/'shared/sprites.js').write_text('/* Generated atlas rectangles. Visual art: built-in image_gen. */\nwindow.UWArtSprites='+json.dumps(data,separators=(',',':'))+';\n')
(ART/'wardrobe/SPRITES.json').write_text(json.dumps(data,indent=2)+'\n')
(ART/'wardrobe/BUILD.json').write_text(json.dumps({'processing':'Exact source rectangle crops, with complete glyph bounds across nominal grid edges. Generated alpha and colors retained; no repainting or canonical asset changes.','outputs':outputs},indent=2)+'\n')
print(f'Packaged {len(ids)} items, {len(keys)} controls, 66 garment poses, 8 riding frames, 2 arcade props.')
for key,ride in data['rides'].items():
    print(key,[(k,v['rect'],v['cell']) for k,v in ride.items()])
