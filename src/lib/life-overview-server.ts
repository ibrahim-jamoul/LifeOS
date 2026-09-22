import { buildWeeklySeries, previousPeriod, staleProjects, summarizePeriod, taskRescheduleCounts, type AnalyticsProject, type AnalyticsRoutine, type AnalyticsRoutineLog, type AnalyticsTask, type LifeArea } from "@/lib/domain/life-analytics";
import { addCalendarDays, calendarDateInTimeZone, isoWeekday } from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export type LifeOverview = Awaited<ReturnType<typeof loadLifeOverview>>;

type OverviewOptions = number | { days?: number; align?: "rolling" | "iso-week" };

export async function loadLifeOverview(options: OverviewOptions = 30) {
  const days = typeof options === "number" ? options : options.days ?? 30;
  const align = typeof options === "number" ? "rolling" : options.align ?? "rolling";
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  if (!userId) throw new Error("Utilisateur non authentifié.");

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const now = new Date();
  const today = calendarDateInTimeZone(now, timezone);
  const currentPeriod = align === "iso-week"
    ? { start: addCalendarDays(today, 1 - isoWeekday(today)), end: today }
    : { start: addCalendarDays(today, -(days - 1)), end: today };
  const priorPeriod = align === "iso-week"
    ? { start: addCalendarDays(currentPeriod.start, -7), end: addCalendarDays(currentPeriod.end, -7) }
    : previousPeriod(currentPeriod);
  const fetchStart = addCalendarDays(priorPeriod.start, -7);

  const [tasksResult, habitsResult, religionResult, habitLogsResult, religionLogsResult, projectsResult, activityResult, goalsResult] = await Promise.all([
    supabase.from("tasks").select("id,title,life_area,status,planned_on,due_on,due_at,completed_at,created_at").eq("user_id", userId).limit(2000),
    supabase.from("habits").select("id,name,life_area,frequency,schedule_weekday,schedule_day_of_month,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).limit(500),
    supabase.from("religion_routines").select("id,name,target_frequency,schedule_weekday,schedule_day_of_month,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).limit(500),
    supabase.from("habit_logs").select("habit_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", fetchStart).lte("occurred_on", today).limit(5000),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", fetchStart).lte("occurred_on", today).limit(5000),
    supabase.from("projects").select("id,title,life_area,status,last_activity_at,updated_at,progress_percent,priority").eq("user_id", userId).limit(500),
    supabase.from("activity_log").select("entity_id,entity_type,action,created_at").eq("user_id", userId).gte("created_at", `${fetchStart}T00:00:00Z`).order("created_at", { ascending: false }).limit(5000),
    supabase.from("goals").select("id,title,life_area,status,progress_percent,priority,target_date").eq("user_id", userId).in("status", ["active", "at_risk"]).limit(300),
  ]);

  const tasks = ((tasksResult.data ?? []) as Row[]).flatMap(normalizeTask);
  const routines = [
    ...((habitsResult.data ?? []) as Row[]).flatMap((row) => normalizeRoutine(row, "habit")),
    ...((religionResult.data ?? []) as Row[]).flatMap((row) => normalizeRoutine(row, "religion")),
  ];
  const logs: AnalyticsRoutineLog[] = [
    ...((habitLogsResult.data ?? []) as Row[]).flatMap((row) => normalizeLog(row, "habit")),
    ...((religionLogsResult.data ?? []) as Row[]).flatMap((row) => normalizeLog(row, "religion")),
  ];
  const projects = ((projectsResult.data ?? []) as Row[]).flatMap(normalizeProject);
  const rescheduleEvents = ((activityResult.data ?? []) as Row[]).flatMap((row) => {
    if (row.entity_type !== "tasks" || row.action !== "rescheduled" || typeof row.entity_id !== "string" || typeof row.created_at !== "string") return [];
    return [{ taskId: row.entity_id, occurredOn: row.created_at.slice(0, 10) }];
  });

  const current = summarizePeriod({ period: currentPeriod, tasks, routines, routineLogs: logs });
  const previous = summarizePeriod({ period: priorPeriod, tasks, routines, routineLogs: logs });
  const weekly = buildWeeklySeries({ today, weeks: 8, tasks, routines, routineLogs: logs });
  const rescheduleCounts = taskRescheduleCounts(rescheduleEvents, currentPeriod);
  const openTasks = new Map(tasks.filter((task) => !["done", "cancelled"].includes(task.status)).map((task) => [task.id, task]));
  const repeatedlyRescheduled = [...rescheduleCounts.entries()]
    .filter(([, count]) => count >= 2)
    .flatMap(([taskId, count]) => {
      const task = openTasks.get(taskId);
      return task ? [{ id: task.id, title: task.title, lifeArea: task.lifeArea, count }] : [];
    })
    .sort((left, right) => right.count - left.count);
  const inactiveProjects = staleProjects(projects, today, 14);
  const weakRoutines = current.routines
    .filter((routine) => routine.expected >= 3 && routine.rate !== null && routine.rate < 50)
    .sort((left, right) => (left.rate ?? 0) - (right.rate ?? 0));
  const strongRoutines = current.routines
    .filter((routine) => routine.expected >= 3 && routine.rate !== null && routine.rate >= 80)
    .sort((left, right) => (right.rate ?? 0) - (left.rate ?? 0));

  return {
    timezone,
    today,
    period: currentPeriod,
    previousPeriod: priorPeriod,
    current,
    previous,
    weekly,
    repeatedlyRescheduled,
    inactiveProjects,
    weakRoutines,
    strongRoutines,
    activeProjects: projects.filter((project) => ["focus", "active", "blocked"].includes(project.status)),
    activeGoals: (goalsResult.data ?? []) as Row[],
  };
}

function normalizeTask(row: Row): AnalyticsTask[] {
  if (typeof row.id !== "string" || typeof row.title !== "string") return [];
  const dueOn = typeof row.due_on === "string" ? row.due_on : typeof row.due_at === "string" ? row.due_at.slice(0, 10) : null;
  return [{
    id: row.id,
    title: row.title,
    lifeArea: normalizeLifeArea(row.life_area),
    status: String(row.status ?? "todo"),
    plannedOn: typeof row.planned_on === "string" ? row.planned_on : null,
    dueOn,
    completedOn: typeof row.completed_at === "string" ? row.completed_at.slice(0, 10) : null,
  }];
}

function normalizeRoutine(row: Row, routineType: "habit" | "religion"): AnalyticsRoutine[] {
  if (typeof row.id !== "string" || typeof row.name !== "string") return [];
  return [{
    id: row.id,
    name: row.name,
    lifeArea: routineType === "religion" ? "religion" : normalizeLifeArea(row.life_area),
    routineType,
    schedule: {
      frequency: String(routineType === "habit" ? row.frequency ?? "" : row.target_frequency ?? ""),
      active: row.active !== false && row.status === "active",
      scheduleWeekday: numberOrNull(row.schedule_weekday),
      scheduleDayOfMonth: numberOrNull(row.schedule_day_of_month),
      startOn: typeof row.start_on === "string" ? row.start_on : null,
      endOn: typeof row.end_on === "string" ? row.end_on : null,
      pausedAt: typeof row.paused_at === "string" ? row.paused_at : null,
      archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
    },
  }];
}

function normalizeLog(row: Row, routineType: "habit" | "religion"): AnalyticsRoutineLog[] {
  const id = routineType === "habit" ? row.habit_id : row.routine_id;
  if (typeof id !== "string" || typeof row.occurred_on !== "string") return [];
  return [{ routineId: id, routineType, occurredOn: row.occurred_on, count: typeof row.count === "number" ? row.count : 0 }];
}

function normalizeProject(row: Row): AnalyticsProject[] {
  if (typeof row.id !== "string" || typeof row.title !== "string") return [];
  const lastActivity = typeof row.last_activity_at === "string" ? row.last_activity_at : typeof row.updated_at === "string" ? row.updated_at : null;
  return [{
    id: row.id,
    title: row.title,
    lifeArea: normalizeLifeArea(row.life_area),
    status: String(row.status ?? "backlog"),
    lastActivityOn: lastActivity ? lastActivity.slice(0, 10) : null,
  }];
}

function normalizeLifeArea(value: unknown): LifeArea {
  return value === "pro" || value === "perso" || value === "religion" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
