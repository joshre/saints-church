import { CONFIG } from './config';
import { formatTime, parseUrl } from './utils';

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

    const audio = container.querySelector('audio');
    if (!audio) return;
    this.audio = audio;

    this.playPauseBtns = container.querySelectorAll('.play-pause-btn');
    this.currentTimeElements = container.querySelectorAll('.current-time');
    this.durationElements = container.querySelectorAll('.duration');
    this.scrubberElements = container.querySelectorAll<HTMLInputElement>('.audio-scrubber');
    this.progressFillElements = container.querySelectorAll('.progress-fill');
    this.skipBackBtns = container.querySelectorAll('.skip-back');
    this.skipForwardBtns = container.querySelectorAll('.skip-forward');
    this.speedBtns = container.querySelectorAll('.speed-toggle');
    this.speedTextElements = container.querySelectorAll('.speed-text');

    this.playerId = parseUrl(container.dataset.audioUrl || this.audio.src);
    this.setupEventListeners();
    this.loadState();
  }

  private setupEventListeners(): void {
    this.playPauseBtns.forEach(el => el.addEventListener('click', () => this.togglePlayPause()));
    this.scrubberElements.forEach(el => el.addEventListener('input', (e) => this.seek(e)));
    this.scrubberElements.forEach(el => el.addEventListener('change', (e) => this.seek(e)));
    this.skipBackBtns.forEach(el => el.addEventListener('click', () => this.skip(CONFIG.skip.backward)));
    this.skipForwardBtns.forEach(el => el.addEventListener('click', () => this.skip(CONFIG.skip.forward)));
    this.speedBtns.forEach(el => el.addEventListener('click', () => this.toggleSpeed()));

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

      if (playIcon) playIcon.classList.toggle('hidden', isPlaying);
      if (pauseIcon) pauseIcon.classList.toggle('hidden', !isPlaying);

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
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed?.currentTime === 'number' && typeof parsed?.lastPlayed === 'number') {
        this.savedState = parsed as PlayerState;
      }
    } catch {
      // Corrupted localStorage entry — ignore
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

    const actions: Array<[MediaSessionAction, () => void]> = [
      ['play', () => this.play()],
      ['pause', () => this.pause()],
      ['seekbackward', () => this.skip(CONFIG.skip.backward)],
      ['seekforward', () => this.skip(CONFIG.skip.forward)],
    ];
    for (const [action, handler] of actions) {
      navigator.mediaSession.setActionHandler(action, handler);
    }
  }
}

export function initAudioPlayers(): void {
  const players = document.querySelectorAll<HTMLElement>('.sermon-player');
  players.forEach(player => new SermonPlayer(player));
}
