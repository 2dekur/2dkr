/* DekurMods — boutique, panier, TVA et éléments communs (accueil + boutique) */
(function () {
  const $ = s => document.querySelector(s);
  const menus = (DKR.catalogue.menus || []);

  // --- groupes de menus (Cherax Standard + Premium = une carte)
  const groupes = [];
  menus.forEach(m => {
    let g = groupes.find(x => x.nom === m.menu);
    if (!g) { g = { nom: m.menu, be: !!m.be, vie: !!m.vie, bientot: !!m.bientot, exclusif: !!m.exclusif, items: [] }; groupes.push(g); }
    g.items.push(m);
  });

  const ASSIST = (DKR.catalogue.assistance || {}).prix || 0;
  document.querySelectorAll('.js-assist-prix').forEach(e => e.textContent = DKR.euros(ASSIST));
  const dispo = groupes.filter(g => !g.bientot);
  if ($('#stat-menus')) $('#stat-menus').textContent = dispo.length;
  if ($('.js-menu-names')) $('.js-menu-names').textContent = dispo.map(g => g.nom).join(', ');

  // bandeau défilant (deux fois la liste, pour boucler sans saut)
  const mots = groupes.map(g => g.bientot ? g.nom + ' · bientôt' : g.nom).concat(['Clé dans ton ticket', 'Support FR', 'PC']);
  const ligne = () => '<p>' + [].concat(mots, mots, mots).map(t => '<span>' + t + '</span><b></b>').join('') + '</p>';
  if ($('#marquee')) $('#marquee').innerHTML = ligne() + ligne();

  // --- aperçu sur l'accueil : une tuile par menu, qui mène à la page Boutique
  const teaser = $('#menus-teaser');
  if (teaser) teaser.innerHTML = groupes.map(g => {
    const prix = g.bientot ? 'Bientôt' : 'dès ' + DKR.euros(Math.min.apply(null, g.items.map(i => i.prix)));
    return '<a class="tile' + (g.bientot ? ' tile-gold' : '') + '" href="boutique.html"><b>' + g.nom + '</b><span class="mono">' +
      (g.exclusif ? 'Exclusif · ' : '') + prix + '</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>';
  }).join('');

  // --- boutique (page boutique.html)
  const grid = $('#menus-grid');
  function carte(g) {
    if (g.bientot) return '<article class="mcard mc-gold" data-vie="false" data-be="false">' +
      '<div class="mc-top"><h3>' + g.nom + '</h3><div class="badges">' +
        (g.exclusif ? '<span class="bd gold">Exclusif</span>' : '') + '<span class="bd">Bientôt</span></div></div>' +
      '<p class="mc-sub mono">' + (g.exclusif ? 'Uniquement chez DekurMods' : 'Bientôt disponible') + '</p>' +
      '<p class="mc-text">Nouveau menu, bientôt disponible. ' + (g.exclusif ? 'DekurMods est le seul revendeur à le proposer.' : '') + ' Rejoins le Discord pour être prévenu de sa sortie.</p>' +
      '<a class="btn btn-sm btn-gold" href="https://discord.gg/sUAdU5v9aD" target="_blank"><i class="fa-brands fa-discord"></i> Être prévenu</a></article>';
    const dessous = g.items.length > 1 ? 'dès ' + DKR.euros(Math.min.apply(null, g.items.map(i => i.prix))) : '';
    return '<article class="mcard" data-vie="' + g.vie + '" data-be="' + g.be + '">' +
      '<div class="mc-top"><h3>' + g.nom + '</h3><div class="badges">' +
        (g.be ? '<span class="bd">BE</span>' : '') + (g.vie ? '<span class="bd ok">À vie</span>' : '') + '</div></div>' +
      '<p class="mc-sub mono">' + (g.vie ? 'Licence à vie' : (dessous || 'Licence')) + '</p>' +
      '<ul class="mc-rows">' + g.items.map(m =>
        '<li><span>' + (m.formule || 'Licence') + '</span><b>' + DKR.euros(m.prix) + '</b>' +
        '<button type="button" class="add" data-add="' + m.id + '" aria-label="Ajouter ' + m.nom + ' au panier"><i class="fa-solid fa-cart-plus"></i> Ajouter</button></li>').join('') +
      '</ul></article>';
  }
  if (grid) grid.innerHTML = groupes.map(carte).join('') +
    '<article class="mcard mc-other"><div class="mc-top"><h3>Un autre menu&nbsp;?</h3></div><p class="mc-sub mono">Sur demande</p>' +
    '<p class="mc-text">Demande-moi dans ton ticket, je te le propose.</p>' +
    '<a class="btn btn-sm" href="https://discord.gg/sUAdU5v9aD" target="_blank">Demander</a></article>';

  if ($('#chips')) $('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
    const f = b.dataset.f;
    grid.querySelectorAll('.mcard').forEach(c => {
      c.hidden = f !== 'tous' && (c.classList.contains('mc-other') || c.dataset[f] !== 'true');
    });
  });

  // --- panier
  const cart = $('#cart'), veil = $('#cart-veil');
  function ouvrir(o) {
    cart.classList.toggle('open', o); cart.setAttribute('aria-hidden', !o);
    veil.hidden = !o; document.body.style.overflow = o ? 'hidden' : '';
    if (o) $('#cart-close').focus();
  }
  $('#cart-open').addEventListener('click', () => ouvrir(true));
  $('#cart-close').addEventListener('click', () => ouvrir(false));
  veil.addEventListener('click', () => ouvrir(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ouvrir(false); });

  if (grid) grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    DKRPanier.ajouter(b.dataset.add);
    ouvrir(true);
  });

  function choix() { const r = document.querySelector('[name=assist]:checked'); return r ? r.value : null; }
  const TAXES = (DKR.catalogue.taxes || { libelle: 'TVA', pays: [] });
  let pays = null;
  const finPays = p => { pays = p; $('#cart-pays').textContent = 'Pays détecté : ' + p.nom + ' · ' + TAXES.libelle + ' ' + p.taux + ' %'; majTotal(); };
  const parCode = code => TAXES.pays.find(x => x.code === code) || TAXES.autre;
  const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
  fetch('/api/pays', { signal: ctl.signal, cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(j => finPays(j && j.pays ? parCode(j.pays) : TAXES.defaut))
    .catch(() => finPays(TAXES.defaut));
  const arrondi = n => Math.round(n * 100) / 100;
  function calcul() {
    const liste = DKRPanier.liste(), p = pays;
    const sous = DKRPanier.total(liste), ass = choix() === 'oui' ? ASSIST : 0;
    const ht = arrondi(sous + ass), taux = p ? p.taux : 0, tva = arrondi(ht * taux / 100);
    return { sous, ass, ht, taux, tva, total: arrondi(ht + tva), p };
  }
  function majTotal() {
    const k = calcul();
    let l = '<div><span>Sous-total</span><span>' + DKR.euros(k.sous) + '</span></div>';
    if (k.ass) l += '<div><span>Assistance installation</span><span>' + DKR.euros(k.ass) + '</span></div>';
    if (k.p && k.taux) l += '<div><span>' + TAXES.libelle + ' ' + k.taux + ' % (' + k.p.nom + ')</span><span>' + DKR.euros(k.tva) + '</span></div>';
    $('#cart-lines').innerHTML = l;
    $('#cart-total').textContent = DKR.euros(k.total);
    const ok = !!choix() && !!k.p;
    $('#cart-copy').disabled = !ok;
    $('#cart-need').hidden = ok;
  }
  DKRPanier.surChangement(liste => {
    const n = $('#cart-count'); n.textContent = liste.length; n.hidden = !liste.length;
    $('#cart-empty').hidden = !!liste.length; $('#cart-foot').hidden = !liste.length;
    $('#cart-list').innerHTML = liste.map((a, i) =>
      '<li><span>' + a.nom + '</span><b>' + DKR.euros(a.prix) + '</b><button type="button" data-del="' + i + '" aria-label="Retirer ' + a.nom + '"><i class="fa-solid fa-trash-can"></i></button></li>').join('');
    if (!liste.length) document.querySelectorAll('[name=assist]').forEach(r => r.checked = false);
    majTotal();
  });
  $('#assist').addEventListener('change', majTotal);
  $('#cart-list').addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (b) DKRPanier.retirer(+b.dataset.del);
  });
  $('#cart-clear').addEventListener('click', () => DKRPanier.vider());
  $('#cart-copy').addEventListener('click', () => {
    const k = calcul();
    if (!choix() || !k.p) return;
    const NL = String.fromCharCode(10);
    const lignes = ['Assistance installation : ' + (k.ass ? 'OUI (+' + DKR.euros(ASSIST) + ')' : 'NON'), 'Pays : ' + k.p.nom];
    if (k.taux) lignes.push(TAXES.libelle + ' ' + k.taux + ' % : +' + DKR.euros(k.tva));
    lignes.push('Total : ' + DKR.euros(k.total));
    const txt = DKRPanier.recap().replace(/Total : .*/, lignes.join(NL));
    DKRPanier.copier(txt).then(ok => {
      const b = $('#cart-copy');
      b.innerHTML = ok ? '<i class="fa-solid fa-check"></i> Récap copié, colle-le dans ton ticket' : 'Copie le récap à la main puis ouvre un ticket';
      window.open(DKRPanier.DISCORD, '_blank', 'noopener');
    });
  });
  if (/(^|[?&])panier(=|&|$)/.test(location.search)) ouvrir(true);

  // --- apparition au défilement
  const els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) els.forEach(e => e.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    els.forEach(e => io.observe(e));
  }

  // --- journal des changements
  window.addEventListener('DOMContentLoaded', function () {
    const dlg = $('#changelog');
    if (!dlg || !dlg.showModal) return;
    const open = () => { if (!dlg.open) dlg.showModal(); };
    if ($('#version-badge')) $('#version-badge').addEventListener('click', open);
    dlg.querySelector('.cl-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    if (location.hash === '#changelog') open();
  });

  // --- compte Discord (DKRAuth, assets/nav.js)
  window.addEventListener('DOMContentLoaded', function () {
    if (!window.DKRAuth) return;
    DKRAuth.surChangement(function (etat) {
      if (!etat.configured) return;
      const login = $('#auth-login'), loginM = $('#auth-login-m'), user = $('#auth-user');
      if (!etat.user) { login.href = loginM.href = DKRAuth.urlConnexion(); login.hidden = loginM.hidden = false; return; }
      user.querySelector('img').src = etat.user.avatar;
      user.querySelector('.pseudo').textContent = etat.user.nom;
      user.querySelector('.info').textContent = etat.user.verifie ? 'Client vérifié ✓' : 'Connecté avec Discord';
      user.querySelector('.logout').addEventListener('click', DKRAuth.deconnexion);
      user.hidden = false;
    });
  });
  document.addEventListener('click', e => {
    document.querySelectorAll('details.burger[open], details.user[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; });
    if (e.target.closest('.burger-menu a')) document.querySelectorAll('details.burger[open]').forEach(d => d.open = false);
  });

  // --- membres Discord en direct, sans les bots (BOTS = nombre de bots du serveur)
  const BOTS = 7;
  fetch('https://discord.com/api/v10/invites/sUAdU5v9aD?with_counts=true')
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (j && j.approximate_member_count) document.querySelectorAll('.js-members').forEach(el => el.textContent = j.approximate_member_count - BOTS); })
    .catch(() => {});
})();
