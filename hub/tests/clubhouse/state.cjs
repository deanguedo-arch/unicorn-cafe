// Pure state/validation checks; no browser storage or live user save is touched.
const assert = require('node:assert/strict');
const { fresh, apply: profileApply } = require('../../shared/profile.js');
const K = require('../../shared/clubhouse-state.js');
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS', name); }
function code(expected, fn) { assert.throws(fn, e => e?.code === expected, `expected ${expected}`); }
const picture = { version: 1, ops: [
  { tool: 'stamp', shape: 'heart', color: '#E95A88', x: .25, y: .5, size: .14 },
  { tool: 'brush', color: '#294AAD', width: .02, points: [[.1,.1],[.4,.7],[.9,.2]] }
] };

check('Clubhouse normalization is additive and preserves legacy wallet, wardrobe, and progress', () => {
  const p = fresh(); p.coins = 27; p.owned.push('sunhat'); p.outfit.head = 'sunhat'; p.sessions.demo = { id: 'demo', status: 'play' };
  const before = structuredClone({ coins:p.coins, owned:p.owned, outfit:p.outfit, sessions:p.sessions, photos:p.photos, settings:p.settings, id:p.id, revision:p.revision });
  K.normalize(p);
  assert.deepEqual({ coins:p.coins, owned:p.owned, outfit:p.outfit, sessions:p.sessions, photos:p.photos, settings:p.settings, id:p.id, revision:p.revision }, before);
  assert.equal(p.clubhouse.version, 1); assert.deepEqual(p.clubhouse.fort.slots, [0,1,2]); assert.deepEqual(p.clubhouse.ball.ramps, [0,1,2]);
  const future = { clubhouse:{version:2,opaque:{keep:true}} }; K.normalize(future); assert.deepEqual(future.clubhouse,{version:2,opaque:{keep:true}});
});

check('Picture sanitation accepts brush and stamps, normalizes color, and bounds normalized coordinates', () => {
  const clean = K.cleanPicture(picture); assert.equal(clean.ops[0].color, '#e95a88'); assert.deepEqual(clean.ops[1].points, picture.ops[1].points);
  code('invalid', () => K.cleanPicture({version:1,ops:[{tool:'stamp',shape:'sun',color:'#ffffff',x:.5,y:.5,size:.1}]}));
  code('invalid', () => K.cleanPicture({version:1,ops:[{tool:'stamp',shape:'heart',color:'#ffffff',x:1.01,y:.5,size:.1}]}));
  code('invalid', () => K.cleanPicture({version:1,ops:[{tool:'brush',color:'#ffffff',width:.2,points:[[.2,.2]]}]}));
  code('capacity', () => K.cleanPicture({version:1,ops:[{tool:'brush',color:'#ffffff',width:.02,points:[[.5,.5]]}],payload:'x'.repeat(K.LIMITS.bytes)}));
});

check('Draft uses optimistic revision and creates an additive draft-media write', () => {
  const p = fresh(), args = {id:'drawing_1',expectedRevision:0,picture};
  const result = profileApply(p,'clubhouse-draft',args); assert.deepEqual(result,{id:'drawing_1',revision:1});
  assert.equal(K.mediaKey('clubhouse-finish',{id:'drawing_1'}),'clubhouse:draft:drawing_1');
  const writes = K.mediaWrites('clubhouse-draft',args,result,null); assert.equal(writes.length,1); assert.equal(writes[0].key,'clubhouse:draft:drawing_1');
  assert.deepEqual(writes[0].value,K.cleanPicture(picture));
  const before=JSON.stringify(p.clubhouse); code('conflict',()=>profileApply(p,'clubhouse-draft',{id:'drawing_1',expectedRevision:0,picture})); assert.equal(JSON.stringify(p.clubhouse),before);
  code('conflict',()=>profileApply(p,'clubhouse-draft',{id:'other',expectedRevision:0,picture}));
});

check('Finish stores artwork metadata, carries its cleaned media, and reload retains it', () => {
  const p=fresh(); profileApply(p,'clubhouse-draft',{id:'drawing_1',expectedRevision:0,picture});
  code('conflict',()=>profileApply(p,'clubhouse-finish',{id:'drawing_1',expectedRevision:0},picture));
  const result=profileApply(p,'clubhouse-finish',{id:'drawing_1',expectedRevision:1},picture); assert.deepEqual(result,{id:'drawing_1'});
  assert.deepEqual(Object.keys(p.clubhouse.artworks),['drawing_1']); assert.equal(p.clubhouse.artworks.drawing_1.media,'clubhouse:art:drawing_1');
  assert.deepEqual(p.clubhouse.presentation.carried.picture,K.cleanPicture(picture)); assert.equal(p.clubhouse.carried,'drawing_1'); assert.equal(p.clubhouse.draft,null);
  const writes=K.mediaWrites('clubhouse-finish',{id:'drawing_1'},result,picture); assert.equal(writes[0].key,'clubhouse:art:drawing_1');
  const reloaded=structuredClone(p); K.normalize(reloaded); assert.deepEqual(reloaded.clubhouse,p.clubhouse);
  const noContent=fresh(); profileApply(noContent,'clubhouse-draft',{id:'blank',expectedRevision:0,picture}); code('invalid',()=>profileApply(noContent,'clubhouse-finish',{id:'blank',expectedRevision:1},{version:1,ops:[]}));
});

check('Carry and hang use media, compare-and-set stale revision, and gallery presentation', () => {
  const p=fresh(); profileApply(p,'clubhouse-draft',{id:'drawing_1',expectedRevision:0,picture}); profileApply(p,'clubhouse-finish',{id:'drawing_1',expectedRevision:1},picture);
  profileApply(p,'clubhouse-display',{artwork:'drawing_1',slot:'cafe',expectedArtwork:null});
  assert.equal(p.clubhouse.displayed.cafe,'drawing_1'); assert.equal(p.clubhouse.carried,null); assert.equal(p.clubhouse.presentation.cafe.id,'drawing_1');
  assert.equal(K.publicView(p).displayed.cafe.id,'drawing_1');
  code('conflict',()=>profileApply(p,'clubhouse-display',{artwork:'drawing_1',slot:'cafe',expectedArtwork:null}));
  profileApply(p,'clubhouse-carry',{artwork:'drawing_1'},picture); assert.equal(K.mediaKey('clubhouse-carry',{artwork:'drawing_1'}),'clubhouse:art:drawing_1');
  assert.equal(p.clubhouse.presentation.carried.id,'drawing_1'); assert.equal(p.clubhouse.presentation.downstairs,null);
  code('missing',()=>profileApply(p,'clubhouse-carry',{artwork:'unknown'},picture));
  assert.deepEqual(profileApply(p,'clubhouse-display',{artwork:'drawing_1',slot:'cafe',expectedArtwork:'drawing_1'}),{id:'drawing_1',slot:'cafe'});
  assert.equal(p.clubhouse.displayed.cafe,'drawing_1');
});

check('Keep-copy recovery preserves an active draft and every existing artwork', () => {
  const p=fresh();p.clubhouse.draft={id:'work_in_progress',revision:4};p.clubhouse.artworks.existing={id:'existing',media:'clubhouse:art:existing'};
  const beforeDraft=structuredClone(p.clubhouse.draft);
  const args={id:'recovered_copy',picture};const result=profileApply(p,'clubhouse-keep-copy',args);assert.deepEqual(result,{id:'recovered_copy'});
  assert.deepEqual(p.clubhouse.draft,beforeDraft);assert.deepEqual(p.clubhouse.artworks.existing,{id:'existing',media:'clubhouse:art:existing'});
  assert.deepEqual(p.clubhouse.artworks.recovered_copy,{id:'recovered_copy',at:p.clubhouse.artworks.recovered_copy.at,media:'clubhouse:art:recovered_copy'});
  assert.equal(p.clubhouse.carried,'recovered_copy');assert.deepEqual(p.clubhouse.presentation.carried.picture,K.cleanPicture(picture));
  const write=K.mediaWrites('clubhouse-keep-copy',args,result);assert.equal(write[0].key,'clubhouse:art:recovered_copy');assert.deepEqual(write[0].value,K.cleanPicture(picture));
  code('conflict',()=>profileApply(p,'clubhouse-keep-copy',args));
});

check('Capacity and invalid-input paths reject over-limit artwork and missing/corrupt media', () => {
  const p=fresh(); for(let i=0;i<K.LIMITS.artworks;i++){const id=`art_${i}`;p.clubhouse.artworks[id]={id,media:`clubhouse:art:${id}`};}
  code('capacity',()=>profileApply(p,'clubhouse-draft',{id:'extra',expectedRevision:0,picture}));
  const q=fresh(); code('invalid',()=>profileApply(q,'clubhouse-draft',{id:'contains space',expectedRevision:0,picture}));
  const blank=fresh(), emptyPicture={version:1,ops:[]};
  profileApply(blank,'clubhouse-draft',{id:'blank',expectedRevision:0,picture:emptyPicture});
  code('invalid',()=>profileApply(blank,'clubhouse-finish',{id:'blank',expectedRevision:1},emptyPicture));
  code('conflict',()=>profileApply(q,'clubhouse-finish',{id:'not_started',expectedRevision:1},picture));
  code('invalid',()=>profileApply(q,'clubhouse-display',{artwork:'not_started',slot:'cafe',expectedArtwork:null}));
});

check('Fort, ball-ramp, and pink/blue puppet progress validates and persists', () => {
  const p=fresh();
  profileApply(p,'clubhouse-play',{kind:'fort',state:{slots:[2,0,1]}}); assert.deepEqual(p.clubhouse.fort.slots,[2,0,1]);
  profileApply(p,'clubhouse-play',{kind:'ball',state:{ramps:[2,1,0]}}); assert.deepEqual(p.clubhouse.ball.ramps,[2,1,0]);
  code('invalid',()=>profileApply(p,'clubhouse-play',{kind:'fort',state:{slots:[0,0,2]}}));
  code('invalid',()=>profileApply(p,'clubhouse-play',{kind:'ball',state:{ramps:[0,3,1]}}));
  profileApply(p,'clubhouse-play',{kind:'puppets',state:{friend:'pink'}}); profileApply(p,'clubhouse-play',{kind:'puppets',state:{friend:'blue'}});
  assert.deepEqual(p.clubhouse.friends,{pink:true,blue:true}); assert.equal(p.clubhouse.puppets.friend,'blue');
});


check('Public profile projects only carried and café-displayed pictures, not artwork library/draft or play state', () => {
  const {Profile}=require('../../shared/profile.js'), p=fresh();
  p.clubhouse.draft={id:'private_draft',revision:2};
  p.clubhouse.artworks={private_a:{id:'private_a',media:'clubhouse:art:private_a'},private_b:{id:'private_b',media:'clubhouse:art:private_b'}};
  p.clubhouse.carried='private_a';p.clubhouse.presentation={carried:{id:'private_a',picture:K.cleanPicture(picture)},cafe:{id:'private_b',picture:K.cleanPicture(picture)},downstairs:{id:'private_a',picture:K.cleanPicture(picture)}};
  p.clubhouse.displayed={cafe:'private_b',downstairs:'private_a'};p.clubhouse.fort={slots:[2,0,1]};p.clubhouse.ball={ramps:[2,1,0]};p.clubhouse.puppets={friend:'blue'};
  const profile=new Profile('public-projection-test');profile.value=p;
  const pub=profile.public(); assert.deepEqual(Object.keys(pub.clubhouse).sort(),['carried','displayed','friends','version']);
  assert.equal(pub.clubhouse.carried.id,'private_a');assert.equal(pub.clubhouse.displayed.cafe.id,'private_b');
  assert.equal(pub.clubhouse.displayed.downstairs,undefined);assert.equal(pub.clubhouse.fort,undefined);assert.equal(pub.clubhouse.ball,undefined);assert.equal(pub.clubhouse.puppets,undefined);
  assert.equal(pub.clubhouse.draft,undefined);assert.equal(pub.clubhouse.artworks,undefined);assert.equal(pub.clubhouse.library,undefined);
  assert.deepEqual(Object.keys(pub.clubhouse.displayed),['cafe']);profile.close();
});

console.log(`${count} clubhouse pure-state checks passed`);
