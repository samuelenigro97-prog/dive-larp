// ==========================================================================
// DIVE Cyberpunk Web App - Client Logic & Micro-Interactions
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburgerIcon = document.getElementById('hamburger-icon');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        hamburgerIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        `;
        playCyberSound(440, 'triangle', 0.08);
      } else {
        mobileMenu.classList.add('hidden');
        hamburgerIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        `;
        playCyberSound(330, 'triangle', 0.06);
      }
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        hamburgerIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        `;
      });
    });
  }

  // 2. Explore Image Modal
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

  // 3. Web Audio API Cyber SFX Synthesizer
  let audioCtx = null;
  let sfxEnabled = false;
  const sfxToggle = document.getElementById('sfx-toggle');
  const sfxLabel = document.getElementById('sfx-label');

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
      // Audio fallback silent
    }
  }

  if (sfxToggle && sfxLabel) {
    sfxToggle.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      if (sfxEnabled) {
        getAudioContext();
        sfxLabel.textContent = 'SFX: ON';
        sfxToggle.classList.add('border-cyber-lime', 'text-cyber-lime');
        sfxToggle.classList.remove('border-cyber-cyan/30', 'text-cyber-cyan');
        playCyberSound(660, 'square', 0.1);
      } else {
        sfxLabel.textContent = 'SFX: OFF';
        sfxToggle.classList.remove('border-cyber-lime', 'text-cyber-lime');
        sfxToggle.classList.add('border-cyber-cyan/30', 'text-cyber-cyan');
      }
    });
  }

  // Attach click sound to interactive elements
  document.querySelectorAll('.cyber-btn-sound, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => playCyberSound(880, 'sine', 0.03));
    el.addEventListener('click', () => playCyberSound(520, 'triangle', 0.08));
  });

  // 4. Dynamic Telemetry Coordinates
  const coordEl = document.getElementById('telemetry-coord');
  if (coordEl) {
    setInterval(() => {
      const lat = (35.6895 + (Math.random() - 0.5) * 0.002).toFixed(4);
      const lon = (139.6917 + (Math.random() - 0.5) * 0.002).toFixed(4);
      coordEl.textContent = `SYS:${lat} // ${lon}`;
    }, 3500);
  }
});
