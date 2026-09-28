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
        return item ? { id: a.id, nom: item.nom, prix: DKR.prixDe(item) } : null;
      }).filter(Boolean);
    } catch (e) { return []; }
  }

  function ecrire(liste) {
    try { localStorage.setItem(CLE, JSON.stringify(liste.map(function (a) { return { id: a.id }; }))); } catch (e) {}
    abonnes.forEach(function (f) { f(liste); });
  }

  var panier = lire();

  window.DKRPanier = {
    DISCORD: DISCORD,
    trouver: trouver,
    liste: function () { return panier.slice(); },
    total: function () { return panier.reduce(function (s, a) { return s + a.prix; }, 0); },
    ajouter: function (id) {
      var item = trouver(id);
      if (!item) return;
      panier.push({ id: id, nom: item.nom, prix: DKR.prixDe(item) });
      ecrire(panier);
    },
    retirer: function (index) { panier.splice(index, 1); ecrire(panier); },
    vider: function () { panier = []; ecrire(panier); },
    surChangement: function (f) { abonnes.push(f); f(panier.slice()); },

    // Texte à coller dans le ticket Discord
    recap: function (articles) {
      articles = articles || panier;
      var total = articles.reduce(function (s, a) { return s + a.prix; }, 0);
      var lignes = ['🛒 Commande 2DKR', ''];
      articles.forEach(function (a) { lignes.push('• ' + a.nom + ' — ' + a.prix + '€'); });
      lignes.push('', 'Frais de service : 0€', 'Total : ' + total + '€');
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
