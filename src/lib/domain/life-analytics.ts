import { addCalendarDays, scheduledRoutineWindows, type RoutineSchedule } from "@/lib/domain/routines";

export type LifeArea = "pro" | "perso" | "religion" | null;

export type AnalyticsTask = {
  id: string;
  title: string;
  lifeArea: LifeArea;
  status: string;
  plannedOn: string | null;
  dueOn: string | null;
  completedOn: string | null;
  goalId?: string | null;
};

export type AnalyticsRoutine = {
  id: string;
  name: string;
  lifeArea: LifeArea;
  routineType: "habit" | "religion";
  schedule: RoutineSchedule;
};

export type AnalyticsRoutineLog = {
  routineId: string;
  routineType: "habit" | "religion";
  occurredOn: string;
  count: number;
};

export type AnalyticsProject = {
  id: string;
  title: string;
  lifeArea: LifeArea;
  status: string;
  lastActivityOn: string | null;
};

export type RescheduleEvent = {
  taskId: string;
  occurredOn: string;
};

export type Period = { start: string; end: string };

export type AreaSummary = {
  lifeArea: Exclude<LifeArea, null>;
  expected: number;
  completed: number;
  rate: number | null;
};

export type RoutineSummary = {
  id: string;
  name: string;
  lifeArea: LifeArea;
  routineType: "habit" | "religion";
  expected: number;
  completed: number;
  rate: number | null;
};

export type PeriodSummary = {
  expected: number;
  completed: number;
  rate: number | null;
  taskExpected: number;
  taskCompleted: number;
  routineExpected: number;
  routineCompleted: number;
  completedActions: number;
  areas: AreaSummary[];
  routines: RoutineSummary[];
};

export function summarizePeriod(input: {
  period: Period;
  tasks: readonly AnalyticsTask[];
  routines: readonly AnalyticsRoutine[];
  routineLogs: readonly AnalyticsRoutineLog[];
}): PeriodSummary {
  const expectedTasks = input.tasks.filter((task) => isTaskExpected(task, input.period));
  const completedExpectedTasks = expectedTasks.filter((task) => task.completedOn !== null && inPeriod(task.completedOn, input.period));
  const completedActions = input.tasks.filter((task) => task.completedOn !== null && inPeriod(task.completedOn, input.period)).length;

  const routineSummaries = input.routines.map((routine) => summarizeRoutine(routine, input.routineLogs, input.period));
  const measurableRoutines = routineSummaries.filter((routine) => routine.expected > 0);

  const areas = (["pro", "perso", "religion"] as const).map((lifeArea) => {
    const areaTasks = expectedTasks.filter((task) => task.lifeArea === lifeArea);
    const areaTaskCompleted = completedExpectedTasks.filter((task) => task.lifeArea === lifeArea).length;
    const areaRoutines = measurableRoutines.filter((routine) => routine.lifeArea === lifeArea);
    const routineExpected = sum(areaRoutines.map((routine) => routine.expected));
    const routineCompleted = sum(areaRoutines.map((routine) => routine.completed));
    const expected = areaTasks.length + routineExpected;
    const completed = areaTaskCompleted + routineCompleted;
    return { lifeArea, expected, completed, rate: percentage(completed, expected) };
  });

  const routineExpected = sum(measurableRoutines.map((routine) => routine.expected));
  const routineCompleted = sum(measurableRoutines.map((routine) => routine.completed));
  const expected = expectedTasks.length + routineExpected;
  const completed = completedExpectedTasks.length + routineCompleted;

  return {
    expected,
    completed,
    rate: percentage(completed, expected),
    taskExpected: expectedTasks.length,
    taskCompleted: completedExpectedTasks.length,
    routineExpected,
    routineCompleted,
    completedActions,
    areas,
    routines: routineSummaries,
  };
}

export function buildWeeklySeries(input: {
  today: string;
  weeks: number;
  tasks: readonly AnalyticsTask[];
  routines: readonly AnalyticsRoutine[];
  routineLogs: readonly AnalyticsRoutineLog[];
}): Array<PeriodSummary & { start: string; end: string }> {
  const result: Array<PeriodSummary & { start: string; end: string }> = [];
  for (let offset = input.weeks - 1; offset >= 0; offset -= 1) {
    const end = addCalendarDays(input.today, -(offset * 7));
    const start = addCalendarDays(end, -6);
    result.push({ start, end, ...summarizePeriod({ ...input, period: { start, end } }) });
  }
  return result;
}

export function taskRescheduleCounts(events: readonly RescheduleEvent[], period: Period): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (!inPeriod(event.occurredOn, period)) continue;
    counts.set(event.taskId, (counts.get(event.taskId) ?? 0) + 1);
  }
  return counts;
}

export function staleProjects(projects: readonly AnalyticsProject[], today: string, staleAfterDays = 14): AnalyticsProject[] {
  const cutoff = addCalendarDays(today, -staleAfterDays);
  return projects
    .filter((project) => ["focus", "active", "blocked"].includes(project.status))
    .filter((project) => !project.lastActivityOn || project.lastActivityOn < cutoff)
    .sort((left, right) => (left.lastActivityOn ?? "").localeCompare(right.lastActivityOn ?? ""));
}

export function previousPeriod(period: Period): Period {
  const days = daysInclusive(period.start, period.end);
  const end = addCalendarDays(period.start, -1);
  return { start: addCalendarDays(end, -(days - 1)), end };
}

export function percentage(completed: number, expected: number): number | null {
  if (expected <= 0) return null;
  return Math.round((completed / expected) * 100);
}

function summarizeRoutine(routine: AnalyticsRoutine, logs: readonly AnalyticsRoutineLog[], period: Period): RoutineSummary {
  const completionDates = logs
    .filter((log) => log.routineType === routine.routineType && log.routineId === routine.id && log.count > 0)
    .map((log) => log.occurredOn);
  const windows = expectedRoutineWindows(routine.schedule, period);
  const completed = windows.filter((window) => completionDates.some((date) => date >= window.start && date <= window.end)).length;
  return {
    id: routine.id,
    name: routine.name,
    lifeArea: routine.lifeArea,
    routineType: routine.routineType,
    expected: windows.length,
    completed,
    rate: percentage(completed, windows.length),
  };
}

function expectedRoutineWindows(schedule: RoutineSchedule, period: Period): Period[] {
  if (schedule.frequency === "weekly" && schedule.scheduleWeekday == null && !(schedule.scheduleWindowWeekdays?.length)) {
    const windows: Period[] = [];
    let cursor = startOfIsoWeek(period.start);
    while (cursor <= period.end) {
      const weekEnd = addCalendarDays(cursor, 6);
      const window = { start: cursor < period.start ? period.start : cursor, end: weekEnd > period.end ? period.end : weekEnd };
      if (routineAvailableDuring(schedule, window)) windows.push(window);
      cursor = addCalendarDays(cursor, 7);
    }
    return windows;
  }
  if (schedule.frequency === "monthly" && schedule.scheduleDayOfMonth == null && !(schedule.scheduleWindowWeekdays?.length)) {
    const windows: Period[] = [];
    let cursor = `${period.start.slice(0, 7)}-01`;
    while (cursor <= period.end) {
      const [year, month] = cursor.split("-").map(Number);
      const nextMonth = new Date(Date.UTC(year!, month!, 1, 12)).toISOString().slice(0, 10);
      const monthEnd = addCalendarDays(nextMonth, -1);
      const window = { start: cursor < period.start ? period.start : cursor, end: monthEnd > period.end ? period.end : monthEnd };
      if (routineAvailableDuring(schedule, window)) windows.push(window);
      cursor = nextMonth;
    }
    return windows;
  }
  if (schedule.frequency === "flexible" || schedule.frequency === "contextual") return [];
  return scheduledRoutineWindows(schedule, period.start, period.end).map((window) => ({ start: window.startsOn, end: window.endsOn }));
}

function routineAvailableDuring(schedule: RoutineSchedule, period: Period): boolean {
  if (schedule.active === false || schedule.pausedAt || schedule.archivedAt) return false;
  if (schedule.startOn && schedule.startOn > period.end) return false;
  if (schedule.endOn && schedule.endOn < period.start) return false;
  return true;
}

function startOfIsoWeek(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  const weekday = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - weekday + 1);
  return value.toISOString().slice(0, 10);
}

function isTaskExpected(task: AnalyticsTask, period: Period): boolean {
  const anchor = task.plannedOn ?? task.dueOn;
  return anchor !== null && inPeriod(anchor, period);
}

function inPeriod(date: string, period: Period): boolean {
  return date >= period.start && date <= period.end;
}

function daysInclusive(start: string, end: string): number {
  const startDate = Date.parse(`${start}T12:00:00Z`);
  const endDate = Date.parse(`${end}T12:00:00Z`);
  return Math.max(1, Math.round((endDate - startDate) / 86_400_000) + 1);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
