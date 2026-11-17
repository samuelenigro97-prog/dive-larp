/**
 * DIVE LARP — Shared Cloud Sync Worker (Cloudflare Workers + KV)
 *
 * Setup rapido (2 minuti dalla Dashboard Cloudflare, senza CLI):
 * 1. Workers & Pages -> Create Worker -> incolla questo file e fai Deploy.
 * 2. Settings -> Bindings -> Add KV Namespace -> Variable name: DIVE_KV.
 * 3. (Opzionale) Settings -> Variables -> Secret: SYNC_TOKEN = la tua chiave segreta.
 * 4. Nella Regia Master di DIVE (3 click su vX.Y.Z -> PIN 2077):
 *    - Modalità: Cloudflare Worker (REST API)
 *    - Endpoint: https://<tuo-worker>.workers.dev
 *    - API Key: (il tuo SYNC_TOKEN, oppure lascia vuoto se non impostato)
 *    - Salva e clicca "COPIA LINK SYNC GIOCATORI" da condividere ai partecipanti.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/state') {
      return Response.json({ ok: true, service: 'dive-larp-sync' }, { headers: CORS_HEADERS });
    }

    if (env.SYNC_TOKEN) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.SYNC_TOKEN}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
      }
    }

    if (request.method === 'GET') {
      const raw = await env.DIVE_KV.get('dive_state_main');
      return new Response(raw || 'null', {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      const bodyText = await request.text();
      await env.DIVE_KV.put('dive_state_main', bodyText);
      return Response.json({ ok: true, savedAt: Date.now() }, { headers: CORS_HEADERS });
    }

    return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: CORS_HEADERS });
  }
};
