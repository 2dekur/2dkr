// POST /api/code/activate  { code: "B4A5ADB0-BAB1CDCE-3828AE0B-XXXXXXXX" }
// Validates a Korzen keygen key (32 hex chars) and marks the session as verified.
// Requires KEYS_KV (KV namespace) bound in Cloudflare to prevent key reuse.

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

// Returns { expiry: BigInt, nonce: number } or null if invalid.
function decodeKey(raw) {
  const k = raw.replace(/-/g, '').toUpperCase();
  if (k.length !== 32 || !/^[0-9A-F]{32}$/.test(k)) return null;
  const xored = BigInt('0x' + k.slice(0, 16));
  const nonce = parseInt(k.slice(16, 24), 16);
  const chk   = parseInt(k.slice(24), 16);
  // crc32 over xored bytes (8, LE) + nonce bytes (4, LE)
  const buf = new Uint8Array(12);
  let v = xored;
  for (let i = 0; i < 8; i++) { buf[i] = Number(v & 0xFFn); v >>= 8n; }
  let nv = nonce;
  for (let i = 0; i < 4; i++) { buf[8 + i] = nv & 0xFF; nv >>>= 8; }
  const expected = (crc32(buf) ^ Number(CHECK)) >>> 0;
  if (chk !== expected) return null;
  return { expiry: xored ^ SALT, nonce };
}

export async function onRequestPost({ request, env }) {
  const session = await lireSession(request.headers.get('Cookie'), env.SESSION_SECRET);
  if (!session) return json({ ok: false, error: 'not_logged_in' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  const code   = typeof body.code === 'string' ? body.code.trim() : '';
  const result = decodeKey(code);
  if (!result) return json({ ok: false, error: 'invalid_key' }, 400);

  const { expiry, nonce } = result;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  if (expiry !== LIFETIME && expiry < nowSec) return json({ ok: false, error: 'key_expired' }, 400);

  // Prevent reuse via KV
  const nonceKey = 'n:' + nonce.toString(16).padStart(8, '0');
  if (env.KEYS_KV) {
    const used = await env.KEYS_KV.get(nonceKey);
    if (used) return json({ ok: false, error: 'key_already_used' }, 400);
  }

  const displayKey    = k.slice(0,8)+'-'+k.slice(8,16)+'-'+k.slice(16,24)+'-'+k.slice(24);
  const key_expires_at = expiry === LIFETIME ? null : Number(expiry);
  const updated = { ...session, verifie: true, active_key: displayKey, key_expires_at };
  const token   = await signerSession(updated, env.SESSION_SECRET);
  const cookie  = creerCookie(CONFIG.SESSION_COOKIE, token, { secondes: CONFIG.SESSION_SECONDES });

  // Mark nonce as used (TTL = remaining validity, or 10 years for lifetime)
  if (env.KEYS_KV) {
    const ttlSec = expiry === LIFETIME ? 10 * 365 * 86400 : Number(expiry - nowSec);
    await env.KEYS_KV.put(nonceKey, '1', { expirationTtl: ttlSec });
  }

  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}
