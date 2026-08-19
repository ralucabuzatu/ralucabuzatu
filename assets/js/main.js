/* =========================================================
   Raluca Buzatu — interacțiuni
   Fără dependențe. Totul degradează elegant dacă ceva nu se încarcă.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- an curent în footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- meniu mobil ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
    };

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- click pe logo => sus de tot ---------- */
  var brand = document.querySelector('.brand[href="#top"]');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', location.pathname);
    });
  }

  /* ---------- butonul Email ----------
     `mailto:` deschide aplicația de email, dar pe calculatoarele unde nu există
     una setată ca implicită (cazul celor care folosesc Gmail doar în browser)
     nu se întâmplă absolut nimic. Ca să nu fie fundătură, copiem adresa în
     clipboard și confirmăm vizual. Link-ul rămâne mailto, deci merge normal
     acolo unde există client de email. */
  var mailLink = document.querySelector('.socials a[href^="mailto:"]');
  if (mailLink) {
    mailLink.addEventListener('click', function () {
      var adresa = mailLink.getAttribute('href').replace(/^mailto:/, '');
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(adresa).then(function () {
        var initial = mailLink.textContent;
        mailLink.textContent = 'Adresă copiată';
        mailLink.classList.add('is-copied');
        setTimeout(function () {
          mailLink.textContent = initial;
          mailLink.classList.remove('is-copied');
        }, 2400);
      }).catch(function () { /* fără clipboard, rămâne doar mailto */ });
    });
  }

  /* ---------- header lipit + bară CTA mobil ---------- */
  var header = document.querySelector('.site-header');
  var mobileCta = document.getElementById('mobileCta');
  var booking = document.getElementById('programeaza');

  var onScroll = function () {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-stuck', y > 8);

    if (mobileCta) {
      // Apare după ce trecem de hero și dispare când suntem în secțiunea de programare.
      var pastHero = y > window.innerHeight * 0.6;
      var inBooking = false;
      if (booking) {
        var r = booking.getBoundingClientRect();
        inBooking = r.top < window.innerHeight && r.bottom > 0;
      }
      mobileCta.classList.toggle('is-visible', pastHero && !inBooking);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- apariție la scroll ---------- */
  var revealTargets = document.querySelectorAll(
    '.need-card, .parcurs-grid li, .offer-block, .price-card, .steps li, .faq details, .about-copy, .about-photo, .contact-form-wrap, .booking-card'
  );

  if ('IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { io.observe(el); });

    // Plasă de siguranță: dacă din orice motiv observatorul nu se declanșează,
    // conținutul devine oricum vizibil. Nimic nu rămâne ascuns.
    setTimeout(function () {
      revealTargets.forEach(function (el) { el.classList.add('is-in'); });
    }, 3000);
  }

  /* =========================================================
     CALENDAR DE PROGRAMĂRI
     Adresa se ia din atributul data-booking-url din HTML.
     Merge cu Calendly (widget oficial) sau cu orice alt link
     care poate fi încărcat într-un iframe (ex. Cal.com).
     Se încarcă abia când vizitatorul ajunge aproape de secțiune.
     ========================================================= */
  var bookingEl = document.getElementById('booking');

  if (bookingEl) {
    var url = bookingEl.getAttribute('data-booking-url') || '';
    var loaded = false;

    var withParams = function (base, extra) {
      var sep = base.indexOf('?') === -1 ? '?' : '&';
      return base + sep + extra;
    };

    var BRAND = '#8A3245';

    // Bucata oficiala de initializare Cal.com (embed.js), impachetata.
    var calBootstrap = function () {
      (function (C, A, L) {
        var p = function (a, ar) { a.q.push(ar); };
        var d = C.document;
        C.Cal = C.Cal || function () {
          var cal = C.Cal, ar = arguments;
          if (!cal.loaded) {
            cal.ns = {}; cal.q = cal.q || [];
            d.head.appendChild(d.createElement('script')).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            var api = function () { p(api, arguments); };
            var ns = ar[1];
            api.q = api.q || [];
            if (typeof ns === 'string') {
              cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ['initNamespace', ns]);
            } else { p(cal, ar); }
            return;
          }
          p(cal, ar);
        };
      })(window, 'https://app.cal.com/embed/embed.js', 'init');
    };

    var loadBooking = function () {
      if (loaded || !url) return;
      loaded = true;
      bookingEl.innerHTML = '';

      if (url.indexOf('cal.com') !== -1) {
        // Widget oficial Cal.com: se redimensioneaza singur, fara derulare interioara.
        var calLink = url.replace(/^https?:\/\/(app\.)?cal\.com\//, '').replace(/\/+$/, '');
        calBootstrap();
        window.Cal('init', { origin: 'https://cal.com' });
        window.Cal('inline', {
          elementOrSelector: '#booking',
          calLink: calLink,
          // `config` ajunge in adresa iframe-ului; fara `theme` aici, Cal preia
          // modul intunecat al sistemului si nu se mai potriveste cu fundalul crem.
          config: { theme: 'light', layout: 'month_view' }
        });
        window.Cal('ui', {
          theme: 'light',            // site-ul e pe crem; fara asta preia tema sistemului
          cssVarsPerTheme: { light: { 'cal-brand': BRAND } },
          styles: { branding: { brandColor: BRAND } },
          hideEventTypeDetails: false,
          layout: 'month_view'
        });

      } else if (url.indexOf('calendly.com') !== -1) {
        // Widget oficial Calendly, colorat in paleta site-ului.
        var widget = document.createElement('div');
        widget.className = 'calendly-inline-widget';
        widget.setAttribute(
          'data-url',
          withParams(url, 'hide_gdpr_banner=1&background_color=ffffff&text_color=241f1d&primary_color=8a3245')
        );
        widget.style.minWidth = '280px';
        widget.style.height = '760px';
        bookingEl.appendChild(widget);

        var s = document.createElement('script');
        s.src = 'https://assets.calendly.com/assets/external/widget.js';
        s.async = true;
        document.body.appendChild(s);

      } else {
        // Orice alta platforma — iframe simplu.
        var frame = document.createElement('iframe');
        frame.src = url;
        frame.title = 'Calendar de programări';
        frame.loading = 'lazy';
        frame.style.height = '820px';
        frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        frame.setAttribute('allow', 'camera; microphone; fullscreen; display-capture; payment');
        bookingEl.appendChild(frame);
      }
    };

    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadBooking(); bio.disconnect(); }
      }, { rootMargin: '400px' });
      bio.observe(bookingEl);
    } else {
      loadBooking();
    }

    // Plasă de siguranță, independentă de IntersectionObserver:
    // dacă secțiunea ajunge aproape de ecran, încărcăm calendarul oricum.
    var checkBooking = function () {
      if (loaded) { window.removeEventListener('scroll', checkBooking); return; }
      if (bookingEl.getBoundingClientRect().top < window.innerHeight + 600) loadBooking();
    };
    window.addEventListener('scroll', checkBooking, { passive: true });

    // Dacă cineva apasă un buton „Programează”, încărcăm imediat.
    document.querySelectorAll('a[href="#programeaza"]').forEach(function (a) {
      a.addEventListener('click', loadBooking);
    });
  }

  /* =========================================================
     FORMULAR DE CONTACT
     ========================================================= */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  var ENDPOINT = 'https://n8n.razvanbuzatu.com/webhook/incepem';

  if (form && status) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!form.reportValidity()) return;

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';

      status.className = 'form-status';
      status.textContent = 'Se trimite…';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Se trimite…'; }

      try {
        var payload = {
          nume: form.nume.value.trim(),
          prenume: form.prenume.value.trim(),
          email: form.email.value.trim(),
          telefon: form.telefon.value.trim(),
          mesaj: form.mesaj.value.trim(),
          acord_gdpr: form.acord.checked,
          source: 'ralucabuzatu.ro',
          timestamp: new Date().toISOString()
        };

        var res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        status.className = 'form-status ok';
        status.textContent = 'Mesajul a ajuns la mine. Îți răspund cât de curând.';
        form.reset();
      } catch (err) {
        status.className = 'form-status err';
        status.innerHTML =
          'Nu am putut trimite mesajul. Încearcă din nou sau ' +
          '<a href="mailto:ralucabuzatu.rb@gmail.com">trimite-mi un email</a>.';
        console.error('Eroare la trimiterea formularului:', err);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    });
  }
})();
