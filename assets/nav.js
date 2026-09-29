/* Menu déroulant « Services » (ordinateur : survol ou clic, téléphone : toujours ouvert dans le menu) */
(function () {
  document.querySelectorAll('.nav-drop').forEach(function (drop) {
    var btn = drop.querySelector('.nav-drop-btn');
    function set(open) {
      drop.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(!drop.classList.contains('open'));
    });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  });
})();

/* Animations des boutons de catégorie et des raccourcis de section.
   Faites en JavaScript pour qu'elles se voient toujours, même si Windows
   a les « effets d'animation » coupés (qui figent les animations CSS). */
window.DKRAnim = (function () {
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Défilement fluide jusqu'à y (durée selon la distance)
  function scrollTo(y, done) {
    var start = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var end = Math.max(0, Math.min(y, max));
    var dist = end - start;
    var dur = Math.min(900, Math.max(350, Math.abs(dist) * 0.45));
    var t0 = null;
    function step(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: start + dist * ease(p), behavior: 'instant' });
      if (p < 1) requestAnimationFrame(step); else if (done) done();
    }
    requestAnimationFrame(step);
  }

  // Petite pulsation pour attirer l'œil
  function pulse(el) {
    if (el && el.animate) el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }],
      { duration: 520, easing: 'ease-out' }
    );
  }

  // Fondu d'opacité vers une valeur
  function fade(el, to) {
    var from = getComputedStyle(el).opacity;
    if (String(from) === String(to)) return;
    if (el.animate) el.animate([{ opacity: from }, { opacity: to }], { duration: 320, easing: 'ease' });
    el.style.opacity = to;
  }

  return { scrollTo: scrollTo, pulse: pulse, fade: fade };
})();

// Raccourcis de section (ex. page Paiements & garanties)
document.querySelectorAll('.page-jump a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    document.querySelectorAll('.page-jump .chip').forEach(function (c) { c.classList.toggle('active', c === a); });
    var y = target.getBoundingClientRect().top + window.scrollY - 100;
    DKRAnim.scrollTo(y, function () {
      history.replaceState(null, '', a.getAttribute('href'));
      DKRAnim.pulse(target.nextElementSibling || target);
    });
  });
});
