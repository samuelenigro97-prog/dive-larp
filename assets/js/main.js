// ==========================================================================
// DIVE Cyberpunk LARP - Complete Engine & Mechanics
// Based on LARP Design Call & Rulebook
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. Cyberpunk Web Audio Synthesizer (Zero external dependencies)
  // --------------------------------------------------------------------------
  let audioCtx = null;
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

  function synthTone(ctx, { freqStart, freqEnd, type = 'sawtooth', duration = 0.12, gainPeak = 0.08, delay = 0, filterFreq = 2200, filterQ = 4, detune = 0 }) {
    const t0 = ctx.currentTime + delay;
    const t1 = t0 + duration;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.detune.setValueAtTime(detune, t0);
    osc.frequency.setValueAtTime(Math.max(40, freqStart), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd ?? freqStart), t1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(180, filterFreq * 0.35), t1);
    filter.Q.setValueAtTime(filterQ, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t1 + 0.01);
  }

  function playCyberFx(preset = 'ui') {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      switch (preset) {
        case 'ui':
          synthTone(ctx, { freqStart: 1200, freqEnd: 520, type: 'triangle', duration: 0.045, gainPeak: 0.06, filterFreq: 2800, filterQ: 3 });
          synthTone(ctx, { freqStart: 240, freqEnd: 160, type: 'sine', duration: 0.04, gainPeak: 0.04, filterFreq: 900 });
          break;
        case 'scan':
          synthTone(ctx, { freqStart: 920, freqEnd: 1380, type: 'sine', duration: 0.07, gainPeak: 0.07, filterFreq: 3200 });
          synthTone(ctx, { freqStart: 1380, freqEnd: 1840, type: 'triangle', duration: 0.09, gainPeak: 0.06, delay: 0.075, filterFreq: 3600 });
          break;
        case 'quickhack':
          // Netrunner breach sweep: dual detuned saw + sub pulse
          synthTone(ctx, { freqStart: 280, freqEnd: 1420, type: 'sawtooth', duration: 0.14, gainPeak: 0.075, filterFreq: 3400, filterQ: 8, detune: -12 });
          synthTone(ctx, { freqStart: 280, freqEnd: 1420, type: 'sawtooth', duration: 0.14, gainPeak: 0.065, filterFreq: 3400, filterQ: 8, detune: 12 });
          synthTone(ctx, { freqStart: 1420, freqEnd: 460, type: 'square', duration: 0.18, gainPeak: 0.05, delay: 0.12, filterFreq: 2200, filterQ: 6 });
          break;
        case 'quickhack-end':
          synthTone(ctx, { freqStart: 540, freqEnd: 110, type: 'sawtooth', duration: 0.22, gainPeak: 0.07, filterFreq: 1600, filterQ: 5 });
          break;
        case 'ram':
          synthTone(ctx, { freqStart: 320, freqEnd: 640, type: 'triangle', duration: 0.08, gainPeak: 0.065, filterFreq: 2400 });
          synthTone(ctx, { freqStart: 640, freqEnd: 1180, type: 'sine', duration: 0.12, gainPeak: 0.07, delay: 0.07, filterFreq: 3200 });
          break;
        case 'success':
          synthTone(ctx, { freqStart: 523, freqEnd: 523, type: 'triangle', duration: 0.08, gainPeak: 0.065, filterFreq: 2600 });
          synthTone(ctx, { freqStart: 659, freqEnd: 659, type: 'triangle', duration: 0.08, gainPeak: 0.065, delay: 0.065, filterFreq: 3000 });
          synthTone(ctx, { freqStart: 1046, freqEnd: 1046, type: 'sine', duration: 0.16, gainPeak: 0.07, delay: 0.13, filterFreq: 3600 });
          break;
        case 'denied':
          synthTone(ctx, { freqStart: 175, freqEnd: 110, type: 'sawtooth', duration: 0.11, gainPeak: 0.08, filterFreq: 900, filterQ: 6, detune: -15 });
          synthTone(ctx, { freqStart: 155, freqEnd: 95, type: 'square', duration: 0.15, gainPeak: 0.07, delay: 0.1, filterFreq: 800, filterQ: 5, detune: 15 });
          break;
        case 'alert':
          synthTone(ctx, { freqStart: 780, freqEnd: 520, type: 'sawtooth', duration: 0.16, gainPeak: 0.075, filterFreq: 2200, filterQ: 7 });
          synthTone(ctx, { freqStart: 780, freqEnd: 520, type: 'sawtooth', duration: 0.18, gainPeak: 0.075, delay: 0.18, filterFreq: 2200, filterQ: 7 });
          break;
        default:
          synthTone(ctx, { freqStart: 700, freqEnd: 420, type: 'triangle', duration: 0.06, gainPeak: 0.06 });
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
      // Map legacy calls to richer filtered synth tones
      if (frequency <= 260) {
        synthTone(ctx, { freqStart: frequency, freqEnd: frequency * 0.6, type: 'sawtooth', duration: Math.max(duration, 0.14), gainPeak: 0.07, filterFreq: 950, filterQ: 6, detune: -10 });
        synthTone(ctx, { freqStart: frequency * 0.98, freqEnd: frequency * 0.58, type: 'square', duration: Math.max(duration, 0.14), gainPeak: 0.045, filterFreq: 900, detune: 10 });
      } else if (duration <= 0.06) {
        synthTone(ctx, { freqStart: frequency * 1.4, freqEnd: frequency * 0.75, type: 'triangle', duration: 0.045, gainPeak: 0.055, filterFreq: 2600, filterQ: 3 });
      } else {
        synthTone(ctx, { freqStart: frequency, freqEnd: frequency * 1.22, type: type === 'sine' ? 'triangle' : type, duration, gainPeak: 0.065, filterFreq: 2800, filterQ: 4 });
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
      corp: [
        { author: '@DIVE_Control', text: 'Benvenuti nel Settore 04 Ciminiere. Vietato estrarre armi nei privé.', time: '19:00' }
      ],
      direct: [
        { author: '@Kuro_04', text: 'Choom, hai visto chi c\'è al tavolo dei mercenari? Sembra della Militech.', time: '19:10' }
      ]
    }
  };

  const ROSTER_SEED = [
    { callsign: '@V_Solo', role: 'MERCENARIO // SOLO', secretId: '#V-7842', pin: '1234', avatar: 'assets/images/avatars/pg-1.jpg', themeColor: 'orange', hp: 100, psych: 10, fama: 3, wallet: 1500, ram: 8, ramMax: 8, ice: true },
    { callsign: '@Kuro_04', role: 'NETRUNNER // HACKER', secretId: '#K-4109', pin: '1234', avatar: 'assets/images/avatars/pg-2.jpg', themeColor: 'cyan', hp: 100, psych: 25, fama: 4, wallet: 850, ram: 8, ramMax: 8, ice: false },
    { callsign: '@Runner_Insolito', role: 'SOLO // VAGABONDO', secretId: '#R-9921', pin: '1234', avatar: 'assets/images/avatars/pg-3.jpg', themeColor: 'green', hp: 75, psych: 45, fama: 2, wallet: 320, ram: 8, ramMax: 8, ice: true },
    { callsign: '@CyberRex', role: 'MAELSTROM // CORPO', secretId: '#C-0012', pin: '1234', avatar: 'assets/images/avatars/pg-4.jpg', themeColor: 'red', hp: 100, psych: 0, fama: 5, wallet: 5400, ram: 8, ramMax: 8, ice: true },
    { callsign: '@Nico_Media', role: 'MEDIA // REPORTER', secretId: '#M-3384', pin: '1234', avatar: 'assets/images/avatars/pg-3.jpg', themeColor: 'purple', hp: 100, psych: 15, fama: 3, wallet: 1200, ram: 8, ramMax: 8, ice: false }
  ];

  const ACCOUNTS_STORAGE_KEY = 'dive_accounts_v1';
  const SESSION_STORAGE_KEY = 'dive_session_v1';

  function normalizeAccount(raw) {
    return {
      ...DEFAULT_PLAYER,
      ...raw,
      iceActive: raw.iceActive !== undefined ? raw.iceActive : Boolean(raw.ice),
      pin: raw.pin || '1234',
      ram: raw.ram ?? 8,
      ramMax: raw.ramMax ?? 8,
      traumas: Array.isArray(raw.traumas) ? raw.traumas : [],
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
          return parsed.map(normalizeAccount);
        }
      }
    } catch {
      // fallback seed
    }
    const seeded = ROSTER_SEED.map(normalizeAccount);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function saveAccountsRegistry(accounts) {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
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
      window.DiveSync.pushSharedState({
        accounts: getAccountsRegistry(),
        posts: typeof getSocialPosts === 'function' ? getSocialPosts() : [],
        updatedAt: Date.now()
      }).catch(err => console.warn('Cloud push error:', err));
    }, 300);
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

    // Wallet display
    const walletBalanceDisplay = document.getElementById('wallet-balance-display');
    if (walletBalanceDisplay) walletBalanceDisplay.textContent = player.wallet.toLocaleString();

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
      cardAvatarFrame.className = `cyber-panel relative w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border ${avatarTheme.border} bg-black flex-shrink-0`;
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
    if (playerHpText) playerHpText.textContent = `${sheetData.hp}% ${sheetData.hp > 75 ? 'NOMINALE' : (sheetData.hp > 30 ? 'FERITO' : 'CRITICO / FLATLINE')}`;
    if (playerHpBar) {
      playerHpBar.style.width = `${sheetData.hp}%`;
      playerHpBar.className = 'h-full bg-dive-green transition-all duration-500';
    }

    const iceOn = isViewingOther ? sheetData.iceActive : player.iceActive;
    if (playerIceStatus) {
      playerIceStatus.textContent = iceOn ? 'ICE ATTIVO (1 HIT)' : 'ICE BREACHED';
      playerIceStatus.className = iceOn
        ? 'px-2 py-0.5 bg-black border border-dive-green/40 text-dive-green font-bold'
        : 'px-2 py-0.5 bg-black border border-dive-red/40 text-dive-red font-bold';
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
  }

  // --------------------------------------------------------------------------
  // 4. Tab Navigation System
  // --------------------------------------------------------------------------
  const tabTriggers = document.querySelectorAll('.nav-tab-trigger');
  const appTabs = document.querySelectorAll('.app-tab');

  const SECTION_ROUTES = {
    cyberdeck: { tab: 'profile', anchor: 'sec-deck' },
    wallet: { tab: 'profile', anchor: 'sec-wallet' },
    profile: { tab: 'profile', anchor: null },
    comm: { tab: 'net', anchor: 'sec-chat' }
  };

  function switchTab(tabId) {
    const route = SECTION_ROUTES[tabId];
    const scrollTargetId = route ? route.anchor : null;
    const effectiveTab = route ? route.tab : tabId;

    appTabs.forEach(tab => {
      if (tab.id === `tab-${effectiveTab}`) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
      } else {
        tab.classList.add('hidden');
        tab.classList.remove('active');
      }
    });

    // Desktop Nav
    document.querySelectorAll('nav button.nav-tab-trigger').forEach(btn => {
      if (btn.getAttribute('data-tab') === effectiveTab) {
        btn.classList.add('text-dive-orange', 'font-bold', 'border-dive-orange');
        btn.classList.remove('text-slate-400', 'font-normal', 'border-transparent');
      } else {
        btn.classList.remove('text-dive-orange', 'font-bold', 'border-dive-orange');
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

      scanBadge.className = 'px-2 py-0.5 rounded-sm text-[9px] uppercase font-bold bg-dive-orange/20 text-dive-orange border border-dive-orange/40';
      scanBadge.textContent = '[ID] RUNNER';
      scanOutputText.textContent = `[TARGET ACQUISITO] Rilevato Cyberdeck di ${callsign} (ID: ${secretId}). Scegli se trasferire EuroDollari o avviare l'intrusione clandestina.`;
      
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
  // 10. Personal QR Fullscreen Modal
  // --------------------------------------------------------------------------
  const openMyQrBtn = document.getElementById('open-my-qr-btn');
  const myQrModal = document.getElementById('my-qr-modal');
  const closeMyQrBtn = document.getElementById('close-my-qr-btn');

  if (openMyQrBtn && myQrModal) {
    openMyQrBtn.addEventListener('click', () => {
      myQrModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => myQrModal.classList.add('opacity-100'), 10);
    });
  }

  if (closeMyQrBtn && myQrModal) {
    closeMyQrBtn.addEventListener('click', () => {
      myQrModal.classList.remove('opacity-100');
      setTimeout(() => myQrModal.classList.add('hidden', 'pointer-events-none'), 300);
    });
  }

  // Profile Callsign & Role Switcher
  const openProfileBtn = document.getElementById('open-profile-btn');
  const profileEditModal = document.getElementById('profile-edit-modal');
  const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
  const profileEditForm = document.getElementById('profile-edit-form');
  const inputNewCallsign = document.getElementById('input-new-callsign');
  const inputNewRole = document.getElementById('input-new-role');

  if (openProfileBtn && profileEditModal) {
    openProfileBtn.addEventListener('click', () => {
      inputNewCallsign.value = player.callsign;
      inputNewRole.value = player.role;
      profileEditModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => profileEditModal.classList.add('opacity-100'), 10);
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
  // 11. Radio Chat (Fixer Contracts, Corp Broadcasts, Direct DMs 1-a-1)
  // --------------------------------------------------------------------------
  let currentChatChannel = 'fixer';
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatSendForm = document.getElementById('chat-send-form');
  const chatTextInput = document.getElementById('chat-text-input');
  const currentChannelLabel = document.getElementById('current-channel-label');
  const dmRecipientWrap = document.getElementById('dm-recipient-wrap');
  const dmRecipientSelect = document.getElementById('dm-recipient-select');
  const chatChannelBtns = document.querySelectorAll('.chat-channel-btn');

  function renderChat() {
    if (!chatMessagesContainer) return;
    const msgs = player.chatMessages[currentChatChannel] || [];

    chatMessagesContainer.innerHTML = msgs.map(msg => {
      const isMe = msg.author === player.callsign;
      return `
        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
          <div class="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 mb-0.5">
            <span class="font-bold ${isMe ? 'text-dive-orange' : 'text-dive-cyan'}">${msg.author}</span>
            <span>• ${msg.time}</span>
          </div>
          <div class="px-3.5 py-2 rounded-sm max-w-[85%] text-xs ${isMe ? 'bg-dive-orange/15 border border-dive-orange/35 text-white' : 'bg-[#080B12] border border-white/10 text-slate-200'}">
            ${msg.text}
          </div>
        </div>
      `;
    }).join('');

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  chatChannelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chatChannelBtns.forEach(b => {
        b.className = 'chat-channel-btn px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white whitespace-nowrap';
      });
      btn.className = 'chat-channel-btn active px-3 py-1.5 rounded-lg border border-dive-cyan/40 bg-dive-cyan/15 text-dive-cyan font-semibold whitespace-nowrap';
      currentChatChannel = btn.getAttribute('data-channel');

      if (currentChatChannel === 'direct') {
        if (dmRecipientWrap) dmRecipientWrap.classList.remove('hidden');
        if (currentChannelLabel) currentChannelLabel.textContent = '# DM DIRETTO PRIVATO';
      } else {
        if (dmRecipientWrap) dmRecipientWrap.classList.add('hidden');
        const channelLabels = {
          fixer: '# CONTRATTI & TAGLIE FIXER',
          corp: '# DISPACCI UFFICIALI CORP & MASTER'
        };
        if (currentChannelLabel) currentChannelLabel.textContent = channelLabels[currentChatChannel] || '# RADIO';
      }

      renderChat();
      playCyberSound(480, 'sine', 0.05);
    });
  });

  if (chatSendForm && chatTextInput) {
    chatSendForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatTextInput.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const recipient = (currentChatChannel === 'direct' && dmRecipientSelect) ? ` -> ${dmRecipientSelect.value}` : '';

      if (!player.chatMessages[currentChatChannel]) player.chatMessages[currentChatChannel] = [];
      player.chatMessages[currentChatChannel].push({
        author: player.callsign + recipient,
        text: text,
        time: timeStr
      });
      savePlayerState(player);
      chatTextInput.value = '';
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

      return `
        <article class="cyber-panel p-4 sm:p-5 space-y-4 transition-colors ${post.isPinned ? 'border-dive-orange/60' : ''}" data-id="${post.id}" data-type="${post.type}" data-anon="${isAnon ? 'true' : 'false'}">
            
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

              <!-- Media Powers: Pin and Delete -->
              <div class="flex items-center gap-2">
                ${isMediaOrAdmin ? `
                  <button class="media-pin-btn px-1.5 py-0.5 rounded-sm border border-white/10 text-[9px] font-mono text-slate-400 hover:text-dive-orange hover:border-dive-orange/40" data-id="${post.id}" title="Pinna in alto">
                    [PIN]
                  </button>
                  <button class="media-delete-btn px-1.5 py-0.5 rounded-sm border border-white/10 text-[9px] font-mono text-slate-400 hover:text-dive-red hover:border-dive-red/40" data-id="${post.id}" title="Cancella post">
                    [DEL]
                  </button>
                ` : ''}
                <span class="px-2 py-0.5 rounded-sm bg-[#080B12] border border-white/10 text-[9px] font-mono uppercase text-slate-400">
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

  // Filter Buttons
  document.querySelectorAll('.feed-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feed-filter-btn').forEach(b => {
        b.className = 'feed-filter-btn px-3.5 py-1.5 rounded-sm border border-white/10 bg-[#080B12] text-slate-400 hover:text-white whitespace-nowrap transition-colors';
      });
      btn.className = 'feed-filter-btn active px-3.5 py-1.5 rounded-sm border border-dive-orange bg-dive-orange/15 text-dive-orange font-semibold whitespace-nowrap transition-colors';

      const filter = btn.getAttribute('data-filter');
      document.querySelectorAll('#social-feed-grid article').forEach(card => {
        const type = card.getAttribute('data-type');
        const isAnon = card.getAttribute('data-anon') === 'true';

        if (filter === 'all') {
          card.classList.remove('hidden');
        } else if (filter === 'news' && type === 'news') {
          card.classList.remove('hidden');
        } else if (filter === 'photos' && type === 'photos') {
          card.classList.remove('hidden');
        } else if (filter === 'anonymous' && isAnon) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

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
  const openAdminPinBtn = document.getElementById('open-admin-pin-btn');
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

  if (openAdminPinBtn && adminPinModal) {
    openAdminPinBtn.addEventListener('click', () => {
      adminPinModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => adminPinModal.classList.add('opacity-100'), 10);
      if (adminPinInput) adminPinInput.focus();
    });
  }

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

      if (globalBroadcastBanner && globalBroadcastText) {
        globalBroadcastText.textContent = msg;
        globalBroadcastBanner.classList.remove('hidden');
        playCyberSound(950, 'sawtooth', 0.4);
      }
      adminBroadcastInput.value = '';
      alert('[BROADCAST INVIATO]\nAvviso d\'emergenza trasmesso a tutti i runner sul campo.');
    });
  }

  if (closeBroadcastBtn && globalBroadcastBanner) {
    closeBroadcastBtn.addEventListener('click', () => {
      globalBroadcastBanner.classList.add('hidden');
    });
  }

  if (adminAddPsych) {
    adminAddPsych.addEventListener('click', () => {
      player.psych = Math.min(100, (player.psych || 0) + 15);
      savePlayerState(player);
      playCyberSound(300, 'sawtooth', 0.1);
    });
  }

  if (adminRemPsych) {
    adminRemPsych.addEventListener('click', () => {
      player.psych = Math.max(0, (player.psych || 0) - 15);
      savePlayerState(player);
      playCyberSound(600, 'sine', 0.1);
    });
  }

  if (adminAddMoney) {
    adminAddMoney.addEventListener('click', () => {
      player.wallet += 200;
      player.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'in',
        desc: 'Accredito speciale Regia / Media Sponsor',
        amount: 200,
        time: 'Adesso'
      });
      savePlayerState(player);
      playCyberSound(880, 'sine', 0.1);
    });
  }

  if (adminToggleIce) {
    adminToggleIce.addEventListener('click', () => {
      player.iceActive = !player.iceActive;
      savePlayerState(player);
      playCyberSound(player.iceActive ? 750 : 250, 'square', 0.1);
    });
  }

  function renderAdminRoster() {
    if (!adminRosterTbody) return;
    const roster = getAccountsRegistry();

    adminRosterTbody.innerHTML = roster.map(r => `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="py-2.5 font-bold text-white">${r.callsign}</td>
        <td class="py-2.5 text-slate-400 text-[11px]">${r.role}</td>
        <td class="py-2.5 text-dive-cyan font-bold">${r.secretId}</td>
        <td class="py-2.5 ${r.hp > 50 ? 'text-dive-green' : 'text-dive-red'}">${r.hp}%</td>
        <td class="py-2.5 ${r.psych > 60 ? 'text-dive-red' : 'text-dive-cyan'}">${r.psych}%</td>
        <td class="py-2.5 text-dive-green">€$ ${(r.wallet || 0).toLocaleString()}</td>
        <td class="py-2.5 text-right font-bold ${r.iceActive ? 'text-dive-green' : 'text-slate-500'}">${r.iceActive ? 'ON' : 'OFF'}</td>
      </tr>
    `).join('');
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

  function activateAccount(account) {
    player = normalizeAccount(account);
    setActiveSessionId(player.secretId);
    activeSheetRunner = null;
    savePlayerState(player);
    renderRamUI();
    renderSocialFeed();
    renderChat();
    closeLoginModal();
    if (typeof playCyberFx === 'function') playCyberFx('success');
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

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (registerErrorEl) registerErrorEl.classList.add('hidden');
      const rawCallsign = document.getElementById('reg-callsign')?.value.trim() || '';
      const role = document.getElementById('reg-role')?.value || 'MERCENARIO // SOLO';
      const themeColor = document.getElementById('reg-color')?.value || 'orange';
      const pin = document.getElementById('reg-pin')?.value.trim() || '1234';

      if (!rawCallsign) return;
      const callsign = rawCallsign.startsWith('@') ? rawCallsign : `@${rawCallsign}`;
      const accounts = getAccountsRegistry();
      if (accounts.some(a => a.callsign.toUpperCase() === callsign.toUpperCase())) {
        if (registerErrorEl) {
          registerErrorEl.textContent = 'Callsign già registrato. Scegli un altro nome o accedi.';
          registerErrorEl.classList.remove('hidden');
        }
        if (typeof playCyberFx === 'function') playCyberFx('denied');
        return;
      }

      const avatars = [
        'assets/images/avatars/pg-1.jpg',
        'assets/images/avatars/pg-2.jpg',
        'assets/images/avatars/pg-3.jpg',
        'assets/images/avatars/pg-4.jpg'
      ];
      const prefix = callsign.replace('@', '').charAt(0).toUpperCase() || 'X';
      const num = Math.floor(1000 + Math.random() * 9000);
      const newAccount = normalizeAccount({
        callsign,
        role,
        secretId: `#${prefix}-${num}`,
        pin,
        avatar: avatars[accounts.length % avatars.length],
        themeColor,
        hp: 100,
        psych: 0,
        fama: 1,
        wallet: 1000,
        ram: 8,
        ramMax: 8,
        iceActive: true
      });

      accounts.push(newAccount);
      saveAccountsRegistry(accounts);
      activateAccount(newAccount);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      setActiveSessionId('');
      if (typeof syncAuthMenuUI === 'function') syncAuthMenuUI();
      if (profileEditModal) {
        profileEditModal.classList.remove('opacity-100');
        setTimeout(() => profileEditModal.classList.add('hidden', 'pointer-events-none'), 200);
      }
      openLoginModal(true);
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
          await window.DiveSync.pushSharedState({
            accounts: getAccountsRegistry(),
            posts: typeof getSocialPosts === 'function' ? getSocialPosts() : [],
            updatedAt: Date.now()
          });
          if (typeof playCyberFx === 'function') playCyberFx('success');
        } catch (err) {
          alert('Connettore salvato, ma test sync fallito: ' + err.message);
        }
      } else {
        if (typeof playCyberFx === 'function') playCyberFx('ui');
      }
    });
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

  function syncAuthMenuUI() {
    const isAuthenticated = Boolean(getActiveSessionId());
    if (loginMenuToggleLabel) {
      loginMenuToggleLabel.textContent = isAuthenticated ? player.callsign : 'LOGIN';
    }
    if (loginMenuGuest) {
      loginMenuGuest.classList.toggle('hidden', isAuthenticated);
    }
    if (loginMenuAuthenticated) {
      loginMenuAuthenticated.classList.toggle('hidden', !isAuthenticated);
    }
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
    headerLogoutBtn.addEventListener('click', () => {
      setActiveSessionId('');
      syncAuthMenuUI();
      const activeTab = document.querySelector('.app-tab.active');
      if (activeTab && (activeTab.id === 'tab-net' || activeTab.id === 'tab-profile')) {
        switchTab('home');
      }
      playCyberSound(340, 'triangle', 0.06);
    });
  }

  syncAuthMenuUI();

  // Initialize
  syncPlayerUI();
  renderChat();
  renderSocialFeed();
  renderAdminRoster();

  if (initialPg) {
    switchTab('profile');
  }
});
