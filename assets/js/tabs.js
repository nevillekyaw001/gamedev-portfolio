/*
 * Tab navigation - one screen at a time, no long scroll.
 * Hash-routed so #play links straight to the game. Implements the ARIA
 * tabs pattern: aria-selected, roving tabindex, and arrow-key navigation.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var buttons = document.querySelectorAll('[data-tab-btn]');
  var btnArr = Array.prototype.slice.call(buttons);
  var tabs = document.querySelectorAll('.tab');
  var tablist = document.querySelector('.tabbar');

  function revealIn(tab) {
    var items = tab.querySelectorAll('.reveal:not(.is-visible)');
    items.forEach(function (el, i) {
      if (reduced) { el.classList.add('is-visible'); return; }
      setTimeout(function () { el.classList.add('is-visible'); }, 80 + i * 70);
    });
  }

  function activate(name, pushHash, focusPanel) {
    var found = false;
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      if (on) found = true;
    });
    if (!found) return activate('home', pushHash, focusPanel);
    buttons.forEach(function (b) {
      var on = b.dataset.tabBtn === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (pushHash !== false) {
      try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    var panel = document.querySelector('.tab.active');
    revealIn(panel);
    // Move focus into the new panel only when asked (deep-link CTAs), so
    // keyboard users land in the new section rather than back at the top.
    if (focusPanel && panel) {
      try { panel.focus({ preventScroll: true }); } catch (e) { panel.focus(); }
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { activate(b.dataset.tabBtn, true, false); });
  });

  // Arrow-key navigation across the tablist (activation follows focus).
  if (tablist) {
    tablist.addEventListener('keydown', function (e) {
      var idx = btnArr.indexOf(document.activeElement);
      if (idx === -1) return;
      var next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % btnArr.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + btnArr.length) % btnArr.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = btnArr.length - 1;
      else return;
      e.preventDefault();
      var nb = btnArr[next];
      activate(nb.dataset.tabBtn, true, false);
      nb.focus();
    });
  }

  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      activate(el.dataset.goto, true, true);
    });
  });

  window.addEventListener('hashchange', function () {
    activate(location.hash.replace('#', '') || 'home', false);
  });

  activate(location.hash.replace('#', '') || 'home', false);
})();
