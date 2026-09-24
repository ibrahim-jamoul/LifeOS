import type { Metadata } from "next";
import { PlanningBoard, type PlanningItem } from "@/components/planning-board";
import type { GoalOption, LifeArea, ProjectOption } from "@/components/life-dashboard";
import { addCalendarDays, calendarDateInTimeZone } from "@/lib/domain/routines";
import { taskOccurrencesBetween } from "@/lib/domain/task-recurrence";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Planning" };
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;

export default async function PlanningPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);
  const tomorrow = addCalendarDays(today, 1);
  const weekEnd = addCalendarDays(today, 7);
  const horizon = addCalendarDays(today, 60);
  const [tasksR, goalsR, projectsR] = await Promise.all([
    supabase.from("tasks").select("id,title,status,life_area,planned_on,planned_time,estimate_minutes,goal_id,project_id,recurrence_rule,recurrence_until").eq("user_id", userId).not("status", "in", "(done,cancelled)").limit(1200),
    supabase.from("goals").select("id,title,life_area,status").eq("user_id", userId).not("status", "in", "(achieved,cancelled,archived)").limit(400),
    supabase.from("projects").select("id,title,life_area,status").eq("user_id", userId).not("status", "in", "(done,cancelled,archived)").limit(400),
  ]);
  const goals = (goalsR.data ?? []) as Row[];
  const projects = (projectsR.data ?? []) as Row[];
  const goalMap = new Map(goals.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" ? [[row.id, row.title] as const] : []));
  const projectMap = new Map(projects.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" ? [[row.id, row.title] as const] : []));
  const items: PlanningItem[] = [];
  for (const row of (tasksR.data ?? []) as Row[]) {
    if (typeof row.id !== "string" || typeof row.title !== "string") continue;
    const planned = typeof row.planned_on === "string" ? row.planned_on : null;
    const rule = typeof row.recurrence_rule === "string" ? row.recurrence_rule : null;
    const until = typeof row.recurrence_until === "string" ? row.recurrence_until : null;
    const dates = rule ? taskOccurrencesBetween({ plannedOn: planned, recurrenceRule: rule, recurrenceUntil: until, start: addCalendarDays(today, -30), end: horizon, limit: 120 }) : planned ? [planned] : [];
    if (!dates.length) items.push(makeItem(row, null, false));
    for (const date of dates) items.push(makeItem(row, date, Boolean(rule)));
  }
  const unplanned = items.filter((item) => !item.date);
  const dated = items.filter((item) => item.date).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  const sections = [
    { key: "overdue", title: "En retard", items: dated.filter((item) => (item.date ?? "") < today) },
    { key: "today", title: "Aujourd’hui", items: dated.filter((item) => item.date === today) },
    { key: "tomorrow", title: "Demain", items: dated.filter((item) => item.date === tomorrow) },
    { key: "week", title: "Cette semaine", items: dated.filter((item) => (item.date ?? "") > tomorrow && (item.date ?? "") <= weekEnd) },
    { key: "later", title: "Plus tard", items: dated.filter((item) => (item.date ?? "") > weekEnd) },
    { key: "unplanned", title: "À planifier", items: unplanned },
  ];
  const goalOptions: GoalOption[] = goals.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" ? [{ id: row.id, title: row.title, lifeArea: area(row.life_area) }] : []);
  const projectOptions: ProjectOption[] = projects.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" ? [{ id: row.id, title: row.title, lifeArea: area(row.life_area) }] : []);
  return <PlanningBoard today={today} sections={sections} goals={goalOptions} projects={projectOptions} />;

  function makeItem(row: Row, date: string | null, recurring: boolean): PlanningItem {
    const goal = typeof row.goal_id === "string" ? goalMap.get(row.goal_id) : null;
    const project = typeof row.project_id === "string" ? projectMap.get(row.project_id) : null;
    return { id: `${row.id}:${date ?? "unplanned"}`, date, time: typeof row.planned_time === "string" ? row.planned_time : null, title: String(row.title), lifeArea: area(row.life_area), durationMinutes: typeof row.estimate_minutes === "number" ? row.estimate_minutes : null, context: goal && project ? `${goal} · ${project}` : goal ?? project ?? null, recurring };
  }
}
function area(value: unknown): LifeArea { return value === "pro" || value === "perso" || value === "religion" ? value : null; }
