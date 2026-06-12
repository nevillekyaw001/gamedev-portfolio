/*
 * Custom cursor + click particles.
 * A small gold dot with a trailing ring; the ring grows over anything
 * interactive. Clicks burst a few lacquer-and-gold sparks. Disabled on
 * touch devices and for prefers-reduced-motion.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse) return;

  document.documentElement.classList.add('has-cursor');

  // ---- cursor elements -------------------------------------------------
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mx = innerWidth / 2, my = innerHeight / 2;
  var rx = mx, ry = my;
  var visible = false;

  var HOT = 'a, button, .sq, input, textarea, [data-tilt]';

  document.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!visible) {
      visible = true;
      dot.style.opacity = ring.style.opacity = '1';
    }
    ring.classList.toggle('hot', !!(e.target.closest && e.target.closest(HOT)));
  }, { passive: true });

  document.addEventListener('pointerleave', function () {
    visible = false;
    dot.style.opacity = ring.style.opacity = '0';
  });

  // ---- particles --------------------------------------------------------
  var canvas = document.createElement('canvas');
  canvas.className = 'spark-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var sparks = [];
  var COLORS = ['227,179,76', '108,198,161', '212,96,79', '237,230,212'];

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function burst(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1 + Math.random() * 2.6;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6,
        life: 1,
        col: COLORS[(Math.random() * COLORS.length) | 0],
        r: 1 + Math.random() * 1.8
      });
    }
  }

  document.addEventListener('pointerdown', function (e) {
    burst(e.clientX, e.clientY, 10);
  });

  // Exposed so the game can celebrate (checkmate confetti, promotions).
  window.__spark = burst;

  function loop() {
    // cursor easing
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';

    // sparks
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.06;            // gravity, gently
      s.vx *= 0.985; s.vy *= 0.985;
      s.life -= 0.022;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(' + s.col + ',' + s.life.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * s.life, 0, 6.2832);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
