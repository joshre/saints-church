export const CONFIG = {
  skip: { backward: -15, forward: 15, shiftBackward: -30, shiftForward: 30 },
  animation: { duration: 300, thresholds: [0, 0.01, 0.05], rootMargin: '20px 0px 20px 0px' },
  localStorage: { audioTTL: 7 * 24 * 60 * 60 * 1000, readingTTL: 24 * 60 * 60 * 1000 },
  speeds: [1, 1.25, 1.5, 2] as const,
  reading: { minProgress: 0.05, scrollDebounce: 100, restoreDelay: 500, scrollRatio: 0.8 },
  catechism: {
    anchorDate: Date.UTC(2026, 0, 4), // Sunday, January 4, 2026 = Q1 (stored as UTC ms)
    totalQuestions: 52,
  },
};
