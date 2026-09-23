import { describe, expect, it } from "vitest";

import { buildDailyPlan } from "../../src/lib/domain/daily-plan";
import {
  addCalendarDays,
  calendarDateInTimeZone,
  isoWeekday,
  isRoutineActionableOn,
  isRoutineCalendarConfigured,
  isRoutineScheduledOn,
  nextRoutineOccurrence,
  routineCompletedForOccurrence,
  routineCompletionWindow,
  routineReasonForDate,
  scheduledRoutineDates,
  scheduledRoutineWindows,
} from "../../src/lib/domain/routines";

describe("calendarDateInTimeZone", () => {
  it("uses the user's calendar day instead of the UTC day", () => {
    const instant = new Date("2026-01-04T23:30:00.000Z");
    expect(calendarDateInTimeZone(instant, "UTC")).toBe("2026-01-04");
    expect(calendarDateInTimeZone(instant, "Europe/Paris")).toBe("2026-01-05");
  });
});

describe("routine calendar eligibility", () => {
  it("shows an active daily routine every day inside its date window even when optional configuration remains", () => {
    const routine = { frequency: "daily", startOn: "2026-09-20", endOn: "2026-09-22" };
    expect(isRoutineCalendarConfigured(routine)).toBe(true);
    expect(isRoutineScheduledOn(routine, "2026-09-19")).toBe(false);
    expect(isRoutineScheduledOn(routine, "2026-09-20")).toBe(true);
    expect(isRoutineScheduledOn(routine, "2026-09-22")).toBe(true);
    expect(isRoutineScheduledOn(routine, "2026-09-23")).toBe(false);
    expect(routineReasonForDate(routine, "2026-09-21")).toBe("Routine quotidienne");
  });

  it("excludes inactive, paused, and archived routines", () => {
    expect(isRoutineScheduledOn({ frequency: "daily", active: false }, "2026-09-21")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "daily", pausedAt: "2026-09-20T10:00:00Z" }, "2026-09-21")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "daily", archivedAt: "2026-09-20T10:00:00Z" }, "2026-09-21")).toBe(false);
  });

  it("shows a Friday routine on Friday only", () => {
    const friday = { frequency: "weekly", scheduleWeekday: 5 };
    expect(isoWeekday("2026-09-25")).toBe(5);
    expect(isRoutineScheduledOn(friday, "2026-09-25")).toBe(true);
    expect(isRoutineScheduledOn(friday, "2026-09-26")).toBe(false);
    expect(routineReasonForDate(friday, "2026-09-25")).toBe("Prévu ce vendredi");
  });

  it("keeps an undated weekly routine out of Aujourd'hui", () => {
    const routine = { frequency: "weekly" };
    expect(isRoutineCalendarConfigured(routine)).toBe(false);
    expect(isRoutineActionableOn(routine, "2026-09-23")).toBe(false);
    expect(routineCompletionWindow(routine, "2026-09-23")).toBeNull();
    expect(nextRoutineOccurrence(routine, "2026-09-23")).toBeNull();
  });

  it("keeps an undated monthly routine out of Aujourd'hui", () => {
    const routine = { frequency: "monthly" };
    expect(isRoutineCalendarConfigured(routine)).toBe(false);
    expect(isRoutineActionableOn(routine, "2026-09-23")).toBe(false);
    expect(routineCompletionWindow(routine, "2026-09-23")).toBeNull();
    expect(nextRoutineOccurrence(routine, "2026-09-23")).toBeNull();
  });

  it("keeps flexible and contextual routines out without explicit planning", () => {
    expect(isRoutineActionableOn({ frequency: "flexible" }, "2026-09-23")).toBe(false);
    expect(isRoutineActionableOn({ frequency: "contextual" }, "2026-09-23")).toBe(false);
  });

  it("matches explicit monthly days without inventing missing month dates", () => {
    expect(isRoutineScheduledOn({ frequency: "monthly", scheduleDayOfMonth: 31 }, "2026-04-30")).toBe(false);
    expect(isRoutineScheduledOn({ frequency: "monthly", scheduleDayOfMonth: 31 }, "2026-05-31")).toBe(true);
  });
});

describe("multi-day execution windows", () => {
  const quranWeekend = {
    frequency: "weekly",
    scheduleWindowWeekdays: [6, 7],
    scheduleMonthWeeks: [1, 2, 3],
  } as const;

  it("offers one weekend occurrence on both Saturday and Sunday during weeks 1-3", () => {
    expect(isRoutineScheduledOn(quranWeekend, "2026-09-19")).toBe(true);
    expect(isRoutineScheduledOn(quranWeekend, "2026-09-20")).toBe(true);
    expect(routineCompletionWindow(quranWeekend, "2026-09-19")).toEqual({ startsOn: "2026-09-19", endsOn: "2026-09-20", label: "week" });
    expect(routineCompletionWindow(quranWeekend, "2026-09-20")).toEqual({ startsOn: "2026-09-19", endsOn: "2026-09-20", label: "week" });
    expect(routineReasonForDate(quranWeekend, "2026-09-20")).toBe("Prévu ce week-end");
    expect(scheduledRoutineWindows(quranWeekend, "2026-09-19", "2026-09-20")).toHaveLength(1);
  });

  it("does not offer the new-page/Tafsir window in week 4", () => {
    expect(isRoutineScheduledOn(quranWeekend, "2026-09-26")).toBe(false);
    expect(isRoutineScheduledOn(quranWeekend, "2026-09-27")).toBe(false);
  });

  it("removes the Sunday item from Aujourd'hui when the same weekend occurrence was validated Saturday", () => {
    const completed = routineCompletedForOccurrence(quranWeekend, "2026-09-20", ["2026-09-19"]);
    expect(completed).toBe(true);

    const plan = buildDailyPlan({
      today: "2026-09-20",
      localHour: 9,
      tasks: [],
      routines: [{
        id: "quran",
        routineType: "religion",
        name: "Nouvelle page de Coran",
        completed,
        lifeArea: "religion",
        durationMinutes: null,
        timeContext: "week-end",
        periodLabel: "week",
        scheduleReason: "Prévu ce week-end",
      }],
    });
    expect(plan.all).toEqual([]);
  });

  it("offers the monthly Quran review on week 4/5 weekends as one monthly occurrence", () => {
    const monthlyReview = {
      frequency: "monthly",
      scheduleWindowWeekdays: [6, 7],
      scheduleMonthWeeks: [4, 5],
    } as const;
    expect(isRoutineScheduledOn(monthlyReview, "2026-09-20")).toBe(false);
    expect(isRoutineScheduledOn(monthlyReview, "2026-09-26")).toBe(true);
    expect(isRoutineScheduledOn(monthlyReview, "2026-09-27")).toBe(true);
    expect(routineCompletionWindow(monthlyReview, "2026-09-26")).toEqual({ startsOn: "2026-09-01", endsOn: "2026-09-30", label: "month" });
    expect(routineCompletedForOccurrence(monthlyReview, "2026-09-27", ["2026-09-26"])).toBe(true);
  });
});

describe("routine occurrence helpers", () => {
  it("finds the next occurrence inclusively or exclusively", () => {
    const friday = { frequency: "weekly", scheduleWeekday: 5 };
    expect(nextRoutineOccurrence(friday, "2026-09-25")).toBe("2026-09-25");
    expect(nextRoutineOccurrence(friday, "2026-09-25", false)).toBe("2026-10-02");
  });

  it("skips the second day of a multi-day window when asking for the next occurrence", () => {
    const weekend = { frequency: "weekly", scheduleWindowWeekdays: [6, 7] };
    expect(nextRoutineOccurrence(weekend, "2026-09-26", false)).toBe("2026-10-03");
  });

  it("honours the end date and finds sparse monthly occurrences", () => {
    expect(nextRoutineOccurrence({ frequency: "daily", endOn: "2026-09-20" }, "2026-09-21")).toBeNull();
    expect(nextRoutineOccurrence({ frequency: "monthly", scheduleDayOfMonth: 31 }, "2026-04-01")).toBe("2026-05-31");
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
