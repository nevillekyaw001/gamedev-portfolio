/*
 * Quiet interactions — 3D tilt on cards, scroll reveals.
 * Restraint is the rule: small angles, slow easing, nothing bounces.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 3D tilt --------------------------------------------------------
  if (!reduced) {
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
  }

  // ---- scroll reveal --------------------------------------------------
  var revealed = function (el) { el.classList.add('is-visible'); };

  if (reduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(revealed);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealed(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }
})();
