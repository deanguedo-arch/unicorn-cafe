"""Package three generated navigation sprites without changing their RGBA pixels."""
from pathlib import Path
import hashlib, json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'hub/assets/navigation'
sheet = ART / 'entrances-v1.png'
im = Image.open(sheet).convert('RGBA')
assert im.getpixel((0, 0))[3] == 0, 'Navigation sheet must retain alpha'
data = {}
for i, name in enumerate(['entrance-mat', 'exit-mat', 'picture-plaque']):
    cell = im.crop((round(i * im.width / 3), 0, round((i + 1) * im.width / 3), im.height))
    # Generated sheets can contain near-invisible alpha noise in empty margins.
    # This threshold chooses the crop bounds; it never changes any saved pixels.
    box = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
    assert box, name
    output = ART / (name + '.png')
    cell.crop(box).save(output)
    data[name] = {'path': str(output.relative_to(ROOT)), 'size': list(Image.open(output).size), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}
provenance = {
    'route': 'built-in image_gen',
    'source': '/Users/deanguedo/.codex/generated_images/01a10d6c-522f-7633-aa66-aa09084e1004/exec-d8f54e95-0b81-4917-af3d-a5b97dc0916a.png',
    'atlas': str(sheet.relative_to(ROOT)),
    'sha256': hashlib.sha256(sheet.read_bytes()).hexdigest(),
    'promptSet': 'hub/assets/navigation/PROMPTS.json',
    'packaging': 'Exact alpha-bounded crops only. Source pixels, canonical backgrounds and artwork preserved.',
    'sprites': data,
}
provenance['status'] = 'Oversized mats and plaques retired after user visual review; retained as source history only.'
source = ART / 'floor-cues-v2.png'
im = Image.open(source).convert('RGBA')
assert im.getpixel((0, 0))[3] == 0
floor_cues = {}
for i, name in enumerate(['floor-footprints', 'floor-exit-arrow']):
    cell = im.crop((round(i * im.width / 2), 0, round((i + 1) * im.width / 2), im.height))
    box = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
    assert box, name
    output = ART / (name + '.png')
    cell.crop(box).save(output)
    floor_cues[name] = {'path': str(output.relative_to(ROOT)), 'size': list(Image.open(output).size), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}
provenance['current'] = {
    'source': '/Users/deanguedo/.codex/generated_images/01a10d6c-522f-7633-aa66-aa09084e1004/exec-0f300ef0-bf44-43bb-9702-81cac8809488.png',
    'atlas': str(source.relative_to(ROOT)),
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sprites': floor_cues,
    'rendering': 'Small floor markings and a nearby soft highlight; no duplicated signs, oversized rugs or added doors.',
}
(ART / 'PROVENANCE.json').write_text(json.dumps(provenance, indent=2) + '\n')
print(json.dumps(data, indent=2))
