// POST /api/resend-verification  body: { email }
import { json, aleatoire } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'db_missing' }, 500);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'resend_missing' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const email = String(body.email || '').toLowerCase().trim();
  if (!email) return json({ ok: false, error: 'email_required' }, 400);

  const row = await env.DB.prepare(
    'SELECT id, name, verified FROM korzen_users WHERE email = ?'
  ).bind(email).first();

  // Always return ok to not leak whether email exists
  if (!row || row.verified) return json({ ok: true });

  const token = aleatoire(32);
  const tokenExp = Math.floor(Date.now() / 1000) + 86400;

  await env.DB.prepare(
    'UPDATE korzen_users SET verify_token = ?, token_exp = ? WHERE id = ?'
  ).bind(token, tokenExp, row.id).run();

  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/api/verify-email?token=${token}`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Korzen <noreply@dekurmods.com>',
      to: [email],
      subject: 'Nouveau lien de vérification — Korzen',
      html: `<!DOCTYPE html><html><body style="background:#080705;color:#d4af37;font-family:sans-serif;padding:40px">
<h2 style="color:#d4af37">Nouveau lien de vérification</h2>
<p>Clique sur le bouton ci-dessous pour vérifier ton adresse email. Le lien expire dans 24 h.</p>
<a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#d4af37;color:#080705;font-weight:bold;text-decoration:none;border-radius:6px">Vérifier mon email</a>
</body></html>`
    })
  });

  return json({ ok: true });
}
