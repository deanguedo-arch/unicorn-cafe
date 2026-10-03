#!/usr/bin/env node
'use strict';

/**
 * Rainbow Kitchen package and service-worker unit tests.
 * Run from any directory: node tests/package-tests.cjs
 * Final packages required: node tests/package-tests.cjs --require-packages
 * Optional input path: --sourcepack=/absolute/path/to/original.zip
 *
 * Requires only Node.js 18+ built-ins. No browser or network is used.
 * The real generated sw.js runs in a VM with mocked service-worker events,
 * CacheStorage, and fetch. This is not an offline browser/installation test.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const web = path.join(root, 'webapp');
const out = path.join(root, '..', 'deliverables');
const outputArg = process.argv.find(arg => arg.startsWith('--output='));
const output = outputArg ? path.resolve(outputArg.slice(9)) : path.join(__dirname, 'package-results.json');
const expectedSourceHash = 'dc7d9ffec60d21081c0534c61aff8bb7aa99bb582cdaa3f50cd0f9922ae33034';
const sourceArg = process.argv.find(arg => arg.startsWith('--sourcepack='));
const sourceZip = sourceArg ? path.resolve(sourceArg.slice(13)) : path.resolve(root, '..', 'project_sources', '01-Sneaky-Unicorn-AI-Source-Pack-v1.zip');
const requirePackages = process.argv.includes('--require-packages');
const hashBytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashFile = file => hashBytes(fs.readFileSync(file));
const read = file => fs.readFileSync(file, 'utf8');
const arr = (iterable, mapper) => Array.from(iterable, mapper);
const scope = 'https://rainbow-kitchen.test/games/kitchen/';

function resourceAttrs(html) {
  const result = [];
  for (const tag of html.matchAll(/<(?:script|link|img|source|video|audio|iframe)\b[^>]*>/gi)) {
    for (const attribute of tag[0].matchAll(/\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gi)) {
      result.push({tag: tag[0].match(/^<(\w+)/)[1], attribute: attribute[1], value: attribute[3]});
    }
    assert(!/\bsrcset\s*=/i.test(tag[0]), 'Add a srcset parser before accepting a new srcset resource.');
  }
  return result;
}

function cssUrls(css) {
  return arr(css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi), match => match[2]);
}

function localPath(reference) {
  const url = new URL(reference, scope);
  assert.equal(url.origin, new URL(scope).origin, 'Foreign-origin resource: ' + reference);
  assert(url.pathname.startsWith(new URL(scope).pathname), 'Out-of-scope resource: ' + reference);
  let relative = decodeURIComponent(url.pathname.slice(new URL(scope).pathname.length));
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const resolved = path.resolve(web, relative);
  assert(resolved.startsWith(web + path.sep), 'Path escapes webapp: ' + reference);
  return resolved;
}

function validPng(bytes) {
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG signature');
  assert.equal(bytes.readUInt32BE(8), 13, 'PNG IHDR length');
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', 'PNG IHDR type');
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function createWorker(source) {
  const listeners = new Map();
  const stores = new Map();
  const calls = {network: [], precache: [], delete: [], claim: 0};
  let offline = false;
  let installFailure = null;
  const normalize = request => new URL(typeof request === 'string' ? request : request.url, scope).href;
  const withoutSearch = url => { const value = new URL(url); value.search = ''; value.hash = ''; return value.href; };
  const makeCache = name => {
    const entries = new Map();
    return {
      name, entries,
      async addAll(references) {
        // Model addAll's all-or-nothing insertion; files come from this build.
        calls.precache.push(...references);
        const prepared = [];
        for (const reference of references) {
          if (reference === installFailure) throw new Error('Simulated missing precache resource');
          prepared.push([normalize(reference), new Response(fs.readFileSync(localPath(reference)), {status: 200})]);
        }
        for (const [key, value] of prepared) entries.set(key, value);
      },
      async match(request, options = {}) {
        const key = normalize(request);
        for (const [entryKey, value] of entries) {
          if ((options.ignoreSearch ? withoutSearch(entryKey) === withoutSearch(key) : entryKey === key)) return value.clone();
        }
        return undefined;
      }
    };
  };
  const caches = {
    async open(name) { if (!stores.has(name)) stores.set(name, makeCache(name)); return stores.get(name); },
    async keys() { return arr(stores.keys()); },
    async delete(name) { calls.delete.push(name); return stores.delete(name); }
  };
  const self = {
    location: {origin: new URL(scope).origin}, registration: {scope},
    clients: {async claim() { calls.claim++; }},
    addEventListener(type, listener) { assert(!listeners.has(type), 'Duplicate worker event: ' + type); listeners.set(type, listener); }
  };
  const sandbox = vm.createContext({self, caches, URL, fetch: async request => {
    calls.network.push(normalize(request));
    if (offline) throw new Error('Simulated network offline');
    return new Response('NETWORK:' + normalize(request), {status: 200});
  }});
  new vm.Script(source + '\n;globalThis.__workerInfo={CACHE,FILES};', {filename: 'webapp/sw.js'}).runInContext(sandbox);
  const info = JSON.parse(JSON.stringify(sandbox.__workerInfo));
  async function lifecycle(type) {
    const promises = [];
    listeners.get(type)({waitUntil(promise) { promises.push(promise); }});
    assert(promises.length > 0, type + ' must extend event lifetime');
    await Promise.all(promises);
  }
  async function request(url, options = {}) {
    let response;
    let count = 0;
    listeners.get('fetch')({request: {url: new URL(url, scope).href, method: options.method || 'GET', mode: options.mode || 'cors'}, respondWith(value) { count++; response = value; }});
    assert(count <= 1, 'A fetch event received multiple responses.');
    return {handled: count === 1, response: count ? await response : undefined};
  }
  return {listeners, stores, caches, calls, info, lifecycle, request, setOffline(value) { offline = value; }, failInstallOn(value) { installFailure = value; }};
}

const crcTable = Array.from({length: 256}, (_, value) => {
  let c = value;
  for (let bit = 0; bit < 8; bit++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const value of bytes) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function inspectZip(filename) {
  const bytes = fs.readFileSync(filename);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50 && offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length) { eocd = offset; break; }
  }
  assert(eocd >= 0, 'ZIP end directory not found: ' + filename);
  assert.equal(bytes.readUInt16LE(eocd + 4), 0, 'Split ZIP unsupported');
  assert.equal(bytes.readUInt16LE(eocd + 6), 0, 'Split ZIP unsupported');
  const count = bytes.readUInt16LE(eocd + 10);
  let offset = bytes.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50, 'ZIP central header');
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const expectedCrc = bytes.readUInt32LE(offset + 16);
    const packed = bytes.readUInt32LE(offset + 20);
    const unpacked = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const name = bytes.toString('utf8', offset + 46, offset + 46 + nameLength);
    assert(!(flags & 1), 'Encrypted ZIP member: ' + name);
    assert(!path.isAbsolute(name) && !name.split('/').includes('..') && !name.includes('\\'), 'Unsafe ZIP path: ' + name);
    assert(!files.has(name), 'Duplicate ZIP member: ' + name);
    assert.equal(bytes.readUInt32LE(localOffset), 0x04034b50, 'ZIP local header');
    const dataStart = localOffset + 30 + bytes.readUInt16LE(localOffset + 26) + bytes.readUInt16LE(localOffset + 28);
    const compressed = bytes.subarray(dataStart, dataStart + packed);
    const body = method === 0 ? compressed : method === 8 ? zlib.inflateRawSync(compressed) : null;
    assert(body, 'Unsupported ZIP compression: ' + method);
    assert.equal(body.length, unpacked, 'ZIP uncompressed size: ' + name);
    assert.equal(crc32(body), expectedCrc, 'ZIP CRC32: ' + name);
    files.set(name, body);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return {bytes: bytes.length, files};
}

async function main() {
  const started = Date.now();
  const results = {
    status: 'RUNNING', executedAtUtc: new Date().toISOString(),
    environment: {kind: 'Node VM service-worker unit tests and static package checks; not a browser', nodeVersion: process.version, platform: process.platform},
    sourceSha256: {}, tests: [], skipped: [], metrics: {},
    limitations: [
      'The service worker runs with mocked CacheStorage, fetch and events; this does not verify actual browser installation, cache quotas, lifecycle, HTTP response headers, or offline launch.',
      'Static resource checks and embedded-byte comparisons do not prove browser image decoding, responsive CSS layout or real input/audio behavior.',
      'No Chromium, WebKit, Safari or physical iPhone was launched by this harness.',
      'Original sourcepack verification requires the original uploaded ZIP; --sourcepack can supply its location outside the original workspace.'
    ]
  };
  let failures = 0;
  async function test(name, fn) {
    try { const details = await fn(); results.tests.push({name, status: 'PASS', ...details}); }
    catch (error) { failures++; results.tests.push({name, status: 'FAIL', error: error.message, stack: error.stack}); }
  }
  try {
    const manifestPath = path.join(web, 'VERSION-MANIFEST.json');
    const release = JSON.parse(read(manifestPath));
    const version = release.version;
    results.version = version;
    const standalonePath = path.join(out, `Sneaky-Unicorn-Rainbow-Kitchen-v${version}.html`);
    const swPath = path.join(web, 'sw.js');
    for (const filename of ['index.html', 'style.css', 'app.js', 'kitchen.js', 'recipes.js', 'assets.js', 'sw.js', 'manifest.webmanifest', 'VERSION-MANIFEST.json']) results.sourceSha256['webapp/' + filename] = hashFile(path.join(web, filename));
    results.sourceSha256[path.basename(standalonePath)] = hashFile(standalonePath);
    const swSource = read(swPath);
    const html = read(path.join(web, 'index.html'));
    const standalone = read(standalonePath);
    const artContext = vm.createContext({window: {}});
    new vm.Script(read(path.join(web, 'assets.js')), {filename: 'webapp/assets.js'}).runInContext(artContext);
    const art = JSON.parse(JSON.stringify(artContext.window.ART));
    const worker = createWorker(swSource);

    await test('input-sourcepack-unchanged', () => {
      const actual = hashFile(sourceZip);
      assert.equal(actual, expectedSourceHash);
      assert.equal(JSON.parse(read(path.join(root, 'provenance-source.json'))).sourcepack_sha256, expectedSourceHash);
      return {bytes: fs.statSync(sourceZip).size, expectedSha256: expectedSourceHash, actualSha256: actual};
    });
    await test('webapp-file-manifest-integrity', () => {
      for (const entry of release.files) {
        const filename = path.resolve(web, entry.path);
        assert(filename.startsWith(web + path.sep));
        assert.equal(fs.statSync(filename).size, entry.bytes, entry.path + ' byte count');
        assert.equal(hashFile(filename), entry.sha256, entry.path + ' hash');
      }
      assert.equal(worker.info.CACHE, release.cache);
      const sums = read(path.join(web, 'SHA256SUMS.txt')).trim().split('\n');
      assert.equal(sums.length, release.files.length);
      for (const line of sums) {
        const [, digest, filename] = line.match(/^([a-f0-9]{64})  (.+)$/) || [];
        assert(filename, 'Malformed SHA256SUMS entry');
        assert.equal(hashFile(path.resolve(web, filename)), digest, filename);
      }
      results.metrics.manifestFiles = release.files.length;
      return {filesChecked: release.files.length};
    });
    await test('webapp-self-hosted-resource-graph', () => {
      const references = new Set(resourceAttrs(html).map(ref => ref.value));
      for (const value of Object.values(art)) references.add(value);
      for (const value of cssUrls(read(path.join(web, 'style.css')))) references.add(value);
      const appManifest = JSON.parse(read(path.join(web, 'manifest.webmanifest')));
      references.add(appManifest.start_url);
      for (const icon of appManifest.icons) references.add(icon.src);
      for (const match of read(path.join(web, 'app.js')).matchAll(/serviceWorker\.register\(\s*['"]([^'"]+)['"]/g)) references.add(match[1]);
      for (const reference of references) assert(fs.statSync(localPath(reference)).isFile(), 'Missing reference: ' + reference);
      for (const match of html.matchAll(/data-art=['"]([^'"]+)['"]/g)) assert(art[match[1]], 'Unknown data-art key: ' + match[1]);
      results.metrics.selfHostedReferences = references.size;
      return {uniqueReferences: references.size, assetMapEntries: Object.keys(art).length};
    });
    await test('precache-complete-and-local', () => {
      const files = worker.info.FILES;
      assert.equal(new Set(files).size, files.length, 'Duplicate precache entry');
      for (const reference of files) assert(fs.statSync(localPath(reference)).isFile(), 'Missing precache: ' + reference);
      for (const entry of release.files.filter(entry => entry.path !== 'sw.js')) assert(files.includes('./' + entry.path), 'Runtime file omitted from precache: ' + entry.path);
      assert(files.includes('./') && files.includes('./index.html'));
      results.metrics.precacheEntries = files.length;
      return {entries: files.length};
    });
    await test('manifest-and-icon-png-dimensions', () => {
      const appManifest = JSON.parse(read(path.join(web, 'manifest.webmanifest')));
      assert.equal(appManifest.scope, './');
      assert.equal(appManifest.start_url, './index.html');
      assert.equal(appManifest.display, 'standalone');
      const checked = [];
      for (const icon of appManifest.icons) {
        const dimensions = validPng(fs.readFileSync(localPath(icon.src)));
        assert.equal(icon.sizes, `${dimensions.width}x${dimensions.height}`);
        assert.equal(icon.type, 'image/png');
        checked.push({path: icon.src, ...dimensions});
      }
      const apple = validPng(fs.readFileSync(path.join(web, 'icons/apple-touch-icon.png')));
      assert.deepEqual(apple, {width: 180, height: 180});
      assert(checked.some(icon => icon.width === 192 && icon.height === 192));
      assert(checked.some(icon => icon.width === 512 && icon.height === 512));
      return {icons: [...checked, {path: 'icons/apple-touch-icon.png', ...apple}]};
    });
    await test('standalone-resource-independence-and-script-syntax', () => {
      assert(!/https?:\/\/|wss?:\/\/|(?<=["'])\/\/[a-z0-9]/i.test(standalone), 'Remote URL found in standalone');
      const attrs = resourceAttrs(standalone);
      for (const reference of attrs) assert(reference.value.startsWith('data:') || reference.value.startsWith('#') || reference.value === '', 'Non-embedded standalone reference: ' + reference.value);
      assert(!/<link\b[^>]*rel=['"](?:stylesheet|manifest)['"]/i.test(standalone));
      for (const style of standalone.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
        for (const url of cssUrls(style[1])) assert(url.startsWith('data:') || url.startsWith('#'), 'Non-embedded CSS url: ' + url);
      }
      const scripts = arr(standalone.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi));
      assert(scripts.length >= 4, 'Missing embedded scripts');
      for (let index = 0; index < scripts.length; index++) {
        assert(!/\bsrc=/.test(scripts[index][1]));
        new vm.Script(scripts[index][2], {filename: `standalone-inline-script-${index}`});
      }
      const embeddedContext = vm.createContext({window: {}});
      const assetScript = scripts.find(script => script[2].includes('window.RAINBOW_STANDALONE = true;'));
      assert(assetScript, 'Missing standalone marker');
      new vm.Script(assetScript[2]).runInContext(embeddedContext);
      assert.equal(embeddedContext.window.RAINBOW_STANDALONE, true);
      assert.deepEqual(Object.keys(embeddedContext.window.ART).sort(), Object.keys(art).sort());
      for (const [key, reference] of Object.entries(embeddedContext.window.ART)) {
        const match = reference.match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/);
        assert(match, 'Asset not an embedded WebP: ' + key);
        assert.equal(hashBytes(Buffer.from(match[1], 'base64')), hashFile(localPath(art[key])), 'Embedded bytes differ: ' + key);
      }
      assert(standalone.includes('!window.RAINBOW_STANDALONE'), 'No standalone service-worker guard');
      assert(fs.statSync(standalonePath).size < 20_000_000);
      results.metrics.embeddedAssets = Object.keys(art).length;
      return {inlineScriptsCompiled: scripts.length, embeddedAssetsCompared: Object.keys(art).length, staticResourceAttributes: attrs.length, bytes: fs.statSync(standalonePath).size};
    });
    await test('worker-installs-actual-precache-bytes', async () => {
      assert.deepEqual(arr(worker.listeners.keys()).sort(), ['activate', 'fetch', 'install']);
      await worker.lifecycle('install');
      assert.deepEqual(worker.calls.precache, worker.info.FILES);
      const cache = worker.stores.get(worker.info.CACHE);
      assert.equal(cache.entries.size, worker.info.FILES.length);
      for (const reference of worker.info.FILES) {
        const response = await cache.match(reference);
        assert.equal(hashBytes(Buffer.from(await response.arrayBuffer())), hashFile(localPath(reference)), reference);
      }
      return {byteIdenticalEntries: worker.info.FILES.length};
    });
    await test('worker-cache-hit-works-offline-with-query-string', async () => {
      worker.setOffline(true);
      const asset = Object.values(art)[0];
      const before = worker.calls.network.length;
      const result = await worker.request(asset + '?from-test=1');
      assert(result.handled);
      assert.equal(hashBytes(Buffer.from(await result.response.arrayBuffer())), hashFile(localPath(asset)));
      assert.equal(worker.calls.network.length, before, 'Cached asset attempted fetch');
      return {asset, networkRequests: 0};
    });
    await test('worker-offline-navigation-falls-back-to-index', async () => {
      worker.setOffline(true);
      const before = worker.calls.network.length;
      const result = await worker.request('a-new-route?from-test=1', {mode: 'navigate'});
      assert(result.handled);
      assert.equal(hashBytes(Buffer.from(await result.response.arrayBuffer())), hashFile(path.join(web, 'index.html')));
      assert.equal(worker.calls.network.length, before + 1);
    });
    await test('worker-cached-index-navigation-avoids-network', async () => {
      const before = worker.calls.network.length;
      const result = await worker.request('index.html?home=1', {mode: 'navigate'});
      assert.equal(await result.response.text(), html);
      assert.equal(worker.calls.network.length, before);
    });
    await test('worker-network-miss-online-and-asset-failure-offline', async () => {
      worker.setOffline(false);
      const result = await worker.request('optional-not-precached.webp');
      assert(result.handled);
      assert.equal(await result.response.text(), 'NETWORK:' + scope + 'optional-not-precached.webp');
      worker.setOffline(true);
      await assert.rejects(worker.request('absent-image.webp'), /Simulated network offline/);
    });
    await test('worker-ignores-non-get-foreign-origin-and-outside-scope', async () => {
      const before = worker.calls.network.length;
      const requests = [
        ...['POST', 'PUT', 'DELETE', 'HEAD'].map(method => ({url: 'index.html', method})),
        {url: 'https://foreign.example/game/index.html'},
        {url: 'https://rainbow-kitchen.test.evil.example/games/kitchen/index.html'},
        {url: 'http://rainbow-kitchen.test/games/kitchen/index.html'},
        {url: 'https://rainbow-kitchen.test:8443/games/kitchen/index.html'},
        {url: 'https://rainbow-kitchen.test/other/index.html'},
        {url: 'https://rainbow-kitchen.test/games/kitchen-other/index.html'}
      ];
      for (const request of requests) assert.equal((await worker.request(request.url, request)).handled, false, request.url);
      assert.equal(worker.calls.network.length, before);
      return {ignoredCases: requests.length};
    });
    await test('worker-activation-preserves-unrelated-caches', async () => {
      const old = ['rainbow-kitchen-v0.9.0-previous', 'rainbow-kitchen-v1.0.0-old'];
      const keep = ['sneaky-unicorn-adventure-v14', 'other-app-v1', 'rainbow-kitchen-draft-art'];
      for (const key of [...old, ...keep]) await worker.caches.open(key);
      const current = worker.stores.get(worker.info.CACHE);
      const entriesBefore = current.entries.size;
      await worker.lifecycle('activate');
      assert.deepEqual(worker.calls.delete.sort(), old.sort());
      for (const key of keep) assert(worker.stores.has(key), 'Unrelated cache deleted: ' + key);
      assert.equal(worker.stores.get(worker.info.CACHE), current);
      assert.equal(current.entries.size, entriesBefore);
      assert.equal(worker.calls.claim, 1);
      return {oldCachesRemoved: old.length, unrelatedCachesPreserved: keep.length, currentEntriesPreserved: entriesBefore};
    });
    await test('worker-install-rejects-incomplete-precache', async () => {
      const failed = createWorker(swSource);
      failed.failInstallOn('./index.html');
      await assert.rejects(failed.lifecycle('install'), /Simulated missing precache resource/);
      assert.equal(failed.stores.get(failed.info.CACHE).entries.size, 0);
      assert.equal(failed.calls.claim, 0);
    });

    const finalFiles = [
      `Sneaky-Unicorn-Rainbow-Kitchen-iPhone-v${version}.zip`,
      `Sneaky-Unicorn-Rainbow-Kitchen-Editable-Source-v${version}.zip`,
      `Rainbow-Kitchen-v${version}-SHA256-Manifest.json`
    ];
    const missing = finalFiles.filter(file => !fs.existsSync(path.join(out, file)));
    if (missing.length && !requirePackages) results.skipped.push({name: 'final-download-package-integrity', reason: 'Final packaging not yet present. Rerun with --require-packages after build.py --package.', missing});
    else await test('final-download-package-integrity', () => {
      assert.equal(missing.length, 0, 'Missing final packages: ' + missing.join(', '));
      const finalManifest = JSON.parse(read(path.join(out, finalFiles[2])));
      assert.equal(finalManifest.version, version);
      assert.equal(finalManifest.source_pack_sha256, expectedSourceHash);
      for (const attachment of finalManifest.attachments) {
        const filename = path.join(out, attachment.file);
        assert.equal(fs.statSync(filename).size, attachment.bytes, attachment.file);
        assert(attachment.bytes < 20_000_000, 'Attachment >=20 MB: ' + attachment.file);
        assert.equal(hashFile(filename), attachment.sha256, attachment.file);
      }
      const iphone = inspectZip(path.join(out, finalFiles[0]));
      for (const filename of ['index.html', 'manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) assert(iphone.files.has(filename), 'Missing iPhone ZIP member: ' + filename);
      for (const entry of release.files) assert.equal(hashBytes(iphone.files.get(entry.path)), entry.sha256, 'iPhone ZIP differs from webapp: ' + entry.path);
      const editable = inspectZip(path.join(out, finalFiles[1]));
      for (const filename of ['build.py', 'src/index.html', 'src/app.js', 'src/style.css', 'src/kitchen.js', 'src/recipes.js', 'provenance-source.json']) assert(editable.files.has(filename), 'Missing editable ZIP member: ' + filename);
      for (const reference of Object.values(art)) assert(editable.files.has(reference), 'Missing editable asset: ' + reference);
      return {verifiedAttachmentHashes: finalManifest.attachments.length, iphoneZipMembersCrcChecked: iphone.files.size, editableZipMembersCrcChecked: editable.files.size, iphoneBytes: iphone.bytes, editableBytes: editable.bytes};
    });
    results.status = failures ? 'FAIL' : 'PASS';
  } catch (error) {
    failures++;
    results.status = 'FAIL';
    results.fatalError = {message: error.message, stack: error.stack};
  }
  results.summary = {passed: results.tests.filter(test => test.status === 'PASS').length, failed: failures, skipped: results.skipped.length, elapsedMs: Date.now() - started};
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({status: results.status, ...results.summary, metrics: results.metrics, resultsFile: output}));
  if (failures) {
    for (const test of results.tests.filter(test => test.status === 'FAIL')) console.error(test.name + ': ' + test.error);
    if (results.fatalError) console.error(results.fatalError.message);
    process.exitCode = 1;
  }
}
main();
