import { CONFIG } from './config';
import { toggleClasses } from './utils';

export function initMobileNav(): void {
  const elements = {
    button: document.getElementById('mobile-menu-button'),
    menu: document.getElementById('mobile-menu'),
    panel: document.getElementById('mobile-menu-panel'),
    close: document.getElementById('mobile-menu-close'),
    backdrop: document.getElementById('mobile-menu-backdrop'),
    menuIcon: document.getElementById('menu-icon'),
    closeIcon: document.getElementById('close-icon'),
  };

  if (!elements.button || !elements.menu || !elements.panel) return;

  const toggleMenu = (show: boolean): void => {
    if (show) {
      toggleClasses(elements.menu!, null, 'hidden');
      toggleClasses(elements.menuIcon!, 'hidden');
      toggleClasses(elements.closeIcon!, null, 'hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        toggleClasses(elements.panel!, 'translate-x-0', 'translate-x-full');
      });
    } else {
      toggleClasses(elements.panel!, 'translate-x-full', 'translate-x-0');
      setTimeout(() => {
        toggleClasses(elements.menu!, 'hidden');
        toggleClasses(elements.menuIcon!, null, 'hidden');
        toggleClasses(elements.closeIcon!, 'hidden');
        document.body.style.overflow = '';
      }, CONFIG.animation.duration);
    }
  };

  elements.button.addEventListener('click', () => toggleMenu(true));
  elements.close?.addEventListener('click', () => toggleMenu(false));
  elements.backdrop?.addEventListener('click', () => toggleMenu(false));

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !elements.menu!.classList.contains('hidden')) {
      toggleMenu(false);
    }
  });
}
