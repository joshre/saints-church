/**
 * Lightweight IntersectionObserver for scroll-based animations
 * Adds 'run' class when elements enter viewport
 */

function initScrollAnimations() {
  // Create observer with optimized settings
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add 'run' class to trigger animation
        entry.target.classList.add('run');
        
        // Unobserve element after animation triggers (performance optimization)
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Trigger when 30% of element is visible
    threshold: 0.3,
    // Start observing 100px before element enters viewport
    rootMargin: '0px 0px -100px 0px'
  });

  // Observe all elements with animation classes
  const animatedElements = document.querySelectorAll('.animate-reveal, .animate-fade-in, .animate-children');
  animatedElements.forEach(el => observer.observe(el));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}