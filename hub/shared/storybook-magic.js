/* Unicorn World Storybook Magic
 * Cozy fairytale soundscape, living town butterflies/sparkles, collectible town star-coins,
 * interactive Magic Town Picture Map, welcome crest, photo frames, and celebration particles.
 */
(function (root) {
  'use strict';

  /* ---------- Cozy Fairytale Web Audio Soundscape ---------- */
  const AudioEngine = (() => {
    let ctx = null;
    let musicTimer = null;
    let musicStep = 0;
    let musicWanted = false;
    let isMuted = () => false;
    let isPaused = () => false;

    const ensure = () => {
      if (isMuted()) return null;
      try {
        if (!ctx) {
          const AC = root.AudioContext || root.webkitAudioContext;
          if (!AC) return null;
          ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        return ctx;
      } catch (_) {
        return null;
      }
    };

    const note = (freq, delay = 0, dur = 0.24, vol = 0.08, type = 'triangle', detune = 0) => {
      const ac = ensure();
      if (!ac) return;
      try {
        const now = ac.currentTime + delay;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (detune) osc.detune.setValueAtTime(detune, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      } catch (_) {}
    };

    const pop = () => {
      note(587.33, 0, 0.11, 0.075, 'sine');
      note(880, 0.025, 0.09, 0.04, 'triangle');
    };
    const chime = () => {
      note(659.25, 0, 0.22, 0.07, 'sine');
      note(987.77, 0.06, 0.26, 0.06, 'triangle');
    };
    const coin = () => {
      note(659.25, 0, 0.14, 0.085, 'sine');
      note(987.77, 0.07, 0.18, 0.085, 'triangle');
      note(1318.51, 0.14, 0.34, 0.07, 'sine');
    };
    const fanfare = () => {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        note(f, i * 0.075, 0.36, 0.075, i % 2 ? 'triangle' : 'sine');
      });
    };
    const giggle = () => {
      [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => {
        note(f, i * 0.05, 0.18, 0.065, 'sine', i * 4);
      });
    };
    const shutter = () => {
      note(440, 0, 0.05, 0.06, 'square');
      note(1046.5, 0.06, 0.24, 0.07, 'sine');
      note(1318.51, 0.13, 0.3, 0.06, 'triangle');
    };
    const whoosh = () => {
      note(523.25, 0, 0.18, 0.045, 'sine');
      note(659.25, 0.06, 0.22, 0.05, 'sine');
      note(783.99, 0.12, 0.26, 0.045, 'triangle');
    };

    // Gentle storybook music-box pentatonic lullaby (C5 major / A4 relative)
    const melody = [
      523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 0,
      587.33, 659.25, 783.99, 880, 659.25, 523.25, 587.33, 0,
      523.25, 783.99, 1046.5, 987.77, 880, 783.99, 659.25, 587.33,
      523.25, 659.25, 783.99, 659.25, 523.25, 0, 0, 0
    ];

    const startMusic = () => {
      musicWanted = true;
      if (musicTimer) return;
      musicTimer = setInterval(() => {
        if (!musicWanted || isMuted() || isPaused() || document.hidden) return;
        const f = melody[musicStep % melody.length];
        musicStep++;
        if (f > 0) {
          note(f, 0, 0.55, 0.022, 'sine');
          if (musicStep % 4 === 1) note(f / 2, 0, 0.75, 0.014, 'triangle');
        }
      }, 460);
    };

    const stopMusic = () => {
      musicWanted = false;
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    };

    const suspend = () => {
      try { ctx?.suspend?.(); } catch (_) {}
    };

    const bind = (opts) => {
      if (opts?.isMuted) isMuted = opts.isMuted;
      if (opts?.isPaused) isPaused = opts.isPaused;
    };

    return { pop, chime, coin, fanfare, giggle, shutter, whoosh, startMusic, stopMusic, suspend, ensure, bind };
  })();

  /* ---------- Screen Celebration Particle Overlay ---------- */
  const COLORS = ['#ffd86b', '#ff94c2', '#8ee3ff', '#c9a7eb', '#95e6a7', '#fff6d1'];
  let sparkleCanvas = null;
  let sparkleCtx = null;
  const screenParticles = [];
  let sparkleRAF = 0;

  function drawStar(c, x, y, r, rot, col) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = col;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.44 : r;
      if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawHeart(c, x, y, r, rot, col) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(r / 14, r / 14);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, 7);
    c.bezierCurveTo(-16, -4, -9, -16, 0, -7);
    c.bezierCurveTo(9, -16, 16, -4, 0, 7);
    c.closePath();
    c.fill();
    c.restore();
  }

  function ensureSparkleCanvas() {
    if (sparkleCanvas) return sparkleCanvas;
    sparkleCanvas = document.createElement('canvas');
    sparkleCanvas.id = 'uw-sparkle-layer';
    sparkleCanvas.setAttribute('aria-hidden', 'true');
    document.body.append(sparkleCanvas);
    sparkleCtx = sparkleCanvas.getContext('2d');
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sparkleCanvas.width = Math.round(window.innerWidth * dpr);
      sparkleCanvas.height = Math.round(window.innerHeight * dpr);
      sparkleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener('resize', fit);
    return sparkleCanvas;
  }

  function tickScreenParticles() {
    if (!screenParticles.length) {
      sparkleRAF = 0;
      if (sparkleCtx && sparkleCanvas) {
        sparkleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
      return;
    }
    sparkleRAF = requestAnimationFrame(tickScreenParticles);
    const c = sparkleCtx;
    if (!c) return;
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const dt = 0.016;
    for (let i = screenParticles.length - 1; i >= 0; i--) {
      const p = screenParticles[i];
      p.age += dt;
      if (p.age >= p.life) {
        screenParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.985;
      p.rot += p.vr * dt;
      const alpha = Math.max(0, 1 - p.age / p.life);
      c.save();
      c.globalAlpha = alpha;
      if (p.shape === 'heart') drawHeart(c, p.x, p.y, p.r, p.rot, p.col);
      else drawStar(c, p.x, p.y, p.r, p.rot, p.col);
      c.restore();
    }
  }

  function burst(x, y, count = 18, shape = 'mixed') {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    ensureSparkleCanvas();
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const spd = 90 + Math.random() * 210;
      screenParticles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 95,
        g: 270,
        r: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 6,
        life: 0.65 + Math.random() * 0.55,
        age: 0,
        col: COLORS[i % COLORS.length],
        shape: shape === 'mixed' ? (i % 3 === 0 ? 'heart' : 'star') : shape
      });
    }
    if (!sparkleRAF) sparkleRAF = requestAnimationFrame(tickScreenParticles);
  }

  /* ---------- Living Town World Effects & Collectible Star-Coins ---------- */
  const butterflies = [
    { cx: 1180, cy: 760, rx: 140, ry: 75, sp: 0.65, ph: 0.2, col: '#ff96c7', trim: '#ffe6f3' },
    { cx: 1620, cy: 780, rx: 165, ry: 80, sp: 0.58, ph: 1.7, col: '#84d8ff', trim: '#e6f9ff' },
    { cx: 880, cy: 620, rx: 120, ry: 70, sp: 0.72, ph: 3.1, col: '#ffd966', trim: '#fff7d4' },
    { cx: 1850, cy: 560, rx: 135, ry: 65, sp: 0.62, ph: 4.4, col: '#d1a4ff', trim: '#f5e8ff' },
    { cx: 1370, cy: 1710, rx: 240, ry: 110, sp: 0.52, ph: 2.5, col: '#ff96c7', trim: '#fff4d4' },
    { cx: 680, cy: 1080, rx: 120, ry: 75, sp: 0.68, ph: 5.2, col: '#92e5a9', trim: '#ecfff0' }
  ];

  // Scenic town star-coin anchor spots (in world coordinates = artwork px * 2)
  const STAR_SPOTS = [
    { id: 'plaza-west', x: 1140, y: 900 },
    { id: 'plaza-east', x: 1620, y: 900 },
    { id: 'north-promenade', x: 1370, y: 540 },
    { id: 'fountain-west', x: 1040, y: 1690 },
    { id: 'fountain-east', x: 1700, y: 1690 }
  ];

  const townStars = STAR_SPOTS.map((s, idx) => ({
    ...s,
    phase: idx * 1.25,
    collectedAt: 0,
    active: true
  }));

  const worldTrails = [];
  const worldPopups = [];
  let fountainCooldown = 0;

  function addTrail(x, y, riding) {
    if (worldTrails.length > 48) return;
    worldTrails.push({
      x: x + (Math.random() - 0.5) * 26,
      y: y - 4 + (Math.random() - 0.5) * 10,
      r: riding ? 7 + Math.random() * 5 : 4.5 + Math.random() * 3.5,
      age: 0,
      life: riding ? 0.55 : 0.42,
      col: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
  }

  function worldBurst(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const spd = 70 + Math.random() * 130;
      worldPopups.push({
        x,
        y: y - 55,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 70,
        r: 9 + Math.random() * 7,
        rot: Math.random() * 6,
        age: 0,
        life: 0.75 + Math.random() * 0.35,
        col: COLORS[i % COLORS.length],
        shape: i % 2 === 0 ? 'heart' : 'star'
      });
    }
  }

  function respawnStars(now) {
    for (const s of townStars) {
      if (!s.active && now - s.collectedAt > 45000) {
        s.active = true;
      }
    }
  }

  function refreshStarsOnReturn() {
    for (const s of townStars) {
      if (!s.active) s.active = true;
    }
  }

  function stepTownMagic(ctxInfo) {
    const { scene, player, moving, riding, dt, service, reduced, toast, draw } = ctxInfo;
    if (fountainCooldown > 0) fountainCooldown = Math.max(0, fountainCooldown - dt);

    // Update trails & world popups
    for (let i = worldTrails.length - 1; i >= 0; i--) {
      worldTrails[i].age += dt;
      worldTrails[i].y -= 18 * dt;
      if (worldTrails[i].age >= worldTrails[i].life) worldTrails.splice(i, 1);
    }
    for (let i = worldPopups.length - 1; i >= 0; i--) {
      const p = worldPopups[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.rot += 3.5 * dt;
      if (p.age >= p.life) worldPopups.splice(i, 1);
    }

    if (moving && !reduced && Math.random() < (riding ? 0.55 : 0.25)) {
      addTrail(player.x, player.y, !!riding);
    }

    if (scene !== 'village') return;

    const now = Date.now();
    respawnStars(now);

    // Collectible town star-coins!
    for (const s of townStars) {
      if (!s.active) continue;
      if (Math.hypot(player.x - s.x, player.y - s.y) < 78) {
        s.active = false;
        s.collectedAt = now;
        worldBurst(s.x, s.y, 16);
        AudioEngine.coin();
        const wallet = document.getElementById('wallet');
        if (wallet) {
          wallet.classList.remove('coin-pop');
          void wallet.offsetWidth;
          wallet.classList.add('coin-pop');
          setTimeout(() => wallet.classList.remove('coin-pop'), 260);
          const r = wallet.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 12, 'star');
        }
        if (service?.available) {
          const eid = 'town-star:' + s.id + ':' + Math.floor(now / 1000) + ':' + Math.random().toString(36).slice(2, 7);
          service.run('earn', { game: 'world', event: { id: eid, kind: 'star' } }, eid).catch(() => {});
        }
        if (toast) toast('coin', '+1', 'You found a magic star coin!');
        if (draw) draw();
      }
    }

    // Unicorn Fountain splash delight in south plaza (x=1370, y=1728)
    const distFountain = Math.hypot(player.x - 1370, player.y - 1728);
    if (distFountain < 340 && distFountain > 180 && fountainCooldown <= 0 && moving) {
      fountainCooldown = 4.5;
      worldBurst(1370, 1680, 14);
      AudioEngine.chime();
    }
  }

  function drawTownUnderPlayer(ctx, scene, time, reduced, focusedDoor) {
    // Draw glowing pulsing halo under focused village entrance pad
    if (scene === 'village' && focusedDoor && !focusedDoor.exit) {
      ctx.save();
      const pulse = reduced ? 1 : 0.92 + Math.sin(time * 4.2) * 0.08;
      const g = ctx.createRadialGradient(focusedDoor.x, focusedDoor.y, 10, focusedDoor.x, focusedDoor.y, 92 * pulse);
      g.addColorStop(0, 'rgba(255, 245, 178, 0.58)');
      g.addColorStop(0.65, 'rgba(255, 214, 118, 0.25)');
      g.addColorStop(1, 'rgba(255, 214, 118, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(focusedDoor.x, focusedDoor.y, 95 * pulse, 58 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 248, 200, 0.92)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(focusedDoor.x, focusedDoor.y, 68 * pulse, 42 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hoof sparkle trails
    for (const t of worldTrails) {
      const a = Math.max(0, 1 - t.age / t.life);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      drawStar(ctx, t.x, t.y, t.r * (0.6 + 0.4 * a), t.age * 3, t.col);
      ctx.restore();
    }

    // Collectible Golden Star-Coins in town
    if (scene === 'village') {
      for (const s of townStars) {
        if (!s.active) continue;
        const bob = reduced ? 0 : Math.sin(time * 3.4 + s.phase) * 9;
        const spin = reduced ? 1 : 0.78 + Math.abs(Math.cos(time * 2.2 + s.phase)) * 0.22;
        ctx.save();
        // Ground shadow
        ctx.fillStyle = 'rgba(72, 38, 92, 0.22)';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 8, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Warm glow aura
        const aura = ctx.createRadialGradient(s.x, s.y - 26 + bob, 6, s.x, s.y - 26 + bob, 44);
        aura.addColorStop(0, 'rgba(255, 240, 150, 0.72)');
        aura.addColorStop(1, 'rgba(255, 212, 92, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(s.x, s.y - 26 + bob, 44, 0, Math.PI * 2);
        ctx.fill();
        // Coin medallion
        ctx.translate(s.x, s.y - 26 + bob);
        ctx.scale(spin, 1);
        ctx.fillStyle = '#f2a92c';
        ctx.strokeStyle = '#63356f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffe57a';
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        drawStar(ctx, 0, 0, 11, 0, '#fffaf0');
        ctx.restore();
      }
    }
  }

  function drawTownOverPlayer(ctx, scene, time, reduced) {
    // World hearts/stars popups (from unicorn tap / coins / fountain)
    for (const p of worldPopups) {
      const a = Math.max(0, 1 - p.age / p.life);
      ctx.save();
      ctx.globalAlpha = a;
      if (p.shape === 'heart') drawHeart(ctx, p.x, p.y, p.r, p.rot, p.col);
      else drawStar(ctx, p.x, p.y, p.r, p.rot, p.col);
      ctx.restore();
    }

    if (scene !== 'village' || reduced) return;

    // Fluttering pastel butterflies over town flowerbeds
    for (const b of butterflies) {
      const t = time * b.sp + b.ph;
      const x = b.cx + Math.cos(t) * b.rx;
      const y = b.cy + Math.sin(t * 1.45) * b.ry;
      const flap = 0.25 + Math.abs(Math.sin(time * 11 + b.ph)) * 0.75;
      const heading = -Math.sin(t) * b.rx >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(heading, 1);
      ctx.fillStyle = b.col;
      ctx.strokeStyle = '#5a3469';
      ctx.lineWidth = 2;
      // Left & right wings
      ctx.beginPath();
      ctx.ellipse(-7 * flap, -4, 9 * flap, 6, -0.35, 0, Math.PI * 2);
      ctx.ellipse(7 * flap, -4, 9 * flap, 6, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = b.trim;
      ctx.beginPath();
      ctx.ellipse(-5 * flap, 3, 5 * flap, 4, 0.3, 0, Math.PI * 2);
      ctx.ellipse(5 * flap, 3, 5 * flap, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gentle sunlit golden motes drifting over the plaza
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const mx = 320 + ((i * 211 + time * (16 + (i % 4) * 5)) % 2100);
      const my = 260 + ((i * 173 + Math.sin(time * 0.8 + i) * 35) % 1650);
      const alpha = 0.22 + 0.25 * Math.sin(time * 2.1 + i * 1.7);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = i % 2 ? '#fff6c7' : '#ffdff3';
      ctx.beginPath();
      ctx.arc(mx, my, 4 + (i % 3) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- Dreamy Scene Wipe ---------- */
  let wipeNode = null;
  function wipe() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (!wipeNode) {
      wipeNode = document.createElement('div');
      wipeNode.id = 'uw-scene-wipe';
      wipeNode.setAttribute('aria-hidden', 'true');
      document.body.append(wipeNode);
    }
    wipeNode.classList.add('active');
    setTimeout(() => wipeNode.classList.remove('active'), 180);
  }

  /* ---------- Magic Town Picture Map ---------- */
  const SPORT_SVGS = {
    basketball:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<circle cx="24" cy="24" r="18" fill="#ff9442" stroke="#5c336e" stroke-width="3.2"/>' +
      '<path d="M6 24h36M24 6v36M11 11c7 8 7 18 0 26M37 11c-7 8-7 18 0 26" fill="none" stroke="#6b345c" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse cx="18" cy="15" rx="4.5" ry="2.6" fill="#ffd49c" opacity=".75"/>' +
      '</svg>',
    tennis:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<g transform="rotate(-35 24 24)">' +
      '<ellipse cx="22" cy="16" rx="10" ry="12" fill="#f9c2df" stroke="#5c336e" stroke-width="3"/>' +
      '<path d="M16 10v12M22 6v20M28 10v12M14 14h16M14 20h16" stroke="#8b559e" stroke-width="1.6"/>' +
      '<rect x="19.5" y="28" width="5" height="14" rx="2.5" fill="#ffd564" stroke="#5c336e" stroke-width="2.6"/>' +
      '</g>' +
      '<circle cx="35" cy="33" r="6.5" fill="#c7f25a" stroke="#5c336e" stroke-width="2.6"/>' +
      '</svg>',
    volleyball:
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<circle cx="24" cy="24" r="18" fill="#fff7e2" stroke="#5c336e" stroke-width="3.2"/>' +
      '<path d="M24 6c6 6 9 12 9 18s-3 12-9 18M9 14c8 1 15 5 21 12M9 34c8-1 15-5 21-12" fill="none" stroke="#5c336e" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M24 6a18 18 0 0 1 15 9c-5 2-10 3-15 3z" fill="#ffd564" opacity=".85"/>' +
      '<path d="M9 34a18 18 0 0 0 15 8c2-5 3-10 3-15z" fill="#8ad8ff" opacity=".85"/>' +
      '</svg>'
  };

  const MAP_PINS = [
    { id: 'cafe', label: 'Rainbow Café', x: 300, y: 178, img: '../game/build/assets/pizza.webp' },
    { id: 'mall', label: 'Shopping Mall', x: 685, y: 207, icon: 'bag' },
    { id: 'home-exterior', label: 'Cozy Home', x: 1110, y: 185, icon: 'home' },
    { id: 'boutique', label: 'Dress-Up Boutique', x: 172, y: 440, icon: 'hanger' },
    { id: 'wheels', label: 'Wheels Shop', x: 439, y: 408, icon: 'wheel' },
    { id: 'arcade', label: 'Arcade & Puzzles', x: 997, y: 409, icon: 'star' },
    { id: 'take-photo', label: 'Photo Booth', x: 1253, y: 477, icon: 'camera' },
    { id: 'adventure', label: 'Sneaky Unicorn Adventure', x: 194, y: 619, img: '../game/build/assets/room_door.webp' },
    { id: 'park', label: 'Basketball & Sports Park', x: 365, y: 643, svg: 'basketball' },
    { id: 'tennis', label: 'Tennis Court', x: 861, y: 625, svg: 'tennis' },
    { id: 'volleyball', label: 'Volleyball Court', x: 1124, y: 637, svg: 'volleyball' },
    { id: 'bowling', label: 'Bowling Lane', x: 1271, y: 666, icon: 'pins' },
    { id: 'fountain', label: 'Unicorn Fountain Plaza', x: 685, y: 800, icon: 'heart' }
  ];

  let mapModal = null;
  let mapBtn = null;

  function installMapControl(hooks) {
    const tools = document.getElementById('world-tools');
    if (!tools || document.getElementById('world-map-btn')) return;

    mapBtn = document.createElement('button');
    mapBtn.id = 'world-map-btn';
    mapBtn.type = 'button';
    mapBtn.setAttribute('aria-label', 'Open Magic Town Map');
    mapBtn.innerHTML =
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M7 12l11-4 12 4 11-4v28l-11 4-12-4-11 4z" fill="#fff4cf" stroke="#5c336e" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M18 8v28M30 12v28" stroke="#c88d4b" stroke-width="2.6" stroke-dasharray="3 3"/>' +
      '<circle cx="24" cy="22" r="6" fill="#ff7db8" stroke="#5c336e" stroke-width="2.6"/>' +
      '<path d="M24 19l1.1 2.2 2.4.4-1.7 1.6.4 2.4-2.2-1.1-2.2 1.1.4-2.4-1.7-1.6 2.4-.4z" fill="#fff7cc"/>' +
      '</svg>';

    const wallet = document.getElementById('wallet');
    if (wallet && wallet.nextSibling) tools.insertBefore(mapBtn, wallet.nextSibling);
    else tools.append(mapBtn);

    mapModal = document.createElement('section');
    mapModal.id = 'uw-map-modal';
    mapModal.setAttribute('role', 'dialog');
    mapModal.setAttribute('aria-modal', 'true');
    mapModal.setAttribute('aria-label', 'Magic Town Map');
    mapModal.hidden = true;
    document.body.append(mapModal);

    const closeMap = () => {
      if (!mapModal || mapModal.hidden) return;
      mapModal.hidden = true;
      AudioEngine.pop();
    };

    const openMap = () => {
      if (hooks.isBlocked?.()) return;
      AudioEngine.whoosh();
      const A = root.UWArt;
      const pos = hooks.getPlayer();
      const inTown = hooks.getScene() === 'village';
      const pxPct = Math.max(4, Math.min(96, (pos.x / 2 / 1371) * 100));
      const pyPct = Math.max(4, Math.min(96, (pos.y / 2 / 1148) * 100));

      const pinsHTML = MAP_PINS.map((pin) => {
        const left = ((pin.x / 1371) * 100).toFixed(2);
        const top = ((pin.y / 1148) * 100).toFixed(2);
        const glyph = pin.svg && SPORT_SVGS[pin.svg]
          ? SPORT_SVGS[pin.svg]
          : `<img src="${pin.img || (A ? A.iconURL(pin.icon) : '')}" alt="" draggable="false">`;
        return `<button class="uw-map-pin" type="button" data-map-target="${pin.id}" aria-label="${pin.label}" style="left:${left}%;top:${top}%">${glyph}</button>`;
      }).join('');

      const closeIcon = A ? A.iconURL('close') : '';
      const playerMarker = inTown
        ? `<img class="uw-map-player" src="../game/build/assets/u_happy1.webp" alt="" draggable="false" style="left:${pxPct.toFixed(2)}%;top:${pyPct.toFixed(2)}%">`
        : '';

      mapModal.innerHTML =
        `<div class="uw-map-frame">` +
        `<img class="uw-map-img" src="./v6-stage/town-v6.png" alt="Unicorn World map" draggable="false">` +
        `<button class="uw-map-close" type="button" aria-label="Close map"><img src="${closeIcon}" alt="" draggable="false"></button>` +
        `${pinsHTML}${playerMarker}</div>`;

      mapModal.hidden = false;
      mapModal.querySelector('.uw-map-close')?.focus();
    };

    mapBtn.onclick = () => {
      if (mapModal.hidden) openMap();
      else closeMap();
    };

    mapModal.onclick = (e) => {
      if (e.target === mapModal || e.target.closest('.uw-map-close')) {
        closeMap();
        return;
      }
      const pin = e.target.closest('[data-map-target]');
      if (!pin) return;
      const targetId = pin.dataset.mapTarget;
      const rect = pin.getBoundingClientRect();
      closeMap();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 16, 'mixed');
      AudioEngine.chime();
      hooks.goToPlace(targetId);
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mapModal && !mapModal.hidden) {
        e.stopImmediatePropagation();
        closeMap();
      }
    }, true);

    return {
      updateVisibility: (visible) => {
        if (mapBtn) mapBtn.hidden = !visible;
        if (!visible && mapModal && !mapModal.hidden) mapModal.hidden = true;
      },
      isOpen: () => !!(mapModal && !mapModal.hidden),
      close: closeMap
    };
  }

  /* ---------- Storybook Welcome Curtain ---------- */
  function showWelcome(hooks) {
    try {
      if (sessionStorage.getItem('uw-welcome-seen') === '1') return;
    } catch (_) {}

    const overlay = document.createElement('div');
    overlay.id = 'uw-welcome';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Welcome to Unicorn World. Tap Play to start.');

    const A = root.UWArt;
    const playSrc = A ? A.iconURL('play') : './assets/controls/icons/play.png';
    overlay.innerHTML =
      `<div class="uw-welcome-card">` +
      `<div class="uw-welcome-crest"><canvas id="uw-welcome-unicorn" width="220" height="220" aria-hidden="true"></canvas></div>` +
      `<button class="uw-welcome-play" type="button" aria-label="Play Unicorn World"><img src="${playSrc}" alt="" draggable="false"></button>` +
      `</div>`;

    document.body.append(overlay);

    // Draw dressed-up canonical unicorn inside the golden welcome wreath
    const cv = overlay.querySelector('#uw-welcome-unicorn');
    if (cv && A) {
      const c = cv.getContext('2d');
      try {
        A.unicorn(c, 110, 198, 166, hooks.getOutfit(), 'u_happy1', false, null);
      } catch (_) {}
    }

    let dismissed = false;
    const dismiss = (e) => {
      if (dismissed) return;
      dismissed = true;
      try { sessionStorage.setItem('uw-welcome-seen', '1'); } catch (_) {}
      const x = e?.clientX || window.innerWidth / 2;
      const y = e?.clientY || window.innerHeight / 2;
      AudioEngine.ensure();
      AudioEngine.fanfare();
      AudioEngine.startMusic();
      burst(x, y, 26, 'mixed');
      overlay.classList.add('leaving');
      setTimeout(() => overlay.remove(), 460);
      hooks.onDismiss?.();
    };

    overlay.addEventListener('click', dismiss);
    const onKey = (e) => {
      if (['Enter', ' ', 'Escape'].includes(e.key)) {
        e.preventDefault();
        window.removeEventListener('keydown', onKey, true);
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey, true);
    overlay.querySelector('.uw-welcome-play')?.focus();
  }

  /* ---------- Storybook Photo Booth Decorative Frames ---------- */
  const PHOTO_FRAMES = [
    { id: 'none', icon: 'camera', label: 'No frame' },
    { id: 'hearts', icon: 'heart', label: 'Hearts frame' },
    { id: 'stars', icon: 'star', label: 'Golden stars frame' },
    { id: 'flowers', icon: 'flower', label: 'Blossom wreath frame' }
  ];

  function paintPhotoFrame(ctx, w, h, frameId) {
    if (!frameId || frameId === 'none') return;
    ctx.save();
    // Soft golden inner mat border
    ctx.strokeStyle = '#ffd974';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = '#fff9df';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    if (frameId === 'hearts') {
      const cols = ['#ff7db8', '#ffb3d9', '#ffd86b'];
      for (let i = 0; i < 12; i++) {
        const t = (i + 0.5) / 12;
        drawHeart(ctx, t * w, 24, 13, 0, cols[i % cols.length]);
        drawHeart(ctx, t * w, h - 24, 13, 0, cols[(i + 1) % cols.length]);
      }
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        drawHeart(ctx, 24, t * h, 13, 0, cols[i % cols.length]);
        drawHeart(ctx, w - 24, t * h, 13, 0, cols[(i + 1) % cols.length]);
      }
    } else if (frameId === 'stars') {
      const cols = ['#ffe27a', '#fff6cf', '#ff9ec9', '#9be2ff'];
      for (let i = 0; i < 14; i++) {
        const t = (i + 0.5) / 14;
        drawStar(ctx, t * w, 24, 13, i * 0.4, cols[i % cols.length]);
        drawStar(ctx, t * w, h - 24, 13, -i * 0.4, cols[(i + 2) % cols.length]);
      }
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        drawStar(ctx, 24, t * h, 13, i * 0.5, cols[i % cols.length]);
        drawStar(ctx, w - 24, t * h, 13, i * 0.5, cols[(i + 1) % cols.length]);
      }
    } else if (frameId === 'flowers') {
      // Corner blossom clusters
      const corners = [[34, 34], [w - 34, 34], [34, h - 34], [w - 34, h - 34]];
      for (const [cx, cy] of corners) {
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI * 2) / 6;
          ctx.fillStyle = k % 2 ? '#61c27d' : '#ff9cc8';
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 10, 7, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fff5d4';
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd059';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function flashCamera() {
    const f = document.createElement('div');
    f.className = 'uw-photo-flash';
    document.body.append(f);
    setTimeout(() => f.remove(), 420);
  }

  root.UWMagicAudio = AudioEngine;
  root.UWMagic = {
    audio: AudioEngine,
    burst,
    worldBurst,
    addTrail,
    stepTownMagic,
    drawTownUnderPlayer,
    drawTownOverPlayer,
    refreshStarsOnReturn,
    wipe,
    installMapControl,
    showWelcome,
    PHOTO_FRAMES,
    paintPhotoFrame,
    flashCamera
  };
})(typeof window !== 'undefined' ? window : globalThis);
