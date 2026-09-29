/* 2DKR — Panier partagé entre Services et Calculateur (gardé dans le navigateur) */
(function () {
  var CLE = '2dkr-panier';
  var DISCORD = 'https://discord.gg/mDpZT73FFG';
  var abonnes = [];

  // Retrouve un article du catalogue par son id (packs, comptes, options)
  function trouver(id) {
    var c = DKR.catalogue;
    var tous = c.packs.concat(c.comptes);
    c.options.forEach(function (g) { tous = tous.concat(g.items); });
    for (var i = 0; i < tous.length; i++) if (tous[i].id === id) return tous[i];
    return null;
  }

  function lire() {
    try {
      var brut = JSON.parse(localStorage.getItem(CLE) || '[]');
      // Recalcule les prix (si la promo s'est terminée entre-temps) et retire les articles disparus
      return brut.map(function (a) {
        var item = trouver(a.id);
        return item ? article(item) : null;
      }).filter(Boolean);
    } catch (e) { return []; }
  }

  function ecrire(liste) {
    try { localStorage.setItem(CLE, JSON.stringify(liste.map(function (a) { return { id: a.id }; }))); } catch (e) {}
    abonnes.forEach(function (f) { f(liste); });
  }

  // Article du panier : prix payé + frais calculés depuis le catalogue
  function article(item) {
    return { id: item.id, nom: item.nom, prix: DKR.prixDe(item), frais: DKR.fraisDe(item) };
  }

  function somme(liste, cle) {
    return Math.round(liste.reduce(function (s, a) { return s + (a[cle] || 0); }, 0) * 100) / 100;
  }

  var panier = lire();

  window.DKRPanier = {
    DISCORD: DISCORD,
    trouver: trouver,
    liste: function () { return panier.slice(); },
    article: function (id) { var item = trouver(id); return item ? article(item) : null; },
    sousTotal: function (liste) { return somme(liste || panier, 'prix'); },
    // Frais en % des articles + frais fixes (une fois par commande)
    frais: function (liste) {
      liste = liste || panier;
      return liste.length ? Math.round((somme(liste, 'frais') + DKR.fraisFixe()) * 100) / 100 : 0;
    },
    // Total à payer, frais compris
    total: function (liste) { liste = liste || panier; return Math.round((somme(liste, 'prix') + DKRPanier.frais(liste)) * 100) / 100; },
    ajouter: function (id) {
      var item = trouver(id);
      if (!item) return;
      panier.push(article(item));
      ecrire(panier);
    },
    retirer: function (index) { panier.splice(index, 1); ecrire(panier); },
    vider: function () { panier = []; ecrire(panier); },
    surChangement: function (f) { abonnes.push(f); f(panier.slice()); },

    // Texte à coller dans le ticket Discord
    recap: function (articles) {
      articles = articles || panier;
      var lignes = ['🛒 Commande 2DKR', ''];
      articles.forEach(function (a) {
        lignes.push('• ' + a.nom + ' — ' + DKR.euros(a.prix) + (a.frais ? ' (+' + DKR.euros(a.frais) + ' de frais)' : ''));
      });
      lignes.push('');
      // Lignes sous-total / frais seulement s'il y a des frais
      if (DKRPanier.frais(articles)) {
        lignes.push('Sous-total : ' + DKR.euros(DKRPanier.sousTotal(articles)),
          'Frais : ' + DKR.euros(DKRPanier.frais(articles)) + (DKR.fraisFixe() ? ' (dont ' + DKR.euros(DKR.fraisFixe()) + ' par commande)' : ''));
      }
      lignes.push('Total : ' + DKR.euros(DKRPanier.total(articles)));
      if (DKR.promoActive()) lignes.push('(' + DKR.catalogue.promo.titre + ' appliquée)');
      return lignes.join('\n');
    },

    copier: function (texte) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(texte).then(function () { return true; }, function () { return secours(texte); });
      }
      return Promise.resolve(secours(texte));
    }
  };

  function secours(texte) {
    var zone = document.createElement('textarea');
    zone.value = texte;
    zone.setAttribute('readonly', '');
    zone.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(zone);
    zone.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    zone.remove();
    return ok;
  }

  // Synchronise si le panier change dans un autre onglet
  window.addEventListener('storage', function (e) {
    if (e.key === CLE) { panier = lire(); abonnes.forEach(function (f) { f(panier.slice()); }); }
  });
})();
