import type { Metadata } from "next";
import { KpiDashboardV4, type KpiView } from "@/components/kpi-dashboard-v4";
import { addCalendarDays, calendarDateInTimeZone, isoWeekday, scheduledRoutineWindows } from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "KPI" };
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
type Period = { start: string; end: string };

export default async function KpiDashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);
  const historyStart = addCalendarDays(today, -70);

  const [kpisR, entriesR, habitLogsR, religionLogsR, habitsR, religionRoutinesR, projectsR, goalsR, tasksR, linksR, reviewsR, resourcesR] = await Promise.all([
    supabase.from("kpis").select("id,name,life_area,unit,target_type,target_value,target_min,target_max,cadence,direction,configuration_status,notes,measurement_mode,source_type,source_id,aggregation").eq("user_id", userId).eq("active", true).order("life_area").order("name"),
    supabase.from("kpi_entries").select("kpi_id,value,measured_at").eq("user_id", userId).order("measured_at", { ascending: false }).limit(5000),
    supabase.from("habit_logs").select("habit_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", historyStart).lte("occurred_on", today).limit(5000),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", historyStart).lte("occurred_on", today).limit(5000),
    supabase.from("habits").select("id,frequency,active,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,paused_at,archived_at").eq("user_id", userId).eq("active", true).limit(500),
    supabase.from("religion_routines").select("id,target_frequency,active,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,paused_at,archived_at").eq("user_id", userId).eq("active", true).limit(500),
    supabase.from("projects").select("id,progress_percent,status").eq("user_id", userId).limit(1000),
    supabase.from("goals").select("id,progress_percent,status").eq("user_id", userId).limit(1000),
    supabase.from("tasks").select("id,project_id,goal_id,status").eq("user_id", userId).limit(5000),
    supabase.from("goal_projects").select("goal_id,project_id").eq("user_id", userId).limit(2000),
    supabase.from("weekly_reviews").select("week_start").eq("user_id", userId).gte("week_start", historyStart).lte("week_start", today).limit(200),
    supabase.from("resources").select("resource_type,status,updated_at").eq("user_id", userId).limit(2000),
  ]);

  const entriesByKpi = groupBy((entriesR.data ?? []) as Row[], "kpi_id");
  const habitLogs = (habitLogsR.data ?? []) as Row[];
  const religionLogs = (religionLogsR.data ?? []) as Row[];
  const habits = (habitsR.data ?? []) as Row[];
  const religionRoutines = (religionRoutinesR.data ?? []) as Row[];
  const projects = (projectsR.data ?? []) as Row[];
  const goals = (goalsR.data ?? []) as Row[];
  const tasks = (tasksR.data ?? []) as Row[];
  const goalProjects = (linksR.data ?? []) as Row[];
  const reviews = (reviewsR.data ?? []) as Row[];
  const resources = (resourcesR.data ?? []) as Row[];

  const views: KpiView[] = ((kpisR.data ?? []) as Row[]).flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.name !== "string") return [];
    const cadence = typeof row.cadence === "string" ? row.cadence : "unset";
    const { current, previous } = metricValues({
      kpi: row, today, cadence, entries: entriesByKpi.get(row.id) ?? [], habitLogs, religionLogs,
      habits, religionRoutines, projects, goals, tasks, goalProjects, reviews, resources,
    });
    const targetType = typeof row.target_type === "string" ? row.target_type : "none";
    const targetValue = numeric(row.target_value);
    const targetMin = numeric(row.target_min);
    const targetMax = numeric(row.target_max);
    return [{
      id: row.id,
      name: row.name,
      area: area(row.life_area),
      unit: typeof row.unit === "string" ? row.unit : "",
      cadence,
      targetType,
      targetValue,
      targetMin,
      targetMax,
      current,
      previous,
      progress: targetProgress(targetType, current, targetValue, targetMin, targetMax),
      configurationStatus: typeof row.configuration_status === "string" ? row.configuration_status : "ready",
      measurementMode: row.measurement_mode === "derived" ? "derived" : "manual",
      notes: typeof row.notes === "string" ? row.notes : null,
    }];
  });

  return <KpiDashboardV4 kpis={views} />;
}

function metricValues(input: {
  kpi: Row; today: string; cadence: string; entries: Row[]; habitLogs: Row[]; religionLogs: Row[];
  habits: Row[]; religionRoutines: Row[]; projects: Row[]; goals: Row[]; tasks: Row[]; goalProjects: Row[]; reviews: Row[]; resources: Row[];
}): { current: number | null; previous: number | null } {
  const { kpi } = input;
  if (kpi.measurement_mode !== "derived") {
    return { current: numeric(input.entries[0]?.value), previous: numeric(input.entries[1]?.value) };
  }

  const sourceType = typeof kpi.source_type === "string" ? kpi.source_type : null;
  const sourceId = typeof kpi.source_id === "string" ? kpi.source_id : null;
  const aggregation = typeof kpi.aggregation === "string" ? kpi.aggregation : "latest";
  const periods = cadencePeriods(input.cadence, input.today);

  if (sourceType === "habit" && sourceId) return periodLogValues(input.habitLogs, "habit_id", sourceId, aggregation, periods);
  if (sourceType === "religion_routine" && sourceId) return periodLogValues(input.religionLogs, "routine_id", sourceId, aggregation, periods);
  if (sourceType === "project" && sourceId) return { current: projectProgress(sourceId, input.projects, input.tasks), previous: null };
  if (sourceType === "goal" && sourceId) return { current: goalProgress(sourceId, input.goals, input.projects, input.tasks, input.goalProjects), previous: null };
  if (sourceType === "weekly_review") return { current: countDates(input.reviews, "week_start", periods.current), previous: periods.previous ? countDates(input.reviews, "week_start", periods.previous) : null };
  if (sourceType === "resource_completed") return { current: input.resources.filter((row) => row.status === "completed").length, previous: null };
  if (sourceType === "all_routines") return routineRatioValues(input, periods);
  return { current: null, previous: null };
}

function routineRatioValues(input: Parameters<typeof metricValues>[0], periods: { current: Period; previous: Period | null }) {
  const current = routineRatio(input.habits, input.religionRoutines, input.habitLogs, input.religionLogs, periods.current);
  const previous = periods.previous ? routineRatio(input.habits, input.religionRoutines, input.habitLogs, input.religionLogs, periods.previous) : null;
  return { current, previous };
}

function routineRatio(habits: Row[], religion: Row[], habitLogs: Row[], religionLogs: Row[], period: Period): number | null {
  let expected = 0;
  let completed = 0;
  for (const routine of habits) {
    if (typeof routine.id !== "string") continue;
    const schedule = scheduleFrom(routine, "frequency");
    const windows = scheduledRoutineWindows(schedule, period.start, period.end);
    const dates = habitLogs.filter((log) => log.habit_id === routine.id && numeric(log.count) !== 0 && typeof log.occurred_on === "string").map((log) => String(log.occurred_on));
    expected += windows.length;
    completed += windows.filter((window) => dates.some((date) => date >= window.startsOn && date <= window.endsOn)).length;
  }
  for (const routine of religion) {
    if (typeof routine.id !== "string") continue;
    const schedule = scheduleFrom(routine, "target_frequency");
    const windows = scheduledRoutineWindows(schedule, period.start, period.end);
    const dates = religionLogs.filter((log) => log.routine_id === routine.id && numeric(log.count) !== 0 && typeof log.occurred_on === "string").map((log) => String(log.occurred_on));
    expected += windows.length;
    completed += windows.filter((window) => dates.some((date) => date >= window.startsOn && date <= window.endsOn)).length;
  }
  return expected ? Math.round(completed / expected * 1000) / 10 : null;
}

function scheduleFrom(row: Row, frequencyKey: "frequency" | "target_frequency") {
  return {
    frequency: typeof row[frequencyKey] === "string" ? String(row[frequencyKey]) : "flexible",
    active: row.active !== false,
    scheduleWeekday: numeric(row.schedule_weekday),
    scheduleDayOfMonth: numeric(row.schedule_day_of_month),
    scheduleWindowWeekdays: numberArray(row.schedule_window_weekdays),
    scheduleMonthWeeks: numberArray(row.schedule_month_weeks),
    startOn: typeof row.start_on === "string" ? row.start_on : null,
    endOn: typeof row.end_on === "string" ? row.end_on : null,
    pausedAt: typeof row.paused_at === "string" ? row.paused_at : null,
    archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
  };
}

function projectProgress(projectId: string, projects: Row[], tasks: Row[]): number | null {
  const rows = tasks.filter((task) => task.project_id === projectId && task.status !== "cancelled");
  if (rows.length) return Math.round(rows.filter((task) => task.status === "done").length / rows.length * 1000) / 10;
  const project = projects.find((row) => row.id === projectId);
  return numeric(project?.progress_percent);
}

function goalProgress(goalId: string, goals: Row[], projects: Row[], tasks: Row[], links: Row[]): number | null {
  const projectIds = new Set(links.filter((link) => link.goal_id === goalId && typeof link.project_id === "string").map((link) => String(link.project_id)));
  const rows = tasks.filter((task) => task.status !== "cancelled" && (task.goal_id === goalId || (typeof task.project_id === "string" && projectIds.has(task.project_id))));
  const unique = new Map(rows.flatMap((row) => typeof row.id === "string" ? [[row.id, row] as const] : []));
  if (unique.size) return Math.round([...unique.values()].filter((task) => task.status === "done").length / unique.size * 1000) / 10;
  const goal = goals.find((row) => row.id === goalId);
  return numeric(goal?.progress_percent);
}

function periodLogValues(logs: Row[], key: "habit_id" | "routine_id", sourceId: string, aggregation: string, periods: { current: Period; previous: Period | null }) {
  const select = (period: Period) => logs.filter((log) => log[key] === sourceId && typeof log.occurred_on === "string" && String(log.occurred_on) >= period.start && String(log.occurred_on) <= period.end);
  return { current: aggregateLogs(select(periods.current), aggregation), previous: periods.previous ? aggregateLogs(select(periods.previous), aggregation) : null };
}

function aggregateLogs(logs: Row[], aggregation: string): number {
  if (aggregation === "count_days") return new Set(logs.filter((row) => (numeric(row.count) ?? 0) > 0).map((row) => String(row.occurred_on))).size;
  if (aggregation === "count") return logs.length;
  return logs.reduce((sum, row) => sum + (numeric(row.count) ?? 0), 0);
}

function cadencePeriods(cadence: string, today: string): { current: Period; previous: Period | null } {
  if (cadence === "daily") return { current: { start: today, end: today }, previous: { start: addCalendarDays(today, -1), end: addCalendarDays(today, -1) } };
  if (cadence === "monthly") {
    const currentStart = `${today.slice(0, 7)}-01`;
    const previousEnd = addCalendarDays(currentStart, -1);
    return { current: { start: currentStart, end: today }, previous: { start: `${previousEnd.slice(0, 7)}-01`, end: previousEnd } };
  }
  if (cadence === "weekly") {
    const currentStart = addCalendarDays(today, 1 - isoWeekday(today));
    const previousEnd = addCalendarDays(currentStart, -1);
    return { current: { start: currentStart, end: today }, previous: { start: addCalendarDays(currentStart, -7), end: previousEnd } };
  }
  return { current: { start: "1900-01-01", end: today }, previous: null };
}

function targetProgress(type: string, current: number | null, target: number | null, min: number | null, max: number | null): number | null {
  if (current === null) return null;
  if ((type === "min" || type === "exact") && target !== null) return target === 0 ? (current === 0 ? 100 : 0) : clamp(current / target * 100);
  if (type === "max" && target !== null) return current <= target ? 100 : current === 0 ? 100 : clamp(target / current * 100);
  if (type === "range" && min !== null && max !== null) {
    if (current >= min && current <= max) return 100;
    if (current < min) return min === 0 ? 0 : clamp(current / min * 100);
    return current === 0 ? 100 : clamp(max / current * 100);
  }
  return null;
}

function countDates(rows: Row[], key: string, period: Period) { return rows.filter((row) => typeof row[key] === "string" && String(row[key]) >= period.start && String(row[key]) <= period.end).length; }
function groupBy(rows: Row[], key: string) { const map = new Map<string, Row[]>(); for (const row of rows) if (typeof row[key] === "string") map.set(String(row[key]), [...(map.get(String(row[key])) ?? []), row]); return map; }
function numeric(value: unknown): number | null { if (typeof value === "number" && Number.isFinite(value)) return value; if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value); return null; }
function numberArray(value: unknown): number[] { return Array.isArray(value) ? value.map(numeric).filter((item): item is number => item !== null) : []; }
function area(value: unknown): "pro" | "perso" | "religion" | null { return value === "pro" || value === "perso" || value === "religion" ? value : null; }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value * 10) / 10)); }
