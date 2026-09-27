(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = performance.now();

  /* ---------- Intro ---------- */
  var intro = document.getElementById('intro');
  var INTRO_TOTAL = 5200;

  function rememberIntro() {
    try { sessionStorage.setItem('alkhair-intro', '1'); } catch (e) {}
  }

  function removeIntro() {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    intro = null;
  }

  if (intro) {
    if (root.classList.contains('no-intro')) {
      removeIntro();
    } else {
      rememberIntro();
      var introTimer = setTimeout(removeIntro, INTRO_TOTAL);

      var skipIntro = function () {
        if (!intro || root.classList.contains('intro-skip')) return;
        var elapsed = (performance.now() - t0) / 1000;
        if (elapsed > 3.9) return; // already leaving
        clearTimeout(introTimer);
        root.style.setProperty('--intro', (elapsed + 0.45).toFixed(2) + 's');
        root.classList.add('intro-skip');
        setTimeout(removeIntro, 950);
      };

      intro.addEventListener('click', skipIntro);
      window.addEventListener('keydown', skipIntro, { once: true });
      window.addEventListener('wheel', skipIntro, { once: true, passive: true });
      window.addEventListener('touchmove', skipIntro, { once: true, passive: true });
    }
  }

  /* ---------- WhatsApp links with a pre-filled message ---------- */
  document.querySelectorAll('a[data-wa]').forEach(function (a) {
    a.href = a.href.split('?')[0] + '?text=' + encodeURIComponent(a.getAttribute('data-wa'));
  });

  /* ---------- Header ---------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('menuToggle');
  var menu = document.getElementById('menu');
  var fab = document.getElementById('fab');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    if (fab) fab.classList.toggle('is-visible', y > 420);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // the footer has its own contact buttons, so the floating one steps aside there
  var footer = document.querySelector('.footer');
  if (fab && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      fab.classList.toggle('is-parked', entries[0].isIntersecting);
    }, { rootMargin: '0px 0px -80px 0px' }).observe(footer);
  }

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  }
  toggle.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        revealIO.unobserve(el);
        setTimeout(function () { el.classList.add('is-done'); }, 1500);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in', 'is-done'); });
  }

  /* ---------- Active section in the menu ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Pointer effects (desktop only) ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduceMotion) {
    // soft light following the cursor on cards
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // gentle parallax on the hero chips
    var hero = document.getElementById('top');
    var chips = document.querySelectorAll('.chip[data-depth]');
    var raf = 0, px = 0, py = 0;

    if (hero && chips.length) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width - 0.5;
        py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          chips.forEach(function (chip) {
            var d = Number(chip.getAttribute('data-depth')) || 0;
            chip.style.setProperty('--px', (px * d).toFixed(1) + 'px');
            chip.style.setProperty('--py', (py * d).toFixed(1) + 'px');
          });
        });
      });
    }
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
