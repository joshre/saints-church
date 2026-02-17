import { CONFIG } from './config';
import { toggleClasses, bindEventListeners, getElements, formatTime, parseUrl } from './utils';

interface PlayerState {
  currentTime: number;
  playbackRate: number;
  speedIndex: number;
  lastPlayed: number;
}

class SermonPlayer {
  private container: HTMLElement;
  private audio: HTMLAudioElement;
  private currentSpeedIndex = 0;
  private savedState: PlayerState | null = null;
  private playerId: string;

  private playPauseBtns: NodeListOf<HTMLElement>;
  private currentTimeElements: NodeListOf<HTMLElement>;
  private durationElements: NodeListOf<HTMLElement>;
  private scrubberElements: NodeListOf<HTMLInputElement>;
  private progressFillElements: NodeListOf<HTMLElement>;
  private skipBackBtns: NodeListOf<HTMLElement>;
  private skipForwardBtns: NodeListOf<HTMLElement>;
  private speedBtns: NodeListOf<HTMLElement>;
  private speedTextElements: NodeListOf<HTMLElement>;

  constructor(container: HTMLElement) {
    this.container = container;
    this.audio = container.querySelector('audio')!;

    const els = getElements(container, {
      playPauseBtns: '.play-pause-btn',
      currentTimeElements: '.current-time',
      durationElements: '.duration',
      scrubberElements: '.audio-scrubber',
      progressFillElements: '.progress-fill',
      skipBackBtns: '.skip-back',
      skipForwardBtns: '.skip-forward',
      speedBtns: '.speed-toggle',
      speedTextElements: '.speed-text',
    });

    this.playPauseBtns = els.playPauseBtns;
    this.currentTimeElements = els.currentTimeElements;
    this.durationElements = els.durationElements;
    this.scrubberElements = els.scrubberElements as NodeListOf<HTMLInputElement>;
    this.progressFillElements = els.progressFillElements;
    this.skipBackBtns = els.skipBackBtns;
    this.skipForwardBtns = els.skipForwardBtns;
    this.speedBtns = els.speedBtns;
    this.speedTextElements = els.speedTextElements;

    this.playerId = parseUrl((container as HTMLElement).dataset.audioUrl || this.audio?.src);
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.loadState();
  }

  private setupEventListeners(): void {
    bindEventListeners(this.playPauseBtns, 'click', () => this.togglePlayPause());
    bindEventListeners(this.scrubberElements, 'input', (e) => this.seek(e));
    bindEventListeners(this.scrubberElements, 'change', (e) => this.seek(e));
    bindEventListeners(this.skipBackBtns, 'click', () => this.skip(CONFIG.skip.backward));
    bindEventListeners(this.skipForwardBtns, 'click', () => this.skip(CONFIG.skip.forward));
    bindEventListeners(this.speedBtns, 'click', () => this.toggleSpeed());

    if (this.audio) {
      this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
      this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
      this.audio.addEventListener('ended', () => this.onEnded());
      this.audio.addEventListener('error', () => this.onError());
    }

    this.container.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyboard(e));

    if ('mediaSession' in navigator) {
      this.setupMediaSession();
    }
  }

  private togglePlayPause(): void {
    this.audio.paused ? this.play() : this.pause();
  }

  private async play(): Promise<void> {
    try {
      await this.audio.play();
      this.updatePlayPauseButton('playing');
      this.saveState();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.onError();
    }
  }

  private pause(): void {
    this.audio.pause();
    this.updatePlayPauseButton('paused');
    this.saveState();
  }

  private seek(event: Event): void {
    const scrubber = event.target as HTMLInputElement;
    const percent = Number(scrubber.value) / 100;
    const time = percent * this.audio.duration;
    if (isFinite(time)) {
      this.audio.currentTime = time;
      this.saveState();
    }
  }

  private skip(seconds: number): void {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.currentTime + seconds, this.audio.duration));
      this.saveState();
    }
  }

  private updateSpeedText(speed: number): void {
    this.speedTextElements.forEach(el => {
      el.textContent = speed === 1 ? '1\u00d7' : `${speed}\u00d7`;
    });
  }

  private toggleSpeed(): void {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % CONFIG.speeds.length;
    const speed = CONFIG.speeds[this.currentSpeedIndex];
    this.audio.playbackRate = speed;
    this.updateSpeedText(speed);
    this.saveState();
  }

  private updatePlayPauseButton(state: 'playing' | 'paused'): void {
    const isPlaying = state === 'playing';
    this.playPauseBtns.forEach(btn => {
      const playIcon = btn.querySelector('.play-icon');
      const pauseIcon = btn.querySelector('.pause-icon');

      if (playIcon) toggleClasses(playIcon, isPlaying ? 'hidden' : null, isPlaying ? null : 'hidden');
      if (pauseIcon) toggleClasses(pauseIcon, isPlaying ? null : 'hidden', isPlaying ? 'hidden' : null);

      btn.setAttribute('aria-label', isPlaying ? 'Pause sermon' : 'Play sermon');
      (btn as HTMLElement).dataset.state = state;
    });
  }

  private updateProgress(): void {
    if (!this.audio.duration) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;

    this.progressFillElements.forEach(fill => {
      fill.style.width = `${percent}%`;
    });

    this.scrubberElements.forEach(scrubber => {
      scrubber.value = String(percent);
      scrubber.setAttribute('aria-valuenow', String(Math.round(percent)));
    });
  }

  private updateTime(): void {
    this.currentTimeElements.forEach(el => {
      el.textContent = formatTime(this.audio.currentTime);
    });

    if (this.audio.duration) {
      this.durationElements.forEach(el => {
        el.textContent = formatTime(this.audio.duration);
      });
    }
  }

  private onLoadedMetadata(): void {
    this.updateTime();
    this.restoreState();
  }

  private onTimeUpdate(): void {
    this.updateProgress();
    this.updateTime();
  }

  private onEnded(): void {
    this.updatePlayPauseButton('paused');
    this.audio.currentTime = 0;
    this.updateProgress();
  }

  private onError(): void {
    console.error('Audio playback error');
  }

  private saveState(): void {
    const state: PlayerState = {
      currentTime: this.audio.currentTime,
      playbackRate: this.audio.playbackRate,
      speedIndex: this.currentSpeedIndex,
      lastPlayed: Date.now(),
    };
    localStorage.setItem(`sermon-${this.playerId}`, JSON.stringify(state));
  }

  private loadState(): void {
    const saved = localStorage.getItem(`sermon-${this.playerId}`);
    if (saved) {
      this.savedState = JSON.parse(saved) as PlayerState;
    }
  }

  private restoreState(): void {
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

  private handleKeyboard(event: KeyboardEvent): void {
    if (!this.container.contains(document.activeElement)) return;

    const keyActions: Record<string, () => void> = {
      ' ': () => this.togglePlayPause(),
      'ArrowLeft': () => this.skip(event.shiftKey ? CONFIG.skip.shiftBackward : CONFIG.skip.backward),
      'ArrowRight': () => this.skip(event.shiftKey ? CONFIG.skip.shiftForward : CONFIG.skip.forward),
    };

    const action = keyActions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  private setupMediaSession(): void {
    const title = this.container.querySelector('.player-header h3')?.textContent || 'Sermon';
    const scripture = this.container.querySelector('.player-header p')?.textContent || '';

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: 'Saints Church',
      album: scripture,
      artwork: [
        { src: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    });

    const handlers: Record<string, () => void> = {
      play: () => this.play(),
      pause: () => this.pause(),
      seekbackward: () => this.skip(CONFIG.skip.backward),
      seekforward: () => this.skip(CONFIG.skip.forward),
    };

    for (const [action, handler] of Object.entries(handlers)) {
      navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
    }
  }
}

export function initAudioPlayers(): void {
  const players = document.querySelectorAll<HTMLElement>('.sermon-player');
  players.forEach(player => new SermonPlayer(player));
}
