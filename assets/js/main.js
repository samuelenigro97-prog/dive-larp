// ==========================================================================
// DIVE Cyberpunk LARP - Clean Engine & Companion Systems
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. Audio SFX Synthesizer
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

  function playCyberSound(frequency = 440, type = 'sine', duration = 0.08) {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // silent
    }
  }

  if (sfxToggle) {
    sfxToggle.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      sfxToggle.classList.toggle('text-dive-orange', sfxEnabled);
      sfxToggle.classList.toggle('text-slate-500', !sfxEnabled);
      if (sfxEnabled) playCyberSound(660, 'square', 0.1);
    });
  }

  // --------------------------------------------------------------------------
  // 2. Player Persistent State & Profile
  // --------------------------------------------------------------------------
  const DEFAULT_PLAYER = {
    callsign: '@V_Solo',
    role: 'MERCENARIO // SOLO',
    hp: 100,
    fama: 3,
    wallet: 1500,
    traumas: [],
    transactions: [
      { id: 'tx_1', type: 'in', desc: 'Ingaggio iniziale corporativo', amount: 1500, time: 'Inizio Evento' }
    ],
    chatMessages: {
      general: [
        { author: '@DIVE_Control', text: 'Benvenuti nel Settore 04 Ciminiere. Mantenere le armi in sicura.', time: '19:00', role: 'CORPO' },
        { author: '@Runner_Insolito', text: 'Frequenza aperta. Chi cerca squadra mi contatti al molo.', time: '19:05', role: 'SOLO' }
      ],
      squad: [
        { author: '@Kuro_04', text: 'Obiettivo localizzato al secondo piano del padiglione.', time: '19:10', role: 'SOLO' }
      ],
      fixer: [
        { author: '@The_Fixer_Board', text: '[TAGLIA] 500 €$ per chi recupera il datashard della Militech.', time: '19:12', role: 'FIXER' }
      ]
    }
  };

  function getPlayerState() {
    try {
      const stored = localStorage.getItem('dive_player_state');
      return stored ? { ...DEFAULT_PLAYER, ...JSON.parse(stored) } : DEFAULT_PLAYER;
    } catch {
      return DEFAULT_PLAYER;
    }
  }

  function savePlayerState(state) {
    try {
      localStorage.setItem('dive_player_state', JSON.stringify(state));
      syncPlayerUI();
    } catch (e) {
      console.warn('Storage error', e);
    }
  }

  let player = getPlayerState();

  function syncPlayerUI() {
    // Header Callout
    const headerCallsign = document.getElementById('header-player-callsign');
    const headerHp = document.getElementById('header-hp');
    const headerBalance = document.getElementById('header-wallet-balance');
    if (headerCallsign) headerCallsign.textContent = player.callsign;
    if (headerHp) {
      headerHp.textContent = `${player.hp}%`;
      headerHp.className = player.hp > 50 ? 'text-dive-green font-bold' : (player.hp > 25 ? 'text-dive-orange font-bold' : 'text-dive-red font-bold animate-pulse');
    }
    if (headerBalance) headerBalance.textContent = player.wallet.toLocaleString();

    // Wallet
    const walletBalanceDisplay = document.getElementById('wallet-balance-display');
    if (walletBalanceDisplay) walletBalanceDisplay.textContent = player.wallet.toLocaleString();

    // Profile Card
    const cardCallsign = document.getElementById('card-callsign');
    const cardRole = document.getElementById('card-role');
    const playerHpText = document.getElementById('player-hp-text');
    const playerHpBar = document.getElementById('player-hp-bar');
    if (cardCallsign) cardCallsign.textContent = player.callsign;
    if (cardRole) cardRole.textContent = player.role;
    if (playerHpText) playerHpText.textContent = `${player.hp}% ${player.hp > 75 ? 'NOMINALE' : (player.hp > 30 ? 'FERITO' : 'CRITICO / FLATLINE')}`;
    if (playerHpBar) {
      playerHpBar.style.width = `${player.hp}%`;
      playerHpBar.className = `h-full transition-all duration-500 ${player.hp > 50 ? 'bg-dive-green' : (player.hp > 25 ? 'bg-dive-orange' : 'bg-dive-red')}`;
    }

    // Traumas
    const traumasList = document.getElementById('traumas-list');
    if (traumasList) {
      if (!player.traumas || player.traumas.length === 0) {
        traumasList.innerHTML = `<span class="text-slate-500 italic block">Nessun danno critico rilevato. Sistemi ottimali.</span>`;
      } else {
        traumasList.innerHTML = player.traumas.map(t => `
          <div class="px-2.5 py-1 rounded-lg bg-dive-red/10 border border-dive-red/30 text-dive-red font-mono text-[10px] flex items-center justify-between">
            <span>⚠️ ${t.name}</span>
            <span class="text-[9px] text-slate-400">${t.desc}</span>
          </div>
        `).join('');
      }
    }

    renderTransactions();
  }

  // --------------------------------------------------------------------------
  // 3. Single Page Tab Navigation
  // --------------------------------------------------------------------------
  const tabTriggers = document.querySelectorAll('.nav-tab-trigger');
  const appTabs = document.querySelectorAll('.app-tab');

  function switchTab(tabId) {
    appTabs.forEach(tab => {
      if (tab.id === `tab-${tabId}`) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
      } else {
        tab.classList.add('hidden');
        tab.classList.remove('active');
      }
    });

    // Update Desktop Nav Text
    document.querySelectorAll('nav button.nav-tab-trigger').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('text-dive-orange', 'font-bold');
        btn.classList.remove('text-slate-400', 'font-normal');
      } else {
        btn.classList.remove('text-dive-orange', 'font-bold');
        btn.classList.add('text-slate-400', 'font-normal');
      }
    });

    // Update Mobile Dock Items
    document.querySelectorAll('.mobile-dock-item').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('text-dive-orange', 'active');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('text-dive-orange', 'active');
        btn.classList.add('text-slate-400');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    playCyberSound(450, 'triangle', 0.05);
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
  // 4. Quickhack 5-Seconds Combat Overlay
  // --------------------------------------------------------------------------
  const qhOverlay = document.getElementById('quickhack-combat-overlay');
  const qhCommandEl = document.getElementById('qh-combat-command');
  const qhDescEl = document.getElementById('qh-combat-description');
  const qhSecondsTimer = document.getElementById('qh-seconds-timer');
  const qhTimerBar = document.getElementById('qh-timer-bar');
  const closeQhBtn = document.getElementById('close-quickhack-overlay-btn');

  let qhInterval = null;

  function launchQuickhackCombat(commandName, description) {
    if (!qhOverlay) return;
    if (qhInterval) clearInterval(qhInterval);

    qhCommandEl.textContent = commandName;
    qhDescEl.textContent = description;
    qhOverlay.classList.remove('hidden');
    qhOverlay.classList.add('flex');

    let timeLeft = 5.0;
    qhSecondsTimer.textContent = timeLeft.toFixed(1);
    qhTimerBar.style.width = '100%';

    playCyberSound(950, 'sawtooth', 0.15);

    const stepMs = 100;
    qhInterval = setInterval(() => {
      timeLeft -= (stepMs / 1000);
      if (timeLeft <= 0) {
        clearInterval(qhInterval);
        qhSecondsTimer.textContent = '0.0';
        qhTimerBar.style.width = '0%';
        playCyberSound(300, 'square', 0.2);
        setTimeout(() => {
          closeQuickhackOverlay();
        }, 800);
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
      launchQuickhackCombat(hack, desc);
    });
  });

  if (closeQhBtn) closeQhBtn.addEventListener('click', closeQuickhackOverlay);

  // --------------------------------------------------------------------------
  // 5. QR Code Optical Scanner & Manual Code Resolver
  // --------------------------------------------------------------------------
  const startCameraBtn = document.getElementById('start-camera-scan-btn');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const manualQrForm = document.getElementById('manual-qr-form');
  const manualCodeInput = document.getElementById('manual-code-input');
  const scanResultCard = document.getElementById('scan-result-card');
  const scanBadge = document.getElementById('scan-badge');
  const scanOutputText = document.getElementById('scan-output-text');

  let html5QrScanner = null;

  function resolveCode(codeStr) {
    const code = codeStr.trim().toUpperCase();
    if (!scanResultCard || !scanBadge || !scanOutputText) return;

    scanResultCard.classList.remove('hidden');
    playCyberSound(750, 'square', 0.1);

    if (code.includes('GREEN') || code.startsWith('RIPPER') || code.startsWith('CYB-G')) {
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-dive-green/20 text-dive-green border border-dive-green/40';
      scanBadge.textContent = '🟢 IMPIANTO VERDE';
      scanOutputText.textContent = `[ACCESSO CONCESSO] Rilevato impianto Ripperdoc compatibile: "Stabilizzatore Neurale Mk.3". Salute +25% e rimozione traumi.`;
      
      player.hp = Math.min(100, player.hp + 25);
      player.traumas = [];
      savePlayerState(player);

    } else if (code.includes('BLUE') || code.startsWith('TERM') || code.startsWith('CYB-B')) {
      const lootedEddies = Math.floor(Math.random() * 200) + 100;
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-dive-cyan/20 text-dive-cyan border border-dive-cyan/40';
      scanBadge.textContent = '🔵 DISPOSITIVO BLU';
      scanOutputText.textContent = `[HACKING RIUSCITO] Terminale forzato! Dati scaricati e accreditati +€$ ${lootedEddies} nel tuo Wallet.`;
      
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
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-dive-red/20 text-dive-red border border-dive-red/40';
      scanBadge.textContent = '🔴 CASSAFORTE / ICE';
      scanOutputText.textContent = `[ALLARME SICUREZZA] Dispositivo protetto da contromisure ICE! Quickhack "AL BUIO!" consigliato.`;
      launchQuickhackCombat('AL BUIO!', 'Neutralizza il sensore rosso entro 5 secondi prima che scatti l\'allarme sonoro!');

    } else {
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-dive-orange/20 text-dive-orange border border-dive-orange/40';
      scanBadge.textContent = 'DATASHARD GENERICO';
      scanOutputText.textContent = `Codice [${code}] decifrato: Log salvato nel datashard di sistema.`;
    }
  }

  if (manualQrForm && manualCodeInput) {
    manualQrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      resolveCode(manualCodeInput.value);
      manualCodeInput.value = '';
    });
  }

  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', () => {
      if (typeof Html5Qrcode !== 'undefined') {
        if (cameraPlaceholder) cameraPlaceholder.classList.add('hidden');
        html5QrScanner = new Html5Qrcode("qr-reader");
        html5QrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            resolveCode(decodedText);
            html5QrScanner.stop();
            if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
          },
          () => {}
        ).catch(() => {
          alert('Fotocamera non disponibile. Inserisci il codice a mano nel campo sottostante.');
          if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
        });
      } else {
        alert('Scanner fotocamera non supportato. Inserisci il codice a mano.');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Off-Fight Hacking / Siphon Minigame
  // --------------------------------------------------------------------------
  const hackForm = document.getElementById('hack-target-form');
  const hackTargetCallsign = document.getElementById('hack-target-callsign');
  const hackWrap = document.getElementById('hack-progress-bar-wrap');
  const hackPct = document.getElementById('hack-percentage');
  const hackFill = document.getElementById('hack-fill-bar');

  if (hackForm) {
    hackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const target = hackTargetCallsign.value.trim();
      if (!target) return;

      if (hackWrap) hackWrap.classList.remove('hidden');
      let pct = 0;
      playCyberSound(500, 'sawtooth', 0.1);

      const iv = setInterval(() => {
        pct += 20;
        if (hackPct) hackPct.textContent = `${pct}%`;
        if (hackFill) hackFill.style.width = `${pct}%`;

        if (pct >= 100) {
          clearInterval(iv);
          const siphonAmount = Math.floor(Math.random() * 150) + 50;
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
          alert(`[VIOLAZIONE RIUSCITA]\nICE di ${target} violato! Sottratti e trasferiti €$ ${siphonAmount} nel tuo wallet.`);
          hackTargetCallsign.value = '';
          setTimeout(() => {
            if (hackWrap) hackWrap.classList.add('hidden');
            if (hackFill) hackFill.style.width = '0%';
          }, 1000);
        }
      }, 300);
    });
  }

  // --------------------------------------------------------------------------
  // 7. Wallet Transfer & Transaction History
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
        <div class="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
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
  // 8. Health & Ripperdoc System
  // --------------------------------------------------------------------------
  const takeDamageBtn = document.getElementById('take-damage-btn');
  const resetHpBtn = document.getElementById('reset-hp-btn');
  const openRipperdocBtn = document.getElementById('open-ripperdoc-btn');
  const ripperdocModal = document.getElementById('ripperdoc-modal');
  const closeRipperdocBtn = document.getElementById('close-ripperdoc-btn');
  const executeHealBtn = document.getElementById('execute-heal-btn');

  if (takeDamageBtn) {
    takeDamageBtn.addEventListener('click', () => {
      player.hp = Math.max(0, player.hp - 25);
      if (player.hp <= 50 && player.traumas.length === 0) {
        player.traumas.push({ name: 'Ferita da Arma da Fuoco', desc: 'Mobilità ridotta al braccio secondario.' });
      }
      if (player.hp <= 0 && player.traumas.length < 2) {
        player.traumas.push({ name: 'Shock Neurale Critico', desc: 'Necessario riavvio cibernetico sulla Sedia del Ripperdoc.' });
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
      player.traumas = [];
      savePlayerState(player);
      playCyberSound(880, 'sine', 0.2);
      alert('[INTERVENTO COMPLETATO]\nPunti salute ripristinati al 100% e traumi azzerati con successo sulla sedia del Ripperdoc.');
      if (ripperdocModal) {
        ripperdocModal.classList.remove('opacity-100');
        setTimeout(() => ripperdocModal.classList.add('hidden', 'pointer-events-none'), 300);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Profile Callsign Modal
  // --------------------------------------------------------------------------
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
  // 10. In-Game Radio Chat
  // --------------------------------------------------------------------------
  let currentChatChannel = 'general';
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatSendForm = document.getElementById('chat-send-form');
  const chatTextInput = document.getElementById('chat-text-input');
  const currentChannelLabel = document.getElementById('current-channel-label');
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
          <div class="px-3.5 py-2 rounded-xl max-w-[85%] text-xs ${isMe ? 'bg-dive-orange/20 border border-dive-orange/30 text-white rounded-tr-none' : 'bg-black/60 border border-white/10 text-slate-200 rounded-tl-none'}">
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
        b.className = 'chat-channel-btn px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white';
      });
      btn.className = 'chat-channel-btn active px-3 py-1.5 rounded-lg border border-dive-cyan/40 bg-dive-cyan/15 text-dive-cyan font-semibold';
      currentChatChannel = btn.getAttribute('data-channel');
      
      const channelLabels = {
        general: '# FREQUENZA PUBBLICA CIMINIERE',
        squad: '# SQUADRA CORPO // CANALE PRIVATO',
        fixer: '# TAGLIE & CONTRATTI FIXER'
      };
      if (currentChannelLabel) currentChannelLabel.textContent = channelLabels[currentChatChannel] || '# RADIO';
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

      if (!player.chatMessages[currentChatChannel]) player.chatMessages[currentChatChannel] = [];
      player.chatMessages[currentChatChannel].push({
        author: player.callsign,
        text: text,
        time: timeStr,
        role: player.role
      });
      savePlayerState(player);
      chatTextInput.value = '';
      renderChat();
      playCyberSound(620, 'square', 0.05);
    });
  }

  // --------------------------------------------------------------------------
  // 11. Social Net Feed (Instagram-Style Minimalist UI)
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
      const stored = localStorage.getItem('dive_social_feed_posts_clean_v1');
      return stored ? JSON.parse(stored) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  }

  function saveSocialPosts(posts) {
    try {
      localStorage.setItem('dive_social_feed_posts_clean_v1', JSON.stringify(posts));
      renderSocialFeed();
    } catch (e) {
      console.warn(e);
    }
  }

  function renderSocialFeed() {
    if (!feedGrid) return;
    const posts = getSocialPosts();

    feedGrid.innerHTML = posts.map(post => {
      const isNews = post.type === 'news';
      const isAnon = post.isAnonymous;

      return `
        <article class="cyber-panel p-1.5 transition-all" data-id="${post.id}" data-type="${post.type}" data-anon="${isAnon ? 'true' : 'false'}">
          <div class="cyber-panel-inner p-4 sm:p-5 space-y-4">
            
            <!-- User Header (Clean Instagram-like structure) -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center font-mono font-bold text-xs text-dive-orange">
                  ${isAnon ? '🕵️' : (post.author ? post.author.slice(0, 2).toUpperCase() : 'RN')}
                </div>
                <div>
                  <div class="flex items-center gap-1 font-mono text-xs font-bold text-white">
                    <span>${isAnon ? 'Ghost Net (Anonimo)' : post.author}</span>
                    ${post.isVerified ? '<span class="text-dive-cyan text-[10px]" title="Verificato">✓</span>' : ''}
                  </div>
                  <div class="font-mono text-[10px] text-slate-500">${post.location || 'Settore 04'} • ${post.timestamp}</div>
                </div>
              </div>

              <span class="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-mono uppercase text-slate-400">
                ${isAnon ? 'LEAK' : (isNews ? 'NOTIZIA' : 'FOTO')}
              </span>
            </div>

            <!-- Image (if available) -->
            ${post.image ? `
              <div class="relative w-full rounded-xl overflow-hidden bg-black/80 border border-white/5">
                <img src="${post.image}" alt="Media Post" class="w-full h-auto object-cover max-h-[500px]">
              </div>
            ` : ''}

            <!-- Text Content -->
            <div class="space-y-1">
              ${post.title ? `<h3 class="font-orbitron font-bold text-sm sm:text-base text-white">${post.title}</h3>` : ''}
              <p class="text-xs sm:text-sm font-sans text-slate-300 leading-relaxed">${post.content}</p>
            </div>

            <!-- Interaction Bar -->
            <div class="pt-3 border-t border-white/5 flex items-center justify-between font-mono text-xs text-slate-400">
              <div class="flex items-center gap-4">
                <button class="social-like-btn flex items-center gap-1.5 hover:text-dive-orange transition-colors" data-id="${post.id}">
                  <svg class="w-4 h-4 text-dive-orange" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  <span class="font-bold text-white">${post.likes || 0}</span>
                </button>

                <button class="social-dislike-btn flex items-center gap-1.5 hover:text-dive-cyan transition-colors" data-id="${post.id}">
                  <svg class="w-4 h-4 text-dive-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <span>${post.dislikes || 0}</span>
                </button>
              </div>

              <button class="social-toggle-comments text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <span>${(post.comments && post.comments.length) || 0} commenti</span>
              </button>
            </div>

            <!-- Comment Drawer -->
            <div class="social-comments-wrap hidden pt-3 border-t border-white/5 space-y-2.5">
              <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                ${(post.comments && post.comments.length > 0) ? post.comments.map(c => `
                  <div class="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs">
                    <div class="flex justify-between font-mono text-[10px] text-dive-cyan mb-1">
                      <span class="font-bold">${c.author}</span>
                      <span class="text-slate-500">${c.time}</span>
                    </div>
                    <p class="text-slate-200 font-sans text-xs">${c.text}</p>
                  </div>
                `).join('') : '<span class="text-[11px] text-slate-500 italic block">Ancora nessun commento.</span>'}
              </div>

              <form class="social-add-comment-form flex gap-2 pt-1" data-id="${post.id}">
                <input type="text" placeholder="Aggiungi un commento..." class="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-dive-orange text-white text-xs outline-none" required>
                <button type="submit" class="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white hover:text-black text-white font-mono font-bold text-[11px] uppercase transition-colors">
                  Invia
                </button>
              </form>
            </div>

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

    // Like
    document.querySelectorAll('.social-like-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const p = posts.find(x => x.id === id);
        if (p) {
          p.likes = (p.likes || 0) + 1;
          saveSocialPosts(posts);
          playCyberSound(800, 'triangle', 0.08);
        }
      };
    });

    // Dislike
    document.querySelectorAll('.social-dislike-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const p = posts.find(x => x.id === id);
        if (p) {
          p.dislikes = (p.dislikes || 0) + 1;
          saveSocialPosts(posts);
          playCyberSound(400, 'sawtooth', 0.08);
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
        b.className = 'feed-filter-btn px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white whitespace-nowrap transition-colors';
      });
      btn.className = 'feed-filter-btn active px-3.5 py-1.5 rounded-full border border-dive-orange bg-dive-orange/15 text-dive-orange font-semibold whitespace-nowrap transition-colors';
      
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

  if (uploadPhotoForm) {
    uploadPhotoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = photoFileInput.files[0];
      const caption = photoCaptionInput.value.trim();

      const posts = getSocialPosts();
      const newPost = {
        id: 'post_' + Date.now(),
        type: 'photos',
        author: player.callsign,
        location: 'Settore 04 Ciminiere',
        isVerified: false,
        title: '',
        content: caption,
        image: file ? URL.createObjectURL(file) : 'assets/images/runner-post.jpg',
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
        isVerified: false,
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

  // Initialize UI
  syncPlayerUI();
  renderChat();
  renderSocialFeed();
});
