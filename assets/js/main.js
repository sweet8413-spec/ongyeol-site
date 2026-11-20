/* 온결 site behaviour. No dependencies. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var params = new URLSearchParams(location.search);
  /* GSAP layer (assets/js/motion.js) loads after this file; look it up lazily. */
  var motion = function () { return window.OngyeolMotion || null; };

  /* Pricing shared by main page size finder and product page */
  var PRICE = { oak: 3000000, walnut: 3400000, perTenCm: 100000 };
  var priceFor = function (wood, len) { return PRICE[wood] + ((len - 160) / 10) * PRICE.perTenCm; };

  /* Set aria-pressed on one button in a group */
  function press(buttons, active) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === active ? 'true' : 'false'); });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('[data-menu-toggle]');
  if (menuBtn) {
    var menuNav = menuBtn.closest('.float-nav');
    var setMenu = function (open) {
      menuNav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };
    menuBtn.addEventListener('click', function () { setMenu(!menuNav.classList.contains('is-open')); });
    $$('a', menuNav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Main: collection rail ---------- */
  var row = $('#soban-row');
  if (row) {
    var bar = $('[data-rail-bar]');
    var sync = function () {
      var max = row.scrollWidth - row.clientWidth;
      var p = max > 0 ? row.scrollLeft / max : 0;
      bar.style.left = (p * 70).toFixed(1) + '%';
    };
    row.addEventListener('scroll', sync, { passive: true });
    $$('[data-rail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        row.scrollBy({ left: Number(btn.dataset.rail) * 320, behavior: 'smooth' });
      });
    });
    sync();
  }

  /* ---------- Main: shop the look ---------- */
  var look = $('[data-look]');
  if (look) {
    var nameEl = $('[data-look-name]', look);
    var cards = $$('.look-card', look);
    $$('[data-look-pick]', look).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = btn.dataset.lookPick;
        $$('[data-look-pick]', look).forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.lookPick === i ? 'true' : 'false');
        });
        nameEl.textContent = cards[Number(i)].dataset.name;
      });
    });
  }

  /* ---------- Main: size finder ---------- */
  var finder = $('[data-size-finder]');
  if (finder) {
    var chips = $$('[data-len]', finder);
    var setLen = function (len) {
      $('[data-size-len]', finder).textContent = len;
      $('[data-size-seats]', finder).textContent = len >= 180 ? '6인' : '4인';
      $('[data-size-oak]', finder).textContent = won(priceFor('oak', len));
      $('[data-size-walnut]', finder).textContent = won(priceFor('walnut', len));
      $('[data-size-link]', finder).href = 'product.html?len=' + len;
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () { press(chips, c); setLen(Number(c.dataset.len)); });
    });
  }

  /* ---------- Main: showroom days ---------- */
  var visit = $('[data-visit]');
  if (visit) {
    var days = $$('[data-day]', visit);
    days.forEach(function (d) {
      d.addEventListener('click', function () {
        press(days, d);
        $('[data-visit-label]', visit).textContent = d.dataset.day + '(' + d.dataset.dow + ')';
        $('[data-visit-link]', visit).href = 'booking.html?date=' + encodeURIComponent(d.dataset.day);
      });
    });
  }

  /* ---------- Collection ---------- */
  var grid = $('[data-grid]');
  if (grid) {
    var IMG = 'assets/img/';
    var PRODUCTS = [
      { name: '소반 다이닝 테이블 4인', img: 'soban-dining-4.jpg', pos: '55% 50%', cat: 'dining', min: 1600, max: 1700, price: 3000000, spec: 'W 1600~1700 · 월넛 · 오크', custom: true, href: 'product.html' },
      { name: '소반 다이닝 테이블 6인', img: 'soban-dining-6.jpg', pos: '50% 50%', cat: 'dining', min: 1800, max: 1900, price: 3200000, spec: 'W 1800~1900 · 월넛 · 오크', custom: true, href: 'product.html?len=180' },
      { name: '소반 원형 테이블', img: 'soban-round-table.jpg', pos: '50% 50%', cat: 'dining', min: 0, max: 0, price: 4000000, spec: '지름 [치수] · 월넛 · 오크', custom: false, href: '#' },
      { name: '소반 체어', img: 'soban-chair.jpg', pos: '20% 50%', cat: 'chair', price: 800000, spec: '월넛 · 오크', custom: false, href: '#' },
      { name: '소반 암체어', img: 'soban-armchair.jpg', pos: '24% 50%', cat: 'chair', price: 1200000, spec: '월넛 · 오크', custom: false, href: '#' },
      { name: '소반 벤치', img: 'soban-bench.jpg', pos: '52% 50%', cat: 'chair', price: 900000, spec: 'W [치수] · 월넛 · 오크', custom: false, href: '#' },
      { name: '소반 3인 소파', img: 'soban-sofa-3.jpg', pos: '65% 50%', cat: 'sofa', price: 6000000, spec: 'W [치수] · 월넛 프레임', custom: true, href: '#' },
      { name: '소반 모듈 소파', img: 'soban-module-sofa.jpg', pos: '25% 50%', cat: 'sofa', price: 8000000, spec: '모듈 조합 · 월넛 프레임', custom: true, href: '#' },
      { name: '소반 커피 테이블', img: 'soban-coffee-table.jpg', pos: '55% 50%', cat: 'living', price: 2000000, spec: 'W [치수] · 월넛 · 오크', custom: false, href: '#' },
      { name: '소반 사이드 테이블', img: 'soban-side-table.jpg', pos: '56% 50%', cat: 'living', price: 1200000, spec: '월넛 · 오크', custom: false, href: '#' },
      { name: '반닫이 사이드보드', img: 'bandaji-sideboard.jpg', pos: '40% 50%', cat: 'storage', price: 3500000, spec: 'W [치수] · 월넛 · 오크', custom: false, href: '#' },
      { name: '반닫이 선반장', img: 'bandaji-shelf.jpg', pos: '63% 50%', cat: 'storage', price: 4500000, spec: 'W [치수] · 월넛 · 오크', custom: false, href: '#' }
    ];
    var state = { cat: params.get('cat') || 'all', len: 0, sort: 'rec' };
    var catBtns = $$('[data-cat]');
    var lenBtns = $$('[data-lens] [data-len]');
    var lensRow = $('[data-lens]');
    var sortSel = $('#sort');

    var el = function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };

    var card = function (p) {
      var a = el('a', 'product-card'); a.href = p.href;
      var media = el('div', 'product-card__media');
      var img = el('img'); img.src = IMG + p.img; img.alt = p.name; img.loading = 'lazy'; img.style.objectPosition = p.pos;
      media.appendChild(img);
      if (p.custom) media.appendChild(el('span', 'product-card__badge', '길이 맞춤'));
      var body = el('div', 'product-card__body');
      body.appendChild(el('p', 'product-card__name', p.name));
      body.appendChild(el('p', 'product-card__spec', p.spec));
      body.appendChild(el('p', 'product-card__price', won(p.price) + '부터'));
      a.appendChild(media); a.appendChild(body);
      return a;
    };

    var render = function () {
      catBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === state.cat ? 'true' : 'false'); });
      lenBtns.forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.len) === state.len ? 'true' : 'false'); });
      lensRow.hidden = state.cat !== 'dining';

      var items = PRODUCTS.filter(function (p) { return state.cat === 'all' || p.cat === state.cat; });
      if (state.cat === 'dining' && state.len) items = items.filter(function (p) { return p.min <= state.len && state.len <= p.max; });
      if (state.sort === 'low') items = items.slice().sort(function (a, b) { return a.price - b.price; });
      if (state.sort === 'high') items = items.slice().sort(function (a, b) { return b.price - a.price; });

      var cards = items.map(card);
      grid.replaceChildren.apply(grid, cards);
      $('[data-count]').textContent = items.length;
      /* After the first render, motion.js re-attaches parallax and fades the new cards in */
      if (motion()) motion().cardsIn(cards);
    };

    catBtns.forEach(function (b) { b.addEventListener('click', function () { state.cat = b.dataset.cat; state.len = 0; render(); }); });
    lenBtns.forEach(function (b) { b.addEventListener('click', function () { state.len = Number(b.dataset.len); render(); }); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });
    render();
  }

  /* ---------- Product ---------- */
  var config = $('[data-configurator]');
  if (config) {
    var woodBtns = $$('[data-wood]', config);
    var lenSel = $('#len');
    var pState = { wood: 'walnut', len: 160 };
    var qLen = Number(params.get('len'));
    if ([160, 170, 180, 190].indexOf(qLen) !== -1) { pState.len = qLen; lenSel.value = String(qLen); }

    var update = function () {
      woodBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.wood === pState.wood ? 'true' : 'false'); });
      $('[data-price]', config).textContent = won(priceFor(pState.wood, pState.len));
    };
    woodBtns.forEach(function (b) { b.addEventListener('click', function () { pState.wood = b.dataset.wood; update(); }); });
    lenSel.addEventListener('change', function () { pState.len = Number(lenSel.value); update(); });
    update();

    var main = $('[data-gallery-main]');
    var original = { src: main.src, alt: main.alt };
    var thumbs = $$('[data-gallery] [data-src]');
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        var on = t.getAttribute('aria-pressed') !== 'true';
        press(thumbs, on ? t : null);
        main.src = on ? t.dataset.src : original.src;
        main.alt = on ? $('img', t).alt : original.alt;
      });
    });
  }

  /* ---------- Booking ---------- */
  var form = $('[data-booking]');
  if (form) {
    var FULL = { '7/17': ['13:00', '15:00'], '7/14': ['11:00'] };
    var DOW = {};
    var b = { date: '', time: '' };
    var dateBtns = $$('[data-date]', form);
    var timeBtns = $$('[data-time]', form);
    var checks = $$('[data-interests] input', form);
    var nameIn = $('#name'), phoneIn = $('#phone'), agreeIn = $('#agree');
    var submitBtn = $('[data-submit]', form);
    var done = $('[data-done]');

    dateBtns.forEach(function (d) { DOW[d.dataset.date] = $('small', d).textContent; });

    var refresh = function () {
      dateBtns.forEach(function (d) { d.setAttribute('aria-pressed', d.dataset.date === b.date ? 'true' : 'false'); });
      var blocked = FULL[b.date] || [];
      timeBtns.forEach(function (t) {
        var full = blocked.indexOf(t.dataset.time) !== -1;
        t.disabled = full;
        t.textContent = full ? t.dataset.time + ' 마감' : t.dataset.time;
        t.setAttribute('aria-pressed', t.dataset.time === b.time ? 'true' : 'false');
      });

      var chosen = checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var when = b.date && b.time ? '2027년 ' + b.date + ' ' + b.time : '아직 고르지 않았어요';
      var items = chosen.length ? chosen.join(', ') : '선택 안 함';
      $$('[data-sum-when]').forEach(function (n) { n.textContent = when; });
      $$('[data-sum-items]').forEach(function (n) { n.textContent = items; });

      var name = nameIn.value.trim(), phone = phoneIn.value.trim();
      var ready = !!(b.date && b.time && name && phone && agreeIn.checked);
      var hint = '예약 확정은 24시간 안에 카카오 알림톡으로 안내해 드려요.';
      if (!b.date || !b.time) hint = '방문 날짜와 시간을 먼저 골라 주세요.';
      else if (!name || !phone) hint = '이름과 휴대폰 번호를 입력해 주세요.';
      else if (!agreeIn.checked) hint = '개인정보 수집·이용에 동의해 주세요.';
      submitBtn.disabled = !ready;
      $('[data-hint]', form).textContent = hint;
      return ready;
    };

    dateBtns.forEach(function (d) { d.addEventListener('click', function () { b.date = d.dataset.date; b.time = ''; refresh(); }); });
    timeBtns.forEach(function (t) { t.addEventListener('click', function () { b.time = t.dataset.time; refresh(); }); });
    [nameIn, phoneIn].forEach(function (i) { i.addEventListener('input', refresh); });
    checks.concat([agreeIn]).forEach(function (c) { c.addEventListener('change', refresh); });

    /* File upload label + drag and drop */
    var fileIn = $('#plan'), zone = $('[data-dropzone]'), zoneLabel = $('[data-dropzone-label]');
    var showFile = function () {
      zoneLabel.textContent = fileIn.files.length ? fileIn.files[0].name : '파일을 끌어오거나 눌러서 올리기';
    };
    fileIn.addEventListener('change', showFile);
    ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('is-over'); }); });
    zone.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) { fileIn.files = e.dataTransfer.files; showFile(); } });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!refresh()) return;
      form.hidden = true;
      done.hidden = false;
      if (motion()) { motion().refresh(); motion().scrollTop(); motion().enter(done.children); }
      else window.scrollTo(0, 0);
    });
    $('[data-reset]').addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      if (motion()) { motion().refresh(); motion().scrollTop(); }
      else window.scrollTo(0, 0);
    });

    var qDate = params.get('date');
    if (qDate && DOW[qDate]) b.date = qDate;
    refresh();
  }
})();
