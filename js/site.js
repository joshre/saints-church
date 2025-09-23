// Import Tailwind Elements
import '@tailwindplus/elements'

// Configuration constants
const CONFIG = {
  skip: { backward: -15, forward: 15, shiftBackward: -30, shiftForward: 30 },
  animation: { duration: 300, thresholds: [0, 0.01, 0.05], rootMargin: '20px 0px 20px 0px' },
  localStorage: { audioTTL: 7 * 24 * 60 * 60 * 1000, readingTTL: 24 * 60 * 60 * 1000 },
  speeds: [1, 1.25, 1.5, 2],
  reading: { minProgress: 0.05, scrollDebounce: 100, restoreDelay: 500, scrollRatio: 0.8 }
};

// Utility functions
const utils = {
  toggleClasses: (element, add, remove) => {
    if (add) element.classList.add(...[add].flat());
    if (remove) element.classList.remove(...[remove].flat());
  },

  bindEventListeners: (elements, event, handler) => {
    elements.forEach(el => el.addEventListener(event, handler));
  },

  getElements: (container, selectors) => {
    const result = {};
    Object.entries(selectors).forEach(([key, selector]) => {
      result[key] = container.querySelectorAll(selector);
    });
    return result;
  },

  formatTime: (seconds) => !isFinite(seconds) ? '--:--' :
    `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`,

  parseUrl: (url) => url?.split('/').pop()?.split('.')[0] || 'unknown'
};

function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-reveal, .animate-fade-in, .animate-children');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('run');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: CONFIG.animation.thresholds,
    rootMargin: CONFIG.animation.rootMargin
  });

  animatedElements.forEach(el => observer.observe(el));
}

function initMobileNav() {
  const elements = {
    button: document.getElementById('mobile-menu-button'),
    menu: document.getElementById('mobile-menu'),
    panel: document.getElementById('mobile-menu-panel'),
    close: document.getElementById('mobile-menu-close'),
    backdrop: document.getElementById('mobile-menu-backdrop'),
    menuIcon: document.getElementById('menu-icon'),
    closeIcon: document.getElementById('close-icon')
  };

  if (!elements.button || !elements.menu || !elements.panel) return;

  const toggleMenu = (show) => {
    if (show) {
      utils.toggleClasses(elements.menu, null, 'hidden');
      utils.toggleClasses(elements.menuIcon, 'hidden');
      utils.toggleClasses(elements.closeIcon, null, 'hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        utils.toggleClasses(elements.panel, 'translate-x-0', 'translate-x-full');
      });
    } else {
      utils.toggleClasses(elements.panel, 'translate-x-full', 'translate-x-0');
      setTimeout(() => {
        utils.toggleClasses(elements.menu, 'hidden');
        utils.toggleClasses(elements.menuIcon, null, 'hidden');
        utils.toggleClasses(elements.closeIcon, 'hidden');
        document.body.style.overflow = '';
      }, CONFIG.animation.duration);
    }
  };

  elements.button.addEventListener('click', () => toggleMenu(true));
  elements.close?.addEventListener('click', () => toggleMenu(false));
  elements.backdrop?.addEventListener('click', () => toggleMenu(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.menu.classList.contains('hidden')) {
      toggleMenu(false);
    }
  });
}

function initAudioPlayers() {
  class SermonPlayer {
    constructor(container) {
      this.container = container;
      this.audio = container.querySelector('audio');
      this.currentSpeedIndex = 0;

      const selectors = {
        playPauseBtns: '.play-pause-btn',
        currentTimeElements: '.current-time',
        durationElements: '.duration',
        scrubberElements: '.audio-scrubber',
        progressFillElements: '.progress-fill',
        skipBackBtns: '.skip-back',
        skipForwardBtns: '.skip-forward',
        speedBtns: '.speed-toggle',
        speedTextElements: '.speed-text'
      };

      Object.assign(this, utils.getElements(container, selectors));
      this.playerId = utils.parseUrl(container.dataset.audioUrl || this.audio?.src);
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.loadState();
    }

    setupEventListeners() {
      utils.bindEventListeners(this.playPauseBtns, 'click', () => this.togglePlayPause());
      utils.bindEventListeners(this.scrubberElements, 'input', (e) => this.seek(e));
      utils.bindEventListeners(this.scrubberElements, 'change', (e) => this.seek(e));
      utils.bindEventListeners(this.skipBackBtns, 'click', () => this.skip(CONFIG.skip.backward));
      utils.bindEventListeners(this.skipForwardBtns, 'click', () => this.skip(CONFIG.skip.forward));
      utils.bindEventListeners(this.speedBtns, 'click', () => this.toggleSpeed());

      if (this.audio) {
        const audioEvents = {
          loadedmetadata: () => this.onLoadedMetadata(),
          timeupdate: () => this.onTimeUpdate(),
          ended: () => this.onEnded(),
          error: () => this.onError(),
          loadstart: () => this.onLoadStart()
        };
        Object.entries(audioEvents).forEach(([event, handler]) => {
          this.audio.addEventListener(event, handler);
        });
      }

      this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));

      if ('mediaSession' in navigator) {
        this.setupMediaSession();
      }
    }

    togglePlayPause() {
      this.audio.paused ? this.play() : this.pause();
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
      const scrubber = event.target;
      const percent = scrubber.value / 100;
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

    updateSpeedText(speed) {
      this.speedTextElements.forEach(el => {
        el.textContent = speed === 1 ? '1×' : `${speed}×`;
      });
    }

    toggleSpeed() {
      this.currentSpeedIndex = (this.currentSpeedIndex + 1) % CONFIG.speeds.length;
      const speed = CONFIG.speeds[this.currentSpeedIndex];
      this.audio.playbackRate = speed;
      this.updateSpeedText(speed);
      this.saveState();
    }

    updatePlayPauseButton(state) {
      const isPlaying = state === 'playing';
      this.playPauseBtns.forEach(btn => {
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');

        if (playIcon) utils.toggleClasses(playIcon, isPlaying ? 'hidden' : null, isPlaying ? null : 'hidden');
        if (pauseIcon) utils.toggleClasses(pauseIcon, isPlaying ? null : 'hidden', isPlaying ? 'hidden' : null);

        btn.setAttribute('aria-label', isPlaying ? 'Pause sermon' : 'Play sermon');
        btn.dataset.state = state;
      });
    }

    updateProgress() {
      if (this.audio.duration) {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;

        // Update progress fill bars
        this.progressFillElements.forEach(fill => {
          fill.style.width = `${percent}%`;
        });

        // Update scrubber positions
        this.scrubberElements.forEach(scrubber => {
          scrubber.value = percent;
          scrubber.setAttribute('aria-valuenow', Math.round(percent));
        });
      }
    }

    updateTime() {
      this.currentTimeElements.forEach(el => {
        el.textContent = utils.formatTime(this.audio.currentTime);
      });

      if (this.audio.duration) {
        this.durationElements.forEach(el => {
          el.textContent = utils.formatTime(this.audio.duration);
        });
      }
    }


    onLoadStart() {
      // Loading state handled by browser UI
    }

    onLoadedMetadata() {
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
      console.error('Audio playback error');
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
      if (!this.savedState) return;

      if (this.savedState.playbackRate) {
        this.audio.playbackRate = this.savedState.playbackRate;
        this.currentSpeedIndex = this.savedState.speedIndex || 0;
        this.updateSpeedText(CONFIG.speeds[this.currentSpeedIndex]);
      }

      const isRecent = this.savedState.lastPlayed &&
        (Date.now() - this.savedState.lastPlayed) < CONFIG.localStorage.audioTTL;

      if (isRecent && this.savedState.currentTime > 5) {
        this.audio.currentTime = this.savedState.currentTime;
        this.updateProgress();
        this.updateTime();
      }
    }

    handleKeyboard(event) {
      if (!this.container.contains(document.activeElement)) return;

      const keyActions = {
        ' ': () => this.togglePlayPause(),
        'ArrowLeft': () => this.skip(event.shiftKey ? CONFIG.skip.shiftBackward : CONFIG.skip.backward),
        'ArrowRight': () => this.skip(event.shiftKey ? CONFIG.skip.shiftForward : CONFIG.skip.forward)
      };

      const action = keyActions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    }

    setupMediaSession() {
      const title = this.container.querySelector('.player-header h3')?.textContent || 'Sermon';
      const scripture = this.container.querySelector('.player-header p')?.textContent || '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: 'Saints Church',
        album: scripture,
        artwork: [
          { src: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
      });

      const handlers = {
        play: () => this.play(),
        pause: () => this.pause(),
        seekbackward: () => this.skip(CONFIG.skip.backward),
        seekforward: () => this.skip(CONFIG.skip.forward)
      };

      Object.entries(handlers).forEach(([action, handler]) => {
        navigator.mediaSession.setActionHandler(action, handler);
      });
    }
  }

  const players = document.querySelectorAll('.sermon-player');
  players.forEach(player => new SermonPlayer(player));
}

function initTranscriptionEnhancements() {
  const elements = {
    transcription: document.getElementById('sermon-transcription'),
    progressIndicator: document.getElementById('reading-progress'),
    transcriptDetails: document.querySelector('.transcript-details')
  };

  // SEO optimization: Start open for crawlers, then close for UX
  if (elements.transcriptDetails?.hasAttribute('open')) {
    setTimeout(() => elements.transcriptDetails.removeAttribute('open'), 100);
  }

  if (!elements.transcription) return;

  const state = { lastScrollPosition: 0, ticking: false };

  const readingUtils = {
    savePosition: (progress) => {
      localStorage.setItem(`reading-${location.pathname}`, JSON.stringify({
        progress,
        timestamp: Date.now()
      }));
    },

    restorePosition: () => {
      const saved = localStorage.getItem(`reading-${location.pathname}`);
      if (!saved) return;

      try {
        const data = JSON.parse(saved);
        const isRecent = data.timestamp > Date.now() - CONFIG.localStorage.readingTTL;
        const hasProgress = data.progress > CONFIG.reading.minProgress;

        if (isRecent && hasProgress) {
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const targetScroll = data.progress * documentHeight;

          setTimeout(() => {
            window.scrollTo({ top: targetScroll, behavior: 'smooth' });
          }, CONFIG.reading.restoreDelay);
        }
      } catch (e) {
        // Silently ignore parsing errors
      }
    },

    updateProgress: () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(scrollTop / documentHeight, 0), 1);

      if (elements.progressIndicator) {
        const progressBar = elements.progressIndicator.querySelector('div');
        if (progressBar) progressBar.style.height = `${progress * 100}%`;
      }

      if (Math.abs(scrollTop - state.lastScrollPosition) > CONFIG.reading.scrollDebounce) {
        state.lastScrollPosition = scrollTop;
        readingUtils.savePosition(progress);
      }
      state.ticking = false;
    },

    onScroll: () => {
      if (!state.ticking) {
        requestAnimationFrame(readingUtils.updateProgress);
        state.ticking = true;
      }
    },

    handleKeyboard: (event) => {
      if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;

      const shortcuts = {
        'Home': () => elements.transcription.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        'End': () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
        'PageUp': () => window.scrollBy({ top: -window.innerHeight * CONFIG.reading.scrollRatio, behavior: 'smooth' }),
        'PageDown': () => window.scrollBy({ top: window.innerHeight * CONFIG.reading.scrollRatio, behavior: 'smooth' })
      };

      const action = shortcuts[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    }
  };

  // Enable reading enhancements when transcription is long enough
  if (elements.transcription.scrollHeight > window.innerHeight * 2) {
    elements.progressIndicator?.classList.remove('hidden');
    window.addEventListener('scroll', readingUtils.onScroll, { passive: true });
    document.addEventListener('keydown', readingUtils.handleKeyboard);
    readingUtils.restorePosition();
  }
}

// Initialize all functionality
const initAll = () => {
  initScrollAnimations();
  initMobileNav();
  initAudioPlayers();
  initTranscriptionEnhancements();
};

// Initialize when DOM is ready
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initAll)
  : initAll();

