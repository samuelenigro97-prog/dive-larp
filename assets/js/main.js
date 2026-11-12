// ==========================================================================
// DIVE Cyberpunk LARP Companion App - Core Engine & Systems
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. Player Persistent State & Profile
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
    // Header
    const headerCallsign = document.getElementById('header-player-callsign');
    const headerHp = document.getElementById('header-hp');
    const headerBalance = document.getElementById('header-wallet-balance');
    if (headerCallsign) headerCallsign.textContent = player.callsign;
    if (headerHp) {
      headerHp.textContent = `${player.hp}%`;
      headerHp.className = player.hp > 50 ? 'text-cyber-green font-bold' : (player.hp > 25 ? 'text-cyber-orange font-bold' : 'text-cyber-red font-bold animate-pulse');
    }
    if (headerBalance) headerBalance.textContent = player.wallet.toLocaleString();

    // Wallet display
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
      playerHpBar.className = `h-full transition-all duration-500 ${player.hp > 50 ? 'bg-cyber-green' : (player.hp > 25 ? 'bg-cyber-orange' : 'bg-cyber-red')}`;
    }

    // Traumas list
    const traumasList = document.getElementById('traumas-list');
    if (traumasList) {
      if (!player.traumas || player.traumas.length === 0) {
        traumasList.innerHTML = `<span class="text-slate-500 italic block">Nessun danno critico rilevato. Sistemi ottimali.</span>`;
      } else {
        traumasList.innerHTML = player.traumas.map(t => `
          <div class="px-2.5 py-1 rounded bg-cyber-red/15 border border-cyber-red/40 text-cyber-red font-mono text-[10px] flex items-center justify-between">
            <span>⚠️ ${t.name}</span>
            <span class="text-[9px] text-slate-400">${t.desc}</span>
          </div>
        `).join('');
      }
    }

    renderTransactions();
  }

  // --------------------------------------------------------------------------
  // 2. Tab Navigation System (Single Page App Switching)
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

    // Update Desktop Nav
    document.querySelectorAll('nav button.nav-tab-trigger').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('text-cyber-orange', 'font-bold');
        btn.classList.remove('text-slate-300');
      } else {
        btn.classList.remove('text-cyber-orange', 'font-bold');
        btn.classList.add('text-slate-300');
      }
    });

    // Update Mobile Dock Items
    document.querySelectorAll('.mobile-dock-item').forEach(btn => {
      const dot = btn.querySelector('span:last-child');
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('text-cyber-orange', 'active');
        btn.classList.remove('text-slate-400');
        if (dot) dot.classList.replace('bg-transparent', 'bg-cyber-orange');
      } else {
        btn.classList.remove('text-cyber-orange', 'active');
        btn.classList.add('text-slate-400');
        if (dot) dot.classList.replace('bg-cyber-orange', 'bg-transparent');
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
  // 3. Live HUD Clock
  // --------------------------------------------------------------------------
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;
    
    const mClock = document.getElementById('mobile-live-clock');
    const dClock = document.getElementById('desktop-live-clock');
    if (mClock) mClock.textContent = timeStr;
    if (dClock) dClock.textContent = timeStr;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // --------------------------------------------------------------------------
  // 4. Quickhack 5-Seconds Combat Overlay (as per design doc)
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

    playCyberSound(950, 'sawtooth', 0.2);

    const stepMs = 100;
    qhInterval = setInterval(() => {
      timeLeft -= (stepMs / 1000);
      if (timeLeft <= 0) {
        clearInterval(qhInterval);
        qhSecondsTimer.textContent = '0.0';
        qhTimerBar.style.width = '0%';
        playCyberSound(300, 'square', 0.3);
        setTimeout(() => {
          closeQuickhackOverlay();
        }, 800);
      } else {
        qhSecondsTimer.textContent = timeLeft.toFixed(1);
        const pct = (timeLeft / 5.0) * 100;
        qhTimerBar.style.width = `${pct}%`;
        playCyberSound(650, 'sine', 0.02);
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
    playCyberSound(750, 'square', 0.12);

    if (code.includes('GREEN') || code.startsWith('RIPPER') || code.startsWith('CYB-G')) {
      // 🟢 Verde: Impianti e Ripperdoc
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green';
      scanBadge.textContent = '🟢 IMPIANTO VERDE';
      scanOutputText.textContent = `[ACCESSO CONCESSO] Scanner Kiroshi rileva impianto Ripperdoc compatibile: "Stabilizzatore Neurale Mk.3". Salute +25% e rimozione shock.`;
      
      player.hp = Math.min(100, player.hp + 25);
      player.traumas = [];
      savePlayerState(player);

    } else if (code.includes('BLUE') || code.startsWith('TERM') || code.startsWith('CYB-B')) {
      // 🔵 Blu: Dispositivi hackerabili
      const lootedEddies = Math.floor(Math.random() * 200) + 100;
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan';
      scanBadge.textContent = '🔵 DISPOSITIVO BLU';
      scanOutputText.textContent = `[HACKING RIUSCITO] Terminale di sicurezza forzato! Estratti dati riservati e trasferiti +€$ ${lootedEddies} nel tuo Wallet.`;
      
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
      // 🔴 Rosso: Casseforti, allarmi, ICE
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-cyber-red/20 text-cyber-red border border-cyber-red';
      scanBadge.textContent = '🔴 CASSAFORTE ROSSA / ICE';
      scanOutputText.textContent = `[ALLARME SICUREZZA] Dispositivo ad alto rischio! Richiesto Quickhack "AL BUIO!" entro 5s per neutralizzare l'allarme sonoro.`;
      launchQuickhackCombat('AL BUIO!', 'Neutralizza il sensore rosso entro 5 secondi o scatterà la sirena!');

    } else {
      // Codice generico
      scanBadge.className = 'px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-cyber-orange/20 text-cyber-orange border border-cyber-orange';
      scanBadge.textContent = 'DATASHARD GENERICO';
      scanOutputText.textContent = `Codice [${code}] decifrato: Log di trasmissione registrato nel dataspace.`;
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
        const qrReaderDiv = document.getElementById('qr-reader');
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
          (errorMessage) => {
            // scan search frame
          }
        ).catch(err => {
          alert('Accesso alla fotocamera non disponibile o rifiutato. Usa il campo codice a mano qui sotto!');
          if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
        });
      } else {
        alert('Scanner fotocamera non supportato su questo browser. Inserisci il codice a mano!');
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

      hackWrap.classList.remove('hidden');
      hackForm.querySelector('button').disabled = true;

      let pct = 0;
      const hackInterval = setInterval(() => {
        pct += 10;
        hackPct.textContent = `${pct}%`;
        hackFill.style.width = `${pct}%`;
        playCyberSound(400 + pct * 5, 'sawtooth', 0.04);

        if (pct >= 100) {
          clearInterval(hackInterval);
          hackForm.querySelector('button').disabled = false;
          hackWrap.classList.add('hidden');
          hackFill.style.width = '0%';

          const stolen = Math.floor(Math.random() * 150) + 50;
          player.wallet += stolen;
          player.transactions.unshift({
            id: 'tx_' + Date.now(),
            type: 'in',
            desc: `Sifone Crediti da ${target}`,
            amount: stolen,
            time: 'Adesso'
          });
          savePlayerState(player);
          alert(`[VIOLAZIONE COMPLETATA]\nSifone eseguito con successo su ${target}!\nTrasferiti +€$ ${stolen} nel tuo conto.`);
          hackTargetCallsign.value = '';
        }
      }, 250);
    });
  }

  // --------------------------------------------------------------------------
  // 7. Wallet & Transaction History Engine
  // --------------------------------------------------------------------------
  const transferForm = document.getElementById('transfer-money-form');
  const recipientInput = document.getElementById('transfer-recipient-input');
  const amountInput = document.getElementById('transfer-amount-input');
  const txHistoryList = document.getElementById('transaction-history-list');

  function renderTransactions() {
    if (!txHistoryList) return;
    if (!player.transactions || player.transactions.length === 0) {
      txHistoryList.innerHTML = `<p class="text-slate-500 italic">Nessun movimento recente registrato.</p>`;
      return;
    }

    txHistoryList.innerHTML = player.transactions.map(tx => `
      <div class="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${tx.type === 'in' ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-red/20 text-cyber-red'}">
            ${tx.type === 'in' ? '+' : '-'}
          </span>
          <div>
            <span class="text-white block font-sans">${tx.desc}</span>
            <span class="text-[10px] text-slate-500">${tx.time}</span>
          </div>
        </div>
        <span class="font-bold text-sm ${tx.type === 'in' ? 'text-cyber-green' : 'text-cyber-red'}">
          ${tx.type === 'in' ? '+' : '-'}€$ ${tx.amount.toLocaleString()}
        </span>
      </div>
    `).join('');
  }

  if (transferForm) {
    transferForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseInt(amountInput.value, 10);
      const recipient = recipientInput.value.trim();

      if (amount > player.wallet) {
        alert('Fondi insufficienti! Il tuo saldo non copre questo importo.');
        return;
      }

      player.wallet -= amount;
      player.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'out',
        desc: `Bonifico P2P verso ${recipient}`,
        amount: amount,
        time: 'Poco fa'
      });
      savePlayerState(player);

      recipientInput.value = '';
      amountInput.value = '';
      playCyberSound(880, 'square', 0.1);
      alert(`[TRANSAZIONE ESEGUITA]\nTrasferiti €$ ${amount} a ${recipient}. Ricevuta emessa sul dataspace.`);
    });
  }

  // --------------------------------------------------------------------------
  // 8. Health, Damage & Ripperdoc Chair
  // --------------------------------------------------------------------------
  const takeDamageBtn = document.getElementById('take-damage-btn');
  const resetHpBtn = document.getElementById('reset-hp-btn');
  const openRipperdocBtn = document.getElementById('open-ripperdoc-btn');
  const ripperdocModal = document.getElementById('ripperdoc-modal');
  const closeRipperdocBtn = document.getElementById('close-ripperdoc-btn');
  const executeHealBtn = document.getElementById('execute-heal-btn');

  const TRAUMA_TYPES = [
    { name: 'Shock Neurale da Sotto-voltaggio', desc: '-10% velocità di reazione' },
    { name: 'Giunto Cibernetico Compromesso', desc: 'Arto zoppicante' },
    { name: 'Emorragia Sottopelle', desc: 'Necessaria assistenza medica' },
    { name: 'Glitch Ottico Kiroshi', desc: 'Visione disturbata' }
  ];

  if (takeDamageBtn) {
    takeDamageBtn.addEventListener('click', () => {
      player.hp = Math.max(0, player.hp - 25);
      if (player.hp < 75) {
        const randomTrauma = TRAUMA_TYPES[Math.floor(Math.random() * TRAUMA_TYPES.length)];
        if (!player.traumas.some(t => t.name === randomTrauma.name)) {
          player.traumas.push(randomTrauma);
        }
      }
      savePlayerState(player);
      playCyberSound(250, 'sawtooth', 0.15);
    });
  }

  if (resetHpBtn) {
    resetHpBtn.addEventListener('click', () => {
      player.hp = Math.min(100, player.hp + 25);
      savePlayerState(player);
      playCyberSound(650, 'sine', 0.08);
    });
  }

  if (openRipperdocBtn && ripperdocModal) {
    openRipperdocBtn.addEventListener('click', () => {
      ripperdocModal.classList.remove('hidden', 'pointer-events-none');
      setTimeout(() => ripperdocModal.classList.add('opacity-100'), 10);
      playCyberSound(550, 'triangle', 0.09);
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
      alert('[INTERVENTO COMPLETATO]\nPunti salute ripristinati a 100% e traumi suturati con successo sulla sedia del Ripperdoc.');
      if (ripperdocModal) {
        ripperdocModal.classList.remove('opacity-100');
        setTimeout(() => ripperdocModal.classList.add('hidden', 'pointer-events-none'), 300);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Profile Callsign Switcher Modal
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
  // 10. In-Game Radio Chat Channels
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
          <div class="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 mb-0.5">
            <span class="font-bold ${isMe ? 'text-cyber-orange' : 'text-cyber-cyan'}">${msg.author}</span>
            <span class="text-[9px] text-slate-500">• ${msg.time}</span>
          </div>
          <div class="px-3.5 py-2 rounded-2xl max-w-[85%] text-xs ${isMe ? 'bg-cyber-orange/20 border border-cyber-orange/40 text-white rounded-tr-none' : 'bg-black/60 border border-white/10 text-slate-200 rounded-tl-none'}">
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
        b.className = 'chat-channel-btn px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white';
      });
      btn.className = 'chat-channel-btn active px-3.5 py-1.5 rounded-xl border border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan font-bold';
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
      playCyberSound(620, 'square', 0.07);
    });
  }

  // --------------------------------------------------------------------------
  // 11. Social Net (Likes, Dislikes, Anonymous Leaks & Live Comments)
  // --------------------------------------------------------------------------
  const feedGrid = document.getElementById('social-feed-grid');
  const feedCountEl = document.getElementById('feed-count');

  const INITIAL_POSTS = [
    {
      id: 'post_corp_1',
      type: 'news',
      author: 'DIVE_Network',
      isVerified: true,
      title: '[ALERT] Nuova Corporation Rilevata nel Settore Ciminiere',
      content: 'Le frequenze neurali confermano movimenti non autorizzati nell\'area industriale. I fixer locali hanno iniziato ad arruolare mercenari e netrunner per la prossima missione.',
      image: null,
      timestamp: '1 ora fa',
      likes: 84,
      dislikes: 3,
      comments: [
        { author: '@V_Solo', text: 'Ho già calibrato le ottiche. Ci vediamo sul campo Choom.', time: '45 min fa' },
        { author: '@NetPhantom', text: 'Qualcuno sa quali ICE proteggono i terminali della nuova corp?', time: '20 min fa' }
      ]
    },
    {
      id: 'post_photo_1',
      type: 'photos',
      author: '@Runner_Insolito',
      isVerified: false,
      title: '',
      content: '“Hey Choom, ho avuto notizia di un Runner insolito, porta con sé del cromo particolare...”',
      image: 'assets/images/runner-post.jpg',
      timestamp: '29 mag',
      likes: 62,
      dislikes: 1,
      comments: [
        { author: '@CyberRex', text: 'Quel visore è illegale nella maggior parte dei distretti!', time: 'Ieri' }
      ]
    }
  ];

  function getSocialPosts() {
    try {
      const stored = localStorage.getItem('dive_social_feed_posts');
      return stored ? JSON.parse(stored) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  }

  function saveSocialPosts(posts) {
    try {
      localStorage.setItem('dive_social_feed_posts', JSON.stringify(posts));
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
      const borderCol = isNews ? 'border-cyber-cyan/40 hover:border-cyber-cyan' : 'border-cyber-orange/40 hover:border-cyber-orange';
      const accentCol = isNews ? 'text-cyber-cyan' : 'text-cyber-orange';

      return `
        <article class="feed-card group rounded-3xl bg-[#070B14]/90 border ${borderCol} p-5 flex flex-col justify-between backdrop-blur-xl transition-all duration-300" data-id="${post.id}" data-type="${post.type}" data-anon="${isAnon ? 'true' : 'false'}">
          
          <div>
            <div class="flex items-center justify-between mb-3.5">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center font-mono font-bold text-xs ${accentCol}">
                  ${isAnon ? '🕵️' : (post.author ? post.author.slice(0, 2).toUpperCase() : 'RN')}
                </div>
                <div>
                  <span class="font-mono text-xs font-bold text-white flex items-center gap-1">
                    <span>${isAnon ? 'Anonimo // Ghost Net' : post.author}</span>
                    ${post.isVerified ? '<span class="text-cyber-cyan text-[10px]">✔</span>' : ''}
                  </span>
                  <span class="font-mono text-[10px] text-slate-500">${post.timestamp}</span>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${accentCol} font-mono text-[9px] uppercase font-bold">
                ${isAnon ? 'LEAK ANONIMO' : (isNews ? 'NOTIZIA' : 'FOTO')}
              </span>
            </div>

            ${post.image ? `
              <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3.5 bg-black border border-white/10">
                <img src="${post.image}" alt="Media" class="w-full h-full object-cover">
              </div>
            ` : ''}

            <div class="space-y-1.5 mb-4">
              ${post.title ? `<h3 class="font-orbitron font-bold text-base text-white mb-1">${post.title}</h3>` : ''}
              <p class="text-sm font-sans text-slate-200 leading-snug">${post.content}</p>
            </div>
          </div>

          <div>
            <!-- Like / Dislike / Comments Bar -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-slate-400">
              <div class="flex items-center gap-3">
                <button class="social-like-btn flex items-center gap-1 hover:text-cyber-orange transition-colors" data-id="${post.id}">
                  <span>❤️</span>
                  <span class="font-bold">${post.likes || 0}</span>
                </button>
                <button class="social-dislike-btn flex items-center gap-1 hover:text-cyber-cyan transition-colors" data-id="${post.id}">
                  <span>⚡</span>
                  <span class="font-bold">${post.dislikes || 0}</span>
                </button>
              </div>

              <button class="social-toggle-comments text-cyber-cyan hover:text-white font-bold text-[11px] flex items-center gap-1">
                <span>💬</span>
                <span>${(post.comments && post.comments.length) || 0} Commenti</span>
              </button>
            </div>

            <!-- Thread -->
            <div class="social-comments-wrap hidden mt-3 pt-3 border-t border-white/10 space-y-2">
              <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                ${(post.comments && post.comments.length > 0) ? post.comments.map(c => `
                  <div class="p-2 rounded-xl bg-black/60 border border-white/10 text-xs">
                    <div class="flex justify-between font-mono text-[10px] text-cyber-cyan mb-0.5">
                      <span class="font-bold">${c.author}</span>
                      <span class="text-slate-500">${c.time}</span>
                    </div>
                    <p class="text-slate-200 font-sans">${c.text}</p>
                  </div>
                `).join('') : '<span class="text-[10px] text-slate-500 italic block">Nessuna risposta. Sii il primo!</span>'}
              </div>

              <form class="social-add-comment-form flex gap-1.5 pt-1" data-id="${post.id}">
                <input type="text" placeholder="Rispondi..." class="flex-1 px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 focus:border-cyber-cyan text-white text-xs outline-none" required>
                <button type="submit" class="px-3 py-1.5 rounded-lg bg-cyber-cyan text-black font-mono font-bold text-[10px] uppercase">
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

    // Toggle comments
    document.querySelectorAll('.social-toggle-comments').forEach(btn => {
      btn.onclick = () => {
        const wrap = btn.closest('article').querySelector('.social-comments-wrap');
        if (wrap) wrap.classList.toggle('hidden');
      };
    });

    // Likes
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

    // Dislikes
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

    // Add comment
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
        b.className = 'feed-filter-btn px-4 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-cyber-cyan whitespace-nowrap transition-colors';
      });
      btn.className = 'feed-filter-btn active px-4 py-2 rounded-full border border-cyber-orange bg-cyber-orange/20 text-cyber-orange font-bold whitespace-nowrap transition-colors';
      
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

  // --------------------------------------------------------------------------
  // 12. Audio SFX Synthesizer
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let sfxEnabled = true;
  const sfxToggle = document.getElementById('sfx-toggle');
  const sfxLabel = document.getElementById('sfx-label');
  const sfxMobileToggle = document.getElementById('sfx-mobile-toggle');

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

  function toggleAudio() {
    sfxEnabled = !sfxEnabled;
    if (sfxLabel) sfxLabel.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';
    const icon = sfxEnabled ? '🔊' : '🔇';
    const mIcon = document.getElementById('sfx-mobile-icon');
    if (mIcon) mIcon.textContent = icon;
    const sIcon = document.getElementById('sfx-icon');
    if (sIcon) sIcon.textContent = icon;
    if (sfxEnabled) playCyberSound(660, 'square', 0.1);
  }

  if (sfxToggle) sfxToggle.addEventListener('click', toggleAudio);
  if (sfxMobileToggle) sfxMobileToggle.addEventListener('click', toggleAudio);

  // Initialize
  syncPlayerUI();
  renderChat();
  renderSocialFeed();
});
