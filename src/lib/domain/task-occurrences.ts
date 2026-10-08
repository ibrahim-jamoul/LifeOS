import { taskOccursOn } from "@/lib/domain/task-recurrence";

export type TaskOccurrenceOverride = {
  taskId: string;
  occurrenceOn: string;
  rescheduledOn: string | null;
  completedAt: string | null;
};

export function occurrenceScheduledForDate(input: {
  taskId: string;
  plannedOn: string | null;
  recurrenceRule: string | null;
  recurrenceUntil: string | null;
  date: string;
  overrides: readonly TaskOccurrenceOverride[];
}): { occurrenceOn: string; completed: boolean } | null {
  const movedIn = input.overrides.find(
    (row) => row.taskId === input.taskId && row.rescheduledOn === input.date,
  );
  if (movedIn) {
    return { occurrenceOn: movedIn.occurrenceOn, completed: Boolean(movedIn.completedAt) };
  }

  if (!taskOccursOn({
    plannedOn: input.plannedOn,
    recurrenceRule: input.recurrenceRule,
    recurrenceUntil: input.recurrenceUntil,
    date: input.date,
  })) return null;

  const natural = input.overrides.find(
    (row) => row.taskId === input.taskId && row.occurrenceOn === input.date,
  );
  if (natural?.rescheduledOn && natural.rescheduledOn !== input.date) return null;
  return { occurrenceOn: input.date, completed: Boolean(natural?.completedAt) };
}

export function applyOccurrenceOverrides(input: {
  taskId: string;
  naturalDates: readonly string[];
  overrides: readonly TaskOccurrenceOverride[];
  start: string;
  end: string;
}): Array<{ date: string; occurrenceOn: string; completed: boolean }> {
  const rows = new Map<string, { date: string; occurrenceOn: string; completed: boolean }>();
  for (const date of input.naturalDates) {
    const override = input.overrides.find((row) => row.taskId === input.taskId && row.occurrenceOn === date);
    if (override?.rescheduledOn && override.rescheduledOn !== date) continue;
    rows.set(date, { date, occurrenceOn: date, completed: Boolean(override?.completedAt) });
  }
  for (const override of input.overrides) {
    if (override.taskId !== input.taskId || !override.rescheduledOn) continue;
    if (override.rescheduledOn < input.start || override.rescheduledOn > input.end) continue;
    rows.set(override.rescheduledOn, {
      date: override.rescheduledOn,
      occurrenceOn: override.occurrenceOn,
      completed: Boolean(override.completedAt),
    });
  }
  return [...rows.values()].sort((left, right) => left.date.localeCompare(right.date));
}
