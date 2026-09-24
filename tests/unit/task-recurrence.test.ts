import { describe, expect, it } from "vitest";
import { describeTaskRecurrence, parseTaskRecurrence, taskOccursOn, taskOccurrencesBetween } from "../../src/lib/domain/task-recurrence";

describe("task recurrence", () => {
  it("keeps a non-recurring task on its planned date only", () => {
    expect(taskOccursOn({ plannedOn: "2026-09-24", recurrenceRule: null, recurrenceUntil: null, date: "2026-09-24" })).toBe(true);
    expect(taskOccursOn({ plannedOn: "2026-09-24", recurrenceRule: null, recurrenceUntil: null, date: "2026-09-25" })).toBe(false);
  });
  it("supports daily recurrence and an inclusive end date", () => {
    expect(taskOccursOn({ plannedOn: "2026-09-24", recurrenceRule: "daily", recurrenceUntil: "2026-09-26", date: "2026-09-25" })).toBe(true);
    expect(taskOccursOn({ plannedOn: "2026-09-24", recurrenceRule: "daily", recurrenceUntil: "2026-09-26", date: "2026-09-27" })).toBe(false);
  });
  it("supports weekly recurrence without materializing future rows", () => {
    expect(taskOccurrencesBetween({ plannedOn: "2026-09-24", recurrenceRule: "weekly:1,3,5", recurrenceUntil: null, start: "2026-09-24", end: "2026-10-05" })).toEqual(["2026-09-25", "2026-09-28", "2026-09-30", "2026-10-02", "2026-10-05"]);
  });
  it("supports monthly recurrence and rejects malformed rules", () => {
    expect(taskOccursOn({ plannedOn: "2026-09-15", recurrenceRule: "monthly:15", recurrenceUntil: null, date: "2026-10-15" })).toBe(true);
    expect(parseTaskRecurrence("weekly:9")).toBeNull();
    expect(describeTaskRecurrence("daily")).toBe("Tous les jours");
  });
});
