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
      rect = card.getBoundingClientRect();   // recompute so scroll can't stale it
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

/* Contact topic chips - tap one to start the message, then focus the box.
 * Runs regardless of reduced-motion (this is function, not decoration). */
(function () {
  'use strict';
  var chips = document.querySelectorAll('.topic-chip');
  if (!chips.length) return;
  var msg = document.querySelector('.contact-form textarea[name="message"]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!msg) return;
      msg.value = chip.dataset.topic || '';
      chips.forEach(function (c) { c.classList.remove('picked'); });
      chip.classList.add('picked');
      msg.focus();
      var len = msg.value.length;
      try { msg.setSelectionRange(len, len); } catch (e) { /* ignore */ }
    });
  });
})();

/* Hide purely decorative inline icons (<svg><use href="#i-..."/>) from
 * assistive tech - the visible text already carries the accessible name. */
(function () {
  'use strict';
  document.querySelectorAll('svg').forEach(function (svg) {
    var u = svg.querySelector('use');
    if (u && /#(i|p)-/.test(u.getAttribute('href') || '')) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  });
})();
