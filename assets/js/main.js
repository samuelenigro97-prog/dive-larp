// ==========================================================================
// DIVE Cyberpunk LARP - Complete Engine & Mechanics
// Based on LARP Design Call & Rulebook
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. Audio Synthesizer (Zero external dependencies)
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
  // 2. Player State & Roster Simulation
  // --------------------------------------------------------------------------
  const DEFAULT_PLAYER = {
    callsign: '@V_Solo',
    role: 'MERCENARIO // SOLO',
    secretId: '#V-7842',
    hp: 100,
    psych: 10,
    fama: 3,
    wallet: 1500,
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
    { callsign: '@V_Solo', role: 'MERCENARIO // SOLO', secretId: '#V-7842', hp: 100, psych: 10, wallet: 1500, ice: true },
    { callsign: '@Kuro_04', role: 'NETRUNNER // HACKER', secretId: '#K-4109', hp: 100, psych: 25, wallet: 850, ice: false },
    { callsign: '@Runner_Insolito', role: 'SOLO // VAGABONDO', secretId: '#R-9921', hp: 75, psych: 45, wallet: 320, ice: true },
    { callsign: '@CyberRex', role: 'CORPO // AGENTE', secretId: '#C-0012', hp: 100, psych: 0, wallet: 5400, ice: true },
    { callsign: '@Nico_Media', role: 'MEDIA // REPORTER', secretId: '#M-3384', hp: 100, psych: 15, wallet: 1200, ice: false }
  ];

  function getPlayerState() {
    try {
      const stored = localStorage.getItem('dive_player_state_v2');
      return stored ? { ...DEFAULT_PLAYER, ...JSON.parse(stored) } : DEFAULT_PLAYER;
    } catch {
      return DEFAULT_PLAYER;
    }
  }

  function savePlayerState(state) {
    try {
      localStorage.setItem('dive_player_state_v2', JSON.stringify(state));
      syncPlayerUI();
      renderAdminRoster();
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
      headerHp.className = player.hp > 50 ? 'text-dive-green font-bold' : (player.hp > 25 ? 'text-dive-orange font-bold' : 'text-dive-red font-bold animate-pulse');
    }
    if (headerBalance) headerBalance.textContent = player.wallet.toLocaleString();

    // Wallet display
    const walletBalanceDisplay = document.getElementById('wallet-balance-display');
    if (walletBalanceDisplay) walletBalanceDisplay.textContent = player.wallet.toLocaleString();

    // Profile Card
    const cardCallsign = document.getElementById('card-callsign');
    const cardRole = document.getElementById('card-role');
    const cardSecretId = document.getElementById('card-secret-id');
    const playerHpText = document.getElementById('player-hp-text');
    const playerHpBar = document.getElementById('player-hp-bar');
    const playerIceStatus = document.getElementById('player-ice-status');
    const playerPsychText = document.getElementById('player-psych-text');
    const playerPsychBar = document.getElementById('player-psych-bar');
    const playerPsychDesc = document.getElementById('player-psych-desc');

    if (cardCallsign) cardCallsign.textContent = player.callsign;
    if (cardRole) cardRole.textContent = player.role;
    if (cardSecretId) cardSecretId.textContent = player.secretId || '#V-7842';
    if (playerHpText) playerHpText.textContent = `${player.hp}% ${player.hp > 75 ? 'NOMINALE' : (player.hp > 30 ? 'FERITO' : 'CRITICO / FLATLINE')}`;
    if (playerHpBar) {
      playerHpBar.style.width = `${player.hp}%`;
      playerHpBar.className = `h-full transition-all duration-500 ${player.hp > 50 ? 'bg-dive-green' : (player.hp > 25 ? 'bg-dive-orange' : 'bg-dive-red')}`;
    }

    if (playerIceStatus) {
      playerIceStatus.textContent = player.iceActive ? 'ATTIVO (1 HIT)' : 'DISATTIVATO / BREACHED';
      playerIceStatus.className = player.iceActive ? 'text-dive-green font-bold text-xs mt-0.5' : 'text-dive-red font-bold text-xs mt-0.5';
    }

    // Cyberpsychosis
    if (playerPsychText && playerPsychBar && playerPsychDesc) {
      const p = player.psych || 0;
      playerPsychBar.style.width = `${Math.min(100, p)}%`;
      if (p < 25) {
        playerPsychText.textContent = `${p}% STABILE`;
        playerPsychText.className = 'text-dive-cyan font-bold';
        playerPsychBar.className = 'h-full bg-dive-cyan transition-all duration-500';
        playerPsychDesc.textContent = 'Attività sinaptica regolare. Nessun segnale di alienazione corporea.';
      } else if (p < 60) {
        playerPsychText.textContent = `${p}% AGITAZIONE`;
        playerPsychText.className = 'text-dive-orange font-bold';
        playerPsychBar.className = 'h-full bg-dive-orange transition-all duration-500';
        playerPsychDesc.textContent = 'Sovraccarico neurale lieve: battito accelerato e tremolio cibernetico.';
      } else if (p < 85) {
        playerPsychText.textContent = `${p}% DISSOCIAZIONE`;
        playerPsychText.className = 'text-dive-red font-bold';
        playerPsychBar.className = 'h-full bg-dive-red transition-all duration-500';
        playerPsychDesc.textContent = 'Allucinazioni uditive e distacco dalla realtà: recita paranoia con i compagni!';
      } else {
        playerPsychText.textContent = `${p}% CYBERPSICOSI!`;
        playerPsychText.className = 'text-dive-purple font-black animate-pulse';
        playerPsychBar.className = 'h-full bg-dive-purple animate-pulse transition-all duration-500';
        playerPsychDesc.textContent = '[CRITICO] CYBERPSICOSI CONCLAMATA: Perdita totale di controllo. Necessario intervento Ripperdoc immediato!';
      }
    }

    // Traumas
    const traumasList = document.getElementById('traumas-list');
    if (traumasList) {
      if (!player.traumas || player.traumas.length === 0) {
        traumasList.innerHTML = `<span class="text-slate-500 italic block">Nessun danno critico rilevato.</span>`;
      } else {
        traumasList.innerHTML = player.traumas.map(t => `
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
    if (modalQrCallsign) modalQrCallsign.textContent = player.callsign;
    if (modalQrSecretId) modalQrSecretId.textContent = player.secretId || '#V-7842';

    renderTransactions();
    renderPersonalQR();
  }

  // --------------------------------------------------------------------------
  // 3. Offline Vector QR Code Generator (Zero internet needed)
  // --------------------------------------------------------------------------
  function renderPersonalQR() {
    const container = document.getElementById('my-qr-svg-container');
    if (!container) return;

    // Generate procedural QR-like SVG matrix encoded with player secret ID & callsign
    const payload = `PLAYER:${player.callsign}:${player.secretId}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) - hash) + payload.charCodeAt(i);
      hash |= 0;
    }

    const size = 15;
    let rects = '';
    
    // Position detection corner patterns (Finder patterns)
    const finderSize = 4;
    function addFinder(startX, startY) {
      for (let y = 0; y < finderSize; y++) {
        for (let x = 0; x < finderSize; x++) {
          if (x === 0 || x === finderSize - 1 || y === 0 || y === finderSize - 1 || (x >= 1 && x <= 2 && y >= 1 && y <= 2)) {
            rects += `<rect x="${(startX + x) * 10}" y="${(startY + y) * 10}" width="10" height="10" fill="#04060A"/>`;
          }
        }
      }
    }

    addFinder(0, 0);
    addFinder(size - finderSize, 0);
    addFinder(0, size - finderSize);

    // Pseudorandom internal data points based on player payload
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Skip finder areas
        if ((x < finderSize && y < finderSize) || (x >= size - finderSize && y < finderSize) || (x < finderSize && y >= size - finderSize)) {
          continue;
        }
        const cellHash = Math.abs(Math.sin((x * 13 + y * 7 + hash)) * 10000) % 1;
        if (cellHash > 0.45) {
          rects += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="#04060A"/>`;
        }
      }
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${size * 10} ${size * 10}" class="w-full h-full object-contain">
        <rect width="${size * 10}" height="${size * 10}" fill="#FFFFFF"/>
        ${rects}
      </svg>
    `;
  }

  // --------------------------------------------------------------------------
  // 4. Tab Navigation System
  // --------------------------------------------------------------------------
  const tabTriggers = document.querySelectorAll('.nav-tab-trigger');
  const appTabs = document.querySelectorAll('.app-tab');

  const desktopGameNav = document.getElementById('desktop-game-nav');
  const mobileGameDock = document.getElementById('mobile-game-dock');

  function switchTab(tabId) {
    const isHome = tabId === 'home';

    if (desktopGameNav) {
      if (isHome) {
        desktopGameNav.classList.add('hidden');
        desktopGameNav.classList.remove('md:flex');
      } else {
        desktopGameNav.classList.add('hidden', 'md:flex');
      }
    }

    if (mobileGameDock) {
      if (isHome) {
        mobileGameDock.classList.add('hidden');
        mobileGameDock.classList.remove('md:hidden');
      } else {
        mobileGameDock.classList.remove('hidden');
        mobileGameDock.classList.add('md:hidden');
      }
    }

    appTabs.forEach(tab => {
      if (tab.id === `tab-${tabId}`) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
      } else {
        tab.classList.add('hidden');
        tab.classList.remove('active');
      }
    });

    // Desktop Nav
    document.querySelectorAll('nav button.nav-tab-trigger').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('text-dive-orange', 'font-bold', 'border-dive-orange');
        btn.classList.remove('text-slate-400', 'font-normal', 'border-transparent');
      } else {
        btn.classList.remove('text-dive-orange', 'font-bold', 'border-dive-orange');
        btn.classList.add('text-slate-400', 'font-normal', 'border-transparent');
      }
    });

    // Mobile Dock
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
  // 5. Quickhack 5-Seconds Combat Overlay
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

    qhCommandEl.textContent = `OVERRIDE ${commandName}`;
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
      launchQuickhackCombat(hack, desc);
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
    playCyberSound(750, 'square', 0.1);

    // Player QR scan detection (e.g. PLAYER:@Name:#Code or starts with #V-, #K-, #R-)
    if (code.startsWith('PLAYER:') || code.startsWith('#') || code.startsWith('@')) {
      let callsign = '@Runner';
      let secretId = '#NX-0000';

      if (code.startsWith('PLAYER:')) {
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
    const roster = [
      { callsign: player.callsign, role: player.role, secretId: player.secretId, hp: player.hp, psych: player.psych, wallet: player.wallet, ice: player.iceActive },
      ...ROSTER_SEED.filter(r => r.callsign !== player.callsign)
    ];

    adminRosterTbody.innerHTML = roster.map(r => `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="py-2.5 font-bold text-white">${r.callsign}</td>
        <td class="py-2.5 text-slate-400 text-[11px]">${r.role}</td>
        <td class="py-2.5 text-dive-cyan font-bold">${r.secretId}</td>
        <td class="py-2.5 ${r.hp > 50 ? 'text-dive-green' : 'text-dive-red'}">${r.hp}%</td>
        <td class="py-2.5 ${r.psych > 60 ? 'text-dive-red' : 'text-dive-cyan'}">${r.psych}%</td>
        <td class="py-2.5 text-dive-green">€$ ${r.wallet.toLocaleString()}</td>
        <td class="py-2.5 text-right font-bold ${r.ice ? 'text-dive-green' : 'text-slate-500'}">${r.ice ? 'ON' : 'OFF'}</td>
      </tr>
    `).join('');
  }

  // Initialize
  syncPlayerUI();
  renderChat();
  renderSocialFeed();
  renderAdminRoster();
});
