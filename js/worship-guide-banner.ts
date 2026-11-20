export function initWorshipGuideBanner(): void {
  const banner = document.getElementById('worship-guide-banner');
  if (!banner) return;

  const easternTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });

  const updateVisibility = (): void => {
    const parts = easternTime.formatToParts(new Date());
    const weekday = parts.find((part) => part.type === 'weekday')?.value;
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    const minutesSinceMidnight = hour * 60 + minute;
    banner.hidden = !(weekday === 'Sun' && minutesSinceMidnight >= 9 * 60 + 30 && hour < 12);
  };

  function updateOnMinuteBoundary(): void {
    updateVisibility();
    window.setTimeout(updateOnMinuteBoundary, 60_000 - (Date.now() % 60_000));
  }

  updateOnMinuteBoundary();
  document.addEventListener('visibilitychange', updateVisibility);
  window.addEventListener('pageshow', updateVisibility);
}
