import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { onRequestPost as login } from '../functions/api/login.js';
import { onRequestGet as me } from '../functions/api/me.js';
import { onRequestPost as logout } from '../functions/api/auth/logout.js';
import { CONFIG, signerSession, lireSession } from '../lib/auth.js';
import { hashPwd } from '../lib/password.js';

const password = 'test-password-only';
const user = {
  id: 'email-account-id', name: 'Compte test', email: 'test@example.com', verified: 1,
  password_salt: 'test-salt', password_hash: await hashPwd(password, 'test-salt')
};
const env = {
  SESSION_SECRET: 'local-test-secret-only',
  DB: { prepare(sql) {
    assert.match(sql, /FROM korzen_users WHERE email = \?/);
    return { bind(email) { return { async first() { return email === user.email ? user : null; } }; } };
  } }
};
const attempt = (body, settings = env) => login({ env: settings, request: new Request('https://example.com/api/login', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }
}) });
const current = (cookie, settings = env) => me({ env: settings,
  request: new Request('https://example.com/api/me', { headers: { Cookie: cookie } }) });

const response = await attempt({ email: ' TEST@example.com ', password });
assert.equal(response.status, 200);
const setCookie = response.headers.get('Set-Cookie');
assert.match(setCookie, /Path=\/; Max-Age=1209600; HttpOnly; Secure; SameSite=Lax/);
assert.equal(response.headers.get('Cache-Control'), 'no-store');
const cookie = setCookie.split(';')[0];
assert.equal((await lireSession(cookie, env.SESSION_SECRET)).provider, 'email');
for (let reload = 0; reload < 2; reload++) {
  const profile = await (await current(cookie, { ...env, DISCORD_BOT_TOKEN: 'unused-test-token' })).json();
  assert.equal(profile.user.nom, user.name);
  assert.equal(profile.user.email, user.email);
  assert.equal(profile.user.email_verified, true);
  assert.equal(profile.user.verifie, false, 'Email confirmation must not grant a Discord customer role');
  assert.equal(profile.user.password_hash, undefined);
}
assert.equal((await (await current('')).json()).user, null);
assert.equal((await (await current(cookie + 'tampered')).json()).user, null);
const expired = await signerSession({ id: user.id, exp: 1 }, env.SESSION_SECRET);
assert.equal((await (await current(`${CONFIG.SESSION_COOKIE}=${expired}`)).json()).user, null);
for (const body of [
  { email: user.email, password: 'wrong-password' },
  { email: 'unknown@example.com', password }
]) {
  const rejected = await attempt(body);
  assert.equal(rejected.status, 401);
  assert.equal((await rejected.json()).error, 'invalid_credentials');
  assert.equal(rejected.headers.get('Set-Cookie'), null);
}
for (const body of [null, {}, { email: [], password }, { email: user.email, password: '' }]) {
  assert.equal((await attempt(body)).status, 400);
}
assert.equal((await attempt({ email: user.email, password }, { DB: env.DB })).status, 503);
user.verified = 0;
assert.equal((await attempt({ email: user.email, password })).status, 403);
user.verified = 1;
const discordSession = await signerSession({ id: 'discord-id', nom: 'Discord test', verifie: true,
  exp: Math.floor(Date.now() / 1000) + 60 }, env.SESSION_SECRET);
assert.equal((await (await current(`${CONFIG.SESSION_COOKIE}=${discordSession}`)).json()).user.verifie, true);
const cleared = (await logout()).headers.get('Set-Cookie');
assert.match(cleared, /dkr_session=; Path=\/; Max-Age=0/);
assert.equal((await (await current(cleared.split(';')[0])).json()).user, null);

// Exercise the real form handler: only a successful API response may navigate.
const html = readFileSync(new URL('../auth.html', import.meta.url), 'utf8');
const handler = html.slice(html.indexOf('  async function handleLogin('), html.indexOf('  async function handleRegister('));
for (const outcome of ['success', 'rejected', 'network']) {
  const button = { textContent: 'Sign in', disabled: false };
  let alert;
  const window = { location: { href: '/auth' } };
  const context = vm.createContext({ window,
    document: { getElementById(id) { return { value: id === 'login-email' ? user.email : password }; } },
    showAlert(message) { alert = message; },
    async fetch(url, options) {
      assert.equal(url, '/api/login');
      assert.equal(options.credentials, 'same-origin');
      assert.deepEqual(JSON.parse(options.body), { email: user.email, password });
      if (outcome === 'network') throw new Error('offline');
      return { ok: outcome === 'success', async json() {
        return outcome === 'success' ? { ok: true } : { ok: false, error: 'invalid_credentials' };
      } };
    }
  });
  vm.runInContext(handler, context);
  await context.handleLogin({ preventDefault() {}, target: { querySelector() { return button; } } });
  assert.equal(window.location.href, outcome === 'success' ? '/dashboard' : '/auth');
  assert.equal(button.disabled, false);
  if (outcome !== 'success') assert.ok(alert);
}
console.log('Auth: login, session persistence, invalid credentials, verification, logout and form checks passed.');
