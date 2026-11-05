const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../v6-stage/world-v6.js'), 'utf8');
const match = source.match(/^function urlFor\(id\)\{[^\n]+\}$/m);
assert(match, 'world entry URL function exists');
function getUrls(href, legacy) {
  const page = new URL(href);
  const urlFor = vm.runInNewContext(match[0] + '; urlFor', {
    URL, legacy, qa: false,
    location: {href: page.href, origin: page.origin, hostname: page.hostname}
  });
  return [urlFor('cafe'), urlFor('adventure')];
}
const [cafe, adventure] = getUrls('https://deanguedo-arch.github.io/unicorn-cafe/hub/', false);
assert.equal(cafe.pathname, '/unicorn-cafe/cafe-town-v6/');
assert.equal(adventure.pathname, '/unicorn-cafe/adventure-town-v6.html');
for (const url of [cafe, adventure]) {
  assert.equal(url.searchParams.get('worldOrigin'), 'https://deanguedo-arch.github.io');
  assert.equal(url.searchParams.get('worldBase'), 'https://deanguedo-arch.github.io/unicorn-cafe/');
  assert.equal(url.searchParams.get('hub'), '1');
  assert.equal(url.searchParams.has('qa'), false);
}
const [localCafe, localAdventure] = getUrls('http://localhost:8790/hub/?legacy=1', true);
assert.equal(localCafe.origin, 'http://localhost:8787');
assert.equal(localAdventure.origin, 'http://127.0.0.1:8788');
console.log('PASS GitHub project-base bridge URLs and existing local legacy routes');
