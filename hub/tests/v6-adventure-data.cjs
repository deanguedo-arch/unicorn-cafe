const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'adventure-town-v6.html'), 'utf8');
const names = Array.from({length: 5}, (_, i) => `data-${String(i + 1).padStart(2, '0')}.js`);
const context = vm.createContext({});
let previous = -1;
for (const name of names) {
  const tag = `<script src="world-art/embedded-data-v6/${name}"></script>`;
  const position = html.indexOf(tag);
  assert(position > previous, `${name} loads once, synchronously and in order`);
  assert.equal(html.indexOf(tag, position + 1), -1, `${name} is not duplicated`);
  const file = path.join(root, 'adventure/world-art/embedded-data-v6', name);
  const source = fs.readFileSync(file, 'utf8');
  assert(Buffer.byteLength(source) < 6 * 1024 * 1024, `${name} fits the GitHub connector`);
  new vm.Script(source, {filename: name}).runInContext(context);
  previous = position;
}
const entries = vm.runInContext('JSON.stringify(Object.entries(DATA))', context);
assert.equal(JSON.parse(entries).length, 82);
// This digest was taken from both DATA assignments in the pre-split 077a0fb commit.
assert.equal(crypto.createHash('sha256').update(entries).digest('hex'),
  '1b78e44f56995370a95faefc9e7de7f168ceb5702ba8a3d3618259706e10f3af');
assert(html.indexOf("Object.assign(DATA,{world_furniture:") > previous,
  'game initialization follows the data scripts');
console.log('PASS all 82 embedded Adventure images remain byte-identical and load in order');
