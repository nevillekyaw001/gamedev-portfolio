/*
 * Context-aware custom cursor + click particles.
 * A small dot trailed by a ring. Both read the UI underneath and change
 * shape + colour: gold over links, lacquer over CTAs, jade over the game
 * board, an I-beam over text fields, a wide soft ring over tilt cards.
 * Click bursts a few sparks tinted to wherever you clicked.
 * Disabled on touch devices and for prefers-reduced-motion.
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

  // Context map: first match wins, top to bottom. Each gives the ring a
  // data-ctx the CSS styles, plus a spark colour for clicks in that zone.
  var CTX = [
    { sel: 'input, textarea', ctx: 'text', spark: '237,230,212' },
    { sel: '.sq, .board, .board-stage', ctx: 'game', spark: '79,214,163' },
    { sel: '.btn, .game-actions button, .tutorial button, .contact-form button, [type="submit"]', ctx: 'cta', spark: '242,101,77' },
    { sel: 'a', ctx: 'link', spark: '244,186,56' },
    { sel: '[data-tilt]', ctx: 'tilt', spark: '244,186,56' }
  ];
  var sparkCol = '244,186,56';

  document.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!visible) {
      visible = true;
      dot.style.opacity = ring.style.opacity = '1';
    }
    var ctx = '', col = '244,186,56';
    var t = e.target;
    if (t && t.closest) {
      for (var i = 0; i < CTX.length; i++) {
        if (t.closest(CTX[i].sel)) { ctx = CTX[i].ctx; col = CTX[i].spark; break; }
      }
    }
    sparkCol = col;
    if (ring.dataset.ctx !== ctx) {
      ring.dataset.ctx = ctx;
      dot.dataset.ctx = ctx;
    }
  }, { passive: true });

  document.addEventListener('pointerleave', function () {
    visible = false;
    dot.style.opacity = ring.style.opacity = '0';
  });

  // ---- particles --------------------------------------------------------
  var canvas = document.createElement('canvas');
  canvas.className = 'spark-canvas';
  document.body.appendChild(canvas);
  var ctx2d = canvas.getContext('2d');
  var sparks = [];

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function burst(x, y, n, col) {
    var base = col || sparkCol;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1 + Math.random() * 2.8;
      // 70% the local accent, 30% warm cream for sparkle
      var c = Math.random() < 0.7 ? base : '237,230,212';
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6,
        life: 1,
        col: c,
        r: 1 + Math.random() * 1.9
      });
    }
  }

  function ripple(x, y, col, big) {
    var r = document.createElement('div');
    r.className = 'cursor-ripple' + (big ? ' big' : '');
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    r.style.borderColor = 'rgba(' + col + ',0.55)';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 600);
  }

  document.addEventListener('pointerdown', function (e) {
    // press feedback on the ring + a ripple and spark burst in the local
    // accent. CTAs get a bigger ripple - the click "lands" harder.
    var c = ring.dataset.ctx || '';
    ring.classList.add('press');
    setTimeout(function () { ring.classList.remove('press'); }, 180);
    ripple(e.clientX, e.clientY, sparkCol, c === 'cta');
    burst(e.clientX, e.clientY, c === 'cta' ? 16 : 11);
  });

  // Exposed so the game can celebrate (checkmate confetti, promotions).
  // Optional 4th arg lets callers force a colour (jade for the board).
  window.__spark = function (x, y, n, col) { burst(x, y, n, col || '79,214,163'); };

  function loop() {
    // cursor easing
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';

    // sparks
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.06;            // gravity, gently
      s.vx *= 0.985; s.vy *= 0.985;
      s.life -= 0.022;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx2d.fillStyle = 'rgba(' + s.col + ',' + s.life.toFixed(3) + ')';
      ctx2d.beginPath();
      ctx2d.arc(s.x, s.y, s.r * s.life, 0, 6.2832);
      ctx2d.fill();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
