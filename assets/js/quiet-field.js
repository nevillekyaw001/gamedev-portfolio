/*
 * Quiet Systems — seeded flow field background.
 * Philosophy: assets/art/QUIET-SYSTEMS.md
 * Particles begin in scatter and resolve into laminar drift:
 * chaos structured, never deleted.
 */
(function () {
  'use strict';

  var PARAMS = {
    seed: 19960921,        // identity seed — change for a new composition
    density: 1 / 18000,    // particles per px² (≈ 70 on a 1440×900 screen)
    maxParticles: 180,
    driftSpeed: 0.16,      // px per frame at 1x — the pace of a slow exhale
    momentum: 0.96,        // how long a particle argues with the field
    trailDecay: 0.09,      // alpha of the fade veil per frame
    noiseScale: 0.0011,    // field granularity (broad, laminar)
    fieldTurn: 2.5,        // max field rotation in π units — low = fewer curls
    timeScale: 0.00006,    // geological reorganization speed
    convergence: 0.78      // noise threshold where rare accent threads surface
  };

  // Palette: charcoal on near-black, rare stone / olive / navy threads.
  var BG = [17, 17, 16];
  var INK = 'rgba(64, 63, 60, 0.18)';
  var ACCENTS = [
    'rgba(196, 189, 173, 0.20)',  // stone
    'rgba(107, 109, 77, 0.22)',   // olive
    'rgba(58, 70, 94, 0.22)'      // deep navy
  ];

  var canvas = document.getElementById('field-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // --- seeded PRNG (mulberry32) ------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- seeded value noise, 3 octaves -------------------------------------
  var lattice = (function () {
    var rand = mulberry32(PARAMS.seed);
    var size = 256, grid = new Float32Array(size * size);
    for (var i = 0; i < grid.length; i++) grid[i] = rand();
    function smooth(t) { return t * t * (3 - 2 * t); }
    function raw(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = smooth(x - xi), yf = smooth(y - yi);
      var x0 = ((xi % size) + size) % size, y0 = ((yi % size) + size) % size;
      var x1 = (x0 + 1) % size, y1 = (y0 + 1) % size;
      var a = grid[y0 * size + x0], b = grid[y0 * size + x1];
      var c = grid[y1 * size + x0], d = grid[y1 * size + x1];
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    }
    return function (x, y) {
      return raw(x, y) * 0.5 + raw(x * 2.1 + 31, y * 2.1 + 47) * 0.3 +
             raw(x * 4.3 + 89, y * 4.3 + 113) * 0.2;
    };
  })();

  var rand = mulberry32(PARAMS.seed ^ 0x9E3779B9);
  var particles = [];
  var W = 0, H = 0, dpr = 1, t0 = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function field(x, y, t) {
    // Field angle from noise; convergence value reused for accent threads.
    var n = lattice(x * PARAMS.noiseScale + t, y * PARAMS.noiseScale - t * 0.7);
    return { angle: n * Math.PI * PARAMS.fieldTurn, n: n };
  }

  function spawn() {
    return {
      x: rand() * W, y: rand() * H,
      vx: (rand() - 0.5) * 2, vy: (rand() - 0.5) * 2,  // initial scatter
      life: 200 + rand() * 600,
      accent: ACCENTS[(rand() * ACCENTS.length) | 0]
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgb(' + BG.join(',') + ')';
    ctx.fillRect(0, 0, W, H);
    var target = Math.min(PARAMS.maxParticles, Math.round(W * H * PARAMS.density));
    particles.length = 0;
    for (var i = 0; i < target; i++) particles.push(spawn());
  }

  function step(t) {
    // Fade veil: history stays faintly present beneath the now.
    ctx.fillStyle = 'rgba(' + BG.join(',') + ',' + PARAMS.trailDecay + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var f = field(p.x, p.y, t * PARAMS.timeScale);
      p.vx = p.vx * PARAMS.momentum + Math.cos(f.angle) * (1 - PARAMS.momentum);
      p.vy = p.vy * PARAMS.momentum + Math.sin(f.angle) * (1 - PARAMS.momentum);
      var nx = p.x + p.vx * PARAMS.driftSpeed * 3;
      var ny = p.y + p.vy * PARAMS.driftSpeed * 3;

      ctx.strokeStyle = f.n > PARAMS.convergence ? p.accent : INK;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.x = nx; p.y = ny;
      if (--p.life <= 0 || p.x < -8 || p.x > W + 8 || p.y < -8 || p.y > H + 8) {
        particles[i] = spawn();
      }
    }
  }

  var running = true;
  function loop(t) {
    if (!t0) t0 = t;
    if (running) step(t - t0);
    requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });

  window.addEventListener('resize', resize);
  resize();

  if (reduced) {
    // One settled frame: run the system to equilibrium, silently.
    for (var s = 0; s < 600; s++) step(s * 16);
  } else {
    requestAnimationFrame(loop);
  }
})();
