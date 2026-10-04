"""Serve editable source without service-worker caching; stdlib only."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser

ROOT = Path(__file__).resolve().parent / 'game' / 'build'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.split('?', 1)[0] in ('/', '/index.html'):
            content = (ROOT / 'index.html').read_text().replace(
                '</head>', '<script>window.RR_STANDALONE=true;</script></head>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            super().do_GET()

if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 8787), Handler) as server:
        print('Play/edit preview: http://localhost:8787 — Control-C stops it.', flush=True)
        webbrowser.open('http://localhost:8787')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
