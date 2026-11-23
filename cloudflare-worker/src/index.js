import { DurableObject } from 'cloudflare:workers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

export class DiveStateDO extends DurableObject {
  async fetch(request) {
    if (request.method === 'GET') {
      const state = await this.ctx.storage.get('state');
      return jsonResponse(state || {});
    }

    if (request.method === 'POST') {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ error: 'JSON non valido' }, 400);
      }
      await this.ctx.storage.put('state', payload);
      return jsonResponse({ ok: true, updatedAt: new Date().toISOString() });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({ ok: true, service: 'dive-sync', endpoint: '/api/state' });
    }

    if (url.pathname !== '/api/state') {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    // Optional Bearer token check if API_TOKEN secret is set
    if (env.API_TOKEN) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.API_TOKEN}`) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    const id = env.STATE_DO.idFromName('main');
    const stub = env.STATE_DO.get(id);
    return stub.fetch(request);
  }
};
