export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '--:--';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function parseUrl(url?: string | null): string {
  return url?.split('/').pop()?.split('.')[0] || 'unknown';
}
