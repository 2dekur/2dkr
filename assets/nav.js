/* Menu déroulant « Services » (ordinateur : survol ou clic, téléphone : toujours ouvert dans le menu) */
(function () {
  document.querySelectorAll('.nav-drop').forEach(function (drop) {
    var btn = drop.querySelector('.nav-drop-btn');
    function set(open) {
      drop.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(!drop.classList.contains('open'));
    });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  });
})();
