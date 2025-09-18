// Import Tailwind Elements
import '@tailwindplus/elements'

// Inline the animations functionality
function initScrollAnimations() {
  // Find all elements with animation classes
  const animatedElements = document.querySelectorAll('.animate-reveal, .animate-fade-in, .animate-children');

  // Create observer with mobile-optimized settings
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('run');
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Use multiple thresholds for reliable triggering, especially on mobile
    threshold: [0, 0.01, 0.05],
    // More generous rootMargin for mobile viewports
    rootMargin: '20px 0px 20px 0px'
  });

  // Observe all elements with animation classes
  animatedElements.forEach(el => observer.observe(el));
}

// Mobile navigation functionality
function initMobileNav() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuPanel = document.getElementById('mobile-menu-panel');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  if (!mobileMenuButton || !mobileMenu || !mobileMenuPanel) return;

  function showMenu() {
    mobileMenu.classList.remove('hidden');
    menuIcon.classList.add('hidden');
    closeIcon.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Trigger the slide-in animation
    requestAnimationFrame(() => {
      mobileMenuPanel.classList.remove('translate-x-full');
      mobileMenuPanel.classList.add('translate-x-0');
    });
  }

  function hideMenu() {
    // Start slide-out animation
    mobileMenuPanel.classList.remove('translate-x-0');
    mobileMenuPanel.classList.add('translate-x-full');

    // Hide the menu after animation completes
    setTimeout(() => {
      mobileMenu.classList.add('hidden');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300); // Match the transition duration
  }

  mobileMenuButton.addEventListener('click', showMenu);

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', hideMenu);
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', hideMenu);
  }

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      hideMenu();
    }
  });
}

// Audio Player functionality
function initAudioPlayers() {
  class SermonPlayer {
    constructor(container) {
      this.container = container;
      this.playerId = container.dataset.playerId;
      this.audio = container.querySelector('audio');
      this.playPauseBtn = container.querySelector('.play-pause-btn');
      this.progressBar = container.querySelector('.progress-bar');
      this.progressFill = container.querySelector('.progress-fill');
      this.progressHandle = container.querySelector('.progress-handle');
      this.currentTimeEl = container.querySelector('.current-time');
      this.durationEl = container.querySelector('.duration');
      this.skipBackBtn = container.querySelector('.skip-back');
      this.skipForwardBtn = container.querySelector('.skip-forward');
      this.speedBtn = container.querySelector('.speed-toggle');
      this.speedText = container.querySelector('.speed-text');
      this.loadingState = container.querySelector('.loading-state');
      this.errorState = container.querySelector('.error-state');
      this.playerControls = container.querySelector('.player-controls');

      this.speeds = [1, 1.25, 1.5, 2];
      this.currentSpeedIndex = 0;
      this.isLoaded = false;

      this.init();
    }

    init() {
      this.setupEventListeners();
      this.loadState();
    }

    setupEventListeners() {
      if (!this.playPauseBtn) return;

      this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());

      if (this.progressBar) {
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.progressBar.addEventListener('mouseenter', () => this.showHandle());
        this.progressBar.addEventListener('mouseleave', () => this.hideHandle());
      }

      if (this.skipBackBtn) this.skipBackBtn.addEventListener('click', () => this.skip(-15));
      if (this.skipForwardBtn) this.skipForwardBtn.addEventListener('click', () => this.skip(15));
      if (this.speedBtn) this.speedBtn.addEventListener('click', () => this.toggleSpeed());

      if (this.audio) {
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('error', () => this.onError());
        this.audio.addEventListener('loadstart', () => this.onLoadStart());
      }

      this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));

      if ('mediaSession' in navigator) {
        this.setupMediaSession();
      }
    }

    loadAudio() {
      if (!this.isLoaded && this.audio && this.audio.dataset.src) {
        this.audio.src = this.audio.dataset.src;
        this.audio.load();
        this.isLoaded = true;
      }
    }

    togglePlayPause() {
      this.loadAudio();
      if (this.audio.paused) {
        this.play();
      } else {
        this.pause();
      }
    }

    async play() {
      try {
        await this.audio.play();
        this.updatePlayPauseButton('playing');
        this.saveState();
      } catch (error) {
        console.error('Error playing audio:', error);
        this.onError();
      }
    }

    pause() {
      this.audio.pause();
      this.updatePlayPauseButton('paused');
      this.saveState();
    }

    seek(event) {
      const rect = this.progressBar.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const time = percent * this.audio.duration;
      if (isFinite(time)) {
        this.audio.currentTime = time;
        this.saveState();
      }
    }

    skip(seconds) {
      if (this.audio.duration) {
        const newTime = Math.max(0, Math.min(this.audio.currentTime + seconds, this.audio.duration));
        this.audio.currentTime = newTime;
        this.saveState();
      }
    }

    toggleSpeed() {
      this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speeds.length;
      const speed = this.speeds[this.currentSpeedIndex];
      this.audio.playbackRate = speed;
      if (this.speedText) {
        this.speedText.textContent = speed === 1 ? '1×' : `${speed}×`;
      }
      this.saveState();
    }

    updatePlayPauseButton(state) {
      const playIcon = this.playPauseBtn.querySelector('.play-icon');
      const pauseIcon = this.playPauseBtn.querySelector('.pause-icon');

      if (state === 'playing') {
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
        this.playPauseBtn.setAttribute('aria-label', 'Pause sermon');
        this.playPauseBtn.dataset.state = 'playing';
      } else {
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        this.playPauseBtn.setAttribute('aria-label', 'Play sermon');
        this.playPauseBtn.dataset.state = 'paused';
      }
    }

    updateProgress() {
      if (this.audio.duration && this.progressFill && this.progressHandle) {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressFill.style.width = `${percent}%`;
        this.progressHandle.style.left = `${percent}%`;
        if (this.progressBar) {
          this.progressBar.setAttribute('aria-valuenow', Math.round(percent));
        }
      }
    }

    updateTime() {
      if (this.currentTimeEl) {
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
      }
      if (this.audio.duration && this.durationEl) {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
      }
    }

    formatTime(seconds) {
      if (!isFinite(seconds)) return '--:--';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showHandle() {
      if (this.progressHandle) {
        this.progressHandle.style.opacity = '1';
      }
    }

    hideHandle() {
      if (this.progressHandle) {
        this.progressHandle.style.opacity = '0';
      }
    }

    onLoadStart() {
      if (this.loadingState) this.loadingState.classList.remove('hidden');
      if (this.playerControls) this.playerControls.style.opacity = '0.5';
    }

    onLoadedMetadata() {
      if (this.loadingState) this.loadingState.classList.add('hidden');
      if (this.errorState) this.errorState.classList.add('hidden');
      if (this.playerControls) this.playerControls.style.opacity = '1';
      this.updateTime();
      this.restoreState();
    }

    onTimeUpdate() {
      this.updateProgress();
      this.updateTime();
    }

    onEnded() {
      this.updatePlayPauseButton('paused');
      this.audio.currentTime = 0;
      this.updateProgress();
    }

    onError() {
      if (this.loadingState) this.loadingState.classList.add('hidden');
      if (this.errorState) this.errorState.classList.remove('hidden');
      if (this.playerControls) this.playerControls.style.opacity = '0.5';
    }

    saveState() {
      const state = {
        currentTime: this.audio.currentTime,
        playbackRate: this.audio.playbackRate,
        speedIndex: this.currentSpeedIndex,
        lastPlayed: Date.now()
      };
      localStorage.setItem(`sermon-${this.playerId}`, JSON.stringify(state));
    }

    loadState() {
      const saved = localStorage.getItem(`sermon-${this.playerId}`);
      if (saved) {
        this.savedState = JSON.parse(saved);
      }
    }

    restoreState() {
      if (this.savedState) {
        if (this.savedState.playbackRate) {
          this.audio.playbackRate = this.savedState.playbackRate;
          this.currentSpeedIndex = this.savedState.speedIndex || 0;
          const speed = this.speeds[this.currentSpeedIndex];
          if (this.speedText) {
            this.speedText.textContent = speed === 1 ? '1×' : `${speed}×`;
          }
        }

        if (this.savedState.lastPlayed && (Date.now() - this.savedState.lastPlayed) < 7 * 24 * 60 * 60 * 1000) {
          if (this.savedState.currentTime && this.savedState.currentTime > 5) {
            this.audio.currentTime = this.savedState.currentTime;
          }
        }
      }
    }

    handleKeyboard(event) {
      if (!this.container.contains(document.activeElement)) return;

      switch(event.key) {
        case ' ':
          event.preventDefault();
          this.togglePlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.skip(event.shiftKey ? -30 : -15);
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.skip(event.shiftKey ? 30 : 15);
          break;
      }
    }

    setupMediaSession() {
      const title = this.container.querySelector('.player-header h3')?.textContent || 'Sermon';
      const scripture = this.container.querySelector('.player-header p')?.textContent || '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: 'Saints Church',
        album: scripture,
        artwork: [
          { src: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => this.skip(-15));
      navigator.mediaSession.setActionHandler('seekforward', () => this.skip(15));
    }
  }

  const players = document.querySelectorAll('.sermon-player');
  players.forEach(player => new SermonPlayer(player));
}

// Enhanced Transcription Reading Experience
function initTranscriptionEnhancements() {
  const transcription = document.getElementById('sermon-transcription');
  const progressIndicator = document.getElementById('reading-progress');
  const transcriptDetails = document.querySelector('.transcript-details');

  // SEO optimization: Start open for crawlers, then close for UX
  if (transcriptDetails && transcriptDetails.hasAttribute('open')) {
    // Small delay to ensure crawlers see the open state
    setTimeout(() => {
      transcriptDetails.removeAttribute('open');
    }, 100);
  }

  if (!transcription) return;

  // Reading progress tracking (optional - only if indicator exists)
  let lastScrollPosition = 0;
  let ticking = false;

  function updateReadingProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / documentHeight, 0), 1);

    // Update progress indicator if it exists
    if (progressIndicator) {
      const progressBar = progressIndicator.querySelector('div');
      if (progressBar) {
        progressBar.style.height = `${progress * 100}%`;
      }
    }

    // Auto-save reading position (debounced)
    if (Math.abs(scrollTop - lastScrollPosition) > 100) {
      lastScrollPosition = scrollTop;
      saveReadingPosition(progress);
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateReadingProgress);
      ticking = true;
    }
  }

  function saveReadingPosition(progress) {
    const pageUrl = window.location.pathname;
    localStorage.setItem(`reading-${pageUrl}`, JSON.stringify({
      progress: progress,
      timestamp: Date.now()
    }));
  }

  function restoreReadingPosition() {
    const pageUrl = window.location.pathname;
    const saved = localStorage.getItem(`reading-${pageUrl}`);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Only restore if less than 24 hours old and meaningful progress
        if (data.timestamp > Date.now() - 24 * 60 * 60 * 1000 && data.progress > 0.05) {
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const targetScroll = data.progress * documentHeight;

          // Smooth scroll to saved position after a short delay
          setTimeout(() => {
            window.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          }, 500);
        }
      } catch (e) {
        // Silently ignore parsing errors
      }
    }
  }

  // Keyboard shortcuts for reading
  function handleReadingShortcuts(event) {
    // Only activate shortcuts when not in form inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    switch(event.key) {
      case 'Home':
        event.preventDefault();
        transcription.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'End':
        event.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
      case 'PageUp':
        event.preventDefault();
        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
        break;
      case 'PageDown':
        event.preventDefault();
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
        break;
    }
  }

  // Enable reading enhancements when transcription is long enough
  const transcriptionHeight = transcription.scrollHeight;
  const viewportHeight = window.innerHeight;

  if (transcriptionHeight > viewportHeight * 2) {
    // Show progress indicator if it exists
    if (progressIndicator) {
      progressIndicator.classList.remove('hidden');
    }

    // Always enable scroll tracking and keyboard shortcuts for long transcriptions
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', handleReadingShortcuts);

    // Restore reading position on page load
    restoreReadingPosition();
  }

  // Audio-transcription sync (if both exist)
  const audioPlayer = document.querySelector('.sermon-player audio');
  if (audioPlayer) {
    // Smooth scroll to audio when user starts playback
    audioPlayer.addEventListener('play', () => {
      const audioSection = audioPlayer.closest('section');
      if (audioSection) {
        audioSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initMobileNav();
    initAudioPlayers();
    initTranscriptionEnhancements();
  });
} else {
  initScrollAnimations();
  initMobileNav();
  initAudioPlayers();
  initTranscriptionEnhancements();
}

