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

// Mobile navigation functionality
function initMobileNav() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  if (!mobileMenuButton || !mobileMenu) return;

  function showMenu() {
    mobileMenu.classList.remove('hidden');
    menuIcon.classList.add('hidden');
    closeIcon.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function hideMenu() {
    mobileMenu.classList.add('hidden');
    menuIcon.classList.remove('hidden');
    closeIcon.classList.add('hidden');
    document.body.style.overflow = '';
  }

  mobileMenuButton.addEventListener('click', showMenu);

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', hideMenu);
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', hideMenu);
  }

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      hideMenu();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initMobileNav();
  });
} else {
  initScrollAnimations();
  initMobileNav();
}

