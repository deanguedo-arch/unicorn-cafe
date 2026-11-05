'use strict';
// All profiles and media here are synthetic; no browser storage is opened.
const assert = require('node:assert/strict');
const {fresh, apply} = require('../shared/profile.js');
const clone = value => JSON.parse(JSON.stringify(value));
const profile = fresh();
profile.coins = 37;
profile.owned.push('legacy-hero', 'legacy-mask');
profile.outfit = {head: 'bow', body: 'tee', accessory: 'beads'};
profile.outfits[0] = clone(profile.outfit);
profile.photos = [{id: 'synthetic-photo', image: 'data:image/png;base64,AA==',
  outfit: clone(profile.outfit), at: 42}];
profile.syntheticEarned = {opponent2: true, unlock: ['synthetic-unlock']};
apply(profile, 'clubhouse-keep-copy', {id: 'synthetic-heart', picture: {
  version: 1, ops: [{tool: 'stamp', shape: 'heart', color: '#f06a99', x: .5, y: .5, size: .2}]
}});
for (const legacy of [true, false]) {
  const input = clone(profile);
  if (legacy) for (const key of ['clubhouse', 'playbook', 'scrapbook', 'decor']) delete input[key];
  const preserved = clone({coins: input.coins, owned: input.owned, outfit: input.outfit,
    outfits: input.outfits, photos: input.photos, syntheticEarned: input.syntheticEarned,
    artworks: input.clubhouse?.artworks});
  apply(input, 'settings', {muted: true, reduced: false});
  const output = clone(input);
  apply(output, 'settings', {muted: false, reduced: false});
  for (const key of ['coins', 'owned', 'outfit', 'outfits', 'photos', 'syntheticEarned'])
    assert.deepEqual(output[key], preserved[key], `preserve ${key}`);
  assert.deepEqual(output.clubhouse.artworks, preserved.artworks || {});
}
console.log('PASS synthetic old and current profiles preserve coins, outfits, photos, gallery and unknown fields');
