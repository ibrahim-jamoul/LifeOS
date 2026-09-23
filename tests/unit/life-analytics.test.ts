import { describe, expect, it } from "vitest";
import { summarizePeriod, taskRescheduleCounts } from "@/lib/domain/life-analytics";

describe("life analytics", () => {
  it("combines planned tasks and measurable daily routines", () => {
    const result = summarizePeriod({
      period: { start: "2026-09-01", end: "2026-09-03" },
      tasks: [
        { id: "t1", title: "Candidature", lifeArea: "pro", status: "done", plannedOn: "2026-09-02", dueOn: null, completedOn: "2026-09-02" },
        { id: "t2", title: "Lecture", lifeArea: "perso", status: "todo", plannedOn: "2026-09-03", dueOn: null, completedOn: null },
      ],
      routines: [{ id: "r1", name: "Arabe", lifeArea: "religion", routineType: "religion", schedule: { frequency: "daily", active: true } }],
      routineLogs: [
        { routineId: "r1", routineType: "religion", occurredOn: "2026-09-01", count: 1 },
        { routineId: "r1", routineType: "religion", occurredOn: "2026-09-02", count: 1 },
      ],
    });
    expect(result.expected).toBe(5);
    expect(result.completed).toBe(3);
    expect(result.rate).toBe(60);
    expect(result.areas.find((area) => area.lifeArea === "religion")?.rate).toBe(67);
  });

  it("counts an unscheduled weekly routine once per week instead of inventing a weekday", () => {
    const result = summarizePeriod({
      period: { start: "2026-09-21", end: "2026-09-27" },
      tasks: [],
      routines: [{ id: "r1", name: "Seerah", lifeArea: "religion", routineType: "religion", schedule: { frequency: "weekly", active: true, scheduleWeekday: null } }],
      routineLogs: [{ routineId: "r1", routineType: "religion", occurredOn: "2026-09-24", count: 1 }],
    });
    expect(result.routineExpected).toBe(1);
    expect(result.routineCompleted).toBe(1);
  });

  it("counts a Saturday+Sunday routine window once and respects month-week filters", () => {
    const result = summarizePeriod({
      period: { start: "2026-09-19", end: "2026-09-27" },
      tasks: [],
      routines: [{
        id: "quran",
        name: "Nouvelle page",
        lifeArea: "religion",
        routineType: "religion",
        schedule: { frequency: "weekly", active: true, scheduleWindowWeekdays: [6, 7], scheduleMonthWeeks: [1, 2, 3] },
      }],
      routineLogs: [{ routineId: "quran", routineType: "religion", occurredOn: "2026-09-19", count: 1 }],
    });

    expect(result.routineExpected).toBe(1);
    expect(result.routineCompleted).toBe(1);
  });

  it("detects repeated rescheduling within the selected period", () => {
    const counts = taskRescheduleCounts([
      { taskId: "t1", occurredOn: "2026-09-02" },
      { taskId: "t1", occurredOn: "2026-09-04" },
      { taskId: "t2", occurredOn: "2026-08-20" },
    ], { start: "2026-09-01", end: "2026-09-30" });
    expect(counts.get("t1")).toBe(2);
    expect(counts.has("t2")).toBe(false);
  });
});
