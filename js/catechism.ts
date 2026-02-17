import { CONFIG } from './config';

function getMostRecentSunday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - dayOfWeek);
  return d;
}

function getCurrentQuestionNumber(): number {
  const today = new Date();
  const currentSunday = getMostRecentSunday(today);
  const anchorSunday = CONFIG.catechism.anchorDate;

  const diffMs = currentSunday.getTime() - anchorSunday.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * CONFIG.catechism.msPerDay));

  // Wrap around every 52 weeks, 1-indexed
  return ((diffWeeks % CONFIG.catechism.totalQuestions) + CONFIG.catechism.totalQuestions) % CONFIG.catechism.totalQuestions + 1;
}

export function initCatechism(): void {
  const container = document.getElementById('catechism-questions');
  if (!container) return;

  const questionNumber = getCurrentQuestionNumber();
  const items = container.querySelectorAll<HTMLElement>('[data-catechism]');

  // Hide all questions except the current week's
  items.forEach(item => {
    const num = Number(item.dataset.catechism);
    if (num !== questionNumber) {
      item.hidden = true;
    }
  });

  // Update the question number in the heading badge
  const badge = document.getElementById('catechism-week-badge');
  if (badge) {
    badge.textContent = `Question ${questionNumber}`;
  }
}
