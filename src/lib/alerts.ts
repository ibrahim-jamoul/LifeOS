import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyDueStatus, getIsoWeek } from "@/lib/domain/dates";

export type AlertSeverity = "info" | "warning" | "critical";

export type LifeOsAlert = {
  alertCode: string;
  dedupeKey: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  sourceType: string;
  sourceId: string | null;
  dueAt: string | null;
  href: string;
};

type GenericRow = Record<string, unknown>;

const DAY = 86_400_000;

export async function getDerivedAlerts(supabase: SupabaseClient, userId: string, now = new Date()): Promise<LifeOsAlert[]> {
  const [profileResult, tasksResult, goalsResult, projectsResult, kpisResult, entriesResult, decisionsResult, documentsResult, quranResult, reviewsResult, remindersResult, lifecycleResult] = await Promise.all([
    supabase.from("profiles").select("timezone,weekly_review_weekday").eq("id", userId).maybeSingle(),
    supabase.from("tasks").select("id,title,status,due_at").eq("user_id", userId).not("status", "in", "(done,cancelled)").not("due_at", "is", null).limit(500),
    supabase.from("goals").select("id,title,status,target_date").eq("user_id", userId).in("status", ["active", "at_risk"]).not("target_date", "is", null).limit(200),
    supabase.from("projects").select("id,title,status,next_action,last_activity_at,updated_at,target_date").eq("user_id", userId).in("status", ["focus", "active", "blocked"]).limit(200),
    supabase.from("kpis").select("id,name,cadence,active").eq("user_id", userId).eq("active", true).limit(200),
    supabase.from("kpi_entries").select("kpi_id,measured_at").eq("user_id", userId).order("measured_at", { ascending: false }).limit(2_000),
    supabase.from("decisions").select("id,title,review_date,actual_outcome").eq("user_id", userId).not("review_date", "is", null).is("actual_outcome", null).limit(200),
    supabase.from("documents").select("id,title,expires_on").eq("user_id", userId).not("expires_on", "is", null).limit(500),
    supabase.from("quran_items").select("id,surah_number,surah_name,next_revision_at,status").eq("user_id", userId).not("next_revision_at", "is", null).neq("status", "paused").limit(500),
    supabase.from("weekly_reviews").select("week_start").eq("user_id", userId).order("week_start", { ascending: false }).limit(4),
    supabase.from("reminders").select("id,title,source_type,source_id,remind_at,active").eq("user_id", userId).eq("active", true).lte("remind_at", now.toISOString()).limit(200),
    supabase.from("notifications").select("dedupe_key,dismissed_at,snoozed_until").eq("user_id", userId).limit(5_000),
  ]);

  const queryErrors = [tasksResult.error, goalsResult.error, projectsResult.error, kpisResult.error, entriesResult.error, decisionsResult.error, documentsResult.error, quranResult.error, reviewsResult.error, remindersResult.error, lifecycleResult.error].filter(Boolean);
  if (queryErrors.length) {
    console.error("LifeOS derived alert query failed", { codes: queryErrors.map((error) => error?.code) });
    throw new Error("Impossible de calculer les alertes.");
  }

  const profile = profileResult.data as GenericRow | null;
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const reviewWeekday = typeof profile?.weekly_review_weekday === "number" ? profile.weekly_review_weekday : 0;
  const alerts: LifeOsAlert[] = [];

  for (const task of (tasksResult.data ?? []) as GenericRow[]) {
    if (typeof task.due_at !== "string" || typeof task.id !== "string") continue;
    const state = classifyDueStatus({ dueAt: task.due_at, status: String(task.status ?? ""), now, dueSoonWithinMs: DAY, timeZone: timezone });
    if (state !== "overdue" && state !== "due_soon") continue;
    alerts.push(makeAlert({
      code: state === "overdue" ? "TASK_OVERDUE" : "TASK_DUE_SOON",
      sourceType: "task", sourceId: task.id, window: state,
      title: state === "overdue" ? "Tâche en retard" : "Tâche bientôt due",
      body: stringValue(task.title, "Tâche sans titre"), severity: state === "overdue" ? "warning" : "info", dueAt: task.due_at, href: "/app/goals/tasks",
    }));
  }

  for (const goal of (goalsResult.data ?? []) as GenericRow[]) {
    if (typeof goal.target_date !== "string" || typeof goal.id !== "string") continue;
    const state = classifyDueStatus({ dueAt: goal.target_date, status: String(goal.status ?? ""), now, dueSoonWithinMs: 7 * DAY, timeZone: timezone });
    if (state !== "overdue" && state !== "due_soon") continue;
    alerts.push(makeAlert({
      code: state === "overdue" ? "GOAL_OVERDUE" : "GOAL_DUE_SOON", sourceType: "goal", sourceId: goal.id, window: state,
      title: state === "overdue" ? "Objectif en retard" : "Échéance d’objectif proche", body: stringValue(goal.title, "Objectif sans titre"),
      severity: state === "overdue" ? "critical" : "warning", dueAt: goal.target_date, href: "/app/goals/objectives",
    }));
  }

  for (const project of (projectsResult.data ?? []) as GenericRow[]) {
    if (typeof project.id !== "string") continue;
    const title = stringValue(project.title, "Projet sans titre");
    if (typeof project.next_action !== "string" || !project.next_action.trim()) {
      alerts.push(makeAlert({ code: "PROJECT_NO_NEXT_ACTION", sourceType: "project", sourceId: project.id, window: "current", title: "Projet sans prochaine action", body: title, severity: "warning", dueAt: null, href: "/app/goals/projects" }));
    }
    const activityValue = typeof project.last_activity_at === "string" ? project.last_activity_at : project.updated_at;
    if (typeof activityValue === "string" && now.getTime() - new Date(activityValue).getTime() >= 14 * DAY) {
      alerts.push(makeAlert({ code: "PROJECT_STALE", sourceType: "project", sourceId: project.id, window: activityValue.slice(0, 10), title: "Projet sans activité récente", body: title, severity: "warning", dueAt: null, href: "/app/goals/projects" }));
    }
  }

  const latestKpiEntry = new Map<string, string>();
  for (const entry of (entriesResult.data ?? []) as GenericRow[]) {
    if (typeof entry.kpi_id === "string" && typeof entry.measured_at === "string" && !latestKpiEntry.has(entry.kpi_id)) latestKpiEntry.set(entry.kpi_id, entry.measured_at);
  }
  const staleDays: Readonly<Record<string, number>> = { daily: 2, weekly: 8, monthly: 35, quarterly: 100, adhoc: Number.POSITIVE_INFINITY };
  for (const kpi of (kpisResult.data ?? []) as GenericRow[]) {
    if (typeof kpi.id !== "string") continue;
    const latest = latestKpiEntry.get(kpi.id);
    const cadence = typeof kpi.cadence === "string" ? kpi.cadence : "weekly";
    const threshold = staleDays[cadence] ?? 8;
    if (!latest || now.getTime() - new Date(latest).getTime() >= threshold * DAY) {
      alerts.push(makeAlert({ code: "KPI_STALE", sourceType: "kpi", sourceId: kpi.id, window: latest?.slice(0, 10) ?? "never", title: "KPI à mettre à jour", body: stringValue(kpi.name, "KPI sans nom"), severity: "warning", dueAt: latest ?? null, href: "/app/goals/kpis" }));
    }
  }

  for (const decision of (decisionsResult.data ?? []) as GenericRow[]) {
    if (typeof decision.id !== "string" || typeof decision.review_date !== "string") continue;
    const state = classifyDueStatus({ dueAt: decision.review_date, now, dueSoonWithinMs: 0, timeZone: timezone });
    if (state !== "overdue" && state !== "due_soon") continue;
    alerts.push(makeAlert({ code: "DECISION_REVIEW_DUE", sourceType: "decision", sourceId: decision.id, window: decision.review_date, title: "Décision à réévaluer", body: stringValue(decision.title, "Décision sans titre"), severity: "warning", dueAt: decision.review_date, href: "/app/goals/decisions" }));
  }

  for (const document of (documentsResult.data ?? []) as GenericRow[]) {
    if (typeof document.id !== "string" || typeof document.expires_on !== "string") continue;
    const days = calendarDayDifference(document.expires_on, now, timezone);
    if (days > 90) continue;
    const window = days <= 7 ? "7d" : days <= 30 ? "30d" : "90d";
    alerts.push(makeAlert({ code: "DOCUMENT_EXPIRY", sourceType: "document", sourceId: document.id, window: `${window}:${document.expires_on}`, title: days < 0 ? "Document expiré" : `Document à renouveler sous ${Math.max(0, days)} jour${days > 1 ? "s" : ""}`, body: stringValue(document.title, "Document sans titre"), severity: days <= 7 ? "critical" : days <= 30 ? "warning" : "info", dueAt: document.expires_on, href: "/app/documents" }));
  }

  for (const item of (quranResult.data ?? []) as GenericRow[]) {
    if (typeof item.id !== "string" || typeof item.next_revision_at !== "string") continue;
    if (new Date(item.next_revision_at).getTime() > now.getTime()) continue;
    const label = typeof item.surah_name === "string" && item.surah_name ? item.surah_name : `Sourate ${String(item.surah_number ?? "")}`;
    alerts.push(makeAlert({ code: "QURAN_REVISION_DUE", sourceType: "quran_item", sourceId: item.id, window: item.next_revision_at.slice(0, 10), title: "Révision Coran due", body: label, severity: "info", dueAt: item.next_revision_at, href: "/app/quran/revision" }));
  }

  const currentWeek = getIsoWeek(now, timezone);
  const hasCurrentReview = ((reviewsResult.data ?? []) as GenericRow[]).some((review) => review.week_start === currentWeek.startsOn);
  const todayWeekPosition = mondayFirstWeekday(now, timezone);
  const reviewWeekPosition = reviewWeekday === 0 ? 6 : reviewWeekday - 1;
  if (!hasCurrentReview && todayWeekPosition >= reviewWeekPosition) {
    alerts.push(makeAlert({ code: "WEEKLY_REVIEW_MISSING", sourceType: "weekly_review", sourceId: null, window: currentWeek.key, title: "Weekly review à compléter", body: `Semaine ${currentWeek.week}`, severity: "warning", dueAt: currentWeek.endsOn, href: "/app/goals/reviews" }));
  }

  for (const reminder of (remindersResult.data ?? []) as GenericRow[]) {
    if (typeof reminder.id !== "string") continue;
    alerts.push(makeAlert({ code: "REMINDER", sourceType: stringValue(reminder.source_type, "reminder"), sourceId: typeof reminder.source_id === "string" ? reminder.source_id : reminder.id, window: stringValue(reminder.remind_at, "due"), title: "Rappel", body: stringValue(reminder.title, "Rappel personnel"), severity: "info", dueAt: typeof reminder.remind_at === "string" ? reminder.remind_at : null, href: "/app/alerts" }));
  }

  const suppressedKeys = new Set(((lifecycleResult.data ?? []) as GenericRow[])
    .filter((row) => Boolean(row.dismissed_at) || (typeof row.snoozed_until === "string" && new Date(row.snoozed_until).getTime() > now.getTime()))
    .map((row) => row.dedupe_key)
    .filter((key): key is string => typeof key === "string"));
  return alerts
    .filter((alert) => !suppressedKeys.has(alert.dedupeKey))
    .sort((left, right) => severityRank(right.severity) - severityRank(left.severity) || String(left.dueAt).localeCompare(String(right.dueAt)));
}

export async function materializeAlerts(supabase: SupabaseClient, userId: string, now = new Date()): Promise<{ generated: number }> {
  const alerts = await getDerivedAlerts(supabase, userId, now);
  if (alerts.length === 0) return { generated: 0 };
  const rows = alerts.map((alert) => ({
    user_id: userId, source_type: alert.sourceType, source_id: alert.sourceId, alert_code: alert.alertCode,
    dedupe_key: alert.dedupeKey, title: alert.title, body: alert.body, severity: alert.severity, due_at: alert.dueAt,
  }));
  const { error } = await supabase.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: false });
  if (error) {
    console.error("LifeOS alert materialization failed", { code: error.code });
    throw new Error("Impossible de matérialiser les alertes.");
  }
  return { generated: alerts.length };
}

function makeAlert(input: { code: string; sourceType: string; sourceId: string | null; window: string; title: string; body: string; severity: AlertSeverity; dueAt: string | null; href: string }): LifeOsAlert {
  return { alertCode: input.code, dedupeKey: `${input.code}:${input.sourceId ?? "user"}:${input.window}`, title: input.title, body: input.body, severity: input.severity, sourceType: input.sourceType, sourceId: input.sourceId, dueAt: input.dueAt, href: input.href };
}

function stringValue(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value : fallback; }
function severityRank(value: AlertSeverity): number { return value === "critical" ? 3 : value === "warning" ? 2 : 1; }

function mondayFirstWeekday(now: Date, timeZone: string): number {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(day);
}

function calendarDayDifference(dateOnly: string, now: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const today = formatter.format(now);
  const targetParts = dateOnly.split("-").map(Number);
  const todayParts = today.split("-").map(Number);
  const target = Date.UTC(targetParts[0] ?? 0, (targetParts[1] ?? 1) - 1, targetParts[2] ?? 1);
  const current = Date.UTC(todayParts[0] ?? 0, (todayParts[1] ?? 1) - 1, todayParts[2] ?? 1);
  return Math.floor((target - current) / DAY);
}
