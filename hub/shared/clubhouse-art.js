/* Unicorn World clubhouse: original, code-native props over the unchanged room art.
 * Coordinate contract: prop(ctx, kind, x, y, width, options) is bottom-centred.
 * All props use a 320-unit design width. bounds[kind] is [left, top, right, bottom]
 * in width-relative units, including shadows. time is seconds; reduced freezes it.
 * drawPicture draws cream paper at top-left x/y, then normalized version-1 ops.
 * Nothing here changes pictures, profiles, sprites, the DOM, or animation clocks.
 * Call load() once to prepare original cushions and the original unicorn puppet.
 * The complete prop silhouettes still draw before those optional sprites arrive.
 */
(function (root) {
  'use strict';

  const palette = Object.freeze({
    ink: '#76506e', plum: '#795381', plumDark: '#573b61', lilac: '#b995cf',
    pink: '#ed91b9', pinkLight: '#ffd3dc', pinkDark: '#bd608d',
    cream: '#fff5dc', paper: '#fff9eb', gold: '#e4b45d', goldLight: '#ffe5a0',
    wood: '#e6af83', woodDark: '#b87967', blue: '#92c8df', mint: '#a9d7bd'
  });
  const P = palette, TAU = Math.PI * 2;
  const images = Object.create(null);
  const scriptURL = typeof document !== 'undefined' ? document.currentScript?.src : null;
  let loading = null;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (v, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const color = v => typeof v === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v) ? v : P.pinkDark;

  function path(c, draw, fill, stroke = P.ink, width = 2) {
    c.beginPath(); draw(c);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  }
  function roundPath(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function round(c, x, y, w, h, r, fill, stroke = P.ink, lw = 2) {
    path(c, () => roundPath(c, x, y, w, h, r), fill, stroke, lw);
  }
  function ellipse(c, x, y, rx, ry, fill, stroke = null, lw = 2) {
    path(c, () => c.ellipse(x, y, rx, ry, 0, 0, TAU), fill, stroke, lw);
  }
  function line(c, points, stroke = P.ink, width = 2) {
    path(c, () => points.forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](p[0], p[1])), null, stroke, width);
  }
  function gradient(c, x1, y1, x2, y2, colors) {
    const g = c.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((v, i) => g.addColorStop(i / (colors.length - 1), v)); return g;
  }
  function star(c, x, y, r, fill = P.goldLight, stroke = P.gold, lw = 1.5) {
    path(c, () => {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.46 : r;
        c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q);
      }
      c.closePath();
    }, fill, stroke, lw);
  }
  function heart(c, x, y, size, fill, stroke = null, lw = 1.5) {
    const r = size / 2;
    path(c, () => {
      c.moveTo(x, y + r * .86);
      c.bezierCurveTo(x - r * 1.8, y - r * .18, x - r * .65, y - r * 1.3, x, y - r * .38);
      c.bezierCurveTo(x + r * .65, y - r * 1.3, x + r * 1.8, y - r * .18, x, y + r * .86);
      c.closePath();
    }, fill, stroke, lw);
  }
  function shadow(c, x = 0, y = -4, rx = 145, ry = 17) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(88,48,67,.23)'); g.addColorStop(.75, 'rgba(88,48,67,.10)'); g.addColorStop(1, 'rgba(88,48,67,0)');
    ellipse(c, 0, 0, rx, rx, g); c.restore();
  }
  function stitches(c, points, col = '#ffe4e2') {
    c.save(); c.setLineDash([3, 5]); line(c, points, col, 1.3); c.restore();
  }

  /** Render a stamp without paper. size is its full approximate width in pixels. */
  function drawStamp(c, shape, ink, x, y, size) {
    if (!c || !Number.isFinite(size) || size <= 0) return;
    ink = color(ink); c.save();
    if (shape === 'heart') heart(c, x, y, size, ink);
    else if (shape === 'flower') {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * TAU / 5;
        ellipse(c, x + Math.cos(a) * size * .25, y + Math.sin(a) * size * .25, size * .21, size * .21, ink);
      }
      ellipse(c, x, y, size * .16, size * .16, P.goldLight);
    } else if (shape === 'rainbow') {
      const colors = [ink, P.goldLight, P.mint, P.blue];
      colors.forEach((tint, i) => path(c, () => c.arc(x, y + size * .2, size * (.44 - i * .085), Math.PI, TAU), null, tint, size * .092));
      ellipse(c, x - size * .4, y + size * .22, size * .12, size * .07, P.cream);
      ellipse(c, x + size * .4, y + size * .22, size * .12, size * .07, P.cream);
    }
    c.restore();
  }

  /** Bounded, read-only renderer for the public normalized picture contract. */
  function drawPicture(c, picture, x, y, w, h) {
    if (!c || ![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return;
    c.save(); c.translate(x, y);
    const m = Math.min(w, h), edge = Math.min(m * .04, Math.max(.6, m * .006));
    round(c, 0, 0, w, h, m * .025, gradient(c, 0, 0, w, h, [P.paper, '#fff5e1']), '#dac7a9', edge);
    c.beginPath(); roundPath(c, edge, edge, w - edge * 2, h - edge * 2, m * .02); c.clip();
    // A very light paper grain, deterministic and independent of the user's marks.
    c.fillStyle = 'rgba(168,135,102,.045)';
    for (let i = 0; i < 42; i++) c.fillRect(((i * 61 + 13) % 101) / 101 * w, ((i * 37 + 7) % 97) / 97 * h, m * .007, m * .003);
    const ops = picture?.version === 1 && Array.isArray(picture.ops) ? picture.ops : [];
    for (const op of ops.slice(0, 800)) {
      if (!op || typeof op !== 'object') continue;
      if (op.tool === 'stamp' && ['heart', 'flower', 'rainbow'].includes(op.shape)) {
        drawStamp(c, op.shape, op.color, clamp(finite(op.x, .5), 0, 1) * w,
          clamp(finite(op.y, .5), 0, 1) * h, clamp(finite(op.size, .16), .08, .25) * m);
      } else if (op.tool === 'brush' && Array.isArray(op.points)) {
        const points = op.points.slice(0, 1600).filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
        if (!points.length) continue;
        const width = clamp(finite(op.width, .025), .005, .06) * m, ink = color(op.color);
        c.lineCap = 'round'; c.lineJoin = 'round';
        if (points.length === 1) ellipse(c, clamp(points[0][0], 0, 1) * w, clamp(points[0][1], 0, 1) * h, width / 2, width / 2, ink);
        else path(c, () => points.forEach((p, i) => c[i ? 'lineTo' : 'moveTo'](clamp(p[0], 0, 1) * w, clamp(p[1], 0, 1) * h)), null, ink, width);
      }
    }
    c.restore();
  }

  function load() {
    if (loading) return loading;
    if (typeof Image === 'undefined' || !scriptURL) return Promise.resolve({ cushions: false, unicorn: false });
    const sources = {
      decor: new URL('../assets/playbook/decor-atlas.png', scriptURL).href,
      unicorn: new URL('../../game/build/assets/u_idle0.webp', scriptURL).href
    };
    // Missing optional source art is reported, not retried or silently replaced.
    loading = Promise.all(Object.entries(sources).map(([key, url]) => new Promise(resolve => {
      const im = new Image(); im.onload = () => { images[key] = im; resolve(true); };
      im.onerror = () => resolve(false); im.src = url;
    }))).then(([cushions, unicorn]) => ({ cushions, unicorn }));
    return loading;
  }

  function pillow(c, x, y, w, h, fill, angle = 0, motif = true) {
    c.save(); c.translate(x, y); c.rotate(angle);
    path(c, () => {
      c.moveTo(-w / 2, -h * .75); c.quadraticCurveTo(-w * .55, -h * 1.13, -w * .15, -h);
      c.quadraticCurveTo(w * .25, -h * 1.11, w / 2, -h * .8); c.quadraticCurveTo(w * .4, -h * .4, w / 2, -h * .1);
      c.quadraticCurveTo(w * .15, h * .05, -w * .25, -h * .05); c.quadraticCurveTo(-w * .55, h * .1, -w / 2, -h * .3); c.closePath();
    }, gradient(c, -w / 2, -h, w / 2, 0, [P.cream, fill, P.plum]), P.ink, 2.2);
    path(c, () => { c.moveTo(-w * .38, -h * .74); c.quadraticCurveTo(0, -h * .95, w * .36, -h * .76); }, null, '#fff2e6', 2);
    stitches(c, [[-w * .4, -h * .26], [0, -h * .17], [w * .38, -h * .25]]);
    if (motif) heart(c, 0, -h * .53, Math.min(w, h) * .36, '#ffe4bf', P.gold, 1.2);
    c.restore();
  }

  /** Original atlas cushion, bottom-centred; procedural fabric only while absent. */
  function cushion(c, kind, x, y, width, rotation = 0) {
    c.save(); c.translate(x, y); c.rotate(finite(rotation));
    const im = images.decor;
    if (im?.naturalWidth) {
      const i = kind === 'blue' || kind === 'cushion-blue' ? 2 : 1;
      const sw = im.naturalWidth / 3, sh = im.naturalHeight / 3, h = width * sh / sw;
      c.drawImage(im, i * sw, 0, sw, sh, -width / 2, -h, width, h);
    } else pillow(c, 0, 0, width * .78, width * .55, kind === 'blue' ? P.blue : P.pink);
    c.restore();
  }

  function brush(c, x, y, angle, ink = P.pinkDark) {
    c.save(); c.translate(x, y); c.rotate(angle);
    round(c, -2.5, -40, 5, 39, 2.5, P.goldLight, P.woodDark, 1.2);
    round(c, -3.2, -48, 6.4, 11, 1, '#e1c6c0', P.plum, 1);
    path(c, () => { c.moveTo(-3.5, -48); c.quadraticCurveTo(-7, -56, 0, -64); c.quadraticCurveTo(6, -55, 3.5, -48); c.closePath(); }, ink, P.ink, 1);
    c.restore();
  }
  function paintPot(c, x, y, fill, r = 13) {
    round(c, x - r, y - 20, r * 2, 24, 5, gradient(c, x - r, y, x + r, y, [P.cream, fill, P.plum]), P.ink, 1.5);
    ellipse(c, x, y - 20, r, r * .38, '#ffefd7', P.ink, 1.5);
    ellipse(c, x, y - 20, r * .76, r * .23, fill);
    path(c, () => { c.moveTo(x - r * .58, y - 12); c.lineTo(x - r * .58, y - 3); }, null, '#fff1df', 1.5);
  }

  function artTable(c, opts) {
    shadow(c, 0, -5, 160, 16);
    for (const [x, y] of [[-111, -92], [110, -92], [-124, -66], [117, -65]]) {
      path(c, () => { c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.lineTo(x + 7, -10); c.quadraticCurveTo(x, -3, x - 7, -10); c.closePath(); }, gradient(c, x - 10, y, x + 9, 0, ['#f4d1a5', P.wood, P.woodDark]), P.ink, 2.2);
      line(c, [[x - 4, y + 9], [x - 3, -17]], '#ffdfb2', 2);
    }
    path(c, () => { c.moveTo(-149, -117); c.lineTo(151, -115); c.lineTo(150, -91); c.quadraticCurveTo(0, -72, -150, -94); c.closePath(); }, gradient(c, 0, -119, 0, -83, [P.wood, '#d38d76']), P.ink, 2.3);
    path(c, () => { c.moveTo(-154, -123); c.quadraticCurveTo(-154, -136, -136, -144); c.lineTo(118, -154); c.quadraticCurveTo(146, -151, 154, -128); c.lineTo(157, -108); c.quadraticCurveTo(5, -80, -156, -110); c.closePath(); }, gradient(c, -100, -160, 90, -88, ['#ffe5b8', '#f5d0a6', '#eab18c']), P.ink, 2.4);
    path(c, () => { c.moveTo(-147, -113); c.quadraticCurveTo(0, -90, 147, -111); }, null, P.goldLight, 3);
    for (let i = 0; i < 5; i++) path(c, () => { c.moveTo(-130 + i * 7, -130 + i * 6); c.bezierCurveTo(-20, -139 + i * 7, 65, -126 + i * 5, 135, -131 + i * 5); }, null, 'rgba(167,100,82,.12)', 1);
    c.save(); c.translate(-104, -143); c.transform(1, .025, -.18, .53, 0, 0); drawPicture(c, opts.picture, 0, 0, 172, 91); c.restore();
    // Stamp blocks are tangible tools, not marks added to the saved picture.
    for (const [x, y, shape, ink] of [[-118, -106, 'heart', P.pinkDark], [-83, -101, 'flower', P.plum]]) {
      round(c, x - 12, y - 10, 24, 15, 4, P.wood, P.woodDark, 1.4);
      ellipse(c, x, y - 9, 11, 6, P.cream, P.gold, 1.2); drawStamp(c, shape, ink, x, y - 9, 11);
      round(c, x - 4, y - 22, 8, 12, 3, P.goldLight, P.woodDark, 1.3);
    }
    paintPot(c, 83, -133, P.pink, 12); paintPot(c, 116, -128, P.blue, 12);
    brush(c, 125, -142, .18, P.plum); brush(c, 121, -141, -.17, P.pinkDark);
    round(c, 109, -160, 29, 34, 6, gradient(c, 108, -159, 136, -124, [P.cream, P.lilac, P.plum]), P.ink, 1.5);
    line(c, [[113, -153], [113, -136]], '#fff4e6', 2); heart(c, 123, -143, 12, P.goldLight);
    brush(c, 42, -99, 1.3, P.mint);
    heart(c, 0, -90, 19, P.pinkLight, '#c48474', 1.3);
  }

  function fort(c, opts) {
    shadow(c, 0, -3, 157, 21);
    ellipse(c, 0, -18, 151, 31, '#c391bb', P.plum, 2);
    ellipse(c, 0, -23, 138, 25, '#e6c2d7', P.goldLight, 2);
    // Blanket drapes over the cushion towers; a dark opening gives real depth.
    pillow(c, -97, -24, 80, 82, P.lilac, -.13);
    pillow(c, 96, -24, 83, 78, P.pink, .13);
    pillow(c, -94, -86, 73, 51, P.pinkLight, -.11);
    pillow(c, 93, -83, 77, 51, P.lilac, .13);
    path(c, () => { c.moveTo(-99, -41); c.lineTo(-77, -167); c.quadraticCurveTo(-11, -227, 10, -227); c.lineTo(103, -46); c.closePath(); }, gradient(c, 0, -210, 0, -30, [P.plum, '#3e304e']), P.plumDark, 2);
    ellipse(c, 1, -41, 75, 17, '#a284ae');
    path(c, () => { c.moveTo(-148, -64); c.quadraticCurveTo(-128, -147, -18, -225); c.quadraticCurveTo(0, -239, 18, -226); c.quadraticCurveTo(78, -174, 145, -64); c.quadraticCurveTo(132, -56, 112, -62); c.lineTo(11, -208); c.quadraticCurveTo(-10, -180, -35, -101); c.quadraticCurveTo(-72, -56, -148, -64); c.closePath(); }, gradient(c, -124, -205, 114, -64, ['#ffe2e1', '#eea1c2', '#c477a8']), P.ink, 2.6);
    path(c, () => { c.moveTo(11, -209); c.quadraticCurveTo(64, -179, 145, -64); }, null, P.goldLight, 4);
    path(c, () => { c.moveTo(-143, -66); c.quadraticCurveTo(-92, -65, -34, -104); }, null, P.goldLight, 3);
    path(c, () => { c.moveTo(-25, -211); c.quadraticCurveTo(-78, -143, -97, -85); }, null, '#ffebe5', 4);
    path(c, () => { c.moveTo(-8, -218); c.quadraticCurveTo(-42, -147, -48, -114); }, null, 'rgba(127,69,122,.22)', 3);
    stitches(c, [[-136, -73], [-94, -81], [-65, -96], [-43, -117]]);
    path(c, () => { c.moveTo(-101, -136); c.quadraticCurveTo(0, -103, 107, -131); }, null, P.gold, 2);
    for (let i = 0; i < 5; i++) {
      const x = -80 + i * 40, y = -117 - Math.abs(i - 2) * 5;
      line(c, [[x, y - 6], [x, y + 5]], P.gold, 1.3);
      star(c, x, y + 9, 7, i % 2 ? P.pinkLight : P.goldLight);
    }
    cushion(c, 'pink', -94, -2, 105, -.11); cushion(c, 'blue', 101, -3, 102, .13);
    pillow(c, 6, -16, 86, 31, P.lilac, 0, false);
    star(c, 3, -32, 8, P.goldLight, P.gold, 1.2);
  }

  function drawBall(c, x, y, r, ink = P.pink) {
    if (!Number.isFinite(r) || r <= 0) return;
    c.save(); c.translate(x, y);
    const g = c.createRadialGradient(-r * .35, -r * .45, r * .08, 0, 0, r);
    g.addColorStop(0, P.cream); g.addColorStop(.35, color(ink)); g.addColorStop(1, P.plum);
    ellipse(c, 0, 0, r, r, g, P.ink, Math.max(.8, r * .09));
    path(c, () => { c.moveTo(-r * .65, -r * .73); c.bezierCurveTo(r * .45, -r * .7, -r * .6, r * .5, r * .65, r * .73); }, null, P.goldLight, r * .18);
    ellipse(c, -r * .32, -r * .4, r * .15, r * .1, 'rgba(255,255,255,.7)'); c.restore();
  }

  // Design-unit centre of the rolling ball. Progress 0..1 follows three ramps.
  function rampPoint(progress) {
    const p = clamp(finite(progress), 0, 1), n = Math.min(2, Math.floor(p * 3)), t = p === 1 ? 1 : (p * 3) % 1;
    return [{ x: -111 + 222 * t, y: -192 + 40 * t }, { x: 111 - 222 * t, y: -131 + 41 * t }, { x: -111 + 212 * t, y: -70 + 36 * t }][n];
  }
  /** Modular bevelled ramp, global endpoint coordinates and vertical depth. */
  function ramp(c, x1, y1, x2, y2, depth = 13, ink = P.pink) {
    if (!c || ![x1, y1, x2, y2, depth].every(Number.isFinite) || depth <= 0 || x1 === x2) return;
    c.save();
    const left = Math.min(x1, x2), right = Math.max(x1, x2), ly = x1 < x2 ? y1 : y2, ry = x1 < x2 ? y2 : y1;
    path(c, () => { c.moveTo(left, ly); c.lineTo(right, ry); c.lineTo(right, ry + depth); c.lineTo(left, ly + depth); c.closePath(); }, gradient(c, left, ly, right, ry + depth, [P.pinkLight, color(ink)]), P.ink, 2.2);
    line(c, [[left, ly], [right, ry]], P.goldLight, 4);
    line(c, [[left + 6, ly + depth * .62], [right - 6, ry + depth * .62]], 'rgba(255,243,219,.48)', 1);
    for (const x of [left + Math.min(16, (right - left) * .15), right - Math.min(16, (right - left) * .15)]) {
      const y = ly + (ry - ly) * ((x - left) / (right - left)); ellipse(c, x, y + depth * .54, 2, 2, P.goldLight);
    }
    c.restore();
  }
  function ballRamp(c, opts) {
    shadow(c, 0, -3, 156, 18);
    round(c, -142, -22, 284, 18, 9, gradient(c, 0, -23, 0, -3, [P.wood, P.woodDark]), P.ink, 2.2);
    for (const x of [-120, 121]) {
      round(c, x - 10, -195, 20, 180, 7, gradient(c, x - 10, 0, x + 10, 0, [P.cream, P.wood, P.woodDark]), P.ink, 2);
      line(c, [[x - 4, -186], [x - 4, -29]], P.goldLight, 2);
      ellipse(c, x, -200, 14, 14, P.goldLight, P.woodDark, 2); heart(c, x, -200, 13, P.pinkDark);
    }
    const ramps = [[-127, -183, 126, -138], [128, -121, -128, -75], [-128, -60, 126, -17]];
    ramps.forEach(([x1, y1, x2, y2], i) => ramp(c, x1, y1, x2, y2, 13, i === 1 ? '#ab86bf' : '#d988b1'));
    // A shallow padded catching tray makes the end of the route legible.
    ellipse(c, 117, -11, 33, 11, P.plum, P.ink, 2);
    path(c, () => { c.moveTo(84, -11); c.quadraticCurveTo(116, 2, 150, -11); c.lineTo(148, -1); c.quadraticCurveTo(117, 12, 86, -1); c.closePath(); }, P.lilac, P.ink, 2);
    const at = rampPoint(Number.isFinite(opts.progress) ? opts.progress : opts.reduced ? .12 : ((opts.time % 6) + 6) % 6 / 6);
    if (opts.ball) drawBall(c, at.x, at.y, 13, P.pink);
    drawBall(c, -145, -15, 12, P.blue);
    star(c, 0, -18, 8, P.goldLight, P.gold, 1.3);
  }

  /** Stick-puppet primitive. The unicorn uses the canonical sprite, never a redraw. */
  function drawPuppet(c, kind, x, y, height, options = {}) {
    const time = options.reduced ? 0 : finite(options.time), bob = Math.sin(time * 2.8) * height * .035;
    c.save(); c.translate(x, y + bob); c.scale(height / 100, height / 100);
    round(c, -2.8, -42, 5.6, 49, 2.4, P.goldLight, P.woodDark, 1.4);
    const im = images.unicorn || root.UWArt?.images?.u_idle0;
    if (kind === 'unicorn' && im && (im.naturalWidth || im.width)) {
      // Original u_idle0 source bounds, shared with UWArt. No filters, recolour or overlays.
      c.drawImage(im, 33, 44, 126, 141, -34, -100, 68, 76);
    } else if (kind === 'heart') heart(c, 0, -65, 51, gradient(c, -20, -90, 20, -40, [P.pinkLight, P.pink, P.pinkDark]), P.ink, 2);
    else star(c, 0, -65, 31, gradient(c, -25, -90, 25, -40, [P.cream, P.goldLight, P.gold]), P.ink, 2);
    c.restore();
  }

  function puppetTheatre(c, opts) {
    shadow(c, 0, -3, 150, 18);
    round(c, -127, -197, 254, 180, 8, gradient(c, -127, -198, 127, 0, [P.cream, P.wood, P.woodDark]), P.ink, 2.8);
    round(c, -107, -181, 214, 114, 5, gradient(c, 0, -180, 0, -67, ['#50394f', '#8c648c']), P.gold, 3);
    for (let i = 0; i < 5; i++) star(c, -73 + i * 36, -151 + (i % 2) * 17, i % 2 ? 3.5 : 5, '#d5afbd', null);
    // Puppets are clipped behind the stage sill, not painted on top of the booth.
    c.save(); c.beginPath(); c.rect(-105, -179, 210, 112); c.clip();
    if (opts.puppets) {
      drawPuppet(c, 'unicorn', -38, -61, 86, opts);
      drawPuppet(c, 'star', 48, -69, 74, { time: opts.time + .7, reduced: opts.reduced });
    }
    c.restore();
    for (const side of [-1, 1]) {
      c.save(); c.scale(side, 1);
      path(c, () => { c.moveTo(7, -183); c.lineTo(108, -183); c.lineTo(108, -72); c.quadraticCurveTo(79, -79, 70, -107); c.quadraticCurveTo(70, -151, 7, -183); c.closePath(); }, gradient(c, 30, -180, 110, -79, [P.pinkLight, '#e995b6', '#b76794']), P.ink, 1.8);
      path(c, () => { c.moveTo(49, -177); c.quadraticCurveTo(92, -148, 84, -109); c.quadraticCurveTo(85, -93, 101, -85); }, null, '#ffd6dd', 3);
      path(c, () => { c.moveTo(73, -175); c.quadraticCurveTo(101, -142, 93, -107); }, null, '#b96891', 2);
      line(c, [[73, -110], [106, -106]], P.goldLight, 5); c.restore();
    }
    path(c, () => { c.moveTo(-139, -195); c.lineTo(-139, -219); c.quadraticCurveTo(-78, -216, -54, -237); c.quadraticCurveTo(0, -267, 54, -237); c.quadraticCurveTo(78, -216, 139, -219); c.lineTo(139, -195); c.closePath(); }, gradient(c, 0, -253, 0, -195, [P.cream, P.goldLight, P.wood]), P.ink, 2.7);
    line(c, [[-128, -209], [-74, -210]], '#fff5d6', 2); line(c, [[74, -210], [128, -209]], '#fff5d6', 2);
    heart(c, 0, -224, 31, P.pink, '#bb8063', 2); star(c, -49, -219, 9); star(c, 49, -219, 9);
    round(c, -137, -76, 274, 18, 5, P.goldLight, P.ink, 2);
    round(c, -120, -57, 240, 47, 6, gradient(c, 0, -57, 0, -10, ['#d3aed9', '#a479b7']), P.ink, 2);
    round(c, -105, -49, 210, 30, 4, '#c6a0cf', '#e8c9d8', 1.7);
    for (const x of [-73, 73]) star(c, x, -34, 8, P.goldLight, P.gold, 1.3);
    heart(c, 0, -34, 19, P.pinkLight, P.gold, 1.2);
    for (const x of [-111, 111]) round(c, x - 10, -17, 20, 15, 4, P.wood, P.ink, 1.8);
  }

  function galleryFrame(c, opts) {
    shadow(c, 0, -3, 148, 15);
    line(c, [[-83, -17], [-69, -190]], P.woodDark, 12); line(c, [[87, -17], [69, -190]], P.woodDark, 12);
    round(c, -148, -228, 296, 214, 9, gradient(c, -148, -228, 148, -14, [P.cream, P.goldLight, P.gold, '#ca914f']), P.ink, 2.8);
    round(c, -138, -218, 276, 194, 5, '#e7b877', '#fff0c0', 2);
    round(c, -128, -208, 256, 174, 3, P.plum, '#b57d5c', 2);
    drawPicture(c, opts.picture, -120, -200, 240, 158);
    for (const [x, y, a] of [[-137, -216, -.7], [137, -216, .7], [-137, -26, .7], [137, -26, -.7]]) {
      c.save(); c.translate(x, y); c.rotate(a); ellipse(c, -3, 0, 7, 3, P.goldLight, '#be865b', 1); ellipse(c, 3, 0, 3, 7, P.goldLight, '#be865b', 1); c.restore();
    }
    heart(c, 0, -222, 15, '#fff3c0', '#c99555', 1);
  }
  function carriedPicture(c, opts) {
    c.save(); c.rotate(-.055);
    round(c, -146, -208, 292, 207, 4, 'rgba(90,57,80,.18)', null);
    drawPicture(c, opts.picture, -150, -216, 292, 207);
    // Small gold corners read as a proudly held drawing without obscuring marks.
    line(c, [[-143, -195], [-143, -208], [-130, -208]], P.gold, 2);
    line(c, [[122, -17], [134, -17], [134, -30]], P.gold, 2); c.restore();
  }

  const renderers = Object.freeze({ art: artTable, fort, ball: ballRamp, puppets: puppetTheatre, frame: galleryFrame, carry: carriedPicture, paper: carriedPicture });
  const bounds = Object.freeze({
    art: Object.freeze([-.51, -.67, .51, .04]), fort: Object.freeze([-.50, -.75, .50, .06]),
    ball: Object.freeze([-.50, -.69, .50, .05]), puppets: Object.freeze([-.48, -.80, .48, .05]),
    frame: Object.freeze([-.49, -.73, .49, .04]), carry: Object.freeze([-.52, -.71, .48, .03]),
    paper: Object.freeze([-.52, -.71, .48, .03])
  });

  function prop(c, kind, x, y, width, options = {}) {
    if (!c || !Object.prototype.hasOwnProperty.call(renderers, kind) || ![x, y, width].every(Number.isFinite) || width <= 0) return false;
    const opts = { time: finite(options?.time), reduced: !!options?.reduced, selected: !!options?.selected, picture: options?.picture,
      ball: options?.ball !== false, puppets: options?.puppets !== false, progress: options?.progress };
    c.save(); c.translate(x, y); c.scale(width / 320, width / 320);
    if (opts.selected && kind !== 'carry' && kind !== 'paper') {
      ellipse(c, 0, -5, 160, 30, 'rgba(255,236,176,.28)', '#fff1b7', 3);
      ellipse(c, 0, -5, 152, 23, null, 'rgba(157,104,157,.40)', 1.5);
    }
    renderers[kind](c, opts); c.restore(); return true;
  }

  // Fixed SVG vocabulary only: no caller content, IDs, fonts, scripts or URLs.
  const icons = Object.freeze({
    art: '<path fill="#e8b68d" d="M8 36h48l-3 10H11z"/><path fill="#d79991" d="M13 45h7v13h-7zm31 0h7v13h-7z"/><path fill="#fff9eb" d="m12 31 25-4 11 12-26 4z"/><path fill="#fff0c0" d="m42 9 5 1-7 25-5-2z"/><path fill="#b995cf" d="m42 9 5 1 3-6-5-2z"/><circle cx="51" cy="29" r="8" fill="#ed91b9"/><path fill="#fff5dc" d="m27 29 4-4 5 4-5 6z"/>',
    fort: '<path fill="#b995cf" d="M5 46h54v11H5z"/><path fill="#795381" d="m13 48 18-31 21 31z"/><path fill="#ffd3dc" d="M4 46 29 7q3-4 6 0l25 39H49L32 20 20 47z"/><path fill="none" stroke="#e4b45d" d="m9 35 23 5 22-5"/><path fill="#ed91b9" d="M4 47q8-7 17 0v10H4z"/><path fill="#92c8df" d="m43 47 8-5 9 7-3 9H44z"/>',
    ball: '<path fill="#e8b68d" d="M11 8h6v47h-6zm36 0h6v47h-6z"/><path fill="#ffd3dc" d="m7 18 50 10v7L7 25zm0 28 50-10v7L7 53z"/><circle cx="26" cy="15" r="9" fill="#ed91b9"/><path fill="none" stroke="#fff0c0" d="M23 7q-2 9 9 14"/><path fill="#b995cf" d="M8 54h49v5H8z"/>',
    puppets: '<path fill="#e4b45d" d="M8 14 20 10 32 3l12 7 12 4v45H8z"/><path fill="#795381" d="M14 19h36v25H14z"/><path fill="#ed91b9" d="M14 19h18L21 36l-7 6zm36 0H32l11 17 7 6z"/><path fill="#b995cf" d="M12 44h40v12H12z"/><path fill="#ffe5a0" d="m32 24 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/><path fill="none" stroke="#ffe5a0" d="M30 11h4"/>',
    paper: '<path fill="#fff9eb" d="M13 5h29l10 10v44H13z"/><path fill="#ffe5a0" d="M42 5v11h10"/><path fill="none" stroke="#dec5d8" d="M21 31h23M21 39h18M21 47h23"/>',
    brush: '<path fill="#ffe5a0" d="m13 52 22-30 7 6-23 29q-7 6-6-5Z"/><path fill="#b995cf" d="m35 22 7 6 7-8-7-6z"/><path fill="#ed91b9" d="M42 14q0-12 14-10-4 5-1 9-1 9-6 7z"/>',
    rainbow: '<path fill="none" stroke="#ed91b9" stroke-width="9" d="M8 44a24 24 0 0 1 48 0"/><path fill="none" stroke="#ffe5a0" stroke-width="7" d="M15 44a17 17 0 0 1 34 0"/><path fill="none" stroke="#a9d7bd" stroke-width="6" d="M21 44a11 11 0 0 1 22 0"/><path fill="#fff5dc" d="M3 46q0-7 6-5 4-7 9-1 8-1 7 7H3zm36 0q0-7 6-5 4-7 9-1 8-1 7 7H39z"/>',
    heart: '<path fill="#ed91b9" d="M32 55C-8 31 12 1 32 20 52 1 72 31 32 55Z"/><path fill="none" stroke="#ffd3dc" stroke-width="4" d="M14 25q-2-11 8-9"/>',
    flower: '<path fill="#ed91b9" d="M32 22C15-3 1 20 21 30-5 39 15 63 30 43c10 27 36 12 20-7 27-4 19-29-6-19C46-4 24-6 32 22Z"/><circle cx="33" cy="31" r="10" fill="#ffe5a0"/>',
    carry: '<path fill="#fff9eb" d="m7 12 33-4 5 43-33 4z"/><path fill="#ed91b9" d="M24 38C6 27 16 15 24 23c9-9 18 3 0 15z"/><path fill="none" stroke="#795381" stroke-width="6" d="M41 30h17m-7-8 8 8-8 8"/>',
    undo: '<path fill="none" stroke="#795381" stroke-width="7" d="M15 23h22c23 0 23 29 1 29H26M15 23l12-12M15 23l12 12"/>',
    save: '<path fill="#fff9eb" d="M8 7h40v49H8z"/><path fill="#e4b45d" d="M8 7h40v8H8z"/><circle cx="44" cy="43" r="16" fill="#a9d7bd"/><path fill="none" stroke="#573b61" stroke-width="5" d="m36 43 6 6 11-12"/>',
    frame: '<rect x="5" y="8" width="54" height="48" rx="4" fill="#e4b45d"/><rect x="12" y="15" width="40" height="34" rx="2" fill="#fff9eb"/><path fill="#ed91b9" d="M32 43C7 28 20 13 32 25c12-12 25 3 0 18z"/><path fill="none" stroke="#fff0c0" d="M8 12h46M9 52h46"/>',
    back: '<path fill="#ffe5a0" d="M28 9 6 31l22 23V40h20q8 0 10 7V28q-1-8-11-8H28Z"/>',
    play: '<circle cx="32" cy="32" r="26" fill="#ffe5a0"/><path fill="#795381" d="m25 17 22 15-22 15z"/>',
    wave: '<path fill="#fff5dc" d="m20 51-4-17q-1-7 5-9l4 7V15q0-8 7-7 5 0 5 6v15l5-11q4-7 9-3 4 3 0 10l-7 16q-6 15-15 14z"/><path fill="#b995cf" d="m18 45 22 1-3 11H20z"/><path fill="none" stroke="#e4b45d" d="m9 13 4 5M45 6l-2 4M55 36l5 1"/>',
    dance: '<path fill="none" stroke="#795381" stroke-width="5" d="M20 42V15l26-5v29M20 23l26-5"/><ellipse cx="13" cy="45" rx="9" ry="7" fill="#ed91b9"/><ellipse cx="39" cy="42" rx="9" ry="7" fill="#b995cf"/><path fill="#ffe5a0" d="m49 47 2 5 6 1-5 3 1 5-4-3-5 3 1-5-4-3 5-1z"/>',
    peek: '<path fill="#795381" d="M8 10h48v45H8z"/><path fill="#ed91b9" d="M8 10h25L19 43 8 52zm48 0H33l12 33 11 9z"/><path fill="#ffe5a0" d="m32 25 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/><path fill="none" stroke="#ffe5a0" d="M8 43h12m24 0h12"/>',
    cushion: '<path fill="#ed91b9" d="M8 14q8-7 23-3 16-4 25 3-4 16 0 33-10 8-25 4-15 5-23-4 4-16 0-33z"/><path fill="#ffe5a0" d="M32 43C9 30 21 15 32 26c11-11 23 4 0 17z"/><path fill="none" stroke="#ffd3dc" d="M13 20q15-7 35-3"/>'
  });
  const iconAliases = Object.freeze({ 'stamp-heart': 'heart', 'stamp-flower': 'flower', 'stamp-rainbow': 'rainbow', finish: 'save', ramp: 'ball', paint: 'art' });
  function icon(kind) {
    const key = Object.prototype.hasOwnProperty.call(iconAliases, kind) ? iconAliases[kind] : kind;
    const body = Object.prototype.hasOwnProperty.call(icons, key) ? icons[key] : icons.paper;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="#76506e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  root.UWClubhouseArt = Object.freeze({ version: 1, palette, bounds, load, drawPicture, prop, icon, drawStamp, cushion, drawBall, drawPuppet, rampPoint, ramp });
})(typeof window !== 'undefined' ? window : globalThis);
