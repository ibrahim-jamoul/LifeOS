import { buildWeeklySeries, previousPeriod, staleProjects, summarizePeriod, taskRescheduleCounts, type AnalyticsProject, type AnalyticsRoutine, type AnalyticsRoutineLog, type AnalyticsTask, type LifeArea } from "@/lib/domain/life-analytics";
import { addCalendarDays, calendarDateInTimeZone, isoWeekday } from "@/lib/domain/routines";
import { taskOccurrencesBetween } from "@/lib/domain/task-recurrence";
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
  const today = calendarDateInTimeZone(new Date(), timezone);
  const currentPeriod = align === "iso-week" ? { start: addCalendarDays(today, 1 - isoWeekday(today)), end: today } : { start: addCalendarDays(today, -(days - 1)), end: today };
  const priorPeriod = align === "iso-week" ? { start: addCalendarDays(currentPeriod.start, -7), end: addCalendarDays(currentPeriod.end, -7) } : previousPeriod(currentPeriod);
  const weeklySeriesStart = addCalendarDays(today, -62);
  const priorFetchStart = addCalendarDays(priorPeriod.start, -7);
  const fetchStart = weeklySeriesStart < priorFetchStart ? weeklySeriesStart : priorFetchStart;

  const [tasksR, occurrencesR, habitsR, religionR, habitLogsR, religionLogsR, projectsR, activityR, goalsR] = await Promise.all([
    supabase.from("tasks").select("id,title,goal_id,life_area,status,planned_on,due_on,due_at,completed_at,recurrence_rule,recurrence_until").eq("user_id", userId).limit(3000),
    supabase.from("task_occurrences").select("task_id,occurrence_on,completed_at").eq("user_id", userId).gte("occurrence_on", fetchStart).lte("occurrence_on", today).limit(8000),
    supabase.from("habits").select("id,name,life_area,frequency,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).limit(500),
    supabase.from("religion_routines").select("id,name,target_frequency,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).limit(500),
    supabase.from("habit_logs").select("habit_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", fetchStart).lte("occurred_on", today).limit(8000),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", fetchStart).lte("occurred_on", today).limit(8000),
    supabase.from("projects").select("id,title,life_area,status,last_activity_at,updated_at,progress_percent,priority").eq("user_id", userId).limit(500),
    supabase.from("activity_log").select("entity_id,entity_type,action,created_at").eq("user_id", userId).gte("created_at", `${fetchStart}T00:00:00Z`).order("created_at", { ascending: false }).limit(8000),
    supabase.from("goals").select("id,title,life_area,status,progress_percent,priority,target_date").eq("user_id", userId).in("status", ["active", "at_risk"]).limit(300),
  ]);

  const occurrenceCompleted = new Map<string, string>();
  for (const row of (occurrencesR.data ?? []) as Row[]) if (typeof row.task_id === "string" && typeof row.occurrence_on === "string" && typeof row.completed_at === "string") occurrenceCompleted.set(`${row.task_id}:${row.occurrence_on}`, row.completed_at.slice(0, 10));
  const tasks = ((tasksR.data ?? []) as Row[]).flatMap((row) => normalizeTask(row, occurrenceCompleted, fetchStart, today));
  const routines = [
    ...((habitsR.data ?? []) as Row[]).flatMap((row) => normalizeRoutine(row, "habit")),
    ...((religionR.data ?? []) as Row[]).flatMap((row) => normalizeRoutine(row, "religion")),
  ];
  const logs: AnalyticsRoutineLog[] = [
    ...((habitLogsR.data ?? []) as Row[]).flatMap((row) => normalizeLog(row, "habit")),
    ...((religionLogsR.data ?? []) as Row[]).flatMap((row) => normalizeLog(row, "religion")),
  ];
  const projects = ((projectsR.data ?? []) as Row[]).flatMap(normalizeProject);
  const rescheduleEvents = ((activityR.data ?? []) as Row[]).flatMap((row) => row.entity_type === "tasks" && row.action === "rescheduled" && typeof row.entity_id === "string" && typeof row.created_at === "string" ? [{ taskId: row.entity_id, occurredOn: row.created_at.slice(0, 10) }] : []);

  const current = summarizePeriod({ period: currentPeriod, tasks, routines, routineLogs: logs });
  const previous = summarizePeriod({ period: priorPeriod, tasks, routines, routineLogs: logs });
  const weekly = buildWeeklySeries({ today, weeks: 8, tasks, routines, routineLogs: logs });
  const counts = taskRescheduleCounts(rescheduleEvents, currentPeriod);
  const openTasks = new Map(tasks.filter((task) => !["done", "cancelled"].includes(task.status)).map((task) => [task.id.split(":")[0]!, task]));
  const repeatedlyRescheduled = [...counts.entries()].filter(([, count]) => count >= 2).flatMap(([taskId, count]) => { const task = openTasks.get(taskId); return task ? [{ id: taskId, title: task.title, lifeArea: task.lifeArea, count }] : []; }).sort((a, b) => b.count - a.count);
  const inactiveProjects = staleProjects(projects, today, 14);
  const weakRoutines = current.routines.filter((routine) => routine.expected >= 3 && routine.rate !== null && routine.rate < 50).sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0));
  const strongRoutines = current.routines.filter((routine) => routine.expected >= 3 && routine.rate !== null && routine.rate >= 80).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
  const activeGoals = (goalsR.data ?? []) as Row[];
  const progressedGoalIds = new Set(tasks.filter((task) => task.goalId && task.completedOn && task.completedOn >= currentPeriod.start && task.completedOn <= currentPeriod.end).map((task) => task.goalId as string));
  const goalsWithActivity = activeGoals.filter((goal) => typeof goal.id === "string" && progressedGoalIds.has(goal.id));
  const goalsWithoutActivity = activeGoals.filter((goal) => typeof goal.id === "string" && !progressedGoalIds.has(goal.id));

  return { timezone, today, period: currentPeriod, previousPeriod: priorPeriod, current, previous, weekly, repeatedlyRescheduled, inactiveProjects, weakRoutines, strongRoutines, activeProjects: projects.filter((project) => ["focus", "active", "blocked"].includes(project.status)), activeGoals, goalsWithActivity, goalsWithoutActivity };
}

function normalizeTask(row: Row, occurrenceCompleted: Map<string, string>, start: string, end: string): AnalyticsTask[] {
  if (typeof row.id !== "string" || typeof row.title !== "string") return [];
  const dueOn = typeof row.due_on === "string" ? row.due_on : typeof row.due_at === "string" ? row.due_at.slice(0, 10) : null;
  const goalId = typeof row.goal_id === "string" ? row.goal_id : null;
  const plannedOn = typeof row.planned_on === "string" ? row.planned_on : null;
  const rule = typeof row.recurrence_rule === "string" ? row.recurrence_rule : null;
  const until = typeof row.recurrence_until === "string" ? row.recurrence_until : null;
  if (plannedOn && rule) return taskOccurrencesBetween({ plannedOn, recurrenceRule: rule, recurrenceUntil: until, start, end, limit: 1000 }).map((date) => { const completedOn = occurrenceCompleted.get(`${row.id}:${date}`) ?? null; return { id: `${row.id}:${date}`, title: row.title as string, lifeArea: normalizeLifeArea(row.life_area), status: completedOn ? "done" : String(row.status ?? "todo"), plannedOn: date, dueOn: null, completedOn, goalId }; });
  return [{ id: row.id, title: row.title, lifeArea: normalizeLifeArea(row.life_area), status: String(row.status ?? "todo"), plannedOn, dueOn, completedOn: typeof row.completed_at === "string" ? row.completed_at.slice(0, 10) : null, goalId }];
}
function normalizeRoutine(row: Row, routineType: "habit" | "religion"): AnalyticsRoutine[] { if (typeof row.id !== "string" || typeof row.name !== "string") return []; return [{ id: row.id, name: row.name, lifeArea: routineType === "religion" ? "religion" : normalizeLifeArea(row.life_area), routineType, schedule: { frequency: String(routineType === "habit" ? row.frequency ?? "" : row.target_frequency ?? ""), active: row.active !== false && row.status === "active", scheduleWeekday: numberOrNull(row.schedule_weekday), scheduleDayOfMonth: numberOrNull(row.schedule_day_of_month), scheduleWindowWeekdays: numberArray(row.schedule_window_weekdays), scheduleMonthWeeks: numberArray(row.schedule_month_weeks), startOn: stringOrNull(row.start_on), endOn: stringOrNull(row.end_on), pausedAt: stringOrNull(row.paused_at), archivedAt: stringOrNull(row.archived_at) } }]; }
function normalizeLog(row: Row, routineType: "habit" | "religion"): AnalyticsRoutineLog[] { const id = routineType === "habit" ? row.habit_id : row.routine_id; return typeof id === "string" && typeof row.occurred_on === "string" ? [{ routineId: id, routineType, occurredOn: row.occurred_on, count: typeof row.count === "number" ? row.count : 0 }] : []; }
function normalizeProject(row: Row): AnalyticsProject[] { if (typeof row.id !== "string" || typeof row.title !== "string") return []; const last = typeof row.last_activity_at === "string" ? row.last_activity_at : typeof row.updated_at === "string" ? row.updated_at : null; return [{ id: row.id, title: row.title, lifeArea: normalizeLifeArea(row.life_area), status: String(row.status ?? "backlog"), lastActivityOn: last ? last.slice(0, 10) : null }]; }
function normalizeLifeArea(value: unknown): LifeArea { return value === "pro" || value === "perso" || value === "religion" ? value : null; }
function numberOrNull(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function numberArray(value: unknown): number[] { return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : []; }
function stringOrNull(value: unknown): string | null { return typeof value === "string" ? value : null; }
