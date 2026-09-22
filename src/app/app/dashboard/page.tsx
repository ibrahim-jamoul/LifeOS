import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, CalendarDays, CheckCircle2, CircleAlert, FolderKanban, Target } from "lucide-react";
import { TodayManager } from "@/components/today-manager";
import type { RoutineTodayItem } from "@/components/routines-today";
import { getDerivedAlerts } from "@/lib/alerts";
import { buildDailyPlan, type DailyTaskPriority } from "@/lib/domain/daily-plan";
import { classifyDueStatus } from "@/lib/domain/dates";
import { classifyKpiValue, type KpiClassification, type KpiTargetType } from "@/lib/domain/kpis";
import { calculateProjectScore } from "@/lib/domain/projects";
import { addCalendarDays, calendarDateInTimeZone, isRoutineActionableOn, nextRoutineOccurrence, routineCompletionWindow, scheduledRoutineDates } from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aujourd’hui" };
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const now = new Date();
  const profileResult = await supabase
    .from("profiles")
    .select("display_name,timezone")
    .eq("id", userId)
    .maybeSingle();
  const timezone = typeof profileResult.data?.timezone === "string" ? profileResult.data.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(now, timezone);
  const tomorrow = addCalendarDays(today, 1);
  const nextWeek = addCalendarDays(today, 7);
  const localHour = localHourInTimeZone(now, timezone);
  const routineWindowStart = [addCalendarDays(today, -13), `${today.slice(0, 7)}-01`].sort()[0]!;

  const [
    tasksResult,
    goalsResult,
    projectsResult,
    kpisResult,
    entriesResult,
    activityResult,
    habitsResult,
    religionRoutinesResult,
    habitLogsResult,
    religionLogsResult,
    alerts,
  ] = await Promise.all([
    supabase.from("tasks").select("id,title,status,priority,life_area,planned_on,due_on,due_at,project_id,estimate_minutes,created_at").eq("user_id", userId).not("status", "in", "(done,cancelled)").limit(150),
    supabase.from("goals").select("id,title,status,priority,target_date,progress_percent").eq("user_id", userId).in("status", ["active", "at_risk"]).order("priority", { ascending: false }).limit(20),
    supabase.from("projects").select("id,title,status,priority,target_date,next_action,next_milestone,progress_percent,impact,urgency,confidence,effort,last_activity_at,updated_at").eq("user_id", userId).in("status", ["focus", "active", "blocked"]).order("target_date", { ascending: true, nullsFirst: false }).limit(30),
    supabase.from("kpis").select("id,name,unit,target_type,target_value,target_min,target_max,cadence,goal_id").eq("user_id", userId).eq("active", true).limit(40),
    supabase.from("kpi_entries").select("kpi_id,value,measured_at").eq("user_id", userId).order("measured_at", { ascending: false }).limit(1_000),
    supabase.from("activity_log").select("id,entity_type,action,summary,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
    supabase.from("habits").select("id,name,life_area,frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,time_context,configuration_status,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).eq("active", true).eq("status", "active").limit(200),
    supabase.from("religion_routines").select("id,name,target_frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,time_context,configuration_status,start_on,end_on,active,status,paused_at,archived_at").eq("user_id", userId).eq("active", true).eq("status", "active").limit(200),
    supabase.from("habit_logs").select("habit_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", routineWindowStart).lte("occurred_on", today).limit(2_000),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", routineWindowStart).lte("occurred_on", today).limit(2_000),
    getDerivedAlerts(supabase, userId, now).catch(() => []),
  ]);

  const tasks = (tasksResult.data ?? []) as Row[];
  const goals = (goalsResult.data ?? []) as Row[];
  const projects = (projectsResult.data ?? []) as Row[];
  const kpis = (kpisResult.data ?? []) as Row[];
  const kpiEntries = (entriesResult.data ?? []) as Row[];
  const focusProjects = projects.filter((project) => project.status === "focus");
  const focusProjectIds = new Set(focusProjects.map((project) => String(project.id)));
  const latestEntries = new Map<string, Row>();
  for (const entry of kpiEntries) {
    if (typeof entry.kpi_id === "string" && !latestEntries.has(entry.kpi_id)) latestEntries.set(entry.kpi_id, entry);
  }

  const routineSummary = buildRoutineSummary({
    today,
    windowStart: addCalendarDays(today, -6),
    habits: (habitsResult.data ?? []) as Row[],
    religionRoutines: (religionRoutinesResult.data ?? []) as Row[],
    habitLogs: (habitLogsResult.data ?? []) as Row[],
    religionLogs: (religionLogsResult.data ?? []) as Row[],
  });

  const dailyPlan = buildDailyPlan({
    today,
    localHour,
    tasks: tasks.flatMap((task) => {
      if (typeof task.id !== "string" || typeof task.title !== "string") return [];
      const dueOn = typeof task.due_on === "string"
        ? task.due_on
        : typeof task.due_at === "string"
          ? calendarDate(new Date(task.due_at), timezone)
          : null;
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
    })),
  });

  const overdueTasks = tasks.filter((task) => {
    if (typeof task.due_on === "string") return task.due_on < today;
    return classifyDueStatus({ dueAt: typeof task.due_at === "string" ? task.due_at : null, status: String(task.status ?? ""), now, timeZone: timezone }) === "overdue";
  });

  return (
    <div className="grid gap-7">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: timezone }).format(now)}</p>
        <h1 className="text-3xl font-bold tracking-tight">Bonjour{profileResult.data?.display_name ? `, ${profileResult.data.display_name}` : ""}</h1>
        <p className="text-sm text-slate-600">Tu exécutes. LifeOS organise, priorise et garde l’historique.</p>
      </header>

      <TodayManager
        today={today}
        tomorrow={tomorrow}
        nextWeek={nextWeek}
        top={dailyPlan.top}
        remaining={dailyPlan.remaining}
        completedRoutines={dailyPlan.completedRoutines}
        totalRoutines={routineSummary.items.length}
        localHour={localHour}
      />

      {alerts.some((alert) => alert.severity === "critical") ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 shrink-0 text-red-700" />
            <div>
              <h2 className="font-bold text-red-950">{alerts.filter((alert) => alert.severity === "critical").length} alerte(s) critique(s)</h2>
              <p className="mt-1 text-sm text-red-800">{alerts.find((alert) => alert.severity === "critical")?.title} — {alerts.find((alert) => alert.severity === "critical")?.body}</p>
              <Link className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-800" href="/app/alerts">Traiter les alertes <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="À exécuter" value={dailyPlan.all.length} caption="actions restantes" icon={<CheckCircle2 />} tone="emerald" href="#" />
        <Metric title="En retard" value={overdueTasks.length} caption="échéances réelles" icon={<AlertTriangle />} tone={overdueTasks.length ? "red" : "slate"} href="/app/goals/tasks?view=overdue" />
        <Metric title="Alertes" value={alerts.length} caption="exceptions" icon={<CircleAlert />} tone={alerts.length ? "amber" : "slate"} href="/app/alerts" />
        <Metric title="FOCUS" value={focusProjects.length} caption="projets actifs" icon={<FolderKanban />} tone={focusProjects.length > 3 ? "amber" : "blue"} href="/app/goals/projects" />
      </section>

      {focusProjects.length > 3 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          <div><strong>Focus surchargé : {focusProjects.length} projets.</strong><p className="mt-1 text-sm">LifeOS signale la surcharge mais ne change pas tes priorités sans validation.</p></div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <DashboardSection title="Exceptions à traiter" href="/app/alerts" icon={<CircleAlert size={19} />}>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 py-6 text-sm text-emerald-800"><CheckCircle2 size={19} />Aucune exception active.</div>
          ) : (
            <ul className="grid gap-2 py-2">
              {alerts.slice(0, 6).map((alert) => (
                <li key={alert.dedupeKey}>
                  <Link href={alert.href} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${alert.severity === "critical" ? "bg-red-600" : alert.severity === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
                    <span><strong className="block text-sm">{alert.title}</strong><span className="text-xs text-slate-600">{alert.body}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Projets FOCUS" href="/app/goals/projects" icon={<FolderKanban size={19} />}>
          {focusProjects.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">Aucun projet n’est actuellement en FOCUS.</p>
          ) : (
            <div className="grid gap-3 pt-3 md:grid-cols-2">{focusProjects.slice(0, 4).map((project) => <ProjectSnapshot key={String(project.id)} project={project} now={now} timezone={timezone} />)}</div>
          )}
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection title="Santé des objectifs" href="/app/goals/objectives" icon={<Target size={19} />}>
          {goals.length === 0 ? <p className="py-5 text-sm text-slate-500">Aucun objectif actif.</p> : (
            <div className="grid gap-3 pt-3">{goals.slice(0, 5).map((goal) => <GoalSnapshot key={String(goal.id)} goal={goal} now={now} timezone={timezone} />)}</div>
          )}
        </DashboardSection>

        <DashboardSection title="Signaux KPI" href="/app/goals/kpis" icon={<BarChart3 size={19} />}>
          {kpis.length === 0 ? <p className="py-5 text-sm text-slate-500">Aucun KPI actif; aucune valeur n’est inventée.</p> : (
            <div className="grid gap-3 pt-3">{kpis.slice(0, 5).map((kpi) => <KpiSnapshot key={String(kpi.id)} kpi={kpi} entry={latestEntries.get(String(kpi.id))} />)}</div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title="Revue et historique" href="/app/goals/reviews" icon={<CalendarDays size={19} />}>
        <div className="grid gap-4 pt-3 lg:grid-cols-[.75fr_1.25fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cette semaine</p>
            <p className="mt-2 text-sm text-slate-700">{routineSummary.missedLast7 === 0 ? "Aucune occurrence planifiée manquée sur les 7 derniers jours." : `${routineSummary.missedLast7} occurrence(s) planifiée(s) non validée(s) sur les 7 derniers jours.`}</p>
            {routineSummary.configurationNeeded > 0 ? <p className="mt-2 text-xs text-amber-800">{routineSummary.configurationNeeded} routine(s) restent à configurer.</p> : null}
            <Link className="button-secondary mt-4" href="/app/goals/reviews">Ouvrir la revue <ArrowRight size={15} /></Link>
          </div>
          <div>
            {(activityResult.data ?? []).length === 0 ? <p className="py-5 text-sm text-slate-500">L’historique apparaîtra après tes premières actions.</p> : (
              <ol className="grid gap-2">{((activityResult.data ?? []) as Row[]).slice(0, 6).map((activity) => (
                <li key={String(activity.id)} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span><strong>{activityLabel(String(activity.entity_type))}</strong> · {actionLabel(String(activity.action))}{activity.summary ? ` — ${String(activity.summary)}` : ""}</span>
                  <time className="shrink-0 text-xs text-slate-500">{typeof activity.created_at === "string" ? formatDate(activity.created_at, timezone) : ""}</time>
                </li>
              ))}</ol>
            )}
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}

function buildRoutineSummary(input: { today: string; windowStart: string; habits: Row[]; religionRoutines: Row[]; habitLogs: Row[]; religionLogs: Row[] }): { items: RoutineTodayItem[]; missedLast7: number; configurationNeeded: number } {
  const completedByKey = new Map<string, number>();
  for (const log of input.habitLogs) {
    if (typeof log.habit_id === "string" && typeof log.occurred_on === "string") completedByKey.set(`habit:${log.habit_id}:${log.occurred_on}`, Number(log.count ?? 0));
  }
  for (const log of input.religionLogs) {
    if (typeof log.routine_id === "string" && typeof log.occurred_on === "string") completedByKey.set(`religion:${log.routine_id}:${log.occurred_on}`, Number(log.count ?? 0));
  }

  const normalized = [
    ...input.habits.map((row) => normalizeRoutine(row, "habit")),
    ...input.religionRoutines.map((row) => normalizeRoutine(row, "religion")),
  ].filter((routine): routine is NonNullable<ReturnType<typeof normalizeRoutine>> => routine !== null);

  const yesterday = addCalendarDays(input.today, -1);
  let missedLast7 = 0;
  for (const routine of normalized) {
    for (const date of scheduledRoutineDates(routine.schedule, input.windowStart, yesterday)) {
      if ((completedByKey.get(`${routine.item.routineType}:${routine.item.id}:${date}`) ?? 0) <= 0) missedLast7 += 1;
    }
  }

  const items = normalized
    .filter((routine) => isRoutineActionableOn(routine.schedule, input.today))
    .map((routine) => {
      const completionWindow = routineCompletionWindow(routine.schedule, input.today);
      const completedEntry = [...completedByKey.entries()].find(([key, count]) => {
        const date = key.slice(-10);
        return key.startsWith(`${routine.item.routineType}:${routine.item.id}:`)
          && count > 0
          && completionWindow !== null
          && date >= completionWindow.startsOn
          && date <= completionWindow.endsOn;
      });
      const completedOn = completedEntry?.[0].slice(-10) ?? null;
      const completedCount = completedEntry?.[1] ?? 0;
      return {
        ...routine.item,
        completed: completedCount > 0,
        completedOn,
        completedCount,
        periodLabel: completionWindow?.label ?? null,
        nextOccurrence: nextRoutineOccurrence(routine.schedule, input.today, false),
      };
    });

  const configurationNeeded = normalized.filter((routine) => routine.item.configurationStatus && routine.item.configurationStatus !== "ready").length;
  return { items, missedLast7, configurationNeeded };
}

function normalizeRoutine(row: Row, routineType: "habit" | "religion") {
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  const frequency = String(routineType === "habit" ? row.frequency ?? "" : row.target_frequency ?? "");
  const schedule = {
    frequency,
    active: row.active !== false && row.status === "active",
    scheduleWeekday: numberOrNull(row.schedule_weekday),
    scheduleDayOfMonth: numberOrNull(row.schedule_day_of_month),
    startOn: typeof row.start_on === "string" ? row.start_on : null,
    endOn: typeof row.end_on === "string" ? row.end_on : null,
    pausedAt: typeof row.paused_at === "string" ? row.paused_at : null,
    archivedAt: typeof row.archived_at === "string" ? row.archived_at : null,
  };
  const rawLifeArea = routineType === "religion" ? "religion" : row.life_area;
  const lifeArea = normalizeLifeArea(rawLifeArea);
  const rawConfiguration = row.configuration_status;
  const configurationStatus = rawConfiguration === "ready" || rawConfiguration === "to_complete" || rawConfiguration === "to_validate" || rawConfiguration === "to_configure" ? rawConfiguration : null;
  const item: RoutineTodayItem = {
    id: row.id,
    routineType,
    name: row.name,
    completed: false,
    targetCount: numberOrNull(row.target_count),
    targetUnit: typeof row.target_unit === "string" ? row.target_unit : null,
    durationMinutes: numberOrNull(row.duration_minutes),
    lifeArea,
    timeContext: typeof row.time_context === "string" ? row.time_context : null,
    configurationStatus,
  };
  return { schedule, item };
}

function Metric({ title, value, caption, icon, tone, href }: { title: string; value: number; caption: string; icon: React.ReactNode; tone: "emerald" | "red" | "blue" | "amber" | "slate"; href: string }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-800", red: "bg-red-50 text-red-800", blue: "bg-blue-50 text-blue-800", amber: "bg-amber-50 text-amber-900", slate: "bg-slate-100 text-slate-700" };
  const content = <><span className={`grid size-12 place-items-center rounded-2xl ${tones[tone]}`}>{icon}</span><span><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">{title}</span><strong className="text-2xl">{value}</strong><span className="ml-2 text-xs text-slate-500">{caption}</span></span></>;
  if (href === "#") return <div className="card flex items-center gap-4">{content}</div>;
  return <Link href={href} className="card group flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-md">{content}</Link>;
}

function DashboardSection({ title, href, icon, children }: { title: string; href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="card"><header className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold">{icon}{title}</h2><Link href={href} className="flex items-center gap-1 text-xs font-bold text-emerald-800">Tout voir <ArrowRight size={14} /></Link></header>{children}</section>;
}

function ProjectSnapshot({ project, now, timezone }: { project: Row; now: Date; timezone: string }) {
  const status = project.status === "blocked" || classifyDueStatus({ dueAt: typeof project.target_date === "string" ? project.target_date : null, status: String(project.status), now, timeZone: timezone }) === "overdue" ? "red"
    : !project.next_action || (typeof (project.last_activity_at ?? project.updated_at) === "string" && now.getTime() - new Date(String(project.last_activity_at ?? project.updated_at)).getTime() > 14 * 86_400_000) ? "amber" : "green";
  const score = calculateProjectScore({ impact: numberOrNull(project.impact), urgency: numberOrNull(project.urgency), confidence: numberOrNull(project.confidence), effort: numberOrNull(project.effort) });
  return <article className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-2"><h3 className="font-bold">{String(project.title)}</h3><span className={`size-2.5 rounded-full ${status === "red" ? "bg-red-600" : status === "amber" ? "bg-amber-500" : "bg-emerald-600"}`} title={`Santé ${status}`} /></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-emerald-700" style={{ width: `${Number(project.progress_percent ?? 0)}%` }} /></div><p className="mt-3 text-xs text-slate-600">Prochaine action : {project.next_action ? String(project.next_action) : "non définie"}</p>{score !== null ? <p className="mt-1 text-xs text-slate-500">Score indicatif : {score}</p> : null}</article>;
}

function GoalSnapshot({ goal, now, timezone }: { goal: Row; now: Date; timezone: string }) {
  const due = classifyDueStatus({ dueAt: typeof goal.target_date === "string" ? goal.target_date : null, status: String(goal.status), now, dueSoonWithinMs: 7 * 86_400_000, timeZone: timezone });
  const health = due === "overdue" || goal.status === "at_risk" ? "À risque" : due === "due_soon" ? "À surveiller" : "En cours";
  return <article className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{String(goal.title)}</strong><span className={`rounded-full px-2 py-1 text-xs font-bold ${health === "À risque" ? "bg-red-100 text-red-800" : health === "À surveiller" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>{health}</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-700" style={{ width: `${Number(goal.progress_percent ?? 0)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{Number(goal.progress_percent ?? 0)} % · {typeof goal.target_date === "string" ? goal.target_date : "sans échéance"}</p></article>;
}

function KpiSnapshot({ kpi, entry }: { kpi: Row; entry?: Row }) {
  const targetType = String(kpi.target_type) as KpiTargetType;
  const target = numberOrNull(kpi.target_value);
  const min = numberOrNull(kpi.target_min);
  const max = numberOrNull(kpi.target_max);
  const reference = target ?? (min !== null && max !== null ? Math.abs(max - min) : null);
  const state = classifyKpiValue({ targetType, targetValue: target, targetMin: min, targetMax: max, watchMargin: reference === null ? 0 : Math.max(Math.abs(reference) * 0.1, 0.01) }, numberOrNull(entry?.value));
  return <article className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3"><div><strong className="text-sm">{String(kpi.name)}</strong><p className="mt-0.5 text-xs text-slate-500">{entry ? `${String(entry.value)} ${String(kpi.unit ?? "")}` : "Aucune mesure"}</p></div><KpiBadge state={state} /></article>;
}

function KpiBadge({ state }: { state: KpiClassification }) {
  const styles: Record<KpiClassification, string> = { on_track: "bg-emerald-100 text-emerald-800", watch: "bg-amber-100 text-amber-900", off_track: "bg-red-100 text-red-800", insufficient_data: "bg-slate-100 text-slate-700" };
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${styles[state]}`}>{state.replaceAll("_", " ")}</span>;
}

function normalizePriority(value: unknown): DailyTaskPriority {
  return value === "critical" || value === "high" || value === "medium" || value === "low" || value === "unset" ? value : "unset";
}

function normalizeLifeArea(value: unknown): "pro" | "perso" | "religion" | null {
  return value === "pro" || value === "perso" || value === "religion" ? value : null;
}

function numberOrNull(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function calendarDate(value: Date, timeZone: string): string { return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value); }
function formatDate(value: string, timeZone: string): string { return new Intl.DateTimeFormat("fr-FR", { timeZone, dateStyle: "medium", ...(value.length > 10 ? { timeStyle: "short" as const } : {}) }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value)); }
function localHourInTimeZone(value: Date, timeZone: string): number { return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(value)); }
function activityLabel(value: string): string { return value === "tasks" ? "Tâche" : value.replaceAll("_", " "); }
function actionLabel(value: string): string { return value === "completed" ? "terminée" : value === "rescheduled" ? "replanifiée" : value; }
