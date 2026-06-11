/*
 * Quiet interactions - 3D tilt on cards.
 * (Reveal animations are owned by tabs.js, which staggers them per tab.)
 * Restraint is the rule: small angles, slow easing, nothing bounces.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    var rect = null;
    card.addEventListener('pointerenter', function () {
      rect = card.getBoundingClientRect();
      card.style.transition = 'transform 0.18s ease';
    });
    card.addEventListener('pointermove', function (e) {
      if (!rect) rect = card.getBoundingClientRect();
      var rx = ((e.clientY - rect.top) / rect.height - 0.5) * -4;   // max ±2°
      var ry = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
      card.style.transform =
        'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
        ry.toFixed(2) + 'deg) translateY(-2px)';
    });
    card.addEventListener('pointerleave', function () {
      card.style.transition = 'transform 0.5s ease';
      card.style.transform = 'none';
      rect = null;
    });
  });
})();
