import type { Metadata } from "next";
import {
  LifeDashboard,
  type DashboardGoal,
  type DashboardTodayItem,
  type DashboardUpcomingItem,
  type GoalOption,
  type LifeArea,
  type ProjectOption,
} from "@/components/life-dashboard";
import { startOfCalendarDay } from "@/lib/domain/dates";
import {
  addCalendarDays,
  calendarDateInTimeZone,
  isRoutineActionableOn,
  nextRoutineOccurrence,
  routineCompletionWindow,
  routineReasonForDate,
  type RoutineSchedule,
} from "@/lib/domain/routines";
import { taskOccurrencesBetween, taskOccursOn } from "@/lib/domain/task-recurrence";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aujourd’hui" };
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
type NormalizedRoutine = { id: string; name: string; routineType: "habit" | "religion"; lifeArea: LifeArea; durationMinutes: number | null; reminderTime: string | null; schedule: RoutineSchedule };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const now = new Date();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(now, timezone);
  const futureEnd = addCalendarDays(today, 21);
  const nextDayStartsAt = startOfCalendarDay(addCalendarDays(today, 1), timezone).toISOString();
  const routineLogStart = addCalendarDays(today, -35);

  const [tasksR, goalsR, projectsR, occurrencesR, habitsR, religionRoutinesR, habitLogsR, religionLogsR, remindersR] = await Promise.all([
    supabase.from("tasks").select("id,title,status,priority,life_area,planned_on,planned_time,due_on,due_at,project_id,goal_id,estimate_minutes,recurrence_rule,recurrence_until,completed_at").eq("user_id", userId).neq("status", "cancelled").limit(1000),
    supabase.from("goals").select("id,title,life_area,status,priority,horizon,target_date,progress_percent").eq("user_id", userId).not("status", "in", "(cancelled,archived)").limit(300),
    supabase.from("projects").select("id,title,life_area,status").eq("user_id", userId).not("status", "in", "(cancelled,archived)").limit(400),
    supabase.from("task_occurrences").select("task_id,occurrence_on,completed_at").eq("user_id", userId).eq("occurrence_on", today).limit(1000),
    supabase.from("habits").select("id,name,life_area,frequency,duration_minutes,reminder_enabled,reminder_time,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).eq("active", true).eq("status", "active").limit(400),
    supabase.from("religion_routines").select("id,name,target_frequency,duration_minutes,reminder_enabled,reminder_time,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).eq("active", true).eq("status", "active").limit(400),
    supabase.from("habit_logs").select("habit_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", routineLogStart).lte("occurred_on", today).limit(5000),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", routineLogStart).lte("occurred_on", today).limit(5000),
    supabase.from("reminders").select("id,title,life_area,remind_on,reminder_time,remind_at,recurrence,active").eq("user_id", userId).eq("active", true).limit(1000),
  ]);

  const tasks = (tasksR.data ?? []) as Row[];
  const goals = (goalsR.data ?? []) as Row[];
  const projects = (projectsR.data ?? []) as Row[];
  const goalMap = new Map(goals.flatMap((row) => typeof row.id === "string" ? [[row.id, String(row.title ?? "Objectif")] as const] : []));
  const projectMap = new Map(projects.flatMap((row) => typeof row.id === "string" ? [[row.id, String(row.title ?? "Projet")] as const] : []));
  const occurrenceDone = new Set(((occurrencesR.data ?? []) as Row[]).flatMap((row) => typeof row.task_id === "string" && typeof row.completed_at === "string" ? [`${row.task_id}:${row.occurrence_on}`] : []));
  const routines = [
    ...((habitsR.data ?? []) as Row[]).map((row) => normalizeRoutine(row, "habit")),
    ...((religionRoutinesR.data ?? []) as Row[]).map((row) => normalizeRoutine(row, "religion")),
  ].filter((value): value is NormalizedRoutine => value !== null);
  const routineLogs = buildRoutineLogMap((habitLogsR.data ?? []) as Row[], (religionLogsR.data ?? []) as Row[]);
  const reminders = (remindersR.data ?? []) as Row[];

  const todayItems: DashboardTodayItem[] = [];
  for (const task of tasks) {
    if (typeof task.id !== "string" || typeof task.title !== "string") continue;
    const plannedOn = stringOrNull(task.planned_on);
    const recurrenceRule = stringOrNull(task.recurrence_rule);
    const recurrenceUntil = stringOrNull(task.recurrence_until);
    const recurring = Boolean(recurrenceRule);
    const status = String(task.status ?? "todo");
    const dueOn = resolveDueOn(task, timezone);
    const doneOccurrence = recurring && occurrenceDone.has(`${task.id}:${today}`);
    const completedToday = !recurring && status === "done" && typeof task.completed_at === "string" && calendarDateInTimeZone(new Date(task.completed_at), timezone) === today;
    const active = !["done", "cancelled"].includes(status);
    const scheduledToday = recurring
      ? active && taskOccursOn({ plannedOn, recurrenceRule, recurrenceUntil, date: today })
      : active && (plannedOn === today || (plannedOn === null && dueOn === today));
    if (!scheduledToday && !doneOccurrence && !completedToday) continue;
    todayItems.push({
      id: `task:${task.id}:${today}`, kind: "task", title: task.title, lifeArea: lifeArea(task.life_area),
      durationMinutes: numberOrNull(task.estimate_minutes), plannedTime: stringOrNull(task.planned_time),
      context: parentContext(task, goalMap, projectMap), completed: doneOccurrence || completedToday,
      recurring, taskId: task.id, routineId: null, routineType: null,
    });
  }

  for (const routine of routines) {
    if (!isRoutineActionableOn(routine.schedule, today)) continue;
    const window = routineCompletionWindow(routine.schedule, today);
    const completed = window ? hasRoutineCompletion(routineLogs, routine, window.startsOn, window.endsOn) : false;
    todayItems.push({ id: `routine:${routine.routineType}:${routine.id}:${today}`, kind: "routine", title: routine.name, lifeArea: routine.lifeArea, durationMinutes: routine.durationMinutes, plannedTime: routine.reminderTime, context: routineReasonForDate(routine.schedule, today), completed, recurring: true, taskId: null, routineId: routine.id, routineType: routine.routineType });
  }

  for (const reminder of reminders) {
    if (typeof reminder.id !== "string" || typeof reminder.title !== "string") continue;
    const baseDate = reminderBaseDate(reminder, timezone);
    if (!baseDate) continue;
    const recurrence = typeof reminder.recurrence === "string" ? reminder.recurrence : "none";
    const dueNow = recurrence === "none" ? baseDate <= today : reminderOccursOn(baseDate, recurrence, today);
    if (!dueNow) continue;
    todayItems.push({ id: `reminder:${reminder.id}:${today}`, kind: "reminder", title: reminder.title, lifeArea: lifeArea(reminder.life_area), durationMinutes: null, plannedTime: reminderTime(reminder, timezone), context: baseDate < today && recurrence === "none" ? "Rappel arrivé à échéance" : "Rappel du jour", completed: false, recurring: recurrence !== "none", taskId: null, routineId: null, routineType: null, href: "/app/goals/reminders" });
  }
  todayItems.sort(compareToday);

  const upcoming: DashboardUpcomingItem[] = [];
  const upcomingStart = addCalendarDays(today, 1);
  for (const task of tasks) {
    if (typeof task.id !== "string" || typeof task.title !== "string" || ["done", "cancelled"].includes(String(task.status ?? ""))) continue;
    const plannedOn = stringOrNull(task.planned_on);
    const recurrenceRule = stringOrNull(task.recurrence_rule);
    const recurrenceUntil = stringOrNull(task.recurrence_until);
    const dates = recurrenceRule
      ? taskOccurrencesBetween({ plannedOn, recurrenceRule, recurrenceUntil, start: upcomingStart, end: futureEnd, limit: 12 })
      : plannedOn && plannedOn >= upcomingStart && plannedOn <= futureEnd ? [plannedOn] : [];
    for (const date of dates) upcoming.push({ id: `task:${task.id}:${date}`, date, title: task.title, lifeArea: lifeArea(task.life_area), time: stringOrNull(task.planned_time), durationMinutes: numberOrNull(task.estimate_minutes), context: parentContext(task, goalMap, projectMap), recurring: Boolean(recurrenceRule) });
  }
  for (const routine of routines) {
    const next = nextRoutineOccurrence(routine.schedule, upcomingStart, true);
    if (next && next <= futureEnd) upcoming.push({ id: `routine:${routine.routineType}:${routine.id}:${next}`, date: next, title: routine.name, lifeArea: routine.lifeArea, time: routine.reminderTime, durationMinutes: routine.durationMinutes, context: "Routine planifiée", recurring: true });
  }
  for (const reminder of reminders) {
    if (typeof reminder.id !== "string" || typeof reminder.title !== "string") continue;
    const baseDate = reminderBaseDate(reminder, timezone); if (!baseDate) continue;
    const recurrence = typeof reminder.recurrence === "string" ? reminder.recurrence : "none";
    for (const date of reminderDatesBetween(baseDate, recurrence, upcomingStart, futureEnd).slice(0, 3)) upcoming.push({ id: `reminder:${reminder.id}:${date}`, date, title: reminder.title, lifeArea: lifeArea(reminder.life_area), time: reminderTime(reminder, timezone), durationMinutes: null, context: "Rappel", recurring: recurrence !== "none", href: "/app/goals/reminders" });
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.title.localeCompare(b.title, "fr"));

  const remainingByGoal = new Map<string, number>();
  for (const task of tasks) if (typeof task.goal_id === "string" && !["done", "cancelled"].includes(String(task.status ?? ""))) remainingByGoal.set(task.goal_id, (remainingByGoal.get(task.goal_id) ?? 0) + 1);
  const dashboardGoals: DashboardGoal[] = goals
    .filter((goal) => ["active", "at_risk", "draft"].includes(String(goal.status ?? "")))
    .filter((goal) => { const target = stringOrNull(goal.target_date); const horizon = stringOrNull(goal.horizon)?.toLowerCase() ?? ""; return target?.startsWith("2026") || horizon.includes("2026") || (!target && String(goal.status) !== "draft"); })
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || (stringOrNull(a.target_date) ?? "9999").localeCompare(stringOrNull(b.target_date) ?? "9999"))
    .slice(0, 12)
    .flatMap((goal) => typeof goal.id === "string" && typeof goal.title === "string" ? [{ id: goal.id, title: goal.title, lifeArea: lifeArea(goal.life_area), progress: Math.round(numberOrNull(goal.progress_percent) ?? 0), targetDate: stringOrNull(goal.target_date), status: String(goal.status ?? "draft"), remainingMissions: remainingByGoal.get(goal.id) ?? 0 }] : []);

  const goalOptions: GoalOption[] = goals.flatMap((goal) => typeof goal.id === "string" && typeof goal.title === "string" && !["achieved", "cancelled", "archived"].includes(String(goal.status ?? "")) ? [{ id: goal.id, title: goal.title, lifeArea: lifeArea(goal.life_area) }] : []);
  const projectOptions: ProjectOption[] = projects.flatMap((project) => typeof project.id === "string" && typeof project.title === "string" && !["done", "cancelled", "archived"].includes(String(project.status ?? "")) ? [{ id: project.id, title: project.title, lifeArea: lifeArea(project.life_area) }] : []);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(now);
  return <LifeDashboard today={today} nextDayStartsAt={nextDayStartsAt} dateLabel={dateLabel} todayItems={todayItems} upcoming={upcoming.slice(0, 12)} goals={dashboardGoals} goalOptions={goalOptions} projectOptions={projectOptions} />;
}

function normalizeRoutine(row: Row, routineType: "habit" | "religion"): NormalizedRoutine | null {
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  return { id: row.id, name: row.name, routineType, lifeArea: routineType === "religion" ? "religion" : lifeArea(row.life_area), durationMinutes: numberOrNull(row.duration_minutes), reminderTime: row.reminder_enabled === true ? stringOrNull(row.reminder_time) : null, schedule: { frequency: String(routineType === "habit" ? row.frequency ?? "" : row.target_frequency ?? ""), active: row.active !== false && row.status === "active", scheduleWeekday: numberOrNull(row.schedule_weekday), scheduleDayOfMonth: numberOrNull(row.schedule_day_of_month), scheduleWindowWeekdays: numberArray(row.schedule_window_weekdays), scheduleMonthWeeks: numberArray(row.schedule_month_weeks), startOn: stringOrNull(row.start_on), endOn: stringOrNull(row.end_on), pausedAt: stringOrNull(row.paused_at), archivedAt: stringOrNull(row.archived_at) } };
}
function buildRoutineLogMap(habit: Row[], religion: Row[]) { const map = new Map<string, number>(); for (const row of habit) if (typeof row.habit_id === "string" && typeof row.occurred_on === "string") map.set(`habit:${row.habit_id}:${row.occurred_on}`, numberOrNull(row.count) ?? 0); for (const row of religion) if (typeof row.routine_id === "string" && typeof row.occurred_on === "string") map.set(`religion:${row.routine_id}:${row.occurred_on}`, numberOrNull(row.count) ?? 0); return map; }
function hasRoutineCompletion(map: Map<string, number>, routine: NormalizedRoutine, start: string, end: string) { for (const [key, count] of map) { if (count <= 0 || !key.startsWith(`${routine.routineType}:${routine.id}:`)) continue; const date = key.slice(-10); if (date >= start && date <= end) return true; } return false; }
function parentContext(task: Row, goals: Map<string, string>, projects: Map<string, string>) { const goal = typeof task.goal_id === "string" ? goals.get(task.goal_id) : null; const project = typeof task.project_id === "string" ? projects.get(task.project_id) : null; return goal && project ? `${goal} · ${project}` : goal ?? project ?? null; }
function resolveDueOn(task: Row, timezone: string) { if (typeof task.due_on === "string") return task.due_on; if (typeof task.due_at === "string") return calendarDateInTimeZone(new Date(task.due_at), timezone); return null; }
function compareToday(a: DashboardTodayItem, b: DashboardTodayItem) { if (a.completed !== b.completed) return a.completed ? 1 : -1; const timeA = a.plannedTime ?? "99:99"; const timeB = b.plannedTime ?? "99:99"; return timeA.localeCompare(timeB) || a.title.localeCompare(b.title, "fr"); }
function priorityRank(value: unknown) { return value === "critical" ? 5 : value === "high" ? 4 : value === "medium" ? 3 : value === "low" ? 2 : 1; }
function lifeArea(value: unknown): LifeArea { return value === "pro" || value === "perso" || value === "religion" ? value : null; }
function numberOrNull(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function stringOrNull(value: unknown) { return typeof value === "string" && value.length ? value : null; }
function numberArray(value: unknown): number[] { return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : []; }
function reminderBaseDate(row: Row, timezone: string) { if (typeof row.remind_on === "string") return row.remind_on; if (typeof row.remind_at === "string") return calendarDateInTimeZone(new Date(row.remind_at), timezone); return null; }
function reminderTime(row: Row, timezone: string) { if (typeof row.reminder_time === "string") return row.reminder_time; if (typeof row.remind_at === "string") return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(row.remind_at)); return null; }
function reminderOccursOn(base: string, recurrence: string, date: string) { if (date < base) return false; if (recurrence === "daily") return true; if (recurrence === "weekly") return dayDiff(base, date) % 7 === 0; if (recurrence === "monthly") return Number(date.slice(8, 10)) === Number(base.slice(8, 10)); return date === base; }
function reminderDatesBetween(base: string, recurrence: string, start: string, end: string) { const dates: string[] = []; let cursor = start; while (cursor <= end) { if (reminderOccursOn(base, recurrence, cursor)) dates.push(cursor); cursor = addCalendarDays(cursor, 1); } return dates; }
function dayDiff(start: string, end: string) { return Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000); }
