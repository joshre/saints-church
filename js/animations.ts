import { CONFIG } from './config';

export function initScrollAnimations(): void {
  const animatedElements = document.querySelectorAll('.animate-reveal, .animate-fade-in, .animate-children');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('run');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: CONFIG.animation.thresholds,
    rootMargin: CONFIG.animation.rootMargin,
  });

  animatedElements.forEach(el => observer.observe(el));
}
