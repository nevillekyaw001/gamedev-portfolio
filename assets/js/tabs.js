/*
 * Tab navigation - one screen at a time, no long scroll.
 * Hash-routed so #play links straight to the game.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var buttons = document.querySelectorAll('[data-tab-btn]');
  var tabs = document.querySelectorAll('.tab');

  function revealIn(tab) {
    var items = tab.querySelectorAll('.reveal:not(.is-visible)');
    items.forEach(function (el, i) {
      if (reduced) { el.classList.add('is-visible'); return; }
      setTimeout(function () { el.classList.add('is-visible'); }, 80 + i * 70);
    });
  }

  function activate(name, pushHash) {
    var found = false;
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      if (on) found = true;
    });
    if (!found) return activate('home', pushHash);
    buttons.forEach(function (b) {
      b.classList.toggle('active', b.dataset.tabBtn === name);
    });
    if (pushHash !== false) {
      try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    revealIn(document.querySelector('.tab.active'));
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { activate(b.dataset.tabBtn); });
  });

  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      activate(el.dataset.goto);
    });
  });

  window.addEventListener('hashchange', function () {
    activate(location.hash.replace('#', '') || 'home', false);
  });

  activate(location.hash.replace('#', '') || 'home', false);
})();
