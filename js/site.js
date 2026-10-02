/*
 * The site's only script: the home page carousel, the navbar that collapses
 * on narrow screens, and team cards that open the profile wherever they are
 * clicked. It replaces jQuery 1.11 and Bootstrap 3's JS, and drives the same
 * Bootstrap 3 CSS classes they did, so the markup, the look and the
 * animations are unchanged.
 *
 * Loaded with `defer` from _includes/head.html, so it runs once the document
 * is parsed. It lives in a file because the lab server's Content-Security-
 * Policy has no 'unsafe-inline' in script-src.
 */
(() => {
  'use strict';

  // Calls done() once el's own CSS transition ends, or after ms in case no
  // transitionend arrives (Bootstrap 3 used the same fallback).
  function afterTransition(el, ms, done) {
    let finished = false;
    const finish = (e) => {
      if (finished || (e && e.target !== el)) return;
      finished = true;
      el.removeEventListener('transitionend', finish);
      done();
    };
    el.addEventListener('transitionend', finish);
    setTimeout(finish, ms + 50);
  }

  // Carousel: <div class="carousel slide" data-ride="carousel"
  //   data-interval="3000" data-pause="hover"> as in _pages/home.md.
  function carousel(root) {
    const items = root.querySelectorAll('.carousel-inner > .item');
    const dots = root.querySelectorAll('.carousel-indicators [data-slide-to]');
    const interval = parseInt(root.dataset.interval, 10) || 5000;
    const stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = Math.max(0, [...items].findIndex((item) => item.classList.contains('active')));
    let sliding = false;
    let hovered = false;
    let timer = null;

    // Every slide but the first is loading="lazy", and a lazy image inside a
    // hidden slide only starts loading once that slide slides in. Asking for
    // the next one ahead of time keeps it from arriving blank.
    function preload(index) {
      const img = items[index].querySelector('img[loading="lazy"]');
      if (img) img.loading = 'eager';
    }

    function slide(to, type) {
      if (sliding || to === current) return;
      const from = items[current];
      const next = items[to];
      const direction = type === 'next' ? 'left' : 'right';
      sliding = true;
      dots[current]?.classList.remove('active');
      dots[to]?.classList.add('active');
      next.classList.add(type);
      void next.offsetWidth;  // lay it out off-screen so the move animates
      from.classList.add(direction);
      next.classList.add(direction);
      afterTransition(from, 600, () => {
        next.classList.remove(type, direction);
        next.classList.add('active');
        from.classList.remove('active', direction);
        current = to;
        sliding = false;
        preload((to + 1) % items.length);
      });
    }

    const step = (by) => slide((current + by + items.length) % items.length, by > 0 ? 'next' : 'prev');
    const goTo = (index) => slide(index, index > current ? 'next' : 'prev');

    function stop() {
      clearInterval(timer);
      timer = null;
    }
    // Restarts the countdown, as Bootstrap did after every manual move. Under
    // prefers-reduced-motion the slides only move when asked to.
    function start() {
      stop();
      if (!hovered && !stillMotion) timer = setInterval(() => step(1), interval);
    }

    root.addEventListener('click', (e) => {
      const control = e.target.closest('[data-slide], [data-slide-to]');
      if (!control) return;
      e.preventDefault();
      if (control.dataset.slideTo !== undefined) goTo(parseInt(control.dataset.slideTo, 10));
      else step(control.dataset.slide === 'prev' ? -1 : 1);
      start();
    });

    root.addEventListener('keydown', (e) => {
      if (/^(input|textarea)$/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else return;
      e.preventDefault();
      start();
    });

    if (root.dataset.pause === 'hover') {
      // Mouse only: a tap on a phone also fires enter but never leave, which
      // would stop the carousel for good.
      root.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        hovered = true;
        stop();
      });
      root.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        hovered = false;
        start();
      });
    }

    preload((current + 1) % items.length);
    start();
  }

  // Navbar: <button data-toggle="collapse" data-target="#..."> opens and
  // closes the target with Bootstrap 3's .collapsing height transition.
  function toggleCollapse(button) {
    const panel = document.querySelector(button.dataset.target);
    if (!panel || panel.classList.contains('collapsing')) return;
    const opening = !panel.classList.contains('in');
    button.classList.toggle('collapsed', !opening);
    button.setAttribute('aria-expanded', String(opening));

    if (opening) {
      panel.classList.remove('collapse');
      panel.classList.add('collapsing');
      panel.style.height = '0px';
      panel.style.height = `${panel.scrollHeight}px`;
    } else {
      panel.style.height = `${panel.offsetHeight}px`;
      void panel.offsetHeight;  // start the shrink from the current height
      panel.classList.add('collapsing');
      panel.classList.remove('collapse', 'in');
      panel.style.height = '0px';
    }
    afterTransition(panel, 350, () => {
      panel.classList.remove('collapsing');
      panel.classList.add('collapse');
      panel.classList.toggle('in', opening);
      panel.style.height = '';
    });
  }

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle="collapse"]');
    if (toggle) {
      e.preventDefault();
      toggleCollapse(toggle);
      return;
    }
    // Team page: a click anywhere on a member card opens the profile. Clicks
    // on a real link inside are left to the link, so ctrl/cmd-click still
    // opens a new tab.
    const card = e.target.closest('.member-list-item[data-href]');
    if (card && !e.target.closest('a')) window.location.href = card.dataset.href;
  });

  document.querySelectorAll('[data-ride="carousel"]').forEach(carousel);
})();
