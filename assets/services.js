/* 2DKR — Page Services : affiche le catalogue (assets/catalogue.js) et gère le panier */
(function () {
  var c = DKR.catalogue;
  var promo = DKR.promoActive();

  function prixHTML(item, extraStyle) {
    var style = extraStyle ? ' style="' + extraStyle + '"' : '';
    if (DKR.enPromo(item)) {
      return '<div class="price-promo"' + style + '><span class="price-old">' + item.prix + '€</span><span class="price-new">' + item.prixPromo + '€</span></div>';
    }
    return '<div class="price-promo"' + style + '><span class="price-new price-normal">' + item.prix + '€</span></div>';
  }

  function boutonAjout(item, style) {
    return '<button type="button" data-add="' + item.id + '" class="btn btn-blue"' + (style ? ' style="' + style + '"' : '') +
      '><i class="fa-solid fa-cart-plus"></i> Ajouter au panier (' + DKR.prixDe(item) + '€)</button>';
  }

  function cats(item) { return DKR.enPromo(item) ? ' promo' : ''; }

  // --- Bannière + chip promo + titre de l'onglet
  if (promo) {
    var banner = document.getElementById('promo-banner');
    var contenu = banner.querySelector('.promo-banner-content');
    contenu.innerHTML =
      '🔥 ' + c.promo.titre + ' — <span>' + c.promo.reduction + '</span> ' + c.promo.texte +
      ' <em class="promo-more">Voir la fin <i class="fa-solid fa-chevron-right" aria-hidden="true"></i></em>';
    contenu.setAttribute('role', 'button');
    contenu.setAttribute('tabindex', '0');
    contenu.setAttribute('title', 'Voir quand la promo se termine');
    banner.hidden = false;

    // Fenêtre "fin de la promo" : date exacte + compte à rebours
    var dlg = document.getElementById('promo-dialog');
    var fin = new Date(c.promo.fin);
    var chrono = null;
    document.getElementById('promo-dialog-title').textContent = c.promo.titre;
    document.getElementById('promo-end-date').textContent = fin.toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
    }).replace(':', 'h') + ' (heure de Paris)';

    function majChrono() {
      var reste = fin.getTime() - Date.now();
      var el = document.getElementById('promo-countdown');
      if (reste <= 0) { el.textContent = 'La promo est terminée.'; clearInterval(chrono); return; }
      var s = Math.floor(reste / 1000);
      var j = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      el.innerHTML = [[j, 'j'], [h, 'h'], [m, 'min'], [s % 60, 's']]
        .filter(function (x, i) { return i > 0 || x[0] > 0; })
        .map(function (x) { return '<span><strong>' + x[0] + '</strong>' + x[1] + '</span>'; }).join('');
    }

    function ouvrirPromo() {
      majChrono();
      chrono = setInterval(majChrono, 1000);
      dlg.showModal();
    }
    contenu.addEventListener('click', ouvrirPromo);
    contenu.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirPromo(); }
    });
    dlg.addEventListener('close', function () { clearInterval(chrono); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    var chip = document.getElementById('chip-promo');
    chip.hidden = false;
    chip.lastChild.textContent = 'Promo ' + c.promo.reduction.replace(/^jusqu'à\s*/i, '');
    document.title = '2DKR — ' + c.promo.titre + ' | Catalogue Lobby & Services';
  }

  // --- Packs
  function ligne(icone, texte) {
    return '<li><i class="fa-solid ' + icone + '" aria-hidden="true"></i><span>' + texte + '</span></li>';
  }

  function lignesPack(p) {
    var l = [];
    if (p.compteNeuf) l.push(ligne('fa-user-plus', '<strong>Compte neuf fourni</strong> (jeu inclus)'));
    var tenuesMax = /max/i.test(p.tenues);
    l.push(ligne('fa-sack-dollar', 'Argent : <strong>' + p.argent + '</strong>'));
    l.push(ligne('fa-clock', 'Estimation : <strong>' + p.delai + '</strong>'));
    l.push(ligne('fa-car-side', p.vehicules + ' véhicules moddés'));
    l.push(ligne('fa-shirt', parseInt(p.tenues, 10) + ' tenues moddées' + (tenuesMax ? ' (maximum)' : '')));
    l.push(ligne('fa-chart-line', (/choix/i.test(p.rp) ? 'RP au choix' : 'RP ' + p.rp) + (p.stats ? ' · stats max' : '')));
    if (p.bonus.length) l.push(ligne('fa-unlock', p.bonus.join(' · ')));
    return l.join('');
  }

  document.getElementById('packs-grid').innerHTML = c.packs.map(function (p) {
    return '<div class="card card-' + p.style + (p.populaire ? ' card-populaire' : '') + ' searchable" data-cat="packs' + cats(p) + '">' +
      '<div>' +
        '<span class="card-badge badge-' + p.style + '">' + (p.populaire ? '<i class="fa-solid fa-crown" aria-hidden="true"></i> ' : '') + p.badge + '</span>' +
        '<div class="card-header"><h2>' + p.nom + '</h2>' + prixHTML(p) + '</div>' +
        '<ul class="feature-list">' + lignesPack(p) + '</ul>' +
      '</div>' +
      '<div>' +
        '<div class="info-box">' + p.info + '</div>' +
        boutonAjout(p) +
      '</div>' +
    '</div>';
  }).join('');

  // --- Tableau comparatif des packs
  var comparer = document.getElementById('packs-compare');
  if (comparer) {
    var oui = '<i class="fa-solid fa-check cmp-yes" aria-label="Inclus"></i>';
    var non = '<span class="cmp-no" aria-label="Non inclus">—</span>';
    var lignes = [
      ['Prix', function (p) {
        return DKR.enPromo(p)
          ? '<span class="cmp-old">' + p.prix + '€</span> <strong class="cmp-price">' + p.prixPromo + '€</strong>'
          : '<strong class="cmp-price">' + p.prix + '€</strong>';
      }],
      ['Argent', function (p) { return p.argent; }],
      ['Estimation', function (p) { return p.delai; }],
      ['Véhicules moddés', function (p) { return p.vehicules; }],
      ['Tenues moddées', function (p) { return p.tenues; }],
      ['Niveau RP', function (p) { return p.rp; }],
      ['Stats max', function (p) { return p.stats ? oui : non; }],
      ['Déblocages & bonus', function (p) { return p.bonus.length ? p.bonus.join('<br>') : non; }],
      ['Compte neuf fourni', function (p) { return p.compteNeuf ? oui : non; }]
    ];
    comparer.innerHTML =
      '<table class="cmp-table">' +
        '<thead><tr><th scope="col"><span class="sr-only">Critère</span></th>' +
          c.packs.map(function (p) {
            return '<th scope="col" class="cmp-' + p.style + (p.populaire ? ' cmp-pop' : '') + '">' +
              (p.populaire ? '<span class="cmp-flag">Populaire</span>' : '') + p.badge.split(' ·')[0] + '</th>';
          }).join('') +
        '</tr></thead>' +
        '<tbody>' +
          lignes.map(function (l) {
            return '<tr><th scope="row">' + l[0] + '</th>' +
              c.packs.map(function (p) { return '<td' + (p.populaire ? ' class="cmp-pop"' : '') + '>' + l[1](p) + '</td>'; }).join('') +
            '</tr>';
          }).join('') +
          '<tr class="cmp-actions"><th scope="row"></th>' +
            c.packs.map(function (p) {
              return '<td' + (p.populaire ? ' class="cmp-pop"' : '') + '><button type="button" data-add="' + p.id + '" class="btn btn-outline btn-sm" aria-label="Ajouter ' + p.nom + ' au panier"><i class="fa-solid fa-cart-plus"></i></button></td>';
            }).join('') +
          '</tr>' +
        '</tbody>' +
      '</table>';
  }

  // --- Options à la carte (1re carte à gauche, les autres empilées à droite)
  function carteOption(g, style) {
    return '<div class="card searchable" data-cat="options"' + (style ? ' style="' + style + '"' : '') + '>' +
      '<h2><i class="fa-solid ' + g.icone + '" style="color: var(--accent-blue);" aria-hidden="true"></i> ' + g.titre + '</h2>' +
      '<div class="options-list" style="margin-top: 15px;">' +
      g.items.map(function (o) {
        var label = o.nom + (o.delai ? ' (' + o.delai + ')' : '');
        return '<div class="option-row"><span>' + label + '</span><div><span class="option-price">' + DKR.prixDe(o) + '€ </span>' +
          '<button type="button" data-add="' + o.id + '" class="btn btn-outline btn-sm" aria-label="Ajouter ' + o.nom + '"><i class="fa-solid fa-plus"></i></button></div></div>';
      }).join('') +
      '</div></div>';
  }
  var groupes = c.options;
  document.getElementById('options-grid').innerHTML =
    carteOption(groupes[0]) +
    (groupes.length > 1
      ? '<div style="display: flex; flex-direction: column; gap: 20px;">' +
          groupes.slice(1).map(function (g) { return carteOption(g, 'flex: 1;'); }).join('') +
        '</div>'
      : '');

  // --- Comptes
  document.getElementById('comptes-grid').innerHTML = c.comptes.map(function (a) {
    return '<div class="card searchable" data-cat="comptes' + cats(a) + '">' +
      '<h2>' + a.nom + '</h2>' +
      '<p style="color: var(--text-muted); font-size: 0.9rem; margin: 10px 0;">' + a.description + '</p>' +
      prixHTML(a, 'margin-top: 10px;') +
      boutonAjout(a, 'margin-top: 20px;') +
    '</div>';
  }).join('');

  // --- Boutons "ajouter" (avec petit retour visuel)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    DKRPanier.ajouter(btn.getAttribute('data-add'));
    btn.classList.add('added');
    setTimeout(function () { btn.classList.remove('added'); }, 600);
  });

  // --- Barre du panier + fenêtre récapitulatif
  var bar = document.getElementById('cartBar');
  var modal = document.getElementById('orderModal');

  window.openModal = function () { if (DKRPanier.liste().length) modal.classList.add('active'); };
  window.closeModal = function () { modal.classList.remove('active'); };
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  DKRPanier.surChangement(function (liste) {
    var total = DKRPanier.total();
    document.getElementById('cartCount').textContent = liste.length;
    document.getElementById('cartTotal').textContent = total + '€';
    document.getElementById('modalTotal').textContent = total + '€';
    bar.classList.toggle('active', liste.length > 0);
    if (!liste.length) closeModal();

    var ul = document.getElementById('cartItemsList');
    ul.innerHTML = '';
    liste.forEach(function (a, i) {
      var li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = '<span class="cart-item-title"></span><div><span class="cart-item-price">' + a.prix + '€</span>' +
        '<button type="button" class="cart-item-remove" aria-label="Retirer"><i class="fa-solid fa-trash"></i></button></div>';
      li.querySelector('.cart-item-title').textContent = a.nom;
      li.querySelector('.cart-item-remove').addEventListener('click', function () { DKRPanier.retirer(i); });
      ul.appendChild(li);
    });
  });

  // --- Copier le récapitulatif
  function copier(btn) {
    return DKRPanier.copier(DKRPanier.recap()).then(function (ok) {
      if (!btn) return ok;
      var span = btn.querySelector('span') || btn;
      var avant = span.textContent;
      span.textContent = ok ? 'Copié !' : 'Copie impossible';
      btn.classList.toggle('copied', ok);
      setTimeout(function () { span.textContent = avant; btn.classList.remove('copied'); }, 1800);
      return ok;
    });
  }
  document.getElementById('copyRecap').addEventListener('click', function () { copier(this); });
  // Le lien s'ouvre normalement ; on copie juste le récap au passage
  document.getElementById('finishOrder').addEventListener('click', function () { copier(document.getElementById('copyRecap')); });
})();
