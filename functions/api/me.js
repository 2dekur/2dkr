// GET /api/me  → qui est connecté ? (le site s'en sert pour le bouton « Se connecter »)
import { estConfigure, lireSession, urlAvatar, estClientVerifie, json } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!estConfigure(env)) return json({ configured: false });
  const s = await lireSession(request.headers.get('Cookie'), env.SESSION_SECRET);
  if (!s) return json({ configured: true, user: null });
  return json({
    configured: true,
    user: { nom: s.nom, avatar: urlAvatar(s), membre: !!s.membre, verifie: await estClientVerifie(s, env) }
  });
}
