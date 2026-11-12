// ==========================================================================
// DIVE Cyberpunk Web App - Social Feed & Interactive Logic
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
        i.classList.remove('text-cyber-orange', 'text-cyber-cyan', 'active');
        i.classList.add('text-slate-400');
        const dot = i.querySelector('span:last-child');
        if (dot) dot.classList.replace('bg-cyber-orange', 'bg-transparent');
      });
      item.classList.add('text-cyber-orange', 'active');
      item.classList.remove('text-slate-400');
      const dot = item.querySelector('span:last-child');
      if (dot) dot.classList.replace('bg-transparent', 'bg-cyber-orange');
      playCyberSound(480, 'sine', 0.06);
    });
  });

  // 3. Explore Image Modal
  const modalTrigger = document.getElementById('modal-explore-trigger');
  const imageModal = document.getElementById('image-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openImageModal() {
    if (!imageModal) return;
    imageModal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
      imageModal.classList.add('opacity-100');
    }, 10);
    playCyberSound(580, 'sine', 0.12);
  }

  function closeImageModal() {
    if (!imageModal) return;
    imageModal.classList.remove('opacity-100');
    setTimeout(() => {
      imageModal.classList.add('hidden', 'pointer-events-none');
    }, 300);
    playCyberSound(290, 'sine', 0.08);
  }

  if (modalTrigger) modalTrigger.addEventListener('click', openImageModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeImageModal);
  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeImageModal();
    });
  }

  // 4. Social Feed Upload Modal & Storage
  const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
  const uploadModal = document.getElementById('upload-modal');
  const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
  const uploadForm = document.getElementById('upload-memory-form');
  const photoFileInput = document.getElementById('photo-file-input');
  const uploadPreviewWrap = document.getElementById('upload-preview-wrap');
  const uploadPreviewImg = document.getElementById('upload-preview-img');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const feedGrid = document.getElementById('social-feed-grid');
  const feedCountEl = document.getElementById('feed-count');

  let currentImageDataUrl = '';

  function openUploadModal() {
    if (!uploadModal) return;
    uploadModal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
      uploadModal.classList.add('opacity-100');
    }, 10);
    playCyberSound(620, 'square', 0.09);
  }

  function closeUploadModal() {
    if (!uploadModal) return;
    uploadModal.classList.remove('opacity-100');
    setTimeout(() => {
      uploadModal.classList.add('hidden', 'pointer-events-none');
      uploadForm.reset();
      currentImageDataUrl = '';
      if (uploadPreviewWrap && uploadPlaceholder) {
        uploadPreviewWrap.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
      }
    }, 300);
    playCyberSound(310, 'sine', 0.08);
  }

  if (openUploadModalBtn) openUploadModalBtn.addEventListener('click', openUploadModal);
  if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) closeUploadModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (uploadModal && !uploadModal.classList.contains('hidden')) closeUploadModal();
      if (imageModal && !imageModal.classList.contains('hidden')) closeImageModal();
    }
  });

  // Handle Photo File Selection & Client-Side Preview
  if (photoFileInput) {
    photoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        currentImageDataUrl = event.target.result;
        if (uploadPreviewImg && uploadPreviewWrap && uploadPlaceholder) {
          uploadPreviewImg.src = currentImageDataUrl;
          uploadPreviewWrap.classList.remove('hidden');
          uploadPlaceholder.classList.add('hidden');
        }
        playCyberSound(750, 'triangle', 0.07);
      };
      reader.readAsDataURL(file);
    });
  }

  // Load and Render User Uploaded Memories from LocalStorage
  function loadStoredMemories() {
    try {
      const stored = localStorage.getItem('dive_user_memories');
      const memories = stored ? JSON.parse(stored) : [];
      return memories;
    } catch {
      return [];
    }
  }

  function saveStoredMemories(memories) {
    try {
      localStorage.setItem('dive_user_memories', JSON.stringify(memories));
    } catch (err) {
      console.warn('Storage limit reached', err);
    }
  }

  function renderMemories() {
    if (!feedGrid) return;
    const memories = loadStoredMemories();
    const existingCards = feedGrid.querySelectorAll('.user-uploaded-card');
    existingCards.forEach(c => c.remove());

    memories.forEach((mem, index) => {
      const card = document.createElement('article');
      card.className = 'user-uploaded-card feed-card group rounded-3xl bg-[#070B14]/90 border border-cyber-orange/60 p-4 sm:p-5 flex flex-col justify-between backdrop-blur-xl hover:border-cyber-orange hover:shadow-[0_0_35px_rgba(255,102,0,0.45)] transition-all duration-300';
      card.setAttribute('data-category', mem.category || 'in-game');

      const avatarInitials = mem.author ? mem.author.replace('@', '').slice(0, 2).toUpperCase() : 'RN';

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full border border-cyber-orange bg-cyber-orange/20 flex items-center justify-center font-mono font-bold text-xs text-cyber-orange">
              ${avatarInitials}
            </div>
            <div>
              <span class="font-mono text-xs font-bold text-white block">${mem.author}</span>
              <span class="font-mono text-[10px] text-slate-400">${mem.timestamp}</span>
            </div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-cyber-orange/15 border border-cyber-orange/40 text-cyber-orange font-mono text-[9px] tracking-wider uppercase font-semibold">
            ${mem.category.toUpperCase()}
          </span>
        </div>

        <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3.5 bg-black border border-white/10 group-hover:border-cyber-orange/40 transition-colors">
          <img src="${mem.image}" alt="${mem.caption}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
          <div class="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 font-mono text-[9px] text-cyber-orange">
            USER_MEM_${index + 1}.RAW // NEURAL UPLOAD
          </div>
        </div>

        <div class="space-y-1.5 mb-4">
          <p class="text-sm font-sans text-slate-200 leading-snug">
            “${mem.caption}”
          </p>
          <div class="flex flex-wrap gap-1.5 font-mono text-[10px] text-cyber-orange">
            <span>#divelarp</span>
            <span>#runner_memory</span>
            <span>#dataspace</span>
          </div>
        </div>

        <div class="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-slate-400">
          <button class="like-btn flex items-center gap-1.5 hover:text-cyber-orange transition-colors" data-likes="${mem.likes || 1}">
            <span class="heart-icon">❤️</span>
            <span class="like-count font-bold">${mem.likes || 1}</span>
          </button>
          <div class="flex items-center gap-3">
            <span class="text-slate-500 text-[11px]">⚡ SINCRONIZZATO</span>
            <span class="text-cyber-orange font-bold text-[10px]">MEMORIA REALE</span>
          </div>
        </div>
      `;

      feedGrid.insertBefore(card, feedGrid.firstChild);
    });

    // Update count
    const totalCards = feedGrid.querySelectorAll('.feed-card').length;
    if (feedCountEl) feedCountEl.textContent = totalCards;
    attachLikeEvents();
  }

  // Handle Form Submission
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentImageDataUrl) {
        alert('Seleziona o scatta una foto per procedere.');
        return;
      }

      const handleInput = document.getElementById('runner-handle-input');
      const categorySelect = document.getElementById('category-select');
      const captionInput = document.getElementById('caption-input');

      let author = handleInput.value.trim();
      if (!author.startsWith('@')) author = '@' + author;

      const newMemory = {
        id: 'mem_' + Date.now(),
        author: author,
        category: categorySelect.value,
        caption: captionInput.value.trim(),
        image: currentImageDataUrl,
        timestamp: 'Poco fa',
        likes: 1
      };

      const memories = loadStoredMemories();
      memories.unshift(newMemory);
      saveStoredMemories(memories);

      renderMemories();
      closeUploadModal();
      playCyberSound(880, 'square', 0.15);

      // Scroll smoothly to feed
      const gallerySec = document.getElementById('gallery');
      if (gallerySec) gallerySec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 5. Category Filtering
  const filterBtns = document.querySelectorAll('.feed-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'border-cyber-orange', 'bg-cyber-orange/20', 'text-cyber-orange', 'font-bold');
        b.classList.add('border-white/10', 'bg-white/5', 'text-slate-400');
      });
      btn.classList.add('active', 'border-cyber-orange', 'bg-cyber-orange/20', 'text-cyber-orange', 'font-bold');
      btn.classList.remove('border-white/10', 'bg-white/5', 'text-slate-400');

      const filter = btn.getAttribute('data-filter');
      const cards = feedGrid.querySelectorAll('.feed-card');
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
      playCyberSound(500, 'sine', 0.05);
    });
  });

  // 6. Like Button Reactions
  function attachLikeEvents() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        let count = parseInt(btn.getAttribute('data-likes') || '0', 10);
        const isLiked = btn.classList.contains('liked');
        if (!isLiked) {
          count += 1;
          btn.classList.add('liked', 'text-cyber-orange');
          const countSpan = btn.querySelector('.like-count');
          if (countSpan) countSpan.textContent = count;
          btn.setAttribute('data-likes', count);
          playCyberSound(800, 'triangle', 0.09);
        }
      };
    });
  }

  renderMemories();

  // 7. Web Audio API Cyber SFX Synthesizer
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
        sfxToggle.classList.add('border-cyber-orange', 'text-cyber-orange');
        sfxToggle.classList.remove('border-cyber-cyan/40', 'text-cyber-cyan');
      }
      if (sfxMobileIcon) sfxMobileIcon.textContent = '🔊';
      playCyberSound(660, 'square', 0.1);
    } else {
      if (sfxLabel) sfxLabel.textContent = 'SFX: OFF';
      if (sfxToggle) {
        sfxToggle.classList.remove('border-cyber-orange', 'text-cyber-orange');
        sfxToggle.classList.add('border-cyber-cyan/40', 'text-cyber-cyan');
      }
      if (sfxMobileIcon) sfxMobileIcon.textContent = '🔇';
    }
  }

  if (sfxToggle) sfxToggle.addEventListener('click', toggleAudio);
  if (sfxMobileToggle) sfxMobileToggle.addEventListener('click', toggleAudio);

  // Attach hover/click sounds
  document.querySelectorAll('.cyber-btn-sound, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => playCyberSound(880, 'sine', 0.03));
    el.addEventListener('click', () => playCyberSound(520, 'triangle', 0.08));
  });

  // 8. Dynamic Telemetry Coordinates
  const coordEl = document.getElementById('telemetry-coord');
  if (coordEl) {
    setInterval(() => {
      const lat = (35.6895 + (Math.random() - 0.5) * 0.002).toFixed(4);
      const lon = (139.6917 + (Math.random() - 0.5) * 0.002).toFixed(4);
      coordEl.textContent = `SYS:${lat} // ${lon}`;
    }, 3500);
  }
});
