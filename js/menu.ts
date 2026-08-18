export function initDisclosureMenus(): void {
  const menus = document.querySelectorAll<HTMLDetailsElement>('details.subscribe-menu');
  if (menus.length === 0) return;

  const closeAll = (except?: HTMLDetailsElement | null): void => {
    for (const menu of menus) {
      if (menu !== except) menu.open = false;
    }
  };

  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as Element | null;
    closeAll(target?.closest<HTMLDetailsElement>('details.subscribe-menu'));
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeAll();
  });
}
