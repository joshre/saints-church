import '@tailwindplus/elements';

import { initScrollAnimations } from './animations';
import { initAudioPlayers } from './audio-player';
import { initCatechism } from './catechism';
import { initDisclosureMenus } from './menu';
import { initMobileNav } from './nav';
import { initSermonArchive } from './sermons';
import { initTranscriptionEnhancements } from './transcription';
import { initWorshipGuideBanner } from './worship-guide-banner';

function initAll(): void {
  initWorshipGuideBanner();
  initScrollAnimations();
  initMobileNav();
  initDisclosureMenus();
  initAudioPlayers();
  initSermonArchive();
  initTranscriptionEnhancements();
  initCatechism();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
