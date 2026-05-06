import { CONFIG } from './config';

export function initScrollAnimations(): void {
  const animatedElements = document.querySelectorAll<HTMLElement>(
    '.animate-reveal, .animate-fade-in, .animate-children'
  );

  const run = (el: Element): void => {
    el.classList.add('run');
    observer.unobserve(el);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) run(entry.target);
      });
    },
    {
      threshold: CONFIG.animation.thresholds,
      rootMargin: CONFIG.animation.rootMargin,
    }
  );

  animatedElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (inViewport) {
      run(el);
    } else {
      observer.observe(el);
    }
  });

  // Rescue pass after images/fonts load — reflow may have moved elements into view
  // without triggering a scroll event, leaving them permanently at opacity:0
  window.addEventListener(
    'load',
    () => {
      animatedElements.forEach((el) => {
        if (!el.classList.contains('run')) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            run(el);
          }
        }
      });
    },
    { once: true }
  );
}
