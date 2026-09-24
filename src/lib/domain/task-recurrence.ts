import { addCalendarDays } from "@/lib/domain/routines";

export type ParsedTaskRecurrence =
  | { kind: "daily" }
  | { kind: "weekly"; weekdays: number[] }
  | { kind: "monthly"; dayOfMonth: number };

export function parseTaskRecurrence(rule: string | null | undefined): ParsedTaskRecurrence | null {
  if (!rule) return null;
  if (rule === "daily") return { kind: "daily" };
  if (rule.startsWith("weekly:")) {
    const weekdays = rule
      .slice("weekly:".length)
      .split(",")
      .map(Number)
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7);
    const unique = Array.from(new Set(weekdays)).sort((a, b) => a - b);
    return unique.length ? { kind: "weekly", weekdays: unique } : null;
  }
  if (rule.startsWith("monthly:")) {
    const dayOfMonth = Number(rule.slice("monthly:".length));
    return Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31
      ? { kind: "monthly", dayOfMonth }
      : null;
  }
  return null;
}

export function taskOccursOn(input: {
  plannedOn: string | null;
  recurrenceRule: string | null;
  recurrenceUntil: string | null;
  date: string;
}): boolean {
  const { plannedOn, recurrenceRule, recurrenceUntil, date } = input;
  if (!plannedOn || date < plannedOn) return false;
  if (recurrenceUntil && date > recurrenceUntil) return false;
  const recurrence = parseTaskRecurrence(recurrenceRule);
  if (!recurrence) return date === plannedOn;
  if (recurrence.kind === "daily") return true;
  if (recurrence.kind === "weekly") return recurrence.weekdays.includes(isoWeekday(date));
  return Number(date.slice(8, 10)) === recurrence.dayOfMonth;
}

export function taskOccurrencesBetween(input: {
  plannedOn: string | null;
  recurrenceRule: string | null;
  recurrenceUntil: string | null;
  start: string;
  end: string;
  limit?: number;
}): string[] {
  const result: string[] = [];
  const max = Math.max(1, input.limit ?? 60);
  let cursor = input.start;
  while (cursor <= input.end && result.length < max) {
    if (taskOccursOn({ ...input, date: cursor })) result.push(cursor);
    cursor = addCalendarDays(cursor, 1);
  }
  return result;
}

export function describeTaskRecurrence(rule: string | null | undefined): string | null {
  const recurrence = parseTaskRecurrence(rule);
  if (!recurrence) return null;
  if (recurrence.kind === "daily") return "Tous les jours";
  if (recurrence.kind === "monthly") return `Chaque mois, le ${recurrence.dayOfMonth}`;
  const labels = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
  return `Chaque ${recurrence.weekdays.map((day) => labels[day - 1]).join(", ")}`;
}

export function isoWeekday(date: string): number {
  const value = new Date(`${date}T12:00:00Z`);
  return value.getUTCDay() || 7;
}
