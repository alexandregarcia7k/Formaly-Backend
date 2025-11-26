export function fillDateRange(
  startDate: Date,
  endDate: Date,
  dataMap: Map<string, number>,
): Array<{ date: string; count: number }> {
  const result: Array<{ date: string; count: number }> = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().substring(0, 10);
    result.push({
      date: dateStr,
      count: dataMap.get(dateStr) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

export function getStartDate(days: number): Date {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return startDate;
}
