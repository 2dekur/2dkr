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

/* ---------- Connexion Discord (v0.5) ----------
   Le bouton n'apparaît que si le serveur est configuré (/api/me renvoie configured: true).
   Sans les secrets Cloudflare, le site fonctionne exactement comme avant. */
window.DKRAuth = (function () {
  var etat = { pret: false, configured: false, user: null };
  var abonnes = [];

  function notifier() { abonnes.forEach(function (f) { try { f(etat); } catch (e) {} }); }

  // Page courante sans le paramètre ?connexion=… (pour y revenir après la connexion)
  function retour() {
    var s = location.search.replace(/([?&])connexion=[^&]*&?/, '$1').replace(/[?&]$/, '');
    return location.pathname + s;
  }
  function urlConnexion() { return '/api/auth/login?retour=' + encodeURIComponent(retour()); }

  function post(chemin, corps) {
    return fetch(chemin, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps || {})
    }).then(function (r) { return r.json().then(function (d) { d.statut = r.status; return d; }); })
      .catch(function () { return null; });
  }
  function deconnexion() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .then(function () { location.reload(); }, function () { location.reload(); });
  }

  // Petit message en bas de l'écran
  function flash(texte) {
    var el = document.createElement('div');
    el.className = 'dkr-flash';
    el.setAttribute('role', 'status');
    el.textContent = texte;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 400); }, 4200);
  }

  function monter() {
    if (!etat.configured) return;
    var zone = document.getElementById('nav-links');
    if (!zone || document.getElementById('nav-auth')) return;
    var el;
    if (!etat.user) {
      el = document.createElement('a');
      el.className = 'nav-login';
      el.id = 'nav-auth';
      el.href = urlConnexion();
      el.innerHTML = '<i class="fa-brands fa-discord" aria-hidden="true"></i> <span>Se connecter</span>';
    } else {
      el = document.createElement('div');
      el.className = 'nav-drop nav-user';
      el.id = 'nav-auth';
      el.innerHTML =
        '<button type="button" class="nav-drop-btn" aria-expanded="false" aria-haspopup="true">' +
        '<img class="nav-avatar" alt="" width="24" height="24"><span class="nav-pseudo"></span> <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
        '<div class="nav-drop-menu"><span class="nav-user-info"></span>' +
        '<a href="#" class="nav-logout"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Se déconnecter</a></div>';
      el.querySelector('.nav-avatar').src = etat.user.avatar;
      el.querySelector('.nav-pseudo').textContent = etat.user.nom;
      el.querySelector('.nav-user-info').textContent = etat.user.verifie ? 'Client vérifié ✓' : 'Connecté avec Discord';
      var btn = el.querySelector('.nav-drop-btn');
      var set = function (o) { el.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
      btn.addEventListener('click', function (e) { e.stopPropagation(); set(!el.classList.contains('open')); });
      document.addEventListener('click', function (e) { if (!el.contains(e.target)) set(false); });
      el.querySelector('.nav-logout').addEventListener('click', function (e) { e.preventDefault(); deconnexion(); });
    }
    zone.insertBefore(el, document.getElementById('theme-toggle') || null);
  }

  var promesse = fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (r) { return r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : { configured: false }; })
    .catch(function () { return { configured: false }; })
    .then(function (d) {
      etat = { pret: true, configured: !!d.configured, user: d.user || null };
      monter();
      notifier();
      return etat;
    });

  // Message après le retour de Discord (?connexion=ok / annulee / erreur / indisponible)
  var m = /[?&]connexion=([a-z]+)/.exec(location.search);
  if (m) {
    var textes = {
      ok: 'Connecté avec Discord ✓',
      annulee: 'Connexion annulée.',
      erreur: 'La connexion a échoué, réessaie.',
      indisponible: 'La connexion Discord n\'est pas encore disponible.'
    };
    if (textes[m[1]]) flash(textes[m[1]]);
    try { history.replaceState(null, '', retour() + location.hash); } catch (e) {}
  }

  return {
    etat: function () { return etat; },
    pret: function () { return promesse; },
    surChangement: function (f) { abonnes.push(f); if (etat.pret) f(etat); },
    urlConnexion: urlConnexion,
    deconnexion: deconnexion,
    // Le serveur dit si ce code de 1re commande est utilisable par ce compte
    verifierCode: function (code) {
      if (!etat.configured) return Promise.resolve({ ok: true, serveur: false });
      return post('/api/code/check', { code: code });
    },
    // Appelé quand le récapitulatif est copié : le serveur note que le compte a utilisé le code
    noterCode: function (code) {
      if (etat.configured && etat.user) post('/api/code/use', { code: code });
    }
  };
})();
