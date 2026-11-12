// ==========================================================================
// DIVE Cyberpunk Web App - Client Logic & Micro-Interactions
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Live Mobile HUD Clock
  const mobileClock = document.getElementById('mobile-live-clock');
  function updateClock() {
    if (!mobileClock) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    mobileClock.textContent = `${h}:${m}:${s}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Mobile Dock Active Tab Highlight
  const dockItems = document.querySelectorAll('.mobile-dock-item');
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      dockItems.forEach(i => {
        i.classList.remove('text-cyber-cyan', 'active');
        i.classList.add('text-slate-400');
        const dot = i.querySelector('span:last-child');
        if (dot) dot.classList.replace('bg-cyber-cyan', 'bg-transparent');
      });
      item.classList.add('text-cyber-cyan', 'active');
      item.classList.remove('text-slate-400');
      const dot = item.querySelector('span:last-child');
      if (dot) dot.classList.replace('bg-transparent', 'bg-cyber-cyan');
      playCyberSound(480, 'sine', 0.06);
    });
  });

  // 3. Explore Image Modal
  const modalTrigger = document.getElementById('modal-explore-trigger');
  const imageModal = document.getElementById('image-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openModal() {
    if (!imageModal) return;
    imageModal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
      imageModal.classList.add('opacity-100');
    }, 10);
    playCyberSound(580, 'sine', 0.12);
  }

  function closeModal() {
    if (!imageModal) return;
    imageModal.classList.remove('opacity-100');
    setTimeout(() => {
      imageModal.classList.add('hidden', 'pointer-events-none');
    }, 300);
    playCyberSound(290, 'sine', 0.08);
  }

  if (modalTrigger) modalTrigger.addEventListener('click', openModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal && !imageModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 4. Web Audio API Cyber SFX Synthesizer
  let audioCtx = null;
  let sfxEnabled = false;
  const sfxToggle = document.getElementById('sfx-toggle');
  const sfxLabel = document.getElementById('sfx-label');
  const sfxMobileToggle = document.getElementById('sfx-mobile-toggle');
  const sfxMobileIcon = document.getElementById('sfx-mobile-icon');

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
      // Audio fallback
    }
  }

  function toggleAudio() {
    sfxEnabled = !sfxEnabled;
    if (sfxEnabled) {
      getAudioContext();
      if (sfxLabel) sfxLabel.textContent = 'SFX: ON';
      if (sfxToggle) {
        sfxToggle.classList.add('border-cyber-cyan', 'text-cyber-cyan');
      }
      if (sfxMobileIcon) sfxMobileIcon.textContent = '🔊';
      playCyberSound(660, 'square', 0.1);
    } else {
      if (sfxLabel) sfxLabel.textContent = 'SFX: OFF';
      if (sfxMobileIcon) sfxMobileIcon.textContent = '🔇';
    }
  }

  if (sfxToggle) sfxToggle.addEventListener('click', toggleAudio);
  if (sfxMobileToggle) sfxMobileToggle.addEventListener('click', toggleAudio);

  // Attach click sound to interactive elements
  document.querySelectorAll('.cyber-btn-sound, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => playCyberSound(880, 'sine', 0.03));
    el.addEventListener('click', () => playCyberSound(520, 'triangle', 0.08));
  });

  // 5. Dynamic Telemetry Coordinates
  const coordEl = document.getElementById('telemetry-coord');
  if (coordEl) {
    setInterval(() => {
      const lat = (35.6895 + (Math.random() - 0.5) * 0.002).toFixed(4);
      const lon = (139.6917 + (Math.random() - 0.5) * 0.002).toFixed(4);
      coordEl.textContent = `SYS:${lat} // ${lon}`;
    }, 3500);
  }
});
