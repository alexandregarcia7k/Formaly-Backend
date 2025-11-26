export function formatTimeSpent(seconds: number, short = false): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  if (short) {
    return `${minutes}m`;
  }

  return `${minutes}m ${secs}s`;
}
