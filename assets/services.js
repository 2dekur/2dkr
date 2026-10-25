/* Packs, options et comparateur : mêmes données et même panier que la boutique. */
(function () {
  const c = DKR.catalogue;
  const money = DKR.euros;
  const esc = v => String(v).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const commission = (c.commission || {}).pourcent || 0;
  const total = item => DKR.prixAvecCommission(DKR.prixDe(item) + DKR.fraisDe(item));
  const add = item => '<button class="btn sv-add" type="button" data-service-add="' + esc(item.id) + '">Ajouter au panier <i class="fa-solid fa-plus" aria-hidden="true"></i></button>';
  const price = item => '<div class="sv-price"><strong>' + money(total(item)) + '</strong><span>commission comprise</span><small>' + money(DKR.prixDe(item)) + ' + commission et arrondi</small></div>';
  const feature = (label, value) => '<li><span>' + label + '</span><b>' + esc(value) + '</b></li>';

  document.querySelector('#sv-packs').innerHTML = c.packs.map((p,i) => '<article class="sv-pack sv-' + esc(p.style) + '">' +
    '<div class="sv-pack-top"><span class="mono">FORMULE 0' + (i+1) + '</span><span class="sv-tier">' + (p.compteNeuf ? 'Compte + jeu inclus' : 'Ton compte') + '</span></div>' +
    '<h3>' + esc(p.nom.replace('Pack ','')) + '</h3><p class="sv-cash">' + esc(p.argent.replace(' 000 000$', 'M')) + '<span> GTA$</span></p>' +
    price(p) + '<ul class="sv-features">' + feature('Niveau RP',p.rp) + feature('Véhicules moddés',p.vehicules) + feature('Tenues moddées',p.tenues) + feature('Stats max',p.stats ? 'Incluses' : 'Non incluses') + feature('Délai estimé',p.delai) + '</ul>' +
    '<p class="sv-bonus">' + (p.bonus.length ? esc(p.bonus.join(' · ')) : 'Les essentiels, sans options supplémentaires.') + '</p>' + add(p) + '</article>').join('');

  const rows = [ ['Total avec commission', p => money(total(p))], ['Argent GTA$', p => p.argent], ['Niveau RP', p => p.rp], ['Véhicules', p => p.vehicules], ['Tenues', p => p.tenues], ['Délai estimé', p => p.delai], ['Compte avec jeu', p => p.compteNeuf ? 'Inclus' : 'Non inclus'], ['Bonus', p => p.bonus.join(', ') || '—'] ];
  document.querySelector('#sv-compare').innerHTML = '<table><caption class="sr-only">Comparaison des cinq packs GTA Online</caption><thead><tr><th scope="col">Dans ton pack</th>' + c.packs.map(p=>'<th scope="col">'+esc(p.nom)+'</th>').join('') + '</tr></thead><tbody>' + rows.map(([label,f])=>'<tr><th scope="row">'+label+'</th>'+c.packs.map(p=>'<td>'+esc(f(p))+'</td>').join('')+'</tr>').join('') + '</tbody></table>';

  document.querySelector('#sv-options').innerHTML = c.options.map(g => '<article class="sv-option-group"><div class="sv-group-title"><i class="fa-solid ' + esc(g.icone) + '" aria-hidden="true"></i><h3>' + esc(g.titre) + '</h3></div>' + g.items.map(o=>'<div class="sv-option"><div><h4>'+esc(o.nom)+'</h4>'+(o.delai?'<small>Délai estimé : '+esc(o.delai)+'</small>':'')+'</div><div class="sv-option-buy"><b>'+money(total(o))+'</b><button class="add" type="button" data-service-add="'+esc(o.id)+'" aria-label="Ajouter '+esc(o.nom)+' au panier"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></div></div>').join('')+'</article>').join('');

  document.querySelector('#sv-accounts').innerHTML = c.comptes.map(a=>'<article class="sv-account"><div><span class="mono">Compte fourni</span><h3>'+esc(a.nom)+'</h3><p>'+esc(a.description)+'</p></div><div>'+price(a)+add(a)+'</div></article>').join('');
  document.querySelectorAll('.sv-commission').forEach(e=>e.textContent=commission+' %');
  document.querySelector('#sv-from').textContent=money(Math.min(...c.packs.map(total)));

  document.querySelector('main').addEventListener('click', e => {
    const b=e.target.closest('[data-service-add]');
    if (!b) return;
    DKRPanier.ajouter(b.dataset.serviceAdd);
    document.querySelector('#sv-feedback').textContent=DKRPanier.trouver(b.dataset.serviceAdd).nom+' ajouté au panier.';
    document.querySelector('#cart-open').click();
  });
})();
