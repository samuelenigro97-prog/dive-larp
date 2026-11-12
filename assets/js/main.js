// ==========================================================================
// DIVE Cyberpunk Web App - The Net Social & News Engine with Live Comments
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

  // 3. Publish Modal Logic (News vs Photo Tab Switcher)
  const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
  const openPublishNewsBtn = document.getElementById('open-publish-news-btn');
  const mobileQuickPostBtn = document.getElementById('mobile-quick-post-btn');
  const publishModal = document.getElementById('publish-modal');
  const closePublishModalBtn = document.getElementById('close-publish-modal-btn');
  const switchTabPhoto = document.getElementById('switch-tab-photo');
  const switchTabNews = document.getElementById('switch-tab-news');
  const publishTypeInput = document.getElementById('publish-type');
  const formPhotoContainer = document.getElementById('form-photo-container');
  const formNewsTitleContainer = document.getElementById('form-news-title-container');
  const publishForm = document.getElementById('publish-item-form');
  const photoFileInput = document.getElementById('photo-file-input');
  const uploadPreviewWrap = document.getElementById('upload-preview-wrap');
  const uploadPreviewImg = document.getElementById('upload-preview-img');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const feedGrid = document.getElementById('social-feed-grid');
  const feedCountEl = document.getElementById('feed-count');

  let currentImageDataUrl = '';

  function openPublishModal(defaultMode = 'photos') {
    if (!publishModal) return;
    setPublishMode(defaultMode);
    publishModal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
      publishModal.classList.add('opacity-100');
    }, 10);
    playCyberSound(620, 'square', 0.09);
  }

  function closePublishModal() {
    if (!publishModal) return;
    publishModal.classList.remove('opacity-100');
    setTimeout(() => {
      publishModal.classList.add('hidden', 'pointer-events-none');
      publishForm.reset();
      currentImageDataUrl = '';
      if (uploadPreviewWrap && uploadPlaceholder) {
        uploadPreviewWrap.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
      }
    }, 300);
    playCyberSound(310, 'sine', 0.08);
  }

  function setPublishMode(mode) {
    if (!publishTypeInput) return;
    publishTypeInput.value = mode;
    if (mode === 'photos') {
      switchTabPhoto.className = 'py-2 rounded-xl bg-cyber-orange text-black font-bold uppercase tracking-wider transition-colors';
      switchTabNews.className = 'py-2 rounded-xl text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors';
      formPhotoContainer.classList.remove('hidden');
      formNewsTitleContainer.classList.add('hidden');
    } else {
      switchTabNews.className = 'py-2 rounded-xl bg-cyber-cyan text-black font-bold uppercase tracking-wider transition-colors';
      switchTabPhoto.className = 'py-2 rounded-xl text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors';
      formPhotoContainer.classList.add('hidden');
      formNewsTitleContainer.classList.remove('hidden');
    }
  }

  if (openUploadModalBtn) openUploadModalBtn.addEventListener('click', () => openPublishModal('photos'));
  if (openPublishNewsBtn) openPublishNewsBtn.addEventListener('click', () => openPublishModal('news'));
  if (mobileQuickPostBtn) mobileQuickPostBtn.addEventListener('click', () => openPublishModal('photos'));
  if (closePublishModalBtn) closePublishModalBtn.addEventListener('click', closePublishModal);
  if (switchTabPhoto) switchTabPhoto.addEventListener('click', () => setPublishMode('photos'));
  if (switchTabNews) switchTabNews.addEventListener('click', () => setPublishMode('news'));

  if (publishModal) {
    publishModal.addEventListener('click', (e) => {
      if (e.target === publishModal) closePublishModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && publishModal && !publishModal.classList.contains('hidden')) {
      closePublishModal();
    }
  });

  // Handle Photo Preview
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

  // 4. LocalStorage Data Management for Posts & Comments
  function getStoredPosts() {
    try {
      const stored = localStorage.getItem('dive_cyber_posts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveStoredPosts(posts) {
    try {
      localStorage.setItem('dive_cyber_posts', JSON.stringify(posts));
    } catch (err) {
      console.warn('Storage limit', err);
    }
  }

  function getStoredComments() {
    try {
      const stored = localStorage.getItem('dive_cyber_comments');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  function saveStoredComments(comments) {
    try {
      localStorage.setItem('dive_cyber_comments', JSON.stringify(comments));
    } catch (err) {
      console.warn('Storage error', err);
    }
  }

  // Render Dynamic Posts and Hydrate Existing Ones
  function renderAllPosts() {
    if (!feedGrid) return;
    const userPosts = getStoredPosts();
    feedGrid.querySelectorAll('.user-generated-post').forEach(el => el.remove());

    userPosts.forEach(post => {
      const card = document.createElement('article');
      card.className = `user-generated-post feed-card group rounded-3xl bg-[#070B14]/90 border ${post.type === 'news' ? 'border-cyber-cyan/50 hover:shadow-[0_0_35px_rgba(0,240,255,0.35)]' : 'border-cyber-orange/50 hover:shadow-[0_0_35px_rgba(255,102,0,0.35)]'} p-5 flex flex-col justify-between backdrop-blur-xl transition-all duration-300`;
      card.setAttribute('data-id', post.id);
      card.setAttribute('data-type', post.type);

      const avatarLetter = post.author ? post.author.replace('@', '').slice(0, 2).toUpperCase() : 'RN';
      const badgeColor = post.type === 'news' ? 'bg-cyber-cyan/20 border-cyber-cyan/40 text-cyber-cyan' : 'bg-cyber-orange/15 border-cyber-orange/30 text-cyber-orange';
      const accentText = post.type === 'news' ? 'text-cyber-cyan' : 'text-cyber-orange';

      let mediaHtml = '';
      if (post.type === 'photos' && post.image) {
        mediaHtml = `
          <div class="relative w-full aspect-square rounded-2xl overflow-hidden mb-3.5 bg-black border border-white/10 group-hover:border-cyber-orange/30 transition-colors">
            <img src="${post.image}" alt="${post.caption || 'Foto Runner'}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
            <div class="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 font-mono text-[9px] text-cyber-orange">
              DATASPACE_LOG_${post.id.slice(-4)}.RAW
            </div>
          </div>
        `;
      }

      let titleHtml = '';
      if (post.type === 'news' && post.title) {
        titleHtml = `
          <h3 class="font-orbitron font-bold text-lg text-white group-hover:text-cyber-cyan transition-colors mb-2">
            ${post.title}
          </h3>
        `;
      }

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full border border-cyber-orange bg-cyber-orange/20 flex items-center justify-center font-mono font-bold text-xs text-cyber-orange">
                ${avatarLetter}
              </div>
              <div>
                <span class="font-mono text-xs font-bold text-white block">${post.author}</span>
                <span class="font-mono text-[10px] text-slate-400">${post.timestamp}</span>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full ${badgeColor} font-mono text-[9px] tracking-wider uppercase font-bold border">
              ${post.type === 'news' ? '📰 NOTIZIA' : '📸 FOTO'}
            </span>
          </div>

          ${mediaHtml}

          <div class="space-y-1.5 mb-4">
            ${titleHtml}
            <p class="text-sm font-sans text-slate-200 leading-snug">
              “${post.content || post.caption || ''}”
            </p>
            <div class="flex flex-wrap gap-1.5 font-mono text-[10px] ${accentText}">
              <span>#divelarp</span>
              <span>#the_net</span>
              <span>#live_update</span>
            </div>
          </div>
        </div>

        <div>
          <div class="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-slate-400">
            <button class="like-btn flex items-center gap-1.5 hover:${accentText} transition-colors" data-likes="${post.likes || 1}">
              <span class="heart-icon">❤️</span>
              <span class="like-count font-bold">${post.likes || 1}</span>
            </button>
            
            <button class="toggle-comments-btn ${accentText} hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold">
              <span>💬</span>
              <span class="comments-counter">0 Commenti</span>
              <span class="toggle-arrow text-[10px]">▼</span>
            </button>
          </div>

          <div class="comments-thread-container hidden mt-4 pt-3 border-t border-white/10 space-y-3">
            <div class="comments-list space-y-2 max-h-48 overflow-y-auto pr-1">
              <p class="no-comments-msg text-[11px] text-slate-500 font-mono italic">Nessun commento ancora. Scrivi la prima risposta!</p>
            </div>

            <form class="add-comment-form flex items-center gap-2 pt-2">
              <input type="text" placeholder="Callsign..." class="comment-author-input w-24 px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/15 focus:border-cyber-orange text-white font-mono text-[10px] outline-none" required>
              <input type="text" placeholder="Rispondi..." class="comment-text-input flex-1 px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 focus:border-cyber-orange text-white font-sans text-xs outline-none" required>
              <button type="submit" class="px-3 py-1.5 rounded-lg bg-cyber-orange text-black font-mono font-bold text-[10px] uppercase hover:bg-white transition-colors">
                Invia
              </button>
            </form>
          </div>
        </div>
      `;

      feedGrid.insertBefore(card, feedGrid.firstChild);
    });

    // Update total count
    const totalCards = feedGrid.querySelectorAll('.feed-card').length;
    if (feedCountEl) feedCountEl.textContent = totalCards;

    bindInteractivePostEvents();
  }

  // Handle Form Submission (Publish News or Photo)
  if (publishForm) {
    publishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const mode = publishTypeInput.value;
      const authorInput = document.getElementById('post-author-input');
      const contentInput = document.getElementById('post-content-input');
      const newsTitleInput = document.getElementById('news-title-input');

      let author = authorInput.value.trim();
      if (!author.startsWith('@')) author = '@' + author;

      if (mode === 'photos' && !currentImageDataUrl) {
        alert('Seleziona una foto per pubblicare il post.');
        return;
      }

      const newPost = {
        id: 'post_' + Date.now(),
        type: mode,
        author: author,
        title: mode === 'news' ? newsTitleInput.value.trim() : '',
        content: contentInput.value.trim(),
        image: mode === 'photos' ? currentImageDataUrl : null,
        timestamp: 'Poco fa',
        likes: 1
      };

      const posts = getStoredPosts();
      posts.unshift(newPost);
      saveStoredPosts(posts);

      renderAllPosts();
      closePublishModal();
      playCyberSound(880, 'square', 0.15);

      const netSec = document.getElementById('social-net');
      if (netSec) netSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Bind Comment Threads and Like Buttons to All Posts
  function bindInteractivePostEvents() {
    const commentsStorage = getStoredComments();

    document.querySelectorAll('.feed-card').forEach(card => {
      const postId = card.getAttribute('data-id') || 'post_default';
      const toggleBtn = card.querySelector('.toggle-comments-btn');
      const threadContainer = card.querySelector('.comments-thread-container');
      const commentsList = card.querySelector('.comments-list');
      const counterSpan = card.querySelector('.comments-counter');
      const arrowSpan = card.querySelector('.toggle-arrow');
      const commentForm = card.querySelector('.add-comment-form');

      // Hydrate stored comments for this post
      if (commentsStorage[postId] && commentsStorage[postId].length > 0) {
        const stored = commentsStorage[postId];
        if (commentsList) {
          commentsList.querySelectorAll('.no-comments-msg').forEach(el => el.remove());
          stored.forEach(c => {
            const commentEl = document.createElement('div');
            commentEl.className = 'p-2.5 rounded-xl bg-black/50 border border-white/10 font-sans text-xs';
            commentEl.innerHTML = `
              <div class="flex items-center justify-between font-mono text-[10px] text-cyber-cyan mb-1">
                <span class="font-bold">${c.author}</span>
                <span class="text-slate-500">${c.time}</span>
              </div>
              <p class="text-slate-200">${c.text}</p>
            `;
            commentsList.appendChild(commentEl);
          });
        }
        if (counterSpan) {
          const totalComments = commentsList ? commentsList.children.length : stored.length;
          counterSpan.textContent = `${totalComments} Commenti`;
        }
      }

      // Toggle Comments visibility
      if (toggleBtn && threadContainer) {
        toggleBtn.onclick = () => {
          const isHidden = threadContainer.classList.contains('hidden');
          if (isHidden) {
            threadContainer.classList.remove('hidden');
            if (arrowSpan) arrowSpan.textContent = '▲';
            playCyberSound(500, 'triangle', 0.05);
          } else {
            threadContainer.classList.add('hidden');
            if (arrowSpan) arrowSpan.textContent = '▼';
            playCyberSound(400, 'sine', 0.05);
          }
        };
      }

      // Submit Comment
      if (commentForm && commentsList) {
        commentForm.onsubmit = (e) => {
          e.preventDefault();
          const authorIn = commentForm.querySelector('.comment-author-input');
          const textIn = commentForm.querySelector('.comment-text-input');

          let author = authorIn.value.trim();
          if (!author.startsWith('@')) author = '@' + author;
          const text = textIn.value.trim();

          const newComment = {
            author: author,
            text: text,
            time: 'Poco fa'
          };

          // Save to storage
          const allComments = getStoredComments();
          if (!allComments[postId]) allComments[postId] = [];
          allComments[postId].push(newComment);
          saveStoredComments(allComments);

          // Append to DOM
          commentsList.querySelectorAll('.no-comments-msg').forEach(el => el.remove());
          const commentEl = document.createElement('div');
          commentEl.className = 'p-2.5 rounded-xl bg-black/50 border border-white/10 font-sans text-xs animate-fadeIn';
          commentEl.innerHTML = `
            <div class="flex items-center justify-between font-mono text-[10px] text-cyber-orange mb-1">
              <span class="font-bold">${newComment.author}</span>
              <span class="text-slate-500">${newComment.time}</span>
            </div>
            <p class="text-slate-200">${newComment.text}</p>
          `;
          commentsList.appendChild(commentEl);
          textIn.value = '';

          // Update Counter
          if (counterSpan) {
            const total = commentsList.children.length;
            counterSpan.textContent = `${total} Commenti`;
          }

          playCyberSound(700, 'square', 0.08);
        };
      }
    });

    // Like buttons
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

  // 5. Category Filtering (All / News / Photos / Discussions)
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
        const type = card.getAttribute('data-type');
        if (filter === 'all') {
          card.classList.remove('hidden');
        } else if (filter === 'news' && type === 'news') {
          card.classList.remove('hidden');
        } else if (filter === 'photos' && type === 'photos') {
          card.classList.remove('hidden');
        } else if (filter === 'discussions') {
          card.classList.remove('hidden'); // shows all with comments
        } else {
          card.classList.add('hidden');
        }
      });
      playCyberSound(500, 'sine', 0.05);
    });
  });

  renderAllPosts();

  // 6. Web Audio API Cyber SFX Synthesizer
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
      // silent
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

  // Hover sounds
  document.querySelectorAll('.cyber-btn-sound, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => playCyberSound(880, 'sine', 0.03));
    el.addEventListener('click', () => playCyberSound(520, 'triangle', 0.08));
  });

  // 7. Dynamic Telemetry Coordinates
  const coordEl = document.getElementById('telemetry-coord');
  if (coordEl) {
    setInterval(() => {
      const lat = (35.6895 + (Math.random() - 0.5) * 0.002).toFixed(4);
      const lon = (139.6917 + (Math.random() - 0.5) * 0.002).toFixed(4);
      coordEl.textContent = `SYS:${lat} // ${lon}`;
    }, 3500);
  }
});
