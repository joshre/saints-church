// Import Tailwind Elements
import '@tailwindplus/elements'

// Inline the animations functionality
function initScrollAnimations() {
  // Find all elements with animation classes
  const animatedElements = document.querySelectorAll('.animate-reveal, .animate-fade-in, .animate-children');

  // Create observer with mobile-optimized settings
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('run');
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Use multiple thresholds for reliable triggering, especially on mobile
    threshold: [0, 0.01, 0.05],
    // More generous rootMargin for mobile viewports
    rootMargin: '20px 0px 20px 0px'
  });

  // Observe all elements with animation classes
  animatedElements.forEach(el => observer.observe(el));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}

