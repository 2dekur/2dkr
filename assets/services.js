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
    banner.querySelector('.promo-banner-content').innerHTML =
      '🔥 ' + c.promo.titre + ' — <span>' + c.promo.reduction + '</span> ' + c.promo.texte;
    banner.hidden = false;
    var chip = document.getElementById('chip-promo');
    chip.hidden = false;
    chip.lastChild.textContent = 'Promo ' + c.promo.reduction.replace(/^jusqu'à\s*/i, '');
    document.title = '2DKR — ' + c.promo.titre + ' | Catalogue Lobby & Services';
  }

  // --- Packs
  document.getElementById('packs-grid').innerHTML = c.packs.map(function (p) {
    return '<div class="card card-' + p.style + ' searchable" data-cat="packs' + cats(p) + '">' +
      '<div>' +
        '<span class="card-badge badge-' + p.style + '">' + p.badge + '</span>' +
        '<div class="card-header"><h2>' + p.nom + '</h2>' + prixHTML(p) + '</div>' +
        '<ul class="feature-list">' + p.details.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div>' +
        '<div class="info-box">' + p.info + '</div>' +
        boutonAjout(p) +
      '</div>' +
    '</div>';
  }).join('');

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
