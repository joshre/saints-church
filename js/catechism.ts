import { CONFIG } from './config';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'catechism-mode';

function getMostRecentSundayUTC(date: Date): number {
  const utcDay = date.getUTCDay(); // 0 = Sunday
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - utcDay);
}

function getCurrentQuestionNumber(): number {
  const currentSundayUTC = getMostRecentSundayUTC(new Date());
  const anchorUTC = CONFIG.catechism.anchorDate;

  const diffWeeks = Math.round((currentSundayUTC - anchorUTC) / MS_PER_WEEK);
  const total = CONFIG.catechism.totalQuestions;

  return ((diffWeeks % total) + total) % total + 1;
}

export function initCatechism(): void {
  const container = document.getElementById('catechism-questions');
  if (!container) return;

  const questionNumber = getCurrentQuestionNumber();

  // Hide all questions except the current week's
  container.querySelectorAll<HTMLElement>('[data-catechism]').forEach(item => {
    if (Number(item.dataset.catechism) !== questionNumber) {
      item.hidden = true;
    }
  });

  // Update badge
  const badge = document.getElementById('catechism-week-badge');
  if (badge) badge.textContent = `Question ${questionNumber}`;

  // Sync checkbox with localStorage (checked = adult)
  const checkbox = document.getElementById('catechism-mode') as HTMLInputElement | null;
  if (!checkbox) return;

  if (localStorage.getItem(STORAGE_KEY) === 'adult') {
    checkbox.checked = true;
  }

  checkbox.addEventListener('change', () => {
    localStorage.setItem(STORAGE_KEY, checkbox.checked ? 'adult' : 'kids');
  });
}
