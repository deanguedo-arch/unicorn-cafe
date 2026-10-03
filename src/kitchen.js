/* Rainbow Kitchen v1.0.0 — canvas cooking theatre.
 * Bitmap food is combined with original drawn kitchenware, liquid, heat and
 * touch effects. Game progress and audio belong to app.js; this class never
 * changes recipe state. The entire kitchen uses one cancellable RAF loop.
 */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const ease = v => { v = clamp(v); return 1 - Math.pow(1 - v, 3); };
  const mix = (a, b, p) => a + (b - a) * p;
  const colours = ['#ff8bb8', '#ffc868', '#9fe0b9', '#87d9e9', '#c4a5f5'];

  function rounded(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke, lineWidth = 2) {
    if (rx <= 0 || ry <= 0) return;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function star(ctx, x, y, r, colour, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath();
    for (let n = 0; n < 10; n++) {
      const a = n * Math.PI / 5 - Math.PI / 2, q = n % 2 ? r * .44 : r;
      if (n === 0) ctx.moveTo(Math.cos(a) * q, Math.sin(a) * q);
      else ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
    }
    ctx.closePath(); ctx.fillStyle = colour; ctx.fill(); ctx.restore();
  }

  class KitchenScene {
    constructor(canvas, images) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', {alpha: true});
      this.images = images || {};
      this.recipes = window.RECIPES || [];
      this.s = {recipeId: 'pizza', stepIndex: 0, progress: 0, phase: 'cooking'};
      this.visualProgress = 0;
      this.time = 0; this.stepAge = 0; this.inputAge = 20; this.kick = 0;
      this.pointer = {x: 0, y: 0};
      this.particles = [];
      this.dead = false;
      this.reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.frame = this.frame.bind(this);
      this.resize();
      this.lastTime = 0;
      this.raf = window.requestAnimationFrame(this.frame);
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, r.width || this.canvas.clientWidth || 320);
      this.height = Math.max(1, r.height || this.canvas.clientHeight || 220);
      this.dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const w = Math.round(this.width * this.dpr), h = Math.round(this.height * this.dpr);
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
      }
      this.unit = Math.min(this.width / 560, this.height / 330);
      this.cx = this.width / 2; this.cy = this.height * .52;
    }

    setState(state) {
      if (!state || this.dead) return;
      const recipe = this.recipes.find(r => r.id === state.recipeId) || this.recipes[0];
      if (!recipe) return;
      const phase = ['ready', 'celebrate'].includes(state.phase) ? state.phase : 'cooking';
      const stepIndex = Math.floor(clamp(state.stepIndex, 0, recipe.steps.length));
      const changed = this.s.recipeId !== recipe.id || this.s.stepIndex !== stepIndex || this.s.phase !== phase;
      if (changed) {
        const accomplished = this.s.recipeId === recipe.id && (stepIndex > this.s.stepIndex || phase !== 'cooking');
        this.stepAge = 0;
        if (accomplished) this.burst(0, 0, phase === 'cooking' ? 12 : 23);
        this.visualProgress = clamp(state.progress);
        if (this.s.recipeId !== recipe.id) this.particles.length = 0;
      }
      this.s = {recipeId: recipe.id, stepIndex, progress: clamp(state.progress), phase};
    }

    interact(x, y) {
      if (this.dead) return;
      this.pointer.x = clamp((clamp(x) * this.width - this.cx) / this.unit, -155, 155);
      this.pointer.y = clamp((clamp(y) * this.height - this.cy) / this.unit, -90, 105);
      this.inputAge = 0; this.kick = 1;
      this.burst(this.pointer.x, this.pointer.y, this.reduced ? 3 : 7);
    }

    destroy() {
      this.dead = true;
      window.cancelAnimationFrame(this.raf);
      this.particles.length = 0;
    }

    burst(x, y, count) {
      if (this.particles.length > 70) this.particles.splice(0, this.particles.length - 70);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + this.time * 1.7;
        this.particles.push({x, y, vx: Math.cos(a) * (40 + (i % 4) * 17), vy: Math.sin(a) * 55 - 35,
          life: 1, age: 0, size: 3 + i % 5, colour: colours[i % colours.length], star: i % 3 === 0});
      }
    }

    frame(now) {
      if (this.dead) return;
      const dt = this.lastTime ? Math.min(.045, Math.max(0, (now - this.lastTime) / 1000)) : .016;
      this.lastTime = now; this.time += dt; this.stepAge += dt; this.inputAge += dt;
      this.kick *= Math.exp(-dt * 8);
      this.visualProgress += (this.s.progress - this.visualProgress) * (1 - Math.exp(-dt * 16));
      if (Math.abs(this.s.progress - this.visualProgress) < .002) this.visualProgress = this.s.progress;
      for (const p of this.particles) {
        p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += dt * 48;
      }
      this.particles = this.particles.filter(p => p.age < p.life);
      if (this.ctx) this.render();
      this.raf = window.requestAnimationFrame(this.frame);
    }

    amount(index) {
      return this.s.phase !== 'cooking' || this.s.stepIndex > index ? 1 : this.s.stepIndex === index ? this.visualProgress : 0;
    }

    sprite(key, x, y, w, h, alpha = 1, angle = 0) {
      const im = this.images[key];
      if (!im || !(im.naturalWidth || im.width) || alpha <= 0) return {x: x - w / 2, y: y - h / 2, w, h};
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
      const scale = Math.min(w / iw, h / ih), dw = iw * scale, dh = ih * scale;
      const ctx = this.ctx;
      ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.translate(x, y); ctx.rotate(angle);
      ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh); ctx.restore();
      return {x: x - dw / 2, y: y - dh / 2, w: dw, h: dh};
    }

    layer(key, x, y, w, h, alpha = 1) {
      // A topping becomes flatter when it lands in a stack. This is a render
      // transform of the actual ingredient, not replacement food artwork.
      const im = this.images[key];
      if (!im || !(im.naturalWidth || im.width) || alpha <= 0) return;
      const ctx = this.ctx; ctx.save(); ctx.globalAlpha *= clamp(alpha);
      ctx.drawImage(im, x - w / 2, y - h / 2, w, h); ctx.restore();
    }

    shadow(x, y, w, h, strength = .12) {
      const ctx = this.ctx; ctx.save();
      const g = ctx.createRadialGradient(x, y, 0, x, y, w);
      g.addColorStop(0, 'rgba(92,55,75,' + strength + ')'); g.addColorStop(1, 'rgba(92,55,75,0)');
      ctx.scale(1, h / w); ellipse(ctx, x, y * w / h, w, w, g); ctx.restore();
    }

    background() {
      const ctx = this.ctx, w = this.width, h = this.height;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fff8e9'); g.addColorStop(.7, '#fff0d6'); g.addColorStop(1, '#f6dfbe');
      rounded(ctx, 1, 1, w - 2, h - 2, Math.min(27, h * .1)); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(205,156,107,.14)'; ctx.lineWidth = 1.3;
      for (let n = 0; n < 7; n++) {
        const y = h * (n + .5) / 7;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y - 7, w * .6, y + 9, w, y - 4); ctx.stroke();
      }
      const glow = ctx.createRadialGradient(w * .5, h * .48, 0, w * .5, h * .48, w * .55);
      glow.addColorStop(0, 'rgba(255,255,255,.8)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      rounded(ctx, 3, 3, w - 6, h - 6, Math.min(25, h * .1));
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(this.unit, this.unit);
      // A little folded cloth anchors the worktop without competing with food.
      ctx.save(); ctx.translate(-214, 82); ctx.rotate(-.16);
      rounded(ctx, -36, -25, 72, 73, 10); ctx.fillStyle = '#bde4db'; ctx.fill();
      ctx.strokeStyle = '#9fcfc6'; ctx.lineWidth = 2;
      for (let x = -24; x < 34; x += 13) {ctx.beginPath(); ctx.moveTo(x, -23); ctx.lineTo(x, 45); ctx.stroke();}
      ctx.restore();
      star(ctx, 222, 108, 8, '#e9b958', .1); star(ctx, -227, -114, 6, '#ddb3ec', -.2);
      ctx.restore();
    }

    board() {
      const ctx = this.ctx;
      this.shadow(0, 64, 202, 65, .12);
      const g = ctx.createLinearGradient(0, -127, 0, 122);
      g.addColorStop(0, '#f3d3aa'); g.addColorStop(1, '#dfad7b');
      rounded(ctx, -184, -117, 368, 241, 42); ctx.fillStyle = '#ba875d'; ctx.fill();
      rounded(ctx, -184, -123, 368, 240, 42); ctx.fillStyle = g; ctx.fill();
      rounded(ctx, -173, -113, 346, 219, 35); ctx.strokeStyle = 'rgba(255,242,210,.67)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(176,126,78,.13)'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {const y = -79 + i * 39; ctx.beginPath(); ctx.moveTo(-156, y); ctx.bezierCurveTo(-70, y + 10, 48, y - 10, 156, y + 3); ctx.stroke();}
    }

    tray() {
      const ctx = this.ctx;
      this.shadow(0, 80, 193, 60, .13);
      const g = ctx.createLinearGradient(0, -120, 0, 120);
      g.addColorStop(0, '#e8e6f3'); g.addColorStop(.4, '#faf9ff'); g.addColorStop(1, '#b9b5d0');
      rounded(ctx, -177, -105, 354, 219, 35); ctx.fillStyle = '#aaa4c3'; ctx.fill();
      rounded(ctx, -177, -112, 354, 215, 35); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#d0c6e4'; ctx.stroke();
      rounded(ctx, -158, -95, 316, 174, 24); ctx.fillStyle = '#c6c0d7'; ctx.fill();
      rounded(ctx, -151, -88, 302, 166, 21); ctx.fillStyle = '#eee8e5'; ctx.fill();
      rounded(ctx, -192, -22, 18, 70, 8); ctx.fillStyle = '#a497bc'; ctx.fill();
      rounded(ctx, 174, -22, 18, 70, 8); ctx.fill();
    }

    oven(progress, contents) {
      const ctx = this.ctx;
      this.shadow(0, 98, 218, 55, .2);
      const g = ctx.createLinearGradient(0, -143, 0, 137);
      g.addColorStop(0, '#c9b1ed'); g.addColorStop(1, '#a18ccb');
      rounded(ctx, -201, -143, 402, 271, 29); ctx.fillStyle = '#8c76b6'; ctx.fill();
      rounded(ctx, -201, -150, 402, 271, 29); ctx.fillStyle = g; ctx.fill();
      rounded(ctx, -186, -108, 372, 209, 23); ctx.fillStyle = '#66516e'; ctx.fill();
      const inner = ctx.createLinearGradient(0, -104, 0, 101);
      inner.addColorStop(0, progress > .02 ? '#d69a69' : '#af99ad'); inner.addColorStop(1, progress > .02 ? '#f8cf8b' : '#d1bfd0');
      rounded(ctx, -177, -99, 354, 190, 17); ctx.fillStyle = inner; ctx.fill();
      ctx.strokeStyle = 'rgba(92,61,71,.25)'; ctx.lineWidth = 4;
      for (let y = 52; y <= 82; y += 14) {ctx.beginPath(); ctx.moveTo(-162, y); ctx.lineTo(162, y); ctx.stroke();}
      ellipse(ctx, -158, -125, 10, 10, '#fff2d8', '#8e77ab', 2);
      ellipse(ctx, 158, -125, 10, 10, '#fff2d8', '#8e77ab', 2);
      for (let i = 0; i < 5; i++) ellipse(ctx, -36 + i * 18, -126, 4, 4, progress * 5 > i ? '#ffe896' : '#ae96c5');
      ctx.save(); ctx.translate(0, -2); ctx.scale(.78, .78); contents(); ctx.restore();
      if (progress > 0) {
        ctx.save(); ctx.globalAlpha = .10 + .03 * Math.sin(this.time * 4);
        rounded(ctx, -174, -96, 348, 184, 17); ctx.fillStyle = '#ffcb77'; ctx.fill(); ctx.restore();
        this.steam(0, -82, .5 + progress * .5, 105);
      }
      rounded(ctx, -72, 107, 144, 8, 4); ctx.fillStyle = '#f3ddfb'; ctx.fill();
    }

    pan() {
      const ctx = this.ctx;
      this.shadow(0, 69, 165, 64, .15);
      rounded(ctx, 118, 21, 107, 32, 14); ctx.fillStyle = '#9f84c1'; ctx.fill();
      rounded(ctx, 143, 26, 68, 20, 9); ctx.fillStyle = '#c6b1e1'; ctx.fill();
      ellipse(ctx, 0, 17, 153, 104, '#796584', '#b496c7', 8);
      ellipse(ctx, 0, 10, 141, 94, '#60576a', '#918499', 3);
      for (let i = 0; i < 6; i++) {ctx.beginPath(); ctx.moveTo(-96 + i * 37, -42); ctx.lineTo(-121 + i * 37, 63); ctx.strokeStyle = '#746878'; ctx.lineWidth = 4; ctx.stroke();}
    }

    steam(x, y, strength = 1, spread = 60) {
      const ctx = this.ctx;
      for (let i = 0; i < 4; i++) {
        const phase = (this.time * (this.reduced ? .2 : .65) + i * .29) % 1;
        const sx = x + (i - 1.5) * spread * .4;
        ctx.save(); ctx.globalAlpha = (.35 * Math.sin(phase * Math.PI)) * clamp(strength);
        ctx.beginPath(); ctx.moveTo(sx, y - phase * 18); ctx.bezierCurveTo(sx - 14, y - 17 - phase * 22, sx + 14, y - 32 - phase * 26, sx + 3, y - 46 - phase * 26);
        ctx.strokeStyle = '#fff9ec'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
      }
    }

    ripple(x, y, rx, ry, p, colour) {
      const ctx = this.ctx; ctx.save(); ctx.globalAlpha = .42;
      ctx.strokeStyle = colour; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      const turns = TAU * (1 + p * 1.5), count = 80;
      ctx.beginPath();
      for (let i = 0; i <= count; i++) {
        const t = i / count, a = turns * t + (this.reduced ? 0 : this.time * .8), r = .14 + .7 * t;
        const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.restore();
    }

    pour(x, y, endX, endY, colour, width = 8) {
      const ctx = this.ctx; ctx.save();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 17, (y + endY) / 2, endX, endY);
      ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();
      ctx.globalAlpha = .45; ctx.lineWidth = Math.max(2, width * .25); ctx.strokeStyle = '#fffdf0'; ctx.stroke();
      ellipse(ctx, endX, endY, 12 + Math.sin(this.time * 12) * 2, 4, colour); ctx.restore();
    }

    pizza() {
      const ctx = this.ctx, i = this.s.stepIndex, roll = this.amount(0), sauce = this.amount(1), cheese = this.amount(2), toppings = this.amount(3), bake = this.amount(4);
      const food = () => {
        this.sprite('dough', 0, 7, 313 * mix(.63, 1, roll), 228 * mix(.78, 1, roll));
        if (sauce > 0) {
          ctx.save(); ellipse(ctx, 0, 0, 160 * ease(sauce), 119 * ease(sauce)); ctx.clip();
          this.sprite('saucedDough', 0, 7, 313, 228); ctx.restore();
        }
        for (let n = 0; n < 28; n++) {
          const a = n * 2.39996, r = 22 + Math.sqrt(n / 28) * 88, appear = clamp(cheese * 28 - n);
          if (appear > 0) this.sprite('cheeseSlice', Math.cos(a) * r, 6 + Math.sin(a) * r * .65, 22 * ease(appear), 16 * ease(appear), 1, a * .3);
        }
        const positions = [[0, -59], [-84, -14], [84, -10], [-53, 58], [47, 56]];
        positions.forEach((pt, n) => {
          const a = ease(clamp(toppings * 5 - n));
          if (a > 0) this.layer('tomatoSlice', pt[0], pt[1] - (1 - a) * 55, 62 * a, 45 * a);
        });
        if (i === 4) {
          this.sprite('rawPizza', 0, 7, 313, 228, 1 - bake);
          this.sprite('pizza', 0, 7, 313, 228, bake);
        }
      };
      if (i === 4) this.oven(bake, food);
      else {
        this.board();
        if (i === 0) for (let n = 0; n < 26; n++) ellipse(ctx, Math.cos(n * 2.39) * (60 + n * 3), Math.sin(n * 2.39) * (40 + n * 2), 1.2 + n % 3, .7 + n % 2, '#fff8dc');
        food();
      }
    }

    coffee() {
      const ctx = this.ctx, i = this.s.stepIndex, beans = this.amount(0), brew = this.amount(1), milk = this.amount(2), stir = this.amount(3);
      this.shadow(0, 103, 138, 42, .16);
      ellipse(ctx, 0, 99, 125, 30, '#c5e4dc', '#94c6c4', 3);
      ellipse(ctx, 0, 94, 102, 22, '#e4f3e7', '#b1d7d3', 2);
      if (i <= 1) {
        rounded(ctx, -128, -143, 36, 193, 13); ctx.fillStyle = '#bd9adc'; ctx.fill();
        rounded(ctx, -120, -144, 186, 38, 16); ctx.fillStyle = '#d7bcec'; ctx.fill();
        rounded(ctx, -15, -112, 29, 17, 6); ctx.fillStyle = '#9579ad'; ctx.fill();
        ellipse(ctx, -24, -132, 42, 15, '#9275ab', '#eee0fa', 3);
        if (beans > 0) this.sprite('coffeeBeans', -24, -139 - (1 - ease(beans)) * 5, 67 * ease(beans), 37 * ease(beans));
      }
      const mug = this.sprite('emptyMug', 8, 12, 270, 244);
      const mx = mug.x + mug.w * .405, my = mug.y + mug.h * .225;
      const rx = mug.w * .337, ry = mug.h * .146;
      if (brew > 0 || i > 1) {
        const liquid = ctx.createLinearGradient(0, my - ry, 0, my + ry);
        const tone = milk > 0 ? '#c99b62' : '#784429';
        liquid.addColorStop(0, tone); liquid.addColorStop(1, milk > 0 ? '#e5b77c' : '#a96536');
        ellipse(ctx, mx, my + (1 - brew) * ry * .6, rx * .96, ry * (.35 + .65 * brew), liquid);
        ellipse(ctx, mx - rx * .32, my - 3, rx * .31, ry * .19, 'rgba(255,244,200,.13)');
      }
      if (i === 1 && brew > 0) {
        this.pour(-1, -94, mx, my, '#995b32', 7);
        this.steam(mx, my - 5, brew, 46);
      }
      if (milk > 0) {
        this.ripple(mx, my, rx * .9, ry * .9, milk, '#fff3d5');
        if (i === 2 && this.inputAge < .6) this.pour(84, -86, mx + 13, my, '#fff5de', 11);
      }
      if (i === 3) {
        this.ripple(mx, my, rx, ry, stir + .4, '#fff5e0');
        if (stir > .88) this.sprite('coffee', 0, 9, 287, 265, ease((stir - .88) / .12));
      }
      if (i > 1) this.steam(mx, my - 14, .7, 43);
    }

    cupcakeCase(x, y, fill = 0, scale = 1) {
      const ctx = this.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      const im = this.images.cupcakeLiners;
      if (im) {
        const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
        ctx.drawImage(im, 0, 0, iw * .5, ih * .46, -51, -27, 102, 90);
      }
      if (fill > 0) {
        const g = ctx.createLinearGradient(0, -11, 0, 37); g.addColorStop(0, '#eac16e'); g.addColorStop(1, '#ffe6a3');
        ellipse(ctx, 0, 13 + (1 - fill) * 7, 40, 24 * mix(.45, 1, fill), g);
        ellipse(ctx, -7, 6, 24 * fill, 5 * fill, '#ffe9b4');
      }
      ctx.restore();
    }

    frosting(x, y, progress, size = 1) {
      if (progress <= 0) return;
      const ctx = this.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
      const count = 5;
      for (let k = 0; k < count; k++) {
        const p = ease(clamp(progress * count - k));
        if (p <= 0) continue;
        const w = (51 - k * 8.4) * p, yy = -k * 14;
        const g = ctx.createLinearGradient(0, yy - 16, 0, yy + 12);
        g.addColorStop(0, '#ffc4df'); g.addColorStop(.55, '#ff97c5'); g.addColorStop(1, '#e96aa6');
        ellipse(ctx, 0, yy, w, 16 * p, g, '#e67ba9', 1.1);
        ctx.beginPath(); ctx.ellipse(-3, yy - 4, w * .75, 7 * p, -.03, Math.PI, TAU);
        ctx.strokeStyle = '#ffd3e7'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
      }
      if (progress > .85) {
        ctx.beginPath(); ctx.moveTo(-9, -57); ctx.bezierCurveTo(-8, -67, 7, -72, 5, -81); ctx.bezierCurveTo(20, -69, 17, -60, 5, -54); ctx.closePath(); ctx.fillStyle = '#ffb5d6'; ctx.fill();
      }
      ctx.restore();
    }

    cupcakes() {
      const ctx = this.ctx, i = this.s.stepIndex, mixP = this.amount(0), fill = this.amount(1), bake = this.amount(2), frost = this.amount(3), sprinkle = this.amount(4);
      if (i === 0) {
        this.shadow(0, 100, 161, 47, .16);
        const wobble = this.reduced ? 0 : Math.sin(this.time * 5) * .023 * (this.inputAge < .7 ? 1 : .2);
        // The first scoop puts batter in the empty bowl. Subsequent strokes
        // visibly whisk it; the opaque bowl never dissolves into two outlines.
        this.sprite(mixP > .005 ? 'mixingBowl' : 'emptyMixingBowl', 0, 0, 316, 278, 1, wobble);
        if (mixP > 0) this.ripple(-22, 15, 79, 24, mixP, '#fff3c1');
        for (let n = 0; n < Math.floor(mixP * 7); n++) ellipse(ctx, -56 + n * 16, 12 + Math.sin(n * 2.5) * 15, 3, 2, '#ffe8a2');
        return;
      }
      const positions = [[-100, 30], [100, 30], [0, -37]];
      const renderCakes = () => {
        positions.forEach((pt, n) => {
          const amount = clamp(fill * 3 - n), baked = i >= 3 ? 1 : bake;
          if (baked < 1) {ctx.save(); ctx.globalAlpha = 1 - ease(baked); this.cupcakeCase(pt[0], pt[1] + 6, amount, 1.05); ctx.restore();}
          if (baked > 0) this.sprite('plainCupcake', pt[0], pt[1], 133, 137 * mix(.75, 1, baked), ease(baked));
          if (i >= 3) this.frosting(pt[0], pt[1] - 29, clamp(frost * 3 - n), .93);
          if (i >= 4) {
            const a = ease(clamp(sprinkle * 3 - n));
            if (a > 0) this.sprite('cupcakes', pt[0], pt[1] - 34, 143, 191, a);
          }
        });
      };
      if (i === 2) this.oven(bake, renderCakes);
      else {
        this.tray(); renderCakes();
        if (i === 1 && fill > 0 && this.inputAge < .6) {
          const n = Math.min(2, Math.floor(fill * 3)); const pt = positions[n];
          this.pour(pt[0] + 13, pt[1] - 58, pt[0], pt[1], '#f7d58c', 10);
        }
      }
    }

    iceSauce(x, y, amount, scale = 1) {
      if (amount <= 0) return;
      const ctx = this.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.beginPath();
      const count = Math.max(1, Math.floor(amount * 64));
      for (let k = 0; k <= count; k++) {
        const t = k / 64, xx = Math.sin(t * Math.PI * 4) * (51 + t * 8), yy = -40 + t * 75;
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.strokeStyle = '#a85b81'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = '#f68aae'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
    }

    icecream() {
      const ctx = this.ctx, cone = this.amount(0), pink = this.amount(1), vanilla = this.amount(2), lavender = this.amount(3), sauce = this.amount(4);
      this.shadow(0, 119, 102, 34, .14);
      ellipse(ctx, 0, 113, 77, 20, '#edd2eb', '#d2b1d3', 3);
      this.sprite('cone', 0, 43, 166 * mix(.65, 1, cone), 205 * mix(.7, 1, cone), mix(.35, 1, cone));
      const a = ease(pink);
      if (a > 0) this.sprite('pinkScoop', -38, -27 - (1 - a) * 65, 143 * a, 131 * a);
      if (lavender > 0) {
        const right = ease(lavender);
        this.sprite('lavenderScoop', 45, -26 - (1 - right) * 75, 135 * right, 127 * right);
      }
      if (vanilla > 0) {
        const top = ease(vanilla);
        this.sprite('vanillaScoop', 13, -99 - (1 - top) * 40, 138 * top, 124 * top);
      }
      if (sauce > 0) this.iceSauce(2, -68, sauce, 1.05);
    }

    hamburger() {
      const ctx = this.ctx, i = this.s.stepIndex, grill = this.amount(0), flip = this.amount(1), stack = this.amount(2), greens = this.amount(3), cap = this.amount(4);
      if (i < 2) {
        this.pan();
        const jumping = i === 1 && this.inputAge < .55 && !this.reduced ? Math.sin(this.inputAge / .55 * Math.PI) : 0;
        ctx.save(); ctx.translate(0, -jumping * 63); ctx.scale(1, Math.max(.1, 1 - jumping * .8));
        this.sprite('patty', 0, 10, 227, 149);
        ctx.save(); ctx.globalAlpha = grill * .7;
        for (let n = 0; n < 4; n++) {ctx.beginPath(); ctx.moveTo(-65 + n * 36, -27); ctx.lineTo(-78 + n * 36, 40); ctx.strokeStyle = '#7d452e'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();}
        ctx.restore(); ctx.restore();
        if (grill > 0 || flip > 0) this.steam(0, -25, .7, 89);
        if (i === 1) {
          ctx.save(); ctx.translate(125, 37); ctx.rotate(-.4 - jumping * .4);
          rounded(ctx, -8, 0, 17, 83, 8); ctx.fillStyle = '#70c1c2'; ctx.fill();
          rounded(ctx, -26, -48, 52, 60, 11); ctx.fillStyle = '#d2dbe0'; ctx.fill();
          for (let x = -13; x <= 13; x += 13) {rounded(ctx, x - 2, -40, 4, 35, 2); ctx.fillStyle = '#9daeb8'; ctx.fill();} ctx.restore();
        }
        return;
      }
      this.sprite('plate', 0, 88, 346, 170);
      this.layer('bun', 0, 77, 248, 63);
      const patty = ease(clamp(stack * 2));
      if (patty > 0) this.layer('patty', 0, 43 - (1 - patty) * 70, 248, 97, patty);
      const cheese = ease(clamp(stack * 2 - 1));
      if (cheese > 0) this.layer('cheeseSlice', 0, 24 - (1 - cheese) * 72, 257, 78, cheese);
      const tomato = ease(clamp(greens * 2)), lettuce = ease(clamp(greens * 2 - 1));
      if (tomato > 0) {
        this.layer('tomatoSlice', -49, 6 - (1 - tomato) * 65, 137, 58, tomato);
        this.layer('tomatoSlice', 51, 7 - (1 - tomato) * 65, 135, 58, tomato);
      }
      if (lettuce > 0) this.layer('lettuce', 0, -5 - (1 - lettuce) * 61, 265, 72, lettuce);
      if (cap > 0) this.sprite('bun', 0, -63 - (1 - ease(cap)) * 58, 259, 145, ease(cap));
      if (cap > .8) this.sprite('hamburger', 0, 0, 282, 278, ease((cap - .8) / .2));
    }

    soup() {
      const ctx = this.ctx, i = this.s.stepIndex, veg = this.amount(0), broth = this.amount(1), stirring = this.amount(2), heat = this.amount(3), ladle = this.amount(4);
      if (i === 3) {
        rounded(ctx, -152, 83, 304, 39, 17); ctx.fillStyle = '#b9acd3'; ctx.fill();
        rounded(ctx, -141, 86, 282, 11, 5); ctx.fillStyle = '#e7d4f2'; ctx.fill();
        ellipse(ctx, 0, 84, 118, 28, heat > 0 ? '#ffd290' : '#95869d');
      } else this.shadow(0, 107, 157, 44, .13);
      ctx.save();
      if (i === 4) {ctx.translate(-63 * ladle, -24 * ladle); ctx.scale(1 - ladle * .23, 1 - ladle * .23);}
      const pot = this.sprite('vegetablePot', 0, 7, 319, 264);
      // The illustrated pot is retained; its open interior is the live cooking
      // surface, so vegetables do not appear before the child adds them.
      const x = pot.x + pot.w * .5, y = pot.y + pot.h * .353;
      const rx = pot.w * .342, ry = pot.h * .23;
      const base = ctx.createLinearGradient(0, y - ry, 0, y + ry);
      base.addColorStop(0, broth > 0 ? '#e9bd74' : '#917caa'); base.addColorStop(1, broth > 0 ? '#f7d894' : '#c6b2d5');
      ellipse(ctx, x, y, rx, ry, base, '#b78dcf', 1.5);
      for (let n = 0; n < 7; n++) {
        const p = ease(clamp(veg * 7 - n)), a = n * 2.39 + (i === 2 && this.inputAge < .7 && !this.reduced ? this.time * .7 : 0);
        if (p > 0) this.sprite('vegetables', Math.cos(a) * (37 + n * 5), y + Math.sin(a) * (15 + n * 2), 56 * p, 41 * p, 1, Math.sin(a) * .25);
      }
      if (broth > 0) {
        ctx.save(); ctx.globalAlpha = .12 * broth; ellipse(ctx, x, y, rx * .95, ry * .96, '#fff0ad'); ctx.restore();
        if (i === 1 && this.inputAge < .6) this.pour(84, -106, 19, y, '#f6ce86', 12);
      }
      if (i === 2 || stirring === 1) this.ripple(x, y, rx, ry, stirring, '#fff0c1');
      if (heat > 0) {
        for (let n = 0; n < 6; n++) {
          const t = (this.time * .7 + n * .173) % 1;
          ctx.save(); ctx.globalAlpha = Math.sin(t * Math.PI) * .7;
          ellipse(ctx, Math.sin(n * 4.2) * rx * .67, y + Math.cos(n * 3.7) * ry * .6, 2 + t * 7, 1 + t * 4, '#fff2be', '#e9c37e', 1); ctx.restore();
        }
        this.steam(0, y - 18, heat, 81);
      }
      ctx.restore();
      if (i === 4) {
        const p = ease(ladle);
        this.sprite('soup', 66 * p, 63 * p, 201 + p * 105, 170 + p * 78, p);
        if (ladle > 0 && this.inputAge < .6) this.pour(58, -13, 68, 28, '#f8d594', 12);
      }
    }

    chicken() {
      const ctx = this.ctx, i = this.s.stepIndex, meat = this.amount(0), potatoes = this.amount(1), glaze = this.amount(2), roast = this.amount(3), plate = this.amount(4);
      const meal = () => {
        const arrive = ease(meat);
        if (arrive > 0) {
          this.sprite('rawDrumstick', -35, -11 - (1 - arrive) * 50, 232 * arrive, 167 * arrive, arrive * (1 - roast), Math.PI - .12);
          if (roast > 0) this.sprite('drumstick', -35, -11, 232, 167, roast, -.12);
        }
        const wedges = ease(potatoes);
        if (wedges > 0) this.sprite('sweetPotatoWedges', 81, 29 - (1 - wedges) * 68, 177 * wedges, 143 * wedges, wedges, -.12);
        if (glaze > 0) {
          ctx.save(); ctx.globalAlpha = glaze * .55;
          for (let n = 0; n < 4; n++) {ctx.beginPath(); ctx.ellipse(-72 + n * 17, 2 - n * 10, 30, 10, -.35, .15, Math.PI * .8); ctx.strokeStyle = '#ffc879'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();}
          ctx.restore();
        }
      };
      if (i === 3) this.oven(roast, () => {this.tray(); meal();});
      else if (i === 4) {
        ctx.save(); ctx.globalAlpha = 1 - plate; this.tray(); meal(); ctx.restore();
        this.sprite('plate', 0, 31, 348, 227, ease(plate));
        this.sprite('chicken', 0, 9, 346, 269, ease(plate));
      } else {this.tray(); meal();}
    }

    ready(recipe) {
      const ctx = this.ctx;
      const float = this.reduced ? 0 : Math.sin(this.time * 2) * 3;
      this.shadow(0, 111, 160, 46, .15);
      ctx.save(); ctx.translate(0, float);
      if (recipe.id === 'cupcakes') {
        this.sprite('plate', 0, 70, 350, 187);
        this.sprite('cupcakes', -89, 12, 151, 221); this.sprite('cupcakes', 89, 12, 151, 221); this.sprite('cupcakes', 0, -27, 160, 234);
      } else {
        const tall = recipe.id === 'icecream';
        if (recipe.id === 'pizza' || recipe.id === 'hamburger') this.sprite('plate', 0, 77, 351, 172);
        this.sprite(recipe.finalArt, 0, tall ? -5 : 0, tall ? 235 : 346, tall ? 297 : 283);
        if (tall) this.iceSauce(-2, -60, 1, .87);
        if (recipe.id === 'coffee' || recipe.id === 'soup' || recipe.id === 'chicken') this.steam(0, -81, .7, 80);
      }
      ctx.restore();
      const pulse = this.reduced ? 1 : .92 + Math.sin(this.time * 2.8) * .08;
      for (let n = 0; n < 6; n++) {
        const a = n / 6 * TAU - .3;
        star(ctx, Math.cos(a) * 197, Math.sin(a) * 116, (8 + n % 3 * 2) * pulse, colours[n % colours.length], a + this.time * .15);
      }
    }

    tool(recipe) {
      const step = recipe.steps[this.s.stepIndex];
      if (!step || step.gesture === 'bake' || (recipe.id === 'hamburger' && this.s.stepIndex === 1)) return;
      const ctx = this.ctx, active = this.inputAge < .65 && !this.reduced;
      const speed = this.reduced ? 0 : this.time;
      let x = 160, y = -96, angle = -.15;
      if (step.gesture === 'stir') {x += Math.cos(speed * 2.5) * 12; y += Math.sin(speed * 2.5) * 7; angle += Math.sin(speed * 2) * .14;}
      else if (step.gesture === 'spread') {x += Math.sin(speed * 2.2) * 12; angle += Math.sin(speed * 2.2) * .09;}
      else if (step.gesture === 'sprinkle') {angle += Math.sin(speed * 5) * .13; y += Math.sin(speed * 3) * 4;}
      else if (step.gesture === 'pour') angle = -.3 - (active ? .18 : 0);
      else y += Math.sin(speed * 2.3) * 5;
      if (active) {x = mix(x, this.pointer.x + 35, .55); y = mix(y, this.pointer.y - 51, .55);}
      ctx.save(); ctx.globalAlpha = active ? 1 : .93;
      this.shadow(x, y + 40, 54, 13, .10);
      let size = step.tool === 'rollingPin' ? 154 : step.tool === 'mixingBowl' ? 108 : 105;
      this.sprite(step.tool, x, y, size, 99, 1, angle);
      ctx.restore();
      if (step.gesture === 'sprinkle' && active) {
        for (let n = 0; n < 9; n++) {
          const a = (this.time * 2.1 + n * .17) % 1;
          ctx.save(); ctx.translate(x - 14 + Math.sin(n * 5.2) * 21, y + 21 + a * 79); ctx.rotate(n);
          rounded(ctx, -2, -5, 4, 10, 2); ctx.fillStyle = colours[n % colours.length]; ctx.fill(); ctx.restore();
        }
      }
    }

    gestureHint(recipe) {
      const step = recipe.steps[this.s.stepIndex];
      if (!step || this.inputAge < 1.5 || this.stepAge < .6 || step.gesture === 'bake') return;
      const ctx = this.ctx, wave = this.reduced ? 0 : Math.sin(this.time * 2.5);
      ctx.save(); ctx.translate(0, 131); ctx.globalAlpha = .62 + (this.reduced ? 0 : Math.sin(this.time * 2) * .1);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ae7fa4'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (step.gesture === 'stir') {
        ctx.beginPath(); ctx.ellipse(0, -2, 27, 12, 0, -.4 + wave * .15, Math.PI * 1.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(11, -16); ctx.lineTo(23, -13); ctx.lineTo(15, -5); ctx.stroke();
      } else if (step.gesture === 'spread') {
        ctx.beginPath(); ctx.moveTo(-29, 0); ctx.lineTo(29, 0); ctx.moveTo(-22, -7); ctx.lineTo(-29, 0); ctx.lineTo(-22, 7); ctx.moveTo(22, -7); ctx.lineTo(29, 0); ctx.lineTo(22, 7); ctx.stroke();
      } else {
        ellipse(ctx, 0, 0, 14 + wave * 2, 7 + wave, null, '#ae7fa4', 3);
        ellipse(ctx, 0, 0, 4, 3, '#ae7fa4');
      }
      ctx.restore();
    }

    render() {
      const ctx = this.ctx, recipe = this.recipes.find(r => r.id === this.s.recipeId) || this.recipes[0];
      if (!recipe) return;
      this.background();
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(this.unit, this.unit);
      ctx.save();
      if (!this.reduced) ctx.scale(1 + this.kick * .024, 1 - this.kick * .035);
      if (this.s.phase === 'ready' || this.s.phase === 'celebrate') this.ready(recipe);
      else if (typeof this[recipe.id] === 'function') this[recipe.id]();
      ctx.restore();
      if (this.s.phase === 'cooking') {this.tool(recipe); this.gestureHint(recipe);}
      for (const p of this.particles) {
        ctx.save(); ctx.globalAlpha = Math.max(0, (1 - p.age / p.life) * .9);
        if (p.star) star(ctx, p.x, p.y, p.size, p.colour, p.age * 2);
        else ellipse(ctx, p.x, p.y, p.size * .65, p.size * .65, p.colour);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  window.KitchenScene = KitchenScene;
})();
