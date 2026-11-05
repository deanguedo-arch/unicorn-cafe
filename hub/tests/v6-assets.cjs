const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = {window: {}, URL, document: {currentScript: {
  src: 'https://deanguedo-arch.github.io/unicorn-cafe/hub/legacy-cafe-assets.js'
}}};
vm.createContext(context);
vm.runInContext(read('game/build/src/assets.js'), context);
vm.runInContext(read('cafe-town-v6/assets-v6.js'), context);
for (const key of ['cafe_cashier_actor', 'cafe_dj_actor', 'cafe_structure'])
  assert(context.window.RR_ASSETS[key], `missing connected café artwork ${key}`);
for (const [key, url] of Object.entries(context.window.RR_ASSETS))
  assert(fs.existsSync(path.join(root, 'game/build', url)), `missing café artwork ${key}`);
vm.runInContext(read('hub/legacy-cafe-assets.js'), context);
for (const [key, url] of Object.entries(context.window.RR_LEGACY_ASSETS)) {
  const parsed = new URL(url);
  assert(parsed.pathname.startsWith('/unicorn-cafe/game/build/assets/'), `café base for ${key}`);
  assert(fs.existsSync(path.join(root, 'game/build/assets', path.basename(parsed.pathname))), key);
}
vm.runInContext(read('hub/shared/sprites.js'), context);
const sprites = context.window.UWArtSprites;
for (const group of ['items', 'icons', 'props']) for (const [id, sprite] of Object.entries(sprites[group]))
  assert(sprite.file && fs.existsSync(path.join(root, 'hub/assets', sprite.file)), `${group}: ${id}`);
assert(fs.existsSync(path.join(root, 'hub/assets', sprites.bowlingBackground)), 'bowling artwork');
vm.runInContext(read('hub/assets/wardrobe/production/runtime.js'), context);
const {index, manifest} = context.window.UWFittedData;
for (const file of new Set([...Object.values(index.assets).map(a => a.atlas),
                            ...manifest.original_bases.map(b => b.base_file)]))
  assert(fs.existsSync(path.join(root, 'hub/assets/wardrobe/production', file)), file);
let puzzles;
context.UWCatalog = {installPuzzleCollection(records) { puzzles = records; }};
vm.runInContext(read('hub/shared/puzzle-collection-2026.js'), context);
assert.equal(puzzles.length, 30);
for (const puzzle of puzzles) for (const key of ['image', 'thumbnail'])
  assert(fs.existsSync(path.join(root, 'hub', puzzle[key])), `missing puzzle ${puzzle.id}`);
const unchanged = {
  'game/build/assets/u_idle0.webp': 'dc75e909c6f7661102fc00b8c9603f645d940a75629a31c3c78096b841f43ccf',
  'adventure/generated-art/pastel_baby_unicorn_sprite_sheet.png': '6ed43a9bd81b9f5f1153133fdb3084ac469014ae00c4851a6a39c93bf8436f4d',
  'hub/assets/wardrobe/production/atlases/wardrobe_00.png': '446fc394d36160509a4df052d4129e0e95b314e67b297ddbcc0b2ba4d5a033a2',
  'hub/assets/wardrobe/production/atlases/wardrobe_01.png': 'b6fce78c7a61a1f1374dda46113d29f027eae0c399e0cd64fa7569e735288774',
  'hub/assets/wardrobe/production/atlases/wardrobe_02.png': '5f4554bae60c5905e85809cfae6a66d08550fc4a0541e1a97f21eb5d8721aecf',
  'hub/assets/wardrobe/production/atlases/wardrobe_03.png': 'f6d8c8a14aaeac53f664f2f8f37f42fabf6190c1cf44063d2de8404648e5bafd',
  'hub/assets/wardrobe/production/atlases/wardrobe_04.png': 'e054f421aee773c5aa731d71fb57e08bfb96898255065c0d3ad4f373f0b599b3'
};
for (const [file, expected] of Object.entries(unchanged))
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), expected, file);
console.log('PASS café, sprite, puzzle and wardrobe runtime artwork resolves; canonical art is unchanged');
