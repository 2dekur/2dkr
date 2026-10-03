// GET /api/auth/login?retour=/chemin  → envoie le visiteur sur Discord pour se connecter
import { CONFIG, estConfigure, aleatoire, adresseRetour, nettoyerRetour, redirection, creerCookie } from '../../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!estConfigure(env)) return redirection('/?connexion=indisponible');

  const url = new URL(request.url);
  const state = aleatoire(24);
  const retour = nettoyerRetour(url.searchParams.get('retour'));

  const discord = new URL('https://discord.com/oauth2/authorize');
  discord.search = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    response_type: 'code',
    redirect_uri: adresseRetour(request),
    scope: 'identify guilds.members.read',
    state,
    prompt: 'none'
  }).toString();

  return redirection(discord.toString(), [
    creerCookie(CONFIG.STATE_COOKIE, state, { secondes: 600, chemin: '/api/auth' }),
    creerCookie(CONFIG.RETOUR_COOKIE, encodeURIComponent(retour), { secondes: 600, chemin: '/api/auth' })
  ]);
}
