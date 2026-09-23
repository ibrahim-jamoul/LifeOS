export type RoutineFrequency = "daily" | "weekly" | "monthly" | "flexible" | "contextual";

export type RoutineSchedule = {
  frequency: string;
  active?: boolean | null;
  scheduleWeekday?: number | null;
  scheduleDayOfMonth?: number | null;
  /**
   * ISO weekdays (1 = Monday, 7 = Sunday) that form one execution window.
   * Example: [6, 7] means one weekly/weekend occurrence that may be completed
   * on Saturday or Sunday, not two separate occurrences.
   */
  scheduleWindowWeekdays?: readonly number[] | null;
  /**
   * Optional ordinal occurrences of the configured weekday/window within the
   * calendar month. Example: [1, 2, 3] = first three weekend windows.
   */
  scheduleMonthWeeks?: readonly number[] | null;
  startOn?: string | null;
  endOn?: string | null;
  pausedAt?: string | null;
  archivedAt?: string | null;
};

export type RoutineCompletionWindow = Readonly<{ startsOn: string; endsOn: string; label: "day" | "week" | "month" }>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_LABELS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

export function calendarDateInTimeZone(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

/**
 * Calendar completeness is determined from the fields actually required to
 * place an occurrence. configuration_status may describe other incomplete
 * metadata (duration, reminder time, etc.) and therefore must not be used as a
 * blanket gate for Aujourd'hui.
 */
export function isRoutineCalendarConfigured(schedule: RoutineSchedule): boolean {
  switch (schedule.frequency as RoutineFrequency) {
    case "daily":
      return true;
    case "weekly":
      return validWeekday(schedule.scheduleWeekday) || normalizedWindowWeekdays(schedule).length > 0;
    case "monthly":
      return validMonthDay(schedule.scheduleDayOfMonth) || normalizedWindowWeekdays(schedule).length > 0;
    case "flexible":
    case "contextual":
    default:
      return false;
  }
}

export function isRoutineScheduledOn(schedule: RoutineSchedule, dateOnly: string): boolean {
  if (!DATE_ONLY.test(dateOnly) || !isRoutineAvailableOn(schedule, dateOnly) || !isRoutineCalendarConfigured(schedule)) return false;

  const windowWeekdays = normalizedWindowWeekdays(schedule);
  const weekday = isoWeekday(dateOnly);
  let matchesBaseSchedule = false;

  switch (schedule.frequency as RoutineFrequency) {
    case "daily":
      matchesBaseSchedule = true;
      break;
    case "weekly":
      matchesBaseSchedule = windowWeekdays.length > 0
        ? windowWeekdays.includes(weekday)
        : weekday === schedule.scheduleWeekday;
      break;
    case "monthly":
      matchesBaseSchedule = validMonthDay(schedule.scheduleDayOfMonth)
        ? Number(dateOnly.slice(8, 10)) === schedule.scheduleDayOfMonth
        : windowWeekdays.includes(weekday);
      break;
    case "flexible":
    case "contextual":
    default:
      return false;
  }

  return matchesBaseSchedule && matchesMonthWeekFilter(schedule, dateOnly);
}

/**
 * Backward-compatible name used by the API/dashboard. "Actionable" now means
 * that the routine is genuinely scheduled on that date; an undated weekly,
 * monthly, flexible or contextual routine is not actionable in Aujourd'hui.
 */
export function isRoutineActionableOn(schedule: RoutineSchedule, dateOnly: string): boolean {
  return isRoutineScheduledOn(schedule, dateOnly);
}

export function routineCompletionWindow(schedule: RoutineSchedule, dateOnly: string): RoutineCompletionWindow | null {
  if (!DATE_ONLY.test(dateOnly) || !isRoutineScheduledOn(schedule, dateOnly)) return null;
  const windowWeekdays = normalizedWindowWeekdays(schedule);

  if (schedule.frequency === "weekly" && windowWeekdays.length > 0) {
    const weekStart = addCalendarDays(dateOnly, 1 - isoWeekday(dateOnly));
    const eligibleDates = windowWeekdays
      .map((weekday) => addCalendarDays(weekStart, weekday - 1))
      .filter((candidate) => isRoutineScheduledOn(schedule, candidate));
    if (eligibleDates.length === 0) return null;
    return {
      startsOn: eligibleDates[0]!,
      endsOn: eligibleDates[eligibleDates.length - 1]!,
      label: "week",
    };
  }

  if (schedule.frequency === "monthly" && windowWeekdays.length > 0) {
    const monthStart = `${dateOnly.slice(0, 7)}-01`;
    const [year, month] = monthStart.split("-").map(Number);
    const nextMonth = new Date(Date.UTC(year!, month!, 1, 12)).toISOString().slice(0, 10);
    return {
      startsOn: maxDate(monthStart, schedule.startOn ?? monthStart),
      endsOn: minDate(addCalendarDays(nextMonth, -1), schedule.endOn ?? addCalendarDays(nextMonth, -1)),
      label: "month",
    };
  }

  return { startsOn: dateOnly, endsOn: dateOnly, label: "day" };
}

export function routineCompletedForOccurrence(
  schedule: RoutineSchedule,
  dateOnly: string,
  completedDates: readonly string[],
): boolean {
  const window = routineCompletionWindow(schedule, dateOnly);
  if (!window) return false;
  return completedDates.some((completedOn) => completedOn >= window.startsOn && completedOn <= window.endsOn);
}

export function routineReasonForDate(schedule: RoutineSchedule, dateOnly: string): string {
  if (!isRoutineScheduledOn(schedule, dateOnly)) return "Routine planifiée";
  const windowWeekdays = normalizedWindowWeekdays(schedule);

  if (schedule.frequency === "daily") return "Routine quotidienne";
  if (isWeekendWindow(windowWeekdays)) return "Prévu ce week-end";
  if (schedule.frequency === "weekly" && validWeekday(schedule.scheduleWeekday)) {
    return `Prévu ce ${WEEKDAY_LABELS[schedule.scheduleWeekday!]}`;
  }
  if (schedule.frequency === "monthly" && validMonthDay(schedule.scheduleDayOfMonth)) return "Prévu aujourd’hui";
  if (schedule.frequency === "weekly") return "Routine hebdomadaire planifiée";
  if (schedule.frequency === "monthly") return "Routine mensuelle planifiée";
  return "Routine planifiée";
}

export function nextRoutineOccurrence(schedule: RoutineSchedule, fromDate: string, includeFromDate = true): string | null {
  if (!DATE_ONLY.test(fromDate) || !isRoutineCalendarConfigured(schedule)) return null;
  if (schedule.active === false || schedule.pausedAt || schedule.archivedAt) return null;
  if (schedule.endOn && fromDate > schedule.endOn) return null;

  let cursor = schedule.startOn && schedule.startOn > fromDate ? schedule.startOn : fromDate;
  if (!includeFromDate && cursor === fromDate) {
    const currentWindow = routineCompletionWindow(schedule, fromDate);
    cursor = currentWindow ? addCalendarDays(currentWindow.endsOn, 1) : addCalendarDays(fromDate, 1);
  }

  for (let offset = 0; offset <= 740; offset += 1) {
    const candidate = addCalendarDays(cursor, offset);
    if (schedule.endOn && candidate > schedule.endOn) return null;
    if (isRoutineScheduledOn(schedule, candidate)) return candidate;
  }
  return null;
}

export function scheduledRoutineDates(schedule: RoutineSchedule, startDate: string, endDate: string): string[] {
  if (!DATE_ONLY.test(startDate) || !DATE_ONLY.test(endDate) || startDate > endDate) return [];
  const dates: string[] = [];
  for (let offset = 0; offset <= 740; offset += 1) {
    const candidate = addCalendarDays(startDate, offset);
    if (candidate > endDate) break;
    if (isRoutineScheduledOn(schedule, candidate)) dates.push(candidate);
  }
  return dates;
}

/** Returns unique logical occurrences, so a Saturday+Sunday window counts once. */
export function scheduledRoutineWindows(schedule: RoutineSchedule, startDate: string, endDate: string): RoutineCompletionWindow[] {
  const windows = new Map<string, RoutineCompletionWindow>();
  for (const date of scheduledRoutineDates(schedule, startDate, endDate)) {
    const window = routineCompletionWindow(schedule, date);
    if (window) windows.set(`${window.label}:${window.startsOn}:${window.endsOn}`, window);
  }
  return [...windows.values()].sort((left, right) => left.startsOn.localeCompare(right.startsOn));
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

function matchesMonthWeekFilter(schedule: RoutineSchedule, dateOnly: string): boolean {
  const allowedWeeks = normalizedMonthWeeks(schedule);
  if (allowedWeeks.length === 0) return true;

  const windowWeekdays = normalizedWindowWeekdays(schedule);
  const scheduleWeekdays = windowWeekdays.length > 0
    ? windowWeekdays
    : validWeekday(schedule.scheduleWeekday) ? [schedule.scheduleWeekday!] : [];

  const ordinal = scheduleWeekdays.length > 0
    ? weekdayWindowOrdinalInMonth(dateOnly, scheduleWeekdays)
    : Math.ceil(Number(dateOnly.slice(8, 10)) / 7);
  return allowedWeeks.includes(ordinal);
}

/**
 * Counts distinct ISO-week windows containing one of the configured weekdays
 * in the same month. This keeps Saturday+Sunday as one "week of month" instead
 * of splitting a weekend merely because two dates straddle a 7-day bucket.
 */
function weekdayWindowOrdinalInMonth(dateOnly: string, weekdays: readonly number[]): number {
  const monthStart = `${dateOnly.slice(0, 7)}-01`;
  const currentWeekStart = addCalendarDays(dateOnly, 1 - isoWeekday(dateOnly));
  const seen = new Set<string>();

  for (let offset = 0; offset < 31; offset += 1) {
    const candidate = addCalendarDays(monthStart, offset);
    if (candidate.slice(0, 7) !== dateOnly.slice(0, 7) || candidate > dateOnly) break;
    if (!weekdays.includes(isoWeekday(candidate))) continue;
    seen.add(addCalendarDays(candidate, 1 - isoWeekday(candidate)));
  }

  return [...seen].sort().findIndex((weekStart) => weekStart === currentWeekStart) + 1;
}

function normalizedWindowWeekdays(schedule: RoutineSchedule): number[] {
  return [...new Set((schedule.scheduleWindowWeekdays ?? []).filter(validWeekday))].sort((left, right) => left - right);
}

function normalizedMonthWeeks(schedule: RoutineSchedule): number[] {
  return [...new Set((schedule.scheduleMonthWeeks ?? []).filter((value) => Number.isInteger(value) && value >= 1 && value <= 5))].sort((left, right) => left - right);
}

function isWeekendWindow(weekdays: readonly number[]): boolean {
  return weekdays.length === 2 && weekdays[0] === 6 && weekdays[1] === 7;
}

function validWeekday(value: number | null | undefined): value is number {
  return Number.isInteger(value) && value !== null && value !== undefined && value >= 1 && value <= 7;
}

function validMonthDay(value: number | null | undefined): value is number {
  return Number.isInteger(value) && value !== null && value !== undefined && value >= 1 && value <= 31;
}

function isRoutineAvailableOn(schedule: RoutineSchedule, dateOnly: string): boolean {
  if (schedule.active === false || schedule.pausedAt || schedule.archivedAt) return false;
  if (schedule.startOn && dateOnly < schedule.startOn) return false;
  if (schedule.endOn && dateOnly > schedule.endOn) return false;
  return true;
}

function minDate(left: string, right: string): string {
  return left < right ? left : right;
}

function maxDate(left: string, right: string): string {
  return left > right ? left : right;
}
