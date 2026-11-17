(function () {
  function update() {
    var active = DKR.promoActive();
    var existing = document.querySelector('.promo-banner');
    if (active && document.body && !existing) {
      var p = DKR.catalogue.promo;
      var banner = document.createElement('div');
      banner.className = 'promo-banner';
      banner.innerHTML = '<div class="wrap"><span>DEKURMODS \xb7 PROMO NOVEMBRE</span><a href="services.html#packs"><b>' + p.reduction + '</b> ' + p.texte + '<small>Jusqu’au 30 novembre inclus \xb7 heure de Paris</small></a></div>';
      document.body.prepend(banner);
      var nav = document.querySelector('header.nav');
      if (nav && !nav.querySelector('.promo-mini')) {
        var mini = document.createElement('a');
        mini.className = 'promo-mini';
        mini.href = 'services.html#packs';
        mini.innerHTML = '<b>' + p.reduction + '</b><span>' + p.texte.replace(/ !$/, '') + '</span><span aria-hidden="true">↗</span>';
        nav.append(mini);
      }
      var end = Date.parse(p.fin);
      var delay = end - Date.now() + 50;
      if (delay > 0) setTimeout(update, Math.min(delay, 2147483647));
    } else if (!active) {
      if (existing) existing.remove();
      var mini = document.querySelector('.promo-mini');
      if (mini) mini.remove();
    }
  }
  update();
  document.addEventListener('DOMContentLoaded', update, { once: true });
})();
