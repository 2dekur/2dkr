// GET /api/me  → qui est connecté ? (le site s'en sert pour le bouton « Se connecter »)
import { lireSession, urlAvatar, estClientVerifie, json } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!env.SESSION_SECRET) return json({ configured: false });
  const s = await lireSession(request.headers.get('Cookie'), env.SESSION_SECRET);
  if (!s) return json({ configured: true, user: null });
  if (s.provider === 'email') {
    let active_key = s.active_key || null;
    let key_expires_at = s.key_expires_at ?? null;
    let verifie = !!s.verifie;
    // If session predates key activation, check KV for the user's active key
    if (!active_key && env.KEYS_KV) {
      const stored = await env.KEYS_KV.get('ak:' + s.id);
      if (stored) {
        try {
          const kd = JSON.parse(stored);
          active_key = kd.active_key || null;
          key_expires_at = kd.key_expires_at ?? null;
          if (active_key) verifie = true;
        } catch {}
      }
    }
    return json({ configured: true, user: {
      nom: s.nom, email: s.email, email_verified: !!s.email_verified,
      avatar: urlAvatar(null), membre: false, verifie,
      active_key, key_expires_at
    } });
  }
  return json({
    configured: true,
    user: { nom: s.nom, avatar: urlAvatar(s), membre: !!s.membre, verifie: await estClientVerifie(s, env) }
  });
}
