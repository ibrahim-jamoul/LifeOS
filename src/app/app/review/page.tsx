import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WeeklyReviewComposer } from "@/components/weekly-review-composer";
import { getIsoWeek } from "@/lib/domain/dates";
import { loadLifeOverview } from "@/lib/life-overview-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Revue" };
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;

export default async function ReviewPage() {
  const overview = await loadLifeOverview({ days: 7, align: "iso-week" });
  const week = getIsoWeek(overview.today);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const [{ data: existing }, { data: kpis }, { data: entries }] = await Promise.all([
    supabase.from("weekly_reviews").select("causes,pause_or_stop,next_week_top3,notes").eq("user_id", userId).eq("week_start", week.startsOn).maybeSingle(),
    supabase.from("kpis").select("id,name,life_area,unit,target_type,target_value,target_min,target_max,cadence").eq("user_id", userId).eq("active", true).limit(200),
    supabase.from("kpi_entries").select("kpi_id,value,measured_at").eq("user_id", userId).order("measured_at", { ascending: false }).limit(3000),
  ]);
  const byKpi = new Map<string, Row[]>();
  for (const entry of (entries ?? []) as Row[]) if (typeof entry.kpi_id === "string") byKpi.set(entry.kpi_id, [...(byKpi.get(entry.kpi_id) ?? []), entry]);
  const wins = buildWins(overview);
  const misses = buildMisses(overview);
  const risks = buildRisks(overview);

  return <div className="grid gap-7">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Mesurer → décider → ajuster</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Revue hebdomadaire</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Le bilan est calculé depuis les actions, occurrences récurrentes, routines et KPI. Tu n’écris que les arbitrages utiles.</p></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Mini label="Exécution" value={overview.current.rate === null ? "—" : `${overview.current.rate}%`} /><Mini label="Actions réalisées" value={`${overview.current.completed}/${overview.current.expected}`} /><Mini label="Reports répétés" value={String(overview.repeatedlyRescheduled.length)} /><Mini label="Projets stagnants" value={String(overview.inactiveProjects.length)} /></section>

    <section className="grid gap-4 xl:grid-cols-2">
      <div className="card"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Actions par domaine</h2><Link href="/app/progression" className="text-sm font-bold text-emerald-800">Détail <ArrowRight className="inline" size={14} /></Link></div><div className="mt-4 grid gap-3">{overview.current.areas.map((area) => <MetricRow key={String(area.lifeArea)} label={(area.lifeArea ?? "non classé").toUpperCase()} value={`${area.completed}/${area.expected}`} rate={area.rate} />)}</div></div>
      <div className="card"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Routines</h2><Link href="/app/health/habits" className="text-sm font-bold text-emerald-800">Gérer <ArrowRight className="inline" size={14} /></Link></div><div className="mt-4 grid gap-3">{overview.current.routines.length ? overview.current.routines.slice(0, 10).map((routine) => <MetricRow key={`${routine.routineType}:${routine.id}`} label={routine.name} value={`${routine.completed}/${routine.expected}`} rate={routine.rate} />) : <Empty>Aucune routine mesurable cette semaine.</Empty>}</div></div>
    </section>

    <section className="card"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">KPI</h2><Link href="/app/kpis" className="text-sm font-bold text-emerald-800">Dashboard KPI <ArrowRight className="inline" size={14} /></Link></div>{(kpis ?? []).length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{((kpis ?? []) as Row[]).slice(0, 12).map((kpi) => <KpiMini key={String(kpi.id)} kpi={kpi} entries={byKpi.get(String(kpi.id)) ?? []} />)}</div> : <div className="mt-4"><Empty>Aucun KPI actif.</Empty></div>}</section>

    <section className="grid gap-4 xl:grid-cols-2"><GoalList title="Objectifs ayant progressé" rows={overview.goalsWithActivity} empty="Aucun objectif relié à une mission terminée cette semaine." /><GoalList title="Objectifs sans activité" rows={overview.goalsWithoutActivity} empty="Tous les objectifs actifs ont une activité mesurée." /></section>
    <section className="grid gap-4 xl:grid-cols-2"><div className="card"><h2 className="text-lg font-bold">Retards / reports</h2><p className="mt-2 text-sm text-slate-600">{overview.repeatedlyRescheduled.length ? `${overview.repeatedlyRescheduled.length} tâche(s) reportée(s) au moins deux fois cette semaine.` : "Aucun report répété."}</p></div><div className="card"><h2 className="text-lg font-bold">Projets sans activité récente</h2><div className="mt-3 grid gap-2">{overview.inactiveProjects.length ? overview.inactiveProjects.slice(0, 8).map((project) => <div key={project.id} className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{project.title}</span><span className="shrink-0 text-slate-500">{project.lastActivityOn ?? "jamais"}</span></div>) : <Empty>Aucun projet actif stagnant.</Empty>}</div></div></section>

    <WeeklyReviewComposer weekStart={week.startsOn} autoWins={wins} autoMisses={misses} autoRisks={risks} existing={{ causes: existing?.causes, pauseOrStop: existing?.pause_or_stop, top3: existing?.next_week_top3, notes: existing?.notes }} />
  </div>;
}

function GoalList({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) { return <div className="card"><h2 className="text-lg font-bold">{title}</h2><div className="mt-3 grid gap-2">{rows.length ? rows.slice(0, 10).map((goal) => <Link key={String(goal.id)} href={`/app/goals/objectives?goal=${String(goal.id)}`} className="flex items-center justify-between rounded-xl px-2 py-2 text-sm hover:bg-slate-50"><span className="truncate font-medium">{String(goal.title ?? "Objectif")}</span><span className="text-slate-500">{Number(goal.progress_percent ?? 0)}%</span></Link>) : <Empty>{empty}</Empty>}</div></div>; }
function KpiMini({ kpi, entries }: { kpi: Row; entries: Row[] }) { const current = numeric(entries[0]?.value); const previous = numeric(entries[1]?.value); const target = numeric(kpi.target_value); const delta = current !== null && previous !== null ? current - previous : null; return <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><p className="text-[11px] font-black uppercase text-slate-500">{String(kpi.life_area ?? "")}</p><p className="mt-1 font-bold">{String(kpi.name ?? "KPI")}</p><div className="mt-3 flex items-end justify-between"><strong className="text-2xl">{current ?? "—"}<span className="ml-1 text-xs font-normal text-slate-500">{String(kpi.unit ?? "")}</span></strong><span className="text-xs text-slate-500">{delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}</span></div><p className="mt-1 text-xs text-slate-500">Cible : {target ?? "à définir"}</p></div>; }
function buildWins(overview: Awaited<ReturnType<typeof loadLifeOverview>>) { const lines = [`${overview.current.completed}/${overview.current.expected} éléments mesurables réalisés.`]; if (overview.goalsWithActivity.length) lines.push(`${overview.goalsWithActivity.length} objectif(s) ont progressé.`); return lines.join("\n"); }
function buildMisses(overview: Awaited<ReturnType<typeof loadLifeOverview>>) { const lines: string[] = []; for (const area of overview.current.areas) if (area.expected > 0 && (area.rate ?? 100) < 60) lines.push(`${(area.lifeArea ?? "non classé").toUpperCase()}: ${area.completed}/${area.expected}.`); if (overview.goalsWithoutActivity.length) lines.push(`${overview.goalsWithoutActivity.length} objectif(s) actif(s) sans activité.`); return lines.join("\n") || "Aucun écart majeur détecté."; }
function buildRisks(overview: Awaited<ReturnType<typeof loadLifeOverview>>) { const lines: string[] = []; if (overview.repeatedlyRescheduled.length) lines.push(`${overview.repeatedlyRescheduled.length} tâche(s) reportée(s) à répétition.`); if (overview.inactiveProjects.length) lines.push(`${overview.inactiveProjects.length} projet(s) sans activité récente.`); return lines.join("\n"); }
function Mini({ label, value }: { label: string; value: string }) { return <div className="card"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><strong className="mt-1 block text-2xl">{value}</strong></div>; }
function MetricRow({ label, value, rate }: { label: string; value: string; rate: number | null }) { return <div><div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{label}</span><span className="shrink-0 text-slate-500">{value}{rate === null ? "" : ` · ${rate}%`}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(0, Math.min(rate ?? 0, 100))}%` }} /></div></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="text-sm text-slate-500">{children}</p>; }
function numeric(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
