const assert = require('node:assert/strict');
const town = require('../v6-stage/town-map-v6.js');
const step = 20, columns = Math.ceil(town.width / step), rows = Math.ceil(town.height / step);
const initial = [Math.round(1370 / step), Math.round(980 / step)];
assert(town.walkable(initial[0] * step, initial[1] * step), 'initial town spawn');
const queue = [initial], seen = new Set([initial[1] * columns + initial[0]]);
for (let i = 0; i < queue.length; i++) {
  const [x, y] = queue[i];
  for (const [a, b] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
    const key = b * columns + a;
    if (a >= 0 && a < columns && b >= 0 && b < rows && !seen.has(key) && town.walkable(a * step, b * step)) {
      seen.add(key); queue.push([a, b]);
    }
  }
}
for (const zone of town.zones) {
  assert(town.walkable(zone.x, zone.y), `${zone.id} entrance`);
  assert(town.walkable(zone.spawn.x, zone.spawn.y), `${zone.id} return`);
  assert(queue.some(([x, y]) => Math.abs(x * step - zone.x) <= zone.rx && Math.abs(y * step - zone.y) <= zone.ry),
    `${zone.id} connected to the town spawn`);
}
assert.deepEqual(town.camera({x: 0, y: 0}), {x: 0, y: 0});
const edge = town.camera({x: town.width, y: town.height});
assert(edge.x >= 0 && edge.y >= 0 && edge.x < town.width && edge.y < town.height);
console.log(`PASS ${town.zones.length} entrances, returns, sampled route connectivity and camera bounds`);
