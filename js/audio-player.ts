import { CONFIG } from './config';
import { formatTime, parseUrl } from './utils';

interface PlayerState {
  currentTime: number;
  playbackRate: number;
  speedIndex: number;
  lastPlayed: number;
}

class SermonPlayer {
  private readonly container: HTMLElement;
  private readonly audio!: HTMLAudioElement;
  private currentSpeedIndex = 0;
  private savedState: PlayerState | null = null;
  private readonly playerId!: string;

  private readonly playPauseBtns!: NodeListOf<HTMLElement>;
  private readonly currentTimeElements!: NodeListOf<HTMLElement>;
  private readonly durationElements!: NodeListOf<HTMLElement>;
  private readonly scrubberElements!: NodeListOf<HTMLInputElement>;
  private readonly progressFillElements!: NodeListOf<HTMLElement>;
  private readonly skipBackBtns!: NodeListOf<HTMLElement>;
  private readonly skipForwardBtns!: NodeListOf<HTMLElement>;
  private readonly speedBtns!: NodeListOf<HTMLElement>;
  private readonly speedTextElements!: NodeListOf<HTMLElement>;

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

    // anchor.fm percent-encodes the inner CDN url, so parseUrl collapses every sermon onto one key
    const episodeId = container.dataset.episodeId;
    this.playerId =
      episodeId && episodeId !== 'unknown'
        ? episodeId
        : parseUrl(container.dataset.audioUrl ?? this.audio.src);
    this.setupEventListeners();
    this.loadState();

    // a cached response can reach HAVE_METADATA before the listener attaches, and loadedmetadata never fires again
    if (this.audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      this.onLoadedMetadata();
    }
  }

  private setupEventListeners(): void {
    this.playPauseBtns.forEach((el) => {
      el.addEventListener('click', () => this.togglePlayPause());
    });
    this.scrubberElements.forEach((el) => {
      el.addEventListener('input', (e) => this.seek(e));
    });
    this.scrubberElements.forEach((el) => {
      el.addEventListener('change', (e) => this.seek(e));
    });
    this.skipBackBtns.forEach((el) => {
      el.addEventListener('click', () => this.skip(CONFIG.skip.backward));
    });
    this.skipForwardBtns.forEach((el) => {
      el.addEventListener('click', () => this.skip(CONFIG.skip.forward));
    });
    this.speedBtns.forEach((el) => {
      el.addEventListener('click', () => this.toggleSpeed());
    });

    this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('error', () => this.onError());

    this.container.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyboard(e));
  }

  private togglePlayPause(): void {
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  private async play(): Promise<void> {
    try {
      pauseOtherPlayers(this);
      if ('mediaSession' in navigator) {
        this.setupMediaSession();
      }
      await this.audio.play();
      this.updatePlayPauseButton('playing');
      this.saveState();
    } catch {
      this.onError();
    }
  }

  pauseIfPlaying(): void {
    if (!this.audio.paused) {
      this.pause();
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
    if (Number.isFinite(time)) {
      this.audio.currentTime = time;
      this.saveState();
    }
  }

  private skip(seconds: number): void {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(
        0,
        Math.min(this.audio.currentTime + seconds, this.audio.duration),
      );
      this.saveState();
    }
  }

  private updateSpeedText(speed: number): void {
    this.speedTextElements.forEach((el) => {
      el.textContent = speed === 1 ? '1\u00d7' : `${speed}\u00d7`;
    });
  }

  private toggleSpeed(): void {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % CONFIG.speeds.length;
    const speed = CONFIG.speeds[this.currentSpeedIndex] ?? 1;
    this.audio.playbackRate = speed;
    this.updateSpeedText(speed);
    this.saveState();
  }

  private updatePlayPauseButton(state: 'playing' | 'paused'): void {
    const isPlaying = state === 'playing';
    this.playPauseBtns.forEach((btn) => {
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

    this.progressFillElements.forEach((fill) => {
      fill.style.width = `${percent}%`;
    });

    this.scrubberElements.forEach((scrubber) => {
      scrubber.value = String(percent);
      scrubber.setAttribute('aria-valuenow', String(Math.round(percent)));
    });
  }

  private updateTime(): void {
    this.currentTimeElements.forEach((el) => {
      el.textContent = formatTime(this.audio.currentTime);
    });

    if (this.audio.duration) {
      this.durationElements.forEach((el) => {
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

  // biome-ignore lint/suspicious/noEmptyBlockStatements: deliberate no-op; swallows audio errors so a failed load stays silent
  private onError(): void {}

  private saveState(): void {
    const state: PlayerState = {
      currentTime: this.audio.currentTime,
      playbackRate: this.audio.playbackRate,
      speedIndex: this.currentSpeedIndex,
      lastPlayed: Date.now(),
    };
    try {
      localStorage.setItem(`sermon-${this.playerId}`, JSON.stringify(state));
    } catch {
      // private browsing or quota exceeded — playback must not break over a lost resume point
    }
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
      this.updateSpeedText(CONFIG.speeds[this.currentSpeedIndex] ?? 1);
    }

    const isRecent =
      this.savedState.lastPlayed &&
      Date.now() - this.savedState.lastPlayed < CONFIG.localStorage.audioTTL;

    // resuming within the last few seconds just replays the outro, so treat a finished sermon as unstarted
    const duration = this.audio.duration;
    const nearEnd = Number.isFinite(duration) && this.savedState.currentTime > duration - 15;

    if (isRecent && this.savedState.currentTime > 5 && !nearEnd) {
      this.audio.currentTime = this.savedState.currentTime;
      this.updateProgress();
      this.updateTime();
    }
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (!this.container.contains(document.activeElement)) return;

    const keyActions: Record<string, () => void> = {
      ' ': () => this.togglePlayPause(),
      ArrowLeft: () => this.skip(event.shiftKey ? CONFIG.skip.shiftBackward : CONFIG.skip.backward),
      ArrowRight: () => this.skip(event.shiftKey ? CONFIG.skip.shiftForward : CONFIG.skip.forward),
    };

    const action = keyActions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  private setupMediaSession(): void {
    // the markup has no .player-header, so the old selector always fell through to the generic label
    const title = this.container.dataset.title || 'Sermon';

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: 'Saints Church',
      artwork: [{ src: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    });

    const actions: [MediaSessionAction, () => void][] = [
      [
        'play',
        (): void => {
          void this.play();
        },
      ],
      [
        'pause',
        (): void => {
          this.pause();
        },
      ],
      [
        'seekbackward',
        (): void => {
          this.skip(CONFIG.skip.backward);
        },
      ],
      [
        'seekforward',
        (): void => {
          this.skip(CONFIG.skip.forward);
        },
      ],
    ];
    for (const [action, handler] of actions) {
      navigator.mediaSession.setActionHandler(action, handler);
    }
  }
}

const activePlayers: SermonPlayer[] = [];

// MediaSession is global, so two players on one page would otherwise fight over it and both keep playing
function pauseOtherPlayers(current: SermonPlayer): void {
  for (const player of activePlayers) {
    if (player !== current) {
      player.pauseIfPlaying();
    }
  }
}

export function initAudioPlayers(): void {
  const players = document.querySelectorAll<HTMLElement>('.sermon-player');
  for (const player of players) {
    activePlayers.push(new SermonPlayer(player));
  }
}
