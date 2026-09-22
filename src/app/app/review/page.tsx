import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WeeklyReviewComposer } from "@/components/weekly-review-composer";
import { getIsoWeek } from "@/lib/domain/dates";
import { loadLifeOverview } from "@/lib/life-overview-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Revue" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const overview = await loadLifeOverview({ days: 7, align: "iso-week" });
  const week = getIsoWeek(overview.today);
  const wins = buildWins(overview);
  const misses = buildMisses(overview);
  const risks = buildRisks(overview);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const { data: existing } = await supabase.from("weekly_reviews").select("causes,pause_or_stop,next_week_top3,notes").eq("user_id", userId).eq("week_start", week.startsOn).maybeSingle();
  return (
    <div className="grid gap-7">
      <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Mesurer → décider → ajuster</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Revue hebdomadaire</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">LifeOS préremplit les faits observables. Tu complètes uniquement le contexte, les arbitrages et les trois priorités suivantes.</p></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Mini label="Exécution" value={overview.current.rate === null?"—":`${overview.current.rate}%`} /><Mini label="Réalisé" value={`${overview.current.completed}/${overview.current.expected}`} /><Mini label="Reports répétés" value={String(overview.repeatedlyRescheduled.length)} /><Mini label="Projets stagnants" value={String(overview.inactiveProjects.length)} /></section>
      <WeeklyReviewComposer weekStart={week.startsOn} autoWins={wins} autoMisses={misses} autoRisks={risks} existing={{ causes: existing?.causes, pauseOrStop: existing?.pause_or_stop, top3: existing?.next_week_top3, notes: existing?.notes }} />
      <div className="text-sm text-slate-600">Besoin du détail brut ? <Link href="/app/goals/reviews" className="inline-flex items-center gap-1 font-bold text-emerald-800">Historique des revues <ArrowRight size={14}/></Link></div>
    </div>
  );
}

function buildWins(overview: Awaited<ReturnType<typeof loadLifeOverview>>): string {
  const lines = [`${overview.current.completed} élément(s) mesurable(s) réalisés sur ${overview.current.expected}.`];
  for (const routine of overview.strongRoutines.slice(0,3)) lines.push(`• ${routine.name}: ${routine.completed}/${routine.expected} (${routine.rate ?? 0} %).`);
  return lines.join("\n");
}
function buildMisses(overview: Awaited<ReturnType<typeof loadLifeOverview>>): string {
  const lines: string[] = [];
  for (const area of overview.current.areas) if (area.expected > 0 && (area.rate ?? 100) < 60) lines.push(`• ${area.lifeArea.toUpperCase()}: ${area.completed}/${area.expected} (${area.rate ?? 0} %).`);
  for (const routine of overview.weakRoutines.slice(0,3)) lines.push(`• Routine ${routine.name}: ${routine.completed}/${routine.expected}.`);
  if (!lines.length) lines.push("Aucun écart majeur détecté automatiquement cette semaine.");
  return lines.join("\n");
}
function buildRisks(overview: Awaited<ReturnType<typeof loadLifeOverview>>): string {
  const lines: string[] = [];
  if (overview.repeatedlyRescheduled.length) lines.push(`${overview.repeatedlyRescheduled.length} tâche(s) sont reportées à répétition.`);
  if (overview.inactiveProjects.length) lines.push(`${overview.inactiveProjects.length} projet(s) actif(s) sont sans activité depuis au moins 14 jours.`);
  return lines.join("\n");
}
function Mini({label,value}:{label:string;value:string}){return <div className="card"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><strong className="mt-1 block text-2xl">{value}</strong></div>}
