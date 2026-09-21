export type DateInput = Date | string | number;

export type DueStatus = "no_due_date" | "complete" | "overdue" | "due_soon" | "upcoming";

export const DEFAULT_TERMINAL_STATUSES = [
  "achieved",
  "archived",
  "cancelled",
  "completed",
  "done",
] as const;

const DAY_IN_MS = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type CalendarDate = Readonly<{ year: number; month: number; day: number }>;

export type DueStatusInput = Readonly<{
  dueAt: DateInput | null | undefined;
  status?: string | null;
  now?: DateInput;
  dueSoonWithinMs?: number;
  terminalStatuses?: readonly string[];
  /** Used for date-only deadlines. Timestamp deadlines remain exact instants. */
  timeZone?: string;
}>;

export type IsoWeek = Readonly<{
  weekYear: number;
  week: number;
  key: string;
  startsOn: string;
  endsOn: string;
}>;

export function parseDateInput(input: DateInput): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date input");
  }
  return date;
}

function parseIsoDateOnly(value: string): CalendarDate | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const verification = new Date(Date.UTC(year, month - 1, day));

  if (
    verification.getUTCFullYear() !== year ||
    verification.getUTCMonth() !== month - 1 ||
    verification.getUTCDate() !== day
  ) {
    throw new RangeError("Invalid ISO calendar date");
  }

  return { year, month, day };
}

function calendarDateInTimeZone(date: Date, timeZone: string): CalendarDate {
  const formatter = new Intl.DateTimeFormat("en-CA-u-ca-iso8601-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const values: Partial<Record<"year" | "month" | "day", number>> = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      values[part.type] = Number(part.value);
    }
  }

  if (values.year === undefined || values.month === undefined || values.day === undefined) {
    throw new RangeError("Unable to resolve calendar date in time zone");
  }

  return { year: values.year, month: values.month, day: values.day };
}

function toUtcDay({ year, month, day }: CalendarDate): number {
  return Date.UTC(year, month - 1, day);
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Resolves local midnight for an ISO calendar day to an exact UTC instant. */
export function startOfCalendarDay(dateOnly: string, timeZone: string): Date {
  const desired = parseIsoDateOnly(dateOnly);
  if (!desired) throw new RangeError("Expected an ISO calendar date");
  const desiredWallClock = Date.UTC(desired.year, desired.month - 1, desired.day, 0, 0, 0);
  let candidate = new Date(desiredWallClock);

  // Iterating accounts for the time-zone offset (including DST) without
  // assuming that the host process uses the user's time zone.
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = wallClockParts(candidate, timeZone);
    const representedWallClock = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const correction = desiredWallClock - representedWallClock;
    if (correction === 0) break;
    candidate = new Date(candidate.getTime() + correction);
  }
  return candidate;
}

function wallClockParts(
  value: Date,
  timeZone: string,
): CalendarDate & { hour: number; minute: number; second: number } {
  const formatter = new Intl.DateTimeFormat("en-CA-u-ca-iso8601-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const values: Partial<
    Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>
  > = {};
  for (const part of formatter.formatToParts(value)) {
    if (
      part.type === "year"
      || part.type === "month"
      || part.type === "day"
      || part.type === "hour"
      || part.type === "minute"
      || part.type === "second"
    ) {
      values[part.type] = Number(part.value);
    }
  }
  if (
    values.year === undefined
    || values.month === undefined
    || values.day === undefined
    || values.hour === undefined
    || values.minute === undefined
    || values.second === undefined
  ) {
    throw new RangeError("Unable to resolve wall-clock time in time zone");
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

export function isTerminalStatus(
  status: string | null | undefined,
  terminalStatuses: readonly string[] = DEFAULT_TERMINAL_STATUSES,
): boolean {
  if (!status) {
    return false;
  }
  const normalized = status.trim().toLowerCase();
  return terminalStatuses.some((candidate) => candidate.trim().toLowerCase() === normalized);
}

/** Classifies an incomplete item's deadline using an exact or date-only due value. */
export function classifyDueStatus({
  dueAt,
  status,
  now = new Date(),
  dueSoonWithinMs = DAY_IN_MS,
  terminalStatuses = DEFAULT_TERMINAL_STATUSES,
  timeZone = "UTC",
}: DueStatusInput): DueStatus {
  if (!Number.isFinite(dueSoonWithinMs) || dueSoonWithinMs < 0) {
    throw new RangeError("dueSoonWithinMs must be a non-negative finite number");
  }

  if (isTerminalStatus(status, terminalStatuses)) {
    return "complete";
  }

  if (dueAt === null || dueAt === undefined || dueAt === "") {
    return "no_due_date";
  }

  const current = parseDateInput(now);
  const dateOnly = typeof dueAt === "string" ? parseIsoDateOnly(dueAt) : null;

  if (dateOnly) {
    const today = calendarDateInTimeZone(current, timeZone);
    const dayDifference = (toUtcDay(dateOnly) - toUtcDay(today)) / DAY_IN_MS;
    if (dayDifference < 0) {
      return "overdue";
    }
    const dueSoonDays = Math.floor(dueSoonWithinMs / DAY_IN_MS);
    return dayDifference <= dueSoonDays ? "due_soon" : "upcoming";
  }

  const due = parseDateInput(dueAt);
  const difference = due.getTime() - current.getTime();
  if (difference < 0) {
    return "overdue";
  }
  return difference <= dueSoonWithinMs ? "due_soon" : "upcoming";
}

export function isOverdue(input: DueStatusInput): boolean {
  return classifyDueStatus(input) === "overdue";
}

export function isDueSoon(input: DueStatusInput): boolean {
  return classifyDueStatus(input) === "due_soon";
}

/** Returns the ISO-8601 week for the calendar date in the requested time zone. */
export function getIsoWeek(input: DateInput, timeZone = "UTC"): IsoWeek {
  const literalDate = typeof input === "string" ? parseIsoDateOnly(input) : null;
  const calendarDate = literalDate ?? calendarDateInTimeZone(parseDateInput(input), timeZone);
  const date = new Date(toUtcDay(calendarDate));
  const isoDay = date.getUTCDay() || 7;

  const thursday = new Date(date);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - isoDay);
  const weekYear = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_IN_MS + 1) / 7);

  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - (isoDay - 1));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    weekYear,
    week,
    key: `${weekYear}-W${week.toString().padStart(2, "0")}`,
    startsOn: formatUtcDate(start),
    endsOn: formatUtcDate(end),
  };
}
