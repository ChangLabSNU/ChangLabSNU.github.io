/*
 * The site's script: the home page photo carousel, and the email buttons on
 * the team and member pages. It replaced jQuery 1.11 and Bootstrap 3's JS and drives the
 * Bootstrap 3 carousel classes they did.
 * (The home page's pixel scene is js/ribosome.js.)
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
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = Math.max(0, [...items].findIndex((item) => item.classList.contains('active')));
    let sliding = false;
    let hovered = false;
    let focused = false;
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
      if (!hovered && !focused && !still.matches) timer = setInterval(() => step(1), interval);
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
      // The arrows are links with role="button", and a button answers Space
      // as well as the Enter a link already does.
      if (e.key === ' ' && e.target.matches('[data-slide]')) {
        e.preventDefault();
        e.target.click();
        return;
      }
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else return;
      e.preventDefault();
      start();
    });

    // Keyboard focus anywhere in the carousel holds it still, as the mouse
    // does, so a keyboard user can stop it (WCAG 2.2.2). Only focus the
    // browser shows counts: a mouse click on an arrow focuses it too, and
    // should not stop the carousel once the mouse moves away.
    root.addEventListener('focusin', (e) => {
      if (!e.target.matches(':focus-visible')) return;
      focused = true;
      stop();
    });
    root.addEventListener('focusout', (e) => {
      if (root.contains(e.relatedTarget)) return;
      focused = false;
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
    still.addEventListener('change', start);
  }

  document.querySelectorAll('[data-ride="carousel"]').forEach(carousel);

  // An email button holds the address as text with a hidden word inside it
  // (_includes/email_chip.html), which address harvesters reading the HTML
  // pick up as is. Here it becomes a mailto link like the buttons beside it.
  document.querySelectorAll('span.email-chip').forEach((chip) => {
    const copy = chip.cloneNode(true);
    copy.querySelectorAll('.qb-hidden').forEach((el) => el.remove());
    const link = document.createElement('a');
    link.className = chip.className;
    link.href = 'mailto:' + copy.textContent.trim();
    link.append(...chip.childNodes);
    chip.replaceWith(link);
  });
})();
