const DEFAULT_PAGE_SIZE = 12;

export function initSermonArchive(): void {
  const button = document.getElementById('load-more-btn');
  const list = document.getElementById('sermon-list');
  const showingCount = document.getElementById('showing-count');
  if (!(button && list)) return;

  // the same value drives the Liquid hide threshold, so read it rather than restate it
  const pageSize = Number(list.dataset.pageSize) || DEFAULT_PAGE_SIZE;

  button.addEventListener('click', () => {
    const hidden = list.querySelectorAll<HTMLElement>('.sermon-item.hidden');
    for (const item of Array.from(hidden).slice(0, pageSize)) {
      item.classList.remove('hidden');
    }

    if (showingCount) {
      showingCount.textContent = String(list.querySelectorAll('.sermon-item:not(.hidden)').length);
    }
    if (hidden.length <= pageSize) button.remove();
  });
}
