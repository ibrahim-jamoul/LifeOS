const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export type CalendarItem = {
  date: string;
};

export function calendarMonthGrid(month: string): string[] {
  const first = parseMonth(month);
  const firstWeekday = first.getUTCDay() || 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - (firstWeekday - 1));

  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12));
  const daysThroughLast = Math.round((last.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const cellCount = daysThroughLast <= 35 ? 35 : 42;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function shiftCalendarMonth(month: string, amount: number): string {
  const value = parseMonth(month);
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value.toISOString().slice(0, 7);
}

export function groupCalendarItems<T extends CalendarItem>(items: readonly T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const existing = groups.get(item.date);
    if (existing) existing.push(item);
    else groups.set(item.date, [item]);
  }
  return groups;
}

function parseMonth(month: string): Date {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new RangeError("Expected an ISO calendar month");
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) throw new RangeError("Invalid ISO calendar month");
  return new Date(Date.UTC(year, monthIndex, 1, 12));
}
