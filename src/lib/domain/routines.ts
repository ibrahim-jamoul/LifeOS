export type RoutineFrequency = "daily" | "weekly" | "monthly" | "flexible" | "contextual";

export type RoutineSchedule = {
  frequency: string;
  active?: boolean | null;
  scheduleWeekday?: number | null;
  scheduleDayOfMonth?: number | null;
  startOn?: string | null;
  endOn?: string | null;
  pausedAt?: string | null;
  archivedAt?: string | null;
};

export type RoutineCompletionWindow = Readonly<{ startsOn: string; endsOn: string; label: "day" | "week" | "month" }>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function calendarDateInTimeZone(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function isRoutineScheduledOn(schedule: RoutineSchedule, dateOnly: string): boolean {
  if (!DATE_ONLY.test(dateOnly) || !isRoutineAvailableOn(schedule, dateOnly)) return false;

  switch (schedule.frequency as RoutineFrequency) {
    case "daily":
      return true;
    case "weekly":
      return schedule.scheduleWeekday !== null
        && schedule.scheduleWeekday !== undefined
        && isoWeekday(dateOnly) === schedule.scheduleWeekday;
    case "monthly":
      return schedule.scheduleDayOfMonth !== null
        && schedule.scheduleDayOfMonth !== undefined
        && Number(dateOnly.slice(8, 10)) === schedule.scheduleDayOfMonth;
    case "flexible":
    case "contextual":
    default:
      return false;
  }
}

/**
 * Returns whether a routine can be acted on that day without inventing a
 * missing weekday/month day. Unscheduled weekly/monthly routines remain one
 * checkable occurrence for their current period.
 */
export function isRoutineActionableOn(schedule: RoutineSchedule, dateOnly: string): boolean {
  if (!DATE_ONLY.test(dateOnly) || !isRoutineAvailableOn(schedule, dateOnly)) return false;
  if (schedule.frequency === "weekly" && (schedule.scheduleWeekday === null || schedule.scheduleWeekday === undefined)) return true;
  if (schedule.frequency === "monthly" && (schedule.scheduleDayOfMonth === null || schedule.scheduleDayOfMonth === undefined)) return true;
  if (schedule.frequency === "flexible" || schedule.frequency === "contextual") return true;
  return isRoutineScheduledOn(schedule, dateOnly);
}

export function routineCompletionWindow(schedule: RoutineSchedule, dateOnly: string): RoutineCompletionWindow | null {
  if (!DATE_ONLY.test(dateOnly) || !isRoutineActionableOn(schedule, dateOnly)) return null;
  if (schedule.frequency === "weekly" && (schedule.scheduleWeekday === null || schedule.scheduleWeekday === undefined)) {
    const startsOn = addCalendarDays(dateOnly, 1 - isoWeekday(dateOnly));
    return { startsOn, endsOn: addCalendarDays(startsOn, 6), label: "week" };
  }
  if (schedule.frequency === "monthly" && (schedule.scheduleDayOfMonth === null || schedule.scheduleDayOfMonth === undefined)) {
    const startsOn = `${dateOnly.slice(0, 7)}-01`;
    const [year, month] = startsOn.split("-").map(Number);
    const nextMonth = new Date(Date.UTC(year!, month!, 1, 12)).toISOString().slice(0, 10);
    return { startsOn, endsOn: addCalendarDays(nextMonth, -1), label: "month" };
  }
  return { startsOn: dateOnly, endsOn: dateOnly, label: "day" };
}

export function nextRoutineOccurrence(schedule: RoutineSchedule, fromDate: string, includeFromDate = true): string | null {
  if (!DATE_ONLY.test(fromDate)) return null;
  if (schedule.active === false || schedule.pausedAt || schedule.archivedAt) return null;
  if (schedule.endOn && fromDate > schedule.endOn) return null;
  if (schedule.startOn && schedule.startOn > fromDate) return nextRoutineOccurrence(schedule, schedule.startOn, true);
  if (schedule.frequency === "weekly" && (schedule.scheduleWeekday === null || schedule.scheduleWeekday === undefined)) {
    if (includeFromDate) return fromDate;
    const nextWeek = addCalendarDays(fromDate, 8 - isoWeekday(fromDate));
    return schedule.endOn && nextWeek > schedule.endOn ? null : nextWeek;
  }
  if (schedule.frequency === "monthly" && (schedule.scheduleDayOfMonth === null || schedule.scheduleDayOfMonth === undefined)) {
    if (includeFromDate) return fromDate;
    const [year, month] = fromDate.split("-").map(Number);
    const nextMonth = new Date(Date.UTC(year!, month!, 1, 12)).toISOString().slice(0, 10);
    return schedule.endOn && nextMonth > schedule.endOn ? null : nextMonth;
  }
  const firstOffset = includeFromDate ? 0 : 1;
  for (let offset = firstOffset; offset <= 370; offset += 1) {
    const candidate = addCalendarDays(fromDate, offset);
    if (isRoutineScheduledOn(schedule, candidate)) return candidate;
    if (schedule.endOn && candidate > schedule.endOn) return null;
  }
  return null;
}

export function scheduledRoutineDates(schedule: RoutineSchedule, startDate: string, endDate: string): string[] {
  if (!DATE_ONLY.test(startDate) || !DATE_ONLY.test(endDate) || startDate > endDate) return [];
  const dates: string[] = [];
  for (let offset = 0; offset <= 370; offset += 1) {
    const candidate = addCalendarDays(startDate, offset);
    if (candidate > endDate) break;
    if (isRoutineScheduledOn(schedule, candidate)) dates.push(candidate);
  }
  return dates;
}

export function addCalendarDays(dateOnly: string, days: number): string {
  if (!DATE_ONLY.test(dateOnly)) throw new Error("Invalid calendar date.");
  const [year, month, day] = dateOnly.split("-").map(Number);
  const value = new Date(Date.UTC(year!, month! - 1, day! + days, 12));
  return value.toISOString().slice(0, 10);
}

export function isoWeekday(dateOnly: string): number {
  if (!DATE_ONLY.test(dateOnly)) throw new Error("Invalid calendar date.");
  const [year, month, day] = dateOnly.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!, 12)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function isRoutineAvailableOn(schedule: RoutineSchedule, dateOnly: string): boolean {
  if (schedule.active === false || schedule.pausedAt || schedule.archivedAt) return false;
  if (schedule.startOn && dateOnly < schedule.startOn) return false;
  if (schedule.endOn && dateOnly > schedule.endOn) return false;
  return true;
}
