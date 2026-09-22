import { describe, expect, it } from "vitest";

import { buildDailyPlan } from "../../src/lib/domain/daily-plan";

const baseTask = {
  status: "todo",
  priority: "unset" as const,
  lifeArea: "pro" as const,
  projectId: null,
  plannedOn: null,
  dueOn: null,
  estimateMinutes: 30,
  focusProject: false,
};

describe("LifeOS daily manager", () => {
  it("puts real deadlines before routines and focus suggestions", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [
        { ...baseTask, id: "due", title: "Échéance", dueOn: "2026-09-21" },
        { ...baseTask, id: "focus", title: "Action focus", focusProject: true, priority: "high" },
      ],
      routines: [{
        id: "routine",
        routineType: "habit",
        name: "Routine matin",
        completed: false,
        lifeArea: "perso",
        durationMinutes: 10,
        timeContext: "matin",
        periodLabel: "day",
      }],
    });

    expect(plan.top.map((item) => item.title)).toEqual(["Échéance", "Routine matin", "Action focus"]);
  });

  it("removes a task from today's execution after an operational reschedule while preserving its deadline input", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 20,
      tasks: [{
        ...baseTask,
        id: "late",
        title: "Échéance non modifiée",
        dueOn: "2026-09-20",
        plannedOn: "2026-09-22",
      }],
      routines: [],
    });

    expect(plan.all).toHaveLength(0);
  });

  it("does not show completed routines and keeps the daily execution list short", () => {
    const routines = Array.from({ length: 14 }, (_, index) => ({
      id: `r-${index}`,
      routineType: "habit" as const,
      name: `Routine ${index}`,
      completed: index === 0,
      lifeArea: "perso" as const,
      durationMinutes: 5,
      timeContext: null,
      periodLabel: "day" as const,
    }));

    const plan = buildDailyPlan({ today: "2026-09-21", localHour: 12, tasks: [], routines });
    expect(plan.completedRoutines).toBe(1);
    expect(plan.all).toHaveLength(10);
    expect(plan.all.every((item) => item.title !== "Routine 0")).toBe(true);
  });

  it("uses time context to move an evening routine ahead later in the day", () => {
    const morning = {
      id: "morning",
      routineType: "habit" as const,
      name: "Routine matin",
      completed: false,
      lifeArea: "perso" as const,
      durationMinutes: 5,
      timeContext: "matin",
      periodLabel: "day" as const,
    };
    const evening = { ...morning, id: "evening", name: "Lecture du soir", timeContext: "soir" };

    expect(buildDailyPlan({ today: "2026-09-21", localHour: 8, tasks: [], routines: [evening, morning] }).top[0]?.title).toBe("Routine matin");
    expect(buildDailyPlan({ today: "2026-09-21", localHour: 21, tasks: [], routines: [evening, morning] }).top[0]?.title).toBe("Lecture du soir");
  });
});
