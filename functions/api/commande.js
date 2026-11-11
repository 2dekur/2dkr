// POST /api/commande  → reçoit une commande de la page Commande et la poste sur le salon Discord des commandes.
// Variable à créer dans Cloudflare Pages (Settings > Variables and Secrets) :
//   DISCORD_WEBHOOK_COMMANDES = adresse du webhook du salon privé où arrivent les commandes.
// Sans cette variable, la commande n'est pas envoyée (le client garde quand même son récap à coller dans un ticket).

// Synchroniser PRIX_ACTUELS avec assets/catalogue.js à chaque changement de prix.
const PRIX_ACTUELS = {
  // menus
  'cherax-standard': 21, 'cherax-premium': 42, 'yari': 92, 'lexis': 109,
  // packs (nouveaux tarifs depuis 2026-10-07)
  'bronze': 8, 'argent': 13, 'or': 19, 'platine': 26, 'ultime': 70,
  // options argent
  'm5': 2, 'm10': 3, 'm20': 5, 'm30': 7, 'm50': 10, 'm100': 18, 'm200': 30,
  // options niveau/stats
  'niveau': 5, 'stats': 2,
  // options véhicules/tenues
  'v10': 10, 't5': 5, 't20': 20,
  // comptes
  'compte-complet': 22, 'compte-simple': 16,
};
const COMMISSION_PCT = 20;
const ORIGINES = ['https://dekurmods.com', 'https://2dkr.pages.dev'];

// Recalcule le total (commission incluse, arrondi à l'euro sup par article) depuis les IDs.
// Retourne null si un article a un id inconnu.
function totalServeur(articles) {
  let total = 0;
  for (const a of articles) {
    const pu = PRIX_ACTUELS[a.id];
    if (pu == null) return null;
    const qte = Math.max(1, Math.min(Number(a.qte) || 1, 99));
    total += Math.ceil(pu * qte * (1 + COMMISSION_PCT / 100));
  }
  return total;
}

const court = (v, n) => String(v || '').trim().slice(0, n);

export async function onRequest({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const originOk = ORIGINES.includes(origin);

  // Preflight CORS
  if (request.method === 'OPTIONS') {
    if (!originOk) return new Response(null, { status: 403 });
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  if (request.method !== 'POST') return new Response(null, { status: 405 });
  if (!originOk) return json({ ok: false, erreur: 'origin' }, 403, '');

  let c;
  try { c = await request.json(); } catch (e) { return json({ ok: false, erreur: 'json' }, 400, origin); }

  const email = court(c.email, 120), discord = court(c.discord, 64), numero = court(c.numero, 24);
  const articles = Array.isArray(c.articles) ? c.articles.slice(0, 20) : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !discord || !articles.length) {
    return json({ ok: false, erreur: 'champs' }, 400, origin);
  }

  if (!env.DISCORD_WEBHOOK_COMMANDES) return json({ ok: true, envoye: false }, 200, origin);

  const euros = n => (Math.round(Number(n) * 100) / 100).toFixed(2).replace('.', ',') + ' €';
  const lignes = articles.map(a => '• ' + court(a.nom, 60) + (a.qte > 1 ? ' ×' + (a.qte | 0) : '') + ' — ' + euros(a.prix * (a.qte || 1))).join('\n');

  // Vérification prix serveur — écart toléré de 1 € pour les codes promo
  const totalCalc = totalServeur(articles);
  const totalClient = Number(c.total);
  const idInconnus = articles.filter(a => PRIX_ACTUELS[a.id] == null).map(a => a.id);
  let alertePrix = '';
  if (totalCalc == null) {
    alertePrix = '⚠️ ID inconnu(s) : ' + idInconnus.join(', ');
  } else if (totalClient < totalCalc - 1) {
    alertePrix = '⚠️ Total client : ' + euros(totalClient) + ' — Minimum attendu : ' + euros(totalCalc - 1);
  }

  const fields = [
    { name: 'Discord', value: discord, inline: true },
    { name: 'E-mail', value: email, inline: true },
    { name: 'Paiement', value: court(c.paiement, 40) || '—', inline: true },
    { name: 'Articles', value: lignes || '—' },
    { name: 'Total', value: euros(c.total) + ' (dont commission ' + euros(c.commission) + ')' + (Number(c.reductionHalloween) > 0 ? '\nRemise Halloween : −' + euros(c.reductionHalloween) : '') },
  ];
  if (alertePrix) fields.push({ name: 'Vérification prix', value: alertePrix });

  const embed = {
    title: 'Nouvelle commande ' + numero,
    color: alertePrix ? 0xff6b35 : 0x38bdf8,
    fields,
    timestamp: new Date().toISOString()
  };
  const r = await fetch(env.DISCORD_WEBHOOK_COMMANDES, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'DekurMods', embeds: [embed], allowed_mentions: { parse: [] } })
  }).catch(() => null);
  return json({ ok: true, envoye: !!(r && r.ok) }, 200, origin);
}

function json(d, status, corsOrigin) {
  const h = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (corsOrigin) h['Access-Control-Allow-Origin'] = corsOrigin;
  return new Response(JSON.stringify(d), { status: status || 200, headers: h });
}
