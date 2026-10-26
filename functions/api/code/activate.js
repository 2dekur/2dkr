// POST /api/code/activate  { code: "B4A5ADB0-BAB1CDCE-3828AE0B" }
// Validates a Korzen keygen key and marks the session as verified (verifie: true).

import { lireSession, signerSession, creerCookie, json, CONFIG } from '../../../lib/auth.js';

const SALT     = 0x4B5A524F454E3231n;
const CHECK    = 0xC7A3B5D9n;
const LIFETIME = 0xFFFFFFFFFFFFFFFFn;

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) {
    c ^= b;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function decodeKey(raw) {
  const k = raw.replace(/-/g, '').toUpperCase();
  if (k.length !== 24 || !/^[0-9A-F]{24}$/.test(k)) return null;
  const xored = BigInt('0x' + k.slice(0, 16));
  const chk   = parseInt(k.slice(16), 16);
  const buf   = new Uint8Array(8);
  let v = xored;
  for (let i = 0; i < 8; i++) { buf[i] = Number(v & 0xFFn); v >>= 8n; }
  const expected = (crc32(buf) ^ Number(CHECK)) >>> 0;
  if (chk !== expected) return null;
  return xored ^ SALT; // BigInt expiry
}

export async function onRequestPost({ request, env }) {
  const session = await lireSession(request.headers.get('Cookie'), env.SESSION_SECRET);
  if (!session) return json({ ok: false, error: 'not_logged_in' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  const code   = typeof body.code === 'string' ? body.code.trim() : '';
  const expiry = decodeKey(code);
  if (expiry === null) return json({ ok: false, error: 'invalid_key' }, 400);

  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  if (expiry !== LIFETIME && expiry < nowSec) return json({ ok: false, error: 'key_expired' }, 400);

  const updated = { ...session, verifie: true };
  const token   = await signerSession(updated, env.SESSION_SECRET);
  const cookie  = creerCookie(CONFIG.SESSION_COOKIE, token, { secondes: CONFIG.SESSION_SECONDES });

  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}
