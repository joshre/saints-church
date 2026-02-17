import { CONFIG } from './config';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function getMostRecentSundayUTC(date: Date): number {
  const utcDay = date.getUTCDay(); // 0 = Sunday
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - utcDay);
}

function getCurrentQuestionNumber(): number {
  const currentSundayUTC = getMostRecentSundayUTC(new Date());
  const anchorUTC = CONFIG.catechism.anchorDate;

  const diffWeeks = Math.round((currentSundayUTC - anchorUTC) / MS_PER_WEEK);
  const total = CONFIG.catechism.totalQuestions;

  // Wrap around every 52 weeks, 1-indexed
  return ((diffWeeks % total) + total) % total + 1;
}

export function initCatechism(): void {
  const container = document.getElementById('catechism-questions');
  if (!container) return;

  const questionNumber = getCurrentQuestionNumber();
  const items = container.querySelectorAll<HTMLElement>('[data-catechism]');

  // Hide all questions except the current week's
  items.forEach(item => {
    if (Number(item.dataset.catechism) !== questionNumber) {
      item.hidden = true;
    }
  });

  // Update the question number in the heading badge
  const badge = document.getElementById('catechism-week-badge');
  if (badge) {
    badge.textContent = `Question ${questionNumber}`;
  }
}
