const assert = require('node:assert/strict');
const {resolve, update} = require('../save-compat.js');

const scenes = {village: {}, mall: {}, boutique: {}, park: {}, 'home-main': {}};
const old = {version: 1, scene: 'village', x: 124, y: 700, facing: -1,
  visited: ['cafe'], futureData: {kept: true}};
const before = structuredClone(old);
assert.equal(resolve(old, scenes).relocated, true);
const upgraded = update(old, 'village', {x: 1370, y: 980, facing: 1}, ['adventure'], true);
assert.deepEqual(old, before);
assert.deepEqual(upgraded.futureData, {kept: true});
assert.deepEqual(upgraded.visited, ['cafe', 'adventure']);
assert.deepEqual(upgraded.recoveryPreviousLocation,
  {scene: 'village', x: 124, y: 700, facing: -1, travelReturn: undefined});
assert.equal(upgraded.townLayoutVersion, 6);
assert.equal(resolve(upgraded, scenes).relocated, undefined);
const again = update(upgraded, 'village', {x: 1400, y: 1000, facing: 1}, [], false);
assert.deepEqual(again.recoveryPreviousLocation, upgraded.recoveryPreviousLocation);
assert.equal(resolve({version: 1, scene: 'neighbourhood'}, scenes).relocated, true);
assert.equal(resolve({version: 1, scene: 'street'}, scenes).scene, 'mall');
assert.equal(resolve({version: 1, scene: 'home-main'}, scenes).scene, 'home-main');
assert.equal(resolve({version: 1, scene: 'village', townLayoutVersion: 7}, scenes).locked, true);
assert.equal(resolve({version: 2, scene: 'village'}, scenes).locked, true);
assert.equal(resolve({version: 1, scene: 'unknown'}, scenes).locked, true);
console.log('PASS old town relocation, save preservation, repeat reload, aliases and future-version refusal');
