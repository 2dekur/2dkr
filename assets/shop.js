(function () {
  var $ = function (s) { return document.querySelector(s); };
  // apparition au défilement
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) els.forEach(function (e) { e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 });
    els.forEach(function (e) { io.observe(e); });
  }
  // menus déroulants
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.burger[open], details.user[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
    if (e.target.closest('.burger-menu a')) document.querySelectorAll('details.burger[open]').forEach(function (d) { d.open = false; });
  });
  // pastille du panier
  if (window.DKRPanier) DKRPanier.surChangement(function (l) { var n = $('#cart-count'); if (n) { n.textContent = l.length; n.hidden = !l.length; } });
  // compte Discord
  window.addEventListener('DOMContentLoaded', function () {
    if (!window.DKRAuth) return;
    DKRAuth.surChangement(function (etat) {
      if (!etat.configured) return;
      var login = $('#auth-login'), loginM = $('#auth-login-m'), user = $('#auth-user');
      if (!etat.user) { login.href = loginM.href = DKRAuth.urlConnexion(); login.hidden = loginM.hidden = false; return; }
      user.querySelector('img').src = etat.user.avatar;
      user.querySelector('.pseudo').textContent = etat.user.nom;
      user.querySelector('.info').textContent = etat.user.verifie ? 'Client vérifié ✓' : 'Connecté avec Discord';
      user.querySelector('.logout').addEventListener('click', DKRAuth.deconnexion);
      user.hidden = false;
    });
  });
})();
