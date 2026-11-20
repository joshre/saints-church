export function initWorshipGuideBanner(): void {
  const banner = document.getElementById('worship-guide-banner');
  if (!banner) return;

  const dismissalKey = 'worship-guide-dismissed-on';
  let dismissedOn: string | null = null;
  try {
    dismissedOn = window.sessionStorage.getItem(dismissalKey);
  } catch {
    // storage can be unavailable in restricted browsers
  }

  const easternTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });

  const updateVisibility = (): void => {
    const now = new Date();
    const parts = easternTime.formatToParts(now);
    const weekday = parts.find((part) => part.type === 'weekday')?.value;
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    const minutesSinceMidnight = hour * 60 + minute;
    const inService = weekday === 'Sun' && minutesSinceMidnight >= 9 * 60 + 30 && hour < 12;
    const showPanel = inService && dismissedOn !== now.toISOString().slice(0, 10);
    if (!showPanel && banner.contains(document.activeElement)) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
    banner.hidden = !showPanel;
  };

  function updateOnMinuteBoundary(): void {
    updateVisibility();
    window.setTimeout(updateOnMinuteBoundary, 60_000 - (Date.now() % 60_000));
  }

  updateOnMinuteBoundary();
  banner.querySelector('[data-dismiss-worship-guide]')?.addEventListener('click', () => {
    dismissedOn = new Date().toISOString().slice(0, 10);
    updateVisibility();
    try {
      window.sessionStorage.setItem(dismissalKey, dismissedOn);
    } catch {
      // dismissal still applies on this page
    }
  });
  document.addEventListener('visibilitychange', updateVisibility);
  window.addEventListener('pageshow', updateVisibility);
}
