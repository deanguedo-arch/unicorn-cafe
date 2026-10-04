"""Build the identical one-file game from ./build. Python standard library only."""
from pathlib import Path
import base64, json, re, mimetypes, argparse
ROOT=Path(__file__).resolve().parent
BUILD=ROOT/'build'
def build(output=None):
    html=(BUILD/'index.html').read_text()
    html=re.sub(r'<link rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\n?','',html)
    html=html.replace('<link rel="stylesheet" href="./styles.css">','<style>\n'+(BUILD/'styles.css').read_text()+'\n</style>')
    assets={}
    for p in sorted((BUILD/'assets').iterdir()):
        if p.is_file():
            mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
            assets[p.stem]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
    for name in ['assets','engine','art','game']:
        js='window.RR_STANDALONE=true;\nwindow.RR_ASSETS='+json.dumps(assets,separators=(',',':'))+';' if name=='assets' else (BUILD/'src'/f'{name}.js').read_text()
        html=html.replace(f'<script src="./src/{name}.js"></script>','<script>\n'+js+'\n</script>')
    output=Path(output) if output else ROOT/'Sneaky-Unicorn-Restaurant-v2.0.0.html'
    output.write_text(html)
    return output
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output');args=parser.parse_args();print(build(args.output))
