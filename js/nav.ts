import { CONFIG } from './config';

export function initMobileNav(): void {
  const button = document.getElementById('mobile-menu-button');
  const menu = document.getElementById('mobile-menu');
  const panel = document.getElementById('mobile-menu-panel');
  const close = document.getElementById('mobile-menu-close');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  if (!(button && menu && panel && menuIcon && closeIcon)) return;

  let hideTimeout: number | undefined;

  const toggleMenu = (show: boolean): void => {
    // a reopen inside the close transition would otherwise let the old timer hide the menu again
    if (hideTimeout !== undefined) {
      clearTimeout(hideTimeout);
      hideTimeout = undefined;
    }

    if (show) {
      menu.classList.remove('hidden');
      menuIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        panel.classList.add('translate-x-0');
        panel.classList.remove('translate-x-full');
      });
    } else {
      panel.classList.add('translate-x-full');
      panel.classList.remove('translate-x-0');
      hideTimeout = window.setTimeout(() => {
        hideTimeout = undefined;
        menu.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
        document.body.style.overflow = '';
      }, CONFIG.animation.duration);
    }
  };

  button.addEventListener('click', () => toggleMenu(true));
  close?.addEventListener('click', () => toggleMenu(false));
  backdrop?.addEventListener('click', () => toggleMenu(false));

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
      toggleMenu(false);
    }
  });
}
