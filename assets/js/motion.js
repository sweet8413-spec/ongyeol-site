/* 온결 motion layer
   GSAP + ScrollSmoother (smooth scroll) + ScrollTrigger (parallax, reveals).
   Loaded after main.js. If GSAP fails to load, or the visitor asks for reduced
   motion, nothing here runs and the site works as a normal static page. */
(function () {
  'use strict';

  var g = window.gsap;
  if (!g || !window.ScrollTrigger || !window.ScrollSmoother) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  g.registerPlugin(ScrollTrigger, ScrollSmoother);

  var all = function (sel) { return g.utils.toArray(sel); };
  var one = function (sel) { return document.querySelector(sel); };
  var isMobile = function () { return window.innerWidth < 721; };

  /* ---------------------------------------------------------------
     1. Smooth scroll
     --------------------------------------------------------------- */
  var smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.1,          // seconds to catch up with the native scroll position
    smoothTouch: 0.1,     // light smoothing on touch devices
    effects: true         // enables speed / lag parallax layers
  });

  /* In-page anchors (#size, #process) go through the smoother, below the fixed nav */
  var nav = one('.float-nav');
  var navOffset = function () { return nav ? Math.round(nav.getBoundingClientRect().bottom) + 16 : 24; };
  var goTo = function (target, smooth) { smoother.scrollTo(target, smooth, 'top ' + navOffset() + 'px'); };
  var findHash = function (hash) {
    if (!hash || hash === '#') return null;
    try { return document.querySelector(hash); } catch (e) { return null; }
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || a.pathname !== location.pathname) return;
    var target = findHash(a.hash);
    if (!target) return;
    e.preventDefault();
    goTo(target, true);
    history.pushState(null, '', a.hash);
  });

  /* Arriving from another page with a hash, e.g. index.html#size */
  var initialTarget = findHash(location.hash);
  if (initialTarget) {
    window.addEventListener('load', function () { setTimeout(function () { goTo(initialTarget, false); }, 60); });
  }

  /* ---------------------------------------------------------------
     2. Parallax images: the image is scaled up inside its clipping
        frame and drifts against the scroll direction.
     --------------------------------------------------------------- */
  var parallax = function (img, amount, trigger) {
    g.set(img, { scale: 1 + (amount * 2 + 4) / 100, transformOrigin: '50% 50%' });
    return g.fromTo(img, { yPercent: -amount }, {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: { trigger: trigger || img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  };

  var depth = isMobile() ? 5 : 9;
  all('.look__photo > img, .pmedia > img, .promise > img, .showroom > img').forEach(function (img) {
    parallax(img, depth);
  });

  /* Product cards are re-rendered by the collection filters, so keep their tweens separate */
  var cardTweens = [];
  var parallaxCards = function () {
    cardTweens.forEach(function (t) { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    cardTweens = all('.product-card__media img').map(function (img) { return parallax(img, 5); });
  };
  parallaxCards();

  /* ---------------------------------------------------------------
     3. Hero: slow zoom-in on load, then the photo sinks while the
        copy lifts away as you scroll.
     --------------------------------------------------------------- */
  var hero = one('.hero');
  if (hero) {
    var heroImg = hero.querySelector('img');
    var heroScrub = function () { return { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }; };

    g.set(heroImg, { scale: 1.28, transformOrigin: '50% 50%' });
    g.to(heroImg, { yPercent: 12, ease: 'none', scrollTrigger: heroScrub() });
    g.to('.hero__content', { y: -90, autoAlpha: 0.1, ease: 'none', scrollTrigger: heroScrub() });

    var intro = g.timeline({ defaults: { ease: 'power3.out' } });
    intro.from(heroImg, { scale: 1.45, duration: 1.8, ease: 'power2.out' }, 0);
    if (nav) intro.from(nav, { y: -24, autoAlpha: 0, duration: 0.8 }, 0.2);
    intro
      .from('.hero h1', { y: 48, autoAlpha: 0, duration: 1.1 }, 0.35)
      .from('.hero__side > *', { y: 32, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0.6);
  }

  /* ---------------------------------------------------------------
     4. Rounded photo panels open up from a slightly inset clip
     --------------------------------------------------------------- */
  all('.look__photo, .promise, .showroom').forEach(function (el) {
    var r = window.getComputedStyle(el).borderTopLeftRadius || '0px';
    g.fromTo(el,
      { clipPath: 'inset(7% 5% 7% 5% round ' + r + ')' },
      { clipPath: 'inset(0% 0% 0% 0% round ' + r + ')', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 40%', scrub: true } });
  });

  /* ---------------------------------------------------------------
     5. Depth layers (desktop): elements move at different speeds
        relative to the scroll, so text and photos separate.
        speed < 1 = slower than the page, > 1 = faster; lag = trails behind.
     --------------------------------------------------------------- */
  var mm = g.matchMedia();
  mm.add('(min-width: 721px)', function () {
    smoother.effects('.rail__side', { speed: 0.85 });
    smoother.effects('.section-head .eyebrow', { speed: 1.15 });
    smoother.effects('.story__big', { speed: 0.92 });
    smoother.effects('.story__text', { speed: 1.06 });
    smoother.effects('.step', { lag: function (i) { return 0.06 + i * 0.08; } });
    smoother.effects('.promise__body', { lag: 0.12 });
    smoother.effects('.showroom__card', { lag: 0.2 });
    smoother.effects('.pdp__info', { lag: 0.08 });
    smoother.effects('.summary', { lag: 0.1 });
  });

  /* ---------------------------------------------------------------
     6. Scroll reveals: fade-up in small batches as they enter.
        (Never on an element that also has a speed/lag layer above.)
     --------------------------------------------------------------- */
  var reveal = function (sel, opts) {
    var els = all(sel);
    if (!els.length) return;
    opts = opts || {};
    g.set(els, { autoAlpha: 0, y: opts.y || 40 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        g.to(batch, { autoAlpha: 1, y: 0, duration: opts.duration || 1, ease: 'power3.out', stagger: opts.stagger || 0.1, overwrite: true });
      }
    });
  };

  // headings
  reveal('.rail__title, .section-head > h2, .story__title, .size-finder h2, .size-finder .body, ' +
         '.collection > .section-head, .breadcrumb, .h2, .cta-band, .spec-table');
  // main page groups
  reveal('.rail__item', { stagger: 0.08 });
  reveal('.look-card, .look__cta', { y: 24 });
  reveal('.story__text .copy > *, .link-more', { y: 28 });
  reveal('.step > *', { y: 30, stagger: 0.07 });
  reveal('.promise__body > *', { y: 28, stagger: 0.08 });
  reveal('.size-finder .chip-row, .size-result', { y: 28 });
  reveal('.showroom__card > *', { y: 24, stagger: 0.06 });
  // collection / product / booking
  reveal('.filters', { y: 24 });
  reveal('.product-card', { y: 48, stagger: 0.06 });
  reveal('.gallery', { y: 32 });
  reveal('.pdp__info > *', { y: 28, stagger: 0.08 });
  reveal('.detail-grid figure', { stagger: 0.12 });
  reveal('.booking__form > *', { y: 32, stagger: 0.08 });
  reveal('.summary > *', { y: 24, stagger: 0.06 });
  // everywhere
  reveal('.site-footer .container > *', { y: 20 });

  /* ---------------------------------------------------------------
     7. Hooks used by main.js when the page height changes
     --------------------------------------------------------------- */
  window.OngyeolMotion = {
    smoother: smoother,
    refresh: function () { ScrollTrigger.refresh(); },
    scrollTop: function () { smoother.scrollTo(0, false); },
    enter: function (els) {
      g.fromTo(els, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true });
    },
    cardsIn: function (cards) {
      parallaxCards();
      g.fromTo(cards, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, overwrite: true });
      ScrollTrigger.refresh();
    }
  };
})();
