import '@tailwindplus/elements';

import { initScrollAnimations } from './animations';
import { initAudioPlayers } from './audio-player';
import { initCatechism } from './catechism';
import { initMobileNav } from './nav';
import { initTranscriptionEnhancements } from './transcription';

function initAll(): void {
  initScrollAnimations();
  initMobileNav();
  initAudioPlayers();
  initTranscriptionEnhancements();
  initCatechism();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
