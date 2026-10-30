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
    document.querySelectorAll('details.burger[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
    if (e.target.closest('.burger-menu a')) document.querySelectorAll('details.burger[open]').forEach(function (d) { d.open = false; });
  });
  // pastille du panier
  if (window.DKRPanier) DKRPanier.surChangement(function (l) { var n = $('#cart-count'); if (n) { n.textContent = l.length; n.hidden = !l.length; } });
})();
