// POST /api/commande  → reçoit une commande de la page Commande et la poste sur le salon Discord des commandes.
// Variable à créer dans Cloudflare Pages (Settings > Variables and Secrets) :
//   DISCORD_WEBHOOK_COMMANDES = adresse du webhook du salon privé où arrivent les commandes.
// Sans cette variable, la commande n'est pas envoyée (le client garde quand même son récap à coller dans un ticket).
// Les montants sont calculés par le navigateur du client : vérifie-les dans le ticket avant de livrer.

const court = (v, n) => String(v || '').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  let c;
  try { c = await request.json(); } catch (e) { return json({ ok: false, erreur: 'json' }, 400); }

  const email = court(c.email, 120), discord = court(c.discord, 64), numero = court(c.numero, 24);
  const articles = Array.isArray(c.articles) ? c.articles.slice(0, 20) : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !discord || !articles.length) return json({ ok: false, erreur: 'champs' }, 400);

  if (!env.DISCORD_WEBHOOK_COMMANDES) return json({ ok: true, envoye: false });

  const euros = n => (Math.round(Number(n) * 100) / 100).toFixed(2).replace('.', ',') + ' €';
  const lignes = articles.map(a => '• ' + court(a.nom, 60) + (a.qte > 1 ? ' ×' + (a.qte | 0) : '') + ' — ' + euros(a.prix * (a.qte || 1))).join('\n');
  const embed = {
    title: 'Nouvelle commande ' + numero,
    color: 0x38bdf8,
    fields: [
      { name: 'Discord', value: discord, inline: true },
      { name: 'E-mail', value: email, inline: true },
      { name: 'Paiement', value: court(c.paiement, 40) || '—', inline: true },
      { name: 'Articles', value: lignes || '—' },
      { name: 'Total', value: euros(c.total) + ' (dont commission ' + euros(c.commission) + ')' }
    ],
    timestamp: new Date().toISOString()
  };
  const r = await fetch(env.DISCORD_WEBHOOK_COMMANDES, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'DekurMods', embeds: [embed], allowed_mentions: { parse: [] } })
  }).catch(() => null);
  return json({ ok: true, envoye: !!(r && r.ok) });
}

function json(d, status) {
  return new Response(JSON.stringify(d), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
