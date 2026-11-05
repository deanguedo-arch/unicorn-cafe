"""Check packaged V6 entries under the actual GitHub Pages project subpath."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

root = Path(__file__).resolve().parents[2] / 'game' / 'pages'
origin = 'https://deanguedo-arch.github.io'
prefix = '/unicorn-cafe/'
errors = []
checked = 0

class Entry(HTMLParser):
    def __init__(self, document):
        super().__init__()
        self.document = document
        self.base = origin + prefix + document

    def handle_starttag(self, tag, attributes):
        global checked
        attrs = dict(attributes)
        if tag == 'base' and attrs.get('href'):
            self.base = urljoin(self.base, attrs['href'])
            return
        attribute = ('src' if tag in ('script', 'img', 'iframe', 'audio', 'video', 'source')
                     else 'href' if tag == 'link' else None)
        value = attrs.get(attribute) if attribute else None
        if not value or value.startswith(('data:', 'blob:', '#', 'javascript:')):
            return
        url = urlsplit(urljoin(self.base, value))
        if url.netloc != 'deanguedo-arch.github.io' or not url.path.startswith(prefix):
            errors.append((self.document, value, 'outside the project origin or path'))
            return
        target = root / unquote(url.path[len(prefix):])
        if target.is_dir():
            target /= 'index.html'
        checked += 1
        if not target.is_file():
            errors.append((self.document, value, 'missing packaged file'))

for document in ('hub/index.html', 'hub/index-v6.html', 'cafe-town-v6/index.html', 'adventure-town-v6.html'):
    html = (root / document).read_text()
    assert 'unicorn-town-v6-review-v1:' not in html, f'{document} still uses review-only storage'
    parser = Entry(document)
    parser.feed(html)

world = (root / 'hub/v6-stage/world-v6.js').read_text()
assert "STORE='unicorn-world-hub-v1'" in world
assert 'new UWProfile.Profile()' in world
assert "new URL('../',location.href).href" in world
assert 'unicorn-town-v6-fixture-profile-v1' not in world
assert not errors, errors
print(f'PASS {checked} V6 entry references stay within the GitHub Pages project and exist')
