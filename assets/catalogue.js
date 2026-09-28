/* =====================================================================
   2DKR — CATALOGUE (fichier unique des prix)
   ---------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour changer un prix, un pack ou une
   promo. La page Services et le Calculateur se mettent à jour tout seuls.

   - prix       : prix normal (en €)
   - prixPromo  : prix pendant la promo (laisser vide / supprimer si pas de promo)
   - promo.fin  : date et heure de fin. Après cette date, la promo
                  disparaît toute seule et les prix normaux s'affichent.
   ===================================================================== */

window.DKR_CATALOGUE = {

  promo: {
    titre: 'Promo Septembre',
    reduction: "jusqu'à -30%",
    texte: 'sur tous les packs, tout le mois de septembre !',
    fin: '2026-09-30T23:59:59+02:00'
  },

  packs: [
    {
      id: 'bronze', nom: 'Pack Bronze', badge: 'Bronze', style: 'bronze',
      prix: 5, prixPromo: 3,
      details: [
        '💰 <strong>Argent :</strong> 50 000 000$',
        '⏳ <strong>Estimation :</strong> 2 jours',
        '🏎️ 5 Véhicules moddés',
        '👕 5 Tenues moddées',
        '📈 RP 120',
        '📊 Stats max'
      ],
      info: '📦 Réalisé sur votre compte'
    },
    {
      id: 'argent', nom: 'Pack Argent', badge: 'Argent', style: 'silver',
      prix: 10, prixPromo: 7,
      details: [
        '💰 <strong>Argent :</strong> 100 000 000$',
        '⏳ <strong>Estimation :</strong> 4 jours',
        '🏎️ 10 Véhicules moddés',
        '👕 10 Tenues moddées',
        '📈 RP 200 | 📊 Stats max',
        '🔓 Déblocages RP inclus'
      ],
      info: '📦 Réalisé sur votre compte'
    },
    {
      id: 'or', nom: 'Pack Or', badge: 'Or', style: 'gold',
      prix: 15, prixPromo: 11,
      details: [
        '💰 <strong>Argent :</strong> 150 000 000$',
        '⏳ <strong>Estimation :</strong> 5 jours',
        '🏎️ 15 Véhicules moddés',
        '👕 15 Tenues moddées',
        '📈 RP au choix | 📊 Stats max',
        '🔓 Déblocages + 🔫 Toutes les armes'
      ],
      info: '📦 Réalisé sur votre compte'
    },
    {
      id: 'platine', nom: 'Pack Platine', badge: 'Platine', style: 'plat',
      prix: 20, prixPromo: 14,
      details: [
        '💰 <strong>Argent :</strong> 200 000 000$',
        '⏳ <strong>Estimation :</strong> 7 jours',
        '🏎️ 20 Véhicules moddés',
        '👕 20 Tenues (Maximum)',
        '📈 RP au choix | 📊 Stats max',
        '🔓 Tous déblocages + Manoirs + Armes + Business'
      ],
      info: '📦 Réalisé sur votre compte'
    },
    {
      id: 'ultime', nom: 'Pack Ultime', badge: 'Ultime 👑 Populaire', style: 'ultimate',
      prix: 60, prixPromo: 50,
      details: [
        '📦 <strong>Compte neuf fourni</strong> (Jeu inclus)',
        '💰 <strong>Argent :</strong> 300 000 000$',
        '⏳ <strong>Estimation :</strong> 10 jours',
        '🏎️ 30 Véhicules moddés | 👕 20 Tenues',
        '📈 RP au choix | 📊 Stats max',
        '🏢 Business, Manoirs & Armes inclus'
      ],
      info: '🎮 Prêt à jouer'
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

  promoActive: function () {
    var p = window.DKR_CATALOGUE.promo;
    return !!(p && p.fin && Date.now() < new Date(p.fin).getTime());
  },

  // Prix réellement payé : prix promo si la promo est en cours, sinon prix normal
  prixDe: function (item) {
    return (item.prixPromo != null && DKR.promoActive()) ? item.prixPromo : item.prix;
  },

  enPromo: function (item) {
    return item.prixPromo != null && DKR.promoActive();
  }
};
