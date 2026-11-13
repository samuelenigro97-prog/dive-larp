// ==========================================================================
// DIVE Cyberpunk LARP - Multi-Account & Cloud Sync Connector
// Supports: Local Multi-Account (default), Cloudflare Workers REST, Supabase
// ==========================================================================

(function (global) {
  const SYNC_CONFIG_KEY = 'dive_sync_config_v1';

  const DEFAULT_CONFIG = {
    mode: 'local', // 'local' | 'cloudflare' | 'supabase'
    endpoint: '',
    apiKey: ''
  };

  function getConfig() {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function setConfig(nextCfg) {
    const merged = { ...DEFAULT_CONFIG, ...nextCfg };
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(merged));
    return merged;
  }

  function getStatusLabel() {
    const cfg = getConfig();
    if (cfg.mode === 'cloudflare' && cfg.endpoint) return 'CLOUDFLARE SYNC';
    if (cfg.mode === 'supabase' && cfg.endpoint && cfg.apiKey) return 'SUPABASE SYNC';
    return 'DEMO LOCALE';
  }

  function buildHeaders(cfg) {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.mode === 'supabase' && cfg.apiKey) {
      headers['apikey'] = cfg.apiKey;
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    } else if (cfg.apiKey) {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }
    return headers;
  }

  async function pullSharedState() {
    const cfg = getConfig();
    if (cfg.mode === 'local' || !cfg.endpoint) return null;

    const base = cfg.endpoint.replace(/\/+$/, '');
    const url = cfg.mode === 'supabase'
      ? `${base}/rest/v1/dive_state?id=eq.main&select=payload`
      : `${base}/api/state`;

    const res = await fetch(url, { headers: buildHeaders(cfg) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (cfg.mode === 'supabase') {
      return Array.isArray(data) && data[0] ? data[0].payload : null;
    }
    return data;
  }

  async function pushSharedState(payload) {
    const cfg = getConfig();
    if (cfg.mode === 'local' || !cfg.endpoint) return false;

    const base = cfg.endpoint.replace(/\/+$/, '');
    if (cfg.mode === 'supabase') {
      const res = await fetch(`${base}/rest/v1/dive_state?on_conflict=id`, {
        method: 'POST',
        headers: { ...buildHeaders(cfg), Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: 'main', payload, updated_at: new Date().toISOString() })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    }

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
      const c = String(acc.callsign || '').toUpperCase();
      const s = String(acc.secretId || '').toUpperCase();
      return c === norm || c === normHandle || s === norm || s === normId;
    });

    if (!found) return { ok: false, error: 'Runner non trovato. Controlla Callsign o Codice ID.' };
    if (String(found.pin || '1234') !== String(pin || '').trim()) {
      return { ok: false, error: 'PIN errato. (Per i profili demo il PIN è 1234)' };
    }
    return { ok: true, account: found, pool };
  }

  global.DiveSync = {
    getConfig,
    setConfig,
    getStatusLabel,
    pullSharedState,
    pushSharedState,
    loginAccount
  };
})(window);
