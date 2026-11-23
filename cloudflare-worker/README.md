# DIVE LARP — Cloudflare Worker Sync Backend (Piano Free)

Worker gratuito con endpoint `GET /api/state` e `POST /api/state` basato su **Durable Objects (SQLite)** per sincronizzare fino a 40–80+ dispositivi in tempo reale durante l'evento.

## Deploy rapido

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler deploy
```

Al termine del deploy Wrangler stamperà l'URL pubblico (es. `https://dive-sync.<tuo-subdomain>.workers.dev`).
Inseriscilo nella **Sala Master → CLOUD SYNC**:
- **Modalità**: `Cloudflare Worker (REST API)`
- **Endpoint URL**: l'URL `.workers.dev` del tuo Worker
- **API / Anon Key**: lascia vuoto (oppure imposta un token con `npx wrangler secret put API_TOKEN`)
