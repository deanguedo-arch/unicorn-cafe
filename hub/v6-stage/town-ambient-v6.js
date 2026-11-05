/* Review-only ambient layer. Geometry is traced from the V6 artwork. */
(function (root) {
  'use strict';
  const limits = Object.freeze({ regions: 8, details: 12, points: 64 });
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  function point(p) {
    if (!Array.isArray(p) || p.length !== 2 || !p.every(finite)) throw new TypeError('Invalid point');
    return Object.freeze([p[0], p[1]]);
  }
  function polygon(p) {
    if (!Array.isArray(p) || p.length < 3 || p.length > limits.points) throw new TypeError('Invalid clip polygon');
    return Object.freeze(p.map(point));
  }
  function list(value, maximum, convert) {
    if (!Array.isArray(value) || value.length > maximum) throw new TypeError('Invalid or excessive geometry');
    return Object.freeze(value.map(convert));
  }
  function positive(n) {
    if (!finite(n) || n <= 0) throw new TypeError('Expected a positive size');
    return n;
  }
  function compile(spec) {
    if (!spec || typeof spec !== 'object') throw new TypeError('Missing geometry');
    return Object.freeze({
      water: list(spec.water || [], limits.regions, r => Object.freeze({
        clip: polygon(r.clip),
        lines: list(r.lines, limits.details, l => Object.freeze({ at: point(l.at), length: positive(l.length) }))
      })),
      fountains: list(spec.fountains || [], limits.regions, r => Object.freeze({
        clip: polygon(r.clip),
        jets: list(r.jets, limits.details, j => Object.freeze({ at: point(j.at), height: positive(j.height), width: positive(j.width) }))
      })),
      lights: list(spec.lights || [], limits.regions, r => Object.freeze({
        clip: polygon(r.clip), center: point(r.center), radius: positive(r.radius)
      }))
    });
  }
  function clip(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.clip();
  }
  // Pass elapsed seconds, not a wall-clock timestamp. Coordinates are world units.
  // The caller is responsible for camera transform and prefers-reduced-motion.
  function draw(ctx, geometry, seconds, reducedMotion) {
    if (reducedMotion || !finite(seconds)) return;
    // Each oscillation completes an integer number of cycles in this period.
    const period = Math.PI * 80;
    const t = ((seconds % period) + period) % period;
    for (const r of geometry.water) {
      ctx.save(); clip(ctx, r.clip);
      ctx.strokeStyle = 'rgba(224,248,255,0.50)'; ctx.lineWidth = 3;
      for (let i = 0; i < r.lines.length; i++) {
        const l = r.lines[i], dx = Math.sin(t * 0.7 + i * 1.3) * 8;
        ctx.beginPath(); ctx.moveTo(l.at[0] + dx, l.at[1]);
        ctx.quadraticCurveTo(l.at[0] + dx + l.length * .3, l.at[1] - 2, l.at[0] + dx + l.length * .65, l.at[1]); ctx.stroke();
      }
      ctx.restore();
    }
    for (const r of geometry.fountains) {
      ctx.save(); clip(ctx, r.clip);
      ctx.strokeStyle = 'rgba(232,250,255,0.55)'; ctx.lineWidth = 3;
      for (let i = 0; i < r.jets.length; i++) {
        const j = r.jets[i], sway = Math.sin(t * 0.8 + i) * Math.min(8, j.width / 2);
        ctx.beginPath(); ctx.moveTo(j.at[0], j.at[1]);
        ctx.quadraticCurveTo(j.at[0] + sway, j.at[1] - j.height, j.at[0] + j.width, j.at[1]); ctx.stroke();
        // Small highlights rise and fade inside the existing spray, so the
        // fountain reads as moving without flashing or covering the statue.
        for (let k = 0; k < 3; k++) {
          const phase = (t * .18 + k / 3) % 1;
          ctx.fillStyle = `rgba(29,133,200,${.78 * Math.sin(Math.PI * phase) ** 2})`;
          ctx.beginPath();
          ctx.arc(j.at[0] + j.width * .35 + Math.sin(t * .5 + k) * 1.5,
            j.at[1] - j.height * .7 * phase, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    for (const r of geometry.lights) {
      ctx.save(); clip(ctx, r.clip);
      // A slow, shallow change, with no rapid flashing or filter/shadow cost.
      const alpha = 0.14 + 0.05 * Math.sin(t * 0.25);
      ctx.fillStyle = `rgba(255,214,133,${alpha})`;
      ctx.beginPath(); ctx.arc(r.center[0], r.center[1], r.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  const api = Object.freeze({ compile, draw, limits });
  root.UWTownAmbient = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
