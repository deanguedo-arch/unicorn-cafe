"""Package the connected world at the existing GitHub Pages project URL."""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'game' / 'pages'
CAFE_OUTPUT = ROOT / 'game' / 'cafe-pages'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def retirement_worker(revision):
    return """/* Unicorn World: replace the old root café cache, keeping saves. */
const REVISION=""" + json.dumps(revision) + """;
const PREFIX='sneaky-restaurant:'+new URL(self.registration.scope).pathname+':';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
// No fetch interception: world resources use the network. Each native game
// retains its own more-specific offline worker. Shared-world offline is later work.
"""

def main():
    # Keep the established workflow's game/pages delivery folder. The original
    # café builder still creates its independent export for offline checks.
    sys.path.insert(0, str(ROOT / 'game'))
    import build_pages
    build_pages.PAGES = CAFE_OUTPUT
    if CAFE_OUTPUT.exists():
        shutil.rmtree(CAFE_OUTPUT)
    build_pages.main()
    with tempfile.TemporaryDirectory(prefix='.world-pages-build-', dir=ROOT) as temporary:
        stage = Path(temporary)
        for name in ['index.html', 'manifest.webmanifest']:
            shutil.copy2(ROOT / name, stage / name)
        shutil.copytree(ROOT / 'game' / 'build' / 'icons', stage / 'icons')
        shutil.copytree(ROOT / 'game' / 'build', stage / 'game' / 'build', ignore=shutil.ignore_patterns('SHA256SUMS.txt', '__pycache__', '*.pyc'))
        (stage / 'hub').mkdir()
        for name in ['index.html', 'world.css', 'picture-menus.css', 'world.js', 'mall.js', 'puzzles.js']:
            shutil.copy2(ROOT / 'hub' / name, stage / 'hub' / name)
        for name in ['shared', 'assets']:
            shutil.copytree(ROOT / 'hub' / name, stage / 'hub' / name)
        (stage / 'adventure').mkdir()
        for name in ['index.html', 'sw.js', 'manifest.webmanifest']:
            shutil.copy2(ROOT / 'adventure' / name, stage / 'adventure' / name)
        shutil.copytree(ROOT / 'adventure' / 'icons', stage / 'adventure' / 'icons')
        (stage / '.nojekyll').write_text('')
        files = sorted(p for p in stage.rglob('*') if p.is_file())
        revision = hashlib.sha256(b''.join(str(p.relative_to(stage)).encode()+p.read_bytes() for p in files)).hexdigest()[:16]
        (stage / 'sw.js').write_text(retirement_worker(revision))
        (stage / 'RELEASE.json').write_text(json.dumps({'name': 'Unicorn World', 'revision': revision, 'entry': './hub/', 'cafe': './game/build/', 'adventure': './adventure/', 'sharedWorldOffline': False}, indent=2)+'\n')
        checksums = [digest(p)+'  '+str(p.relative_to(stage)) for p in sorted(stage.rglob('*')) if p.is_file()]
        (stage / 'SHA256SUMS.txt').write_text('\n'.join(checksums)+'\n')
        if OUTPUT.exists():
            shutil.rmtree(OUTPUT)
        shutil.copytree(stage, OUTPUT)
    print('Unicorn World Pages package:', len(checksums)+1, 'files; revision', revision)

if __name__ == '__main__':
    main()
