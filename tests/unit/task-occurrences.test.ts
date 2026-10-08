import { describe, expect, it } from "vitest";
import { applyOccurrenceOverrides, occurrenceScheduledForDate } from "../../src/lib/domain/task-occurrences";

describe("task occurrence overrides", () => {
  it("moves only the selected recurring occurrence", () => {
    const overrides = [{ taskId: "task", occurrenceOn: "2026-10-08", rescheduledOn: "2026-10-09", completedAt: null }];
    expect(occurrenceScheduledForDate({ taskId: "task", plannedOn: "2026-10-01", recurrenceRule: "daily", recurrenceUntil: null, date: "2026-10-08", overrides })).toBeNull();
    expect(occurrenceScheduledForDate({ taskId: "task", plannedOn: "2026-10-01", recurrenceRule: "daily", recurrenceUntil: null, date: "2026-10-09", overrides })).toEqual({ occurrenceOn: "2026-10-08", completed: false });
  });

  it("keeps completion attached to the original occurrence identity", () => {
    const overrides = [{ taskId: "task", occurrenceOn: "2026-10-08", rescheduledOn: "2026-10-10", completedAt: "2026-10-10T08:00:00Z" }];
    expect(applyOccurrenceOverrides({ taskId: "task", naturalDates: ["2026-10-08", "2026-10-09"], overrides, start: "2026-10-08", end: "2026-10-10" })).toEqual([
      { date: "2026-10-09", occurrenceOn: "2026-10-09", completed: false },
      { date: "2026-10-10", occurrenceOn: "2026-10-08", completed: true },
    ]);
  });
});
