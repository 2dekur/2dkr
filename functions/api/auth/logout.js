// POST /api/auth/logout  → supprime la session
import { CONFIG, effacerCookie, json } from '../../../lib/auth.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'Set-Cookie': effacerCookie(CONFIG.SESSION_COOKIE) });
}
