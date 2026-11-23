// ==========================================================================
// DIVE Cyberpunk LARP - Cloud Sync Connector (Cloudflare Workers REST)
// ==========================================================================

(function (global) {
  const SYNC_CONFIG_KEY = 'dive_sync_config_v1';

  const DEFAULT_CONFIG = {
    mode: 'cloudflare',
    endpoint: 'https://dive-sync.dive-larp-sync-worker.workers.dev',
    apiKey: ''
  };

  function getConfig() {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.mode !== 'cloudflare' || !parsed.endpoint) {
        return { ...DEFAULT_CONFIG };
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function setConfig(nextCfg) {
    const merged = { ...DEFAULT_CONFIG, ...nextCfg, mode: 'cloudflare' };
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(merged));
    return merged;
  }

  function getStatusLabel() {
    return 'CLOUDFLARE SYNC';
  }

  function buildHeaders(cfg) {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }
    return headers;
  }

  async function pullSharedState() {
    const cfg = getConfig();
    if (!cfg.endpoint) return null;

    const base = cfg.endpoint.replace(/\/+$/, '');
    const res = await fetch(`${base}/api/state`, { headers: buildHeaders(cfg) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function pushSharedState(payload) {
    const cfg = getConfig();
    if (!cfg.endpoint) return false;

    const base = cfg.endpoint.replace(/\/+$/, '');
    const res = await fetch(`${base}/api/state`, {
      method: 'POST',
      headers: buildHeaders(cfg),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  }

  async function loginAccount(identifier, pin, localAccounts) {
    const norm = String(identifier || '').trim().toUpperCase();
    const normHandle = norm.startsWith('@') ? norm : `@${norm}`;
    const normId = norm.startsWith('#') ? norm : `#${norm}`;

    // If cloud is active, try pulling fresh accounts first
    const cfg = getConfig();
    let pool = Array.isArray(localAccounts) ? localAccounts : [];
    if (cfg.mode !== 'local' && cfg.endpoint) {
      try {
        const remote = await pullSharedState();
        if (remote && Array.isArray(remote.accounts) && remote.accounts.length) {
          pool = remote.accounts;
        }
      } catch (err) {
        console.warn('Cloud login fallback to local:', err);
      }
    }

    const found = pool.find(acc => {
      const e = String(acc.email || '').trim().toUpperCase();
      const c = String(acc.callsign || '').toUpperCase();
      const s = String(acc.secretId || '').toUpperCase();
      return (e && e === norm) || c === norm || c === normHandle || s === norm || s === normId;
    });

    if (!found) return { ok: false, error: 'Account non trovato. Controlla Email di partecipazione, Callsign o ID.' };
    if (String(found.pin || '1234') !== String(pin || '').trim()) {
      return { ok: false, error: 'PIN errato. (Per i profili demo il PIN è 1234)' };
    }
    return { ok: true, account: found, pool };
  }

  function applyUrlSyncConfig() {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncMode = params.get('sync');
      const ep = params.get('ep');
      if (syncMode === 'cloudflare' && ep) {
        setConfig({
          mode: 'cloudflare',
          endpoint: ep.trim(),
          apiKey: (params.get('key') || '').trim()
        });
        params.delete('sync');
        params.delete('ep');
        params.delete('key');
        const nextQuery = params.toString();
        const nextUrl = window.location.pathname + (nextQuery ? `?${nextQuery}` : '') + window.location.hash;
        window.history.replaceState({}, '', nextUrl);
        return true;
      }
    } catch {}
    return false;
  }

  function buildShareableSyncUrl() {
    const cfg = getConfig();
    if (cfg.mode === 'local' || !cfg.endpoint) return '';
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      sync: cfg.mode,
      ep: cfg.endpoint
    });
    if (cfg.apiKey) params.set('key', cfg.apiKey);
    return `${base}?${params.toString()}`;
  }

  applyUrlSyncConfig();

  global.DiveSync = {
    getConfig,
    setConfig,
    getStatusLabel,
    pullSharedState,
    pushSharedState,
    loginAccount,
    buildShareableSyncUrl
  };
})(window);
