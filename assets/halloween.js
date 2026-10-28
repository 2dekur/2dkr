(function () {
  const root = document.documentElement;
  const base = new URL(document.currentScript.src);
  const asset = name => new URL(name + base.search, base).href;
  const original = new Map();
  let last, timer;
  function update() {
    clearTimeout(timer);
    const active = DKR.halloweenActif();
    if (active) root.dataset.season = 'halloween';
    else delete root.dataset.season;
    if (document.body && active && !document.querySelector('.hw-banner')) {
      const banner = document.createElement('div');
      banner.className = 'hw-banner';
      banner.innerHTML = '<div class="wrap"><span><img src="' + asset('halloween-pumpkin.svg') + '" alt="" width="32" height="32"> DEKURMODS · HALLOWEEN</span><a href="services.html#packs"><b>−10 %</b> sur les services, lobbys et comptes ↗<small>Jusqu’au 31 octobre inclus · heure de Paris</small></a></div>';
      document.body.prepend(banner);
      const nav = document.querySelector('header.nav');
      if (nav) {
        const mini = document.createElement('a');
        mini.className = 'hw-mini';
        mini.href = 'services.html#packs';
        mini.innerHTML = '<img src="' + asset('halloween-pumpkin.svg') + '" alt="" width="20" height="20"><b>−10 %</b><span>services &amp; lobbys · jusqu’au 31/10 inclus</span><span aria-hidden="true">↗</span>';
        nav.append(mini);
      }
      document.querySelectorAll('.logo img').forEach(img => { original.set(img, img.src); img.src = asset('logo-halloween.svg'); });
      const icon = document.querySelector('link[rel="icon"]');
      if (icon) { original.set(icon, icon.href); icon.href = asset('halloween-pumpkin.svg'); }
      document.querySelectorAll('.hero,.phead,.sv-hero').forEach(hero => {
        const scene = document.createElement('div'); scene.className = 'hw-scene'; scene.setAttribute('aria-hidden','true');
        scene.innerHTML = '<span class="hw-moon"></span><img src="' + asset('halloween-pumpkin.svg') + '" alt="">'; hero.append(scene);
      });
    }
    if (!active && document.body) {
      document.querySelectorAll('.hw-banner,.hw-scene,.hw-mini').forEach(e => e.remove());
      original.forEach((url,e) => { if (e.tagName === 'LINK') e.href = url; else e.src = url; }); original.clear();
    }
    if (last !== undefined && active !== last) document.dispatchEvent(new Event('dkr:seasonchange'));
    last = active;
    const end = Date.parse(DKR.catalogue.halloween.fin);
    if (active) timer = setTimeout(update, Math.min(end - Date.now() + 50, 2147483647));
  }
  update();
  document.addEventListener('DOMContentLoaded', update, {once:true});
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
})();
