// POST /api/login  body: { email, password }
import { json, signerSession, creerCookie, CONFIG } from '../../lib/auth.js';

const ENC = new TextEncoder();

async function hashPwd(password, salt) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: ENC.encode(salt), iterations: 100000 },
    key, 256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_missing' }, 500);
  if (!env.SESSION_SECRET) return json({ ok: false, error: 'not_configured' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const email = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');

  if (!email || !password) return json({ ok: false, error: 'invalid_credentials' }, 400);

  const row = await env.DB.prepare(
    'SELECT id, name, email, password_hash, password_salt, verified FROM korzen_users WHERE email = ?'
  ).bind(email).first();

  if (!row) return json({ ok: false, error: 'invalid_credentials' }, 401);
  if (!row.verified) return json({ ok: false, error: 'email_unverified' }, 403);

  const hash = await hashPwd(password, row.password_salt);
  if (hash !== row.password_hash) return json({ ok: false, error: 'invalid_credentials' }, 401);

  const exp = Math.floor(Date.now() / 1000) + CONFIG.SESSION_SECONDES;
  const token = await signerSession({
    id: row.id,
    nom: row.name,
    email: row.email,
    email_verified: true,
    provider: 'email',
    exp
  }, env.SESSION_SECRET);

  const cookie = creerCookie(CONFIG.SESSION_COOKIE, token, { secondes: CONFIG.SESSION_SECONDES });

  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}
