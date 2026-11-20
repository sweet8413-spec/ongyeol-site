/* 온결 · 인터랙션 시안
   원래 디자인은 그대로 두고 움직임만 더합니다.
   Lenis(부드러운 스크롤) + GSAP + ScrollTrigger + CustomEase. main.js 다음에 로드됩니다. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ===================================================================
     롤링 호버 텍스트
     글자가 하나뿐인 텍스트 링크·버튼만 대상으로 함
     (main.js가 글자를 바꾸는 버튼은 제외해야 동작이 깨지지 않음)
     =================================================================== */
  var ROLL_TARGETS = '.float-nav__links a, .float-nav__cta, .hero__btn, .btn, .link-more, .site-footer nav a, .mobile-cta .btn';
  $$(ROLL_TARGETS).forEach(function (el) {
    if (el.children.length || !el.textContent.trim()) return;
    var text = el.textContent.trim();
    el.classList.add('roll-host');
    var roll = document.createElement('span');
    roll.className = 'roll';
    roll.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(text, function (ch, i) {
      var c = document.createElement('span');
      c.className = 'roll__c';
      c.style.setProperty('--i', i);
      var a = document.createElement('span'); a.textContent = ch;
      var b = document.createElement('span'); b.textContent = ch;
      c.appendChild(a); c.appendChild(b);
      roll.appendChild(c);
    });
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(roll);
  });

  if (!hasGsap || reduce) return;   // 동작 줄이기: 호버 롤링(CSS에서 꺼짐) 외에는 아무것도 하지 않음

  gsap.registerPlugin(ScrollTrigger);
  if (window.CustomEase) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('enter', '0,0.79,0.17,1');     // 등장
    CustomEase.create('move', '0.165,0.84,0.44,1');  // 이동·패널
    CustomEase.create('big', '0.5,0,0,1');           // 큰 전환
    CustomEase.create('exit', '1,0,1,1');            // 퇴장
  }
  var E = window.CustomEase
    ? { enter: 'enter', move: 'move', big: 'big', exit: 'exit' }
    : { enter: 'power3.out', move: 'power2.out', big: 'power3.inOut', exit: 'power2.in' };

  /* ===================================================================
     Lenis 부드러운 스크롤 ↔ ScrollTrigger 연동
     =================================================================== */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  var nav = $('.float-nav');
  var navOffset = function () { return nav ? -(nav.getBoundingClientRect().bottom + 16) : -24; };
  var goTo = function (el, immediate) {
    if (lenis) lenis.scrollTo(el, { offset: navOffset(), immediate: !!immediate, duration: 1.2 });
    else window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + navOffset());
  };
  // 페이지 안 앵커(#size, #process)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    var t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    goTo(t);
    history.pushState(null, '', a.getAttribute('href'));
  });
  if (location.hash.length > 1) {
    window.addEventListener('load', function () { var t = $(location.hash); if (t) setTimeout(function () { goTo(t, true); }, 60); });
  }

  /* ===================================================================
     1. 히어로: 첫 화면 인트로 + 스크롤에 따라 배경 확대, 글은 위로 사라짐
     =================================================================== */
  var heroH1 = $('.hero h1');
  if (heroH1) {
    // 제목을 <br> 기준으로 줄 단위 마스크로 감쌈
    heroH1.innerHTML = heroH1.innerHTML.split(/<br\s*\/?>/i).map(function (line) {
      return '<span class="line"><span class="line__in">' + line + '</span></span>';
    }).join('');
    var heroImg = $('.hero picture img') || $('.hero > img');
    gsap.timeline()
      .fromTo(heroImg, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: E.big }, 0)
      .fromTo(nav, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: E.enter }, 0.3)
      .fromTo($$('.line__in', heroH1), { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: E.enter, stagger: 0.1 }, 0.35)
      .fromTo($('.hero__side').children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: E.enter, stagger: 0.08 }, 0.6);

    // 스크롤: 배경 1→1.08 확대(사진 프레임은 그대로), 글은 위로 빠지며 흐려짐
    var heroBox = $('.hero');
    gsap.to(heroImg, { scale: 1.08, ease: 'none', immediateRender: false, scrollTrigger: { trigger: heroBox, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__content', { y: -70, opacity: 0, ease: 'none', scrollTrigger: { trigger: heroBox, start: 'top top', end: 'bottom 15%', scrub: true } });
  }

  /* ===================================================================
     2. 헤더 변신 (데스크톱): 히어로를 지나면 메뉴 링크가 접히고 알약이 좁아짐,
        위로 돌아가거나 마우스를 올리면 다시 펼쳐짐
     =================================================================== */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 721px)', function () {
    var links = $('.float-nav__links');
    var compacted = false, hovering = false;
    var fullWidth = function () { return Math.min(1040, window.innerWidth - 64); };
    // 접힌 폭 = 로고 + 예약 버튼 + 좌우 여백(24+12) + 사이 간격(16×2)
    // offsetWidth는 소수점을 버려 1~2px 모자랄 수 있으므로 실제 폭을 올림해서 계산
    var w = function (s) { return Math.ceil($(s).getBoundingClientRect().width); };
    var compactWidth = function () { return w('.float-nav .logo') + w('.float-nav__cta') + 36 + 32 + 2; };
    function setCompact(on) {
      if (on) {
        gsap.set(links, { overflow: 'hidden', flexWrap: 'nowrap' });
        gsap.to(links, { opacity: 0, duration: 0.3, ease: E.exit, overwrite: 'auto' });
        gsap.to(links, { width: 0, duration: 0.6, ease: E.move, onComplete: function () { links.style.visibility = 'hidden'; } });
        gsap.to(nav, { width: compactWidth(), duration: 0.6, ease: E.move, overwrite: 'auto' });
      } else {
        links.style.visibility = 'visible';
        gsap.to(links, { width: 'auto', duration: 0.6, ease: E.move, onComplete: function () { gsap.set(links, { clearProps: 'width,overflow,flexWrap' }); } });
        gsap.to(nav, { width: fullWidth(), duration: 0.6, ease: E.move, overwrite: 'auto', onComplete: function () { gsap.set(nav, { clearProps: 'width' }); } });
        gsap.to(links, { opacity: 1, duration: 0.6, ease: E.enter, delay: 0.15, overwrite: 'auto' });
      }
    }
    var st = ScrollTrigger.create({
      trigger: '.hero', start: 'bottom top+=120', end: 'max',
      onToggle: function (self) { compacted = self.isActive; if (!hovering) setCompact(compacted); }
    });
    var enter = function () { hovering = true; if (compacted) setCompact(false); };
    var leave = function () { hovering = false; if (compacted) setCompact(true); };
    nav.addEventListener('mouseenter', enter);
    nav.addEventListener('mouseleave', leave);
    return function () {
      st.kill();
      nav.removeEventListener('mouseenter', enter);
      nav.removeEventListener('mouseleave', leave);
      links.style.visibility = '';
      gsap.set([nav, links], { clearProps: 'width,opacity,overflow,flexWrap' });
    };
  });

  /* ===================================================================
     3. 단어별 스크롤 리빌: 큰 제목의 단어가 앞에서부터 하나씩 진해짐
        (레이아웃을 바꾸지 않도록 pin 없이 지나가는 동안 scrub)
     =================================================================== */
  function splitWords(root) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.className = 'wr';
            w.textContent = part;
            frag.appendChild(w);
            out.push(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
    return out;
  }
  $$('.story__title, .promise__body h2').forEach(function (title) {
    var words = splitWords(title);
    gsap.fromTo(words, { opacity: 0.15 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: title, start: 'top 85%', end: 'top 40%', scrub: true }
    });
  });

  /* ===================================================================
     7. 공통 등장: 글·카드는 아래에서 떠오르고(y 40→0),
        사진은 clip-path가 열리며 안쪽 이미지가 1.1→1로 줄어듦, 이후엔 은은한 패럴랙스
     =================================================================== */
  var REVEAL = [
    '.rail__title', '.rail__item', '.section-head > *', '.story__text .copy > *', '.link-more',
    '.look-card', '.look__cta', '.step__head', '.step p', '.promise__body > .eyebrow', '.signature', '.stats > div', '.btn-row',
    '.size-finder h2', '.size-finder .body', '.size-finder .chip-row', '.size-result',
    '.showroom__card > *', '.site-footer .container > *'
  ].join(', ');
  var reveals = $$(REVEAL);
  gsap.set(reveals, { y: 40, opacity: 0 });
  ScrollTrigger.batch(reveals, {
    start: 'top 90%', once: true,
    onEnter: function (batch) { gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: E.enter, stagger: 0.08, overwrite: true }); }
  });

  var MEDIA = [
    { box: '.look__photo', img: '> img' },
    { box: '.story__big', img: '> img' },
    { box: '.story__small', img: '> img' },
    { box: '.step .pmedia', img: '> img' },
    { box: '.promise', img: '> img' },
    { box: '.showroom', img: '> img' }
  ];
  MEDIA.forEach(function (m) {
    $$(m.box).forEach(function (box) {
      var img = box.querySelector(':scope ' + m.img);
      if (!img) return;
      var r = window.getComputedStyle(box).borderTopLeftRadius || '0px';
      // 열리는 효과 (한 번)
      gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 85%', once: true } })
        .fromTo(box, { clipPath: 'inset(10% 10% 10% 10% round ' + r + ')' }, { clipPath: 'inset(0% 0% 0% 0% round ' + r + ')', duration: 0.8, ease: E.big }, 0)
        .fromTo(img, { scale: 1.25 }, { scale: 1.12, duration: 1.2, ease: E.big }, 0);
      // 지나가는 동안 사진이 프레임 안에서 천천히 움직임
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ===================================================================
     컬렉션 레일: 마우스로 끌어서 넘기기 (놓으면 관성으로 조금 더 미끄러짐)
     =================================================================== */
  var track = $('#soban-row');
  if (track) {
    track.classList.add('is-draggable');
    var drag = null, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;   // 터치는 기본 가로 스와이프 사용
      drag = { x: e.clientX, left: track.scrollLeft, lastX: e.clientX, v: 0 };
      moved = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4 && !moved) { moved = true; track.classList.add('is-dragging'); }
      drag.v = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return;
      var v = drag.v;
      drag = null;
      track.classList.remove('is-dragging');
      if (moved) gsap.to(track, { scrollLeft: track.scrollLeft - v * 12, duration: 0.6, ease: E.move });
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* ===================================================================
     Shop the look: 선택된 점에서 고리가 은은하게 퍼짐
     =================================================================== */
  $$('.hotspot').forEach(function (h) {
    var ring = document.createElement('i');
    ring.className = 'ring';
    ring.setAttribute('aria-hidden', 'true');
    h.appendChild(ring);
  });
  var ringTween = null;
  function pulseActive() {
    if (ringTween) ringTween.kill();
    $$('.hotspot .ring').forEach(function (r) { gsap.set(r, { opacity: 0 }); });
    var active = $('.hotspot[aria-pressed="true"] .ring');
    if (!active) return;
    ringTween = gsap.fromTo(active, { scale: 0.8, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 1.6, ease: E.move, repeat: -1, repeatDelay: 0.3 });
  }
  $$('[data-look-pick]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(pulseActive, 0); }); });
  pulseActive();

  /* ===================================================================
     값이 바뀔 때 숫자가 아래에서 굴러 올라옴
     (크기로 찾기 가격·인원, 쇼룸 방문 날짜, look 카드 이름)
     =================================================================== */
  var ROLLING_VALUES = $$('[data-size-len], [data-size-seats], [data-size-oak], [data-size-walnut], [data-visit-label], [data-look-name]');
  ROLLING_VALUES.forEach(function (el) {
    el.classList.add('num-roll');
    var last = el.textContent;
    new MutationObserver(function () {
      if (el.textContent === last) return;
      last = el.textContent;
      gsap.fromTo(el, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: E.enter, overwrite: true });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ===================================================================
     장인의 약속 숫자: 화면에 들어오면 0부터 세어 올라감 (30년, 100%)
     =================================================================== */
  $$('.stats b').forEach(function (b) {
    var m = b.textContent.match(/^(\d+)(.*)$/);
    if (!m || m[1] === '0' || /\d/.test(m[2])) return;   // "4~6주"처럼 범위인 값은 그대로 둠
    var target = Number(m[1]), suffix = m[2], obj = { v: 0 };
    ScrollTrigger.create({
      trigger: b, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(obj, { v: target, duration: 1.4, ease: E.move, onUpdate: function () { b.textContent = Math.round(obj.v) + suffix; } });
      }
    });
  });

  // 웹폰트·이미지 로드 후 위치 재계산
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
