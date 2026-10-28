// POST /api/register  body: { name, email, password }
// Env vars requis (Cloudflare Pages → Settings → Variables and Secrets) :
//   RESEND_API_KEY   clé API Resend
//   DB               base D1 liée au projet
import { json, aleatoire } from '../../lib/auth.js';
import { hashPwd } from '../../lib/password.js';

async function initTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS korzen_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    verify_token TEXT,
    token_exp INTEGER,
    created_at INTEGER NOT NULL
  )`).run();
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_missing' }, 500);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'resend_missing' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');

  if (!name || name.length < 2) return json({ ok: false, error: 'name_required' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'email_invalid' }, 400);
  if (password.length < 8) return json({ ok: false, error: 'password_too_short' }, 400);

  await initTable(env.DB);

  const existing = await env.DB.prepare('SELECT id FROM korzen_users WHERE email = ?').bind(email).first();
  if (existing) return json({ ok: false, error: 'email_taken' }, 409);

  const id = aleatoire(16);
  const salt = aleatoire(16);
  const hash = await hashPwd(password, salt);
  const token = aleatoire(32);
  const tokenExp = Math.floor(Date.now() / 1000) + 86400; // 24h
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    'INSERT INTO korzen_users (id, name, email, password_hash, password_salt, verified, verify_token, token_exp, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)'
  ).bind(id, name, email, hash, salt, token, tokenExp, now).run();

  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/api/verify-email?token=${token}`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Korzen <noreply@dekurmods.com>',
      to: [email],
      subject: 'Vérifie ton adresse email — Korzen',
      html: `<!DOCTYPE html><html><body style="background:#080705;color:#d4af37;font-family:sans-serif;padding:40px">
<h2 style="color:#d4af37">Bienvenue sur Korzen, ${name} !</h2>
<p>Clique sur le bouton ci-dessous pour vérifier ton adresse email. Le lien expire dans 24 h.</p>
<a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#d4af37;color:#080705;font-weight:bold;text-decoration:none;border-radius:6px">Vérifier mon email</a>
<p style="color:#888;font-size:12px">Si tu n'as pas créé de compte, ignore cet email.</p>
</body></html>`
    })
  });

  if (!resendRes.ok) {
    // Don't delete user — token still valid, they can resend
    return json({ ok: false, error: 'email_failed' }, 502);
  }

  return json({ ok: true });
}
