(function () {
  function update() {
    if (!window.DKR || !DKR.gta6Actif()) return;
    document.documentElement.classList.add('gta6-event');
    if (document.body && !document.querySelector('.gta6-banner')) {
      var el = document.createElement('div');
      el.className = 'gta6-banner';
      el.innerHTML = '<div class="wrap"><span class="gta6-label">GTA VI — Sortie console</span><a href="https://discord.gg/sUAdU5v9aD" target="_blank">Les services GTA&nbsp;V continuent — rejoins le Discord <b>↗</b></a></div>';
      document.body.prepend(el);
    }
  }
  update();
  document.addEventListener('DOMContentLoaded', update, { once: true });
})();
