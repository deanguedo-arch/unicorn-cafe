"""Rebuild a small-file-count GitHub Pages/PWA package. No runtime libraries."""
from pathlib import Path
import json, shutil, hashlib
from build_standalone import build as build_html
ROOT=Path(__file__).resolve().parent;BUILD=ROOT/'build';PAGES=ROOT/'pages'
def worker(files, revision):
    return '''/* Rainbow Restaurant v2.0.0. Same-origin, directory-scoped offline cache. */
const PREFIX='sneaky-restaurant:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+'''+json.dumps('2.0.0-'+revision)+''';
const FILES='''+json.dumps(files,indent=2)+''';
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const key=req.mode==='navigate'?'./index.html':req;
  const hit=await cache.match(key,{ignoreSearch:req.mode==='navigate'});
  if(hit)return hit;
  return fetch(req);
 }));
});
'''
def hashes(folder):
    data=[]
    for p in sorted(folder.rglob('*')):
        if p.is_file() and p.name!='SHA256SUMS.txt':data.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(folder)))
    (folder/'SHA256SUMS.txt').write_text('\n'.join(data)+'\n')
def main():
    PAGES.mkdir(exist_ok=True)
    standalone=build_html()
    html=standalone.read_text().replace('window.RR_STANDALONE=true;','window.RR_STANDALONE=false;')
    html=html.replace('</head>','<link rel="manifest" href="./manifest.webmanifest">\n<link rel="icon" href="./icons/icon-192.png">\n<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">\n</head>')
    (PAGES/'index.html').write_text(html)
    shutil.copytree(BUILD/'icons',PAGES/'icons',dirs_exist_ok=True)
    shutil.copy2(BUILD/'manifest.webmanifest',PAGES/'manifest.webmanifest')
    for f in ['README.md','VERSION.json','LAUNCH-INSTRUCTIONS.md']:
        shutil.copy2((BUILD if f=='VERSION.json' else ROOT)/f,PAGES/f)
    (PAGES/'README.md').write_text('# Rainbow Restaurant v2.0.0 — Ready for GitHub Pages\n\nUpload the contents of this folder to the restaurant repository. index.html embeds all game code, styles and artwork. Keep manifest.webmanifest, sw.js and icons/ beside it. No build command and no external assets/src directory are required.\n\nSee LAUNCH-INSTRUCTIONS.md. The separate Editable-Source ZIP contains the modular code, artwork, tests and rebuild scripts. Nothing has been deployed by generating this package.\n')
    (PAGES/'.nojekyll').write_text('')
    files=['./index.html','./manifest.webmanifest',*['./'+str(p.relative_to(PAGES)) for p in sorted((PAGES/'icons').glob('*.png'))]]
    revision=hashlib.sha256(b''.join((PAGES/f[2:]).read_bytes() for f in files)).hexdigest()[:16]
    (PAGES/'sw.js').write_text(worker(files,revision))
    modular=['./index.html','./styles.css','./manifest.webmanifest',*['./'+str(p.relative_to(BUILD)) for folder in ['src','assets','icons'] for p in sorted((BUILD/folder).iterdir()) if p.is_file()]]
    (BUILD/'sw.js').write_text(worker(modular,revision))
    hashes(BUILD);hashes(PAGES)
    print('Pages package:',len([p for p in PAGES.rglob('*') if p.is_file()]),'files; embedded game',len(html.encode()),'bytes')
if __name__=='__main__':main()
