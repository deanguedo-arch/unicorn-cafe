#!/usr/bin/env python3
"""Build the self-contained game and the versioned offline web app. No network needed.
Requires Python 3 and Pillow, only for app icon resizing.
"""
from pathlib import Path
import base64, hashlib, json, re, shutil, zipfile
from PIL import Image

ROOT=Path(__file__).resolve().parent
VERSION='1.0.0'
WEB=ROOT/'webapp'
OUT=ROOT.parent/'deliverables'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def main():
    WEB.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)
    food={p.stem[5:]:'assets/'+p.name for p in sorted((ROOT/'assets').glob('food-*.webp'))}
    art={**food,**{key:'assets/'+name for key,name in {
        'chefIdle':'source-chef-idle.webp','chefHappy':'source-chef-happy.webp',
        'chefHero':'source-chef-hero.webp','babyPink':'source-baby-pink.webp',
        'babyPinkHappy':'source-baby-pink-happy.webp','babyBlue':'source-baby-blue.webp',
        'babyBlueHappy':'source-baby-blue-happy.webp','babyPinkCelebrate':'source-baby-pink-celebrate.webp',
        'babyBlueCelebrate':'source-baby-blue-celebrate.webp','customerHappy':'source-customer-happy.webp',
        'hero':'source-hero.webp','restaurant':'source-restaurant.webp'}.items()}}
    for key,path in art.items():
        if not (ROOT/path).is_file() or not (ROOT/path).stat().st_size:
            raise RuntimeError('Missing required art: '+key)
    assets_js='/* Original Sneaky Unicorn art + restaurant assets. See provenance files. */\nwindow.ART = '+json.dumps(art,indent=2)+';\n'
    (ROOT/'src/assets.js').write_text(assets_js)
    for p in (ROOT/'src').iterdir():
        if p.suffix in ('.html','.js','.css'):shutil.copy2(p,WEB/p.name)
    (WEB/'assets').mkdir(exist_ok=True)
    for path in art.values():shutil.copy2(ROOT/path,WEB/path)
    (WEB/'icons').mkdir(exist_ok=True)
    icon_source=Image.open(ROOT/'art-originals/source/unicorn-hero.png').convert('RGB')
    for size,name in [(192,'icon-192.png'),(512,'icon-512.png'),(180,'apple-touch-icon.png')]:
        icon_source.resize((size,size),Image.Resampling.LANCZOS).save(WEB/'icons'/name,optimize=True)
    manifest={
        'id':'./','name':'Sneaky Unicorn: Rainbow Kitchen','short_name':'Rainbow Kitchen',
        'description':'A gentle picture-led toy kitchen with seven dishes to make.',
        'lang':'en','start_url':'./index.html','scope':'./','display':'standalone',
        'background_color':'#fff9ef','theme_color':'#7755b5',
        'icons':[{'src':'icons/icon-192.png','sizes':'192x192','type':'image/png','purpose':'any'},
                 {'src':'icons/icon-512.png','sizes':'512x512','type':'image/png','purpose':'any'}]
    }
    (WEB/'manifest.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n')
    payload=[p for p in sorted(WEB.rglob('*')) if p.is_file() and p.name not in ('sw.js','VERSION-MANIFEST.json','SHA256SUMS.txt','README.txt','TEST-REPORT.txt')]
    combined=hashlib.sha256(''.join(sha(p) for p in payload).encode()).hexdigest()[:12]
    cache_name=f'rainbow-kitchen-v{VERSION}-{combined}'
    precache=['./']+['./'+p.relative_to(WEB).as_posix() for p in payload]
    sw="""/* Rainbow Kitchen offline cache. Local game files only. */
'use strict';
const CACHE = %s;
const FILES = %s;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rainbow-kitchen-v') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, {ignoreSearch: true});
    if (cached) return cached;
    if (event.request.mode === 'navigate') {
      try { return await fetch(event.request); }
      catch (error) { return cache.match('./index.html'); }
    }
    return fetch(event.request);
  }));
});
"""%(json.dumps(cache_name),json.dumps(precache,indent=2))
    (WEB/'sw.js').write_text(sw)
    # Standalone: every image, style, and script embedded. No service worker/network needed.
    html=(ROOT/'src/index.html').read_text()
    html=re.sub(r'\s*<link rel="manifest"[^>]*>','',html)
    for name in ('icon-192.png','apple-touch-icon.png'):
        encoded=base64.b64encode((WEB/'icons'/name).read_bytes()).decode()
        html=html.replace('icons/'+name,'data:image/png;base64,'+encoded)
    html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+(ROOT/'src/style.css').read_text()+'\n</style>')
    embedded={key:'data:image/webp;base64,'+base64.b64encode((ROOT/path).read_bytes()).decode() for key,path in art.items()}
    inline_art='window.RAINBOW_STANDALONE = true;\nwindow.ART = '+json.dumps(embedded,separators=(',',':'))+';'
    html=html.replace('<script src="assets.js"></script>','<script>\n'+inline_art+'\n</script>')
    for name in ('recipes.js','kitchen.js','app.js'):
        content=(ROOT/'src'/name).read_text().replace('</script','<\\/script')
        html=html.replace('<script src="'+name+'"></script>','<script>\n'+content+'\n</script>')
    standalone=OUT/f'Sneaky-Unicorn-Rainbow-Kitchen-v{VERSION}.html'
    standalone.write_text(html)
    build_manifest={'game':'Sneaky Unicorn: Rainbow Kitchen','version':VERSION,'cache':cache_name,'privacy':'No external runtime dependencies, analytics, accounts or personal data. Progress uses localStorage only.','files':[]}
    for p in sorted(WEB.rglob('*')):
        if p.is_file() and p.name not in ('VERSION-MANIFEST.json','SHA256SUMS.txt','README.txt','TEST-REPORT.txt'):
            build_manifest['files'].append({'path':p.relative_to(WEB).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)})
    (WEB/'VERSION-MANIFEST.json').write_text(json.dumps(build_manifest,indent=2)+'\n')
    (WEB/'SHA256SUMS.txt').write_text(''.join(f"{entry['sha256']}  {entry['path']}\n" for entry in build_manifest['files']))
    for name in ('README.txt','TEST-REPORT.txt'):
        if (ROOT/name).exists():shutil.copy2(ROOT/name,WEB/name)
    # ZIP packaging is explicit so QA can inspect the webapp before making downloads.
    if '--package' in __import__('sys').argv:
        zipfolder(WEB,OUT/f'Sneaky-Unicorn-Rainbow-Kitchen-iPhone-v{VERSION}.zip')
        sourcezip=OUT/f'Sneaky-Unicorn-Rainbow-Kitchen-Editable-Source-v{VERSION}.zip'
        with zipfile.ZipFile(sourcezip,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            allowed=['src','assets','art-originals','tests','docs']
            for directory in allowed:
                if not (ROOT/directory).exists():continue
                for p in sorted((ROOT/directory).rglob('*')):
                    if p.is_file() and p.suffix not in ('.pyc',) and p.name not in ('food-contact-sheet.jpg','food-extras-contact-sheet.jpg') and 'node_modules' not in p.parts:
                        z.write(p,p.relative_to(ROOT).as_posix())
            for name in ('build.py','README.txt','QUICK-START.txt','TEST-REPORT.txt','BUILD-CONTRACT.md','provenance-source.json'):
                if (ROOT/name).exists():z.write(ROOT/name,name)
        deliverables=[standalone,OUT/f'Sneaky-Unicorn-Rainbow-Kitchen-iPhone-v{VERSION}.zip',sourcezip]
        for source_name,output_name in [('QUICK-START.txt',f'Rainbow-Kitchen-v{VERSION}-Quick-Start.txt'),('TEST-REPORT.txt',f'Rainbow-Kitchen-v{VERSION}-Test-Report.txt')]:
            if (ROOT/source_name).exists():
                shutil.copy2(ROOT/source_name,OUT/output_name)
                deliverables.append(OUT/output_name)
        for p in deliverables:
            if p.stat().st_size>=20_000_000:raise RuntimeError('Attachment exceeds 20 MB: '+p.name)
        release={'game':'Sneaky Unicorn: Rainbow Kitchen','version':VERSION,'source_pack_sha256':json.loads((ROOT/'provenance-source.json').read_text()).get('sourcepack_sha256','See provenance-source.json'),'art_count':len(art),'attachments':[{'file':p.name,'bytes':p.stat().st_size,'sha256':sha(p)} for p in deliverables]}
        (OUT/f'Rainbow-Kitchen-v{VERSION}-SHA256-Manifest.json').write_text(json.dumps(release,indent=2)+'\n')
        (OUT/f'Rainbow-Kitchen-v{VERSION}-SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.name}\n' for p in deliverables))
    print(json.dumps({'version':VERSION,'art_count':len(art),'standalone_bytes':standalone.stat().st_size,'webapp':str(WEB),'cache':cache_name,'packaged':'--package' in __import__('sys').argv}))

def zipfolder(folder,destination):
    with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file():z.write(p,p.relative_to(folder).as_posix())

if __name__=='__main__':main()
