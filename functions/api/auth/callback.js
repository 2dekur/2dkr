// GET /api/auth/callback  → retour de Discord : on crée la session (cookie signé)
import {
  CONFIG, estConfigure, lireCookies, effacerCookie, creerCookie, redirection,
  adresseRetour, nettoyerRetour, echangerCode, appelDiscord, signerSession
} from '../../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!estConfigure(env)) return redirection('/?connexion=indisponible');

  const url = new URL(request.url);
  const cookies = lireCookies(request.headers.get('Cookie'));
  const nettoyage = [
    effacerCookie(CONFIG.STATE_COOKIE, '/api/auth'),
    effacerCookie(CONFIG.RETOUR_COOKIE, '/api/auth')
  ];
  let retour = '/';
  try { retour = nettoyerRetour(decodeURIComponent(cookies[CONFIG.RETOUR_COOKIE] || '/')); } catch (e) { retour = '/'; }
  const vers = (etat) => retour + (retour.includes('?') ? '&' : '?') + 'connexion=' + etat;

  if (url.searchParams.get('error')) return redirection(vers('annulee'), nettoyage);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  // Le « state » doit être celui qu'on a posé au départ (protection contre les faux retours)
  if (!code || !state || state !== cookies[CONFIG.STATE_COOKIE]) return redirection(vers('erreur'), nettoyage);

  const jetons = await echangerCode(code, adresseRetour(request), env);
  if (!jetons || !jetons.access_token) return redirection(vers('erreur'), nettoyage);

  const utilisateur = await appelDiscord('/users/@me', jetons.access_token);
  if (!utilisateur || !utilisateur.id) return redirection(vers('erreur'), nettoyage);

  // Membre du serveur 2DKR ? Et a-t-il le rôle « Client Vérifié » ?
  const membre = await appelDiscord(`/users/@me/guilds/${CONFIG.GUILD_ID}/member`, jetons.access_token);
  const roles = membre && Array.isArray(membre.roles) ? membre.roles : [];

  const maintenant = Math.floor(Date.now() / 1000);
  const session = await signerSession({
    id: utilisateur.id,
    nom: utilisateur.global_name || utilisateur.username || 'Discord',
    avatar: utilisateur.avatar || null,
    membre: !!membre,
    verifie: roles.includes(CONFIG.ROLE_VERIFIE),
    exp: maintenant + CONFIG.SESSION_SECONDES
  }, env.SESSION_SECRET);

  return redirection(vers('ok'), nettoyage.concat(
    creerCookie(CONFIG.SESSION_COOKIE, session, { secondes: CONFIG.SESSION_SECONDES })
  ));
}
