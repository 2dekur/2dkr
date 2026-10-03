// 2DKR v0.5 — Connexion Discord : outils partagés par les fonctions /api
// (sessions signées, appels à l'API Discord, mémoire des codes).
// Aucun secret n'est écrit ici : ils viennent de Cloudflare (Settings → Variables and Secrets) :
//   DISCORD_CLIENT_SECRET  secret OAuth de l'application Discord (obligatoire)
//   SESSION_SECRET         longue chaîne aléatoire qui signe les sessions (obligatoire)
//   DISCORD_BOT_TOKEN      jeton du bot (facultatif : vérifie le rôle en direct à chaque code)
//   DB                     base D1 liée au projet (facultatif : mémoire « code déjà utilisé »)

export const CONFIG = {
  CLIENT_ID: '1556025968756523141',
  GUILD_ID: '1526289250700755075',
  ROLE_VERIFIE: '1546957491642826762', // rôle « 2DKR - Client Vérifié »
  SESSION_COOKIE: 'dkr_session',
  STATE_COOKIE: 'dkr_state',
  RETOUR_COOKIE: 'dkr_retour',
  SESSION_SECONDES: 14 * 24 * 3600
};

const DISCORD_API = 'https://discord.com/api/v10';
const enc = new TextEncoder();

// ---------- Réponses ----------
export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra)
  });
}
export function redirection(location, cookies = []) {
  const h = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  cookies.forEach((c) => h.append('Set-Cookie', c));
  return new Response(null, { status: 302, headers: h });
}
export function estConfigure(env) {
  return !!(env && env.DISCORD_CLIENT_SECRET && env.SESSION_SECRET);
}
export function adresseRetour(request) {
  return new URL(request.url).origin + '/api/auth/callback';
}
// Chemin de retour sûr : uniquement un chemin du site, jamais une autre adresse
export function nettoyerRetour(valeur) {
  if (typeof valeur !== 'string' || !valeur.startsWith('/') || valeur.startsWith('//') || valeur.includes('\\') || valeur.length > 200) return '/';
  return valeur;
}

// ---------- Cookies ----------
export function lireCookies(entete) {
  const out = {};
  String(entete || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}
export function creerCookie(nom, valeur, { secondes, chemin = '/' } = {}) {
  return `${nom}=${valeur}; Path=${chemin}; Max-Age=${secondes}; HttpOnly; Secure; SameSite=Lax`;
}
export function effacerCookie(nom, chemin = '/') {
  return `${nom}=; Path=${chemin}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

// ---------- Aléatoire et signature ----------
function b64url(octets) {
  let s = '';
  octets.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deB64url(texte) {
  let s = texte.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
export function aleatoire(octets = 24) {
  return b64url(crypto.getRandomValues(new Uint8Array(octets)));
}
function cleHmac(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signerSession(donnees, secret) {
  const corps = b64url(enc.encode(JSON.stringify(donnees)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await cleHmac(secret), enc.encode(corps)));
  return corps + '.' + b64url(sig);
}
// Renvoie la session si la signature est bonne et qu'elle n'a pas expiré, sinon null
export async function lireSession(enteteCookie, secret) {
  if (!secret) return null;
  const jeton = lireCookies(enteteCookie)[CONFIG.SESSION_COOKIE];
  if (!jeton || !jeton.includes('.')) return null;
  const [corps, sig] = jeton.split('.');
  try {
    const bon = await crypto.subtle.verify('HMAC', await cleHmac(secret), deB64url(sig), enc.encode(corps));
    if (!bon) return null;
    const s = JSON.parse(new TextDecoder().decode(deB64url(corps)));
    if (!s || !s.id || !s.exp || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch (e) {
    return null;
  }
}

// ---------- Discord ----------
export async function echangerCode(code, redirectUri, env) {
  const r = await fetch(DISCORD_API + '/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CONFIG.CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });
  return r.ok ? r.json() : null;
}
export async function appelDiscord(chemin, jeton, bot = false) {
  const r = await fetch(DISCORD_API + chemin, { headers: { Authorization: (bot ? 'Bot ' : 'Bearer ') + jeton } });
  return r.ok ? r.json() : null;
}
export function urlAvatar(s) {
  if (s && s.avatar) return `https://cdn.discordapp.com/avatars/${s.id}/${s.avatar}.png?size=64`;
  return 'https://cdn.discordapp.com/embed/avatars/0.png';
}
// Le rôle « Client Vérifié » est lu en direct si le bot est configuré, sinon dans la session
export async function estClientVerifie(session, env) {
  if (env.DISCORD_BOT_TOKEN) {
    const m = await appelDiscord(`/guilds/${CONFIG.GUILD_ID}/members/${session.id}`, env.DISCORD_BOT_TOKEN, true);
    if (m && Array.isArray(m.roles)) return m.roles.includes(CONFIG.ROLE_VERIFIE);
  }
  return !!session.verifie;
}

// ---------- Mémoire des codes (base D1, créée à la volée) ----------
let tableCreee = false;
export async function base(env) {
  if (!env || !env.DB) return null;
  if (!tableCreee) {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS code_uses (user_id TEXT NOT NULL, code TEXT NOT NULL, used_at INTEGER NOT NULL, PRIMARY KEY (user_id, code))').run();
    tableCreee = true;
  }
  return env.DB;
}
export async function codeDejaUtilise(env, userId, code) {
  const db = await base(env);
  if (!db) return false;
  const ligne = await db.prepare('SELECT 1 AS x FROM code_uses WHERE user_id = ? AND code = ?').bind(userId, code).first();
  return !!ligne;
}
export async function noterCodeUtilise(env, userId, code) {
  const db = await base(env);
  if (!db) return false;
  await db.prepare('INSERT OR IGNORE INTO code_uses (user_id, code, used_at) VALUES (?, ?, ?)').bind(userId, code, Math.floor(Date.now() / 1000)).run();
  return true;
}
// Les codes ne contiennent que des lettres, chiffres et tirets
export function codePropre(valeur) {
  const c = String(valeur || '').toUpperCase().replace(/\s+/g, '');
  return /^[A-Z0-9-]{3,40}$/.test(c) ? c : null;
}
