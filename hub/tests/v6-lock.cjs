const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../v6-stage/single-writer-v6.js'), 'utf8');
function environment(locks) {
  const overlays = [];
  const document = {body: {append(node) { overlays.push(node); }},
    createElement(tag) { return {tag, children: [], style: {}, setAttribute() {},
      append(node) { this.children.push(node); }}; }};
  const window = {addEventListener() {}};
  const context = {window, document, navigator: {locks}, location: {reload() {}}};
  vm.runInNewContext(source, context);
  return {api: window.UWSingleWriterV6, overlays};
}
let count = 0;
const granted = environment({request(name, options, callback) {
  assert.equal(name, 'test-writer'); assert.equal(options.ifAvailable, true);
  callback({name}); return Promise.resolve();
}});
granted.api.start('test-writer', () => count++);
assert.equal(count, 1);
assert.equal(granted.overlays.length, 0);
const busy = environment({request(name, options, callback) { callback(null); return Promise.resolve(); }});
busy.api.start('test-writer', () => count++);
assert.equal(count, 1, 'a second writer must not boot');
assert.equal(busy.overlays.length, 1);
const unsupported = environment(undefined);
unsupported.api.start('test-writer', () => count++);
assert.equal(count, 1, 'do not boot without a safe lock');
assert.equal(unsupported.overlays.length, 1);
console.log('PASS single-writer boot, busy tab refusal and unsupported-browser refusal');
