"""Local Unicorn World preview. Existing standalone origins remain available; no deployment."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
import argparse
ROOT=Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    root=ROOT
    def __init__(self,*a,**k):super().__init__(*a,directory=str(self.root),**k)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('Access-Control-Allow-Origin','*')
        super().end_headers()
    def do_GET(self):
        if self.path.split('?',1)[0] in ('/','/index.html') and self.root==ROOT/'game/build':
            data=(self.root/'index.html').read_text().replace('</head>','<script>window.RR_STANDALONE=true;</script></head>').encode()
            self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
        else:super().do_GET()
def serve(port,root,host='127.0.0.1'):
    cls=type('RootHandler',(Handler,),{'root':root})
    server=ThreadingHTTPServer((host,port),cls)
    Thread(target=server.serve_forever,daemon=True).start()
    return server
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8790);p.add_argument('--isolated',action='store_true');p.add_argument('--host',default='127.0.0.1',help='Default stays on this Mac. Use 0.0.0.0 only for a local Wi-Fi device preview.');args=p.parse_args()
    servers=[serve(args.port,ROOT,args.host)]
    if not args.isolated:
        for port,root in [(8787,ROOT/'game/build'),(8788,ROOT/'adventure')]:
            try:servers.append(serve(port,root))
            except OSError:print(f'Port {port} already has a preview. Keep that preview running.',flush=True)
    url=f'http://localhost:{args.port}/hub/'+('' if args.isolated else '?legacy=1')
    print('Unicorn World: '+url,flush=True)
    if args.host=='0.0.0.0':print(f'Local Wi-Fi preview: http://<this-Mac-LAN-IP>:{args.port}/hub/ (separate device/browser save)',flush=True)
    try:
        import signal
        signal.pause()
    except KeyboardInterrupt:pass
    finally:
        for s in servers:s.shutdown()
