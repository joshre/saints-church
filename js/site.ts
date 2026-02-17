import '@tailwindplus/elements';

import { initScrollAnimations } from './animations';
import { initMobileNav } from './nav';
import { initAudioPlayers } from './audio-player';
import { initTranscriptionEnhancements } from './transcription';
import { initCatechism } from './catechism';

function initAll(): void {
  initScrollAnimations();
  initMobileNav();
  initAudioPlayers();
  initTranscriptionEnhancements();
  initCatechism();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initAll)
  : initAll();
