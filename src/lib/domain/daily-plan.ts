export type DailyLifeArea = "pro" | "perso" | "religion" | null;
export type DailyTaskPriority = "unset" | "low" | "medium" | "high" | "critical";

export type DailyPlanTaskInput = {
  id: string;
  title: string;
  status: string;
  priority: DailyTaskPriority;
  lifeArea: DailyLifeArea;
  projectId: string | null;
  plannedOn: string | null;
  dueOn: string | null;
  estimateMinutes: number | null;
  focusProject: boolean;
};

export type DailyPlanRoutineInput = {
  id: string;
  routineType: "habit" | "religion";
  name: string;
  completed: boolean;
  lifeArea: DailyLifeArea;
  durationMinutes: number | null;
  timeContext: string | null;
  periodLabel: "day" | "week" | "month" | null;
};

export type DailyPlanItem = {
  id: string;
  kind: "task" | "routine";
  title: string;
  lifeArea: DailyLifeArea;
  score: number;
  reason: string;
  state: "overdue" | "due_today" | "planned" | "routine" | "suggested";
  durationMinutes: number | null;
  priority: DailyTaskPriority | null;
  taskId: string | null;
  routineId: string | null;
  routineType: "habit" | "religion" | null;
  dueOn: string | null;
  plannedOn: string | null;
  completed: boolean;
  timeContext: string | null;
};

export type DailyPlan = {
  top: DailyPlanItem[];
  remaining: DailyPlanItem[];
  all: DailyPlanItem[];
  completedRoutines: number;
};

const priorityWeight: Readonly<Record<DailyTaskPriority, number>> = {
  critical: 120,
  high: 80,
  medium: 40,
  low: 10,
  unset: 0,
};

export function buildDailyPlan(input: {
  today: string;
  localHour: number;
  tasks: readonly DailyPlanTaskInput[];
  routines: readonly DailyPlanRoutineInput[];
  maxTop?: number;
}): DailyPlan {
  const taskItems = input.tasks
    .filter((task) => !["done", "cancelled"].includes(task.status))
    .map((task) => taskToPlanItem(task, input.today))
    .filter((item): item is DailyPlanItem => item !== null);

  const routineItems = input.routines
    .filter((routine) => !routine.completed)
    .map((routine) => routineToPlanItem(routine, input.localHour));

  const all = [...taskItems, ...routineItems].sort(compareItems).slice(0, 10);
  const topCount = Math.max(1, input.maxTop ?? 3);
  const top = all.slice(0, topCount);
  const topKeys = new Set(top.map(itemKey));

  return {
    top,
    remaining: all.filter((item) => !topKeys.has(itemKey(item))),
    all,
    completedRoutines: input.routines.filter((routine) => routine.completed).length,
  };
}

function taskToPlanItem(task: DailyPlanTaskInput, today: string): DailyPlanItem | null {
  const priority = priorityWeight[task.priority] ?? 0;
  const dueOn = task.dueOn;
  const plannedOn = task.plannedOn;

  // A future operational plan removes the task from today without mutating
  // its real deadline. Deadline alerts remain handled independently.
  if (plannedOn && plannedOn > today) return null;

  let base = 0;
  let reason = "";
  let state: DailyPlanItem["state"] = "suggested";

  if (dueOn && dueOn < today) {
    base = 1_000;
    reason = "Échéance dépassée";
    state = "overdue";
  } else if (dueOn === today) {
    base = 930;
    reason = "Échéance aujourd’hui";
    state = "due_today";
  } else if (plannedOn && plannedOn < today) {
    base = 860;
    reason = "Planifiée précédemment";
    state = "planned";
  } else if (plannedOn === today) {
    base = 820;
    reason = "Planifiée aujourd’hui";
    state = "planned";
  } else if (task.focusProject && (!plannedOn || plannedOn <= today)) {
    base = 470;
    reason = "Projet FOCUS";
    state = "suggested";
  } else {
    return null;
  }

  return {
    id: `task:${task.id}`,
    kind: "task",
    title: task.title,
    lifeArea: task.lifeArea,
    score: base + priority,
    reason,
    state,
    durationMinutes: task.estimateMinutes,
    priority: task.priority,
    taskId: task.id,
    routineId: null,
    routineType: null,
    dueOn,
    plannedOn,
    completed: false,
    timeContext: null,
  };
}

function routineToPlanItem(routine: DailyPlanRoutineInput, localHour: number): DailyPlanItem {
  const contextWeight = routineTimeWeight(routine.timeContext, localHour);
  const periodWeight = routine.periodLabel === "day" || routine.periodLabel === null ? 0 : -20;
  return {
    id: `routine:${routine.routineType}:${routine.id}`,
    kind: "routine",
    title: routine.name,
    lifeArea: routine.lifeArea,
    score: 650 + contextWeight + periodWeight,
    reason: routineReason(routine),
    state: "routine",
    durationMinutes: routine.durationMinutes,
    priority: null,
    taskId: null,
    routineId: routine.id,
    routineType: routine.routineType,
    dueOn: null,
    plannedOn: null,
    completed: false,
    timeContext: routine.timeContext,
  };
}

function routineTimeWeight(timeContext: string | null, localHour: number): number {
  if (!timeContext) return 0;
  const normalized = timeContext.toLocaleLowerCase("fr-FR");
  const morning = normalized.includes("matin") || normalized.includes("réveil");
  const evening = normalized.includes("soir") || normalized.includes("coucher");
  const daytime = normalized.includes("journée") || normalized.includes("midi") || normalized.includes("après-midi");

  if (morning) return localHour < 12 ? 110 : -45;
  if (evening) return localHour >= 18 ? 110 : -45;
  if (daytime) return localHour >= 11 && localHour < 19 ? 80 : -15;
  return 0;
}

function routineReason(routine: DailyPlanRoutineInput): string {
  if (routine.timeContext) return routine.timeContext;
  if (routine.periodLabel === "week") return "À faire cette semaine";
  if (routine.periodLabel === "month") return "À faire ce mois";
  return "Routine du jour";
}

function compareItems(left: DailyPlanItem, right: DailyPlanItem): number {
  if (left.score !== right.score) return right.score - left.score;
  if (left.kind !== right.kind) return left.kind === "task" ? -1 : 1;
  return left.title.localeCompare(right.title, "fr");
}

function itemKey(item: DailyPlanItem): string {
  return item.id;
}
