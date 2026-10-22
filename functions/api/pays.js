// GET /api/pays  → pays du visiteur, détecté par Cloudflare (le site s'en sert pour la TVA)
export async function onRequestGet({ request }) {
  const pays = (request.cf && request.cf.country) || request.headers.get('CF-IPCountry') || '';
  return new Response(JSON.stringify({ pays: pays === 'XX' || pays === 'T1' ? '' : pays }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
