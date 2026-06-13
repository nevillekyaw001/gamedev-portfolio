/*
 * Sophisticated Systems - the seeded field, third movement.
 * Philosophy: assets/art/SOPHISTICATED-SYSTEMS.md (lineage: QUIET-SYSTEMS.md)
 * Hand-rolled perspective projection (no dependency): particles drift
 * through a 3D noise field; the camera leans gently toward the cursor.
 * Where currents converge, threads warm into Myanmar gold, jade and
 * lacquer, and fireflies surface. Calm is still the constraint.
 */
(function () {
  'use strict';

  var PARAMS = {
    seed: 19960921,
    count: 340,            // particles in the volume - denser, more alive
    depth: 900,            // z-extent of the volume
    fov: 420,              // perspective strength
    driftSpeed: 0.5,
    momentum: 0.96,
    noiseScale: 0.0013,
    fieldTurn: 2.5,
    timeScale: 0.00005,
    parallax: 42,          // max camera lean toward cursor (px)
    scrollDrift: 0.12,     // camera z-response to scroll
    convergence: 0.60,     // accents surface more often
    firefly: 0.80,         // above this, a convergence glows
    motes: 30              // ambient twinkling sparkles drifting in front
  };

  var BG = [18, 17, 16];
  var INK = [76, 72, 64];
  var ACCENTS = [[244, 186, 56], [79, 214, 163], [242, 101, 77]];  // gold, jade, lacquer (vibrant)

  var canvas = document.getElementById('field-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

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
  var W = 0, H = 0, dpr = 1;
  var particles = [];
  var motes = [];
  var camX = 0, camY = 0, targetX = 0, targetY = 0, scrollZ = 0, targetScrollZ = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawn() {
    return {
      x: (rand() - 0.5) * 2.6,            // normalized world coords
      y: (rand() - 0.5) * 2.6,
      z: rand() * PARAMS.depth,
      vx: (rand() - 0.5) * 2, vy: (rand() - 0.5) * 2,
      px: null, py: null,                  // previous projected point
      life: 300 + rand() * 700,
      accent: ACCENTS[(rand() * ACCENTS.length) | 0]
    };
  }

  function spawnMote() {
    return {
      x: rand() * (W || window.innerWidth),
      y: rand() * (H || window.innerHeight),
      r: 0.6 + rand() * 1.7,
      tw: rand() * 6.2832,
      tws: 0.008 + rand() * 0.022,
      vx: (rand() - 0.5) * 0.18,
      vy: -0.05 - rand() * 0.13,            // drift gently upward
      col: ACCENTS[(rand() * ACCENTS.length) | 0]
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
  }

  function project(p) {
    // camera leans toward cursor; scroll pushes the volume past us.
    // z is clamped away from the lens so nothing ever streaks past it.
    var z = 140 + ((p.z - scrollZ) % PARAMS.depth + PARAMS.depth) % PARAMS.depth;
    var s = PARAMS.fov / (PARAMS.fov + z);
    return {
      x: W / 2 + (p.x * W * 0.5 - camX) * s,
      y: H / 2 + (p.y * H * 0.5 - camY) * s,
      s: s, z: z
    };
  }

  function step(t) {
    camX += (targetX - camX) * 0.03;
    camY += (targetY - camY) * 0.03;
    scrollZ += (targetScrollZ - scrollZ) * 0.04;

    ctx.fillStyle = 'rgba(' + BG.join(',') + ',0.10)';
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var n = lattice(p.x * 600 * PARAMS.noiseScale + t * PARAMS.timeScale,
                      p.y * 600 * PARAMS.noiseScale + p.z * 0.0012 - t * PARAMS.timeScale * 0.7);
      var a = n * Math.PI * PARAMS.fieldTurn;
      p.vx = p.vx * PARAMS.momentum + Math.cos(a) * (1 - PARAMS.momentum);
      p.vy = p.vy * PARAMS.momentum + Math.sin(a) * (1 - PARAMS.momentum);
      p.x += p.vx * PARAMS.driftSpeed * 0.0016;
      p.y += p.vy * PARAMS.driftSpeed * 0.0016;
      p.z -= PARAMS.driftSpeed * 0.12;      // slow swim toward the camera

      var q = project(p);
      if (p.px !== null && Math.abs(q.x - p.px) < 40 && Math.abs(q.y - p.py) < 40) {
        var near = 1 - q.z / PARAMS.depth;            // 0 far → 1 near
        var alpha = 0.09 + near * 0.26;
        var col = n > PARAMS.convergence ? p.accent : INK;
        ctx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 0.5 + q.s * 1.2;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        if (n > PARAMS.firefly) {
          // a firefly: a soft glow where the field is tightest. Brighter
          // core + a faint halo, so convergences read as little embers.
          var fa = 0.14 + near * 0.28;
          var fr = 1.4 + q.s * 2.4;
          var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, fr * 2.4);
          g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + fa.toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(q.x, q.y, fr * 2.4, 0, 6.2832);
          ctx.fill();
        }
      }
      p.px = q.x; p.py = q.y;

      if (--p.life <= 0 || Math.abs(p.x) > 1.5 || Math.abs(p.y) > 1.5) {
        particles[i] = spawn();
      }
    }

    // ambient motes: slow twinkling sparkles drifting in front of the field
    for (var mi = 0; mi < motes.length; mi++) {
      var mo = motes[mi];
      mo.x += mo.vx; mo.y += mo.vy; mo.tw += mo.tws;
      if (mo.y < -12 || mo.x < -12 || mo.x > W + 12) {
        motes[mi] = spawnMote(); motes[mi].y = H + 8; continue;
      }
      var tw = 0.5 + 0.5 * Math.sin(mo.tw);             // 0..1 twinkle
      var ma = 0.04 + tw * 0.24;
      var mg = ctx.createRadialGradient(mo.x, mo.y, 0, mo.x, mo.y, mo.r * 4.2);
      mg.addColorStop(0, 'rgba(' + mo.col[0] + ',' + mo.col[1] + ',' + mo.col[2] + ',' + ma.toFixed(3) + ')');
      mg.addColorStop(1, 'rgba(' + mo.col[0] + ',' + mo.col[1] + ',' + mo.col[2] + ',0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mo.x, mo.y, mo.r * 4.2, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = 'rgba(' + mo.col[0] + ',' + mo.col[1] + ',' + mo.col[2] + ',' + (ma * 1.5).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(mo.x, mo.y, mo.r, 0, 6.2832);
      ctx.fill();
    }
  }

  window.addEventListener('mousemove', function (e) {
    targetX = (e.clientX / W - 0.5) * 2 * PARAMS.parallax;
    targetY = (e.clientY / H - 0.5) * 2 * PARAMS.parallax;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    targetScrollZ = window.scrollY * PARAMS.scrollDrift;
  }, { passive: true });

  window.addEventListener('resize', resize);

  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });

  resize();
  for (var i = 0; i < PARAMS.count; i++) particles.push(spawn());
  for (var mm = 0; mm < PARAMS.motes; mm++) motes.push(spawnMote());

  if (reduced) {
    for (var s = 0; s < 500; s++) step(s * 16);
  } else {
    (function loop(t) {
      if (running) step(t || 0);
      requestAnimationFrame(loop);
    })(0);
  }
})();
