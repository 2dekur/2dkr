// GET /api/verify-email?token=xxx
import { json, redirection } from '../../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_missing' }, 500);

  const token = new URL(request.url).searchParams.get('token');
  if (!token) return redirection('/auth.html?error=token_missing');

  const row = await env.DB.prepare(
    'SELECT id, token_exp, verified FROM korzen_users WHERE verify_token = ?'
  ).bind(token).first();

  if (!row) return redirection('/auth.html?error=token_invalid');
  if (row.verified) return redirection('/auth.html?verified=already');
  if (row.token_exp < Math.floor(Date.now() / 1000)) return redirection('/auth.html?error=token_expired');

  await env.DB.prepare(
    'UPDATE korzen_users SET verified = 1, verify_token = NULL, token_exp = NULL WHERE id = ?'
  ).bind(row.id).run();

  return redirection('/auth.html?verified=ok');
}
