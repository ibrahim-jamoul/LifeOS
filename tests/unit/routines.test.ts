import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  calendarDateInTimeZone,
  isoWeekday,
  isRoutineActionableOn,
  isRoutineScheduledOn,
  nextRoutineOccurrence,
  routineCompletionWindow,
  scheduledRoutineDates,
} from "../../src/lib/domain/routines";

describe("calendarDateInTimeZone", () => {
  it("uses the user's calendar day instead of the UTC day", () => {
    const instant = new Date("2026-01-04T23:30:00.000Z");
    expect(calendarDateInTimeZone(instant, "UTC")).toBe("2026-01-04");
    expect(calendarDateInTimeZone(instant, "Europe/Paris")).toBe("2026-01-05");
  });
});

describe("isRoutineScheduledOn", () => {
  it("schedules daily routines only inside their active date window", () => {
    const routine = { frequency: "daily", startOn: "2026-09-20", endOn: "2026-09-22" };
    expect(isRoutineScheduledOn(routine, "2026-09-19")).toBe(false);
    expect(isRoutineScheduledOn(routine, "2026-09-20")).toBe(true);
    expect(isRoutineScheduledOn(routine, "2026-09-22")).toBe(true);
    expect(isRoutineScheduledOn(routine, "2026-09-23")).toBe(false);
  });

  it("excludes inactive, paused, and archived routines", () => {
    expect(isRoutineScheduledOn({ frequency: "daily", active: false }, "2026-09-21")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "daily", pausedAt: "2026-09-20T10:00:00Z" }, "2026-09-21")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "daily", archivedAt: "2026-09-20T10:00:00Z" }, "2026-09-21")).toBe(false);
  });

  it("matches ISO weekdays, including Sunday as day seven", () => {
    expect(isoWeekday("2026-09-21")).toBe(1);
    expect(isoWeekday("2026-09-27")).toBe(7);
    expect(isRoutineScheduledOn({ frequency: "weekly", scheduleWeekday: 5 }, "2026-09-25")).toBe(true);
    expect(isRoutineScheduledOn({ frequency: "weekly", scheduleWeekday: 5 }, "2026-09-26")).toBe(false);
  });

  it("matches explicit monthly days without inventing missing month dates", () => {
    expect(isRoutineScheduledOn({ frequency: "monthly", scheduleDayOfMonth: 31 }, "2026-04-30")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "monthly", scheduleDayOfMonth: 31 }, "2026-05-31")).toBe(true);
  });

  it("does not put flexible or contextual routines on the calendar", () => {
    expect(isRoutineScheduledOn({ frequency: "flexible" }, "2026-09-21")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "contextual" }, "2026-09-21")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "weekly" }, "2026-09-21")).toBe(false);
  });

  it("keeps period-based and flexible routines actionable without inventing a day", () => {
    expect(isRoutineActionableOn({ frequency: "weekly" }, "2026-09-23")).toBe(true);
    expect(isRoutineActionableOn({ frequency: "monthly" }, "2026-09-23")).toBe(true);
    expect(isRoutineActionableOn({ frequency: "flexible" }, "2026-09-23")).toBe(true);
    expect(routineCompletionWindow({ frequency: "weekly" }, "2026-09-23")).toEqual({ startsOn: "2026-09-21", endsOn: "2026-09-27", label: "week" });
    expect(routineCompletionWindow({ frequency: "monthly" }, "2026-09-23")).toEqual({ startsOn: "2026-09-01", endsOn: "2026-09-30", label: "month" });
  });
});

describe("routine occurrence helpers", () => {
  it("finds the next occurrence inclusively or exclusively", () => {
    const friday = { frequency: "weekly", scheduleWeekday: 5 };
    expect(nextRoutineOccurrence(friday, "2026-09-25")).toBe("2026-09-25");
    expect(nextRoutineOccurrence(friday, "2026-09-25", false)).toBe("2026-10-02");
  });

  it("honours the end date and finds sparse monthly occurrences", () => {
    expect(nextRoutineOccurrence({ frequency: "daily", endOn: "2026-09-20" }, "2026-09-21")).toBeNull();
    expect(nextRoutineOccurrence({ frequency: "monthly", scheduleDayOfMonth: 31 }, "2026-04-01")).toBe("2026-05-31");
  });

  it("moves an undated weekly or monthly recurrence to the next period boundary", () => {
    expect(nextRoutineOccurrence({ frequency: "weekly" }, "2026-09-23", false)).toBe("2026-09-28");
    expect(nextRoutineOccurrence({ frequency: "monthly" }, "2026-09-23", false)).toBe("2026-10-01");
  });

  it("returns scheduled dates in an inclusive range", () => {
    expect(scheduledRoutineDates(
      { frequency: "weekly", scheduleWeekday: 1 },
      "2026-09-20",
      "2026-10-05",
    )).toEqual(["2026-09-21", "2026-09-28", "2026-10-05"]);
  });

  it("uses calendar arithmetic across leap days and year boundaries", () => {
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("fails safely for malformed range inputs", () => {
    expect(nextRoutineOccurrence({ frequency: "daily" }, "21-09-2026")).toBeNull();
    expect(scheduledRoutineDates({ frequency: "daily" }, "2026-09-22", "2026-09-21")).toEqual([]);
    expect(() => addCalendarDays("invalid", 1)).toThrow(/invalid calendar date/i);
  });
});
