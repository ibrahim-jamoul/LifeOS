import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, Lightbulb } from "lucide-react";
import { TodayManager } from "@/components/today-manager";
import { GoalsPanel, UpcomingPanel, type GoalSummary, type UpcomingItem } from "@/components/dashboard-panels";
import type { RoutineTodayItem } from "@/components/routines-today";
import { getDerivedAlerts } from "@/lib/alerts";
import { buildDailyPlan, type DailyTaskPriority } from "@/lib/domain/daily-plan";
import {
  addCalendarDays,
  calendarDateInTimeZone,
  isRoutineActionableOn,
  nextRoutineOccurrence,
  routineCompletionWindow,
  routineReasonForDate,
  scheduledRoutineWindows,
  type RoutineSchedule,
} from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aujourd’hui" };
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const now = new Date();
  const profileResult = await supabase.from("profiles").select("display_name,timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profileResult.data?.timezone === "string" ? profileResult.data.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(now, timezone);
  const tomorrow = addCalendarDays(today, 1);
  const nextWeek = addCalendarDays(today, 7);
  const localHour = localHourInTimeZone(now, timezone);
  const routineWindowStart = [addCalendarDays(today, -13), `${today.slice(0, 7)}-01`].sort()[0]!;

  const [tasksResult, projectsResult, goalsResult, goalProjectsResult, habitsResult, religionRoutinesResult, habitLogsResult, religionLogsResult, alerts] = await Promise.all([
    supabase.from("tasks").select("id,title,status,priority,life_area,planned_on,due_on,due_at,project_id,estimate_minutes").eq("user_id", userId).not("status", "in", "(done,cancelled)").limit(300),
    supabase.from("projects").select("id,title,status").eq("user_id", userId).in("status", ["focus", "active", "blocked"]).limit(200),
    supabase.from("goals").select("id,title,life_area,status,progress_percent,target_date,horizon").eq("user_id", userId).in("status", ["active", "at_risk"]).limit(200),
    supabase.from("goal_projects").select("goal_id,project_id").eq("user_id", userId).limit(1000),
    supabase.from("habits").select("id,name,life_area,frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,time_context,configuration_status,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).eq("active", true).eq("status", "active").limit(300),
    supabase.from("religion_routines").select("id,name,target_frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,time_context,configuration_status,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).eq("active", true).eq("status", "active").limit(300),
    supabase.from("habit_logs").select("habit_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", routineWindowStart).lte("occurred_on", today).limit(3000),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", routineWindowStart).lte("occurred_on", today).limit(3000),
    getDerivedAlerts(supabase, userId, now).catch(() => []),
  ]);

  const tasks = (tasksResult.data ?? []) as Row[];
  const projects = (projectsResult.data ?? []) as Row[];
  const focusProjectIds = new Set(projects.filter((project) => project.status === "focus").map((project) => String(project.id)));
  const routineSummary = buildRoutineSummary({
    today,
    windowStart: addCalendarDays(today, -6),
    habits: (habitsResult.data ?? []) as Row[],
    religionRoutines: (religionRoutinesResult.data ?? []) as Row[],
    habitLogs: (habitLogsResult.data ?? []) as Row[],
    religionLogs: (religionLogsResult.data ?? []) as Row[],
  });

  const upcoming: UpcomingItem[] = tasks.flatMap((task) => {
    if (typeof task.id !== "string" || typeof task.title !== "string" || typeof task.planned_on !== "string" || task.planned_on <= today) return [];
    return [{ id: task.id, title: task.title, plannedOn: task.planned_on, lifeArea: normalizeLifeArea(task.life_area), estimateMinutes: numberOrNull(task.estimate_minutes) }];
  }).sort((left, right) => left.plannedOn.localeCompare(right.plannedOn) || left.title.localeCompare(right.title, "fr")).slice(0, 24);

  const openTasksByProject = new Map<string, number>();
  for (const task of tasks) if (typeof task.project_id === "string" && !["done", "cancelled"].includes(String(task.status ?? "todo"))) openTasksByProject.set(task.project_id, (openTasksByProject.get(task.project_id) ?? 0) + 1);
  const projectIdsByGoal = new Map<string, string[]>();
  for (const link of (goalProjectsResult.data ?? []) as Row[]) if (typeof link.goal_id === "string" && typeof link.project_id === "string") projectIdsByGoal.set(link.goal_id, [...(projectIdsByGoal.get(link.goal_id) ?? []), link.project_id]);
  const goals: GoalSummary[] = ((goalsResult.data ?? []) as Row[]).flatMap((goal) => {
    if (typeof goal.id !== "string" || typeof goal.title !== "string") return [];
    const remainingMissions = (projectIdsByGoal.get(goal.id) ?? []).reduce((sum, projectId) => sum + (openTasksByProject.get(projectId) ?? 0), 0);
    return [{ id: goal.id, title: goal.title, lifeArea: normalizeLifeArea(goal.life_area), progressPercent: numberOrNull(goal.progress_percent) ?? 0, targetDate: typeof goal.target_date === "string" ? goal.target_date : null, status: String(goal.status ?? "active"), remainingMissions }];
  }).sort((left, right) => (left.targetDate ?? "9999-12-31").localeCompare(right.targetDate ?? "9999-12-31"));

  const dailyPlan = buildDailyPlan({
    today,
    localHour,
    tasks: tasks.flatMap((task) => {
      if (typeof task.id !== "string" || typeof task.title !== "string") return [];
      const dueOn = typeof task.due_on === "string" ? task.due_on : typeof task.due_at === "string" ? calendarDateInTimeZone(new Date(task.due_at), timezone) : null;
      return [{
        id: task.id,
        title: task.title,
        status: String(task.status ?? "todo"),
        priority: normalizePriority(task.priority),
        lifeArea: normalizeLifeArea(task.life_area),
        projectId: typeof task.project_id === "string" ? task.project_id : null,
        plannedOn: typeof task.planned_on === "string" ? task.planned_on : null,
        dueOn,
        estimateMinutes: numberOrNull(task.estimate_minutes),
        focusProject: typeof task.project_id === "string" && focusProjectIds.has(task.project_id),
      }];
    }),
    routines: routineSummary.items.map((item) => ({
      id: item.id,
      routineType: item.routineType,
      name: item.name,
      completed: item.completed,
      lifeArea: item.lifeArea ?? null,
      durationMinutes: item.durationMinutes ?? null,
      timeContext: item.timeContext ?? null,
      periodLabel: item.periodLabel ?? null,
      scheduleReason: item.scheduleReason,
    })),
  });

  const critical = alerts.filter((alert) => alert.severity === "critical");

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: timezone }).format(now)}</p>
        <h1 className="text-3xl font-bold tracking-tight">Bonjour{profileResult.data?.display_name ? `, ${profileResult.data.display_name}` : ""}</h1>
        <p className="max-w-3xl text-sm text-slate-600">Un seul écran pour exécuter. Les analyses et les décisions vivent ailleurs, afin que la journée reste rapide.</p>
      </header>

      {critical.length ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 shrink-0 text-red-700" /><div><h2 className="font-bold text-red-950">{critical.length} alerte(s) critique(s)</h2><p className="mt-1 text-sm text-red-800">{critical[0]?.title} — {critical[0]?.body}</p><Link className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-800" href="/app/alerts">Traiter <ArrowRight size={15} /></Link></div></div>
        </section>
      ) : null}

      <TodayManager today={today} tomorrow={tomorrow} nextWeek={nextWeek} top={dailyPlan.top} remaining={dailyPlan.remaining} completedRoutines={dailyPlan.completedRoutines} totalRoutines={routineSummary.items.length} localHour={localHour} />

      <section className="grid gap-6 xl:grid-cols-2">
        <UpcomingPanel today={today} items={upcoming} />
        <GoalsPanel goals={goals} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/app/progression" className="card group"><span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Après l’exécution</span><strong className="mt-2 block">Voir ma progression</strong><span className="mt-1 block text-sm text-slate-600">Historique, régularité et évolution dans le temps.</span></Link>
        <Link href="/app/insights" className="card group"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500"><Lightbulb size={14} />Analyse</span><strong className="mt-2 block">Voir mes points d’amélioration</strong><span className="mt-1 block text-sm text-slate-600">Reports répétés, routines fragiles et projets qui stagnent.</span></Link>
        <Link href="/app/review" className="card group"><span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Décision</span><strong className="mt-2 block">Faire ma revue</strong><span className="mt-1 block text-sm text-slate-600">LifeOS prépare les faits ; tu décides quoi modifier.</span></Link>
      </section>
    </div>
  );
}

function buildRoutineSummary(input: { today: string; windowStart: string; habits: Row[]; religionRoutines: Row[]; habitLogs: Row[]; religionLogs: Row[] }) {
  const completedByKey = new Map<string, number>();
  for (const log of input.habitLogs) if (typeof log.habit_id === "string" && typeof log.occurred_on === "string") completedByKey.set(`habit:${log.habit_id}:${log.occurred_on}`, numberOrNull(log.count) ?? 0);
  for (const log of input.religionLogs) if (typeof log.routine_id === "string" && typeof log.occurred_on === "string") completedByKey.set(`religion:${log.routine_id}:${log.occurred_on}`, numberOrNull(log.count) ?? 0);
  const normalized = [
    ...input.habits.map((row) => normalizeRoutine(row, "habit")),
    ...input.religionRoutines.map((row) => normalizeRoutine(row, "religion")),
  ].filter((value): value is NonNullable<ReturnType<typeof normalizeRoutine>> => value !== null);

  const yesterday = addCalendarDays(input.today, -1);
  let missedLast7 = 0;
  for (const routine of normalized) {
    const completedDates = positiveCompletionDates(completedByKey, routine.item.routineType, routine.item.id);
    for (const window of scheduledRoutineWindows(routine.schedule, input.windowStart, yesterday)) {
      if (window.endsOn > yesterday) continue;
      if (!completedDates.some((date) => date >= window.startsOn && date <= window.endsOn)) missedLast7 += 1;
    }
  }

  const items = normalized.filter((routine) => isRoutineActionableOn(routine.schedule, input.today)).map((routine) => {
    const completionWindow = routineCompletionWindow(routine.schedule, input.today);
    const completedEntry = [...completedByKey.entries()].find(([key, count]) => {
      const date = key.slice(-10);
      return key.startsWith(`${routine.item.routineType}:${routine.item.id}:`) && count > 0 && completionWindow !== null && date >= completionWindow.startsOn && date <= completionWindow.endsOn;
    });
    return {
      ...routine.item,
      completed: (completedEntry?.[1] ?? 0) > 0,
      completedOn: completedEntry?.[0].slice(-10) ?? null,
      completedCount: completedEntry?.[1] ?? 0,
      periodLabel: completionWindow?.label ?? null,
      nextOccurrence: nextRoutineOccurrence(routine.schedule, input.today, false),
      scheduleReason: routineReasonForDate(routine.schedule, input.today),
    };
  });
  return { items, missedLast7 };
}

function normalizeRoutine(row: Row, routineType: "habit" | "religion") {
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  const schedule: RoutineSchedule = {
    frequency: String(routineType === "habit" ? row.frequency ?? "" : row.target_frequency ?? ""),
    active: row.active !== false && row.status === "active",
    scheduleWeekday: numberOrNull(row.schedule_weekday),
    scheduleDayOfMonth: numberOrNull(row.schedule_day_of_month),
    scheduleWindowWeekdays: numberArray(row.schedule_window_weekdays),
    scheduleMonthWeeks: numberArray(row.schedule_month_weeks),
    startOn: typeof row.start_on === "string" ? row.start_on : null,
    endOn: typeof row.end_on === "string" ? row.end_on : null,
    pausedAt: typeof row.paused_at === "string" ? row.paused_at : null,
    archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
  };
  const rawConfiguration = row.configuration_status;
  const item: RoutineTodayItem = {
    id: row.id,
    routineType,
    name: row.name,
    completed: false,
    targetCount: numberOrNull(row.target_count),
    targetUnit: typeof row.target_unit === "string" ? row.target_unit : null,
    durationMinutes: numberOrNull(row.duration_minutes),
    lifeArea: routineType === "religion" ? "religion" : normalizeLifeArea(row.life_area),
    timeContext: typeof row.time_context === "string" ? row.time_context : null,
    configurationStatus: rawConfiguration === "ready" || rawConfiguration === "to_complete" || rawConfiguration === "to_validate" || rawConfiguration === "to_configure" ? rawConfiguration : null,
  };
  return { schedule, item };
}

function positiveCompletionDates(completedByKey: ReadonlyMap<string, number>, routineType: "habit" | "religion", routineId: string): string[] {
  const prefix = `${routineType}:${routineId}:`;
  return [...completedByKey.entries()]
    .filter(([key, count]) => key.startsWith(prefix) && count > 0)
    .map(([key]) => key.slice(-10));
}

function normalizePriority(value: unknown): DailyTaskPriority { return value === "critical" || value === "high" || value === "medium" || value === "low" || value === "unset" ? value : "unset"; }
function normalizeLifeArea(value: unknown): "pro" | "perso" | "religion" | null { return value === "pro" || value === "perso" || value === "religion" ? value : null; }
function numberOrNull(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function numberArray(value: unknown): number[] { return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : []; }
function localHourInTimeZone(value: Date, timeZone: string): number { return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(value)); }
