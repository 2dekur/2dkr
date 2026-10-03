// POST /api/code/check  { code }  → ce code de 1re commande est-il utilisable par ce compte Discord ?
import { estConfigure, lireSession, estClientVerifie, codeDejaUtilise, base, codePropre, json } from '../../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!estConfigure(env)) return json({ ok: true, serveur: false });

  const s = await lireSession(request.headers.get('Cookie'), env.SESSION_SECRET);
  if (!s) return json({ ok: false, raison: 'connexion' }, 401);

  let corps = {};
  try { corps = await request.json(); } catch (e) { return json({ ok: false, raison: 'requete' }, 400); }
  const code = codePropre(corps.code);
  if (!code) return json({ ok: false, raison: 'requete' }, 400);

  // Déjà Client Vérifié = a déjà commandé : pas de code de 1re commande
  if (await estClientVerifie(s, env)) return json({ ok: false, raison: 'client_verifie' });
  if (await codeDejaUtilise(env, s.id, code)) return json({ ok: false, raison: 'deja_utilise' });

  return json({ ok: true, serveur: true, memoire: !!(await base(env)) });
}
