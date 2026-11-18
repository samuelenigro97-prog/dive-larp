// ==========================================================================
// DIVE Cyberpunk LARP - Complete Engine & Mechanics
// Based on LARP Design Call & Rulebook
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. Cyberpunk Web Audio Synthesizer (Zero external dependencies)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let audioBus = null;
  let sfxEnabled = true;
  const sfxToggle = document.getElementById('sfx-toggle');

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function getAudioBus(ctx) {
    if (audioBus && audioBus.ctx === ctx) return audioBus.input;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.85, ctx.currentTime);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-12, ctx.currentTime);
    limiter.ratio.setValueAtTime(8, ctx.currentTime);
    master.connect(limiter);
    limiter.connect(ctx.destination);

    // Subtle cyberdeck metallic slapback echo
    const delayNode = ctx.createDelay(0.5);
    delayNode.delayTime.setValueAtTime(0.052, ctx.currentTime);
    const echoFilter = ctx.createBiquadFilter();
    echoFilter.type = 'bandpass';
    echoFilter.frequency.setValueAtTime(1750, ctx.currentTime);
    echoFilter.Q.setValueAtTime(1.4, ctx.currentTime);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.24, ctx.currentTime);
    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.22, ctx.currentTime);

    master.connect(delayNode);
    delayNode.connect(echoFilter);
    echoFilter.connect(feedback);
    feedback.connect(delayNode);
    echoFilter.connect(wetGain);
    wetGain.connect(limiter);

    audioBus = { ctx, input: master };
    return master;
  }

  function synthTone(ctx, {
    freqStart,
    freqEnd,
    type = 'sawtooth',
    duration = 0.12,
    gainPeak = 0.08,
    delay = 0,
    filterFreq = 2200,
    filterType = 'lowpass',
    filterQ = 4,
    detune = 0,
    fmFreq = 0,
    fmDepth = 0
  }) {
    const t0 = ctx.currentTime + delay;
    const t1 = t0 + duration;
    const bus = getAudioBus(ctx);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.detune.setValueAtTime(detune, t0);
    osc.frequency.setValueAtTime(Math.max(40, freqStart), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd ?? freqStart), t1);

    let modOsc = null;
    if (fmFreq > 0 && fmDepth > 0) {
      modOsc = ctx.createOscillator();
      const modGain = ctx.createGain();
      modOsc.type = 'sine';
      modOsc.frequency.setValueAtTime(fmFreq, t0);
      modGain.gain.setValueAtTime(fmDepth, t0);
      modGain.gain.exponentialRampToValueAtTime(1, t1);
      modOsc.connect(modGain);
      modGain.connect(osc.frequency);
      modOsc.start(t0);
      modOsc.stop(t1 + 0.01);
    }

    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, t0);
    if (filterType === 'lowpass') {
      filter.frequency.exponentialRampToValueAtTime(Math.max(180, filterFreq * 0.3), t1);
    }
    filter.Q.setValueAtTime(filterQ, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + Math.min(0.012, duration * 0.18));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus);

    osc.start(t0);
    osc.stop(t1 + 0.015);
  }

  function playCyberFx(preset = 'ui') {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      switch (preset) {
        case 'ui':
          // Tactile holographic HUD chirp + sub click
          synthTone(ctx, { freqStart: 1650, freqEnd: 740, type: 'sawtooth', duration: 0.038, gainPeak: 0.05, filterFreq: 3400, filterType: 'bandpass', filterQ: 3.5, fmFreq: 95, fmDepth: 120 });
          synthTone(ctx, { freqStart: 220, freqEnd: 110, type: 'triangle', duration: 0.035, gainPeak: 0.045, filterFreq: 800 });
          break;
        case 'scan':
          // Kiroshi optical lock-on double telemetry ping
          synthTone(ctx, { freqStart: 980, freqEnd: 1760, type: 'sine', duration: 0.055, gainPeak: 0.06, filterFreq: 3800, fmFreq: 45, fmDepth: 65 });
          synthTone(ctx, { freqStart: 1480, freqEnd: 2340, type: 'triangle', duration: 0.085, gainPeak: 0.06, delay: 0.065, filterFreq: 4200, filterQ: 5 });
          break;
        case 'quickhack':
          // Netrunner ICE breach sweep: dual detuned saw + FM modem pulse
          synthTone(ctx, { freqStart: 240, freqEnd: 1580, type: 'sawtooth', duration: 0.15, gainPeak: 0.07, filterFreq: 3600, filterQ: 8, detune: -14, fmFreq: 55, fmDepth: 140 });
          synthTone(ctx, { freqStart: 240, freqEnd: 1580, type: 'sawtooth', duration: 0.15, gainPeak: 0.06, filterFreq: 3600, filterQ: 8, detune: 14 });
          synthTone(ctx, { freqStart: 1320, freqEnd: 420, type: 'square', duration: 0.16, gainPeak: 0.045, delay: 0.11, filterFreq: 2400, filterQ: 6, fmFreq: 180, fmDepth: 90 });
          break;
        case 'quickhack-end':
          synthTone(ctx, { freqStart: 620, freqEnd: 92, type: 'sawtooth', duration: 0.22, gainPeak: 0.065, filterFreq: 1800, filterQ: 6, fmFreq: 35, fmDepth: 55 });
          break;
        case 'ram':
          // Cyberdeck capacitor surge
          synthTone(ctx, { freqStart: 280, freqEnd: 720, type: 'sawtooth', duration: 0.075, gainPeak: 0.055, filterFreq: 2600, filterQ: 5 });
          synthTone(ctx, { freqStart: 720, freqEnd: 1440, type: 'triangle', duration: 0.12, gainPeak: 0.065, delay: 0.065, filterFreq: 3600, fmFreq: 80, fmDepth: 60 });
          break;
        case 'success':
          // Neon synth chord arpeggio (D-minor / cyber triad shimmer)
          synthTone(ctx, { freqStart: 440, freqEnd: 440, type: 'sawtooth', duration: 0.09, gainPeak: 0.05, filterFreq: 2600, filterQ: 4 });
          synthTone(ctx, { freqStart: 659, freqEnd: 659, type: 'triangle', duration: 0.1, gainPeak: 0.06, delay: 0.055, filterFreq: 3200 });
          synthTone(ctx, { freqStart: 880, freqEnd: 1318, type: 'sine', duration: 0.18, gainPeak: 0.065, delay: 0.11, filterFreq: 4200, fmFreq: 6, fmDepth: 12 });
          break;
        case 'denied':
          // Heavy ICE firewall rejection buzz
          synthTone(ctx, { freqStart: 165, freqEnd: 95, type: 'sawtooth', duration: 0.11, gainPeak: 0.08, filterFreq: 950, filterQ: 7, detune: -18, fmFreq: 42, fmDepth: 45 });
          synthTone(ctx, { freqStart: 145, freqEnd: 82, type: 'square', duration: 0.16, gainPeak: 0.07, delay: 0.095, filterFreq: 820, filterQ: 6, detune: 18 });
          break;
        case 'alert':
          // Corporate perimeter klaxon pulse
          synthTone(ctx, { freqStart: 860, freqEnd: 490, type: 'sawtooth', duration: 0.15, gainPeak: 0.07, filterFreq: 2400, filterQ: 7, fmFreq: 30, fmDepth: 55 });
          synthTone(ctx, { freqStart: 860, freqEnd: 490, type: 'sawtooth', duration: 0.18, gainPeak: 0.07, delay: 0.17, filterFreq: 2400, filterQ: 7, fmFreq: 30, fmDepth: 55 });
          break;
        case 'logout':
          // Neural jack-out power-down sequence
          synthTone(ctx, { freqStart: 920, freqEnd: 420, type: 'triangle', duration: 0.08, gainPeak: 0.06, filterFreq: 2600 });
          synthTone(ctx, { freqStart: 420, freqEnd: 110, type: 'sawtooth', duration: 0.18, gainPeak: 0.065, delay: 0.07, filterFreq: 1400, filterQ: 5, fmFreq: 24, fmDepth: 35 });
          break;
        default:
          synthTone(ctx, { freqStart: 840, freqEnd: 460, type: 'sawtooth', duration: 0.055, gainPeak: 0.05, filterFreq: 2600, filterQ: 4 });
      }
    } catch {
      // silent
    }
  }

  function playCyberSound(frequency = 440, type = 'sine', duration = 0.08) {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Map legacy calls to layered cyberpunk synth presets
      if (frequency <= 260) {
        synthTone(ctx, { freqStart: frequency, freqEnd: frequency * 0.55, type: 'sawtooth', duration: Math.max(duration, 0.15), gainPeak: 0.07, filterFreq: 980, filterQ: 7, detune: -12, fmFreq: 38, fmDepth: 40 });
        synthTone(ctx, { freqStart: frequency * 0.98, freqEnd: frequency * 0.52, type: 'square', duration: Math.max(duration, 0.15), gainPeak: 0.045, filterFreq: 900, detune: 12 });
      } else if (duration <= 0.065) {
        synthTone(ctx, { freqStart: frequency * 1.45, freqEnd: frequency * 0.72, type: 'sawtooth', duration: 0.042, gainPeak: 0.05, filterFreq: 2900, filterType: 'bandpass', filterQ: 3.5, fmFreq: 75, fmDepth: 80 });
        synthTone(ctx, { freqStart: frequency * 0.5, freqEnd: frequency * 0.35, type: 'sine', duration: 0.035, gainPeak: 0.035, filterFreq: 900 });
      } else if (frequency >= 750) {
        synthTone(ctx, { freqStart: frequency * 0.78, freqEnd: frequency * 1.18, type: 'triangle', duration: Math.min(duration, 0.14), gainPeak: 0.055, filterFreq: 3400, filterQ: 4 });
        synthTone(ctx, { freqStart: frequency * 1.18, freqEnd: frequency * 1.5, type: 'sine', duration: Math.min(duration, 0.14), gainPeak: 0.05, delay: 0.05, filterFreq: 4000 });
      } else {
        synthTone(ctx, { freqStart: frequency, freqEnd: frequency * 1.25, type: type === 'sine' ? 'sawtooth' : type, duration, gainPeak: 0.058, filterFreq: 2800, filterQ: 5, fmFreq: 40, fmDepth: 45 });
      }
    } catch {
      // silent
    }
  }

  if (sfxToggle) {
    sfxToggle.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      sfxToggle.classList.toggle('text-dive-orange', sfxEnabled);
      sfxToggle.classList.toggle('text-slate-500', !sfxEnabled);
      if (sfxEnabled) playCyberFx('ram');
    });
  }

  // --------------------------------------------------------------------------
  // 2. Player State & Roster Simulation
  // --------------------------------------------------------------------------
  const DEFAULT_PLAYER = {
    callsign: '@V_Solo',
    role: 'MERCENARIO // SOLO',
    secretId: '#V-7842',
    playerName: 'Valerio',
    playerSurname: 'Rinaldi',
    email: 'v.solo@dive.larp',
    playerContact: '+39 340 784 2019',
    assignedByMaster: true,
    avatar: 'assets/images/avatars/pg-1.jpg',
    themeColor: 'orange',
    hp: 100,
    psych: 10,
    fama: 3,
    wallet: 1500,
    ram: 8,
    ramMax: 8,
    iceActive: true,
    traumas: [],
    transactions: [
      { id: 'tx_1', type: 'in', desc: 'Ingaggio iniziale corporativo', amount: 1500, time: 'Inizio Evento' }
    ],
    chatMessages: {
      fixer: [
        { author: '@The_Fixer', text: '[TAGLIA] Cerco qualcuno per estrarre il datashard dal terminale blu al piano inferiore. Paga: 400 €$.', time: '19:00' },
        { author: '@The_Fixer', text: 'Chi ha bisogno di codici bersaglio per intrusioni, mi trova all\'angolo bar.', time: '19:15' }
      ],
      blackmarket: [
        { author: '@BROKER_ANON', text: '[ID #291012340] Pacchetto sigillato. Consegna silenziosa al molo di Navarro. Paga: 650 €$.', time: '19:02' },
        { author: '@BROKER_ANON', text: '[ID #300419409] Estrazione campione biologico non tracciato (settore Neptun). Paga: 900 €$.', time: '19:08' },
        { author: '@BROKER_ANON', text: '[ID #419085703] Recupero modulo Kiroshi danneggiato da corpo Scav. Solo contatto cifrato.', time: '19:14' }
      ],
      corp: [
        { author: '@DIVE_Control', text: 'Benvenuti nel Settore 04 Ciminiere. Vietato estrarre armi nei privé.', time: '19:00' }
      ],
      direct: [
        { author: '@Kuro_04', text: 'Choom, hai visto chi c\'è al tavolo dei mercenari? Sembra della Militech.', time: '19:10' }
      ]
    }
  };

  const ROSTER_SEED = [
    { callsign: '@V_Solo', role: 'MERCENARIO // SOLO', secretId: '#V-7842', pin: '1234', playerName: 'Valerio', playerSurname: 'Rinaldi', email: 'v.solo@dive.larp', playerContact: '+39 340 784 2019', avatar: 'assets/images/avatars/pg-1.jpg', themeColor: 'orange', hp: 100, psych: 10, fama: 3, wallet: 1500, ram: 8, ramMax: 8, ice: true },
    { callsign: '@Kuro_04', role: 'NETRUNNER // HACKER', secretId: '#K-4109', pin: '1234', playerName: 'Elena', playerSurname: 'Moretti', email: 'kuro.04@dive.larp', playerContact: '+39 349 410 9044', avatar: 'assets/images/avatars/pg-2.jpg', themeColor: 'cyan', hp: 100, psych: 25, fama: 4, wallet: 850, ram: 8, ramMax: 8, ice: false },
    { callsign: '@Doc_Chrome', role: 'TECHIE // RIPPERDOC', secretId: '#D-5510', pin: '1234', playerName: 'Lorenzo', playerSurname: 'De Luca', email: 'doc.chrome@dive.larp', playerContact: '+39 345 551 0088', avatar: 'assets/images/avatars/pg-3.jpg', themeColor: 'red', hp: 100, psych: 15, fama: 4, wallet: 2200, ram: 8, ramMax: 8, ice: true },
    { callsign: '@The_Fixer', role: 'FIXER // BROKER', secretId: '#F-3088', pin: '1234', playerName: 'Giulia', playerSurname: 'Sartori', email: 'the.fixer@dive.larp', playerContact: '+39 348 308 8120', avatar: 'assets/images/avatars/pg-4.jpg', themeColor: 'orange', hp: 100, psych: 5, fama: 5, wallet: 4800, ram: 8, ramMax: 8, ice: true },
    { callsign: '@Dr_Vex', role: 'CHIMICO // BIOTECH', secretId: '#B-6420', pin: '1234', playerName: 'Chiara', playerSurname: 'Valenti', email: 'dr.vex@dive.larp', playerContact: '+39 342 642 0199', avatar: 'assets/images/avatars/pg-5.jpg', themeColor: 'green', hp: 100, psych: 20, fama: 3, wallet: 1750, ram: 8, ramMax: 8, ice: true },
    { callsign: '@Runner_Insolito', role: 'SOLO // VAGABONDO', secretId: '#R-9921', pin: '1234', playerName: 'Marco', playerSurname: 'Bellini', email: 'runner.insolito@dive.larp', playerContact: '+39 328 992 1033', avatar: 'assets/images/avatars/pg-6.jpg', themeColor: 'green', hp: 55, psych: 45, fama: 2, wallet: 320, ram: 8, ramMax: 8, ice: false, traumas: [{ name: 'Frattura Avambraccio', desc: 'Riduce stabilità arma secondaria.' }] },
    { callsign: '@CyberRex', role: 'MAELSTROM // CORPO', secretId: '#C-0012', pin: '1234', playerName: 'Davide', playerSurname: 'Conti', email: 'cyberrex@dive.larp', playerContact: '+39 333 001 2245', avatar: 'assets/images/avatars/pg-7.jpg', themeColor: 'red', hp: 100, psych: 0, fama: 5, wallet: 5400, ram: 8, ramMax: 8, ice: true },
    { callsign: '@Nico_Media', role: 'MEDIA // REPORTER', secretId: '#M-3384', pin: '1234', playerName: 'Nicola', playerSurname: 'Ferri', email: 'nico.media@dive.larp', playerContact: '+39 347 338 4410', avatar: 'assets/images/avatars/pg-8.jpg', themeColor: 'purple', hp: 100, psych: 15, fama: 3, wallet: 1200, ram: 8, ramMax: 8, ice: false }
  ];

  const ACCOUNTS_STORAGE_KEY = 'dive_accounts_v1';
  const SESSION_STORAGE_KEY = 'dive_session_v1';

  function normalizeAccount(raw) {
    return {
      ...DEFAULT_PLAYER,
      ...raw,
      playerContact: String(raw.playerContact ?? DEFAULT_PLAYER.playerContact).replace(/\s*·\s*Telegram\b.*$/i, '').trim(),
      iceActive: raw.iceActive !== undefined ? raw.iceActive : Boolean(raw.ice),
      pin: raw.pin || '1234',
      ram: raw.ram ?? 8,
      ramMax: raw.ramMax ?? 8,
      traumas: Array.isArray(raw.traumas) ? raw.traumas : [],
      contacts: Array.isArray(raw.contacts) ? raw.contacts : [],
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [
        { id: 'tx_init', type: 'in', desc: 'Saldo iniziale evento', amount: raw.wallet ?? 1000, time: 'Inizio Evento' }
      ]
    };
  }

  function getAccountsRegistry() {
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          const normalized = parsed.map(normalizeAccount);
          let added = false;
          ROSTER_SEED.forEach(seed => {
            if (!normalized.some(acc => (acc.secretId || '').toUpperCase() === seed.secretId.toUpperCase())) {
              normalized.push(normalizeAccount(seed));
              added = true;
            }
          });
          if (added) localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch {
      // fallback seed
    }
    const seeded = ROSTER_SEED.map(normalizeAccount);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  const BROADCAST_STORAGE_KEY = 'dive_broadcast_v1';
  let lastCloudSyncedAt = 0;

  function getBroadcastState() {
    try {
      const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { text: '', active: false, updatedAt: 0 };
    } catch {
      return { text: '', active: false, updatedAt: 0 };
    }
  }

  function applyBroadcastUI(state) {
    const banner = document.getElementById('global-broadcast-banner');
    const textEl = document.getElementById('global-broadcast-text');
    if (!banner || !textEl) return;
    if (state && state.active && state.text) {
      textEl.textContent = state.text;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function saveBroadcastState(state) {
    const next = {
      text: String(state?.text || ''),
      active: Boolean(state?.active),
      updatedAt: state?.updatedAt || Date.now()
    };
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(next));
    applyBroadcastUI(next);
    scheduleCloudPush();
  }

  function saveAccountsRegistry(accounts, skipPush = false) {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    if (!skipPush) scheduleCloudPush();
  }

  function getActiveSessionId() {
    return localStorage.getItem(SESSION_STORAGE_KEY) || '';
  }

  function setActiveSessionId(secretId) {
    if (secretId) {
      localStorage.setItem(SESSION_STORAGE_KEY, secretId);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  function getPlayerState() {
    const accounts = getAccountsRegistry();
    const sessionId = getActiveSessionId();
    if (sessionId) {
      const matched = accounts.find(a => a.secretId.toUpperCase() === sessionId.toUpperCase());
      if (matched) return matched;
    }
    try {
      const stored = localStorage.getItem('dive_player_state_v2');
      return stored ? { ...DEFAULT_PLAYER, ...JSON.parse(stored) } : accounts[0] || DEFAULT_PLAYER;
    } catch {
      return accounts[0] || DEFAULT_PLAYER;
    }
  }

  let syncPushTimeout = null;
  function scheduleCloudPush() {
    if (!window.DiveSync || window.DiveSync.getConfig().mode === 'local') return;
    clearTimeout(syncPushTimeout);
    syncPushTimeout = setTimeout(() => {
      const updatedAt = Date.now();
      lastCloudSyncedAt = updatedAt;
      window.DiveSync.pushSharedState({
        accounts: getAccountsRegistry(),
        posts: typeof getSocialPosts === 'function' ? getSocialPosts() : [],
        groups: typeof getChatGroups === 'function' ? getChatGroups() : [],
        broadcast: getBroadcastState(),
        updatedAt
      }).catch(err => console.warn('Cloud push error:', err));
    }, 300);
  }

  function applySharedState(remote) {
    if (!remote || typeof remote !== 'object') return false;
    const remoteTs = Number(remote.updatedAt || 0);
    if (remoteTs && remoteTs <= lastCloudSyncedAt) return false;
    lastCloudSyncedAt = remoteTs || Date.now();

    if (Array.isArray(remote.accounts) && remote.accounts.length) {
      const normalizedAccounts = remote.accounts.map(normalizeAccount);
      saveAccountsRegistry(normalizedAccounts, true);
      const currentSid = (getActiveSessionId() || player?.secretId || '').toUpperCase();
      const updatedMe = normalizedAccounts.find(a => (a.secretId || '').toUpperCase() === currentSid);
      if (updatedMe) {
        player = updatedMe;
        localStorage.setItem('dive_player_state_v2', JSON.stringify(player));
      }
    }

    if (Array.isArray(remote.posts)) {
      localStorage.setItem('dive_social_feed_posts_v3', JSON.stringify(remote.posts));
    }

    if (Array.isArray(remote.groups)) {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(remote.groups));
    }

    if (remote.broadcast && typeof remote.broadcast === 'object') {
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(remote.broadcast));
      applyBroadcastUI(remote.broadcast);
    }

    if (typeof syncPlayerUI === 'function') syncPlayerUI();
    if (typeof renderSocialFeed === 'function') renderSocialFeed();
    if (typeof renderChat === 'function') renderChat();
    if (typeof renderChatGroupsBar === 'function') renderChatGroupsBar();
    if (typeof renderAdminRoster === 'function') renderAdminRoster();
    return true;
  }

  async function pullFromCloud() {
    if (!window.DiveSync || window.DiveSync.getConfig().mode === 'local') return false;
    try {
      const remote = await window.DiveSync.pullSharedState();
      return applySharedState(remote);
    } catch (err) {
      console.warn('Cloud pull error:', err);
      return false;
    }
  }

  function savePlayerState(state) {
    try {
      const normalized = normalizeAccount(state);
      localStorage.setItem('dive_player_state_v2', JSON.stringify(normalized));
      const accounts = getAccountsRegistry();
      const idx = accounts.findIndex(a => a.secretId.toUpperCase() === (normalized.secretId || '').toUpperCase());
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...normalized };
      } else {
        accounts.push(normalized);
      }
      saveAccountsRegistry(accounts);
      syncPlayerUI();
      renderAdminRoster();
      scheduleCloudPush();
    } catch (e) {
      console.warn('Storage error', e);
    }
  }

  let player = getPlayerState();
  let activeSheetRunner = null;

  function getSheetUrl(secretId) {
    const cleanId = String(secretId || '#V-7842').replace(/^#/, '');
    const base = window.location.origin + window.location.pathname;
    return `${base}?pg=${encodeURIComponent(cleanId)}`;
  }

  function findRunnerByPgParam(pgParam) {
    if (!pgParam) return null;
    const normalized = ('#' + pgParam.replace(/^#/, '')).toUpperCase();
    if ((player.secretId || '#V-7842').toUpperCase() === normalized) {
      return null; // È la propria scheda
    }
    const found = getAccountsRegistry().find(r => r.secretId.toUpperCase() === normalized);
    if (!found) return null;
    return {
      callsign: found.callsign,
      role: found.role,
      secretId: found.secretId,
      avatar: found.avatar || 'assets/images/avatars/pg-1.jpg',
      themeColor: found.themeColor || 'orange',
      hp: found.hp,
      psych: found.psych,
      iceActive: found.iceActive,
      traumas: found.traumas || []
    };
  }

  function renderRosterSwitcher() {
    const switcher = document.getElementById('pg-roster-switcher');
    if (!switcher) return;
    const allRunners = [
      { callsign: player.callsign, secretId: player.secretId || '#V-7842', isSelf: true },
      ...ROSTER_SEED.filter(r => (r.secretId || '').toUpperCase() !== (player.secretId || '#V-7842').toUpperCase())
        .map(r => ({ callsign: r.callsign, secretId: r.secretId, isSelf: false }))
    ];
    const currentId = ((activeSheetRunner ? activeSheetRunner.secretId : player.secretId) || '#V-7842').toUpperCase();

    switcher.innerHTML = allRunners.map(r => {
      const isSelected = r.secretId.toUpperCase() === currentId;
      return `
        <button type="button" data-pg-id="${r.secretId}" class="pg-switch-btn px-3 py-1.5 rounded-sm border whitespace-nowrap transition-colors ${isSelected ? 'border-dive-orange bg-dive-orange/15 text-dive-orange font-bold' : 'border-white/10 bg-[#080B12] text-slate-400 hover:text-white'}">
          ${r.isSelf ? '[MIA] ' : ''}${r.callsign} (${r.secretId})
        </button>
      `;
    }).join('');

    switcher.querySelectorAll('.pg-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pgId = btn.getAttribute('data-pg-id');
        activeSheetRunner = findRunnerByPgParam(pgId);
        syncPlayerUI();
        playCyberSound(500, 'triangle', 0.05);
      });
    });
  }

  const CYBERWARE_LEFT_SLOTS = [
    'CORTECCIA FRONTALE',
    'SISTEMA OCULARE',
    'SISTEMA CIRCOLATORIO',
    'SISTEMA IMMUNITARIO',
    'SISTEMA NERVOSO',
    'SISTEMA TEGUMENTARIO'
  ];

  const CYBERWARE_RIGHT_SLOTS = [
    'SISTEMA OPERATIVO',
    'SCHELETRO',
    'MANI',
    'BRACCIA',
    'GAMBE'
  ];

  const CYBERWARE_BY_PG = {
    '#V-7842': {
      'SISTEMA OCULARE': { name: 'OTTICHE KIROSHI', tag: 'TIER 2', desc: 'Scansione ottica QR di scena e schede runner.', img: 'assets/images/implants/implant-kiroshi.jpg', color: 'cyan' },
      'SISTEMA NERVOSO': { name: 'GHOST PROTOCOL', tag: 'MEDIA', desc: 'Leak anonimi e moderazione feed The Net.', img: 'assets/images/implants/implant-ghost.jpg', color: 'purple' },
      'SISTEMA TEGUMENTARIO': { name: 'ARMATURA SUBDERMICA', tag: 'PASSIVO', desc: 'Nanotubi di carbonio contro danni e traumi.', img: 'assets/images/implants/implant-subdermal.jpg', color: 'orange' },
      'SISTEMA OPERATIVO': { name: 'CYBERDECK PARALINE', tag: 'DECK OS', desc: 'Comandi rapidi 5s (Override) e violazione ICE.', img: 'assets/images/implants/implant-cyberdeck.jpg', color: 'cyan' }
    },
    '#K-4109': {
      'CORTECCIA FRONTALE': { name: 'SELF-ICE NEURALE', tag: 'NET', desc: 'Schermatura sinaptica contro contro-attacchi ICE.', img: 'assets/images/implants/implant-cyberdeck.jpg', color: 'cyan' },
      'SISTEMA OCULARE': { name: 'OTTICHE KIROSHI ORACLE', tag: 'TIER 3', desc: 'Decodifica flussi dati e nodi nascosti in AR.', img: 'assets/images/implants/implant-kiroshi.jpg', color: 'cyan' },
      'SISTEMA CIRCOLATORIO': { name: 'BIOMONITOR OVERCLOCK', tag: 'BOOST', desc: 'Raffreddamento rapido RAM durante breach complessi.', img: 'assets/images/implants/implant-subdermal.jpg', color: 'cyan' },
      'SISTEMA NERVOSO': { name: 'GHOST PROTOCOL V2', tag: 'STEALTH', desc: 'Occultamento tracce e spoofing indirizzo rete.', img: 'assets/images/implants/implant-ghost.jpg', color: 'purple' },
      'SISTEMA OPERATIVO': { name: 'NETWATCH NETDRIVER', tag: 'MK.5', desc: 'Suite di intrusione profonda e controllo daemons.', img: 'assets/images/implants/implant-cyberdeck.jpg', color: 'cyan' }
    },
    '#R-9921': {
      'SISTEMA OCULARE': { name: 'VISORE NOMAD', tag: 'TIER 1', desc: 'Telemetria termica e lettura tracce in esterna.', img: 'assets/images/implants/implant-kiroshi.jpg', color: 'green' },
      'SISTEMA IMMUNITARIO': { name: 'FILTRO TOSSINE', tag: 'BIO', desc: 'Neutralizza gas, scorie e stimolanti sintetici.', img: 'assets/images/implants/implant-subdermal.jpg', color: 'green' },
      'SISTEMA TEGUMENTARIO': { name: 'PLACCATURA KEVLAR', tag: 'PASSIVO', desc: 'Rinforzo dermico anti-taglio e urti da strada.', img: 'assets/images/implants/implant-subdermal.jpg', color: 'green' },
      'GAMBE': { name: 'TENDINI RINFORZATI', tag: 'MOBILITÀ', desc: 'Scatto silenzioso e recupero rapido in fuga.', img: 'assets/images/implants/implant-ghost.jpg', color: 'green' }
    },
    '#C-0012': {
      'CORTECCIA FRONTALE': { name: 'LIMITATORE DOLORE', tag: 'COMBAT', desc: 'Ignora penalità critiche finché resta HP > 10%.', img: 'assets/images/implants/implant-ghost.jpg', color: 'red' },
      'SISTEMA OCULARE': { name: 'OTTICHE MAELSTROM', tag: 'MIL-SPEC', desc: 'Puntamento multi-bersaglio ad alta frequenza.', img: 'assets/images/implants/implant-kiroshi.jpg', color: 'red' },
      'SISTEMA CIRCOLATORIO': { name: 'POMPA ADRENALINA', tag: 'COMBAT', desc: 'Scarica immediata all’attivazione dello scontro.', img: 'assets/images/implants/implant-subdermal.jpg', color: 'red' },
      'SISTEMA TEGUMENTARIO': { name: 'CORAZZA SUBDERMICA MK.4', tag: 'HEAVY', desc: 'Scaglie composite balistiche sottoepidermiche.', img: 'assets/images/implants/implant-subdermal.jpg', color: 'red' },
      'SISTEMA OPERATIVO': { name: 'SANDEVISTAN MILITECH', tag: 'SANDY', desc: 'Accelerazione riflessi e finestra tattica 5s.', img: 'assets/images/implants/implant-cyberdeck.jpg', color: 'red' },
      'BRACCIA': { name: 'LAME MANTIDE', tag: 'MELEE', desc: 'Lame retrattili ad alta vibrazione negli avambracci.', img: 'assets/images/implants/implant-ghost.jpg', color: 'red' }
    },
    '#M-3384': {
      'CORTECCIA FRONTALE': { name: 'MEMORIA OLOGRAFICA', tag: 'REC', desc: 'Registrazione audio/video criptata di ogni scena.', img: 'assets/images/implants/implant-cyberdeck.jpg', color: 'purple' },
      'SISTEMA OCULARE': { name: 'OTTICHE BROADCAST 8K', tag: 'STREAM', desc: 'Diretta live su The Net con zoom ottico.', img: 'assets/images/implants/implant-kiroshi.jpg', color: 'purple' },
      'SISTEMA NERVOSO': { name: 'GHOST PROTOCOL LEAK', tag: 'MEDIA', desc: 'Pubblicazione anonima e protezione fonti.', img: 'assets/images/implants/implant-ghost.jpg', color: 'purple' },
      'SISTEMA OPERATIVO': { name: 'CYBERDECK SIGNAL', tag: 'DECK', desc: 'Relay satellitare portatile anti-jamming.', img: 'assets/images/implants/implant-cyberdeck.jpg', color: 'purple' }
    }
  };

  function renderCyberwareSlotHTML(slotName, implant, emptyAccent) {
    if (!implant) {
      return `
        <div class="px-2.5 py-2 bg-[#04060A]/80 border border-dashed border-dive-${emptyAccent}/30 flex items-center justify-between gap-2 font-mono rounded-sm">
          <div>
            <span class="text-[9px] text-dive-${emptyAccent} font-bold uppercase block">${slotName}</span>
            <span class="text-[9px] text-slate-500">Slot libero</span>
          </div>
          <span class="w-6 h-6 border border-dive-${emptyAccent}/30 text-dive-${emptyAccent}/70 flex items-center justify-center text-xs">+</span>
        </div>
      `;
    }
    const c = implant.color || 'cyan';
    const slotVariant = c === 'purple' ? 'cyberware-slot-purple' : (c === 'orange' ? 'cyberware-slot-orange' : (c === 'red' ? 'cyberware-slot-red' : ''));
    return `
      <div class="cyberware-slot ${slotVariant} p-2.5 space-y-1">
        <div class="flex items-center justify-between font-mono text-[9px]">
          <span class="text-dive-${c} font-bold uppercase">${slotName}</span>
          <span class="text-slate-500">${implant.tag || 'ATTIVO'}</span>
        </div>
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 bg-black border border-dive-${c}/40 flex-shrink-0 overflow-hidden">
            <img src="${implant.img}" alt="${implant.name}" class="w-full h-full object-cover">
          </div>
          <div class="min-w-0">
            <h4 class="font-orbitron font-bold text-[11px] text-white leading-tight">${implant.name}</h4>
            <p class="font-sans text-[10px] text-slate-400 leading-tight mt-0.5">${implant.desc}</p>
          </div>
        </div>
      </div>
    `;
  }

  const IMMERSION_BADGES = {
    normale: { label: '潜る NORMALE', cls: 'px-1.5 py-0.5 bg-black border border-slate-500/50 text-slate-300 font-bold' },
    vivibile: { label: '潜る VIVIBILE', cls: 'px-1.5 py-0.5 bg-black border border-emerald-500/50 text-emerald-400 font-bold' },
    medio: { label: '潜る MEDIO', cls: 'px-1.5 py-0.5 bg-black border border-blue-500/50 text-blue-400 font-bold' },
    difficile: { label: '潜る DIFFICILE', cls: 'px-1.5 py-0.5 bg-black border border-purple-500/60 text-purple-400 font-bold' }
  };

  const PG_PSYCH_BY_ID = {
    '#V-7842': {
      faction: 'PORTO FRANCO NAVARRO',
      immersion: 'medio',
      mantra: '"Non mi volto indietro finché il conto non è chiuso."',
      song: 'Nightcall — Kavinsky',
      thought: '"Non credevo di poter arrivare fino a qui, sono così vicino a lei. Se i miei calcoli sono giusti, tra qualche giorno potrò raggiungerla."',
      keyConcepts: ['Ex-militare', 'Debito d\'onore', 'Sangue freddo', 'Cicatrici', 'Lealtà selettiva', 'Ricerca'],
      archetype: 'Ribelle // ISTP',
      traumaCore: 'Perdita in zona bellica',
      reaction: 'Freddezza / Rabbia controllata',
      motivation: 'Ritrovare un legame & Sopravvivere'
    },
    '#K-4109': {
      faction: 'CARAVIGLIARDI // LA STELLA',
      immersion: 'difficile',
      mantra: '"Ogni sistema ha una crepa. Io ci vivo dentro."',
      song: 'Resonance — HOME',
      thought: '"I Caravigliardi si fidano solo dei Tarocchi e del codice. Se salto un nodo stasera, salta l\'intera copertura."',
      keyConcepts: ['Oracolo: La Stella', 'Infiltrazione', 'Paranoia lucida', 'Debito Neptun', 'Segreti', 'Net-ghost'],
      archetype: 'Architetto // INTJ',
      traumaCore: 'Tradimento intellettuale',
      reaction: 'Dissociazione / Controllo analitico',
      motivation: 'Scoprire la verità su Neptun'
    },
    '#D-5510': {
      faction: 'PORTO FRANCO NAVARRO',
      immersion: 'medio',
      mantra: '"La carne cede, il cromo tiene il conto."',
      song: 'Turbo Killer — Carpenter Brut',
      thought: '"Troppe teste cromate dei KK stanno andando fuori fase. Qualcuno deve tenerli in piedi prima che esploda il settore."',
      keyConcepts: ['Clinica clandestina', 'Empatia soppressa', 'Debiti di sangue', 'Bisturi', 'Fornitore KK', 'Cinismo'],
      archetype: 'Distruttore // ENTP',
      traumaCore: 'Fallimento pubblico in sala',
      reaction: 'Sarcasmo difensivo / Pragmatismo',
      motivation: 'Ripagare un errore passato'
    },
    '#F-3088': {
      faction: 'NYOKA CIRCLE',
      immersion: 'difficile',
      mantra: '"There\'s no good ending in cyberpunk."',
      song: 'After Dark — Mr.Kitty',
      thought: '"Tutti credono che il Fixer muova i fili, ma basta un contratto sbagliato tra Nyoka Circle e Caravigliardi per bruciare tutto."',
      keyConcepts: ['Nyoka Circle', 'Doppio gioco', 'Informazioni', 'Taglie Black Market', 'Carisma', 'Rischio'],
      archetype: 'Comandante // ENTJ',
      traumaCore: 'Sospeso con vecchio socio',
      reaction: 'Manipolazione / Calcolo freddo',
      motivation: 'Controllo del Porto Franco'
    },
    '#B-6420': {
      faction: 'NEPTUN // BIOTECH',
      immersion: 'difficile',
      mantra: '"Se non controlli la mutazione, ti divora."',
      song: 'Genesis — Grimes',
      thought: '"I campioni delle vasche non rispondono più ai protocolli Neptun. Se esce fuori che il siero è instabile, sono finita."',
      keyConcepts: ['Biolab Neptun', 'Muffe & Patogeni', 'Segreto corporativo', 'Insonnia', 'Immunosoppressori', 'Ambizione'],
      archetype: 'Visionario // INFJ',
      traumaCore: 'Ricordi modificati dal sistema',
      reaction: 'Evitamento / Iper-focus',
      motivation: 'Creare l\'antidoto definitivo'
    },
    '#R-9921': {
      faction: 'INDIPENDENTE // SCAV',
      immersion: 'normale',
      mantra: '"Finché respiro, recupero quello che gli altri buttano."',
      song: 'The Perfect Girl — Mareux',
      thought: '"Nessuna fazione mi comanda. Un lavoretto pulito tra le rovine e domani sparisco."',
      keyConcepts: ['Neutrale', 'Recupero Scav', 'Libertà', 'Sopravvivenza', 'Astuzia', 'Zero padroni'],
      archetype: 'Protagonista // ESFP',
      traumaCore: 'Cacciato dal vecchio gruppo',
      reaction: 'Istinto / Eccesso',
      motivation: 'Farsi un nome senza fazioni'
    },
    '#C-0012': {
      faction: 'KK // CROMO PESANTE',
      immersion: 'difficile',
      mantra: '"Più cromo, meno carne, nessuna pietà."',
      song: 'Le Perv — Carpenter Brut',
      thought: '"La pelle è solo rumore di fondo. Le voci nei cavi mi dicono che stanotte qualcuno proverà a fermarci."',
      keyConcepts: ['Estetica Dieselpunk', 'Iper-cromato', 'Rischio Psicosi', 'Forza bruta', 'Furia', 'Senza paura'],
      archetype: 'Guerriero // ESTP',
      traumaCore: 'Alienazione corporea totale',
      reaction: 'Aggressività diretta / Rabbia',
      motivation: 'Dimostrare la supremazia KK'
    },
    '#M-3384': {
      faction: 'CARAVIGLIARDI // L\'EREMITA',
      immersion: 'vivibile',
      mantra: '"Quello che non va in onda non è mai esistito."',
      song: 'Midnight City — M83',
      thought: '"Ho le prove video di cosa succede davvero nei campi sperimentali. Devo solo trovare il momento giusto per trasmettere."',
      keyConcepts: ['Oracolo: L\'Eremita', 'Archivio segreto', 'Studio Media', 'Verità scomode', 'Contatti', 'Ironia'],
      archetype: 'Esploratore // INFP',
      traumaCore: 'Censura & perdita collega',
      reaction: 'Osservazione / Denuncia',
      motivation: 'Smascherare Vertex & Neptun'
    }
  };

  function renderCyberwareGrid(sheetData) {
    const colLeft = document.getElementById('cyberware-col-left');
    const colRight = document.getElementById('cyberware-col-right');
    const countEl = document.getElementById('cyberware-slot-count');
    if (!colLeft || !colRight) return;

    const idKey = String((sheetData && sheetData.secretId) || '#V-7842').toUpperCase();
    const loadout = (sheetData && sheetData.cyberware) || CYBERWARE_BY_PG[idKey] || {
      'SISTEMA OCULARE': CYBERWARE_BY_PG['#V-7842']['SISTEMA OCULARE'],
      'SISTEMA OPERATIVO': CYBERWARE_BY_PG['#V-7842']['SISTEMA OPERATIVO']
    };
    const emptyAccent = (sheetData && sheetData.themeColor) || 'purple';

    colLeft.innerHTML = CYBERWARE_LEFT_SLOTS.map(slot => renderCyberwareSlotHTML(slot, loadout[slot], emptyAccent)).join('');
    colRight.innerHTML = CYBERWARE_RIGHT_SLOTS.map(slot => renderCyberwareSlotHTML(slot, loadout[slot], emptyAccent)).join('');

    const activeCount = [...CYBERWARE_LEFT_SLOTS, ...CYBERWARE_RIGHT_SLOTS].filter(slot => Boolean(loadout[slot])).length;
    if (countEl) countEl.textContent = `${activeCount} / 11 SLOT ATTIVI`;
  }

  function syncPlayerUI() {
    const sheetData = activeSheetRunner || player;
    const isViewingOther = Boolean(activeSheetRunner);

    // Header (sempre del player loggato)
    const headerCallsign = document.getElementById('header-player-callsign');
    const headerHp = document.getElementById('header-hp');
    const headerBalance = document.getElementById('header-wallet-balance');
    if (headerCallsign) headerCallsign.textContent = player.callsign;
    if (headerHp) {
      headerHp.textContent = `${player.hp}%`;
      headerHp.className = player.hp > 50 ? 'text-dive-green font-bold' : (player.hp > 25 ? 'text-dive-orange font-bold' : 'text-dive-red font-bold animate-pulse');
    }
    if (headerBalance) headerBalance.textContent = player.wallet.toLocaleString();
    if (typeof syncAuthMenuUI === 'function') syncAuthMenuUI();
    if (typeof renderActiveRoleConsole === 'function') renderActiveRoleConsole();

    // Wallet display
    const walletBalanceDisplay = document.getElementById('wallet-balance-display');
    if (walletBalanceDisplay) walletBalanceDisplay.textContent = player.wallet.toLocaleString();

    // Trafiletto anagrafico partecipante (solo per la propria scheda, mai su scansioni QR altrui; aperto al click su ID)
    const introBox = document.getElementById('participant-intro-box');
    const introFullname = document.getElementById('intro-player-fullname');
    const introEmail = document.getElementById('intro-player-email');
    const introContact = document.getElementById('intro-player-contact');
    const introPgTag = document.getElementById('intro-player-pg-tag');
    const secretIdBtn = document.getElementById('card-secret-id-btn');
    const secretIdChevron = document.getElementById('card-secret-id-chevron');
    if (introBox) {
      introBox.dataset.canReveal = isViewingOther ? '0' : '1';
      if (isViewingOther) {
        introBox.dataset.isOpen = '0';
        introBox.classList.add('hidden');
      } else {
        const isOpen = introBox.dataset.isOpen === '1';
        introBox.classList.toggle('hidden', !isOpen);
        const fullName = [player.playerName, player.playerSurname].filter(Boolean).join(' ').trim() || 'Giocatore Registrato';
        if (introFullname) introFullname.textContent = fullName;
        if (introEmail) introEmail.textContent = player.email || 'Nessuna email collegata';
        if (introContact) introContact.textContent = player.playerContact || 'Contatto non specificato';
        if (introPgTag) introPgTag.textContent = `${player.callsign} (${player.secretId})`;
      }
      if (secretIdBtn) {
        const expanded = !isViewingOther && introBox.dataset.isOpen === '1';
        secretIdBtn.disabled = isViewingOther;
        secretIdBtn.classList.toggle('cursor-pointer', !isViewingOther);
        secretIdBtn.classList.toggle('cursor-default', isViewingOther);
        secretIdBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (secretIdChevron) {
          secretIdChevron.classList.toggle('hidden', isViewingOther);
          secretIdChevron.textContent = expanded ? '▴' : '▾';
        }
      }
    }

    // Banner lettura scheda altrui & controlli medici
    const otherBanner = document.getElementById('viewing-other-pg-banner');
    const otherName = document.getElementById('viewing-other-pg-name');
    const medControls = document.getElementById('player-medical-controls');
    if (otherBanner) {
      if (isViewingOther) {
        otherBanner.classList.remove('hidden');
        if (otherName) otherName.textContent = `${sheetData.callsign} (${sheetData.secretId})`;
      } else {
        otherBanner.classList.add('hidden');
      }
    }
    if (medControls) {
      if (isViewingOther) medControls.classList.add('hidden');
      else medControls.classList.remove('hidden');
    }

    // Profile Card (Scheda Verticale attiva)
    const cardAvatarFrame = document.getElementById('card-avatar-frame');
    const cardAvatarImg = document.getElementById('card-avatar-img');
    const cardAvatarTag = document.getElementById('card-avatar-tag');
    const cardCallsign = document.getElementById('card-callsign');
    const cardRole = document.getElementById('card-role');
    const cardSecretId = document.getElementById('card-secret-id');

    const avatarTheme = {
      orange: { border: 'border-dive-orange/60', text: 'text-dive-orange' },
      cyan: { border: 'border-dive-cyan/60', text: 'text-dive-cyan' },
      green: { border: 'border-dive-green/60', text: 'text-dive-green' },
      red: { border: 'border-dive-red/60', text: 'text-dive-red' }
    }[sheetData.themeColor || 'orange'] || { border: 'border-dive-orange/60', text: 'text-dive-orange' };

    if (cardAvatarImg) {
      cardAvatarImg.src = sheetData.avatar || 'assets/images/avatars/pg-1.jpg';
      cardAvatarImg.alt = sheetData.callsign;
    }
    if (cardAvatarFrame) {
      cardAvatarFrame.className = `cyber-panel relative w-16 sm:w-20 overflow-hidden border ${avatarTheme.border} bg-black flex-shrink-0`;
    }
    if (cardAvatarTag) {
      const roleShort = (sheetData.role || 'SOLO').split('//')[0].trim().slice(0, 8);
      cardAvatarTag.textContent = roleShort;
      cardAvatarTag.className = `${avatarTheme.text} font-bold`;
    }
    const playerHpText = document.getElementById('player-hp-text');
    const playerHpBar = document.getElementById('player-hp-bar');
    const playerIceStatus = document.getElementById('player-ice-status');
    const playerPsychText = document.getElementById('player-psych-text');
    const playerPsychBar = document.getElementById('player-psych-bar');
    const playerPsychDesc = document.getElementById('player-psych-desc');

    if (cardCallsign) cardCallsign.textContent = sheetData.callsign;
    if (cardRole) cardRole.textContent = sheetData.role;
    if (cardSecretId) cardSecretId.textContent = sheetData.secretId || '#V-7842';

    const psychProfile = sheetData.psychProfile || PG_PSYCH_BY_ID[String(sheetData.secretId || '#V-7842').toUpperCase()] || {
      faction: 'PORTO FRANCO NAVARRO',
      immersion: 'normale',
      mantra: '"Ogni scelta a Navarro ha un prezzo."',
      song: 'Nightcall — Kavinsky',
      thought: '"Arrivato a Navarro senza troppe domande. Il resto si decide in scena."',
      keyConcepts: ['Indipendente', 'Sopravvivenza', 'Adattamento', 'Contatti', 'Segreti', 'Nuovo inizio'],
      archetype: 'Neutrale // Flessibile',
      traumaCore: 'Passato da chiarire',
      reaction: 'Prudenza / Osservazione',
      motivation: 'Trovare il proprio posto a Navarro'
    };
    const immersionBadgeEl = document.getElementById('card-immersion-badge');
    const immCfg = IMMERSION_BADGES[psychProfile.immersion] || IMMERSION_BADGES.normale;
    if (immersionBadgeEl) {
      immersionBadgeEl.textContent = immCfg.label;
      immersionBadgeEl.className = `${immCfg.cls} text-center truncate`;
    }
    const factionEl = document.getElementById('card-faction-label');
    const songEl = document.getElementById('card-song');
    const mantraEl = document.getElementById('card-mantra');
    const thoughtEl = document.getElementById('card-thought');
    const conceptsEl = document.getElementById('card-key-concepts');
    const archEl = document.getElementById('card-archetype');
    const traumaCoreEl = document.getElementById('card-trauma-core');
    const reactionEl = document.getElementById('card-reaction');
    const motivationEl = document.getElementById('card-motivation');
    const coreFolder = sheetData.coreFolder || {};
    if (factionEl) factionEl.textContent = psychProfile.faction;
    if (songEl) songEl.textContent = psychProfile.song;
    if (mantraEl) mantraEl.textContent = psychProfile.mantra;
    if (thoughtEl) thoughtEl.textContent = psychProfile.thought;
    if (archEl) archEl.textContent = coreFolder.archetype || '—';
    if (traumaCoreEl) traumaCoreEl.textContent = coreFolder.traumaCore || '—';
    if (reactionEl) reactionEl.textContent = coreFolder.reaction || '—';
    if (motivationEl) motivationEl.textContent = coreFolder.motivation || '—';
    if (conceptsEl) {
      const folderConcepts = Array.isArray(coreFolder.keyConcepts) ? coreFolder.keyConcepts.filter(Boolean).slice(0, 6) : [];
      if (folderConcepts.length) {
        conceptsEl.innerHTML = folderConcepts.map(c =>
          `<span class="px-2 py-1 rounded-sm bg-black/70 border border-dive-cyan/30 text-slate-200 truncate" title="${c}">${c}</span>`
        ).join('');
      } else {
        conceptsEl.innerHTML = '<span class="col-span-2 text-slate-500 italic">Vuoto — compilabile solo dai Master.</span>';
      }
    }
    if (playerHpText) playerHpText.textContent = `${sheetData.hp}% ${sheetData.hp > 75 ? 'NOMINALE' : (sheetData.hp > 30 ? 'FERITO' : 'CRITICO / FLATLINE')}`;
    if (playerHpBar) {
      playerHpBar.style.width = `${sheetData.hp}%`;
      playerHpBar.className = 'h-full bg-dive-green transition-all duration-500';
    }

    const iceOn = isViewingOther ? sheetData.iceActive : player.iceActive;
    if (playerIceStatus) {
      playerIceStatus.textContent = iceOn ? 'ICE ATTIVO (1 HIT)' : 'ICE BREACHED';
      playerIceStatus.className = iceOn
        ? 'px-1 sm:px-1.5 py-0.5 bg-black border border-dive-green/40 text-dive-green font-bold text-center truncate'
        : 'px-1 sm:px-1.5 py-0.5 bg-black border border-dive-red/40 text-dive-red font-bold text-center truncate';
    }

    // Cyberpsychosis
    if (playerPsychText && playerPsychBar && playerPsychDesc) {
      const p = sheetData.psych || 0;
      playerPsychBar.style.width = `${Math.min(100, p)}%`;
      playerPsychText.className = p >= 85 ? 'text-dive-red font-black animate-pulse' : 'text-dive-red font-bold';
      playerPsychBar.className = p >= 85
        ? 'h-full bg-dive-red animate-pulse transition-all duration-500'
        : 'h-full bg-dive-red transition-all duration-500';
      if (p < 25) {
        playerPsychText.textContent = `${p}% STABILE`;
        playerPsychDesc.textContent = 'Attività sinaptica regolare. Nessun segnale di alienazione corporea.';
      } else if (p < 60) {
        playerPsychText.textContent = `${p}% AGITAZIONE`;
        playerPsychDesc.textContent = 'Sovraccarico neurale lieve: battito accelerato e tremolio cibernetico.';
      } else if (p < 85) {
        playerPsychText.textContent = `${p}% DISSOCIAZIONE`;
        playerPsychDesc.textContent = 'Allucinazioni uditive e distacco dalla realtà: recita paranoia con i compagni!';
      } else {
        playerPsychText.textContent = `${p}% CYBERPSICOSI!`;
        playerPsychDesc.textContent = '[CRITICO] CYBERPSICOSI CONCLAMATA: Perdita totale di controllo. Necessario intervento Ripperdoc immediato!';
      }
    }

    // Traumas
    const traumasList = document.getElementById('traumas-list');
    if (traumasList) {
      if (!sheetData.traumas || sheetData.traumas.length === 0) {
        traumasList.innerHTML = `<span class="text-slate-500 italic block">Nessun danno critico rilevato.</span>`;
      } else {
        traumasList.innerHTML = sheetData.traumas.map(t => `
          <div class="px-2.5 py-1 rounded-sm bg-dive-red/10 border border-dive-red/30 text-dive-red font-mono text-[10px] flex items-center justify-between">
            <span>[!] ${t.name}</span>
            <span class="text-[9px] text-slate-400">${t.desc}</span>
          </div>
        `).join('');
      }
    }

    // Modal QR details
    const modalQrCallsign = document.getElementById('modal-qr-callsign');
    const modalQrSecretId = document.getElementById('modal-qr-secret-id');
    if (modalQrCallsign) modalQrCallsign.textContent = sheetData.callsign;
    if (modalQrSecretId) modalQrSecretId.textContent = sheetData.secretId || '#V-7842';

    renderTransactions();
    renderPersonalQR(sheetData);
    renderCyberwareGrid(sheetData);
    renderRosterSwitcher();
  }

  // --------------------------------------------------------------------------
  // 3. Offline Real ISO QR Code Generator (Links directly to ?pg=<secretId>)
  // --------------------------------------------------------------------------
  function renderPersonalQR(targetRunner = player) {
    const sheetUrl = getSheetUrl(targetRunner.secretId || '#V-7842');
    const cleanId = String(targetRunner.secretId || '#V-7842').replace(/^#/, '');

    const urlLabel = document.getElementById('sheet-qr-url-label');
    if (urlLabel) urlLabel.textContent = `?pg=${cleanId}`;

    let qrSvgHtml = '';
    if (typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M');
      qr.addData(sheetUrl);
      qr.make();
      qrSvgHtml = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } else {
      qrSvgHtml = `<div class="font-mono text-[10px] text-black text-center p-2">QR ${cleanId}</div>`;
    }

    const sheetQrContainer = document.getElementById('sheet-qr-container');
    if (sheetQrContainer) {
      sheetQrContainer.innerHTML = qrSvgHtml;
      const svg = sheetQrContainer.querySelector('svg');
      if (svg) {
        svg.setAttribute('class', 'w-full h-full block');
      }
    }

    const modalQrContainer = document.getElementById('my-qr-svg-container');
    if (modalQrContainer) {
      modalQrContainer.innerHTML = qrSvgHtml;
      const svg = modalQrContainer.querySelector('svg');
      if (svg) {
        svg.setAttribute('class', 'w-full h-full block');
      }
    }

    renderSocialRubrica();
  }

  function addScannedContact(entry) {
    if (!entry || !player) return false;
    const rawId = String(entry.secretId || '').trim();
    const normId = rawId ? ('#' + rawId.replace(/^#/, '')).toUpperCase() : '';
    const myId = (player.secretId || '#V-7842').toUpperCase();
    if (normId && normId === myId) return false;

    const registryMatch = getAccountsRegistry().find(r =>
      (normId && (r.secretId || '').toUpperCase() === normId) ||
      (entry.callsign && (r.callsign || '').toUpperCase() === String(entry.callsign).toUpperCase())
    );
    const callsign = (registryMatch && registryMatch.callsign) || entry.callsign || '@Runner';
    const secretId = (registryMatch && registryMatch.secretId) || normId || '#NX-0000';
    const role = (registryMatch && registryMatch.role) || entry.role || 'RUNNER // CONTATTO QR';
    const avatar = (registryMatch && registryMatch.avatar) || entry.avatar || 'assets/images/avatars/pg-1.jpg';
    const nowTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    if (!Array.isArray(player.contacts)) player.contacts = [];
    const existingIdx = player.contacts.findIndex(c =>
      (c.secretId || '').toUpperCase() === secretId.toUpperCase()
    );

    const contactObj = { callsign, secretId, role, avatar, scannedAt: nowTime };
    let isNew = true;
    if (existingIdx >= 0) {
      isNew = false;
      player.contacts.splice(existingIdx, 1);
    }
    player.contacts.unshift(contactObj);
    savePlayerState(player);
    return isNew;
  }

  function removeScannedContact(secretId) {
    if (!player || !Array.isArray(player.contacts)) return;
    const target = String(secretId || '').toUpperCase();
    player.contacts = player.contacts.filter(c => (c.secretId || '').toUpperCase() !== target);
    savePlayerState(player);
  }

  function syncDmRecipientsWithContacts() {
    const select = document.getElementById('dm-recipient-select');
    if (!select || !player) return;
    const contacts = Array.isArray(player.contacts) ? player.contacts : [];
    contacts.forEach(c => {
      if (!c.callsign) return;
      const exists = Array.from(select.options).some(opt => opt.value.toUpperCase() === c.callsign.toUpperCase());
      if (!exists) {
        const opt = document.createElement('option');
        opt.value = c.callsign;
        opt.textContent = `${c.callsign} (${c.secretId || 'QR'})`;
        select.appendChild(opt);
      }
    });
  }

  function renderSocialRubrica() {
    const listEl = document.getElementById('social-rubrica-list');
    const countBadge = document.getElementById('rubrica-count-badge');
    const contacts = Array.isArray(player && player.contacts) ? player.contacts : [];
    if (countBadge) countBadge.textContent = String(contacts.length);
    syncDmRecipientsWithContacts();
    if (!listEl) return;

    const esc = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    if (contacts.length === 0) {
      listEl.innerHTML = `
        <div class="p-3 rounded-sm bg-[#04060A] border border-dashed border-white/15 text-center font-mono text-[11px] text-slate-400">
          Nessun contatto in rubrica. Scansiona il QR Code di un Runner con lo Scanner Cyberdeck per salvarlo automaticamente qui.
        </div>
      `;
      return;
    }

    listEl.innerHTML = contacts.map(c => `
      <div class="p-2.5 rounded-sm bg-[#04060A] border border-white/10 hover:border-dive-orange/40 transition-colors flex items-center justify-between gap-2.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <img src="${esc(c.avatar || 'assets/images/avatars/pg-1.jpg')}" alt="${esc(c.callsign)}" class="w-9 h-9 rounded-sm object-cover border border-white/15 flex-shrink-0">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-orbitron font-bold text-xs text-white truncate">${esc(c.callsign)}</span>
              <span class="font-mono text-[9px] text-dive-cyan font-bold flex-shrink-0">${esc(c.secretId)}</span>
            </div>
            <div class="font-mono text-[9px] text-slate-400 truncate">${esc(c.role || 'RUNNER')} · QR ${esc(c.scannedAt || '')}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0 font-mono text-[9px]">
          <button type="button" data-rubrica-dm="${esc(c.callsign)}" class="px-2 py-1 rounded-sm border border-dive-cyan/40 bg-dive-cyan/10 text-dive-cyan hover:bg-dive-cyan hover:text-black font-bold uppercase transition-colors cursor-pointer" title="Invia DM privato">
            DM
          </button>
          <button type="button" data-rubrica-pay="${esc(c.secretId)}" class="px-2 py-1 rounded-sm border border-dive-green/40 bg-dive-green/10 text-dive-green hover:bg-dive-green hover:text-black font-bold uppercase transition-colors cursor-pointer" title="Trasferisci EuroDollari">
            €$
          </button>
          <button type="button" data-rubrica-remove="${esc(c.secretId)}" class="px-1.5 py-1 rounded-sm border border-white/15 bg-black text-slate-400 hover:text-dive-red hover:border-dive-red/40 font-bold leading-none transition-colors cursor-pointer" title="Rimuovi contatto">
            ×
          </button>
        </div>
      </div>
    `).join('');
  }

  const socialRubricaListEl = document.getElementById('social-rubrica-list');
  if (socialRubricaListEl) {
    socialRubricaListEl.addEventListener('click', (e) => {
      const dmBtn = e.target.closest('[data-rubrica-dm]');
      if (dmBtn) {
        const callsign = dmBtn.getAttribute('data-rubrica-dm');
        const directBtn = document.querySelector('.chat-channel-btn[data-channel="direct"]');
        if (directBtn) directBtn.click();
        const select = document.getElementById('dm-recipient-select');
        if (select && callsign) {
          syncDmRecipientsWithContacts();
          select.value = callsign;
        }
        const chatInput = document.getElementById('chat-text-input');
        if (chatInput) chatInput.focus();
        return;
      }

      const payBtn = e.target.closest('[data-rubrica-pay]');
      if (payBtn) {
        const targetId = payBtn.getAttribute('data-rubrica-pay');
        switchTab('wallet');
        const recipientInput = document.getElementById('transfer-recipient-input');
        const amountInput = document.getElementById('transfer-amount-input');
        if (recipientInput && targetId) recipientInput.value = targetId;
        if (amountInput) amountInput.focus();
        return;
      }

      const removeBtn = e.target.closest('[data-rubrica-remove]');
      if (removeBtn) {
        const targetId = removeBtn.getAttribute('data-rubrica-remove');
        removeScannedContact(targetId);
      }
    });
  }

  const rubricaGoScanBtn = document.getElementById('rubrica-go-scan-btn');
  if (rubricaGoScanBtn) {
    rubricaGoScanBtn.addEventListener('click', () => {
      switchTab('cyberdeck');
      setTimeout(() => {
        const deckEl = document.getElementById('sec-deck');
        if (deckEl) deckEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const codeInput = document.getElementById('manual-code-input');
        if (codeInput) codeInput.focus();
      }, 140);
    });
  }

  // --------------------------------------------------------------------------
  // 4. Tab Navigation System
  // --------------------------------------------------------------------------
  const tabTriggers = document.querySelectorAll('.nav-tab-trigger');
  const appTabs = document.querySelectorAll('.app-tab');

  const SECTION_ROUTES = {
    dossier: { tab: 'profile', anchor: 'sec-scheda' },
    biomonitor: { tab: 'profile', anchor: 'sec-biomonitor' },
    cyberware: { tab: 'profile', anchor: 'sec-cyberware' },
    cyberdeck: { tab: 'profile', anchor: 'sec-deck' },
    deck: { tab: 'profile', anchor: 'sec-deck' },
    wallet: { tab: 'profile', anchor: 'sec-wallet' },
    profile: { tab: 'profile', anchor: null },
    comm: { tab: 'net', anchor: 'sec-chat' }
  };

  const PUBLIC_TABS = ['home', 'eventi', 'gallery', 'premesse'];

  function setSectionCollapsed(secId, collapsed) {
    if (!secId) return;
    const section = document.getElementById(secId);
    if (!section) return;
    const body = section.querySelector('[data-collapse-body]');
    if (!body) return;
    body.classList.toggle('hidden', collapsed);
    const toggle = section.querySelector(`[data-collapse-toggle="${secId}"]`);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      const chevron = toggle.querySelector('[data-collapse-chevron]');
      if (chevron) chevron.textContent = collapsed ? '▾' : '▴';
    }
  }

  function expandSectionById(secId) {
    setSectionCollapsed(secId, false);
  }

  document.querySelectorAll('[data-collapse-toggle]').forEach(toggle => {
    const secId = toggle.getAttribute('data-collapse-toggle');
    const handleToggle = () => {
      const section = secId ? document.getElementById(secId) : null;
      const body = section ? section.querySelector('[data-collapse-body]') : null;
      if (!body) return;
      setSectionCollapsed(secId, !body.classList.contains('hidden'));
      if (typeof playClick === 'function') playClick();
    };
    toggle.addEventListener('click', handleToggle);
    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    });
  });

  function getSocialActivityTotal() {
    const posts = typeof getSocialPosts === 'function' ? getSocialPosts() : [];
    const postAndComments = posts.reduce((acc, p) => acc + 1 + (Array.isArray(p.comments) ? p.comments.length : 0), 0);
    const chatObj = (player && player.chatMessages) || {};
    const channelMsgs = ['fixer', 'blackmarket', 'corp', 'direct'].reduce((acc, ch) => acc + (Array.isArray(chatObj[ch]) ? chatObj[ch].length : 0), 0);
    const myGroups = typeof getMyChatGroups === 'function' ? getMyChatGroups() : [];
    const groupMsgs = myGroups.reduce((acc, g) => acc + (Array.isArray(g.messages) ? g.messages.length : 0), 0);
    return postAndComments + channelMsgs + groupMsgs;
  }

  function getSocialSeenKey() {
    const sid = (player && player.secretId) ? player.secretId.toUpperCase() : '#V-7842';
    return `dive_social_seen_v1_${sid}`;
  }

  function markSocialAsSeen() {
    const total = getSocialActivityTotal();
    localStorage.setItem(getSocialSeenKey(), String(total));
    updateSocialNotificationBadges();
  }

  function updateSocialNotificationBadges() {
    const navBadge = document.getElementById('nav-social-badge');
    const mobileBadge = document.getElementById('mobile-social-badge');
    const netTab = document.getElementById('tab-net');
    const isOnNet = Boolean(netTab && !netTab.classList.contains('hidden'));
    const total = getSocialActivityTotal();
    const key = getSocialSeenKey();
    const stored = localStorage.getItem(key);

    if (stored === null || isOnNet) {
      localStorage.setItem(key, String(total));
      if (navBadge) navBadge.classList.add('hidden');
      if (mobileBadge) mobileBadge.classList.add('hidden');
      return;
    }

    const seen = parseInt(stored, 10);
    const unread = Number.isFinite(seen) ? Math.max(0, total - seen) : 0;
    const label = unread > 99 ? '99+' : String(unread);
    [navBadge, mobileBadge].forEach(el => {
      if (!el) return;
      el.textContent = label;
      el.classList.toggle('hidden', unread <= 0);
    });
  }

  function switchTab(tabId) {
    const isAuthenticated = Boolean(getActiveSessionId());
    const route = SECTION_ROUTES[tabId];
    const scrollTargetId = route ? route.anchor : null;
    let effectiveTab = route ? route.tab : tabId;

    // Se il PG è loggato, la Home pubblica non è visibile: resta nella sezione In-Game
    if (isAuthenticated && PUBLIC_TABS.includes(effectiveTab)) {
      effectiveTab = 'profile';
    }

    appTabs.forEach(tab => {
      if (tab.id === `tab-${effectiveTab}`) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
      } else {
        tab.classList.add('hidden');
        tab.classList.remove('active');
      }
    });

    if (effectiveTab === 'net') {
      markSocialAsSeen();
    }

    // Desktop Nav
    document.querySelectorAll('nav button.nav-tab-trigger').forEach(btn => {
      const btnTab = btn.getAttribute('data-tab');
      const isSectionTrigger = Boolean(SECTION_ROUTES[btnTab] && SECTION_ROUTES[btnTab].anchor);
      const isActive = isSectionTrigger ? (btnTab === tabId) : (btnTab === effectiveTab);
      if (isActive) {
        btn.classList.add('font-bold');
        if (isAuthenticated) {
          btn.classList.add('ingame-nav-active', 'text-white');
          btn.classList.remove('text-dive-orange', 'border-dive-orange');
        } else {
          btn.classList.add('text-dive-orange', 'border-dive-orange');
          btn.classList.remove('ingame-nav-active', 'text-white');
        }
        btn.classList.remove('text-slate-400', 'font-normal', 'border-transparent');
      } else {
        btn.classList.remove('text-dive-orange', 'font-bold', 'border-dive-orange', 'ingame-nav-active', 'text-white');
        btn.classList.add('text-slate-400', 'font-normal', 'border-transparent');
      }
    });

    // Mobile Dock
    document.querySelectorAll('.mobile-dock-item').forEach(btn => {
      if (btn.getAttribute('data-tab') === effectiveTab) {
        btn.classList.add('text-dive-orange', 'active');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('text-dive-orange', 'active');
        btn.classList.add('text-slate-400');
      }
    });

    if (scrollTargetId) {
      expandSectionById(scrollTargetId);
      const targetEl = document.getElementById(scrollTargetId);
      if (targetEl) {
        setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    playCyberSound(450, 'triangle', 0.05);

    if (['net', 'profile'].includes(effectiveTab) && !getActiveSessionId() && typeof openLoginModal === 'function') {
      openLoginModal(false);
    }
  }

  tabTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) {
        e.preventDefault();
        switchTab(tabId);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Quickhack 5-Seconds Combat Overlay
  // --------------------------------------------------------------------------
  const qhOverlay = document.getElementById('quickhack-combat-overlay');
  const qhCommandEl = document.getElementById('qh-combat-command');
  const qhDescEl = document.getElementById('qh-combat-description');
  const qhSecondsTimer = document.getElementById('qh-seconds-timer');
  const qhTimerBar = document.getElementById('qh-timer-bar');
  const closeQhBtn = document.getElementById('close-quickhack-overlay-btn');

  const ramCurrentEl = document.getElementById('ram-current');
  const ramMaxEl = document.getElementById('ram-max');
  const ramStatusEl = document.getElementById('ram-status-text');
  const ramCellsEl = document.getElementById('ram-cells');
  const ramResetBtn = document.getElementById('ram-reset-btn');
  const ramAlertEl = document.getElementById('quickhack-ram-alert');
  const RAM_REGEN_SECONDS = 10;

  let qhInterval = null;
  let ramRegenCountdown = RAM_REGEN_SECONDS;
  let ramRegenInterval = null;

  function renderRamUI() {
    const max = Number(player.ramMax) || 8;
    const current = Math.max(0, Math.min(max, Number(player.ram ?? max)));
    player.ram = current;
    player.ramMax = max;

    if (ramCurrentEl) ramCurrentEl.textContent = current;
    if (ramMaxEl) ramMaxEl.textContent = max;

    if (ramStatusEl) {
      if (current >= max) {
        ramStatusEl.textContent = 'PRONTO';
        ramStatusEl.className = 'text-[10px] text-dive-green';
      } else {
        ramStatusEl.textContent = `+1 RAM tra ${ramRegenCountdown}s`;
        ramStatusEl.className = 'text-[10px] text-dive-orange';
      }
    }

    if (ramCellsEl) {
      ramCellsEl.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const cell = document.createElement('div');
        const active = i < current;
        cell.className = active
          ? 'h-2.5 rounded-sm bg-dive-cyan border border-dive-cyan shadow-[0_0_8px_rgba(0,229,255,0.45)] transition-all'
          : 'h-2.5 rounded-sm bg-white/5 border border-white/10 transition-all';
        ramCellsEl.appendChild(cell);
      }
    }

    document.querySelectorAll('.quickhack-trigger-btn').forEach(btn => {
      const cost = Number(btn.getAttribute('data-ram') || 0);
      const affordable = current >= cost;
      btn.classList.toggle('opacity-50', !affordable);
      btn.setAttribute('aria-disabled', affordable ? 'false' : 'true');
    });
  }

  function showRamAlert(msg) {
    if (!ramAlertEl) return;
    ramAlertEl.textContent = msg;
    ramAlertEl.classList.remove('hidden');
    clearTimeout(showRamAlert._t);
    showRamAlert._t = setTimeout(() => ramAlertEl.classList.add('hidden'), 3000);
  }

  function ensureRamRegenRunning() {
    if (ramRegenInterval || player.ram >= (player.ramMax || 8)) return;
    ramRegenCountdown = RAM_REGEN_SECONDS;
    ramRegenInterval = setInterval(() => {
      if (player.ram >= (player.ramMax || 8)) {
        clearInterval(ramRegenInterval);
        ramRegenInterval = null;
        renderRamUI();
        return;
      }
      ramRegenCountdown -= 1;
      if (ramRegenCountdown <= 0) {
        player.ram = Math.min(player.ramMax || 8, (player.ram || 0) + 1);
        ramRegenCountdown = RAM_REGEN_SECONDS;
        savePlayerState(player);
        if (player.ram >= (player.ramMax || 8)) {
          clearInterval(ramRegenInterval);
          ramRegenInterval = null;
        }
      }
      renderRamUI();
    }, 1000);
  }

  if (ramResetBtn) {
    ramResetBtn.addEventListener('click', () => {
      player.ram = player.ramMax || 8;
      if (ramRegenInterval) {
        clearInterval(ramRegenInterval);
        ramRegenInterval = null;
      }
      if (ramAlertEl) ramAlertEl.classList.add('hidden');
      savePlayerState(player);
      renderRamUI();
      playCyberFx('ram');
    });
  }

  renderRamUI();
  ensureRamRegenRunning();

  function launchQuickhackCombat(commandName, description, ramCost = 0) {
    if (!qhOverlay) return;
    if ((player.ram ?? 8) < ramCost) {
      playCyberFx('denied');
      showRamAlert(`RAM insufficiente per OVERRIDE ${commandName} (servono ${ramCost} RAM, disponibili ${player.ram}).`);
      return;
    }

    if (ramCost > 0) {
      player.ram = Math.max(0, (player.ram ?? 8) - ramCost);
      if (ramAlertEl) ramAlertEl.classList.add('hidden');
      savePlayerState(player);
      renderRamUI();
      ensureRamRegenRunning();
    }

    if (qhInterval) clearInterval(qhInterval);

    qhCommandEl.textContent = `OVERRIDE ${commandName}`;
    qhDescEl.textContent = description;
    qhOverlay.classList.remove('hidden');
    qhOverlay.classList.add('flex');

    let timeLeft = 5.0;
    qhSecondsTimer.textContent = timeLeft.toFixed(1);
    qhTimerBar.style.width = '100%';

    playCyberFx('quickhack');

    const stepMs = 100;
    qhInterval = setInterval(() => {
      timeLeft -= (stepMs / 1000);
      if (timeLeft <= 0) {
        clearInterval(qhInterval);
        qhSecondsTimer.textContent = '0.0';
        qhTimerBar.style.width = '0%';
        playCyberFx('quickhack-end');
        setTimeout(() => closeQuickhackOverlay(), 800);
      } else {
        qhSecondsTimer.textContent = timeLeft.toFixed(1);
        const pct = (timeLeft / 5.0) * 100;
        qhTimerBar.style.width = `${pct}%`;
      }
    }, stepMs);
  }

  function closeQuickhackOverlay() {
    if (qhInterval) clearInterval(qhInterval);
    if (qhOverlay) {
      qhOverlay.classList.add('hidden');
      qhOverlay.classList.remove('flex');
    }
  }

  document.querySelectorAll('.quickhack-trigger-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hack = btn.getAttribute('data-hack');
      const desc = btn.getAttribute('data-desc');
      const ramCost = Number(btn.getAttribute('data-ram') || 0);
      launchQuickhackCombat(hack, desc, ramCost);
    });
  });

  if (closeQhBtn) closeQhBtn.addEventListener('click', closeQuickhackOverlay);

  // --------------------------------------------------------------------------
  // 6. QR Code Scanner & Manual Resolver (Scans Scenes & Players)
  // --------------------------------------------------------------------------
  const startCameraBtn = document.getElementById('start-camera-scan-btn');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const manualQrForm = document.getElementById('manual-qr-form');
  const manualCodeInput = document.getElementById('manual-code-input');
  const scanResultCard = document.getElementById('scan-result-card');
  const scanBadge = document.getElementById('scan-badge');
  const scanOutputText = document.getElementById('scan-output-text');
  const scanPlayerActions = document.getElementById('scan-player-actions');
  const scanPayBtn = document.getElementById('scan-action-pay-btn');
  const scanHackBtn = document.getElementById('scan-action-hack-btn');

  let html5QrScanner = null;
  let detectedPlayer = null;

  function resolveCode(codeStr) {
    const raw = codeStr.trim();
    const code = raw.toUpperCase();
    if (!scanResultCard || !scanBadge || !scanOutputText) return;

    scanResultCard.classList.remove('hidden');
    if (scanPlayerActions) scanPlayerActions.classList.add('hidden');
    playCyberFx('scan');

    // Player QR scan detection (supports ?pg= URL, PLAYER:@Name:#Code, #V-, @Name)
    let pgParamFromUrl = null;
    try {
      if (raw.includes('pg=')) {
        const parsed = new URL(raw, window.location.origin);
        pgParamFromUrl = parsed.searchParams.get('pg');
      }
    } catch {}

    if (pgParamFromUrl || code.startsWith('PLAYER:') || code.startsWith('#') || code.startsWith('@')) {
      let callsign = '@Runner';
      let secretId = '#NX-0000';

      if (pgParamFromUrl) {
        const cleanCode = ('#' + pgParamFromUrl.replace(/^#/, '')).toUpperCase();
        const match = ROSTER_SEED.find(r => r.secretId.toUpperCase() === cleanCode);
        callsign = match ? match.callsign : ((player.secretId || '#V-7842').toUpperCase() === cleanCode ? player.callsign : '@Target_Runner');
        secretId = cleanCode;
      } else if (code.startsWith('PLAYER:')) {
        const parts = raw.split(':');
        callsign = parts[1] || '@Runner';
        secretId = parts[2] || '#NX-0000';
      } else if (code.startsWith('#')) {
        const match = ROSTER_SEED.find(r => r.secretId.toUpperCase() === code);
        callsign = match ? match.callsign : '@Target_Runner';
        secretId = code;
      } else {
        callsign = raw;
        secretId = '#X-' + Math.floor(1000 + Math.random() * 9000);
      }

      detectedPlayer = { callsign, secretId };
      const addedToRubrica = addScannedContact({ callsign, secretId });

      scanBadge.className = 'px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold bg-dive-orange/20 text-dive-orange border border-dive-orange/40';
      scanBadge.textContent = '[ID] RUNNER';
      scanOutputText.textContent = `[TARGET ACQUISITO] Rilevato Cyberdeck di ${callsign} (ID: ${secretId}).${addedToRubrica ? ' Contatto salvato in Rubrica Social.' : ' Contatto aggiornato in Rubrica Social.'} Scegli se trasferire EuroDollari o avviare l'intrusione clandestina.`;
      
      if (scanPlayerActions) scanPlayerActions.classList.remove('hidden');

    } else if (code.includes('GREEN') || code.startsWith('RIPPER') || code.startsWith('CYB-G')) {
      scanBadge.className = 'px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold bg-dive-green/20 text-dive-green border border-dive-green/40';
      scanBadge.textContent = '[VERDE] IMPIANTO';
      scanOutputText.textContent = `[ACCESSO CONCESSO] Rilevato cromo di scena compatibile: "Stabilizzatore Neurale Mk.3". Salute +25% e rimozione traumi.`;
      player.hp = Math.min(100, player.hp + 25);
      player.traumas = [];
      savePlayerState(player);

    } else if (code.includes('BLUE') || code.startsWith('TERM') || code.startsWith('CYB-B')) {
      const lootedEddies = Math.floor(Math.random() * 200) + 100;
      scanBadge.className = 'px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold bg-dive-cyan/20 text-dive-cyan border border-dive-cyan/40';
      scanBadge.textContent = '[BLU] TERMINALE';
      scanOutputText.textContent = `[HACKING RIUSCITO] Terminale di sicurezza violato! Scaricati file riservati e accreditati +€$ ${lootedEddies} nel tuo Wallet.`;
      player.wallet += lootedEddies;
      player.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'in',
        desc: `Violazione Terminale Blu (${code})`,
        amount: lootedEddies,
        time: 'Poco fa'
      });
      savePlayerState(player);

    } else if (code.includes('RED') || code.startsWith('SAFE') || code.startsWith('CYB-R')) {
      scanBadge.className = 'px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold bg-dive-red/20 text-dive-red border border-dive-red/40';
      scanBadge.textContent = '[ROSSO] ICE';
      scanOutputText.textContent = `[ALLARME SICUREZZA] Dispositivo protetto da ICE corporativo! Richiesto comando vocale "OVERRIDE AL BUIO!" per disinnescare.`;
      launchQuickhackCombat('AL BUIO!', 'Neutralizza il sensore rosso entro 5 secondi prima che scatti l\'allarme sonoro!');

    } else {
      scanBadge.className = 'px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold bg-dive-orange/20 text-dive-orange border border-dive-orange/40';
      scanBadge.textContent = 'DATASHARD GENERICO';
      scanOutputText.textContent = `Codice [${code}] decifrato: Log archiviato nel dataspace locale.`;
    }
  }

  if (scanPayBtn) {
    scanPayBtn.addEventListener('click', () => {
      if (!detectedPlayer) return;
      switchTab('wallet');
      const recInput = document.getElementById('transfer-recipient-input');
      if (recInput) recInput.value = detectedPlayer.callsign;
    });
  }

  if (scanHackBtn) {
    scanHackBtn.addEventListener('click', () => {
      if (!detectedPlayer) return;
      const targetInput = document.getElementById('hack-target-callsign');
      if (targetInput) targetInput.value = detectedPlayer.secretId;
      targetInput.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (manualQrForm && manualCodeInput) {
    manualQrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      resolveCode(manualCodeInput.value);
      manualCodeInput.value = '';
    });
  }

  function stopScannerCamera() {
    try {
      if (html5QrScanner && html5QrScanner.isScanning) {
        html5QrScanner.stop().catch(() => {});
      }
    } catch {
      // silent
    }
    const video = document.querySelector('#qr-reader video');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
  }

  window.addEventListener('beforeunload', stopScannerCamera);
  window.addEventListener('pagehide', stopScannerCamera);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopScannerCamera();
  });

  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', () => {
      if (typeof Html5Qrcode !== 'undefined') {
        if (cameraPlaceholder) cameraPlaceholder.classList.add('hidden');
        if (!html5QrScanner) html5QrScanner = new Html5Qrcode("qr-reader");
        html5QrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            resolveCode(decodedText);
            stopScannerCamera();
          },
          () => {}
        ).catch(() => {
          alert('Fotocamera non disponibile. Inserisci il codice a mano nel campo sottostante.');
          stopScannerCamera();
        });
      } else {
        alert('Scanner fotocamera non supportato. Inserisci il codice a mano.');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. Off-Fight Hacking / Sifone con Meccanica ICE (Firewall Defense)
  // --------------------------------------------------------------------------
  const hackForm = document.getElementById('hack-target-form');
  const hackTargetCallsign = document.getElementById('hack-target-callsign');
  const hackWrap = document.getElementById('hack-progress-bar-wrap');
  const hackPct = document.getElementById('hack-percentage');
  const hackFill = document.getElementById('hack-fill-bar');
  const hackStatusLabel = document.getElementById('hack-status-label');

  let hackCooldown = false;

  if (hackForm) {
    hackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (hackCooldown) {
        alert('ICE Breaker in surriscaldamento! Attendi qualche secondo prima di ritentare.');
        return;
      }

      const target = hackTargetCallsign.value.trim().toUpperCase();
      if (!target) return;

      if (hackWrap) hackWrap.classList.remove('hidden');
      if (hackStatusLabel) hackStatusLabel.textContent = 'PROBING ICE FIREWALL...';
      let pct = 0;
      playCyberSound(500, 'sawtooth', 0.1);

      const iv = setInterval(() => {
        pct += 25;
        if (hackPct) hackPct.textContent = `${pct}%`;
        if (hackFill) hackFill.style.width = `${pct}%`;

        if (pct >= 100) {
          clearInterval(iv);
          
          // Check target ICE defense: targets with ICE block the 1st intrusion!
          const targetInRoster = ROSTER_SEED.find(r => r.secretId.toUpperCase() === target || r.callsign.toUpperCase() === target);
          const hasIce = targetInRoster ? targetInRoster.ice : true;

          if (hasIce && !target.includes('BYPASS')) {
            // ICE defense blocks the hack!
            if (targetInRoster) targetInRoster.ice = false; // Breaks ICE for second try
            playCyberSound(220, 'square', 0.3);
            alert(`[ICE ATTIVO RILEVATO!]\nIl firewall di ${target} ha respinto l'intrusione e tracciato il segnale!\nL'ICE ora è danneggiato: riprova o ottieni il codice bypass dal Fixer.`);
            hackCooldown = true;
            setTimeout(() => { hackCooldown = false; }, 8000);
          } else {
            // Intrusion Successful
            const siphonAmount = Math.floor(Math.random() * 150) + 75;
            player.wallet += siphonAmount;
            player.transactions.unshift({
              id: 'tx_' + Date.now(),
              type: 'in',
              desc: `Sifone Crediti da ${target}`,
              amount: siphonAmount,
              time: 'Adesso'
            });
            savePlayerState(player);
            playCyberSound(880, 'sine', 0.2);
            alert(`[HACK COMPLETATO]\nICE Breaker riuscito su ${target}! Drenati e accreditati €$ ${siphonAmount} nel tuo wallet.`);
            hackTargetCallsign.value = '';
          }

          setTimeout(() => {
            if (hackWrap) hackWrap.classList.add('hidden');
            if (hackFill) hackFill.style.width = '0%';
          }, 1000);
        }
      }, 250);
    });
  }

  // --------------------------------------------------------------------------
  // 8. Wallet Transfers
  // --------------------------------------------------------------------------
  const transferForm = document.getElementById('transfer-money-form');
  const transferRecipient = document.getElementById('transfer-recipient-input');
  const transferAmount = document.getElementById('transfer-amount-input');
  const txHistoryList = document.getElementById('transaction-history-list');

  function renderTransactions() {
    if (!txHistoryList) return;
    const txs = player.transactions || [];
    if (txs.length === 0) {
      txHistoryList.innerHTML = `<span class="text-slate-500 italic block py-4 text-center">Nessuna transazione registrata.</span>`;
      return;
    }

    txHistoryList.innerHTML = txs.map(t => {
      const isIn = t.type === 'in';
      return `
        <div class="p-3 rounded-sm bg-[#080B12] border border-white/10 flex items-center justify-between text-xs font-mono">
          <div>
            <span class="text-slate-200 font-medium block">${t.desc}</span>
            <span class="text-[10px] text-slate-500">${t.time}</span>
          </div>
          <div class="font-bold ${isIn ? 'text-dive-green' : 'text-dive-red'} text-sm">
            ${isIn ? '+' : '-'}€$ ${t.amount.toLocaleString()}
          </div>
        </div>
      `;
    }).join('');
  }

  if (transferForm) {
    transferForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rec = transferRecipient.value.trim();
      const amt = parseInt(transferAmount.value, 10);

      if (amt > player.wallet) {
        alert('Crediti insufficienti nel wallet!');
        return;
      }

      player.wallet -= amt;
      player.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'out',
        desc: `Trasferimento inviato a ${rec}`,
        amount: amt,
        time: 'Poco fa'
      });
      savePlayerState(player);
      transferRecipient.value = '';
      transferAmount.value = '';
      playCyberSound(750, 'sine', 0.15);
      alert(`[TRANSAZIONE REGISTRATA]\nInviati con successo €$ ${amt.toLocaleString()} a ${rec}.`);
    });
  }

  // --------------------------------------------------------------------------
  // 9. Health, Droga di Scena & Ripperdoc
  // --------------------------------------------------------------------------
  const takeDamageBtn = document.getElementById('take-damage-btn');
  const resetHpBtn = document.getElementById('reset-hp-btn');
  const takeDrugBtn = document.getElementById('take-drug-btn');
  const openRipperdocBtn = document.getElementById('open-ripperdoc-btn');
  const ripperdocModal = document.getElementById('ripperdoc-modal');
  const closeRipperdocBtn = document.getElementById('close-ripperdoc-btn');
  const executeHealBtn = document.getElementById('execute-heal-btn');

  if (takeDrugBtn) {
    takeDrugBtn.addEventListener('click', () => {
      player.psych = Math.min(100, (player.psych || 0) + 15);
      player.hp = Math.min(100, player.hp + 25);
      savePlayerState(player);
      playCyberSound(350, 'sawtooth', 0.25);
      alert('[SINTETICO ASSUNTO]\nInalazione completata: scarica di adrenalina (+25% HP stimolante temporaneo) ma la mente vacilla (+15% Cyberpsicosi!).');
    });
  }

  if (takeDamageBtn) {
    takeDamageBtn.addEventListener('click', () => {
      player.hp = Math.max(0, player.hp - 25);
      if (player.hp <= 50 && player.traumas.length === 0) {
        player.traumas.push({ name: 'Ferita da Proiettile', desc: 'Arto secondario fuori uso.' });
      }
      if (player.hp <= 0 && player.traumas.length < 2) {
        player.traumas.push({ name: 'Shock Neurale Critico', desc: 'Flatline! Richiesto intervento Ripperdoc.' });
      }
      savePlayerState(player);
      playCyberSound(200, 'sawtooth', 0.15);
    });
  }

  if (resetHpBtn) {
    resetHpBtn.addEventListener('click', () => {
      player.hp = Math.min(100, player.hp + 25);
      savePlayerState(player);
      playCyberSound(600, 'sine', 0.1);
    });
  }

  if (openRipperdocBtn && ripperdocModal) {
    openRipperdocBtn.addEventListener('click', () => {
      ripperdocModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => ripperdocModal.classList.add('opacity-100'), 10);
    });
  }

  if (closeRipperdocBtn && ripperdocModal) {
    closeRipperdocBtn.addEventListener('click', () => {
      ripperdocModal.classList.remove('opacity-100');
      setTimeout(() => ripperdocModal.classList.add('hidden', 'pointer-events-none'), 300);
    });
  }

  if (executeHealBtn) {
    executeHealBtn.addEventListener('click', () => {
      player.hp = 100;
      player.psych = Math.max(0, (player.psych || 0) - 20);
      player.traumas = [];
      savePlayerState(player);
      playCyberSound(880, 'sine', 0.2);
      alert('[INTERVENTO COMPLETATO]\nPunti salute a 100%, traumi suturati e carico di cyberpsicosi stabilizzato.');
      if (ripperdocModal) {
        ripperdocModal.classList.remove('opacity-100');
        setTimeout(() => ripperdocModal.classList.add('hidden', 'pointer-events-none'), 300);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9b. Toggle Personal Details on ID Badge Click & Core PG Folder Toggle
  // --------------------------------------------------------------------------
  const coreFolderBtn = document.getElementById('pg-core-folder-btn');
  const coreFolderPanel = document.getElementById('pg-core-folder-panel');
  const coreFolderCloseBtn = document.getElementById('pg-core-folder-close-btn');
  const coreFolderChevron = document.getElementById('pg-core-folder-chevron');

  const setCoreFolderOpen = (open) => {
    if (!coreFolderPanel) return;
    coreFolderPanel.dataset.isOpen = open ? '1' : '0';
    coreFolderPanel.classList.toggle('hidden', !open);
    if (coreFolderBtn) coreFolderBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (coreFolderChevron) coreFolderChevron.textContent = open ? '▴' : '▾';
  };

  if (coreFolderBtn && coreFolderPanel) {
    coreFolderBtn.addEventListener('click', () => {
      setCoreFolderOpen(coreFolderPanel.dataset.isOpen !== '1');
    });
  }
  if (coreFolderCloseBtn) {
    coreFolderCloseBtn.addEventListener('click', () => setCoreFolderOpen(false));
  }

  const secretIdToggleBtn = document.getElementById('card-secret-id-btn');
  const participantIntroBox = document.getElementById('participant-intro-box');
  const participantIntroCloseBtn = document.getElementById('participant-intro-close-btn');
  const secretIdToggleChevron = document.getElementById('card-secret-id-chevron');

  const setPersonalDetailsOpen = (open) => {
    if (!participantIntroBox) return;
    if (open && participantIntroBox.dataset.canReveal !== '1') return;
    participantIntroBox.dataset.isOpen = open ? '1' : '0';
    participantIntroBox.classList.toggle('hidden', !open);
    if (secretIdToggleBtn) {
      secretIdToggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (secretIdToggleChevron) {
      secretIdToggleChevron.textContent = open ? '▴' : '▾';
    }
  };

  if (secretIdToggleBtn && participantIntroBox) {
    secretIdToggleBtn.addEventListener('click', () => {
      if (participantIntroBox.dataset.canReveal !== '1') return;
      const isCurrentlyOpen = participantIntroBox.dataset.isOpen === '1';
      setPersonalDetailsOpen(!isCurrentlyOpen);
    });
  }

  if (participantIntroCloseBtn) {
    participantIntroCloseBtn.addEventListener('click', () => setPersonalDetailsOpen(false));
  }

  // --------------------------------------------------------------------------
  // 10. Personal QR Fullscreen Modal
  // --------------------------------------------------------------------------
  const openMyQrTrigger = document.getElementById('sheet-qr-container');
  const myQrModal = document.getElementById('my-qr-modal');
  const closeMyQrBtn = document.getElementById('close-my-qr-btn');

  const closeMyQrModal = () => {
    if (!myQrModal) return;
    myQrModal.classList.remove('opacity-100');
    setTimeout(() => myQrModal.classList.add('hidden', 'pointer-events-none'), 300);
  };

  if (openMyQrTrigger && myQrModal) {
    openMyQrTrigger.addEventListener('click', () => {
      myQrModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => myQrModal.classList.add('opacity-100'), 10);
    });
  }

  if (closeMyQrBtn && myQrModal) {
    closeMyQrBtn.addEventListener('click', closeMyQrModal);
  }

  if (myQrModal) {
    myQrModal.addEventListener('click', (e) => {
      if (e.target === myQrModal) closeMyQrModal();
    });
  }

  // Profile Callsign & Role Switcher
  const openProfileBtn = document.getElementById('open-profile-btn');
  const profileEditModal = document.getElementById('profile-edit-modal');
  const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
  const profileEditForm = document.getElementById('profile-edit-form');
  const inputNewCallsign = document.getElementById('input-new-callsign');
  const inputNewRole = document.getElementById('input-new-role');

  if (openProfileBtn) {
    openProfileBtn.addEventListener('click', () => {
      activeSheetRunner = null;
      syncPlayerUI();
      switchTab('profile');
    });
  }

  if (closeProfileModalBtn && profileEditModal) {
    closeProfileModalBtn.addEventListener('click', () => {
      profileEditModal.classList.remove('opacity-100');
      setTimeout(() => profileEditModal.classList.add('hidden', 'pointer-events-none'), 300);
    });
  }

  if (profileEditForm) {
    profileEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let newName = inputNewCallsign.value.trim();
      if (!newName.startsWith('@')) newName = '@' + newName;
      player.callsign = newName;
      player.role = inputNewRole.value;
      savePlayerState(player);
      if (profileEditModal) {
        profileEditModal.classList.remove('opacity-100');
        setTimeout(() => profileEditModal.classList.add('hidden', 'pointer-events-none'), 300);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 11. Radio Chat (Fixer Contracts, Corp Broadcasts, Direct DMs & Gruppi)
  // --------------------------------------------------------------------------
  let currentChatChannel = 'fixer';
  const GROUPS_STORAGE_KEY = 'dive_chat_groups_v1';
  let activeGroupId = '';

  const INITIAL_CHAT_GROUPS = [
    {
      id: 'grp_ciminiere',
      name: 'Squadra Ciminiere',
      code: 'GRP-409',
      creator: '@V_Solo',
      members: ['@V_Solo', '@Kuro_04', '@Runner_Insolito'],
      messages: [
        { author: '@Kuro_04', text: 'ICE perimetrale mappato. Entriamo dal lato nord alle 22:00.', time: '20:10' },
        { author: '@V_Solo', text: 'Ricevuto. Tengo pronte le munizioni perforanti.', time: '20:12' }
      ]
    },
    {
      id: 'grp_afterlife',
      name: 'Canale Afterlife',
      code: 'GRP-777',
      creator: '@Nico_Media',
      members: ['@V_Solo', '@Kuro_04', '@Runner_Insolito', '@CyberRex', '@Nico_Media'],
      messages: [
        { author: '@Nico_Media', text: 'Chi ha info sui movimenti Corpo al piano 2 mi scriva qui.', time: '19:45' }
      ]
    }
  ];

  function getChatGroups() {
    try {
      const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(INITIAL_CHAT_GROUPS));
    return JSON.parse(JSON.stringify(INITIAL_CHAT_GROUPS));
  }

  function saveChatGroups(groups) {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    scheduleCloudPush();
  }

  function getMyChatGroups() {
    const groups = getChatGroups();
    const myCallsign = (player && player.callsign) ? player.callsign.toUpperCase() : '';
    return groups.filter(g => Array.isArray(g.members) && g.members.some(m => m.toUpperCase() === myCallsign));
  }

  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatSendForm = document.getElementById('chat-send-form');
  const chatTextInput = document.getElementById('chat-text-input');
  const chatReplyBanner = document.getElementById('chat-reply-banner');
  const chatReplyAuthor = document.getElementById('chat-reply-author');
  const chatReplyPreview = document.getElementById('chat-reply-preview');
  const cancelChatReplyBtn = document.getElementById('cancel-chat-reply-btn');
  const currentChannelLabel = document.getElementById('current-channel-label');
  const dmRecipientWrap = document.getElementById('dm-recipient-wrap');
  const dmRecipientSelect = document.getElementById('dm-recipient-select');
  const chatChannelBtns = document.querySelectorAll('.chat-channel-btn');

  let activeReplyTo = null;
  let lastRenderedChatMsgs = [];

  function escapeChatText(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setChatReply(author, text) {
    const cleanAuthor = String(author || '').split(' -> ')[0].trim();
    const cleanText = String(text || '').trim();
    if (!cleanAuthor || !cleanText) return;
    activeReplyTo = {
      author: cleanAuthor,
      text: cleanText.length > 90 ? cleanText.slice(0, 87) + '...' : cleanText
    };
    if (chatReplyAuthor) chatReplyAuthor.textContent = activeReplyTo.author;
    if (chatReplyPreview) chatReplyPreview.textContent = activeReplyTo.text;
    if (chatReplyBanner) chatReplyBanner.classList.remove('hidden');
    if (chatTextInput) chatTextInput.focus();
  }

  function clearChatReply() {
    activeReplyTo = null;
    if (chatReplyBanner) chatReplyBanner.classList.add('hidden');
  }

  if (cancelChatReplyBtn) {
    cancelChatReplyBtn.addEventListener('click', clearChatReply);
  }

  const chatGroupsActions = document.getElementById('chat-groups-actions');
  const chatGroupsBar = document.getElementById('chat-groups-bar');
  const chatGroupsList = document.getElementById('chat-groups-list');
  const chatGroupMeta = document.getElementById('chat-group-meta');
  const chatGroupMembersLabel = document.getElementById('chat-group-members-label');
  const chatGroupCodeLabel = document.getElementById('chat-group-code-label');
  const leaveGroupBtn = document.getElementById('leave-group-btn');
  const toggleCreateGroupBtn = document.getElementById('toggle-create-group-btn');
  const toggleJoinGroupBtn = document.getElementById('toggle-join-group-btn');
  const createGroupForm = document.getElementById('create-group-form');
  const cancelCreateGroupBtn = document.getElementById('cancel-create-group-btn');
  const newGroupNameInput = document.getElementById('new-group-name-input');
  const newGroupMembersChecks = document.getElementById('new-group-members-checks');
  const joinGroupForm = document.getElementById('join-group-form');
  const joinGroupCodeInput = document.getElementById('join-group-code-input');

  function renderCreateGroupMemberCheckboxes() {
    if (!newGroupMembersChecks) return;
    const pool = getAccountsRegistry().filter(a => a.callsign.toUpperCase() !== player.callsign.toUpperCase());
    newGroupMembersChecks.innerHTML = pool.map(acc => `
      <label class="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-black border border-white/15 text-slate-200 cursor-pointer hover:border-dive-purple">
        <input type="checkbox" value="${acc.callsign}" class="new-group-member-cb accent-dive-purple">
        <span>${acc.callsign}</span>
      </label>
    `).join('');
  }

  function renderGroupsUI() {
    if (!chatGroupsList) return;
    const myGroups = getMyChatGroups();
    if (!myGroups.some(g => g.id === activeGroupId)) {
      activeGroupId = myGroups.length > 0 ? myGroups[0].id : '';
    }

    if (myGroups.length === 0) {
      chatGroupsList.innerHTML = '<span class="text-slate-500 italic">Nessun gruppo attivo. Creane uno (+ NUOVO) o entra con CODICE.</span>';
      if (chatGroupMeta) chatGroupMeta.classList.add('hidden');
      if (currentChatChannel === 'groups' && currentChannelLabel) {
        currentChannelLabel.textContent = '# GRUPPI CRIPTATI (NESSUNO)';
      }
      return;
    }

    chatGroupsList.innerHTML = myGroups.map(grp => {
      const isActive = grp.id === activeGroupId;
      return `
        <button type="button" class="chat-group-pill px-2.5 py-1 rounded-sm border whitespace-nowrap transition-colors ${isActive ? 'border-dive-purple bg-dive-purple/20 text-white font-bold' : 'border-white/10 bg-[#04060A] text-slate-400 hover:text-white'}" data-group-id="${grp.id}">
          ${grp.name} (${grp.members.length})
        </button>
      `;
    }).join('');

    chatGroupsList.querySelectorAll('.chat-group-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeGroupId = btn.getAttribute('data-group-id');
        renderGroupsUI();
        renderChat();
        playCyberSound(520, 'sine', 0.04);
      });
    });

    const activeGrp = myGroups.find(g => g.id === activeGroupId);
    if (activeGrp && chatGroupMeta) {
      chatGroupMeta.classList.remove('hidden');
      if (chatGroupMembersLabel) chatGroupMembersLabel.textContent = `Membri: ${activeGrp.members.join(', ')}`;
      if (chatGroupCodeLabel) chatGroupCodeLabel.textContent = `COD: ${activeGrp.code}`;
      if (currentChatChannel === 'groups' && currentChannelLabel) {
        currentChannelLabel.textContent = `# GRUPPO: ${activeGrp.name.toUpperCase()}`;
      }
    }
  }

  function renderChat() {
    if (!chatMessagesContainer) return;
    let msgs = [];
    if (currentChatChannel === 'groups') {
      const myGroups = getMyChatGroups();
      const activeGrp = myGroups.find(g => g.id === activeGroupId);
      if (!activeGrp) {
        lastRenderedChatMsgs = [];
        chatMessagesContainer.innerHTML = '<div class="text-center text-slate-500 font-mono text-xs py-8">Crea un nuovo gruppo o inserisci un codice invito per iniziare a chattare in squadra.</div>';
        return;
      }
      msgs = activeGrp.messages || [];
    } else {
      msgs = player.chatMessages[currentChatChannel] || [];
    }

    lastRenderedChatMsgs = msgs;

    if (msgs.length === 0) {
      chatMessagesContainer.innerHTML = '<div class="text-center text-slate-500 font-mono text-xs py-8">Nessun messaggio su questa frequenza.</div>';
      return;
    }

    chatMessagesContainer.innerHTML = msgs.map((msg, idx) => {
      const isMe = msg.author === player.callsign || msg.author.startsWith(`${player.callsign} ->`);
      const isSystem = msg.author === 'SISTEMA';
      const canReply = !isMe && !isSystem;
      const quoteHtml = msg.replyTo ? `
        <div class="mb-1.5 px-2 py-1 rounded-sm bg-black/45 border-l-2 border-dive-cyan/70 text-[10px] font-mono">
          <span class="text-dive-cyan font-bold">${escapeChatText(msg.replyTo.author)}</span>
          <span class="text-slate-400 block truncate">${escapeChatText(msg.replyTo.text)}</span>
        </div>
      ` : '';
      const replyActionsHtml = canReply ? `
        <div class="flex items-center gap-1 ml-1">
          <button type="button" data-chat-reply="${idx}" class="px-1.5 py-0.5 rounded-sm bg-white/5 hover:bg-dive-cyan hover:text-black text-dive-cyan border border-dive-cyan/30 text-[9px] font-bold uppercase transition-colors">RISPONDI</button>
          ${currentChatChannel !== 'direct' ? `<button type="button" data-chat-dm="${idx}" class="px-1.5 py-0.5 rounded-sm bg-white/5 hover:bg-dive-orange hover:text-black text-dive-orange border border-dive-orange/30 text-[9px] font-bold uppercase transition-colors">DM</button>` : ''}
        </div>
      ` : '';
      return `
        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
          <div class="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-500 mb-0.5">
            <span class="font-bold ${isMe ? 'text-dive-orange' : 'text-dive-cyan'}">${escapeChatText(msg.author)}</span>
            <span>• ${escapeChatText(msg.time)}</span>
            ${replyActionsHtml}
          </div>
          <div class="px-3.5 py-2 rounded-sm max-w-[85%] text-xs ${isMe ? 'bg-dive-orange/15 border border-dive-orange/35 text-white' : 'bg-[#080B12] border border-white/10 text-slate-200'}">
            ${quoteHtml}
            <div>${escapeChatText(msg.text)}</div>
          </div>
        </div>
      `;
    }).join('');

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    if (typeof updateSocialNotificationBadges === 'function') updateSocialNotificationBadges();
  }

  if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener('click', (e) => {
      const replyBtn = e.target.closest('[data-chat-reply]');
      if (replyBtn) {
        const idx = Number(replyBtn.getAttribute('data-chat-reply'));
        const targetMsg = lastRenderedChatMsgs[idx];
        if (targetMsg) {
          setChatReply(targetMsg.author, targetMsg.text);
          playCyberSound(500, 'sine', 0.04);
        }
        return;
      }

      const dmBtn = e.target.closest('[data-chat-dm]');
      if (dmBtn) {
        const idx = Number(dmBtn.getAttribute('data-chat-dm'));
        const targetMsg = lastRenderedChatMsgs[idx];
        if (!targetMsg) return;
        const recipientName = String(targetMsg.author || '').split(' -> ')[0].trim();
        const directBtn = document.querySelector('.chat-channel-btn[data-channel="direct"]');
        if (directBtn) directBtn.click();
        if (dmRecipientSelect && recipientName) {
          const exists = Array.from(dmRecipientSelect.options).some(opt => opt.value === recipientName);
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = recipientName;
            opt.textContent = recipientName;
            dmRecipientSelect.appendChild(opt);
          }
          dmRecipientSelect.value = recipientName;
        }
        setChatReply(recipientName, targetMsg.text);
        playCyberSound(560, 'sine', 0.05);
      }
    });
  }

  chatChannelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      clearChatReply();
      chatChannelBtns.forEach(b => {
        b.className = 'chat-channel-btn px-2.5 py-1.5 rounded-sm border border-white/10 bg-[#080B12] text-slate-400 hover:text-white whitespace-nowrap';
      });
      btn.className = 'chat-channel-btn active px-2.5 py-1.5 rounded-sm border border-dive-cyan/50 bg-dive-cyan/15 text-dive-cyan font-semibold whitespace-nowrap';
      currentChatChannel = btn.getAttribute('data-channel');

      const isGroups = currentChatChannel === 'groups';
      if (chatGroupsActions) chatGroupsActions.classList.toggle('hidden', !isGroups);
      if (chatGroupsBar) chatGroupsBar.classList.toggle('hidden', !isGroups);

      if (currentChatChannel === 'direct') {
        if (dmRecipientWrap) dmRecipientWrap.classList.remove('hidden');
        if (currentChannelLabel) currentChannelLabel.textContent = '# DM DIRETTO PRIVATO';
      } else if (isGroups) {
        if (dmRecipientWrap) dmRecipientWrap.classList.add('hidden');
        renderGroupsUI();
      } else {
        if (dmRecipientWrap) dmRecipientWrap.classList.add('hidden');
        const channelLabels = {
          fixer: '# CONTRATTI & TAGLIE FIXER',
          blackmarket: '# BLACK MARKET // SOLO CODICI ID',
          corp: '# DISPACCI UFFICIALI CORP & MASTER'
        };
        if (currentChannelLabel) currentChannelLabel.textContent = channelLabels[currentChatChannel] || '# RADIO';
      }

      renderChat();
      playCyberSound(480, 'sine', 0.05);
    });
  });

  if (toggleCreateGroupBtn && createGroupForm) {
    toggleCreateGroupBtn.addEventListener('click', () => {
      renderCreateGroupMemberCheckboxes();
      createGroupForm.classList.toggle('hidden');
      if (joinGroupForm) joinGroupForm.classList.add('hidden');
    });
  }

  if (cancelCreateGroupBtn && createGroupForm) {
    cancelCreateGroupBtn.addEventListener('click', () => {
      createGroupForm.classList.add('hidden');
    });
  }

  if (toggleJoinGroupBtn && joinGroupForm) {
    toggleJoinGroupBtn.addEventListener('click', () => {
      joinGroupForm.classList.toggle('hidden');
      if (createGroupForm) createGroupForm.classList.add('hidden');
    });
  }

  if (createGroupForm && newGroupNameInput) {
    createGroupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = newGroupNameInput.value.trim();
      if (!name) return;
      const selectedMembers = Array.from(document.querySelectorAll('.new-group-member-cb:checked')).map(cb => cb.value);
      const members = Array.from(new Set([player.callsign, ...selectedMembers]));
      const code = 'GRP-' + Math.floor(100 + Math.random() * 900);
      const newGroup = {
        id: 'grp_' + Date.now(),
        name,
        code,
        creator: player.callsign,
        members,
        messages: [
          { author: 'SISTEMA', text: `Gruppo "${name}" creato da ${player.callsign} (Codice invito: ${code}).`, time: 'Adesso' }
        ]
      };
      const groups = getChatGroups();
      groups.unshift(newGroup);
      saveChatGroups(groups);
      activeGroupId = newGroup.id;
      createGroupForm.reset();
      createGroupForm.classList.add('hidden');
      renderGroupsUI();
      renderChat();
      if (typeof playCyberFx === 'function') playCyberFx('success');
    });
  }

  if (joinGroupForm && joinGroupCodeInput) {
    joinGroupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = joinGroupCodeInput.value.trim().toUpperCase();
      if (!code) return;
      const groups = getChatGroups();
      const target = groups.find(g => (g.code || '').toUpperCase() === code);
      if (!target) {
        if (typeof playCyberFx === 'function') playCyberFx('denied');
        alert(`Nessun gruppo trovato con codice ${code}.`);
        return;
      }
      if (!target.members.some(m => m.toUpperCase() === player.callsign.toUpperCase())) {
        target.members.push(player.callsign);
        target.messages.push({ author: 'SISTEMA', text: `${player.callsign} è entrato nel gruppo.`, time: 'Adesso' });
        saveChatGroups(groups);
      }
      activeGroupId = target.id;
      joinGroupForm.reset();
      joinGroupForm.classList.add('hidden');
      renderGroupsUI();
      renderChat();
      if (typeof playCyberFx === 'function') playCyberFx('success');
    });
  }

  if (leaveGroupBtn) {
    leaveGroupBtn.addEventListener('click', () => {
      if (!activeGroupId) return;
      const groups = getChatGroups();
      const target = groups.find(g => g.id === activeGroupId);
      if (!target) return;
      target.members = target.members.filter(m => m.toUpperCase() !== player.callsign.toUpperCase());
      target.messages.push({ author: 'SISTEMA', text: `${player.callsign} ha lasciato il gruppo.`, time: 'Adesso' });
      saveChatGroups(groups);
      activeGroupId = '';
      renderGroupsUI();
      renderChat();
      playCyberSound(360, 'triangle', 0.05);
    });
  }

  if (chatSendForm && chatTextInput) {
    chatSendForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatTextInput.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const replyPayload = activeReplyTo ? { author: activeReplyTo.author, text: activeReplyTo.text } : null;

      if (currentChatChannel === 'groups') {
        const groups = getChatGroups();
        const target = groups.find(g => g.id === activeGroupId);
        if (!target) return;
        const msgObj = {
          author: player.callsign,
          text,
          time: timeStr
        };
        if (replyPayload) msgObj.replyTo = replyPayload;
        target.messages.push(msgObj);
        saveChatGroups(groups);
      } else {
        const recipient = (currentChatChannel === 'direct' && dmRecipientSelect) ? ` -> ${dmRecipientSelect.value}` : '';
        if (!player.chatMessages[currentChatChannel]) player.chatMessages[currentChatChannel] = [];
        const msgObj = {
          author: player.callsign + recipient,
          text: text,
          time: timeStr
        };
        if (replyPayload) msgObj.replyTo = replyPayload;
        player.chatMessages[currentChatChannel].push(msgObj);
        savePlayerState(player);
        if (currentChatChannel === 'fixer' && typeof recordPlayerReplyToFixerQuest === 'function') {
          recordPlayerReplyToFixerQuest(player.callsign, text, timeStr);
        }
      }

      chatTextInput.value = '';
      clearChatReply();
      renderChat();
      playCyberSound(620, 'square', 0.05);
    });
  }

  // --------------------------------------------------------------------------
  // 12. Social Net Feed (Instagram Style with Media Implants Special Powers)
  // --------------------------------------------------------------------------
  const feedGrid = document.getElementById('social-feed-grid');
  const feedCountEl = document.getElementById('feed-count');

  const INITIAL_POSTS = [
    {
      id: 'post_corp_1',
      type: 'news',
      author: 'dive.larp',
      location: 'Ciminiere Catania',
      isVerified: true,
      isPinned: true,
      title: '[COMUNICATO] Movimenti nel Settore Ciminiere',
      content: 'I sensori confermano attività non autorizzate nell\'area industriale. Fixer e corporazioni stanno arruolando netrunner e mercenari.',
      image: null,
      timestamp: '1 ora fa',
      likes: 84,
      dislikes: 2,
      comments: [
        { author: '@V_Solo', text: 'Ottiche calibrate. Ci vediamo sul campo Choom.', time: '40 min fa' }
      ]
    },
    {
      id: 'post_photo_1',
      type: 'photos',
      author: 'dive.larp',
      location: 'Ciminiere Catania',
      isVerified: true,
      isPinned: false,
      title: '',
      content: '“Hey Choom, ho avuto notizia di un Runner insolito, porta con sé del cromo particolare, roba che non si vede tutti i giorni…”',
      image: 'assets/images/runner-post.jpg',
      timestamp: '29 maggio',
      likes: 431,
      dislikes: 1,
      comments: [
        { author: '@CyberRex', text: 'Quel visore è roba da Black ICE!', time: 'Ieri' }
      ]
    }
  ];

  function getSocialPosts() {
    try {
      const stored = localStorage.getItem('dive_social_feed_posts_v3');
      return stored ? JSON.parse(stored) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  }

  function saveSocialPosts(posts) {
    try {
      localStorage.setItem('dive_social_feed_posts_v3', JSON.stringify(posts));
      renderSocialFeed();
      scheduleCloudPush();
    } catch (e) {
      console.warn(e);
    }
  }

  function renderSocialFeed() {
    if (!feedGrid) return;
    const posts = getSocialPosts();
    const isMediaOrAdmin = player.role.includes('MEDIA') || player.role.includes('ADMIN');

    // Sort pinned posts on top
    const sortedPosts = [...posts].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    feedGrid.innerHTML = sortedPosts.map(post => {
      const isNews = post.type === 'news';
      const isAnon = post.isAnonymous;
      const isOwnPost = Boolean(
        (post.authorSecretId && player.secretId && post.authorSecretId.toUpperCase() === player.secretId.toUpperCase()) ||
        (!isAnon && post.author && player.callsign && post.author.toUpperCase() === player.callsign.toUpperCase())
      );
      const canDelete = isMediaOrAdmin || isOwnPost;

      const badgeClass = isAnon
        ? 'bg-dive-purple/15 border-dive-purple/40 text-dive-purple'
        : (isNews ? 'bg-dive-cyan/15 border-dive-cyan/40 text-dive-cyan' : 'bg-dive-orange/15 border-dive-orange/40 text-dive-orange');

      return `
        <article class="cyber-panel hud-bracket p-4 sm:p-5 space-y-3.5 transition-colors ${post.isPinned ? 'border-dive-orange/60' : ''}" data-id="${post.id}" data-type="${post.type}" data-anon="${isAnon ? 'true' : 'false'}">
            
            <!-- User Header -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-sm border border-white/15 bg-[#080B12] flex items-center justify-center font-mono font-bold text-[10px] text-dive-orange">
                  ${isAnon ? 'ANON' : (post.author ? post.author.slice(0, 2).toUpperCase() : 'RN')}
                </div>
                <div>
                  <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                    <span>${isAnon ? 'Ghost Net (Anonimo)' : post.author}</span>
                    ${post.isVerified ? '<span class="text-dive-cyan text-[10px]" title="Verificato Media/Corp">[VER]</span>' : ''}
                    ${post.isPinned ? '<span class="text-[9px] px-1.5 py-0.5 rounded-sm bg-dive-orange/20 border border-dive-orange/40 text-dive-orange font-mono">PINNED</span>' : ''}
                  </div>
                  <div class="font-mono text-[10px] text-slate-500">${post.location || 'Settore 04'} • ${post.timestamp}</div>
                </div>
              </div>

              <!-- Media Powers & Owner Delete -->
              <div class="flex items-center gap-2">
                ${isMediaOrAdmin ? `
                  <button class="media-pin-btn px-1.5 py-0.5 rounded-sm border border-white/10 text-[9px] font-mono text-slate-400 hover:text-dive-orange hover:border-dive-orange/40 cursor-pointer" data-id="${post.id}" title="Pinna in alto">
                    [PIN]
                  </button>
                ` : ''}
                ${canDelete ? `
                  <button class="media-delete-btn px-1.5 py-0.5 rounded-sm border border-white/10 text-[9px] font-mono text-slate-400 hover:text-dive-red hover:border-dive-red/40 cursor-pointer" data-id="${post.id}" title="Elimina post">
                    [ELIMINA]
                  </button>
                ` : ''}
                <span class="px-2 py-0.5 rounded-sm border text-[9px] font-mono font-bold uppercase ${badgeClass}">
                  ${isAnon ? 'LEAK' : (isNews ? 'NOTIZIA' : 'FOTO')}
                </span>
              </div>
            </div>

            <!-- Image (if available) -->
            ${post.image ? `
              <div class="relative w-full rounded-sm overflow-hidden bg-black border border-white/10">
                <img src="${post.image}" alt="Media Post" class="w-full h-auto object-cover max-h-[500px]">
              </div>
            ` : ''}

            <!-- Text Content -->
            <div class="space-y-1">
              ${post.title ? `<h3 class="font-orbitron font-bold text-sm sm:text-base text-white">${post.title}</h3>` : ''}
              <p class="text-xs sm:text-sm font-sans text-slate-300 leading-relaxed">${post.content}</p>
            </div>

            <!-- Interaction Bar -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-slate-400">
              <div class="flex items-center gap-4">
                <button class="social-like-btn flex items-center gap-1.5 ${(post.likedBy || []).includes(player.secretId || player.callsign) ? 'text-dive-orange font-bold' : 'hover:text-dive-orange'} transition-colors" data-id="${post.id}">
                  <svg class="w-4 h-4 ${(post.likedBy || []).includes(player.secretId || player.callsign) ? 'text-dive-orange' : 'text-dive-orange/70'}" fill="${(post.likedBy || []).includes(player.secretId || player.callsign) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  <span class="font-bold text-white">${post.likes || 0}</span>
                </button>

                <button class="social-dislike-btn flex items-center gap-1.5 ${(post.dislikedBy || []).includes(player.secretId || player.callsign) ? 'text-dive-cyan font-bold' : 'hover:text-dive-cyan'} transition-colors" data-id="${post.id}" title="Dislike">
                  <svg class="w-4 h-4 ${(post.dislikedBy || []).includes(player.secretId || player.callsign) ? 'text-dive-cyan' : 'text-dive-cyan/70'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg>
                  <span>${post.dislikes || 0}</span>
                </button>
              </div>

              <button class="social-toggle-comments text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <span>${(post.comments && post.comments.length) || 0} commenti</span>
              </button>
            </div>

            <!-- Comment Drawer -->
            <div class="social-comments-wrap hidden pt-3 border-t border-white/10 space-y-2.5">
              <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                ${(post.comments && post.comments.length > 0) ? post.comments.map(c => `
                  <div class="p-2.5 rounded-sm bg-[#080B12] border border-white/10 text-xs">
                    <div class="flex justify-between font-mono text-[10px] text-dive-cyan mb-1">
                      <span class="font-bold">${c.author}</span>
                      <span class="text-slate-500">${c.time}</span>
                    </div>
                    <p class="text-slate-200 font-sans text-xs">${c.text}</p>
                  </div>
                `).join('') : '<span class="text-[11px] text-slate-500 italic block">Ancora nessun commento.</span>'}
              </div>

              <form class="social-add-comment-form flex gap-2 pt-1" data-id="${post.id}">
                <input type="text" placeholder="Aggiungi un commento..." class="flex-1 px-3 py-1.5 rounded-sm bg-[#080B12] border border-white/15 focus:border-dive-orange text-white text-xs outline-none" required>
                <button type="submit" class="px-3.5 py-1.5 rounded-sm bg-white/10 hover:bg-white hover:text-black text-white font-mono font-bold text-[11px] uppercase transition-colors">
                  Invia
                </button>
              </form>
            </div>

        </article>
      `;
    }).join('');

    if (feedCountEl) feedCountEl.textContent = posts.length;
    bindSocialPostEvents();
    if (typeof applyFeedFilters === 'function') applyFeedFilters();
    if (typeof updateSocialNotificationBadges === 'function') updateSocialNotificationBadges();
  }

  function bindSocialPostEvents() {
    const posts = getSocialPosts();

    // Toggle comment accordion
    document.querySelectorAll('.social-toggle-comments').forEach(btn => {
      btn.onclick = () => {
        const wrap = btn.closest('article').querySelector('.social-comments-wrap');
        if (wrap) wrap.classList.toggle('hidden');
      };
    });

    // Like / Dislike toggle (1 reazione per runner per post)
    const voterKey = player.secretId || player.callsign;

    document.querySelectorAll('.social-like-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const p = posts.find(x => x.id === id);
        if (!p) return;
        p.likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
        p.dislikedBy = Array.isArray(p.dislikedBy) ? p.dislikedBy : [];

        if (p.likedBy.includes(voterKey)) {
          p.likedBy = p.likedBy.filter(v => v !== voterKey);
          p.likes = Math.max(0, (p.likes || 0) - 1);
        } else {
          p.likedBy.push(voterKey);
          p.likes = (p.likes || 0) + 1;
          if (p.dislikedBy.includes(voterKey)) {
            p.dislikedBy = p.dislikedBy.filter(v => v !== voterKey);
            p.dislikes = Math.max(0, (p.dislikes || 0) - 1);
          }
        }
        saveSocialPosts(posts);
        playCyberSound(800, 'triangle', 0.08);
      };
    });

    // Dislike
    document.querySelectorAll('.social-dislike-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const p = posts.find(x => x.id === id);
        if (!p) return;
        p.likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
        p.dislikedBy = Array.isArray(p.dislikedBy) ? p.dislikedBy : [];

        if (p.dislikedBy.includes(voterKey)) {
          p.dislikedBy = p.dislikedBy.filter(v => v !== voterKey);
          p.dislikes = Math.max(0, (p.dislikes || 0) - 1);
        } else {
          p.dislikedBy.push(voterKey);
          p.dislikes = (p.dislikes || 0) + 1;
          if (p.likedBy.includes(voterKey)) {
            p.likedBy = p.likedBy.filter(v => v !== voterKey);
            p.likes = Math.max(0, (p.likes || 0) - 1);
          }
        }
        saveSocialPosts(posts);
        playCyberSound(400, 'sawtooth', 0.08);
      };
    });

    // Media Pin/Unpin
    document.querySelectorAll('.media-pin-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const p = posts.find(x => x.id === id);
        if (p) {
          p.isPinned = !p.isPinned;
          saveSocialPosts(posts);
          playCyberSound(650, 'sine', 0.1);
        }
      };
    });

    // Media Delete Post
    document.querySelectorAll('.media-delete-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Vuoi rimuovere definitivamente questo post dal feed?')) {
          const updated = posts.filter(x => x.id !== id);
          saveSocialPosts(updated);
          playCyberSound(300, 'square', 0.1);
        }
      };
    });

    // Submit Comment
    document.querySelectorAll('.social-add-comment-form').forEach(form => {
      form.onsubmit = (e) => {
        e.preventDefault();
        const id = form.getAttribute('data-id');
        const input = form.querySelector('input');
        const text = input.value.trim();
        if (!text) return;

        const p = posts.find(x => x.id === id);
        if (p) {
          if (!p.comments) p.comments = [];
          p.comments.push({
            author: player.callsign,
            text: text,
            time: 'Adesso'
          });
          saveSocialPosts(posts);
          input.value = '';
          playCyberSound(700, 'square', 0.08);
        }
      };
    });
  }

  // Filter Buttons & Live Search
  const feedSearchInput = document.getElementById('feed-search-input');
  let activeFeedFilter = 'all';

  function applyFeedFilters() {
    const query = feedSearchInput ? feedSearchInput.value.trim().toLowerCase() : '';
    document.querySelectorAll('#social-feed-grid article').forEach(card => {
      const type = card.getAttribute('data-type');
      const isAnon = card.getAttribute('data-anon') === 'true';

      let matchesFilter = false;
      if (activeFeedFilter === 'all') matchesFilter = true;
      else if (activeFeedFilter === 'news' && type === 'news') matchesFilter = true;
      else if (activeFeedFilter === 'photos' && type === 'photos') matchesFilter = true;
      else if (activeFeedFilter === 'anonymous' && isAnon) matchesFilter = true;

      const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
      card.classList.toggle('hidden', !(matchesFilter && matchesSearch));
    });
  }

  document.querySelectorAll('.feed-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feed-filter-btn').forEach(b => {
        b.className = 'feed-filter-btn px-3 py-1.5 rounded-sm border border-white/10 bg-[#080B12] text-slate-400 hover:text-white whitespace-nowrap transition-colors';
      });
      btn.className = 'feed-filter-btn active px-3 py-1.5 rounded-sm border border-dive-orange bg-dive-orange/15 text-dive-orange font-semibold whitespace-nowrap transition-colors';

      activeFeedFilter = btn.getAttribute('data-filter') || 'all';
      applyFeedFilters();
    });
  });

  if (feedSearchInput) {
    feedSearchInput.addEventListener('input', applyFeedFilters);
  }

  // Quick-Post Composer Inline
  const quickSocialForm = document.getElementById('quick-social-form');
  const quickSocialInput = document.getElementById('quick-social-input');
  const quickSocialAnon = document.getElementById('quick-social-anon');

  if (quickSocialForm && quickSocialInput) {
    quickSocialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const content = quickSocialInput.value.trim();
      if (!content) return;
      const isAnon = Boolean(quickSocialAnon && quickSocialAnon.checked);
      const posts = getSocialPosts();
      posts.unshift({
        id: 'post_' + Date.now(),
        type: 'news',
        author: isAnon ? 'Ghost_Net' : player.callsign,
        authorSecretId: player.secretId,
        isAnonymous: isAnon,
        isVerified: !isAnon && (player.role.includes('MEDIA') || player.role.includes('CORPO')),
        isPinned: false,
        location: isAnon ? 'Rete Oscura' : 'The Net',
        timestamp: 'Adesso',
        title: isAnon ? 'LEAK ANONIMO' : '',
        content,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        comments: []
      });
      saveSocialPosts(posts);
      renderSocialFeed();
      quickSocialForm.reset();
      if (typeof playCyberFx === 'function') playCyberFx('success');
    });
  }

  // Modal: Carica Foto
  const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
  const uploadPhotoModal = document.getElementById('upload-photo-modal');
  const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
  const uploadPhotoForm = document.getElementById('upload-photo-form');
  const photoFileInput = document.getElementById('photo-file-input');
  const photoCaptionInput = document.getElementById('photo-caption-input');

  if (openUploadModalBtn && uploadPhotoModal) {
    openUploadModalBtn.addEventListener('click', () => {
      uploadPhotoModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => uploadPhotoModal.classList.add('opacity-100'), 10);
    });
  }

  if (closeUploadModalBtn && uploadPhotoModal) {
    closeUploadModalBtn.addEventListener('click', () => {
      uploadPhotoModal.classList.remove('opacity-100');
      setTimeout(() => uploadPhotoModal.classList.add('hidden', 'pointer-events-none'), 300);
    });
  }

  function compressImageToDataURL(file, maxDim = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lettura file fallita'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Decodifica immagine fallita'));
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (uploadPhotoForm) {
    uploadPhotoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = photoFileInput.files[0];
      const caption = photoCaptionInput.value.trim();

      let imageSrc = 'assets/images/runner-post.jpg';
      if (file) {
        try {
          imageSrc = await compressImageToDataURL(file);
        } catch (err) {
          console.warn('[UPLOAD] Compressione fallita, uso fallback:', err);
        }
      }

      const posts = getSocialPosts();
      const newPost = {
        id: 'post_' + Date.now(),
        type: 'photos',
        author: player.callsign,
        authorSecretId: player.secretId,
        location: 'Settore 04 Ciminiere',
        isVerified: player.role.includes('MEDIA'),
        isPinned: false,
        title: '',
        content: caption,
        image: imageSrc,
        timestamp: 'Adesso',
        likes: 1,
        dislikes: 0,
        comments: []
      };

      posts.unshift(newPost);
      saveSocialPosts(posts);

      uploadPhotoForm.reset();
      if (uploadPhotoModal) {
        uploadPhotoModal.classList.remove('opacity-100');
        setTimeout(() => uploadPhotoModal.classList.add('hidden', 'pointer-events-none'), 300);
      }
      playCyberSound(880, 'sine', 0.2);
    });
  }

  // Modal: Pubblica Notizia / Leak
  const openPublishNewsBtn = document.getElementById('open-publish-news-btn');
  const publishNewsModal = document.getElementById('publish-news-modal');
  const closeNewsModalBtn = document.getElementById('close-news-modal-btn');
  const publishNewsForm = document.getElementById('publish-news-form');
  const newsTitleInput = document.getElementById('news-title-input');
  const newsContentInput = document.getElementById('news-content-input');
  const newsAnonCheck = document.getElementById('news-anon-check');

  if (openPublishNewsBtn && publishNewsModal) {
    openPublishNewsBtn.addEventListener('click', () => {
      publishNewsModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => publishNewsModal.classList.add('opacity-100'), 10);
    });
  }

  if (closeNewsModalBtn && publishNewsModal) {
    closeNewsModalBtn.addEventListener('click', () => {
      publishNewsModal.classList.remove('opacity-100');
      setTimeout(() => publishNewsModal.classList.add('hidden', 'pointer-events-none'), 300);
    });
  }

  if (publishNewsForm) {
    publishNewsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = newsTitleInput.value.trim();
      const content = newsContentInput.value.trim();
      const isAnon = newsAnonCheck.checked;

      const posts = getSocialPosts();
      const newPost = {
        id: 'post_' + Date.now(),
        type: 'news',
        author: isAnon ? 'Ghost Net' : player.callsign,
        authorSecretId: player.secretId,
        isAnonymous: isAnon,
        location: 'Settore 04',
        isVerified: player.role.includes('MEDIA') && !isAnon,
        isPinned: false,
        title: title,
        content: content,
        image: null,
        timestamp: 'Adesso',
        likes: 0,
        dislikes: 0,
        comments: []
      };

      posts.unshift(newPost);
      saveSocialPosts(posts);

      publishNewsForm.reset();
      if (publishNewsModal) {
        publishNewsModal.classList.remove('opacity-100');
        setTimeout(() => publishNewsModal.classList.add('hidden', 'pointer-events-none'), 300);
      }
      playCyberSound(880, 'sine', 0.2);
    });
  }

  // --------------------------------------------------------------------------
  // 13. Admin / Regia Master System (God Mode // PIN: 2077)
  // --------------------------------------------------------------------------
  const appVersionBadge = document.getElementById('app-version-badge');
  const adminPinModal = document.getElementById('admin-pin-modal');
  const closeAdminPinBtn = document.getElementById('close-admin-pin-btn');
  const adminPinForm = document.getElementById('admin-pin-form');
  const adminPinInput = document.getElementById('admin-pin-input');
  const exitAdminBtn = document.getElementById('exit-admin-btn');
  const adminBroadcastForm = document.getElementById('admin-broadcast-form');
  const adminBroadcastInput = document.getElementById('admin-broadcast-input');
  const globalBroadcastBanner = document.getElementById('global-broadcast-banner');
  const globalBroadcastText = document.getElementById('global-broadcast-text');
  const closeBroadcastBtn = document.getElementById('close-broadcast-btn');
  const adminRosterTbody = document.getElementById('admin-roster-tbody');

  // Quick mod buttons in admin
  const adminAddPsych = document.getElementById('admin-add-psych');
  const adminRemPsych = document.getElementById('admin-rem-psych');
  const adminAddMoney = document.getElementById('admin-add-money');
  const adminToggleIce = document.getElementById('admin-toggle-ice');

  const loginModalVersionBadge = document.getElementById('login-modal-version-badge');
  [appVersionBadge, loginModalVersionBadge].filter(Boolean).forEach(badgeEl => {
    if (!adminPinModal) return;
    let versionTapCount = 0;
    let versionTapTimer = null;
    badgeEl.addEventListener('click', () => {
      versionTapCount += 1;
      clearTimeout(versionTapTimer);
      if (versionTapCount >= 3) {
        versionTapCount = 0;
        if (typeof closeLoginModal === 'function') closeLoginModal();
        adminPinModal.classList.remove('hidden', 'pointer-events-none');
        setTimeout(() => adminPinModal.classList.add('opacity-100'), 10);
        if (adminPinInput) adminPinInput.focus();
      } else {
        versionTapTimer = setTimeout(() => {
          versionTapCount = 0;
        }, 1200);
      }
    });
  });

  if (closeAdminPinBtn && adminPinModal) {
    closeAdminPinBtn.addEventListener('click', () => {
      adminPinModal.classList.remove('opacity-100');
      setTimeout(() => adminPinModal.classList.add('hidden', 'pointer-events-none'), 300);
    });
  }

  if (adminPinForm) {
    adminPinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (adminPinInput.value === '2077') {
        adminPinModal.classList.remove('opacity-100');
        setTimeout(() => adminPinModal.classList.add('hidden', 'pointer-events-none'), 300);
        switchTab('admin');
        playCyberSound(880, 'square', 0.2);
        renderAdminRoster();
      } else {
        alert('PIN REGIA ERRATO! Accesso negato.');
        adminPinInput.value = '';
      }
    });
  }

  if (exitAdminBtn) {
    exitAdminBtn.addEventListener('click', () => {
      switchTab('home');
    });
  }

  if (adminBroadcastForm) {
    adminBroadcastForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = adminBroadcastInput.value.trim();
      if (!msg) return;

      saveBroadcastState({ text: msg, active: true, updatedAt: Date.now() });
      playCyberSound(950, 'sawtooth', 0.4);
      adminBroadcastInput.value = '';
      alert('[BROADCAST INVIATO]\nAvviso d\'emergenza trasmesso a tutti i runner sul campo.');
    });
  }

  if (closeBroadcastBtn && globalBroadcastBanner) {
    closeBroadcastBtn.addEventListener('click', () => {
      saveBroadcastState({ text: '', active: false, updatedAt: Date.now() });
    });
  }

  const adminTargetSelect = document.getElementById('admin-target-pg-select');
  const adminTargetSummary = document.getElementById('admin-target-stats-summary');
  const adminCustomMoneyIn = document.getElementById('admin-custom-money');
  const adminCustomPsychIn = document.getElementById('admin-custom-psych');
  const adminCustomHpIn = document.getElementById('admin-custom-hp');
  let selectedAdminTargetSid = (player && player.secretId) || '#V-7842';

  function syncAdminTargetUI() {
    const roster = getAccountsRegistry();
    if (!roster.length) return;
    if (!roster.some(r => (r.secretId || '').toUpperCase() === selectedAdminTargetSid.toUpperCase())) {
      selectedAdminTargetSid = roster[0].secretId;
    }
    if (adminTargetSelect) {
      adminTargetSelect.innerHTML = roster.map(r =>
        `<option value="${r.secretId}">${r.callsign} (${r.secretId})</option>`
      ).join('');
      adminTargetSelect.value = selectedAdminTargetSid;
    }
    const target = roster.find(r => (r.secretId || '').toUpperCase() === selectedAdminTargetSid.toUpperCase());
    if (target && adminTargetSummary) {
      adminTargetSummary.textContent = `HP: ${target.hp}% · PSICOSI: ${target.psych}% · €$: ${(target.wallet || 0).toLocaleString()} · ICE: ${target.iceActive ? 'ON' : 'OFF'}`;
    }
    if (target && adminToggleIce) {
      adminToggleIce.textContent = target.iceActive ? 'ICE: ON (DISATTIVA)' : 'ICE: OFF (ATTIVA)';
    }
    if (target) {
      const f = target.coreFolder || {};
      const archIn = document.getElementById('admin-folder-archetype');
      const traumaIn = document.getElementById('admin-folder-trauma');
      const reactIn = document.getElementById('admin-folder-reaction');
      const motivIn = document.getElementById('admin-folder-motivation');
      const concIn = document.getElementById('admin-folder-concepts');
      if (archIn) archIn.value = f.archetype || '';
      if (traumaIn) traumaIn.value = f.traumaCore || '';
      if (reactIn) reactIn.value = f.reaction || '';
      if (motivIn) motivIn.value = f.motivation || '';
      if (concIn) concIn.value = Array.isArray(f.keyConcepts) ? f.keyConcepts.join(', ') : '';
    }
  }

  function applyAdminIntervention(updaterFn, soundFreq = 680) {
    const accounts = getAccountsRegistry();
    const sid = (adminTargetSelect ? adminTargetSelect.value : selectedAdminTargetSid).toUpperCase();
    const idx = accounts.findIndex(a => (a.secretId || '').toUpperCase() === sid);
    if (idx < 0) return;

    const target = accounts[idx];
    updaterFn(target);
    accounts[idx] = normalizeAccount(target);
    saveAccountsRegistry(accounts);
    if ((player.secretId || '').toUpperCase() === sid) {
      player = accounts[idx];
      localStorage.setItem('dive_player_state_v2', JSON.stringify(player));
      syncPlayerUI();
    }
    renderAdminRoster();
    playCyberSound(soundFreq, 'sine', 0.1);
  }

  if (adminTargetSelect) {
    adminTargetSelect.addEventListener('change', () => {
      selectedAdminTargetSid = adminTargetSelect.value;
      syncAdminTargetUI();
      renderAdminRoster();
    });
  }

  const adminMoneyAddBtn = document.getElementById('admin-custom-money-add');
  const adminMoneySubBtn = document.getElementById('admin-custom-money-sub');
  const adminPsychAddBtn = document.getElementById('admin-custom-psych-add');
  const adminPsychSubBtn = document.getElementById('admin-custom-psych-sub');
  const adminHpSetBtn = document.getElementById('admin-custom-hp-set');
  const adminHealBtn = document.getElementById('admin-custom-heal');

  if (adminMoneyAddBtn) {
    adminMoneyAddBtn.addEventListener('click', () => {
      const amt = Math.max(1, parseInt(adminCustomMoneyIn?.value || '0', 10) || 0);
      if (!amt) return;
      applyAdminIntervention((t) => {
        t.wallet = (t.wallet || 0) + amt;
        t.transactions = Array.isArray(t.transactions) ? t.transactions : [];
        t.transactions.unshift({ id: 'tx_' + Date.now(), type: 'in', desc: 'Accredito Regia Master', amount: amt, time: 'Adesso' });
      }, 880);
    });
  }

  if (adminMoneySubBtn) {
    adminMoneySubBtn.addEventListener('click', () => {
      const amt = Math.max(1, parseInt(adminCustomMoneyIn?.value || '0', 10) || 0);
      if (!amt) return;
      applyAdminIntervention((t) => {
        t.wallet = Math.max(0, (t.wallet || 0) - amt);
        t.transactions = Array.isArray(t.transactions) ? t.transactions : [];
        t.transactions.unshift({ id: 'tx_' + Date.now(), type: 'out', desc: 'Addebito Regia Master', amount: amt, time: 'Adesso' });
      }, 420);
    });
  }

  if (adminPsychAddBtn) {
    adminPsychAddBtn.addEventListener('click', () => {
      const val = Math.max(1, parseInt(adminCustomPsychIn?.value || '0', 10) || 0);
      if (!val) return;
      applyAdminIntervention((t) => { t.psych = Math.min(100, (t.psych || 0) + val); }, 300);
    });
  }

  if (adminPsychSubBtn) {
    adminPsychSubBtn.addEventListener('click', () => {
      const val = Math.max(1, parseInt(adminCustomPsychIn?.value || '0', 10) || 0);
      if (!val) return;
      applyAdminIntervention((t) => { t.psych = Math.max(0, (t.psych || 0) - val); }, 600);
    });
  }

  if (adminHpSetBtn) {
    adminHpSetBtn.addEventListener('click', () => {
      const hpVal = Math.min(100, Math.max(0, parseInt(adminCustomHpIn?.value ?? '100', 10) || 0));
      applyAdminIntervention((t) => { t.hp = hpVal; }, 650);
    });
  }

  if (adminHealBtn) {
    adminHealBtn.addEventListener('click', () => {
      applyAdminIntervention((t) => { t.hp = 100; t.traumas = []; }, 780);
    });
  }

  if (adminToggleIce) {
    adminToggleIce.addEventListener('click', () => {
      applyAdminIntervention((t) => { t.iceActive = !t.iceActive; }, 750);
    });
  }

  const adminCoreFolderForm = document.getElementById('admin-core-folder-form');
  if (adminCoreFolderForm) {
    adminCoreFolderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const archetype = document.getElementById('admin-folder-archetype')?.value.trim() || '';
      const traumaCore = document.getElementById('admin-folder-trauma')?.value.trim() || '';
      const reaction = document.getElementById('admin-folder-reaction')?.value.trim() || '';
      const motivation = document.getElementById('admin-folder-motivation')?.value.trim() || '';
      const rawConcepts = document.getElementById('admin-folder-concepts')?.value.trim() || '';
      const keyConcepts = rawConcepts
        ? rawConcepts.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6)
        : [];
      applyAdminIntervention((t) => {
        t.coreFolder = { archetype, traumaCore, reaction, motivation, keyConcepts };
      }, 820);
      if (typeof playCyberFx === 'function') playCyberFx('success');
      alert('Cartella PG salvata e sincronizzata.');
    });
  }

  function renderAdminRoster() {
    syncAdminTargetUI();
    if (!adminRosterTbody) return;
    const roster = getAccountsRegistry();

    adminRosterTbody.innerHTML = roster.map(r => {
      const isSelected = (r.secretId || '').toUpperCase() === selectedAdminTargetSid.toUpperCase();
      return `
      <tr class="hover:bg-white/5 transition-colors ${isSelected ? 'bg-dive-orange/10' : ''}">
        <td class="py-2.5 font-bold text-white whitespace-nowrap">${r.callsign}</td>
        <td class="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">${r.role}</td>
        <td class="py-2.5 text-dive-cyan font-bold whitespace-nowrap">${r.secretId}</td>
        <td class="py-2.5 whitespace-nowrap ${r.hp > 50 ? 'text-dive-green' : 'text-dive-red'}">${r.hp}%</td>
        <td class="py-2.5 whitespace-nowrap ${r.psych > 60 ? 'text-dive-red' : 'text-dive-cyan'}">${r.psych}%</td>
        <td class="py-2.5 text-dive-green whitespace-nowrap">€$ ${(r.wallet || 0).toLocaleString()}</td>
        <td class="py-2.5 font-bold whitespace-nowrap ${r.iceActive ? 'text-dive-green' : 'text-slate-500'}">${r.iceActive ? 'ON' : 'OFF'}</td>
        <td class="py-2.5 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5 font-mono text-[9px]">
            <button type="button" data-admin-act="selectPg" data-sid="${r.secretId}" class="px-2 py-0.5 rounded-sm ${isSelected ? 'bg-dive-orange text-black border border-dive-orange' : 'bg-white/5 border border-white/15 text-slate-300 hover:border-dive-orange hover:text-dive-orange'} font-bold uppercase cursor-pointer">${isSelected ? 'SELEZIONATO' : 'SELEZIONA'}</button>
            <button type="button" data-admin-act="deletePg" data-sid="${r.secretId}" class="px-1.5 py-0.5 rounded-sm bg-black border border-white/15 text-slate-400 hover:text-dive-red hover:border-dive-red/40 font-bold cursor-pointer" title="Elimina PG">×</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  if (adminRosterTbody) {
    adminRosterTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-admin-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-admin-act');
      const sid = (btn.getAttribute('data-sid') || '').toUpperCase();
      if (!sid) return;

      if (act === 'selectPg') {
        selectedAdminTargetSid = sid;
        renderAdminRoster();
        if (adminTargetSelect) adminTargetSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (act === 'deletePg') {
        const accounts = getAccountsRegistry();
        const idx = accounts.findIndex(a => (a.secretId || '').toUpperCase() === sid);
        if (idx < 0) return;
        const target = accounts[idx];
        if ((player.secretId || '').toUpperCase() === sid) {
          alert('Non puoi eliminare il PG attualmente in uso.');
          return;
        }
        if (!confirm(`Eliminare definitivamente ${target.callsign} (${target.secretId}) dal roster?`)) return;
        accounts.splice(idx, 1);
        saveAccountsRegistry(accounts);
        renderAdminRoster();
        playCyberSound(300, 'square', 0.1);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 16. Login, Registration, Account Switcher & Cloud Sync Connector
  // --------------------------------------------------------------------------
  const loginModal = document.getElementById('login-modal');
  const openLoginBtn = document.getElementById('open-login-btn');
  const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
  const loginTabSignin = document.getElementById('login-tab-signin');
  const loginTabRegister = document.getElementById('login-tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginIdentifierInput = document.getElementById('login-identifier');
  const loginPinInput = document.getElementById('login-pin');
  const loginErrorEl = document.getElementById('login-error');
  const registerErrorEl = document.getElementById('register-error');
  const loginSyncModeLabel = document.getElementById('login-sync-mode-label');
  const logoutBtn = document.getElementById('logout-btn');

  function updateSyncStatusLabels() {
    const label = window.DiveSync ? window.DiveSync.getStatusLabel() : 'DEMO LOCALE';
    if (loginSyncModeLabel) loginSyncModeLabel.textContent = `MODALITÀ: ${label}`;
    const adminBadge = document.getElementById('admin-sync-status-badge');
    if (adminBadge) adminBadge.textContent = label;
  }

  function openLoginModal(requireAuth = false) {
    if (!loginModal) return;
    updateSyncStatusLabels();
    if (closeLoginModalBtn) {
      closeLoginModalBtn.classList.toggle('hidden', requireAuth && !getActiveSessionId());
    }
    loginModal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => loginModal.classList.add('opacity-100'), 10);
  }

  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.classList.remove('opacity-100');
    setTimeout(() => loginModal.classList.add('hidden', 'pointer-events-none'), 300);
  }

  function openPlayerContactModal(requireSetup = false) {
    const contactModal = document.getElementById('player-contact-modal');
    if (!contactModal) return;
    const pgLabel = document.getElementById('contact-modal-pg-label');
    const nameIn = document.getElementById('contact-input-name');
    const surnameIn = document.getElementById('contact-input-surname');
    const emailIn = document.getElementById('contact-input-email');
    const phoneIn = document.getElementById('contact-input-phone');
    const closeBtn = document.getElementById('close-contact-modal-btn');
    if (pgLabel) pgLabel.textContent = `${player.callsign} (${player.secretId})`;
    if (nameIn) nameIn.value = player.playerName || '';
    if (surnameIn) surnameIn.value = player.playerSurname || '';
    if (emailIn) emailIn.value = player.email || '';
    if (phoneIn) phoneIn.value = player.playerContact || '';
    if (closeBtn) closeBtn.classList.toggle('hidden', requireSetup);
    contactModal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => contactModal.classList.add('opacity-100'), 10);
  }

  function closePlayerContactModal() {
    const contactModal = document.getElementById('player-contact-modal');
    if (!contactModal) return;
    contactModal.classList.remove('opacity-100');
    setTimeout(() => contactModal.classList.add('hidden', 'pointer-events-none'), 250);
  }

  function activateAccount(account) {
    player = normalizeAccount(account);
    setActiveSessionId(player.secretId);
    activeSheetRunner = null;
    savePlayerState(player);
    renderRamUI();
    renderSocialFeed();
    if (typeof renderGroupsUI === 'function') renderGroupsUI();
    renderChat();
    if (typeof syncAuthMenuUI === 'function') syncAuthMenuUI();
    closeLoginModal();
    if (typeof switchTab === 'function') switchTab('profile');
    if (typeof playCyberFx === 'function') playCyberFx('success');

    const missingContact = Boolean(player.needsContactSetup) ||
      !String(player.playerName || '').trim() ||
      !String(player.playerSurname || '').trim() ||
      !String(player.email || '').trim() ||
      !String(player.playerContact || '').trim();
    if (missingContact) {
      setTimeout(() => openPlayerContactModal(true), 200);
    }
  }

  if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => openLoginModal(false));
  }
  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', closeLoginModal);
  }

  if (loginTabSignin && loginTabRegister && loginForm && registerForm) {
    loginTabSignin.addEventListener('click', () => {
      loginTabSignin.className = 'py-2 rounded-sm bg-dive-orange text-black font-bold uppercase transition-colors';
      loginTabRegister.className = 'py-2 rounded-sm bg-white/5 text-slate-300 border border-white/15 hover:border-dive-purple font-bold uppercase transition-colors';
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });

    loginTabRegister.addEventListener('click', () => {
      loginTabRegister.className = 'py-2 rounded-sm bg-dive-purple text-black font-bold uppercase transition-colors';
      loginTabSignin.className = 'py-2 rounded-sm bg-white/5 text-slate-300 border border-white/15 hover:border-dive-orange font-bold uppercase transition-colors';
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
  }

  async function performLogin(id, pin, errorEl) {
    if (errorEl) errorEl.classList.add('hidden');
    const localAccounts = getAccountsRegistry();
    const res = window.DiveSync
      ? await window.DiveSync.loginAccount(id, pin, localAccounts)
      : { ok: false, error: 'Modulo sync non disponibile' };

    if (!res.ok) {
      if (errorEl) {
        errorEl.textContent = res.error;
        errorEl.classList.remove('hidden');
      }
      if (typeof playCyberFx === 'function') playCyberFx('denied');
      return false;
    }
    if (Array.isArray(res.pool)) saveAccountsRegistry(res.pool);
    activateAccount(res.account);
    return true;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = loginIdentifierInput ? loginIdentifierInput.value : '';
      const pin = loginPinInput ? loginPinInput.value : '';
      await performLogin(id, pin, loginErrorEl);
    });
  }

  const dropdownLoginForm = document.getElementById('dropdown-login-form');
  const dropdownLoginId = document.getElementById('dropdown-login-identifier');
  const dropdownLoginPin = document.getElementById('dropdown-login-pin');
  const dropdownLoginError = document.getElementById('dropdown-login-error');

  if (dropdownLoginForm) {
    dropdownLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = dropdownLoginId ? dropdownLoginId.value : '';
      const pin = dropdownLoginPin ? dropdownLoginPin.value : '';
      const ok = await performLogin(id, pin, dropdownLoginError);
      if (ok) dropdownLoginForm.reset();
    });
  }

  document.querySelectorAll('.quick-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-id');
      const acc = getAccountsRegistry().find(a => a.secretId.toUpperCase() === targetId.toUpperCase());
      if (acc) activateAccount(acc);
    });
  });

  const playerContactForm = document.getElementById('player-contact-form');
  const closeContactModalBtn = document.getElementById('close-contact-modal-btn');
  const editPlayerContactBtn = document.getElementById('edit-player-contact-btn');

  if (closeContactModalBtn) {
    closeContactModalBtn.addEventListener('click', closePlayerContactModal);
  }
  if (editPlayerContactBtn) {
    editPlayerContactBtn.addEventListener('click', () => openPlayerContactModal(false));
  }
  if (playerContactForm) {
    playerContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstName = document.getElementById('contact-input-name')?.value.trim() || '';
      const lastName = document.getElementById('contact-input-surname')?.value.trim() || '';
      const email = document.getElementById('contact-input-email')?.value.trim() || '';
      const phone = document.getElementById('contact-input-phone')?.value.trim() || '';
      if (!firstName || !lastName || !email || !phone) return;

      player.playerName = firstName;
      player.playerSurname = lastName;
      player.email = email;
      player.playerContact = phone;
      player.needsContactSetup = false;
      savePlayerState(player);
      closePlayerContactModal();
      if (typeof playCyberFx === 'function') playCyberFx('success');
    });
  }

  const adminCreatePgForm = document.getElementById('admin-create-pg-form');
  if (adminCreatePgForm) {
    adminCreatePgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawCallsign = document.getElementById('admin-pg-callsign')?.value.trim() || '';
      if (!rawCallsign) return;
      const callsign = rawCallsign.startsWith('@') ? rawCallsign : `@${rawCallsign}`;
      const accounts = getAccountsRegistry();
      if (accounts.some(a => (a.callsign || '').toUpperCase() === callsign.toUpperCase())) {
        alert('Callsign già esistente nel Roster.');
        return;
      }

      const role = document.getElementById('admin-pg-role')?.value || 'MERCENARIO // SOLO';
      const themeColor = document.getElementById('admin-pg-theme')?.value || 'orange';
      const immersion = document.getElementById('admin-pg-immersion')?.value || 'medio';
      const pin = document.getElementById('admin-pg-pin')?.value.trim() || '1234';
      const wallet = Math.max(0, parseInt(document.getElementById('admin-pg-wallet')?.value || '1500', 10) || 0);
      const fama = Math.min(5, Math.max(1, parseInt(document.getElementById('admin-pg-fama')?.value || '3', 10) || 3));
      const ramMax = Math.min(16, Math.max(4, parseInt(document.getElementById('admin-pg-ram')?.value || '8', 10) || 8));
      const faction = document.getElementById('admin-pg-faction')?.value.trim() || 'PORTO FRANCO NAVARRO';
      const iceActive = Boolean(document.getElementById('admin-pg-ice')?.checked);
      const mantra = document.getElementById('admin-pg-mantra')?.value.trim() || '"Ogni scelta a Navarro ha un prezzo."';
      const song = document.getElementById('admin-pg-song')?.value.trim() || 'Nightcall — Kavinsky';
      const thought = document.getElementById('admin-pg-thought')?.value.trim() || '"Scheda precompilata dai Master."';
      const archetype = document.getElementById('admin-pg-archetype')?.value.trim() || 'Neutrale // Flessibile';
      const traumaCore = document.getElementById('admin-pg-trauma')?.value.trim() || 'Passato da chiarire';
      const reaction = document.getElementById('admin-pg-reaction')?.value.trim() || 'Prudenza / Osservazione';
      const motivation = document.getElementById('admin-pg-motivation')?.value.trim() || 'Sopravvivere a Navarro';
      const rawConcepts = document.getElementById('admin-pg-concepts')?.value.trim() || '';
      const keyConcepts = rawConcepts
        ? rawConcepts.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6)
        : ['Indipendente', 'Sopravvivenza', 'Adattamento', 'Contatti', 'Segreti', 'Nuovo inizio'];

      const avatars = [
        'assets/images/avatars/pg-1.jpg',
        'assets/images/avatars/pg-2.jpg',
        'assets/images/avatars/pg-3.jpg',
        'assets/images/avatars/pg-4.jpg',
        'assets/images/avatars/pg-5.jpg',
        'assets/images/avatars/pg-6.jpg',
        'assets/images/avatars/pg-7.jpg',
        'assets/images/avatars/pg-8.jpg'
      ];
      const prefix = callsign.replace('@', '').charAt(0).toUpperCase() || 'X';
      const num = Math.floor(1000 + Math.random() * 9000);
      const secretId = `#${prefix}-${num}`;

      const newAccount = normalizeAccount({
        callsign,
        role,
        secretId,
        pin,
        playerName: '',
        playerSurname: '',
        email: '',
        playerContact: '',
        needsContactSetup: true,
        avatar: avatars[accounts.length % avatars.length],
        themeColor,
        hp: 100,
        psych: 0,
        fama,
        wallet,
        ram: ramMax,
        ramMax,
        iceActive,
        psychProfile: {
          faction,
          immersion,
          mantra,
          song,
          thought,
          keyConcepts,
          archetype,
          traumaCore,
          reaction,
          motivation
        }
      });

      accounts.push(newAccount);
      saveAccountsRegistry(accounts);
      renderAdminRoster();

      const resBox = document.getElementById('admin-create-pg-result');
      if (resBox) {
        resBox.innerHTML = `Scheda creata: <strong>${callsign}</strong> · ID: <strong>${secretId}</strong> · PIN: <strong>${pin}</strong>. Il giocatore compilerà Nome, Cognome, Email e Telefono al primo login.`;
        resBox.classList.remove('hidden');
      }
      adminCreatePgForm.reset();
      if (typeof playCyberFx === 'function') playCyberFx('success');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof performLogout === 'function') {
        performLogout();
      } else {
        setActiveSessionId('');
        if (typeof syncAuthMenuUI === 'function') syncAuthMenuUI();
        switchTab('home');
      }
      if (profileEditModal) {
        profileEditModal.classList.remove('opacity-100');
        setTimeout(() => profileEditModal.classList.add('hidden', 'pointer-events-none'), 200);
      }
    });
  }

  // Admin Cloud Sync Config
  const adminSyncForm = document.getElementById('admin-sync-form');
  const adminSyncMode = document.getElementById('admin-sync-mode');
  const adminSyncEndpoint = document.getElementById('admin-sync-endpoint');
  const adminSyncKey = document.getElementById('admin-sync-key');

  if (window.DiveSync && adminSyncMode && adminSyncEndpoint && adminSyncKey) {
    const cfg = window.DiveSync.getConfig();
    adminSyncMode.value = cfg.mode || 'local';
    adminSyncEndpoint.value = cfg.endpoint || '';
    adminSyncKey.value = cfg.apiKey || '';
    updateSyncStatusLabels();
  }

  if (adminSyncForm && window.DiveSync) {
    adminSyncForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nextCfg = window.DiveSync.setConfig({
        mode: adminSyncMode.value,
        endpoint: adminSyncEndpoint.value.trim(),
        apiKey: adminSyncKey.value.trim()
      });
      updateSyncStatusLabels();
      if (nextCfg.mode !== 'local' && nextCfg.endpoint) {
        try {
          const updatedAt = Date.now();
          lastCloudSyncedAt = updatedAt;
          await window.DiveSync.pushSharedState({
            accounts: getAccountsRegistry(),
            posts: typeof getSocialPosts === 'function' ? getSocialPosts() : [],
            groups: typeof getChatGroups === 'function' ? getChatGroups() : [],
            broadcast: getBroadcastState(),
            updatedAt
          });
          if (typeof playCyberFx === 'function') playCyberFx('success');
          alert('Cloud Sync attivo e sincronizzato!');
        } catch (err) {
          alert('Connettore salvato, ma test sync fallito: ' + err.message);
        }
      } else {
        if (typeof playCyberFx === 'function') playCyberFx('ui');
      }
    });
  }

  const adminForcePullBtn = document.getElementById('admin-force-pull-btn');
  if (adminForcePullBtn) {
    adminForcePullBtn.addEventListener('click', async () => {
      if (!window.DiveSync || window.DiveSync.getConfig().mode === 'local') {
        alert('Configura prima una modalità Cloud (Cloudflare o Supabase).');
        return;
      }
      lastCloudSyncedAt = 0;
      const ok = await pullFromCloud();
      if (typeof playCyberFx === 'function') playCyberFx(ok ? 'success' : 'ui');
      alert(ok ? 'Stato aggiornato dal Cloud.' : 'Nessun aggiornamento più recente nel Cloud.');
    });
  }

  const adminCopySyncLinkBtn = document.getElementById('admin-copy-sync-link-btn');
  if (adminCopySyncLinkBtn && window.DiveSync) {
    adminCopySyncLinkBtn.addEventListener('click', async () => {
      const shareUrl = window.DiveSync.buildShareableSyncUrl();
      if (!shareUrl) {
        alert('Salva prima un Endpoint Cloud (Cloudflare o Supabase) con SALVA SYNC.');
        return;
      }
      try {
        await navigator.clipboard.writeText(shareUrl);
        const orig = adminCopySyncLinkBtn.textContent;
        adminCopySyncLinkBtn.textContent = 'LINK COPIATO!';
        setTimeout(() => { adminCopySyncLinkBtn.textContent = orig; }, 1600);
      } catch {
        prompt('Copia link auto-configurazione per i giocatori:', shareUrl);
      }
    });
  }

  // Initial broadcast & Cloud Sync polling (every 5s when configured)
  applyBroadcastUI(getBroadcastState());
  if (window.DiveSync && window.DiveSync.getConfig().mode !== 'local') {
    pullFromCloud();
    setInterval(() => { pullFromCloud(); }, 5000);
  }

  // Sheet QR copy & return buttons
  const copySheetLinkBtn = document.getElementById('copy-sheet-link-btn');
  if (copySheetLinkBtn) {
    copySheetLinkBtn.addEventListener('click', async () => {
      const target = activeSheetRunner || player;
      const url = getSheetUrl(target.secretId || '#V-7842');
      try {
        await navigator.clipboard.writeText(url);
        const orig = copySheetLinkBtn.textContent;
        copySheetLinkBtn.textContent = 'LINK COPIATO!';
        setTimeout(() => { copySheetLinkBtn.textContent = orig; }, 1600);
      } catch {
        prompt('Copia link diretto scheda PG:', url);
      }
    });
  }

  const backToMySheetBtn = document.getElementById('back-to-my-sheet-btn');
  if (backToMySheetBtn) {
    backToMySheetBtn.addEventListener('click', () => {
      activeSheetRunner = null;
      syncPlayerUI();
      playCyberSound(550, 'sine', 0.08);
    });
  }

  // Deep-link via QR (?pg=V-7842)
  const initialPg = new URLSearchParams(window.location.search).get('pg');
  if (initialPg) {
    activeSheetRunner = findRunnerByPgParam(initialPg);
    if (activeSheetRunner && typeof isPlayerLoggedIn === 'function' ? isPlayerLoggedIn() : Boolean(localStorage.getItem('dive_session_v1'))) {
      addScannedContact(activeSheetRunner);
    }
  }

  // Eventi sub-tabs (Iscriviti, Guida/Manuale, Setting, Personaggi)
  const eventSubtabBtns = document.querySelectorAll('.event-subtab-btn');
  const eventSubtabPanels = document.querySelectorAll('.event-subtab-panel');
  eventSubtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = `event-sub-${btn.getAttribute('data-subtab')}`;
      eventSubtabPanels.forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== targetId);
      });
      eventSubtabBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('bg-dive-orange', active);
        b.classList.toggle('text-black', active);
        b.classList.toggle('font-bold', active);
        b.classList.toggle('bg-white/5', !active);
        b.classList.toggle('text-slate-300', !active);
        b.classList.toggle('border', !active);
        b.classList.toggle('border-white/15', !active);
        b.classList.toggle('hover:text-white', !active);
      });
      playCyberSound(520, 'triangle', 0.04);
    });
  });

  // Event registration form
  const eventRegisterForm = document.getElementById('event-register-form');
  const eventRegisterMsg = document.getElementById('event-register-msg');
  if (eventRegisterForm && eventRegisterMsg) {
    eventRegisterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      eventRegisterMsg.classList.remove('hidden');
      eventRegisterForm.reset();
      playCyberSound(680, 'sine', 0.08);
    });
  }

  // Login Menu Dropdown (Guest vs Authenticated In-Game Sections)
  const loginMenuWrapper = document.getElementById('login-menu-wrapper');
  const loginMenuToggle = document.getElementById('login-menu-toggle');
  const loginMenuToggleLabel = document.getElementById('login-menu-toggle-label');
  const loginMenuDropdown = document.getElementById('login-menu-dropdown');
  const loginMenuChevron = document.getElementById('login-menu-chevron');
  const loginMenuGuest = document.getElementById('login-menu-guest');
  const loginMenuAuthenticated = document.getElementById('login-menu-authenticated');
  const openLoginGuestBtn = document.getElementById('open-login-guest-btn');
  const headerLogoutBtn = document.getElementById('header-logout-btn');
  const headerQuickLogoutBtn = document.getElementById('header-quick-logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const ingameOsLabel = document.getElementById('ingame-os-label');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const PG_THEMES = {
    orange: { label: 'OS // SOLO OPS', metaBg: '#080503' },
    cyan: { label: 'OS // NETRUNNER ICE', metaBg: '#03080E' },
    green: { label: 'OS // BIO-TERMINAL', metaBg: '#030906' },
    red: { label: 'OS // BLACKWALL', metaBg: '#0A0305' },
    purple: { label: 'OS // SYNTHWAVE', metaBg: '#07040C' }
  };

  let matrixRainTimer = null;
  let matrixRainColor = '#10B981';

  function startMatrixRain(colorHex) {
    matrixRainColor = colorHex || '#10B981';
    const canvas = document.getElementById('matrix-rain-canvas');
    if (!canvas || matrixRainTimer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '0123456789ABCDEF$#@*アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    let drops = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.max(1, Math.floor(canvas.width / fontSize));
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -30));
    };
    resize();
    window.addEventListener('resize', resize);
    canvas._matrixResize = resize;

    matrixRainTimer = setInterval(() => {
      ctx.fillStyle = 'rgba(2, 6, 4, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = matrixRainColor;
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 55);
  }

  function stopMatrixRain() {
    if (matrixRainTimer) {
      clearInterval(matrixRainTimer);
      matrixRainTimer = null;
    }
    const canvas = document.getElementById('matrix-rain-canvas');
    if (canvas && canvas._matrixResize) {
      window.removeEventListener('resize', canvas._matrixResize);
      delete canvas._matrixResize;
    }
  }

  function applyInGameTheme(isAuthenticated, runner) {
    const matrixPalette = {
      orange: '#00E5FF',
      cyan: '#00E5FF',
      green: '#10B981',
      red: '#FF2A6D',
      purple: '#A855F7'
    };
    if (isAuthenticated) {
      const rawTheme = (runner && runner.themeColor) ? String(runner.themeColor).toLowerCase() : 'orange';
      const themeKey = PG_THEMES[rawTheme] ? rawTheme : 'orange';
      const themeCfg = PG_THEMES[themeKey];
      document.body.classList.add('ingame-mode');
      document.body.setAttribute('data-pg-theme', themeKey);
      if (ingameOsLabel) {
        const callsign = runner && runner.callsign ? runner.callsign : '';
        ingameOsLabel.textContent = callsign ? `${callsign} • ${themeCfg.label}` : themeCfg.label;
      }
      if (themeColorMeta) themeColorMeta.setAttribute('content', themeCfg.metaBg);
      startMatrixRain(matrixPalette[themeKey] || '#10B981');
    } else {
      document.body.classList.remove('ingame-mode');
      document.body.removeAttribute('data-pg-theme');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#04060A');
      stopMatrixRain();
    }
  }

  function performLogout() {
    setActiveSessionId('');
    activeSheetRunner = null;
    syncAuthMenuUI();
    switchTab('home');
    playCyberFx('logout');
  }

  function syncAuthMenuUI() {
    const isAuthenticated = Boolean(getActiveSessionId());
    const loginMenuPgIcon = document.getElementById('login-menu-pg-icon');
    if (loginMenuToggleLabel) {
      loginMenuToggleLabel.textContent = isAuthenticated ? player.callsign : 'LOGIN';
      loginMenuToggleLabel.classList.toggle('hidden', isAuthenticated);
    }
    if (loginMenuPgIcon) {
      loginMenuPgIcon.classList.toggle('hidden', !isAuthenticated);
    }
    if (loginMenuToggle) {
      loginMenuToggle.setAttribute('aria-haspopup', isAuthenticated ? 'false' : 'true');
      loginMenuToggle.setAttribute('title', isAuthenticated ? `${player.callsign} — Vai alla Scheda PG` : 'Accedi al terminale');
      loginMenuToggle.setAttribute('aria-label', isAuthenticated ? `${player.callsign} — Vai alla Scheda PG` : 'Accedi al terminale');
      loginMenuToggle.classList.toggle('w-8', isAuthenticated);
      loginMenuToggle.classList.toggle('h-8', isAuthenticated);
      loginMenuToggle.classList.toggle('px-3.5', !isAuthenticated);
      loginMenuToggle.classList.toggle('py-1.5', !isAuthenticated);
    }
    if (loginMenuChevron) {
      loginMenuChevron.classList.toggle('hidden', isAuthenticated);
    }
    if (loginMenuGuest) {
      loginMenuGuest.classList.toggle('hidden', isAuthenticated);
    }
    if (loginMenuAuthenticated) {
      loginMenuAuthenticated.classList.toggle('hidden', !isAuthenticated);
    }
    if (isAuthenticated) {
      setLoginMenuOpen(false);
    }
    if (headerQuickLogoutBtn) {
      headerQuickLogoutBtn.classList.toggle('hidden', !isAuthenticated);
    }
    applyInGameTheme(isAuthenticated, player);
  }

  function setLoginMenuOpen(isOpen) {
    if (!loginMenuDropdown || !loginMenuToggle) return;
    loginMenuDropdown.classList.toggle('hidden', !isOpen);
    loginMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (loginMenuChevron) {
      loginMenuChevron.classList.toggle('rotate-180', isOpen);
    }
  }

  if (loginMenuToggle && loginMenuDropdown) {
    loginMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (getActiveSessionId()) {
        setLoginMenuOpen(false);
        switchTab('profile');
        return;
      }
      syncAuthMenuUI();
      const willOpen = loginMenuDropdown.classList.contains('hidden');
      setLoginMenuOpen(willOpen);
      playCyberSound(500, 'triangle', 0.04);
    });

    loginMenuDropdown.querySelectorAll('.login-menu-close-on-click').forEach(item => {
      item.addEventListener('click', () => setLoginMenuOpen(false));
    });

    document.addEventListener('click', (e) => {
      if (loginMenuWrapper && !loginMenuWrapper.contains(e.target)) {
        setLoginMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setLoginMenuOpen(false);
    });
  }

  if (openLoginGuestBtn) {
    openLoginGuestBtn.addEventListener('click', () => {
      if (typeof openLoginModal === 'function') openLoginModal(false);
    });
  }

  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', performLogout);
  }
  if (headerQuickLogoutBtn) {
    headerQuickLogoutBtn.addEventListener('click', performLogout);
  }
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', performLogout);
  }

  syncAuthMenuUI();

  // Auto-check ultima versione su VERSION + verifica CDN index.html (evita cache obsolete del browser)
  async function checkRemoteVersionAndAutoUpdate() {
    try {
      const badgeEl = document.getElementById('app-version-badge');
      const currentVersion = badgeEl ? badgeEl.textContent.trim() : '';
      if (!currentVersion) return;

      const res = await fetch(`VERSION?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const remoteVersion = (await res.text()).trim();
      if (!/^v\d+\.\d+\.\d+$/.test(remoteVersion)) return;

      if (remoteVersion !== currentVersion) {
        const guardKey = `dive_reloaded_${remoteVersion}`;
        if (sessionStorage.getItem(guardKey)) return;

        // Verifica che index.html sul CDN abbia già la nuova versione prima di ricaricare
        const htmlRes = await fetch(`index.html?_=${Date.now()}`, { cache: 'no-store' });
        if (!htmlRes.ok) return;
        const htmlText = await htmlRes.text();
        if (!htmlText.includes(remoteVersion)) return;

        sessionStorage.setItem(guardKey, '1');
        const url = new URL(window.location.href);
        url.searchParams.set('v', remoteVersion.replace(/^v/, ''));
        url.searchParams.set('_', String(Date.now()));
        window.location.replace(url.toString());
      }
    } catch {
      // ignore offline/local file errors
    }
  }

  checkRemoteVersionAndAutoUpdate();
  setInterval(checkRemoteVersionAndAutoUpdate, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkRemoteVersionAndAutoUpdate();
  });

  // --------------------------------------------------------------------------
  // 16. Role Specialist Consoles (Ripperdoc, Fixer, Netrunner, Chimico)
  // --------------------------------------------------------------------------
  const secRoleConsole = document.getElementById('sec-role-console');
  const roleConsoleEyebrow = document.getElementById('role-console-eyebrow');
  const roleConsoleTitle = document.getElementById('role-console-title');
  const roleConsoleBadge = document.getElementById('role-console-badge');
  const rolePanelRipperdoc = document.getElementById('role-panel-ripperdoc');
  const rolePanelFixer = document.getElementById('role-panel-fixer');
  const rolePanelNetrunner = document.getElementById('role-panel-netrunner');
  const rolePanelChimico = document.getElementById('role-panel-chimico');

  function getRoleKind(roleStr) {
    const r = String(roleStr || '').toUpperCase();
    if (r.includes('RIPPERDOC')) return 'ripperdoc';
    if (r.includes('FIXER')) return 'fixer';
    if (r.includes('NETRUNNER') || r.includes('HACKER')) return 'netrunner';
    if (r.includes('CHIMICO') || r.includes('BIOTECH')) return 'chimico';
    return null;
  }

  // --- A. RIPPERDOC: Pazienti & Interventi ---
  const ripperPatientsList = document.getElementById('ripper-patients-list');
  const ripperSelectedName = document.getElementById('ripper-selected-name');
  const ripperSelectedId = document.getElementById('ripper-selected-id');
  const ripperPatientHp = document.getElementById('ripper-patient-hp');
  const ripperPatientPsych = document.getElementById('ripper-patient-psych');
  const ripperPatientTraumas = document.getElementById('ripper-patient-traumas');
  const ripperPatientIce = document.getElementById('ripper-patient-ice');
  const ripperLogEl = document.getElementById('ripper-log');
  let selectedPatientId = '#R-9921';

  function appendRipperLog(msg) {
    if (!ripperLogEl) return;
    const row = document.createElement('div');
    row.textContent = `> ${msg}`;
    ripperLogEl.prepend(row);
  }

  function renderRipperdocConsole() {
    if (!ripperPatientsList) return;
    const accounts = getAccountsRegistry();
    if (!accounts.some(a => a.secretId === selectedPatientId) && accounts[0]) {
      selectedPatientId = accounts[0].secretId;
    }

    ripperPatientsList.innerHTML = accounts.map(acc => {
      const isSelected = acc.secretId === selectedPatientId;
      const needsCare = acc.hp < 100 || (acc.psych || 0) >= 35 || (acc.traumas && acc.traumas.length > 0);
      return `
        <button type="button" data-patient-id="${acc.secretId}" class="w-full text-left p-2 rounded-sm border transition-colors ${isSelected ? 'bg-dive-red/15 border-dive-red text-white' : 'bg-[#04060A] border-white/10 text-slate-300 hover:border-white/30'}">
          <div class="flex items-center justify-between font-mono text-[10px]">
            <span class="font-bold">${escapeChatText(acc.callsign)}</span>
            <span class="${acc.hp < 70 ? 'text-dive-red font-bold' : 'text-dive-green'}">${acc.hp}% HP</span>
          </div>
          <div class="flex items-center justify-between font-mono text-[9px] text-slate-400 mt-0.5">
            <span>PSICOSI ${acc.psych || 0}%</span>
            ${needsCare ? '<span class="text-dive-orange font-bold">RICHIEDE CURE</span>' : '<span class="text-slate-500">STABILE</span>'}
          </div>
        </button>
      `;
    }).join('');

    const target = accounts.find(a => a.secretId === selectedPatientId);
    if (target) {
      if (ripperSelectedName) ripperSelectedName.textContent = target.callsign;
      if (ripperSelectedId) ripperSelectedId.textContent = target.secretId;
      if (ripperPatientHp) ripperPatientHp.textContent = `${target.hp}%`;
      if (ripperPatientPsych) ripperPatientPsych.textContent = `${target.psych || 0}%`;
      if (ripperPatientTraumas) ripperPatientTraumas.textContent = (target.traumas && target.traumas.length) ? target.traumas.map(t => t.name).join(', ') : 'Nessuno';
      if (ripperPatientIce) ripperPatientIce.textContent = target.iceActive ? 'ATTIVO' : 'DISATTIVATO';
    }
  }

  if (ripperPatientsList) {
    ripperPatientsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-patient-id]');
      if (!btn) return;
      selectedPatientId = btn.getAttribute('data-patient-id');
      renderRipperdocConsole();
      playCyberFx('ui');
    });
  }

  function applyRipperAction(mutator, logMsg) {
    const accounts = getAccountsRegistry();
    const idx = accounts.findIndex(a => a.secretId === selectedPatientId);
    if (idx < 0) return;
    mutator(accounts[idx]);
    saveAccountsRegistry(accounts);
    if (accounts[idx].secretId === player.secretId) {
      player = normalizeAccount(accounts[idx]);
      savePlayerState(player);
    } else {
      renderRipperdocConsole();
    }
    appendRipperLog(`${accounts[idx].callsign}: ${logMsg}`);
    playCyberFx('success');
  }

  document.getElementById('ripper-heal-btn')?.addEventListener('click', () => {
    applyRipperAction(p => { p.hp = Math.min(100, (p.hp || 0) + 35); }, '+35% HP Sintesi Tissutale');
  });
  document.getElementById('ripper-trauma-btn')?.addEventListener('click', () => {
    applyRipperAction(p => { if (Array.isArray(p.traumas) && p.traumas.length) p.traumas.shift(); }, 'Trauma rimosso chirurgicamente');
  });
  document.getElementById('ripper-immuno-btn')?.addEventListener('click', () => {
    applyRipperAction(p => { p.psych = Math.max(0, (p.psych || 0) - 20); }, '-20% Cyberpsicosi (Immunosoppressore)');
  });
  document.getElementById('ripper-ice-btn')?.addEventListener('click', () => {
    applyRipperAction(p => { p.iceActive = true; }, 'Patch ICE neurale riattivata');
  });

  // --- B. FIXER: Annunci/Quest & Chat Risposte PG ---
  const FIXER_QUESTS_KEY = 'dive_fixer_quests_v1';
  const DEFAULT_FIXER_QUESTS = [
    {
      id: 'q_datashard_blu',
      title: 'Estrazione Datashard Terminale Blu',
      reward: 400,
      brief: 'Recupera il datashard criptato dal terminale blu al piano inferiore.',
      status: 'APERTO',
      assignedTo: '',
      responses: [
        {
          id: 'resp_1',
          runnerCallsign: '@V_Solo',
          status: 'CANDIDATO',
          messages: [
            { author: '@V_Solo', text: 'Sono già vicino alle scale del piano inferiore. Posso fare l\'estrazione ora per 400 €$.', time: '19:04' },
            { author: '@The_Fixer', text: 'Ricevuto @V_Solo. Occhio alle guardie vicino al terminale blu, fammi sapere appena hai il shard.', time: '19:06' }
          ]
        },
        {
          id: 'resp_2',
          runnerCallsign: '@Kuro_04',
          status: 'CANDIDATO',
          messages: [
            { author: '@Kuro_04', text: 'Se c\'è un ICE sul terminale blu posso bucarlo da remoto mentre qualcuno copre.', time: '19:08' }
          ]
        }
      ]
    },
    {
      id: 'q_scorta_vip',
      title: 'Scorta Discreta Zona Bar',
      reward: 650,
      brief: 'Proteggi il corriere durante lo scambio codici all\'angolo bar per 20 minuti.',
      status: 'APERTO',
      assignedTo: '',
      responses: [
        {
          id: 'resp_3',
          runnerCallsign: '@Runner_Insolito',
          status: 'CANDIDATO',
          messages: [
            { author: '@Runner_Insolito', text: 'Disponibile per copertura armata, ma mi serve uno stimpack prima.', time: '19:16' }
          ]
        }
      ]
    }
  ];

  function getFixerQuests() {
    try {
      const raw = localStorage.getItem(FIXER_QUESTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* fallback */ }
    localStorage.setItem(FIXER_QUESTS_KEY, JSON.stringify(DEFAULT_FIXER_QUESTS));
    return JSON.parse(JSON.stringify(DEFAULT_FIXER_QUESTS));
  }

  function saveFixerQuests(quests) {
    localStorage.setItem(FIXER_QUESTS_KEY, JSON.stringify(quests));
  }

  function recordPlayerReplyToFixerQuest(runnerCallsign, text, timeStr) {
    const quests = getFixerQuests();
    if (!quests[0]) return;
    let resp = quests[0].responses.find(r => r.runnerCallsign.toUpperCase() === runnerCallsign.toUpperCase());
    if (!resp) {
      resp = { id: 'resp_' + Date.now(), runnerCallsign, status: 'CANDIDATO', messages: [] };
      quests[0].responses.unshift(resp);
    }
    resp.messages.push({ author: runnerCallsign, text, time: timeStr });
    saveFixerQuests(quests);
  }

  const fixerQuestsList = document.getElementById('fixer-quests-list');
  const fixerChatTargetLabel = document.getElementById('fixer-chat-target-label');
  const fixerQuestChatMessages = document.getElementById('fixer-quest-chat-messages');
  const fixerAssignBtn = document.getElementById('fixer-assign-btn');
  const fixerPayBtn = document.getElementById('fixer-pay-btn');
  let selectedFixerQuestId = 'q_datashard_blu';
  let selectedFixerRespId = 'resp_1';

  function renderFixerConsole() {
    if (!fixerQuestsList) return;
    const quests = getFixerQuests();
    if (!quests.some(q => q.id === selectedFixerQuestId) && quests[0]) {
      selectedFixerQuestId = quests[0].id;
    }
    const activeQuest = quests.find(q => q.id === selectedFixerQuestId);
    if (activeQuest && !activeQuest.responses.some(r => r.id === selectedFixerRespId)) {
      selectedFixerRespId = activeQuest.responses[0] ? activeQuest.responses[0].id : '';
    }

    fixerQuestsList.innerHTML = quests.map(q => {
      const respButtons = (q.responses || []).map(r => {
        const isSel = q.id === selectedFixerQuestId && r.id === selectedFixerRespId;
        const lastMsg = r.messages[r.messages.length - 1];
        return `
          <button type="button" data-quest-id="${q.id}" data-resp-id="${r.id}" class="w-full text-left px-2 py-1.5 rounded-sm border font-mono text-[10px] transition-colors ${isSel ? 'bg-dive-cyan/15 border-dive-cyan text-white' : 'bg-black/60 border-white/10 text-slate-300 hover:border-white/30'}">
            <div class="flex items-center justify-between">
              <span class="font-bold text-dive-cyan">${escapeChatText(r.runnerCallsign)}</span>
              <span class="text-[9px] text-slate-400">${r.messages.length} msg</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate">${escapeChatText(lastMsg ? lastMsg.text : '')}</div>
          </button>
        `;
      }).join('');

      return `
        <div class="p-2.5 rounded-sm bg-[#04060A] border ${q.id === selectedFixerQuestId ? 'border-dive-orange/60' : 'border-white/10'} space-y-2">
          <div class="flex items-center justify-between gap-2 font-mono text-[10px]">
            <span class="font-bold text-white truncate">${escapeChatText(q.title)}</span>
            <span class="px-1.5 py-0.5 bg-dive-green/15 border border-dive-green/40 text-dive-green font-bold whitespace-nowrap">€$ ${q.reward}</span>
          </div>
          <div class="flex items-center justify-between font-mono text-[9px] text-slate-400">
            <span>STATO: <strong class="text-dive-orange">${escapeChatText(q.status)}</strong>${q.assignedTo ? ` (${escapeChatText(q.assignedTo)})` : ''}</span>
            <span>${(q.responses || []).length} risposte PG</span>
          </div>
          <div class="space-y-1">${respButtons || '<div class="text-[10px] text-slate-500 italic">Nessuna risposta ancora.</div>'}</div>
        </div>
      `;
    }).join('');

    const activeResp = activeQuest && activeQuest.responses.find(r => r.id === selectedFixerRespId);
    if (activeQuest && activeResp) {
      if (fixerChatTargetLabel) fixerChatTargetLabel.textContent = `${activeResp.runnerCallsign} — ${activeQuest.title}`;
      if (fixerAssignBtn) fixerAssignBtn.classList.remove('hidden');
      if (fixerPayBtn) fixerPayBtn.classList.remove('hidden');
      if (fixerQuestChatMessages) {
        fixerQuestChatMessages.innerHTML = activeResp.messages.map(m => {
          const isFixer = m.author === player.callsign || m.author === '@The_Fixer';
          return `
            <div class="flex flex-col ${isFixer ? 'items-end' : 'items-start'}">
              <span class="font-mono text-[9px] text-slate-500">${escapeChatText(m.author)} • ${escapeChatText(m.time)}</span>
              <div class="px-2.5 py-1.5 rounded-sm max-w-[90%] text-[11px] ${isFixer ? 'bg-dive-orange/15 border border-dive-orange/40 text-white' : 'bg-black border border-white/10 text-slate-200'}">
                ${escapeChatText(m.text)}
              </div>
            </div>
          `;
        }).join('');
        fixerQuestChatMessages.scrollTop = fixerQuestChatMessages.scrollHeight;
      }
    } else {
      if (fixerChatTargetLabel) fixerChatTargetLabel.textContent = 'Seleziona una risposta PG';
      if (fixerAssignBtn) fixerAssignBtn.classList.add('hidden');
      if (fixerPayBtn) fixerPayBtn.classList.add('hidden');
    }
  }

  fixerQuestsList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-resp-id]');
    if (!btn) return;
    selectedFixerQuestId = btn.getAttribute('data-quest-id');
    selectedFixerRespId = btn.getAttribute('data-resp-id');
    renderFixerConsole();
    playCyberFx('ui');
  });

  document.getElementById('fixer-new-quest-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('fixer-quest-title')?.value.trim();
    const reward = Number(document.getElementById('fixer-quest-reward')?.value || 400);
    const brief = document.getElementById('fixer-quest-brief')?.value.trim();
    if (!title || !brief) return;
    const quests = getFixerQuests();
    const newQ = {
      id: 'q_' + Date.now(),
      title,
      reward,
      brief,
      status: 'APERTO',
      assignedTo: '',
      responses: [
        {
          id: 'resp_' + Date.now(),
          runnerCallsign: '@V_Solo',
          status: 'IN ASCOLTO',
          messages: [{ author: 'SISTEMA', text: `Annuncio pubblicato su #CONTRATTI FIXER: "${title}" (€$ ${reward}).`, time: 'Adesso' }]
        }
      ]
    };
    quests.unshift(newQ);
    saveFixerQuests(quests);
    selectedFixerQuestId = newQ.id;
    selectedFixerRespId = newQ.responses[0].id;
    if (!player.chatMessages.fixer) player.chatMessages.fixer = [];
    player.chatMessages.fixer.push({ author: player.callsign, text: `[TAGLIA €\$ ${reward}] ${title} — ${brief}`, time: 'Adesso' });
    savePlayerState(player);
    renderChat();
    e.target.reset();
    renderFixerConsole();
    playCyberFx('success');
  });

  document.getElementById('fixer-quest-reply-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('fixer-quest-reply-input');
    const text = input?.value.trim();
    if (!text) return;
    const quests = getFixerQuests();
    const q = quests.find(x => x.id === selectedFixerQuestId);
    const r = q?.responses.find(x => x.id === selectedFixerRespId);
    if (!r) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    r.messages.push({ author: player.callsign, text, time: timeStr });
    saveFixerQuests(quests);
    if (!player.chatMessages.direct) player.chatMessages.direct = [];
    player.chatMessages.direct.push({ author: `${player.callsign} -> ${r.runnerCallsign}`, text: `[${q.title}] ${text}`, time: timeStr });
    savePlayerState(player);
    if (input) input.value = '';
    renderFixerConsole();
    renderChat();
    playCyberFx('ui');
  });

  fixerAssignBtn?.addEventListener('click', () => {
    const quests = getFixerQuests();
    const q = quests.find(x => x.id === selectedFixerQuestId);
    const r = q?.responses.find(x => x.id === selectedFixerRespId);
    if (!q || !r) return;
    q.status = 'ASSEGNATO';
    q.assignedTo = r.runnerCallsign;
    r.messages.push({ author: player.callsign, text: `[CONTRATTO ASSEGNATO] ${r.runnerCallsign} ha l'incarico ufficiale.`, time: 'Adesso' });
    saveFixerQuests(quests);
    renderFixerConsole();
    playCyberFx('success');
  });

  fixerPayBtn?.addEventListener('click', () => {
    const quests = getFixerQuests();
    const q = quests.find(x => x.id === selectedFixerQuestId);
    const r = q?.responses.find(x => x.id === selectedFixerRespId);
    if (!q || !r) return;
    if (player.wallet < q.reward) {
      playCyberFx('denied');
      alert('Crediti €$ insufficienti per pagare la ricompensa.');
      return;
    }
    const accounts = getAccountsRegistry();
    const runnerAcc = accounts.find(a => a.callsign.toUpperCase() === r.runnerCallsign.toUpperCase());
    if (runnerAcc) {
      runnerAcc.wallet += q.reward;
      runnerAcc.transactions.unshift({ id: 'tx_q_' + Date.now(), type: 'in', desc: `Taglia Fixer: ${q.title}`, amount: q.reward, time: 'Adesso' });
      saveAccountsRegistry(accounts);
    }
    player.wallet -= q.reward;
    player.transactions.unshift({ id: 'tx_qp_' + Date.now(), type: 'out', desc: `Pagamento quest ${r.runnerCallsign}`, amount: q.reward, time: 'Adesso' });
    q.status = 'PAGATO';
    r.messages.push({ author: 'SISTEMA', text: `Pagati €$ ${q.reward} a ${r.runnerCallsign}.`, time: 'Adesso' });
    saveFixerQuests(quests);
    savePlayerState(player);
    renderFixerConsole();
    playCyberFx('success');
  });

  // --- C. NETRUNNER: Nodi Rete, ICE & Sniffer ---
  const NETRUNNER_NODES_KEY = 'dive_netrunner_nodes_v1';
  const DEFAULT_NETRUNNER_NODES = [
    { id: 'TERM-BLUE-44', label: 'Terminale Blu Piano Inf.', iceLevel: 'ICE LV.2', status: 'PROTETTO', payload: 'CODICE BERSAGLIO: #V-7842 // SHARD KEY 44B' },
    { id: 'NODE-MILITECH-07', label: 'Relay Militech Settore 04', iceLevel: 'ICE LV.3', status: 'PROTETTO', payload: 'PASS FREQUENZA PRIVATA: GRP-409' },
    { id: 'ICE-ARASAKA-CORE', label: 'Archivio Medico Arasaka', iceLevel: 'BLACK ICE', status: 'PROTETTO', payload: 'FORMULA BASE IMMUNO-NEURALE v2.4' },
    { id: 'BLACKWALL-RELAY', label: 'Nodo Fantasma GhostNet', iceLevel: 'ICE LV.1', status: 'BRECCIATO', payload: 'CANALE LIBERO: ACCESSO DATALEAK ATTIVO' }
  ];

  function getNetrunnerNodes() {
    try {
      const raw = localStorage.getItem(NETRUNNER_NODES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* fallback */ }
    localStorage.setItem(NETRUNNER_NODES_KEY, JSON.stringify(DEFAULT_NETRUNNER_NODES));
    return JSON.parse(JSON.stringify(DEFAULT_NETRUNNER_NODES));
  }

  function saveNetrunnerNodes(nodes) {
    localStorage.setItem(NETRUNNER_NODES_KEY, JSON.stringify(nodes));
  }

  const netrunnerNodesGrid = document.getElementById('netrunner-nodes-grid');
  const netrunnerSnifferLog = document.getElementById('netrunner-sniffer-log');

  function appendNetrunnerLog(msg) {
    if (!netrunnerSnifferLog) return;
    const div = document.createElement('div');
    div.textContent = `> ${msg}`;
    netrunnerSnifferLog.prepend(div);
  }

  function renderNetrunnerConsole() {
    if (!netrunnerNodesGrid) return;
    const nodes = getNetrunnerNodes();
    netrunnerNodesGrid.innerHTML = nodes.map(n => {
      const breached = n.status === 'BRECCIATO';
      return `
        <div class="p-3 rounded-sm bg-[#04060A] border ${breached ? 'border-dive-green/50' : 'border-dive-cyan/35'} space-y-2 font-mono">
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-white font-bold">${escapeChatText(n.id)}</span>
            <span class="px-1.5 py-0.5 rounded-sm ${breached ? 'bg-dive-green/15 text-dive-green border border-dive-green/40' : 'bg-dive-red/15 text-dive-red border border-dive-red/40'} text-[9px] font-bold">${escapeChatText(n.status)}</span>
          </div>
          <div class="text-[11px] text-slate-300 font-sans">${escapeChatText(n.label)} <span class="font-mono text-[9px] text-dive-orange">(${escapeChatText(n.iceLevel)})</span></div>
          <div class="p-1.5 rounded-sm bg-black/70 border border-white/10 text-[9px] ${breached ? 'text-dive-green' : 'text-slate-500'}">
            ${breached ? escapeChatText(n.payload) : '[ENCRYPTED // RICHIEDE BREACH ICE]'}
          </div>
          <div class="flex gap-1.5 text-[9px]">
            <button type="button" data-node-ping="${n.id}" class="px-2 py-1 rounded-sm bg-white/5 border border-white/15 text-slate-200 hover:bg-white hover:text-black font-bold uppercase">PING</button>
            ${breached
              ? `<button type="button" data-node-reset="${n.id}" class="flex-1 px-2 py-1 rounded-sm bg-dive-orange/15 border border-dive-orange/40 text-dive-orange hover:bg-dive-orange hover:text-black font-bold uppercase">RIPRISTINA ICE</button>`
              : `<button type="button" data-node-breach="${n.id}" class="flex-1 px-2 py-1 rounded-sm bg-dive-cyan text-black hover:bg-white font-bold uppercase">BREACH ICE (-1 RAM)</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  netrunnerNodesGrid?.addEventListener('click', (e) => {
    const pingId = e.target.closest('[data-node-ping]')?.getAttribute('data-node-ping');
    if (pingId) {
      appendNetrunnerLog(`PING ${pingId}: latenza 11ms — firma ICE rilevata.`);
      playCyberFx('scan');
      return;
    }
    const breachId = e.target.closest('[data-node-breach]')?.getAttribute('data-node-breach');
    if (breachId) {
      if ((player.ram || 0) < 1) {
        playCyberFx('denied');
        appendNetrunnerLog(`ERRORE: RAM Cyberdeck esaurita per ${breachId}!`);
        return;
      }
      const nodes = getNetrunnerNodes();
      const target = nodes.find(n => n.id === breachId);
      if (!target) return;
      player.ram = Math.max(0, (player.ram || 0) - 1);
      target.status = 'BRECCIATO';
      saveNetrunnerNodes(nodes);
      savePlayerState(player);
      renderRamUI();
      renderNetrunnerConsole();
      appendNetrunnerLog(`BREACH RIUSCITO su ${breachId} (-1 RAM) -> ${target.payload}`);
      playCyberFx('quickhack');
      return;
    }
    const resetId = e.target.closest('[data-node-reset]')?.getAttribute('data-node-reset');
    if (resetId) {
      const nodes = getNetrunnerNodes();
      const target = nodes.find(n => n.id === resetId);
      if (target) target.status = 'PROTETTO';
      saveNetrunnerNodes(nodes);
      renderNetrunnerConsole();
      appendNetrunnerLog(`Firewall ICE ripristinato su ${resetId}.`);
      playCyberFx('ui');
    }
  });

  document.getElementById('netrunner-scan-all-btn')?.addEventListener('click', () => {
    const nodes = getNetrunnerNodes();
    const protectedCount = nodes.filter(n => n.status !== 'BRECCIATO').length;
    appendNetrunnerLog(`SCANSIONE RETE COMPLETATA: ${nodes.length} nodi online, ${protectedCount} con ICE attivo.`);
    playCyberFx('scan');
  });

  // --- D. CHIMICO: Vasche Muffe/Patogeni, Immunosoppressori & Cavie ---
  const CHEM_LAB_KEY = 'dive_chem_lab_v1';
  const DEFAULT_CHEM_LAB = {
    molds: 2,
    pathogens: 1,
    immunoDoses: 1,
    vats: [
      { id: 'vat_1', name: 'Vasca A // Muffa Neuro-Fagica M-07', kind: 'muffa', temp: 24.5, ph: 5.8, growth: 78, contam: 8 },
      { id: 'vat_2', name: 'Vasca B // Patogeno Sinaptico P-19', kind: 'patogeno', temp: 36.8, ph: 7.1, growth: 64, contam: 22 },
      { id: 'vat_3', name: 'Vasca C // Coltura Simbiotica C-04', kind: 'muffa', temp: 26.2, ph: 6.2, growth: 45, contam: 12 }
    ],
    subjects: [
      { id: 'sub_1', name: 'Cavia #01 (Soggetto K-9)', bpm: 118, toxicity: 28, psych: 62, status: 'AGITATO' },
      { id: 'sub_2', name: 'Cavia #02 (Runner Esposizione Alta)', bpm: 142, toxicity: 44, psych: 84, status: 'CRITICO' },
      { id: 'sub_3', name: 'Cavia #03 (Controllo Sinaptico)', bpm: 76, toxicity: 10, psych: 18, status: 'STABILE' }
    ]
  };

  function getChemLabState() {
    try {
      const raw = localStorage.getItem(CHEM_LAB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.vats) && Array.isArray(parsed.subjects)) return parsed;
      }
    } catch { /* fallback */ }
    localStorage.setItem(CHEM_LAB_KEY, JSON.stringify(DEFAULT_CHEM_LAB));
    return JSON.parse(JSON.stringify(DEFAULT_CHEM_LAB));
  }

  function saveChemLabState(lab) {
    localStorage.setItem(CHEM_LAB_KEY, JSON.stringify(lab));
  }

  const chemMoldCount = document.getElementById('chem-mold-count');
  const chemPathogenCount = document.getElementById('chem-pathogen-count');
  const chemImmunoCount = document.getElementById('chem-immuno-count');
  const chemVatsGrid = document.getElementById('chem-vats-grid');
  const chemSubjectsGrid = document.getElementById('chem-subjects-grid');
  const chemLabLog = document.getElementById('chem-lab-log');

  function appendChemLog(msg) {
    if (!chemLabLog) return;
    const div = document.createElement('div');
    div.textContent = `> ${msg}`;
    chemLabLog.prepend(div);
  }

  function renderChimicoConsole() {
    if (!chemVatsGrid || !chemSubjectsGrid) return;
    const lab = getChemLabState();
    if (chemMoldCount) chemMoldCount.textContent = String(lab.molds);
    if (chemPathogenCount) chemPathogenCount.textContent = String(lab.pathogens);
    if (chemImmunoCount) chemImmunoCount.textContent = String(lab.immunoDoses);

    const vatImages = [
      'assets/images/biolab-vat-a.jpg',
      'assets/images/biolab-vat-b.jpg',
      'assets/images/biolab-vat-c.jpg'
    ];
    chemVatsGrid.innerHTML = lab.vats.map((v, idx) => `
      <div class="p-3 rounded-sm bg-[#04060A] border ${v.contam >= 30 ? 'border-dive-red/60' : 'border-dive-cyan/35'} space-y-2 font-mono">
        <div class="relative h-28 w-full rounded-sm overflow-hidden border border-white/10 bg-black">
          <img src="${vatImages[idx % vatImages.length]}" alt="${escapeChatText(v.name)}" class="w-full h-full object-cover">
          <div class="hud-scan-line"></div>
        </div>
        <div class="text-[10px] font-bold text-white truncate">${escapeChatText(v.name)}</div>
        <div class="grid grid-cols-2 gap-1 text-[9px] text-slate-300">
          <span>TEMP: <strong class="text-dive-cyan">${v.temp.toFixed(1)}°C</strong></span>
          <span>pH: <strong class="text-dive-purple">${v.ph.toFixed(1)}</strong></span>
          <span>CRESCITA: <strong class="text-dive-green">${v.growth}%</strong></span>
          <span>CONTAM: <strong class="${v.contam >= 30 ? 'text-dive-red' : 'text-dive-orange'}">${v.contam}%</strong></span>
        </div>
        <div class="w-full h-1.5 bg-white/10 overflow-hidden"><div class="h-full bg-dive-green transition-all" style="width:${v.growth}%"></div></div>
        <div class="flex flex-wrap gap-1 text-[9px]">
          <button type="button" data-vat-feed="${v.id}" class="px-1.5 py-1 rounded-sm bg-dive-green/15 border border-dive-green/40 text-dive-green hover:bg-dive-green hover:text-black font-bold uppercase">NUTRI</button>
          <button type="button" data-vat-stab="${v.id}" class="px-1.5 py-1 rounded-sm bg-dive-cyan/15 border border-dive-cyan/40 text-dive-cyan hover:bg-dive-cyan hover:text-black font-bold uppercase">STABILIZZA</button>
          <button type="button" data-vat-extract="${v.id}" class="flex-1 px-1.5 py-1 rounded-sm bg-dive-purple/20 border border-dive-purple/50 text-dive-purple hover:bg-dive-purple hover:text-black font-bold uppercase">ESTRAI</button>
        </div>
      </div>
    `).join('');

    chemSubjectsGrid.innerHTML = lab.subjects.map(s => `
      <div class="p-3 rounded-sm bg-[#04060A] border ${s.psych >= 70 ? 'border-dive-red/60' : 'border-white/15'} space-y-2 font-mono">
        <div class="flex items-center justify-between text-[10px]">
          <span class="font-bold text-white truncate">${escapeChatText(s.name)}</span>
          <span class="px-1.5 py-0.5 text-[8px] font-bold rounded-sm ${s.status === 'CRITICO' ? 'bg-dive-red/20 text-dive-red' : (s.status === 'AGITATO' ? 'bg-dive-orange/20 text-dive-orange' : 'bg-dive-green/20 text-dive-green')}">${escapeChatText(s.status)}</span>
        </div>
        <div class="grid grid-cols-3 gap-1 text-[9px] text-slate-300">
          <span>BPM: <strong class="text-dive-cyan">${s.bpm}</strong></span>
          <span>TOX: <strong class="text-dive-orange">${s.toxicity}%</strong></span>
          <span>PSIC: <strong class="text-dive-red">${s.psych}%</strong></span>
        </div>
        <div class="flex flex-wrap gap-1 text-[9px]">
          <button type="button" data-sub-immuno="${s.id}" class="flex-1 px-1.5 py-1 rounded-sm bg-dive-purple text-black hover:bg-white font-bold uppercase">IMMUNOSOPP.</button>
          <button type="button" data-sub-test="${s.id}" class="px-1.5 py-1 rounded-sm bg-dive-red/15 border border-dive-red/40 text-dive-red hover:bg-dive-red hover:text-black font-bold uppercase">PATOGENO</button>
          <button type="button" data-sub-stab="${s.id}" class="px-1.5 py-1 rounded-sm bg-dive-green/15 border border-dive-green/40 text-dive-green hover:bg-dive-green hover:text-black font-bold uppercase">CALMA</button>
        </div>
      </div>
    `).join('');
  }

  chemVatsGrid?.addEventListener('click', (e) => {
    const lab = getChemLabState();
    const feedId = e.target.closest('[data-vat-feed]')?.getAttribute('data-vat-feed');
    if (feedId) {
      const v = lab.vats.find(x => x.id === feedId);
      if (v) {
        v.growth = Math.min(100, v.growth + 22);
        v.contam = Math.min(100, v.contam + 5);
        v.temp = Number((v.temp + 0.6).toFixed(1));
        saveChemLabState(lab);
        renderChimicoConsole();
        appendChemLog(`${v.name}: coltura nutrita (crescita ${v.growth}%).`);
        playCyberFx('ui');
      }
      return;
    }
    const stabId = e.target.closest('[data-vat-stab]')?.getAttribute('data-vat-stab');
    if (stabId) {
      const v = lab.vats.find(x => x.id === stabId);
      if (v) {
        v.contam = Math.max(2, v.contam - 12);
        v.ph = v.kind === 'muffa' ? 5.8 : 7.0;
        v.temp = v.kind === 'muffa' ? 24.5 : 36.5;
        saveChemLabState(lab);
        renderChimicoConsole();
        appendChemLog(`${v.name}: parametri Temp/pH stabilizzati (contam ${v.contam}%).`);
        playCyberFx('ram');
      }
      return;
    }
    const extractId = e.target.closest('[data-vat-extract]')?.getAttribute('data-vat-extract');
    if (extractId) {
      const v = lab.vats.find(x => x.id === extractId);
      if (!v) return;
      if (v.growth < 60) {
        playCyberFx('denied');
        appendChemLog(`${v.name}: crescita ${v.growth}% insufficiente (serve >= 60%).`);
        return;
      }
      v.growth = Math.max(15, v.growth - 45);
      if (v.kind === 'muffa') lab.molds += 1;
      else lab.pathogens += 1;
      saveChemLabState(lab);
      renderChimicoConsole();
      appendChemLog(`Estratto ceppo da ${v.name} (+1 ${v.kind === 'muffa' ? 'Muffa' : 'Patogeno'}).`);
      playCyberFx('success');
    }
  });

  document.getElementById('chem-synthesize-btn')?.addEventListener('click', () => {
    const lab = getChemLabState();
    if (lab.molds < 1 || lab.pathogens < 1) {
      playCyberFx('denied');
      appendChemLog('Reagenti insufficienti: estrai almeno 1 Muffa e 1 Patogeno dalle vasche.');
      return;
    }
    lab.molds -= 1;
    lab.pathogens -= 1;
    lab.immunoDoses += 1;
    saveChemLabState(lab);
    renderChimicoConsole();
    appendChemLog(`Sintesi completata! +1 Dose Immunosoppressore anti-Cyberpsicosi (totale: ${lab.immunoDoses}).`);
    playCyberFx('success');
  });

  chemSubjectsGrid?.addEventListener('click', (e) => {
    const lab = getChemLabState();
    const immunoId = e.target.closest('[data-sub-immuno]')?.getAttribute('data-sub-immuno');
    if (immunoId) {
      if (lab.immunoDoses < 1) {
        playCyberFx('denied');
        appendChemLog('Nessun Immunosoppressore pronto: sintetizza una dose prima del test.');
        return;
      }
      const s = lab.subjects.find(x => x.id === immunoId);
      if (s) {
        lab.immunoDoses -= 1;
        s.psych = Math.max(0, s.psych - 35);
        s.bpm = Math.max(68, s.bpm - 24);
        s.status = s.psych >= 70 ? 'CRITICO' : (s.psych >= 40 ? 'AGITATO' : 'STABILE');
        saveChemLabState(lab);
        renderChimicoConsole();
        appendChemLog(`${s.name}: somministrato Immunosoppressore -> Psicosi scesa a ${s.psych}%.`);
        playCyberFx('success');
      }
      return;
    }
    const testId = e.target.closest('[data-sub-test]')?.getAttribute('data-sub-test');
    if (testId) {
      const s = lab.subjects.find(x => x.id === testId);
      if (s) {
        s.toxicity = Math.min(100, s.toxicity + 18);
        s.psych = Math.min(100, s.psych + 15);
        s.bpm = Math.min(190, s.bpm + 22);
        s.status = s.psych >= 70 ? 'CRITICO' : 'AGITATO';
        saveChemLabState(lab);
        renderChimicoConsole();
        appendChemLog(`${s.name}: test patogeno grezzo eseguito (Tox ${s.toxicity}%, Psic ${s.psych}%).`);
        playCyberFx('alert');
      }
      return;
    }
    const stabId = e.target.closest('[data-sub-stab]')?.getAttribute('data-sub-stab');
    if (stabId) {
      const s = lab.subjects.find(x => x.id === stabId);
      if (s) {
        s.toxicity = Math.max(5, s.toxicity - 20);
        s.bpm = 78;
        s.status = s.psych >= 70 ? 'CRITICO' : (s.psych >= 40 ? 'AGITATO' : 'STABILE');
        saveChemLabState(lab);
        renderChimicoConsole();
        appendChemLog(`${s.name}: parametri vitali calmati (BPM ${s.bpm}, Tox ${s.toxicity}%).`);
        playCyberFx('ram');
      }
    }
  });

  function renderActiveRoleConsole() {
    if (!secRoleConsole) return;
    const target = activeSheetRunner || player;
    const kind = getRoleKind(target?.role);
    if (!kind || activeSheetRunner) {
      secRoleConsole.classList.add('hidden');
      return;
    }
    secRoleConsole.classList.remove('hidden');
    [rolePanelRipperdoc, rolePanelFixer, rolePanelNetrunner, rolePanelChimico].forEach(p => {
      if (p) p.classList.add('hidden');
    });

    if (kind === 'ripperdoc') {
      if (roleConsoleEyebrow) roleConsoleEyebrow.textContent = 'CLINICA CLANDESTINA // MODULO RIPPERDOC';
      if (roleConsoleTitle) roleConsoleTitle.textContent = 'MONITOR PAZIENTI & CHIRURGIA';
      if (roleConsoleBadge) roleConsoleBadge.textContent = 'RIPPERDOC';
      if (rolePanelRipperdoc) rolePanelRipperdoc.classList.remove('hidden');
      renderRipperdocConsole();
    } else if (kind === 'fixer') {
      if (roleConsoleEyebrow) roleConsoleEyebrow.textContent = 'BROKER OPS // CONTRATTI & TAGLIE';
      if (roleConsoleTitle) roleConsoleTitle.textContent = 'ANNUNCI QUEST & RISPOSTE PG';
      if (roleConsoleBadge) roleConsoleBadge.textContent = 'FIXER';
      if (rolePanelFixer) rolePanelFixer.classList.remove('hidden');
      renderFixerConsole();
    } else if (kind === 'netrunner') {
      if (roleConsoleEyebrow) roleConsoleEyebrow.textContent = 'DEEP NET // INTRUSIONE & BREACH';
      if (roleConsoleTitle) roleConsoleTitle.textContent = 'CONSOLE NODI RETE & ICE';
      if (roleConsoleBadge) roleConsoleBadge.textContent = 'NETRUNNER';
      if (rolePanelNetrunner) rolePanelNetrunner.classList.remove('hidden');
      renderNetrunnerConsole();
    } else if (kind === 'chimico') {
      if (roleConsoleEyebrow) roleConsoleEyebrow.textContent = 'BIOTECH LAB // COLTURE & CAVIE';
      if (roleConsoleTitle) roleConsoleTitle.textContent = 'VASCHE, PATOGENI & IMMUNOSOPPRESSORI';
      if (roleConsoleBadge) roleConsoleBadge.textContent = 'CHIMICO';
      if (rolePanelChimico) rolePanelChimico.classList.remove('hidden');
      renderChimicoConsole();
    }
  }

  // Initialize
  syncPlayerUI();
  renderChat();
  renderSocialFeed();
  renderAdminRoster();

  if (initialPg || getActiveSessionId()) {
    switchTab('profile');
  }

  // --------------------------------------------------------------------------
  // 16. PWA Service Worker & Install Prompt
  // --------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    });
  }

  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  let deferredInstallPrompt = null;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  if (pwaInstallBtn && !isStandalone) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      pwaInstallBtn.classList.remove('hidden');
    });

    if (isIos) {
      pwaInstallBtn.classList.remove('hidden');
    }

    pwaInstallBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice.catch(() => null);
        if (choice && choice.outcome === 'accepted') {
          pwaInstallBtn.classList.add('hidden');
        }
        deferredInstallPrompt = null;
      } else if (isIos) {
        alert('Per installare DIVE su iPhone/iPad: tocca il tasto Condividi (quadrato con freccia in su) e scegli "Aggiungi alla schermata Home".');
      }
    });

    window.addEventListener('appinstalled', () => {
      pwaInstallBtn.classList.add('hidden');
      deferredInstallPrompt = null;
    });
  }
});
