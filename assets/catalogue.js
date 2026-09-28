/* =====================================================================
   2DKR — CATALOGUE (fichier unique des prix)
   ---------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour changer un prix, un pack ou une
   promo. La page Services et le Calculateur se mettent à jour tout seuls.

   - prix       : prix normal (en €)
   - prixPromo  : prix pendant la promo (laisser vide / supprimer si pas de promo)
   - promo.fin  : date et heure de fin. Après cette date, la promo
                  disparaît toute seule et les prix normaux s'affichent.
   - nouveauxTarifs : nouveaux prix appliqués automatiquement à partir de
                  "date". Avant cette date, le site prévient les clients.
                  Une fois la date passée, tu peux recopier ces prix dans
                  "prix" et vider la liste.
   - valeur (packs) : ce que le contenu du pack coûterait à la carte
                  (id d'une option ou d'un compte, et quantité). Sert à
                  afficher la "valeur à la carte" barrée à côté du prix.

   Astuce : ajoute ?apercu=2026-10-08 à l'adresse d'une page pour voir le
   site comme s'il était à cette date (rien n'est changé pour les autres).
   ===================================================================== */

window.DKR_CATALOGUE = {

  promo: {
    titre: 'Promo Septembre',
    reduction: "jusqu'à -30%",
    texte: 'sur tous les packs, tout le mois de septembre !',
    fin: '2026-09-30T23:59:59+02:00'
  },

  nouveauxTarifs: {
    date: '2026-10-07T00:00:00+02:00',
    annonce: 'Nouveaux tarifs à partir du mardi 7 octobre',
    detail: "Les commandes passées avant cette date gardent l'ancien prix.",
    prix: {
      bronze: 9, argent: 15, or: 22, platine: 29, ultime: 65,
      'compte-simple': 22, 'compte-complet': 35,
      m20: 5, m30: 7, m50: 10
    }
  },

  // Texte affiché sous les prix et dans la section "Paiement & frais"
  frais: 'Prix final · aucun frais ajouté',

  // Packs : chaque info a sa propre ligne, pour les cartes ET le tableau comparatif.
  //   argent   : montant affiché       delai     : estimation
  //   vehicules / tenues : nombre (ou texte, ex. '20 (max)')
  //   rp       : niveau RP             stats     : true = stats max incluses
  //   bonus    : liste des extras      compteNeuf: true = compte fourni (jeu inclus)
  //   populaire: true = mis en avant
  packs: [
    {
      id: 'bronze', nom: 'Pack Bronze', badge: 'Bronze', style: 'bronze',
      prix: 5, prixPromo: 3,
      argent: '50 000 000$', delai: '2 jours', vehicules: 5, tenues: 5, rp: '120', stats: true,
      bonus: [],
      valeur: [['m50', 1], ['v10', 0.5], ['t5', 1], ['niveau', 1], ['stats', 1]],
      info: 'Réalisé sur votre compte'
    },
    {
      id: 'argent', nom: 'Pack Argent', badge: 'Argent', style: 'silver',
      prix: 10, prixPromo: 7,
      argent: '100 000 000$', delai: '4 jours', vehicules: 10, tenues: 10, rp: '200', stats: true,
      bonus: ['Déblocages RP'],
      valeur: [['m100', 1], ['v10', 1], ['t5', 2], ['niveau', 1], ['stats', 1]],
      info: 'Réalisé sur votre compte'
    },
    {
      id: 'or', nom: 'Pack Or', badge: 'Or', style: 'gold',
      prix: 15, prixPromo: 11,
      argent: '150 000 000$', delai: '5 jours', vehicules: 15, tenues: 15, rp: 'Au choix', stats: true,
      bonus: ['Déblocages', 'Toutes les armes'],
      valeur: [['m100', 1], ['m50', 1], ['v10', 1.5], ['t5', 3], ['niveau', 1], ['stats', 1]],
      info: 'Réalisé sur votre compte'
    },
    {
      id: 'platine', nom: 'Pack Platine', badge: 'Platine', style: 'plat',
      prix: 20, prixPromo: 14,
      argent: '200 000 000$', delai: '7 jours', vehicules: 20, tenues: '20 (max)', rp: 'Au choix', stats: true,
      bonus: ['Tous déblocages', 'Manoirs', 'Armes', 'Business'],
      valeur: [['m200', 1], ['v10', 2], ['t20', 1], ['niveau', 1], ['stats', 1]],
      info: 'Réalisé sur votre compte'
    },
    {
      id: 'ultime', nom: 'Pack Ultime', badge: 'Ultime · Populaire', style: 'ultimate', populaire: true,
      prix: 60, prixPromo: 50,
      argent: '300 000 000$', delai: '10 jours', vehicules: 30, tenues: 20, rp: 'Au choix', stats: true,
      bonus: ['Business', 'Manoirs', 'Armes'],
      compteNeuf: true,
      valeur: [['compte-simple', 1], ['m200', 1], ['m100', 1], ['v10', 3], ['t20', 1], ['niveau', 1], ['stats', 1]],
      info: 'Prêt à jouer'
    }
  ],

  // unique: true = une seule option de ce groupe à la fois dans le calculateur
  options: [
    {
      id: 'argent', titre: 'Argent supplémentaire', titreCalc: 'Argent GTA Online', icone: 'fa-coins', unique: true,
      items: [
        { id: 'm10',  nom: '+10M GTA$',  detail: '+10 000 000$',  delai: '24h',     prix: 3 },
        { id: 'm20',  nom: '+20M GTA$',  detail: '+20 000 000$',  delai: '24h',     prix: 4 },
        { id: 'm30',  nom: '+30M GTA$',  detail: '+30 000 000$',  delai: '24h',     prix: 5 },
        { id: 'm50',  nom: '+50M GTA$',  detail: '+50 000 000$',  delai: '48h',     prix: 7 },
        { id: 'm100', nom: '+100M GTA$', detail: '+100 000 000$', delai: '4 jours', prix: 18 },
        { id: 'm200', nom: '+200M GTA$', detail: '+200 000 000$', delai: '7 jours', prix: 30 }
      ]
    },
    {
      id: 'niveau', titre: 'Niveau & Stats', titreCalc: 'Niveau & Statistiques', icone: 'fa-chart-line', unique: false,
      items: [
        { id: 'niveau', nom: 'Niveau au choix', detail: 'Niveau au choix', prix: 5 },
        { id: 'stats',  nom: 'Stats max',       detail: 'Stats max (Course, Tir, Apnée...)', prix: 2 }
      ]
    },
    {
      id: 'vehicules', titre: 'Véhicules & Tenues', titreCalc: 'Véhicules & Tenues', icone: 'fa-car', unique: false,
      items: [
        { id: 'v10', nom: '10 Véhicules moddés', prix: 10 },
        { id: 't5',  nom: '5 Tenues moddées',    prix: 5, groupe: 'tenues' },
        { id: 't20', nom: '20 Tenues (Max)',     prix: 20, groupe: 'tenues' }
      ]
    }
  ],

  comptes: [
    {
      id: 'compte-complet', nom: 'Compte Complet',
      description: 'Compte fourni avec jeu inclus + 30M offerts + RP 120.',
      prix: 30, prixPromo: 22
    },
    {
      id: 'compte-simple', nom: 'Option Compte Simple',
      description: 'Compte fourni avec le jeu inclus.',
      prix: 20, prixPromo: 14
    }
  ]
};

/* ---------- Outils (ne pas modifier) ---------- */
window.DKR = {
  catalogue: window.DKR_CATALOGUE,

  // Heure actuelle (ou date d'aperçu avec ?apercu=AAAA-MM-JJ dans l'adresse)
  maintenant: function () {
    try {
      var a = new URLSearchParams(location.search).get('apercu');
      if (a && !isNaN(new Date(a + 'T12:00:00+02:00'))) return new Date(a + 'T12:00:00+02:00').getTime();
    } catch (e) {}
    return Date.now();
  },

  promoActive: function () {
    var p = window.DKR_CATALOGUE.promo;
    return !!(p && p.fin && DKR.maintenant() < new Date(p.fin).getTime());
  },

  nouveauxTarifsActifs: function () {
    var n = window.DKR_CATALOGUE.nouveauxTarifs;
    return !!(n && n.date && DKR.maintenant() >= new Date(n.date).getTime());
  },

  // Les nouveaux tarifs sont annoncés mais pas encore en place
  nouveauxTarifsAVenir: function () {
    var n = window.DKR_CATALOGUE.nouveauxTarifs;
    return !!(n && n.date && Object.keys(n.prix || {}).length && !DKR.nouveauxTarifsActifs());
  },

  // Prix normal (hors promo), en tenant compte des nouveaux tarifs
  prixNormal: function (item) {
    var n = window.DKR_CATALOGUE.nouveauxTarifs;
    if (DKR.nouveauxTarifsActifs() && n.prix[item.id] != null) return n.prix[item.id];
    return item.prix;
  },

  // Prix réellement payé : prix promo si la promo est en cours, sinon prix normal
  prixDe: function (item) {
    return DKR.enPromo(item) ? item.prixPromo : DKR.prixNormal(item);
  },

  enPromo: function (item) {
    return item.prixPromo != null && DKR.promoActive();
  },

  // Ce que coûterait le contenu d'un pack acheté à la carte
  valeurCarte: function (pack) {
    if (!pack.valeur || !window.DKRPanier) return null;
    return Math.round(pack.valeur.reduce(function (s, v) {
      var item = DKRPanier.trouver(v[0]);
      return s + (item ? DKR.prixDe(item) * v[1] : 0);
    }, 0));
  }
};
