from pathlib import Path
import json,hashlib,re,subprocess,urllib.request,time,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];B=ROOT/'build';P=ROOT/'pages';results=[]
def test(name,fn):
 try:r=fn();results.append({'name':name,'pass':True,'detail':r});print('PASS',name)
 except Exception as e:results.append({'name':name,'pass':False,'error':str(e)});print('FAIL',name,e)
def syntax():
 for f in list((B/'src').glob('*.js'))+[B/'sw.js',P/'sw.js']:subprocess.run(['node','--check',str(f)],check=True,capture_output=True)
 return {'scripts':6}
test('JavaScript syntax',syntax)
def required():
 files=['index.html','sw.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','.nojekyll']
 for n in files:assert (P/n).is_file(),n
 text=(P/'index.html').read_text();assert "window.RR_STANDALONE=false;" in text;assert not re.search(r'<script[^>]+src=',text)
 assert '<link rel="stylesheet"' not in text
 assert "const VERSION='2.0.0'" in text
 m=json.loads((P/'manifest.webmanifest').read_text());assert m['scope']=='./' and m['start_url']=='./index.html'
 for n,size in [('icon-192.png',(192,192)),('icon-512.png',(512,512)),('apple-touch-icon.png',(180,180))]:assert Image.open(P/'icons'/n).size==size
 return {'files':len([f for f in P.rglob('*') if f.is_file()]),'runtimeAssetsEmbedded':True}
test('Root-entry embedded Pages/PWA layout and app icon dimensions',required)
def matching():
 text=(ROOT/'Sneaky-Unicorn-Restaurant-v2.0.0.html').read_text();p=(P/'index.html').read_text().replace('window.RR_STANDALONE=false;','window.RR_STANDALONE=true;')
 p=re.sub(r'<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\n?','',p)
 assert p==text
 return {'gameplayCodeIdentical':True}
test('Standalone and hosted game differ only by PWA switch/head links',matching)
def assets():
 a=B/'assets';n=0
 for shape in ['round','clover','oval','heart','cloud']:
  for cloth in ['honey','cream','berry','sky','gingham','rainbow']:
   im=Image.open(a/f'table_{shape}_{cloth}.webp').convert('RGBA');alpha=im.getchannel('A');assert alpha.getextrema()==(0,255);assert im.width>100 and im.height>100;n+=1
 for f in a.iterdir():
  with Image.open(f) as im:im.verify()
 return {'tableClothFrames':n,'decodedImageFiles':len(list(a.iterdir()))}
test('All production art valid; all30 table/cloth frames have real alpha',assets)
def preservation():
 hashes=json.loads((ROOT/'p4-baseline-hashes.json').read_text());same=[]
 for name,digest in hashes.items():
  if not name.startswith('assets/') or name in {'assets/painted_kitchen.webp','assets/painted_sink.webp'}:continue
  assert hashlib.sha256((B/name).read_bytes()).hexdigest()==digest,name;same.append(Path(name).name)
 assert len(same)==83
 characters=[n for n in same if re.match(r'^(u_|baby_|h_|w_|m_|dog_)',n)]
 return {'inheritedAssetsByteIdentical':len(same),'characterFilesByteIdentical':len(characters)}
test('Inherited production assets and character pixels unchanged',preservation)
def no_external():
 html=(P/'index.html').read_text();links=re.findall(r'(?:src|href)=["\']([^"\']+)',html)
 assert not any(u.startswith(('http://','https://','//')) for u in links)
 for fname in ['game.js','engine.js']:
  js=(B/'src'/fname).read_text();assert not re.search(r'\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(',js)
 return {'remoteRuntimeLinks':0,'remoteDataAPIs':0}
test('No external runtime requests or data-collection APIs',no_external)
def byte_http():
 log=open(ROOT/'tests/http-pages.log','w')
 proc=subprocess.Popen([sys.executable,'-m','http.server','8015','--bind','127.0.0.1','--directory',str(ROOT)],stdin=subprocess.DEVNULL,stdout=log,stderr=log)
 try:
  time.sleep(.5);count=0
  for f in sorted(P.rglob('*')):
   if not f.is_file():continue
   with urllib.request.urlopen('http://127.0.0.1:8015/pages/'+str(f.relative_to(P)),timeout=5) as rr:
    assert rr.status==200;assert rr.read()==f.read_bytes();count+=1
  return {'PythonHTTPByteChecks':count,'browserNavigation':False,'testedSubdirectory':'/pages/'}
 finally:proc.terminate();proc.wait(timeout=5);log.close()
test('HTTP bytes match for every hosted file in a subdirectory',byte_http)
(ROOT/'tests/static-results.json').write_text(json.dumps({'kind':'static, image and HTTP byte checks, not physical-device testing','passed':sum(x['pass'] for x in results),'total':len(results),'results':results},indent=2))
if any(not x['pass'] for x in results):raise SystemExit(1)
