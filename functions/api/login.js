import { CONFIG, creerCookie, json, signerSession } from '../../lib/auth.js';
import { verifyPwd } from '../../lib/password.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.SESSION_SECRET) return json({ ok: false, error: 'not_configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return json({ ok: false, error: 'invalid_credentials' }, 400);
  }
  const email = body.email.trim().toLowerCase();
  const password = body.password;
  if (!email || email.length > 254 || !password || password.length > 4096) {
    return json({ ok: false, error: 'invalid_credentials' }, 400);
  }
  const user = await env.DB.prepare(
    'SELECT id, name, email, password_hash, password_salt, verified FROM korzen_users WHERE email = ?'
  ).bind(email).first();
  // Même calcul pour un compte inconnu : ne pas révéler son existence par le temps de réponse.
  const valid = await verifyPwd(password, user?.password_salt || 'unknown-account', user?.password_hash || '');
  if (!user || !valid) return json({ ok: false, error: 'invalid_credentials' }, 401);
  if (!user.verified) return json({ ok: false, error: 'email_unverified' }, 403);

  const session = await signerSession({
    id: user.id, nom: user.name, email: user.email, provider: 'email',
    email_verified: true, membre: false, verifie: false,
    exp: Math.floor(Date.now() / 1000) + CONFIG.SESSION_SECONDES
  }, env.SESSION_SECRET);
  return json({ ok: true }, 200, {
    'Set-Cookie': creerCookie(CONFIG.SESSION_COOKIE, session, { secondes: CONFIG.SESSION_SECONDES })
  });
}
