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

const dailyRoutine = {
  id: "routine",
  routineType: "habit" as const,
  name: "Routine matin",
  completed: false,
  lifeArea: "perso" as const,
  durationMinutes: 10,
  timeContext: "matin",
  periodLabel: "day" as const,
  scheduleReason: "Routine quotidienne",
};

describe("LifeOS daily manager", () => {
  it("excludes a task from a FOCUS project when it has no temporal eligibility", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [{ ...baseTask, id: "focus", title: "Action focus", focusProject: true, priority: "high" }],
      routines: [],
    });

    expect(plan.all).toEqual([]);
  });

  it("includes the same FOCUS task when planned_on is today", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [{ ...baseTask, id: "focus", title: "Action focus", focusProject: true, plannedOn: "2026-09-21" }],
      routines: [],
    });

    expect(plan.all.map((item) => item.title)).toEqual(["Action focus"]);
    expect(plan.all[0]?.reason).toBe("Planifié aujourd’hui");
  });

  it("excludes a task planned tomorrow", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [{ ...baseTask, id: "tomorrow", title: "Demain", plannedOn: "2026-09-22" }],
      routines: [],
    });

    expect(plan.all).toHaveLength(0);
  });

  it("never shows PSM I merely because Certification PSM I is FOCUS", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [
        { ...baseTask, id: "prepare", title: "Préparer PSM I", projectId: "psm", focusProject: true },
        { ...baseTask, id: "exam", title: "Passer PSM I", projectId: "psm", focusProject: true },
        { ...baseTask, id: "guide", title: "Lire Scrum Guide", projectId: "psm", focusProject: true, plannedOn: "2026-09-24" },
      ],
      routines: [],
    });

    expect(plan.all).toEqual([]);
  });

  it("shows only the explicitly planned PSM action on its planned day", () => {
    const plan = buildDailyPlan({
      today: "2026-09-24",
      localHour: 9,
      tasks: [
        { ...baseTask, id: "prepare", title: "Préparer PSM I", projectId: "psm", focusProject: true },
        { ...baseTask, id: "exam", title: "Passer PSM I", projectId: "psm", focusProject: true },
        { ...baseTask, id: "guide", title: "Lire Scrum Guide", projectId: "psm", focusProject: true, plannedOn: "2026-09-24" },
      ],
      routines: [],
    });

    expect(plan.all.map((item) => item.title)).toEqual(["Lire Scrum Guide"]);
  });

  it("keeps real deadlines ahead of routines while focus only breaks ties between eligible tasks", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [
        { ...baseTask, id: "due", title: "Échéance", dueOn: "2026-09-21" },
        { ...baseTask, id: "normal", title: "Action normale", plannedOn: "2026-09-21" },
        { ...baseTask, id: "focus", title: "Action focus", plannedOn: "2026-09-21", focusProject: true },
      ],
      routines: [dailyRoutine],
    });

    expect(plan.all.map((item) => item.title)).toEqual(["Échéance", "Action focus", "Action normale", "Routine matin"]);
  });

  it("marks a previously planned unfinished task as overdue and to replan", () => {
    const plan = buildDailyPlan({
      today: "2026-09-21",
      localHour: 9,
      tasks: [{ ...baseTask, id: "late-plan", title: "Session oubliée", plannedOn: "2026-09-20" }],
      routines: [],
    });

    expect(plan.all[0]?.state).toBe("overdue");
    expect(plan.all[0]?.reason).toBe("En retard · à replanifier");
  });

  it("removes an overdue-deadline task from today's execution after a deliberate future reschedule", () => {
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
      ...dailyRoutine,
      id: `r-${index}`,
      name: `Routine ${index}`,
      completed: index === 0,
      timeContext: null,
      durationMinutes: 5,
    }));

    const plan = buildDailyPlan({ today: "2026-09-21", localHour: 12, tasks: [], routines });
    expect(plan.completedRoutines).toBe(1);
    expect(plan.all).toHaveLength(10);
    expect(plan.all.every((item) => item.title !== "Routine 0")).toBe(true);
  });

  it("uses time_context only to order routines, not as their calendar reason", () => {
    const morning = dailyRoutine;
    const evening = { ...dailyRoutine, id: "evening", name: "Lecture du soir", timeContext: "soir" };

    const morningPlan = buildDailyPlan({ today: "2026-09-21", localHour: 8, tasks: [], routines: [evening, morning] });
    const eveningPlan = buildDailyPlan({ today: "2026-09-21", localHour: 21, tasks: [], routines: [evening, morning] });
    expect(morningPlan.top[0]?.title).toBe("Routine matin");
    expect(eveningPlan.top[0]?.title).toBe("Lecture du soir");
    expect(eveningPlan.top[0]?.reason).toBe("Routine quotidienne");
  });
});
