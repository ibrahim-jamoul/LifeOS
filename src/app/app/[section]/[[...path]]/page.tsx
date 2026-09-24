import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GoalsMissionBoard, type GoalBoardGoal, type GoalBoardMission } from "@/components/goals-mission-board";
import type { ProjectOption } from "@/components/life-dashboard";
import { ResourceWorkspace } from "@/components/resource-workspace";
import { VisionOverview, type VisionDomain } from "@/components/vision-overview";
import { calendarDateInTimeZone } from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

type SectionDefinition = { heading: string; intro: string; resources: readonly string[]; paths: Readonly<Record<string, string>> };
const sections: Readonly<Record<string, SectionDefinition>> = {
  goals: { heading: "Pilotage", intro: "Reliez résultats, projets, actions, mesures, revues et décisions dans une seule boucle.", resources: ["vision", "goals", "projects", "tasks", "kpis", "kpi_entries", "weekly_reviews", "decisions", "reminders", "resources"], paths: { objectives: "goals", "objectives-admin": "goals", vision: "vision", "vision-admin": "vision", projects: "projects", tasks: "tasks", kpis: "kpis", "kpi-entries": "kpi_entries", reviews: "weekly_reviews", decisions: "decisions", reminders: "reminders", resources: "resources" } },
  religion: { heading: "Religion", intro: "Organisez vos apprentissages et routines personnelles sans imposer de pratique ni confondre activité et maîtrise.", resources: ["religion_topics", "religion_sessions", "religion_routines", "religion_logs"], paths: { topics: "religion_topics", sessions: "religion_sessions", routines: "religion_routines", logs: "religion_logs" } },
  arabic: { heading: "Arabe", intro: "Suivez le temps réellement étudié, les compétences travaillées et votre objectif hebdomadaire.", resources: ["arabic_profile", "arabic_sessions"], paths: { progress: "arabic_profile", sessions: "arabic_sessions" } },
  quran: { heading: "Coran", intro: "Distinguez clairement lecture, mémorisation et révision, avec une vraie file d’échéances.", resources: ["quran_items", "quran_sessions"], paths: { items: "quran_items", sessions: "quran_sessions", revision: "quran_items" } },
  finances: { heading: "Finances", intro: "Connaissez votre position et votre capacité avant de décider; les transferts internes restent hors revenus et dépenses.", resources: ["financial_accounts", "financial_transactions", "budget_items", "financial_goals", "net_worth_snapshots"], paths: { accounts: "financial_accounts", transactions: "financial_transactions", budgets: "budget_items", goals: "financial_goals", "net-worth": "net_worth_snapshots" } },
  health: { heading: "Santé, sport & habitudes", intro: "Enregistrez des données factuelles et observez leurs tendances, sans interprétation médicale.", resources: ["habits", "habit_logs", "health_metrics", "health_entries", "workouts"], paths: { habits: "habits", logs: "habit_logs", metrics: "health_metrics", entries: "health_entries", workouts: "workouts" } },
  settings: { heading: "Réglages", intro: "Définissez les conventions temporelles et monétaires utilisées dans votre LifeOS.", resources: ["profile", "vision"], paths: { profile: "profile", vision: "vision" } },
};

type PageProps = { params: Promise<{ section: string; path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const { section } = await params; return { title: sections[section]?.heading ?? "LifeOS" }; }

export default async function SectionPage({ params, searchParams }: PageProps) {
  const { section, path } = await params;
  const definition = sections[section];
  if (!definition) notFound();
  const requestedPath = path?.join("/") ?? "";
  if (section === "goals" && requestedPath === "objectives") {
    const query = await searchParams;
    return <GoalsMissionServer initialGoalId={typeof query.goal === "string" ? query.goal : null} />;
  }
  if (section === "goals" && requestedPath === "vision") return <VisionServer />;
  const initialResource = requestedPath ? definition.paths[requestedPath] : definition.resources[0];
  if (!initialResource) notFound();
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />}><ResourceWorkspace key={`${section}-${requestedPath}`} resourceKeys={definition.resources} initialResource={initialResource} initialView={section === "quran" && requestedPath === "revision" ? "revision" : undefined} heading={definition.heading} intro={definition.intro} /></Suspense>;
}

async function GoalsMissionServer({ initialGoalId }: { initialGoalId: string | null }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);
  const [goalsR, tasksR, projectsR] = await Promise.all([
    supabase.from("goals").select("id,title,life_area,status,priority,progress_percent,target_date,desired_outcome").eq("user_id", userId).not("status", "in", "(cancelled,archived)").order("target_date", { ascending: true, nullsFirst: false }).limit(300),
    supabase.from("tasks").select("id,goal_id,title,status,priority,life_area,planned_on,planned_time,estimate_minutes,project_id,recurrence_rule,recurrence_until").eq("user_id", userId).not("goal_id", "is", null).limit(1500),
    supabase.from("projects").select("id,title,life_area,status").eq("user_id", userId).not("status", "in", "(cancelled,archived)").limit(500),
  ]);
  const projectRows = (projectsR.data ?? []) as Record<string, unknown>[];
  const projectNames = new Map(projectRows.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" ? [[row.id, row.title] as const] : []));
  const goals: GoalBoardGoal[] = ((goalsR.data ?? []) as Record<string, unknown>[]).flatMap((row) => typeof row.id === "string" && typeof row.title === "string" ? [{ id: row.id, title: row.title, lifeArea: area(row.life_area), status: String(row.status ?? "draft"), priority: String(row.priority ?? "unset"), progress: typeof row.progress_percent === "number" ? Math.round(row.progress_percent) : 0, targetDate: typeof row.target_date === "string" ? row.target_date : null, desiredOutcome: typeof row.desired_outcome === "string" ? row.desired_outcome : null }] : []);
  const missions: GoalBoardMission[] = ((tasksR.data ?? []) as Record<string, unknown>[]).flatMap((row) => typeof row.id === "string" && typeof row.goal_id === "string" && typeof row.title === "string" ? [{ id: row.id, goalId: row.goal_id, title: row.title, status: String(row.status ?? "todo"), priority: String(row.priority ?? "unset"), lifeArea: area(row.life_area), plannedOn: typeof row.planned_on === "string" ? row.planned_on : null, plannedTime: typeof row.planned_time === "string" ? row.planned_time : null, estimateMinutes: typeof row.estimate_minutes === "number" ? row.estimate_minutes : null, projectTitle: typeof row.project_id === "string" ? projectNames.get(row.project_id) ?? null : null, recurrenceRule: typeof row.recurrence_rule === "string" ? row.recurrence_rule : null, recurrenceUntil: typeof row.recurrence_until === "string" ? row.recurrence_until : null }] : []);
  const projects: ProjectOption[] = projectRows.flatMap((row) => typeof row.id === "string" && typeof row.title === "string" && !["done", "cancelled", "archived"].includes(String(row.status ?? "")) ? [{ id: row.id, title: row.title, lifeArea: area(row.life_area) }] : []);
  return <GoalsMissionBoard today={today} goals={goals} missions={missions} projects={projects} initialGoalId={initialGoalId} />;
}

async function VisionServer() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const [visionR, goalsR, projectsR, kpisR] = await Promise.all([
    supabase.from("life_vision").select("quarter_focus,one_year,three_year,five_year").eq("user_id", userId).maybeSingle(),
    supabase.from("goals").select("id,title,life_area,status,priority,target_date").eq("user_id", userId).not("status", "in", "(cancelled,archived)").limit(300),
    supabase.from("projects").select("id,life_area,status").eq("user_id", userId).not("status", "in", "(cancelled,archived,done)").limit(300),
    supabase.from("kpis").select("id,life_area,active").eq("user_id", userId).eq("active", true).limit(300),
  ]);
  const goals = (goalsR.data ?? []) as Record<string, unknown>[];
  const projects = (projectsR.data ?? []) as Record<string, unknown>[];
  const kpis = (kpisR.data ?? []) as Record<string, unknown>[];
  const domains: VisionDomain[] = (["pro", "perso", "religion"] as const).map((lifeArea) => {
    const areaGoals = goals.filter((row) => row.life_area === lifeArea && ["active", "at_risk", "draft"].includes(String(row.status ?? "")));
    const primary = [...areaGoals].sort((a, b) => priority(b.priority) - priority(a.priority) || target(a.target_date).localeCompare(target(b.target_date)))[0];
    return { area: lifeArea, headline: primary && typeof primary.title === "string" ? primary.title : null, targetDate: primary && typeof primary.target_date === "string" ? primary.target_date : null, status: primary ? String(primary.status ?? "draft") : null, goals: areaGoals.length, projects: projects.filter((row) => row.life_area === lifeArea).length, kpis: kpis.filter((row) => row.life_area === lifeArea).length };
  });
  const vision = (visionR.data ?? {}) as Record<string, unknown>;
  return <VisionOverview quarterFocus={typeof vision.quarter_focus === "string" ? vision.quarter_focus : null} horizons={[{ horizon: "1 an", headline: typeof vision.one_year === "string" ? vision.one_year : null }, { horizon: "3 ans", headline: typeof vision.three_year === "string" ? vision.three_year : null }, { horizon: "5 ans", headline: typeof vision.five_year === "string" ? vision.five_year : null }]} domains={domains} />;
}

function area(value: unknown): "pro" | "perso" | "religion" | null { return value === "pro" || value === "perso" || value === "religion" ? value : null; }
function priority(value: unknown) { return value === "critical" ? 5 : value === "high" ? 4 : value === "medium" ? 3 : value === "low" ? 2 : 1; }
function target(value: unknown) { return typeof value === "string" ? value : "9999-12-31"; }
