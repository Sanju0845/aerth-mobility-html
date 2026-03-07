(function () {
  'use strict';

  /* =====================================================
     Aerth Mobility – Premium Interactions & Scroll Reveal
     ===================================================== */

  // ─── Premium Toast Notification ──────────────────────
  // Usage: evxToast('Message', 'success' | 'error' | 'info', durationMs?)
  window.evxToast = (function () {
    var DURATION = 6000; // default 6 s
    var activeTimer = null;
    var rafId = null;
    var container = null;
    var RING_R = 15, RING_C = 2 * Math.PI * RING_R; // SVG ring

    function ensureContainer() {
      if (container && document.body.contains(container)) return container;
      container = document.createElement('div');
      container.className = 'evx-toast-wrap';
      document.body.appendChild(container);
      return container;
    }

    function icons(type) {
      if (type === 'success') return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      if (type === 'error')   return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    function ringSvg() {
      return '<svg class="evx-toast-ring" viewBox="0 0 36 36" width="36" height="36">' +
        '<circle cx="18" cy="18" r="' + RING_R + '" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2.5"/>' +
        '<circle class="evx-toast-ring-fg" cx="18" cy="18" r="' + RING_R + '" fill="none" stroke="#fff" stroke-width="2.5" ' +
        'stroke-dasharray="' + RING_C + '" stroke-dashoffset="0" stroke-linecap="round" ' +
        'transform="rotate(-90 18 18)"/>' +
        '</svg>';
    }

    return function evxToast(msg, type, duration) {
      type = type || 'info';
      duration = duration || DURATION;
      var wrap = ensureContainer();

      // Remove previous toast
      var prev = wrap.querySelector('.evx-toast');
      if (prev) { wrap.removeChild(prev); clearTimeout(activeTimer); cancelAnimationFrame(rafId); }

      var el = document.createElement('div');
      el.className = 'evx-toast evx-toast--' + type;
      el.innerHTML =
        '<span class="evx-toast-icon">' + icons(type) + '</span>' +
        '<span class="evx-toast-body">' +
          '<span class="evx-toast-msg">' + msg + '</span>' +
          '<span class="evx-toast-sub">Auto-closing in <strong class="evx-toast-sec"></strong></span>' +
        '</span>' +
        '<span class="evx-toast-countdown">' + ringSvg() + '<span class="evx-toast-sec-num"></span></span>' +
        '<button class="evx-toast-close" aria-label="Close">&times;</button>' +
        '<span class="evx-toast-bar"></span>';

      wrap.appendChild(el);
      el.offsetHeight; // reflow
      el.classList.add('evx-toast--in');

      var bar     = el.querySelector('.evx-toast-bar');
      var secText = el.querySelector('.evx-toast-sec');
      var secNum  = el.querySelector('.evx-toast-sec-num');
      var ringFg  = el.querySelector('.evx-toast-ring-fg');
      var start   = performance.now();

      function tick(now) {
        var elapsed   = now - start;
        var remaining = Math.max(0, duration - elapsed);
        var pct       = remaining / duration;
        var secs      = Math.ceil(remaining / 1000);

        bar.style.width = (pct * 100) + '%';
        secText.textContent = secs + 's';
        secNum.textContent  = secs;
        ringFg.setAttribute('stroke-dashoffset', ((1 - pct) * RING_C).toFixed(2));

        if (remaining > 0) rafId = requestAnimationFrame(tick);
        else dismiss();
      }
      rafId = requestAnimationFrame(tick);

      function dismiss() {
        clearTimeout(activeTimer);
        cancelAnimationFrame(rafId);
        el.classList.remove('evx-toast--in');
        el.classList.add('evx-toast--out');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
      }

      el.querySelector('.evx-toast-close').addEventListener('click', dismiss);
      activeTimer = setTimeout(dismiss, duration + 200);
    };
  })();

  // ─── Active Nav Link ─────────────────────────────────
  (function () {
    var currentPage = location.pathname.split('/').pop() || 'index.html';
    var navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  })();

  // ─── Google Reviews Carousel – load from ReviewForDisplayData.json ────────────
  (function () {
    var track = document.getElementById('reviews-track');
    if (!track) return;

    // Map word ratings to numbers
    var RATING_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

    function parseRating(str) {
      return RATING_MAP[String(str).toUpperCase()] || 5;
    }

    function buildStars(num) {
      var stars = '';
      for (var i = 0; i < 5; i++) stars += i < num ? '\u2605' : '\u2606';
      return stars;
    }

    function escapeHTML(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str || ''));
      return div.innerHTML;
    }

    // Strip "(Translated by Google)…\n\n(Original)\n" wrapper if present
    function cleanComment(text) {
      if (!text) return '';
      var orig = text.indexOf('(Original)\n');
      if (orig !== -1) return text.substring(orig + 11).trim();
      return text.trim();
    }

    // "13 Jan, 2026 - 11:22:19" → "13 Jan, 2026"
    function shortDate(when) {
      if (!when) return '';
      return when.split(' - ')[0].trim();
    }

    // Location-to-MapsUri lookup (populated from locations.json)
    var locationMapsMap = {};

    function buildLocationMap(locations) {
      locations.forEach(function (loc) {
        var area = (loc.address && loc.address.area) ? loc.address.area.trim().toLowerCase() : '';
        area = area.replace("Vayu Motors".toLocaleLowerCase(),"Serilingampally".toLocaleLowerCase());
        var uri = loc.MapsUri || '';
        if (!uri) return;
        // Index by area name
        if (area) locationMapsMap[area] = uri;
        // Also index by code suffix and location name keywords
        if (loc.code) locationMapsMap[loc.code.toLowerCase()] = uri;
      });
    }

    // Match a review location string to a MapsUri
    function findMapsUri(reviewLoc) {

      reviewLoc = reviewLoc.replace("Vayu Motors".toLocaleLowerCase(),"Serilingampally".toLocaleLowerCase()); 
      reviewLoc = reviewLoc.replace("Vayu Motors","Serilingampally"); 
      
      if (!reviewLoc) return '';
      var lower = reviewLoc.toLowerCase();
      var keys = Object.keys(locationMapsMap);
      for (var i = 0; i < keys.length; i++) {
        if (lower.indexOf(keys[i]) !== -1 || keys[i].indexOf(lower.replace(/\s/g, '')) !== -1) {
          return locationMapsMap[keys[i]];
        }
      }
      // Fuzzy: extract parenthetical and try partial match
      var m = reviewLoc.match(/\(([^)]+)\)/);
      if (m) {
        var paren = m[1].toLowerCase().replace(/\s/g, '');
        for (var j = 0; j < keys.length; j++) {
          var keyClean = keys[j].replace(/\s/g, '');
          if (paren.indexOf(keyClean) !== -1 || keyClean.indexOf(paren) !== -1) {
            return locationMapsMap[keys[j]];
          }
        }
      }
      return '';
    }

    function initReviewsCarousel(raw) {
      // Normalize data from ReviewForDisplayData.json
      var reviews = raw.map(function (r) {
        return {
          name: r.name || 'Anonymous',
          img: r.imageurl || '',
          rating: parseRating(r.rating),
          text: cleanComment(r.comment),
          time: shortDate(r.when),
          when: r.when || '',
          location: r.location || ''
        };
      });

      // Sort by date descending (newest first)
      reviews.sort(function (a, b) {
        var da = new Date(a.when.replace(' - ', ' '));
        var db = new Date(b.when.replace(' - ', ' '));
        return db - da;
      });

      // Compute & display average and count
      var sum = 0;
      reviews.forEach(function (r) { sum += r.rating; });
      var avg = (sum / reviews.length).toFixed(1);
      var avgEl = document.getElementById('reviews-avg');
      var countEl = document.getElementById('reviews-count');
      if (avgEl) avgEl.textContent = avg;
      if (countEl) countEl.textContent = reviews.length + ' reviews';

      // Truncate text to N words, return { short, full, truncated }
      function truncWords(str, max) {
        var words = str.split(/\s+/).filter(Boolean);
        if (words.length <= max) return { short: str, full: str, truncated: false };
        return { short: words.slice(0, max).join(' ') + '...', full: str, truncated: true };
      }

      // Extract short area name from location string, e.g. "Aerth Mobility (KPHB) - …" → "KPHB"
      function shortLocation(loc) {
        if (!loc) return '';
        var m = loc.match(/\(([^)]+)\)/);
        var retLoc = m ? m[1] : loc.split(' - ')[0].replace(/Aerth Mobility\s*/i, '').trim();
        return retLoc.replace("Vayu Motors","Serilingampally");
      }

      // Build review cards
      var html = '';
      reviews.forEach(function (r) {
        var t = truncWords(r.text, 15);
        var imgTag = r.img
          ? '<img src="' + escapeHTML(r.img) + '" alt="' + escapeHTML(r.name) + '" class="g-review-avatar" loading="lazy" referrerpolicy="no-referrer">'
          : '<span class="g-review-avatar g-review-avatar--fallback">' + escapeHTML(r.name.charAt(0)) + '</span>';
        var locName = shortLocation(r.location);
        var locUri  = findMapsUri(r.location);
        var locIcon = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
        var locTag = ''; 
        if (locName && locUri) {
          locTag = '<a href="' + escapeHTML(locUri) + '" target="_blank" rel="noopener" class="g-review-location">' + locIcon + escapeHTML(locName) + '</a>';
        } else if (locName) {
          locTag = '<span class="g-review-location">' + locIcon + escapeHTML(locName) + '</span>';
        }
        html += '<article class="g-review-card">'
              +   '<div class="g-review-top">'
              +     imgTag
              +     '<div>'
              +       '<span class="g-review-name">' + escapeHTML(r.name) + '</span>'
              +       '<span class="g-review-meta"><span class="g-review-stars">' + buildStars(r.rating) + '</span> ' + r.rating + ' &middot; ' + escapeHTML(r.time) + '</span>'
              +     '</div>'
              +   '</div>'
              +   '<p class="g-review-text">'
              +     '<span class="g-review-short">' + escapeHTML(t.short) + '</span>'
              +     '<span class="g-review-full">' + escapeHTML(t.full) + '</span>'
              +   '</p>'
              +   locTag
              + '</article>';
      });
      track.innerHTML = html;

      // Wire up arrows & auto-scroll
      var leftBtn = document.querySelector('.google-reviews-arrow--left');
      var rightBtn = document.querySelector('.google-reviews-arrow--right');
      var scrollAmount = 340;
      var autoInterval;

      if (leftBtn) {
        leftBtn.addEventListener('click', function () {
          track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
      }
      if (rightBtn) {
        rightBtn.addEventListener('click', function () {
          track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
      }

      function startAuto() {
        autoInterval = setInterval(function () {
          if (track.scrollLeft + track.offsetWidth >= track.scrollWidth - 10) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }, 3500);
      }
      function stopAuto() {
        clearInterval(autoInterval);
      }
      startAuto();
      track.addEventListener('mouseenter', stopAuto);
      track.addEventListener('mouseleave', startAuto);
      track.addEventListener('touchstart', stopAuto, { passive: true });
      track.addEventListener('touchend', function () {
        setTimeout(startAuto, 2000);
      });
    }

    // Build per-location "Write a Review" buttons
    var HQ_AREA = 'Serilingampally';

    function buildReviewButtons(locations) {
      var wrap = document.getElementById('review-btns');
      if (!wrap) return;

      // Sort by code ascending; HQ (Serilingampally) always first
      var sorted = locations.filter(function (l) { return !!l.reviewUrl; }).sort(function (a, b) {
        var aArea = (a.address && a.address.area) ? a.address.area.trim() : '';
        var bArea = (b.address && b.address.area) ? b.address.area.trim() : '';
        if (aArea === HQ_AREA) return -1;
        if (bArea === HQ_AREA) return 1;
        return a.code.localeCompare(b.code);
      });

      var html = '';
      sorted.forEach(function (loc) {
        var area = (loc.address && loc.address.area) ? loc.address.area.trim() : loc.name;
        var isHQ = area === HQ_AREA;
        var cls = 'google-reviews-write' + (isHQ ? ' google-reviews-write--hq' : '');
        html += '<a href="' + escapeHTML(loc.reviewUrl) + '" target="_blank" rel="noopener" class="' + cls + '">'
              +   (isHQ ? '<span class="review-btn-hq-badge">HQ</span> ' : '')
              +   '<svg class="review-btn-g" viewBox="0 0 24 24" width="14" height="14"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> '
              +   '<span class="review-btn-area">' + escapeHTML(area) + '</span>'
              + '</a>';
      });
      wrap.innerHTML = html;
    }

    // Fetch locations first (for MapsUri lookup), then reviews
    fetch('locations/locations.json')
      .then(function (res) { return res.json(); })
      .then(function (locations) {
        buildLocationMap(locations);
        buildReviewButtons(locations);
        return fetch('google-comments/ReviewForDisplayData.json');
      })
      .then(function (res) { return res.json(); })
      .then(function (data) { initReviewsCarousel(data); })
      .catch(function (err) { console.warn('Could not load reviews/locations:', err); });
  })();

  // ─── Scroll Reveal (IntersectionObserver) ─────────────
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && false) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Stagger children when inside a grid/flex parent
          var parent = entry.target.parentElement;
          if (parent) {
            var siblings = parent.querySelectorAll('.reveal');
            var idx = Array.prototype.indexOf.call(siblings, entry.target);
            entry.target.style.transitionDelay = (idx * 0.08) + 's';
          }
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    // Fallback: show everything immediately
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ─── (Trust & Proof is now a CSS-only infinite ticker — no JS counters needed) ──

  // ─── Sticky Header with glass effect ──────────────────
  var header = document.querySelector('.header');
  if (header) {
    var lastScroll = 0;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          header.classList.toggle('is-scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── Smooth scroll for anchor links ───────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') return;
      var el = document.querySelector(id);
      if (el && el.ownerDocument === document) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ─── Mobile nav toggle ────────────────────────────────
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close menu when clicking a nav link (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  // ─── Parallax hero glow ───────────────────────────────
  var heroGlow = document.querySelector('.hero-glow');
  if (heroGlow) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < 800) {
        heroGlow.style.transform = 'translateX(-50%) translateY(' + (y * 0.35) + 'px)';
        heroGlow.style.opacity = Math.max(0, 0.35 - y / 1600);
      }
    }, { passive: true });
  }

  // ─── Tilt effect on pillar & snapshot cards ───────────
  var tiltCards = document.querySelectorAll('.pillar-card, .snapshot-card');
  tiltCards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });

  // ─── Dynamic Contact Form (type-based fields) ─────────
  (function () {
    var formTabs = document.getElementById('form-tabs');
    var contactForm = document.getElementById('contact-form');
    if (!formTabs || !contactForm) return;

    var formTypeInput = document.getElementById('form-type');
    var formTitle = document.getElementById('form-title');
    var formDesc = document.getElementById('form-desc');
    var submitBtn = document.getElementById('form-submit-btn');
    var allFields = contactForm.querySelectorAll('.fg-field');
    var allTabs = formTabs.querySelectorAll('.form-tab');

    var config = {
      general:    { title: 'Quick Enquiry',         desc: 'Fill in the form and our team will get back to you promptly.',                      btn: 'Send Enquiry \u2192' },
      service:    { title: 'Book EV Service',        desc: 'Select your vehicle and problem. We\u2019ll confirm via WhatsApp.',                btn: 'Submit \u2013 we\u2019ll confirm on WhatsApp' },
      parts:      { title: 'Parts Enquiry',          desc: 'Tell us what you need and we\u2019ll get back with availability and pricing.',     btn: 'Submit Enquiry \u2192' },
      consulting: { title: 'Book Consultation',      desc: 'Our certified EV specialists will reach out to schedule your consultation.',       btn: 'Book Consultation \u2192' },
      fleet:      { title: 'Fleet / B2B Enquiry',    desc: 'Share your fleet details and we\u2019ll design a custom maintenance plan.',        btn: 'Get a Quote \u2192' },
      franchise:  { title: 'Franchise Application',  desc: 'Fill in the form and our franchise team will reach out within 24 hours.',          btn: 'Submit Application \u2192' }
    };

    function switchType(type) {
      if (!config[type]) type = 'general';
      formTypeInput.value = type;

      // Update tabs
      allTabs.forEach(function (tab) {
        tab.classList.toggle('is-active', tab.getAttribute('data-type') === type);
      });

      // Show/hide fields
      allFields.forEach(function (field) {
        var forTypes = (field.getAttribute('data-for') || '').split(' ');
        var visible = forTypes.indexOf(type) !== -1;
        field.classList.toggle('is-visible', visible);
        // Disable hidden inputs so they don't submit
        var inputs = field.querySelectorAll('input, select, textarea');
        inputs.forEach(function (inp) { inp.disabled = !visible; });
      });

      // Update title, description, button
      formTitle.textContent = config[type].title;
      formDesc.textContent = config[type].desc;
      submitBtn.textContent = config[type].btn;
    }

    // Tab click
    allTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchType(tab.getAttribute('data-type'));
      });
    });

    // ── Phone digit boxes (auto-advance, backspace, paste) ──
    var phoneWrap = document.getElementById('cf-phone-digits');
    if (phoneWrap) {
      var pDigits = phoneWrap.querySelectorAll('.phone-digit');
      pDigits.forEach(function (input, i) {
        input.addEventListener('input', function () {
          this.value = this.value.replace(/[^0-9]/g, '');
          this.classList.toggle('has-value', this.value.length > 0);
          if (this.value && i < pDigits.length - 1) pDigits[i + 1].focus();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !this.value && i > 0) {
            pDigits[i - 1].focus();
            pDigits[i - 1].value = '';
            pDigits[i - 1].classList.remove('has-value');
          }
          if (e.key === 'ArrowLeft' && i > 0) pDigits[i - 1].focus();
          if (e.key === 'ArrowRight' && i < pDigits.length - 1) pDigits[i + 1].focus();
        });
        input.addEventListener('paste', function (e) {
          e.preventDefault();
          var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
          for (var j = 0; j < paste.length && (i + j) < pDigits.length; j++) {
            pDigits[i + j].value = paste[j];
            pDigits[i + j].classList.add('has-value');
          }
          var next = Math.min(i + paste.length, pDigits.length - 1);
          pDigits[next].focus();
        });
        // Focus highlight
        input.addEventListener('focus', function () { this.select(); });
      });
    }

    // Helper: collect phone from digit boxes
    function getPhone() {
      var phone = '';
      if (phoneWrap) {
        phoneWrap.querySelectorAll('.phone-digit').forEach(function (d) { phone += d.value; });
      }
      return phone;
    }

    // ── Populate location radio buttons for service form ──
    var locRadioGroup = document.getElementById('cf-loc-radios');
    if (locRadioGroup) {
      // Read ?location= from URL to auto-select
      var urlLocParam = new URLSearchParams(window.location.search).get('location') || '';

      fetch('locations/locations.json')
        .then(function (r) { return r.json(); })
        .then(function (locations) {
          // Sort by code ascending
          locations.sort(function (a, b) { return a.code.localeCompare(b.code); });

          var matchedUrl = false;
          locations.forEach(function (loc) {
            var area = loc.address.area.trim();
            var isHQ = loc.code === 'Aerth Mobility-001';
            // If URL has ?location=, match that; otherwise default to HQ
            var matchesUrl = urlLocParam && area.toLowerCase() === urlLocParam.toLowerCase();
            if (matchesUrl) matchedUrl = true;

            var label = document.createElement('label');
            label.className = 'loc-radio' + (isHQ ? ' loc-radio--hq' : '');

            var input = document.createElement('input');
            input.type = 'radio';
            input.name = 'centre';
            input.value = area;
            input.className = 'loc-radio-input';
            // Check if URL match, or default to HQ when no URL match
            if (matchesUrl) input.checked = true;

            var dot = document.createElement('span');
            dot.className = 'loc-radio-dot';

            var text = document.createElement('span');
            text.className = 'loc-radio-text';
            text.textContent = area;

            if (isHQ) {
              var badge = document.createElement('span');
              badge.className = 'loc-radio-badge';
              badge.textContent = 'HQ';
              text.appendChild(badge);
            }

            label.appendChild(input);
            label.appendChild(dot);
            label.appendChild(text);
            locRadioGroup.appendChild(label);
          });

          // If no URL match, default to HQ (Serilingampally)
          if (!matchedUrl) {
            var hqRadio = locRadioGroup.querySelector('.loc-radio--hq .loc-radio-input');
            if (hqRadio) hqRadio.checked = true;
          }
        })
        .catch(function (err) { console.warn('Could not load locations for radio:', err); });
    }

    // Read ?type= from URL
    var params = new URLSearchParams(window.location.search);
    var urlType = params.get('type') || 'general';
    switchType(urlType);

    // Pre-fill message if ?message= param is present
    var urlMessage = params.get('message');
    if (urlMessage) {
      var msgField = document.getElementById('cf-message');
      if (msgField) msgField.value = urlMessage;
    }

    // Scroll to form if type param is present
    if (params.get('type')) {
      setTimeout(function () {
        var section = document.getElementById('enquiry');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }

    // ── Validation helpers ──────────────────
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var fgName  = document.getElementById('fg-name');
    var fgPhone = document.getElementById('fg-phone');
    var fgEmail = document.getElementById('fg-email');
    var nameInput = document.getElementById('cf-name');
    var emailInput = document.getElementById('cf-email');

    // ── Load saved contact info from localStorage ──
    try {
      var _saved = localStorage.getItem('evx_contact_info');
      if (_saved) {
        var _info = JSON.parse(_saved);
        if (_info.name  && nameInput)  nameInput.value  = _info.name;
        if (_info.email && emailInput) emailInput.value  = _info.email;
        if (_info.phone && phoneWrap && _info.phone.length === 10) {
          var _digits = phoneWrap.querySelectorAll('.phone-digit');
          for (var _i = 0; _i < _digits.length && _i < _info.phone.length; _i++) {
            _digits[_i].value = _info.phone[_i];
          }
        }
      }
    } catch (_e) {}

    function setFieldState(group, state) {
      if (!group) return;
      group.classList.remove('fg-valid', 'fg-invalid');
      if (state === 'valid')   group.classList.add('fg-valid');
      if (state === 'invalid') group.classList.add('fg-invalid');
    }

    function validateName() {
      var val = nameInput ? nameInput.value.trim() : '';
      if (val.length >= 2) { setFieldState(fgName, 'valid'); return true; }
      if (val.length === 0) { setFieldState(fgName, null); return false; }
      setFieldState(fgName, 'invalid'); return false;
    }

    function validatePhone() {
      var phone = getPhone();
      if (phone.length === 10 && /^[4-9]/.test(phone)) { setFieldState(fgPhone, 'valid'); return true; }
      if (phone.length === 0) { setFieldState(fgPhone, null); return false; }
      setFieldState(fgPhone, 'invalid'); return false;
    }

    function validateEmail() {
      if (!emailInput || !fgEmail) return true; // not present
      var val = emailInput.value.trim();
      if (val === '') { setFieldState(fgEmail, null); return true; } // optional, empty is ok
      if (emailRegex.test(val)) { setFieldState(fgEmail, 'valid'); return true; }
      setFieldState(fgEmail, 'invalid'); return false;
    }

    // ── Real-time validation on blur & input ──
    if (nameInput) {
      nameInput.addEventListener('blur', validateName);
      nameInput.addEventListener('input', function () {
        if (fgName && fgName.classList.contains('fg-invalid')) validateName();
        else if (nameInput.value.trim().length >= 2) validateName();
      });
    }
    if (phoneWrap) {
      phoneWrap.addEventListener('input', function () {
        var phone = getPhone();
        if (phone.length === 10) validatePhone();
        else if (fgPhone && fgPhone.classList.contains('fg-valid')) setFieldState(fgPhone, null);
        else if (fgPhone && fgPhone.classList.contains('fg-invalid') && phone.length > 0) validatePhone();
      });
    }
    if (emailInput) {
      emailInput.addEventListener('blur', validateEmail);
      emailInput.addEventListener('input', function () {
        if (fgEmail && fgEmail.classList.contains('fg-invalid')) validateEmail();
        else if (emailInput.value.trim() && emailRegex.test(emailInput.value.trim())) validateEmail();
      });
    }

    // ── Form submission → WhatsApp ──────────
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate required fields
      var nameOk  = validateName();
      var phoneOk = validatePhone();
      var emailOk = validateEmail();

      // Mark invalid on submit if empty
      if (!nameOk)  setFieldState(fgName, 'invalid');
      if (!phoneOk) setFieldState(fgPhone, 'invalid');

      if (!nameOk || !phoneOk || !emailOk) {
        // Focus first invalid field
        if (!nameOk && nameInput)       { nameInput.focus(); return; }
        if (!phoneOk && phoneWrap)      { phoneWrap.querySelector('.phone-digit').focus(); return; }
        if (!emailOk && emailInput)     { emailInput.focus(); return; }
        return;
      }

      // ── Persistent visitor ID (localStorage) ──
      function getOrCreateLSId() {
        var key = 'evx_visitor_id';
        var id = null;
        try { id = localStorage.getItem(key); } catch (e) {}
        if (!id) {
          id = 'v-' + Math.random().toString(36).substr(2, 12) + '-' + Date.now().toString(36);
          try { localStorage.setItem(key, id); } catch (e) {}
        }
        return id;
      }

      // ── Session ID (sessionStorage) ──
      function getOrCreateSSId() {
        var key = 'evx_session_id';
        var id = null;
        try { id = sessionStorage.getItem(key); } catch (e) {}
        if (!id) {
          id = 's-' + Math.random().toString(36).substr(2, 12) + '-' + Date.now().toString(36);
          try { sessionStorage.setItem(key, id); } catch (e) {}
        }
        return id;
      }

      // ── Device / Browser info ──
      function getDeviceInfo() {
        var ua = navigator.userAgent || '';
        var os = 'Unknown', osVersion = '', browser = 'Unknown', browserVersion = '';

        // OS detection
        if (/Windows NT (\d+[\.\d]*)/.test(ua))       { os = 'Windows'; osVersion = RegExp.$1; }
        else if (/Mac OS X ([\d_]+)/.test(ua))         { os = 'macOS'; osVersion = RegExp.$1.replace(/_/g, '.'); }
        else if (/Android ([\d.]+)/.test(ua))          { os = 'Android'; osVersion = RegExp.$1; }
        else if (/iPhone OS ([\d_]+)/.test(ua))        { os = 'iOS'; osVersion = RegExp.$1.replace(/_/g, '.'); }
        else if (/iPad.*OS ([\d_]+)/.test(ua))         { os = 'iPadOS'; osVersion = RegExp.$1.replace(/_/g, '.'); }
        else if (/Linux/.test(ua))                     { os = 'Linux'; }

        // Browser detection (order matters — check specific before generic)
        if (/Edg\/([\d.]+)/.test(ua))                  { browser = 'Edge'; browserVersion = RegExp.$1; }
        else if (/OPR\/([\d.]+)/.test(ua))             { browser = 'Opera'; browserVersion = RegExp.$1; }
        else if (/SamsungBrowser\/([\d.]+)/.test(ua))  { browser = 'Samsung Internet'; browserVersion = RegExp.$1; }
        else if (/Chrome\/([\d.]+)/.test(ua))          { browser = 'Chrome'; browserVersion = RegExp.$1; }
        else if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua)) {
          browser = 'Safari';
          var m = ua.match(/Version\/([\d.]+)/);
          browserVersion = m ? m[1] : RegExp.$1;
        }
        else if (/Firefox\/([\d.]+)/.test(ua))         { browser = 'Firefox'; browserVersion = RegExp.$1; }

        // Orientation
        var orientation = 'Unknown';
        if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.type) {
          orientation = screen.orientation.type.indexOf('portrait') !== -1 ? 'Portrait' : 'Landscape';
        } else if (typeof window.innerWidth !== 'undefined') {
          orientation = window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait';
        }

        return {
          os: os,
          osVersion: osVersion,
          browser: browser,
          browserVersion: browserVersion,
          orientation: orientation,
          screenWidth: screen ? screen.width : '',
          screenHeight: screen ? screen.height : '',
          language: navigator.language || ''
        };
      }

      // ── IP geolocation (async, best-effort) ──
      var IP_CACHE_KEY = 'evx_ip_data';
      var IP_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      async function getIpData() {
        var ipData = { ip: null, city: null, region: null, country: null, loc: null, postal: null };

        // ── Check localStorage cache first ──
        try {
          var cached = localStorage.getItem(IP_CACHE_KEY);
          if (cached) {
            var parsed = JSON.parse(cached);
            if (parsed && parsed._ts && (Date.now() - parsed._ts) < IP_CACHE_TTL) {
              delete parsed._ts;
              return parsed;
            }
          }
        } catch (e) {}

        // ── Fetch fresh data ──
        try {
          var res = await fetch('https://ipinfo.io/json');
          if (!res.ok) throw new Error('ipinfo failed');
          var d = await res.json();
          ipData.ip = d.ip || null; ipData.city = d.city || null;
          ipData.region = d.region || null; ipData.country = d.country || null;
          ipData.loc = d.loc || null; ipData.postal = d.postal || null;
        } catch (e) {
          console.warn('ipinfo failed, trying ip-api', e);
          try {
            var res2 = await fetch('http://ip-api.com/json/');
            if (!res2.ok) throw new Error('ip-api failed');
            var d2 = await res2.json();
            if (d2.status !== 'success') throw new Error('ip-api status failed');
            ipData.ip = d2.query || null; ipData.city = d2.city || null;
            ipData.region = d2.regionName || null; ipData.country = d2.countryCode || null;
            ipData.loc = (d2.lat && d2.lon) ? d2.lat + ',' + d2.lon : null;
            ipData.postal = d2.zip || null;
          } catch (e2) { console.error('Both IP services failed', e2); }
        }

        // ── Save to localStorage with timestamp ──
        try {
          var toStore = JSON.parse(JSON.stringify(ipData));
          toStore._ts = Date.now();
          localStorage.setItem(IP_CACHE_KEY, JSON.stringify(toStore));
        } catch (e) {}

        return ipData;
      }

      // ── Submit button loading state ──
      var submitBtn = document.getElementById('form-submit-btn');
      var btnOrigHTML = submitBtn ? submitBtn.innerHTML : '';

      function setBtnLoading(on) {
        if (!submitBtn) return;
        if (on) {
          submitBtn.disabled = true;
          submitBtn.classList.add('btn--loading');
          submitBtn.innerHTML =
            '<span class="btn-spinner"></span>' +
            '<span>Submitting&hellip;</span>';
        } else {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn--loading');
          submitBtn.innerHTML = btnOrigHTML;
        }
      }

      // ── Collect everything & send ──
      setBtnLoading(true);

      (async function () {
        try {
          var device = getDeviceInfo();
          var ipInfo = await getIpData();

          // Build complete form data object with ALL fields (visible or not)
          var centreEl = contactForm.querySelector('[name="centre"]:checked');
          var formData = {
            type:        formTypeInput.value || '',
            name:        nameInput ? nameInput.value.trim() : '',
            phone:       getPhone(),
            email:       (contactForm.querySelector('[name="email"]') || {}).value || '',
            centre:      centreEl ? centreEl.value : '',
            vehicle:     (contactForm.querySelector('[name="vehicle"]') || {}).value || '',
            problem:     (contactForm.querySelector('[name="problem"]') || {}).value || '',
            date:        (contactForm.querySelector('[name="date"]') || {}).value || '',
            product:     (contactForm.querySelector('[name="product"]') || {}).value || '',
            qty:         (contactForm.querySelector('[name="qty"]') || {}).value || '',
            location:    (contactForm.querySelector('[name="location"]') || {}).value || '',
            city:        (contactForm.querySelector('[name="city"]') || {}).value || '',
            background:  (contactForm.querySelector('[name="background"]') || {}).value || '',
            message:     (contactForm.querySelector('[name="message"]') || {}).value || '',
            timestamp:   new Date().toISOString(),

            // ── Tracking keys ──
            visitorId:   getOrCreateLSId(),
            sessionId:   getOrCreateSSId(),

            // ── Device & browser ──
            os:             device.os,
            osVersion:      device.osVersion,
            browser:        device.browser,
            browserVersion: device.browserVersion,
            orientation:    device.orientation,
            screenWidth:    device.screenWidth,
            screenHeight:   device.screenHeight,
            language:       device.language,

            // ── IP geolocation ──
            ip:          ipInfo.ip,
            geoCity:     ipInfo.city,
            geoRegion:   ipInfo.region,
            geoCountry:  ipInfo.country,
            geoLoc:      ipInfo.loc,
            geoPostal:   ipInfo.postal
          };

          // ── Save name, phone & email to localStorage for next visit ──
          try {
            localStorage.setItem('evx_contact_info', JSON.stringify({
              name: formData.name, phone: formData.phone, email: formData.email
            }));
          } catch (_e) {}

          // Log / expose the object (available for API integration)
          console.log('Aerth Mobility Enquiry:', formData);
          if (window.onEnquirySubmit) window.onEnquirySubmit(formData);

          // Build WhatsApp message from the object
          var type = formData.type;
          var whatsappNum = '916302693485';
          var lines = [];
          var typeLabels = {
            general: 'General Enquiry',
            service: 'EV Service Booking',
            parts: 'Parts Enquiry',
            consulting: 'Consulting Enquiry',
            fleet: 'Fleet / B2B Enquiry',
            franchise: 'Franchise Application'
          };
          lines.push(typeLabels[type] || 'Enquiry');
          lines.push('Name: ' + formData.name);
          lines.push('Phone: ' + formData.phone);
          if (formData.email)      lines.push('Email: ' + formData.email);
          if (formData.centre)     lines.push('Centre: ' + formData.centre);
          if (formData.vehicle)    lines.push('Vehicle: ' + formData.vehicle.toUpperCase());
          if (formData.problem)    lines.push('Problem: ' + formData.problem);
          if (formData.date)       lines.push('Date: ' + formData.date);
          if (formData.product)    lines.push('Product: ' + formData.product);
          if (formData.qty)        lines.push('Qty: ' + formData.qty);
          if (formData.location)   lines.push('Location: ' + formData.location);
          if (formData.city)       lines.push('City: ' + formData.city);
          if (formData.background) lines.push('Background: ' + formData.background);
          if (formData.message)    lines.push('Message: ' + formData.message);

          // ── Submit to Google Sheets ──
          await fetch('https://script.google.com/macros/s/AKfycbxzoWmYYTbqMGw2O4BwCuQcx02QpiyPJy9ZooXCzmr_xKGONIvxh6oCjXowNK6YRyCT/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });

          evxToast('Your enquiry has been submitted successfully!', 'success');

          // ── Open WhatsApp ──
          //var message = lines.join('\n');
          //var url = 'https://wa.me/' + whatsappNum + '?text=' + encodeURIComponent(message);
          //window.open(url, '_blank');

        } catch (err) {
          console.error('Submission failed', err);
          evxToast('Submission failed — please try again.', 'error');
        } finally {
          setBtnLoading(false);
        }
      })();
    });
  })();

  // ─── Infinite Marquee: load from customers.json, build, arrows + dots + auto-scroll ────
  var mTrack = document.getElementById('marquee-track');
  var mWrap = document.getElementById('marquee-wrap');
  var mPrev = document.getElementById('marquee-prev');
  var mNext = document.getElementById('marquee-next');
  var mDots = document.getElementById('marquee-dots');

  function initMarquee(customers) {
    if (!mTrack || !mWrap) return;
    var TOTAL = customers.length;
    var current = 0;
    var isManual = false;

    // Build logo squares (Set 1 + Set 2 duplicate for seamless scroll)
    var trackHTML = '';
    for (var s = 0; s < 2; s++) {
      customers.forEach(function (c, i) {
        var bgStyle = c.bg ? ' style="background:' + c.bg + '"' : '';
        trackHTML += '<div class="logo-square" data-index="' + i + '"' + bgStyle + '>'
                   + '<img src="' + c.img + '" alt="' + c.name + '" loading="lazy">'
                   + '</div>';
      });
    }
    mTrack.innerHTML = trackHTML;

    // Build dots
    if (mDots) {
      var dotsHTML = '';
      customers.forEach(function (c, i) {
        dotsHTML += '<button type="button" class="marquee-dot' + (i === 0 ? ' is-active' : '')
                  + '" data-index="' + i + '" aria-label="' + c.name + '"></button>';
      });
      mDots.innerHTML = dotsHTML;
    }

    function getLogoWidth() {
      var square = mTrack.querySelector('.logo-square');
      return square ? square.offsetWidth : 180;
    }

    function updateDots(idx) {
      if (!mDots) return;
      mDots.querySelectorAll('.marquee-dot').forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
      });
    }

    var lastCenterEl = null;

    function updateCenterHighlight() {
      var wrapRect = mWrap.getBoundingClientRect();
      var centerX = wrapRect.left + wrapRect.width / 2;
      var squares = mTrack.querySelectorAll('.logo-square');
      var closest = null;
      var closestDist = Infinity;
      squares.forEach(function (sq) {
        var r = sq.getBoundingClientRect();
        var mid = r.left + r.width / 2;
        var d = Math.abs(mid - centerX);
        if (d < closestDist) {
          closestDist = d;
          closest = sq;
        }
      });
      if (closest !== lastCenterEl) {
        if (lastCenterEl) lastCenterEl.classList.remove('is-center');
        if (closest) closest.classList.add('is-center');
        lastCenterEl = closest;
      }
    }

    function pollActiveDot() {
      if (isManual) return;
      var matrix = window.getComputedStyle(mTrack).transform;
      var tx = 0;
      if (matrix && matrix !== 'none') {
        var parts = matrix.match(/matrix.*\((.+)\)/);
        if (parts) {
          var values = parts[1].split(',');
          tx = parseFloat(values[4]) || 0;
        }
      }
      var w = getLogoWidth();
      var gap = parseFloat(window.getComputedStyle(mTrack).gap) || 20;
      var step = w + gap;
      if (step > 0) {
        var idx = Math.round(Math.abs(tx) / step) % TOTAL;
        if (idx !== current) {
          current = idx;
          updateDots(current);
        }
      }
      updateCenterHighlight();
    }
    setInterval(pollActiveDot, 250);

    function highlightSquare(idx) {
      if (lastCenterEl) { lastCenterEl.classList.remove('is-center'); lastCenterEl = null; }
      mTrack.querySelectorAll('.logo-square').forEach(function (sq) {
        var match = parseInt(sq.getAttribute('data-index'), 10) === idx;
        sq.classList.toggle('is-active', match);
      });
    }

    function jumpTo(index) {
      isManual = true;
      current = ((index % TOTAL) + TOTAL) % TOTAL;
      var w = getLogoWidth();
      var gap = parseFloat(window.getComputedStyle(mTrack).gap) || 20;
      var wrapWidth = mWrap.offsetWidth;
      var centerOffset = (wrapWidth - w) / 2;
      var offset = current * (w + gap) - centerOffset;
      if (offset < 0) offset = 0;

      mTrack.style.animation = 'none';
      void mTrack.offsetWidth;
      mTrack.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      mTrack.style.transform = 'translateX(' + (-offset) + 'px)';
      updateDots(current);
      highlightSquare(current);

      clearTimeout(mTrack._resumeTimer);
      mTrack._resumeTimer = setTimeout(function () {
        var totalScrollDist = TOTAL * (w + gap);
        var fraction = (offset % totalScrollDist) / totalScrollDist;
        var resumeDelay = -(fraction * 60);

        mTrack.style.transition = '';
        mTrack.style.transform = '';
        mTrack.style.animation = 'marquee-scroll 60s linear infinite';
        mTrack.style.animationDelay = resumeDelay + 's';
        highlightSquare(-1);
        isManual = false;
      }, 3500);
    }

    if (mPrev) {
      mPrev.addEventListener('click', function () { jumpTo(current - 1); });
    }
    if (mNext) {
      mNext.addEventListener('click', function () { jumpTo(current + 1); });
    }
    if (mDots) {
      mDots.querySelectorAll('.marquee-dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          var idx = parseInt(dot.getAttribute('data-index'), 10);
          if (!isNaN(idx)) jumpTo(idx);
        });
      });
    }

    mTrack.addEventListener('click', function (e) {
      var sq = e.target.closest('.logo-square');
      if (!sq) return;
      var idx = parseInt(sq.getAttribute('data-index'), 10);
      if (!isNaN(idx)) jumpTo(idx);
    });

    // ── Keyboard arrow navigation (Left / Right) ──
    var section = document.getElementById('logos-marquee');
    var kbdTimer = null;
    if (section) {
      section.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
          e.preventDefault();
          jumpTo(current - 1);
          flashArrow(mPrev);
        } else if (e.key === 'ArrowRight' || e.key === 'Right') {
          e.preventDefault();
          jumpTo(current + 1);
          flashArrow(mNext);
        }
      });
    }

    function flashArrow(btn) {
      if (!btn) return;
      btn.classList.add('is-pressed');
      section.classList.add('is-kbd-active');
      clearTimeout(kbdTimer);
      kbdTimer = setTimeout(function () {
        btn.classList.remove('is-pressed');
        section.classList.remove('is-kbd-active');
      }, 250);
    }

    // ── Touch swipe support for mobile ──
    if (mWrap) {
      var touchStartX = 0;
      var touchStartY = 0;
      var swiping = false;
      var SWIPE_THRESHOLD = 40;

      mWrap.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });

      mWrap.addEventListener('touchmove', function (e) {
        if (!swiping) return;
        var dx = e.touches[0].clientX - touchStartX;
        var dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          e.preventDefault();
        }
      }, { passive: false });

      mWrap.addEventListener('touchend', function (e) {
        if (!swiping) return;
        swiping = false;
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (dx < 0) {
          jumpTo(current + 1);
        } else {
          jumpTo(current - 1);
        }
      }, { passive: true });
    }
  }

  // Fetch customers.json and initialize marquee
  if (mTrack && mWrap) {
    fetch('customers.json')
      .then(function (res) { return res.json(); })
      .then(function (data) { initMarquee(data); })
      .catch(function (err) { console.warn('Could not load customers.json', err); });
  }

  // ─── WhatsApp Drawer ──────────────────────────────────
  var waFab = document.getElementById('wa-fab');
  var waDrawer = document.getElementById('wa-drawer');
  var waClose = document.getElementById('wa-drawer-close');
  var waOverlay = document.getElementById('wa-drawer-overlay');
  var waDigits = document.getElementById('wa-digits');
  var waMsg = document.getElementById('wa-message');
  var waReset = document.getElementById('wa-reset');
  var waSend = document.getElementById('wa-send');

  if (waDigits) {
    var waNumber = '6302693485';
    var waDigitInputs = waDigits.querySelectorAll('.wa-digit');
    waDigitInputs.forEach(function (d, i) {
      d.value = waNumber[i] || '';
      d.readOnly = true;
    });
  }

  function waOpen() {
    // Close translate drawer if open
    var gtD = document.getElementById('gt-drawer');
    if (gtD && gtD.classList.contains('is-open')) {
      gtD.classList.remove('is-open');
      gtD.setAttribute('aria-hidden', 'true');
    }
    if (waDrawer) {
      waDrawer.classList.add('is-open');
      waDrawer.setAttribute('aria-hidden', 'false');
      // Focus first digit
      var first = waDigits && waDigits.querySelector('.wa-digit');
      if (first) setTimeout(function () { first.focus(); }, 350);
    }
  }
  function waCloseDrawer() {
    if (waDrawer) {
      waDrawer.classList.remove('is-open');
      waDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  if (waFab) waFab.addEventListener('click', waOpen);
  if (waClose) waClose.addEventListener('click', waCloseDrawer);
  if (waOverlay) waOverlay.addEventListener('click', waCloseDrawer);

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && waDrawer && waDrawer.classList.contains('is-open')) {
      waCloseDrawer();
    }
  });

  // Digit auto-advance, backspace, and paste support
  if (waDigits) {
    var digits = waDigits.querySelectorAll('.wa-digit');

    digits.forEach(function (input, i) {
      input.addEventListener('input', function () {
        // Only allow digits
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value && i < digits.length - 1) {
          digits[i + 1].focus();
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value && i > 0) {
          digits[i - 1].focus();
          digits[i - 1].value = '';
        }
        if (e.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
        if (e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
      });
      // Handle paste (e.g., paste full number)
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
        for (var j = 0; j < paste.length && (i + j) < digits.length; j++) {
          digits[i + j].value = paste[j];
        }
        var next = Math.min(i + paste.length, digits.length - 1);
        digits[next].focus();
      });
    });
  }

  // Reset
  if (waReset) {
    waReset.addEventListener('click', function () {
      if (waDigits) {
        //waDigits.querySelectorAll('.wa-digit').forEach(function (d) { d.value = ''; });
        //waDigits.querySelector('.wa-digit').focus();
      }
      if (waMsg) waMsg.value = '';
    });
  }

  // Send via WhatsApp
  if (waSend) {
    waSend.addEventListener('click', function () {
      var phone = '';
      if (waDigits) {
        waDigits.querySelectorAll('.wa-digit').forEach(function (d) { phone += d.value; });
      }
      if (phone.length < 10) {
        alert('Please enter all 10 digits of the phone number.');
        return;
      }
      var message = waMsg ? waMsg.value.trim() : '';
      // Build WhatsApp URL with 91 country code
      var url = 'https://wa.me/91' + phone;
      if (message) {
        url += '?text=' + encodeURIComponent(message);
      }
      window.open(url, '_blank');
    });
  }

  // ─── Scroll-to-top button ─────────────────────────────
  var scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    var stTicking = false;
    window.addEventListener('scroll', function () {
      if (!stTicking) {
        window.requestAnimationFrame(function () {
          scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
          stTicking = false;
        });
        stTicking = true;
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── Locations: build cards from locations.json ────────
  (function () {
    var grid = document.getElementById('locations-grid');
    if (!grid) return;

    var comingSoon = document.getElementById('loc-coming-soon');
    var visuals = ['service', 'parts', 'fleet', 'consult'];

    // SVG icon helpers
    var iconPin  = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--neon-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    var iconPhone = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--neon-green-dim)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
    var iconMail = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--neon-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
    var iconGoogle = '<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;margin-right:3px"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09A6.68 6.68 0 015.5 12c0-.72.12-1.42.34-2.09V7.07H2.18A11 11 0 001 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
    var iconWeb  = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--neon-green-dim)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>';
    var HQ_CODE = 'Aerth Mobility-001';

    fetch('locations/locations.json')
      .then(function (r) { return r.json(); })
      .then(function (locations) {

        // Sort by code ascending
        locations.sort(function (a, b) { return a.code.localeCompare(b.code); });

        // Build counter for branch numbering (skip HQ)
        var branchNum = 0;

        locations.forEach(function (loc) {
          var a = loc.address;
          var fullAddr = [a.line1, a.line2, a.area].filter(Boolean).join(', ')
            + ' — ' + a.city + ', ' + a.state + ' ' + a.pincode;
          var isHQ = loc.code === HQ_CODE;
          var statusTag = loc.status === 'Verified' ? 'Verified' : loc.status;

          // ─── Pills HTML ───
          var pillsHtml = loc.services.map(function (s) {
            return '<span class="snap-pill snap-pill--accent">' + s + '</span>';
          }).join('');

          // ─── Info list HTML ───
          var listHtml =
            '<ul class="snapshot-list">' +
              '<li>' + iconPin + fullAddr + '</li>' +
              '<li>' + iconPhone + '<a href="tel:' + loc.phone.replace(/\s/g, '') + '">' + loc.phone + '</a></li>' +
              '<li>' + iconMail + '<a href="mailto:' + loc.email + '">' + loc.email + '</a></li>' +
              (loc.website ? '<li>' + iconWeb + '<a href="' + loc.website + '" target="_blank" rel="noopener">' + loc.website.replace(/https?:\/\//, '') + '</a></li>' : '') +
            '</ul>';

          // ─── Map HTML ───
          var mapHtml = loc.googleMapsUrl
            ? '<div class="loc-map-wrap"><iframe src="' + loc.googleMapsUrl + '" width="100%" height="200" style="border:0;border-radius:var(--radius-md)" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map — ' + a.area.trim() + '"></iframe></div>'
            : '';

          // ─── Area for URL param ───
          var areaParam = encodeURIComponent(a.area.trim());
          var bookUrl = 'contact.html?type=service&location=' + areaParam;

          // ─── Review button HTML (small with Google icon) ───
          var reviewHtml = loc.reviewUrl
            ? '<a href="' + loc.reviewUrl + '" target="_blank" rel="noopener" class="btn btn-outline loc-review-btn">' + iconGoogle + 'Review</a>'
            : '';

          var card = document.createElement('article');

          if (isHQ) {
            // ── Head Office: wide card with HQ badge ──
            card.className = 'snapshot-card snapshot-card--wide loc-card loc-card--hq reveal';
            card.innerHTML =
              '<div class="snap-visual snap-visual--franchise">' +
                '<span class="snap-num">' +
                  '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
                '</span>' +
                '<span class="snap-tag">Head Office</span>' +
              '</div>' +
              '<div class="snap-content">' +
                '<div class="snap-pills">' +
                  '<span class="snap-pill snap-pill--accent" style="background:linear-gradient(135deg,var(--neon-blue),var(--neon-green-dim));color:#fff">HQ</span>' +
                  pillsHtml +
                '</div>' +
                '<h2 class="snapshot-title" style="font-size:clamp(1.3rem,3vw,1.75rem)">' + loc.name + ' — <span class="text-gradient">' + a.area.trim() + '</span></h2>' +
                '<p class="snapshot-desc">Our founding centre and head office. Full-service EV hub with sales, service, and spare parts.</p>' +
                listHtml +
                mapHtml +
                '<div class="loc-card-actions">' +
                  '<a href="' + bookUrl + '" class="btn btn-primary snap-btn">Book Service &rarr;</a>' +
                  '<a href="contact.html?type=general&location=' + areaParam + '" class="btn btn-outline snap-btn">Contact HQ &rarr;</a>' +
                  reviewHtml +
                '</div>' +
              '</div>';
          } else {
            // ── Branch card ──
            branchNum++;
            var variant = visuals[(branchNum - 1) % visuals.length];
            var num = String(branchNum).padStart(2, '0');

            card.className = 'snapshot-card loc-card reveal';
            card.innerHTML =
              '<div class="snap-visual snap-visual--' + variant + '">' +
                '<span class="snap-num">' + num + '</span>' +
                '<span class="snap-tag">' + statusTag + '</span>' +
              '</div>' +
              '<div class="snap-content">' +
                '<div class="snap-pills">' + pillsHtml + '</div>' +
                '<h2 class="snapshot-title">' + loc.name + ' — <span class="text-gradient">' + a.area.trim() + '</span></h2>' +
                listHtml +
                mapHtml +
                '<div class="loc-card-actions">' +
                  '<a href="' + bookUrl + '" class="btn btn-primary snap-btn">Book Service &rarr;</a>' +
                  reviewHtml +
                '</div>' +
              '</div>';
          }

          grid.insertBefore(card, comingSoon);
        });

        // Re-trigger reveal observer for new cards
        if (typeof IntersectionObserver !== 'undefined') {
          var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
            });
          }, { threshold: 0.15 });
          grid.querySelectorAll('.loc-card.reveal').forEach(function (el) { obs.observe(el); });
        }
      })
      .catch(function (err) { console.warn('Could not load locations.json:', err); });
  })();

  // ─── Legacy form IDs: redirect to contact page ────────
  ['parts-form', 'franchise-form-el', 'booking-form'].forEach(function (id) {
    var form = document.getElementById(id);
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Thank you. We will get back to you shortly.');
      });
    }
  });

  // ─── Parts Catalogue Carousel ────
  (function () {
    var track1 = document.getElementById('parts-track-1');
    var track2 = document.getElementById('parts-track-2');
    if (!track1 || !track2) return;

    fetch('products/allproducts.json')
      .then(function (r) { return r.json(); })
      .then(function (products) {
        if (!products || !products.length) return;

        // Shuffle products for variety
        var shuffled = products.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = shuffled[i];
          shuffled[i] = shuffled[j];
          shuffled[j] = tmp;
        }

        // Split into two rows
        var half = Math.ceil(shuffled.length / 2);
        var row1 = shuffled.slice(0, half);
        var row2 = shuffled.slice(half);

        // ── Favourites (localStorage) ──
        var FAV_KEY = 'evx-fav-parts';
        function getFavs() {
          try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
        }
        function saveFavs(arr) {
          try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) { /* ignore */ }
        }
        function isFav(code) { return getFavs().indexOf(code) !== -1; }
        function toggleFav(code) {
          var favs = getFavs();
          var idx = favs.indexOf(code);
          if (idx === -1) favs.push(code); else favs.splice(idx, 1);
          saveFavs(favs);
          return idx === -1; // true = now favourited
        }
        // Sync all fav buttons with same code (duplicated cards in marquee)
        function syncFavButtons(code, active) {
          document.querySelectorAll('.parts-fav-btn[data-code="' + code + '"]').forEach(function (btn) {
            if (active) btn.classList.add('is-fav'); else btn.classList.remove('is-fav');
          });
        }

        function buildCard(item) {
          var card = document.createElement('div');
          card.className = 'parts-pcard';

          var imgWrap = document.createElement('div');
          imgWrap.className = 'parts-pcard-img';

          var img = document.createElement('img');
          img.src = 'products/images/' + item.ItemCode;
          img.alt = item.Name;
          img.loading = 'lazy';
          img.onerror = function () { this.style.display = 'none'; };
          imgWrap.appendChild(img);

          if (item.InStock) {
            var badge = document.createElement('span');
            badge.className = 'parts-pcard-stock';
            badge.textContent = 'In Stock';
            imgWrap.appendChild(badge);
          }

          // ── Favourite button ──
          var favBtn = document.createElement('button');
          favBtn.type = 'button';
          favBtn.className = 'parts-fav-btn' + (isFav(item.Code) ? ' is-fav' : '');
          favBtn.setAttribute('aria-label', 'Add to favourites');
          favBtn.setAttribute('data-code', item.Code);
          favBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
          favBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var nowFav = toggleFav(item.Code);
            syncFavButtons(item.Code, nowFav);
          });
          imgWrap.appendChild(favBtn);

          var info = document.createElement('div');
          info.className = 'parts-pcard-info';

          var code = document.createElement('span');
          code.className = 'parts-pcard-code';
          code.textContent = item.Code;

          var name = document.createElement('p');
          name.className = 'parts-pcard-name';
          // Title-case the name
          name.textContent = item.Name.replace(/\b\w+/g, function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          });

          info.appendChild(code);
          info.appendChild(name);
          card.appendChild(imgWrap);
          card.appendChild(info);

          // Link to product page — disabled for now
          // if (item.NAME_URL && item.Code) {
          //   card.style.cursor = 'pointer';
          //   card.addEventListener('click', function () {
          //     window.location.href = 'product/' + item.NAME_URL + '_' + item.Code + '.html';
          //   });
          // }

          return card;
        }

        function fillTrack(track, items) {
          var frag = document.createDocumentFragment();
          // Build cards once
          items.forEach(function (item) { frag.appendChild(buildCard(item)); });
          track.appendChild(frag);

          // Duplicate for seamless infinite scroll
          var clone = track.innerHTML;
          track.insertAdjacentHTML('beforeend', clone);
        }

        fillTrack(track1, row1);
        fillTrack(track2, row2);
      })
      .catch(function (err) {
        console.warn('Parts carousel load failed:', err);
      });
  })();

  // ─── Promo Rotator Modal: 15s idle — Premium UX ────
  (function () {
    var overlay   = document.getElementById('promo-overlay');
    var modal     = document.getElementById('promo-modal');
    var slidesWrap = document.getElementById('promo-slides');
    var dotsWrap  = document.getElementById('promo-dots');
    var closeBtn  = document.getElementById('promo-close');
    var prevBtn   = document.getElementById('promo-prev');
    var nextBtn   = document.getElementById('promo-next');
    var progressBar = document.getElementById('promo-progress-bar');
    var counterEl = document.getElementById('promo-counter');
    if (!overlay || !slidesWrap) return;

    var PROMO_BASE_MS  = 15000; // base idle = 15 seconds
    var SLIDE_INTERVAL = 5000;  // 5 seconds per slide
    var LS_KEY = 'evx-promo-state';
    var slides = slidesWrap.querySelectorAll('.promo-slide');
    var totalSlides = slides.length;
    var currentIdx  = 0;
    var slideTimer  = null;
    var idleTimer   = null;
    var promoShown  = false;

    // ── Helpers: date string ──
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // ── LocalStorage: exponential backoff state ──
    // Stored shape: { date: "YYYY-MM-DD", dismissals: 0 }
    // Each dismiss doubles the idle wait: 15s → 30s → 60s → 120s → 240s …
    // Resets to 15s at midnight (new date string).
    function loadPromoState() {
      try {
        var raw = localStorage.getItem(LS_KEY);
        if (raw) {
          var state = JSON.parse(raw);
          if (state && state.date === todayStr()) return state;
        }
      } catch (e) { /* corrupted — reset */ }
      // New day or first visit → fresh state
      var fresh = { date: todayStr(), dismissals: 0 };
      savePromoState(fresh);
      return fresh;
    }
    function savePromoState(state) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    }

    // Current idle delay = base × 2^dismissals  (15s, 30s, 60s, 120s …)
    var promoState = loadPromoState();
    function currentIdleMs() {
      return PROMO_BASE_MS * Math.pow(2, promoState.dismissals);
    }

    // ── Build dot indicators ──
    for (var i = 0; i < totalSlides; i++) {
      var dot = document.createElement('button');
      dot.className = 'promo-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.dataset.idx = i;
      dot.addEventListener('click', function () {
        goToSlide(parseInt(this.dataset.idx));
      });
      dotsWrap.appendChild(dot);
    }
    var dots = dotsWrap.querySelectorAll('.promo-dot');

    // ── Update counter ──
    function updateCounter() {
      if (counterEl) counterEl.textContent = (currentIdx + 1) + ' / ' + totalSlides;
    }

    // ── Slide navigation (smooth crossfade, no jerk) ──
    function goToSlide(idx) {
      if (idx === currentIdx) return;
      slides[currentIdx].classList.remove('is-active');
      dots[currentIdx].classList.remove('is-active');
      currentIdx = ((idx % totalSlides) + totalSlides) % totalSlides;
      slides[currentIdx].classList.add('is-active');
      dots[currentIdx].classList.add('is-active');
      updateCounter();
      restartProgress();
    }

    function nextSlide() { goToSlide(currentIdx + 1); }
    function prevSlide() { goToSlide(currentIdx - 1); }

    function restartProgress() {
      if (progressBar) {
        progressBar.classList.remove('is-running');
        void progressBar.offsetWidth;
        progressBar.classList.add('is-running');
      }
      clearInterval(slideTimer);
      slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    // ── Arrow buttons ──
    if (prevBtn) prevBtn.addEventListener('click', function () { prevSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { nextSlide(); });

    // ── Touch / swipe support ──
    var touchStartX = 0;
    var touchStartY = 0;
    var isSwiping = false;
    modal.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
      isSwiping = true;
    }, { passive: true });
    modal.addEventListener('touchend', function (e) {
      if (!isSwiping) return;
      isSwiping = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      // Only horizontal swipe, min 40px, more horizontal than vertical
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
    }, { passive: true });

    // ── Keyboard navigation while promo is open ──
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-active')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { nextSlide(); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')    { prevSlide(); e.preventDefault(); }
      if (e.key === 'Escape') { closePromo(); e.preventDefault(); }
    });

    // (auto-rotate runs continuously; no pause-on-hover so slides always move)

    // ── Show / close ──
    var promoOpen = false;

    function showPromo() {
      if (promoOpen) return;
      var scratchOverlay = document.getElementById('scratch-overlay');
      if (scratchOverlay && scratchOverlay.classList.contains('is-active')) return;

      promoOpen = true;
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');
      updateCounter();
      restartProgress();
    }

    function closePromo() {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      clearInterval(slideTimer);
      if (progressBar) {
        progressBar.classList.remove('is-running');
        progressBar.style.animationPlayState = '';
      }
      promoOpen = false;

      // ── Exponential backoff: double the idle wait on each dismiss ──
      // Reload state (in case date rolled over while page was open)
      promoState = loadPromoState();
      promoState.dismissals += 1;
      savePromoState(promoState);

      // Re-arm idle timer with the new (doubled) delay
      resetPromoIdle();
    }

    if (closeBtn) closeBtn.addEventListener('click', closePromo);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePromo();
    });

    // ── Idle detection — exponential backoff (15s → 30s → 60s → …) ──
    // Reloads state on each reset so midnight rollover is picked up live.
    function resetPromoIdle() {
      clearTimeout(idleTimer);
      if (!promoOpen) {
        // Refresh state in case the date changed (midnight reset)
        var freshState = loadPromoState();
        if (freshState.date !== promoState.date) {
          promoState = freshState;          // new day → dismissals back to 0
        }
        var delayMs = currentIdleMs();
        idleTimer = setTimeout(showPromo, delayMs);
      }
    }
    ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, resetPromoIdle, { passive: true });
    });
    resetPromoIdle();
  })();

  // ─── Scratch Card: idle detection + canvas scratch ────
  (function () {
    var overlay = document.getElementById('scratch-overlay');
    var card    = document.getElementById('scratch-card');
    var canvas  = document.getElementById('scratch-canvas');
    var hint    = document.getElementById('scratch-hint');
    var closeBtn = document.getElementById('scratch-close');
    var pctEl   = document.getElementById('scratch-pct');
    var codeEl  = document.getElementById('scratch-code');
    var expEl   = document.getElementById('scratch-expiry');
    if (!overlay || !canvas) return;

    var IDLE_MS = 10000000; // 10 seconds idle
    var LS_KEY = 'evx-scratch';
    var shown = false;
    var idleTimer = null;
    var ctx = canvas.getContext('2d');
    var isScratching = false;
    var scratched = false;

    // ── Helper: today as YYYY-MM-DD ──
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // ── Generate random 16-char coupon ──
    function genCoupon() {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      var code = '';
      for (var i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    }

    // ── Load or create coupon data in localStorage ──
    var couponData = null;
    try { couponData = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { /* ignore */ }

    // Check if existing coupon is still valid (not expired)
    if (couponData && couponData.expiry) {
      var now = new Date();
      var expDate = new Date(couponData.expiry);
      if (now > expDate) {
        // Expired — clear and generate fresh
        couponData = null;
        localStorage.removeItem(LS_KEY);
      }
    }

    // Create new coupon if none exists
    if (!couponData) {
      var discounts = [3, 4, 5];
      var expiry = new Date();
      expiry.setDate(expiry.getDate() + 10);
      couponData = {
        discount: discounts[Math.floor(Math.random() * discounts.length)],
        code: genCoupon(),
        expiry: expiry.toISOString(),
        scratched: false,
        dismissedOn: null
      };
      localStorage.setItem(LS_KEY, JSON.stringify(couponData));
    }

    // ── Populate the card with stored data ──
    if (pctEl) pctEl.textContent = couponData.discount + '%';
    if (codeEl) codeEl.textContent = couponData.code;
    if (expEl) {
      var expDate = new Date(couponData.expiry);
      expEl.textContent = expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    scratched = !!couponData.scratched;

    // ── Should we show today? ──
    // Don't show if user dismissed it today
    function isDismissedToday() {
      return couponData.dismissedOn === todayStr();
    }

    // ── Draw scratch overlay on canvas ──
    function initCanvas() {
      // Use offsetWidth/Height — unaffected by CSS transforms (scale)
      var cw = card.offsetWidth;
      var ch = card.offsetHeight;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx.scale(dpr, dpr);

      var w = cw, h = ch;

      // Rich gradient background for scratch layer
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1a3a5c');
      grad.addColorStop(0.3, '#0d2137');
      grad.addColorStop(0.6, '#162d47');
      grad.addColorStop(1, '#0e1e34');

      // Rounded rect
      var r = 18;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Dotted texture pattern
      ctx.globalAlpha = 0.08;
      for (var x = 0; x < w; x += 6) {
        for (var y = 0; y < h; y += 6) {
          if (Math.random() > 0.55) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(x, y, 1.5, 1.5);
          }
        }
      }
      ctx.globalAlpha = 1;

      // Subtle shimmer stripes
      ctx.save();
      ctx.globalAlpha = 0.04;
      for (var s = -h; s < w + h; s += 20) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(s + 8, 0);
        ctx.lineTo(s + 8 - h, h);
        ctx.lineTo(s - h, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Gold border accent
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // ── Scratch logic ──
    var lastPos = null;

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var touch = e.touches && e.touches.length > 0 ? e.touches[0]
                : e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0]
                : e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    function scratch(pos) {
      var dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      // Draw line from last position for smooth strokes
      if (lastPos) {
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      lastPos = pos;
    }

    var checkThrottle = null;
    function checkPercent() {
      if (scratched || checkThrottle) return;
      checkThrottle = setTimeout(function () {
        checkThrottle = null;
        if (scratched) return;
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;
        var total = pixels.length / 4;
        var cleared = 0;
        // Sample every 4th pixel for performance on mobile
        for (var i = 3; i < pixels.length; i += 16) {
          if (pixels[i] === 0) cleared++;
        }
        total = Math.ceil(total / 4);
        if (cleared / total > 0.35) {
          scratched = true;
          canvas.classList.add('is-done');
          if (hint) hint.classList.add('is-hidden');
          card.classList.add('is-scratched');
          markScratched();
        }
      }, 150);
    }

    function onDown(e) {
      e.preventDefault();
      isScratching = true;
      lastPos = null;
      if (hint) hint.classList.add('is-hidden');
      var pos = getPos(e);
      scratch(pos);
    }
    function onMove(e) {
      if (!isScratching) return;
      e.preventDefault();
      scratch(getPos(e));
      checkPercent();
    }
    function onUp(e) {
      if (!isScratching) return;
      isScratching = false;
      lastPos = null;
      checkPercent();
    }

    // Mouse events
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    // Touch events
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp, { passive: false });
    canvas.addEventListener('touchcancel', onUp);

    // ── Show / close ──
    function showCard() {
      if (shown) return;
      if (isDismissedToday()) return;
      shown = true;
      initCanvas();
      // If already scratched before, skip canvas overlay & show close
      if (scratched) {
        canvas.classList.add('is-done');
        if (hint) hint.classList.add('is-hidden');
        card.classList.add('is-scratched');
      }
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeCard() {
      overlay.classList.remove('is-active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Mark dismissed today so it won't show again today
      couponData.dismissedOn = todayStr();
      localStorage.setItem(LS_KEY, JSON.stringify(couponData));
    }

    // Save scratched state to localStorage
    function markScratched() {
      couponData.scratched = true;
      localStorage.setItem(LS_KEY, JSON.stringify(couponData));
    }

    // Only the close button dismisses — no overlay click dismiss
    if (closeBtn) closeBtn.addEventListener('click', function () {
      if (scratched) closeCard();
    });

    // ── Claim button → go to contact page with coupon info ──
    var claimBtn = document.getElementById('scratch-claim');
    if (claimBtn) {
      claimBtn.addEventListener('click', function () {
        var expDate = new Date(couponData.expiry);
        var expiryStr = expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        var msg = 'I would like to claim my scratch card offer.'
          + '\n\nDiscount: ' + couponData.discount + '%'
          + '\nCoupon Code: ' + couponData.code
          + '\nExpiry: ' + expiryStr;
        var url = 'contact.html?type=general&message=' + encodeURIComponent(msg);
        window.location.href = url;
      });
    }

    // ── Idle detection ──
    function resetIdle() {
      clearTimeout(idleTimer);
      if (!shown && !isDismissedToday()) {
        idleTimer = setTimeout(showCard, IDLE_MS);
      }
    }

    ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(function (evt) {
      document.addEventListener(evt, resetIdle, { passive: true });
    });

    // Start the idle timer
    resetIdle();
  })();

  // ─── Google Translate Drawer ────────────────────────────────────────────────
  (function () {
    var fab = document.getElementById('gt-fab');
    if (!fab) return;

    // Mark brand elements & translate drawer as notranslate
    var noTr = '.scroll-top,.logo-brand,.logo-text,.logo-tagline,.gt-drawer,.gt-fab,.gt-toast,.footer-brand,.footer-copy,.gt-lang-name';
    document.querySelectorAll(noTr).forEach(function (el) {
      el.classList.add('notranslate');
      el.setAttribute('translate', 'no');
    });

    var drawer = document.getElementById('gt-drawer');
    var overlay = document.getElementById('gt-drawer-overlay');
    var closeBtn = document.getElementById('gt-close');
    var toast = document.getElementById('gt-toast');
    var langs = document.querySelectorAll('.gt-lang');
    var gtLoaded = false;
    var gtReady = false;

    function openDrawer() {
      // Close WhatsApp drawer if open
      var waD = document.getElementById('wa-drawer');
      if (waD && waD.classList.contains('is-open')) {
        waD.classList.remove('is-open');
        waD.setAttribute('aria-hidden', 'true');
      }
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (!gtLoaded) loadGT();
    }
    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    fab.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    // Load Google Translate script once
    function loadGT() {
      if (gtLoaded) return;
      gtLoaded = true;
      var s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=_gtInit';
      s.onerror = function () {
        console.warn('Failed to load Google Translate');
        gtLoaded = false; // allow retry
      };
      document.body.appendChild(s);
    }

    //includedLanguages: 'hi,bn,ta,te,mr,gu,kn,ml,pa,as,or,ur,ne,sa,si,en',
    // Expose init callback globally
    window._gtInit = function () {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        //includedLanguages: 'hi,bn,ta,te,mr,gu,kn,ml,pa,or,ur,en',
        includedLanguages: 'hi,bn,ta,te,mr,gu,kn,ml,pa,as,or,ur,ne,sa,si,en',
        layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
        autoDisplay: false
      }, 'google-translate-container');
      gtReady = true;

      // Apply saved preference silently on load
      var saved = localStorage.getItem('evx-lang');
      if (saved && saved !== 'en') applyLang(saved, true);
    };

    function applyLang(code, silent) {
      // For English, reset to original page
      if (code === 'en') {
        // Remove Google Translate cookie to revert
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname;
        localStorage.setItem('evx-lang', 'en');
        highlightLang('en');
        if (!silent) showToast();
        // Reload to clear translation
        location.reload();
        return;
      }

      var combo = document.querySelector('.goog-te-combo');
      if (!combo) {
        // Combo not ready yet -- retry a few times
        var retries = 0;
        var retryIv = setInterval(function () {
          combo = document.querySelector('.goog-te-combo');
          if (combo) {
            clearInterval(retryIv);
            doApply(combo, code, silent);
          } else if (++retries > 30) {
            clearInterval(retryIv);
            console.warn('Google Translate combo not found');
          }
        }, 200);
        return;
      }
      doApply(combo, code, silent);
    }

    function doApply(combo, code, silent) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
      localStorage.setItem('evx-lang', code);
      highlightLang(code);
      if (!silent) showToast();
      hideGTBar();
    }

    function highlightLang(code) {
      langs.forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-lang') === code);
      });
    }

    function showToast() {
      if (!toast) return;
      toast.classList.add('is-show');
      setTimeout(function () { toast.classList.remove('is-show'); }, 2500);
    }

    // Remove Google's injected top bar
    function hideGTBar() {
      var tries = 0;
      var iv = setInterval(function () {
        var frame = document.querySelector('.goog-te-banner-frame');
        if (frame) frame.style.display = 'none';
        document.body.style.top = '0px'; 

        var element = document.getElementById('goog-gt-tt');
        if (element) {
            element.style.display = 'none';
        }
        const iframe = document.querySelector('.skiptranslate iframe');
        if (iframe) {
            iframe.style.display = 'none';
        }

        const base = document.getElementById("goog-gt-tt");

        if(base){
        // move past the <script>, then find the next DIV containing svg
        let el = base.nextSibling;
          if(el)
          {
        while (el) {
          if (
            el.nodeType === 1 &&              // ELEMENT_NODE
            el.tagName === "DIV" &&
            el.querySelector("div > svg")
          ) {
            break;
          }
          el = el.nextSibling;
        }
      }

        if (el) {
          el.style.display = 'none';
        }
      }

        if (++tries > 20) clearInterval(iv);
      }, 100);
    }

    // Set up a MutationObserver to watch for DOM changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
      if (!mutation.addedNodes) return;

      // Check if the element was added directly
      if (document.getElementById('goog-gt-tt')) {
        hideGTBar();
          //observer.disconnect(); // Stop observing once done (optional)
      }

      // Check if any added nodes contain the element
      mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.id === 'goog-gt-tt') {
                hideGTBar();
                  //observer.disconnect();
              }
              // Also check descendants in case it's nested
              if (node.querySelector('#goog-gt-tt')) {
                hideGTBar();
                  //observer.disconnect();
              }
          }
      });
  });
});

// Start observing the entire document
observer.observe(document.body, {
  childList: true,  // Observe direct children
  subtree: true     // Observe all descendants
});

hideGTBar();
    // Language item clicks
    langs.forEach(function (item) {
      item.addEventListener('click', function () {
        var code = this.getAttribute('data-lang');
        
        if (gtReady) {
          applyLang(code);
        } else {
          loadGT();
          var waitIv = setInterval(function () {
            if (gtReady) { clearInterval(waitIv); applyLang(code); }
          }, 200);
        }
        closeDrawer();
      });
    });

    // On page load, apply saved language
    var saved = localStorage.getItem('evx-lang');
    if (saved) highlightLang(saved);
    if (saved && saved !== 'en') {
      loadGT();
      var waitIv = setInterval(function () {
        if (gtReady) { clearInterval(waitIv); applyLang(saved, true); }
      }, 300);
    }
  })();

  /* ═══ CTA Stats Fade-In/Fade-Out Rotator ═══ */
  (function () {
    var container = document.getElementById('cta-stats-rotator');
    if (!container) return;

    var allStats = Array.prototype.slice.call(container.querySelectorAll('.locations-cta-stat'));
    if (!allStats.length) return;

    var perPage = window.innerWidth <= 480 ? 2 : 2;
    var page = 0;
    var totalPages = Math.ceil(allStats.length / perPage);

    function showPage(idx) {
      var start = idx * perPage;
      var end = start + perPage;

      // Fade out current visible
      allStats.forEach(function (el) {
        if (el.classList.contains('cta-stat--visible')) {
          el.classList.remove('cta-stat--visible');
          el.classList.add('cta-stat--fading');
        }
      });

      // After fade-out, swap to new set
      setTimeout(function () {
        allStats.forEach(function (el, i) {
          el.classList.remove('cta-stat--fading', 'cta-stat--visible');
          if (i >= start && i < end) {
            el.classList.add('cta-stat--visible');
          }
        });
      }, 500);
    }

    // Show first page immediately
    allStats.forEach(function (el, i) {
      if (i < perPage) el.classList.add('cta-stat--visible');
    });

    // Rotate every 3 seconds
    setInterval(function () {
      page = (page + 1) % totalPages;
      showPage(page);
    }, 3000);

    // Update perPage on resize
    window.addEventListener('resize', function () {
      perPage = window.innerWidth <= 480 ? 3 : 4;
      totalPages = Math.ceil(allStats.length / perPage);
    });
  })();

  /* ═══ Quick Booking – tap toggle on mobile ═══ */
  (function () {
    var wrap = document.getElementById('qb-wrap');
    var fab  = document.getElementById('qb-fab');
    if (!wrap || !fab) return;

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.toggle('qb-open');
    });

    // Close flyout when tapping outside
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('qb-open');
      }
    });

    // Close flyout when a link is clicked
    wrap.querySelectorAll('.qb-flyout-item').forEach(function (item) {
      item.addEventListener('click', function () {
        wrap.classList.remove('qb-open');
      });
    });
  })();

  /* ═══ About Page – Proof Ticker (infinite marquee) ═══ */
  (function () {
    var track = document.getElementById('proof-ticker-track');
    if (!track) return;
    /* Duplicate all cards once so the track is 2× width → seamless loop */
    var cards = Array.prototype.slice.call(track.children);
    cards.forEach(function (c) { track.appendChild(c.cloneNode(true)); });
  })();

})();
