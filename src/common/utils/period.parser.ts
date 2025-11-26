export function parsePeriod(period: string): number {
  const periodMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  return periodMap[period] || 30;
}
