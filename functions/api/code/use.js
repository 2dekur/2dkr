// POST /api/code/use  { code }  → le récapitulatif a été copié : on note que ce compte a utilisé ce code
import { estConfigure, lireSession, noterCodeUtilise, codePropre, json } from '../../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!estConfigure(env)) return json({ ok: true, serveur: false });

  const s = await lireSession(request.headers.get('Cookie'), env.SESSION_SECRET);
  if (!s) return json({ ok: false, raison: 'connexion' }, 401);

  let corps = {};
  try { corps = await request.json(); } catch (e) { return json({ ok: false, raison: 'requete' }, 400); }
  const code = codePropre(corps.code);
  if (!code) return json({ ok: false, raison: 'requete' }, 400);

  const note = await noterCodeUtilise(env, s.id, code);
  return json({ ok: true, memoire: note });
}
