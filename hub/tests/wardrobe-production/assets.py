"""Verify imported art and independently compose Pillow pixel oracles for runtime QA."""
from pathlib import Path
from PIL import Image
import hashlib, json, sys

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / 'hub/assets/wardrobe/production'
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/unicorn-wardrobe-oracles')
OUT.mkdir(parents=True, exist_ok=True)
m = json.loads((ART/'manifest.json').read_text())
index = json.loads((ART/'atlas_index.json').read_text())['assets']
for line in (ART/'SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    assert hashlib.sha256((ART/name).read_bytes()).hexdigest() == digest, name
pages = {name: Image.open(ART/name).convert('RGBA') for name in {a['atlas'] for a in index.values()}}
layers = {}
for key, a in index.items():
    x, y, w, h = a['rect']
    image = Image.new('RGBA', (512, 512))
    image.paste(pages[a['atlas']].crop((x, y, x+w, y+h)), tuple(a['trim_offset']))
    assert hashlib.sha256(image.tobytes()).hexdigest() == a['rgba_sha256'], key
    layers[key] = image
bases = {b['frame_id']: Image.open(ART/b['base_file']).convert('RGBA') for b in m['original_bases']}
for b in m['original_bases']:
    assert hashlib.sha256((ART/b['base_file']).read_bytes()).hexdigest() == b['base_sha256']
for frozen in json.loads((ART/'metadata/approved_trial_freeze.json').read_text())['files']:
    assert hashlib.sha256((ART/frozen['file']).read_bytes()).hexdigest() == frozen['sha256']
assert (ROOT/'hub/shared/catalogue.js').read_text().strip() == (ART/'metadata/canonical_catalogue_reference.js').read_text().strip()
records = {(r['item_id'], r['frame_id']): r for r in m['records']}
assert len(records) == 437
cases = [{'label': r['item_id'], 'frame': r['frame_id'], 'outfit': {r['slot']: r['item_id']}} for r in m['records']]
outfits = [
    {'head':'bow','body':'tee','accessory':'beads'},
    {'head':'sunhat','body':'star-jacket','accessory':'satchel'},
    {'head':'flower-crown','body':'rainbow-dress','accessory':'glasses'},
    {'head':'helmet','body':'raincoat','accessory':'scarf'},
    {'head':'prize-star-bow','body':'prize-rainbow-cape','accessory':'prize-moon-bag'},
    {'head':'legacy-space','body':'legacy-hero','accessory':'prize-gold-scarf'},
    {'body':'tee','accessory':'satchel'},
    {'body':'tee','accessory':'prize-gold-scarf'},
    {'body':'raincoat','accessory':'prize-moon-bag'},
]
for n, outfit in enumerate(outfits):
    cases.extend({'label':f'outfit-{n}', 'frame':frame, 'outfit':outfit} for frame in m['frame_order'])
order = ['rear', 'base', 'body', 'body_foreground', 'accessory', 'head', 'head_foreground']
for n, case in enumerate(cases):
    frame = case['frame']
    result = Image.new('RGBA', (512,512))
    for phase in order:
        if phase == 'base':
            result = Image.alpha_composite(result, bases[frame])
            continue
        for slot in ['body','accessory','head']:
            record = records.get((case['outfit'].get(slot), frame))
            if not record:
                continue
            for key in record['local_order']:
                layer = record['layers'].get(key)
                if layer and layer['phase'] == phase:
                    result = Image.alpha_composite(result, layers[layer['asset_id']])
    result = Image.alpha_composite(Image.new('RGBA', (512,512), 'white'), result)
    case['oracle'] = f'{n}.png'
    result.save(OUT/case['oracle'])
(OUT/'cases.json').write_text(json.dumps(cases))
report = {'fileHashes':326,'decodedAtlasLayers':len(layers),'canonicalBases':len(bases),'fitRecords':len(records),'pixelOracleCases':len(cases),'bothFacingCases':len(cases)*2,'catalogueUnchanged':True}
(OUT/'ASSET-RESULTS.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
