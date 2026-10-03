/* 2DKR — Panier partagé entre Services et Calculateur (gardé dans le navigateur) */
(function () {
  var CLE = '2dkr-panier';
  var DISCORD = 'https://discord.gg/sUAdU5v9aD';
  var abonnes = [];

  // Retrouve un article du catalogue par son id (packs, comptes, options)
  function trouver(id) {
    var c = DKR.catalogue;
    var tous = c.packs.concat(c.comptes, c.menus || []);
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
    return { id: item.id, nom: item.nom, prix: DKR.prixDe(item), frais: DKR.fraisDe(item), sansCode: !!item.sansCode };
  }

  function somme(liste, cle) {
    return Math.round(liste.reduce(function (s, a) { return s + (a[cle] || 0); }, 0) * 100) / 100;
  }

  // Articles sur lesquels un code promo / parrain peut s'appliquer (pas les mod menus)
  function eligibles(liste) { return liste.filter(function (a) { return !a.sansCode; }); }

  var panier = lire();

  /* ---------- Code promo / parrain (un seul par commande, gardé dans le navigateur) ---------- */
  var CLE_CODE = '2dkr-code';
  var codeActif = null; // { code, type: 'bienvenue' | 'parrain', reduction, minimum, nom, filleuls }

  function normaliser(c) { return String(c || '').toUpperCase().replace(/\s+/g, ''); }

  // Empreinte SHA-256 de « 2DKR:CODE » (les codes parrain ne sont jamais écrits en clair)
  function empreinte(code) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve(null);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode('2DKR:' + code)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  // Cherche un code : renvoie ses infos, ou null s'il n'existe pas
  function chercherCode(code) {
    var c = DKR.catalogue.codes;
    if (!c || !code) return Promise.resolve(null);
    if (c.bienvenue && normaliser(c.bienvenue.code) === code) {
      return Promise.resolve({ code: code, type: 'bienvenue', reduction: c.bienvenue.reduction, minimum: c.bienvenue.minimum || 0 });
    }
    return empreinte(code).then(function (h) {
      var p = h && c.parrains && c.parrains[h];
      return p ? { code: code, type: 'parrain', reduction: c.parrainage.reduction, minimum: 0, nom: p.nom, filleuls: p.filleuls || 0 } : null;
    });
  }

  function prevenir() { abonnes.forEach(function (f) { f(panier.slice()); }); }

  /* Mémoire « code déjà utilisé sur cet appareil » : un code réservé à la 1re commande
     (BIENVENUE, code parrain utilisé par un pote) est noté dès que le récap est copié.
     Simple frein : la vraie vérification se fait dans le ticket (rôle Client Vérifié). */
  var CLE_UTILISES = '2dkr-codes-utilises';
  var DELAI_GRACE = 60 * 60 * 1000; // 1 h pour finir la commande en cours après la copie

  function utilises() {
    try { return JSON.parse(localStorage.getItem(CLE_UTILISES) || '{}') || {}; } catch (e) { return {}; }
  }
  // Le parrain qui a atteint ses potes parrainés garde son code à vie : jamais bloqué
  function premiereCommandeSeulement(info) {
    return info && !(info.type === 'parrain' && info.filleuls >= DKR.catalogue.codes.parrainage.filleulsRequis);
  }
  function dejaUtilise(info, avecGrace) {
    if (!premiereCommandeSeulement(info)) return false;
    var t = utilises()[info.code];
    return !!t && !(avecGrace && Date.now() - t < DELAI_GRACE);
  }
  function marquerUtilise(info) {
    if (!premiereCommandeSeulement(info)) return;
    var u = utilises();
    if (!u[info.code]) { u[info.code] = Date.now(); try { localStorage.setItem(CLE_UTILISES, JSON.stringify(u)); } catch (e) {} }
  }

  /* Vérification côté serveur (v0.5) : quand la connexion Discord est active, un code de
     1re commande est lié au compte Discord. Renvoie null si tout est bon (ou si le serveur
     n'est pas configuré : on garde alors la protection de l'appareil), sinon la raison du refus. */
  function verifierCompte(info) {
    if (!premiereCommandeSeulement(info) || !window.DKRAuth) return Promise.resolve(null);
    return DKRAuth.pret().then(function (e) {
      if (!e.configured) return null;
      if (!e.user) return { ok: false, login: true };
      return DKRAuth.verifierCode(info.code).then(function (r) {
        if (!r || r.serveur === false || r.ok) return null;
        return { ok: false, serveur: r.raison };
      });
    });
  }

  // Code gardé d'une visite à l'autre : on le revérifie au chargement
  // (et on le retire s'il a déjà servi pour une commande copiée il y a plus d'1 h)
  try {
    var garde = localStorage.getItem(CLE_CODE);
    if (garde) chercherCode(garde).then(function (info) {
      if (!info || dejaUtilise(info, true)) return null;
      return verifierCompte(info).then(function (refus) { return refus ? null : info; });
    }).then(function (info) {
      codeActif = info || null;
      if (!codeActif) { try { localStorage.removeItem(CLE_CODE); } catch (e) {} }
      prevenir();
    });
  } catch (e) {}

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
    // Réduction du code actif (sur le prix des articles, pas sur les frais)
    reduction: function (liste) {
      liste = liste || panier;
      if (!codeActif || !liste.length) return 0;
      var st = somme(eligibles(liste), 'prix');
      if (!st) return 0;
      if (st < codeActif.minimum) return 0;
      return Math.round(st * codeActif.reduction) / 100;
    },
    // Total à payer, frais compris, réduction déduite
    total: function (liste) {
      liste = liste || panier;
      return Math.round((somme(liste, 'prix') + DKRPanier.frais(liste) - DKRPanier.reduction(liste)) * 100) / 100;
    },

    code: function () { return codeActif; },
    // Applique un code : renvoie une promesse { ok, info }
    appliquerCode: function (saisie) {
      var code = normaliser(saisie);
      return chercherCode(code).then(function (info) {
        if (!info) return { ok: false };
        if (dejaUtilise(info, true)) return { ok: false, deja: true };
        return verifierCompte(info).then(function (refus) {
          if (refus) return refus;
          codeActif = info;
          try { localStorage.setItem(CLE_CODE, code); } catch (e) {}
          prevenir();
          return { ok: true, info: info };
        });
      });
    },
    retirerCode: function () {
      codeActif = null;
      try { localStorage.removeItem(CLE_CODE); } catch (e) {}
      prevenir();
    },
    // Phrase qui explique le code actif (et s'il manque des € pour l'utiliser)
    texteCode: function (liste) {
      liste = liste || panier;
      var c = codeActif;
      if (!c) return '';
      var p = DKR.catalogue.codes.parrainage;
      var aDesMenus = liste.some(function (a) { return a.sansCode; });
      var stEligible = somme(eligibles(liste), 'prix');
      var horsMenus = aDesMenus ? ' Les mod menus ne sont pas concernés par les codes.' : '';
      var nomCode = c.type === 'bienvenue' ? 'Code de bienvenue' : 'Code parrain de ' + c.nom;
      // Panier avec seulement des mod menus : le code n'a rien sur quoi s'appliquer
      if (aDesMenus && liste.length && !stEligible) {
        return nomCode + ' : ne s\'applique pas aux mod menus. Ajoute un pack ou une option pour en profiter.';
      }
      if (c.type === 'bienvenue') {
        var manque = c.minimum - stEligible;
        return manque > 0
          ? 'Code de bienvenue : -' + c.reduction + ' % sur ton 1er achat dès ' + DKR.euros(c.minimum) +
            (aDesMenus ? ' de packs ou options (hors mod menus)' : '') + '. Ajoute encore ' + DKR.euros(manque) + ' pour l\'utiliser.'
          : 'Code de bienvenue : -' + c.reduction + ' % sur ton 1er achat.' + horsMenus;
      }
      return 'Code parrain de ' + c.nom + ' : -' + c.reduction + ' % sur ta 1re commande.' +
        (c.filleuls >= p.filleulsRequis
          ? ' ' + c.nom + ' a l\'avantage parrain à vie.'
          : ' (' + c.nom + ' : ' + c.filleuls + '/' + p.filleulsRequis + ' potes parrainés)') + horsMenus;
    },
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
      // Compte Discord connecté : le ticket indique tout de suite qui commande et son statut
      var compte = window.DKRAuth && DKRAuth.etat().user;
      if (compte) lignes.push('Discord : ' + compte.nom + (compte.verifie ? ' (Client vérifié)' : ''), '');
      articles.forEach(function (a) {
        lignes.push('• ' + a.nom + ' — ' + DKR.euros(a.prix) + (a.frais ? ' (+' + DKR.euros(a.frais) + ' de frais)' : ''));
      });
      lignes.push('');
      var red = DKRPanier.reduction(articles);
      // Lignes sous-total / frais / réduction seulement si besoin
      if (DKRPanier.frais(articles) || red) lignes.push('Sous-total : ' + DKR.euros(DKRPanier.sousTotal(articles)));
      if (DKRPanier.frais(articles)) {
        lignes.push('Frais : ' + DKR.euros(DKRPanier.frais(articles)) + (DKR.fraisFixe() ? ' (dont ' + DKR.euros(DKR.fraisFixe()) + ' par commande)' : ''));
      }
      if (red) {
        lignes.push('Code ' + codeActif.code + ' (-' + codeActif.reduction + ' %) : -' + DKR.euros(red) +
          (codeActif.type === 'parrain' ? ' — parrain : ' + codeActif.nom : ' — 1er achat'));
        marquerUtilise(codeActif);
        // Connecté avec Discord : le serveur note aussi que ce compte a utilisé le code
        if (compte && premiereCommandeSeulement(codeActif)) DKRAuth.noterCode(codeActif.code);
      }
      lignes.push('Total : ' + DKR.euros(DKRPanier.total(articles)));
      if (DKR.promoActive()) lignes.push('(' + DKR.catalogue.promo.titre + ' appliquée)');
      return lignes.join('\n');
    },

    // Champ « Code promo ou parrain » dans un conteneur (panier, calculateur)
    //   getListe : renvoie les articles concernés (par défaut, le panier)
    monterChampCode: function (zone, getListe) {
      if (!zone) return;
      getListe = getListe || function () { return panier; };
      zone.className = 'code-zone';
      zone.innerHTML =
        '<label class="code-label" for="' + zone.id + '-input">Code promo ou parrain</label>' +
        '<form class="code-form" novalidate>' +
          '<input type="text" id="' + zone.id + '-input" class="code-input" placeholder="Ex. BIENVENUE10" autocomplete="off" spellcheck="false" maxlength="32">' +
          '<button type="submit" class="code-btn">Appliquer</button>' +
        '</form>' +
        '<div class="code-actif" hidden><span class="code-nom"></span><button type="button" class="code-retirer">Retirer</button></div>' +
        '<p class="code-msg" aria-live="polite"></p>';
      var form = zone.querySelector('.code-form');
      var input = zone.querySelector('.code-input');
      var actif = zone.querySelector('.code-actif');
      var msg = zone.querySelector('.code-msg');

      function afficher() {
        var c = codeActif;
        form.hidden = !!c;
        actif.hidden = !c;
        if (c) {
          zone.querySelector('.code-nom').textContent = c.code;
          var ok = DKRPanier.reduction(getListe()) > 0 || !getListe().length;
          msg.className = 'code-msg ' + (ok ? 'is-ok' : 'is-warn');
          msg.textContent = DKRPanier.texteCode(getListe());
        }
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!input.value.trim()) { msg.className = 'code-msg is-error'; msg.textContent = 'Entre un code.'; return; }
        DKRPanier.appliquerCode(input.value).then(function (r) {
          if (!r.ok) {
            msg.className = 'code-msg is-error';
            if (r.login) {
              msg.textContent = 'Ce code est lié à ton compte : connecte-toi avec Discord pour l\'utiliser. ';
              var lien = document.createElement('a');
              lien.href = DKRAuth.urlConnexion();
              lien.className = 'code-login';
              lien.textContent = 'Se connecter';
              msg.appendChild(lien);
              return;
            }
            var raisons = {
              client_verifie: 'Ce code est réservé à la 1re commande : ton compte Discord a déjà le rôle Client Vérifié.',
              deja_utilise: 'Tu as déjà utilisé ce code avec ton compte Discord : il est réservé à la 1re commande.'
            };
            msg.textContent = r.serveur
              ? (raisons[r.serveur] || 'Ce code ne peut pas être utilisé avec ton compte.')
              : r.deja
                ? 'Tu as déjà utilisé ce code sur cet appareil : il est réservé à la 1re commande.'
                : 'Ce code n\'existe pas. Vérifie l\'orthographe.';
            return;
          }
          input.value = '';
        });
      });
      input.addEventListener('input', function () { if (msg.classList.contains('is-error')) { msg.textContent = ''; msg.className = 'code-msg'; } });
      zone.querySelector('.code-retirer').addEventListener('click', function () { DKRPanier.retirerCode(); msg.textContent = ''; msg.className = 'code-msg'; });
      abonnes.push(afficher);
      afficher();
      return afficher;
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
