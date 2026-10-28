/* DekurMods — page Commande : récapitulatif, coordonnées, moyen de paiement, envoi de la commande */
(function () {
  const $ = s => document.querySelector(s);
  const COM = DKR.catalogue.commission || { libelle: 'Commission', pourcent: 0, detail: '' };
  const arrondi = n => Math.round(n * 100) / 100;
  const PAYPAL = 'https://paypal.me/DekurFreekrd';
  const WALLET = 'HzBYYLgE5aJ9cKG9FmxUv3tZfiMSayd6YdADkVYzQA29';
  const MOYENS = { paypal: 'PayPal', crypto: 'Crypto (SOL / USDC)', virement: 'Virement bancaire' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Articles du panier regroupés (même menu = une ligne avec une quantité)
  function lignes() {
    const map = new Map();
    DKRPanier.liste().forEach(a => {
      const l = map.get(a.id) || { id: a.id, nom: a.nom, prix: a.prix, qte: 0 };
      l.qte++; map.set(a.id, l);
    });
    return [...map.values()];
  }
  function calcul() {
    return DKRPanier.totalAvecCommission();
  }

  function rendre() {
    const ls = lignes(), k = calcul();
    $('#co-count').textContent = ls.reduce((n, l) => n + l.qte, 0);
    $('#co-vide').hidden = !!ls.length;
    $('#co-plein').hidden = !ls.length;
    $('#co-items').innerHTML = ls.map(l =>
      '<li><div class="co-name"><b>' + esc(l.nom) + '</b><span class="mono">' + DKR.euros(l.prix) + ' l\'unité</span>' +
      '<div class="qty"><button type="button" data-moins="' + l.id + '" aria-label="Retirer un ' + esc(l.nom) + '">−</button><span>' + l.qte + '</span>' +
      '<button type="button" data-plus="' + l.id + '" aria-label="Ajouter un ' + esc(l.nom) + '">+</button>' +
      '<button type="button" class="qty-x" data-tout="' + l.id + '" aria-label="Supprimer ' + esc(l.nom) + '">Supprimer</button></div></div>' +
      '<strong>' + DKR.euros(arrondi(l.prix * l.qte)) + '</strong></li>').join('');
    $('#co-sous').textContent = DKR.euros(k.sous);
    $('#co-com-l').textContent = 'Commission et arrondi (' + COM.detail + ')';
    $('#co-com').textContent = DKR.euros(k.com);
    const discountRow = $('#co-discount-row');
    if (discountRow) {
      discountRow.hidden = !k.reductionHalloween;
      $('#co-discount').textContent = '−' + DKR.euros(k.reductionHalloween);
    }
    $('#co-total').textContent = DKR.euros(k.total);
    $('#co-payer').innerHTML = '<i class="fa-solid fa-lock"></i> Valider la commande · ' + DKR.euros(k.total);
  }

  $('#co-items').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const liste = DKRPanier.liste();
    if (b.dataset.plus) DKRPanier.ajouter(b.dataset.plus);
    const dernier = id => liste.map(a => a.id).lastIndexOf(id);
    if (b.dataset.moins) DKRPanier.retirer(dernier(b.dataset.moins));
    if (b.dataset.tout) { let i; while ((i = DKRPanier.liste().map(a => a.id).lastIndexOf(b.dataset.tout)) > -1) DKRPanier.retirer(i); }
  });
  DKRPanier.surChangement(rendre);
  document.addEventListener('dkr:seasonchange', rendre);

  // Pseudo Discord déjà connu si le client est connecté avec Discord
  window.addEventListener('DOMContentLoaded', () => {
    if (window.DKRAuth) DKRAuth.surChangement(etat => { if (etat.user && !$('#co-discord').value) $('#co-discord').value = etat.user.nom; });
  });

  function numero() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return 'DM-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  $('#co-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (!DKRPanier.liste().length) return;
    if (!f.reportValidity()) return;
    const ls = lignes(), k = calcul(), num = numero();
    const moyen = f.paiement.value;
    const cmd = {
      numero: num, email: f.email.value.trim(), discord: f.discord.value.trim(), paiement: MOYENS[moyen],
      articles: ls.map(l => ({ nom: l.nom, prix: l.prix, qte: l.qte })), sous: k.sous, commission: k.com, reductionHalloween: k.reductionHalloween, total: k.total
    };
    const NL = String.fromCharCode(10);
    const txt = ['🛒 Commande DekurMods ' + num, '', 'Discord : ' + cmd.discord, 'E-mail : ' + cmd.email, 'Paiement : ' + cmd.paiement, '']
      .concat(ls.map(l => '• ' + l.nom + (l.qte > 1 ? ' ×' + l.qte : '') + ' — ' + DKR.euros(arrondi(l.prix * l.qte))))
      .concat(['', 'Sous-total : ' + DKR.euros(k.sous), 'Commission et arrondi (' + COM.detail + ') : +' + DKR.euros(k.com)])
      .concat(k.reductionHalloween ? ['Remise Halloween : −' + DKR.euros(k.reductionHalloween)] : [])
      .concat(['Total : ' + DKR.euros(k.total)])
      .join(NL);

    const btn = $('#co-payer'); btn.disabled = true;
    fetch('/api/commande', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) })
      .then(r => r.ok ? r.json() : null).catch(() => null)
      .then(rep => {
        DKRPanier.copier(txt);
        $('#co-num').textContent = num;
        $('#co-total-fin').textContent = DKR.euros(k.total);
        $('#co-recu').hidden = !(rep && rep.envoye);
        document.querySelectorAll('[data-moyen]').forEach(el => el.hidden = el.dataset.moyen !== moyen);
        $('#co-recap').value = txt;
        $('#co-etape').hidden = true;
        $('#co-fini').hidden = false;
        window.scrollTo(0, 0);
        DKRPanier.vider();
      });
  });

  $('#co-wallet').addEventListener('click', () => {
    DKRPanier.copier(WALLET).then(() => { $('#co-wallet').innerHTML = '<i class="fa-solid fa-check"></i> Adresse copiée'; });
  });
  $('#co-copier').addEventListener('click', () => {
    DKRPanier.copier($('#co-recap').value).then(() => { $('#co-copier').innerHTML = '<i class="fa-solid fa-check"></i> Récap copié'; });
  });
  $('#co-paypal').href = PAYPAL;
})();
