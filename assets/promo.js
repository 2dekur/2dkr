(function () {
  function cdText(fin) {
    var ms = new Date(fin).getTime() - Date.now();
    if (ms <= 0) return null;
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60); s %= 60;
    var h = Math.floor(m / 60); m %= 60;
    var d = Math.floor(h / 24); h %= 24;
    if (d > 0) return 'J−' + d + ' \xb7 ' + h + 'h ' + m + 'min';
    if (h > 0) return h + 'h ' + m + 'min';
    return m + 'min ' + s + 's';
  }

  function update() {
    var active = DKR.promoActive();
    var existing = document.querySelector('.promo-banner');
    if (active && document.body && !existing) {
      var p = DKR.catalogue.promo;
      var banner = document.createElement('div');
      banner.className = 'promo-banner';
      banner.innerHTML = '<div class="wrap"><span>DEKURMODS \xb7 PROMO NOVEMBRE</span><a href="services.html#packs"><b>' + p.reduction + '</b> ' + p.texte + '<small>Jusqu’au 30 novembre inclus \xb7 heure de Paris \xb7 <span class="promo-cd" id="promo-cd"></span></small></a></div>';
      document.body.prepend(banner);
      var nav = document.querySelector('header.nav');
      if (nav && !nav.querySelector('.promo-mini')) {
        var mini = document.createElement('a');
        mini.className = 'promo-mini';
        mini.href = 'services.html#packs';
        mini.innerHTML = '<b>' + p.reduction + '</b><span>' + p.texte.replace(/ !$/, '') + '</span><span aria-hidden="true">↗</span>';
        nav.append(mini);
      }
      tick(p.fin);
      var end = Date.parse(p.fin);
      var delay = end - Date.now() + 50;
      if (delay > 0) setTimeout(update, Math.min(delay, 2147483647));
    } else if (!active) {
      if (existing) existing.remove();
      var mini = document.querySelector('.promo-mini');
      if (mini) mini.remove();
    }
  }

  function tick(fin) {
    var el = document.getElementById('promo-cd');
    if (!el) return;
    var t = cdText(fin);
    if (!t) { el.textContent = ''; return; }
    el.textContent = t;
    setTimeout(function () { tick(fin); }, t.indexOf('s') !== -1 && t.indexOf('min') !== -1 ? 1000 : 30000);
  }

  update();
  document.addEventListener('DOMContentLoaded', update, { once: true });
})();
