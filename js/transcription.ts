import { CONFIG } from './config';

export function initTranscriptionEnhancements(): void {
  const transcription = document.getElementById('sermon-transcription');
  const progressIndicator = document.getElementById('reading-progress');
  const transcriptDetails = document.querySelector<HTMLDetailsElement>('.transcript-details');

  // SEO optimization: Start open for crawlers, then close for UX
  if (transcriptDetails?.hasAttribute('open')) {
    setTimeout(() => transcriptDetails.removeAttribute('open'), 100);
  }

  if (!transcription) return;

  let lastScrollPosition = 0;
  let ticking = false;

  function savePosition(progress: number): void {
    localStorage.setItem(`reading-${location.pathname}`, JSON.stringify({
      progress,
      timestamp: Date.now(),
    }));
  }

  function restorePosition(): void {
    const saved = localStorage.getItem(`reading-${location.pathname}`);
    if (!saved) return;

    try {
      const data = JSON.parse(saved) as { progress: number; timestamp: number };
      const isRecent = data.timestamp > Date.now() - CONFIG.localStorage.readingTTL;
      const hasProgress = data.progress > CONFIG.reading.minProgress;

      if (isRecent && hasProgress) {
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = data.progress * documentHeight;

        setTimeout(() => {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }, CONFIG.reading.restoreDelay);
      }
    } catch {
      // Silently ignore parsing errors
    }
  }

  function updateProgress(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / documentHeight, 0), 1);

    if (progressIndicator) {
      const progressBar = progressIndicator.querySelector<HTMLElement>('div');
      if (progressBar) progressBar.style.height = `${progress * 100}%`;
    }

    if (Math.abs(scrollTop - lastScrollPosition) > CONFIG.reading.scrollDebounce) {
      lastScrollPosition = scrollTop;
      savePosition(progress);
    }
    ticking = false;
  }

  function onScroll(): void {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }

  function handleKeyboard(event: KeyboardEvent): void {
    if (['INPUT', 'TEXTAREA'].includes((event.target as Element).tagName)) return;

    const shortcuts: Record<string, () => void> = {
      'Home': () => transcription!.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      'End': () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
      'PageUp': () => window.scrollBy({ top: -window.innerHeight * CONFIG.reading.scrollRatio, behavior: 'smooth' }),
      'PageDown': () => window.scrollBy({ top: window.innerHeight * CONFIG.reading.scrollRatio, behavior: 'smooth' }),
    };

    const action = shortcuts[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  // Enable reading enhancements when transcription is long enough
  if (transcription.scrollHeight > window.innerHeight * 2) {
    progressIndicator?.classList.remove('hidden');
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', handleKeyboard);
    restorePosition();
  }
}
