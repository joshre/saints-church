export function toggleClasses(element: Element, add?: string | string[] | null, remove?: string | string[] | null): void {
  if (add) element.classList.add(...[add].flat());
  if (remove) element.classList.remove(...[remove].flat());
}

export function bindEventListeners<K extends keyof HTMLElementEventMap>(
  elements: NodeListOf<HTMLElement>,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
): void {
  elements.forEach(el => el.addEventListener(event, handler));
}

export function getElements(container: Element, selectors: Record<string, string>): Record<string, NodeListOf<HTMLElement>> {
  const result: Record<string, NodeListOf<HTMLElement>> = {};
  for (const [key, selector] of Object.entries(selectors)) {
    result[key] = container.querySelectorAll(selector);
  }
  return result;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '--:--';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function parseUrl(url?: string | null): string {
  return url?.split('/').pop()?.split('.')[0] || 'unknown';
}
