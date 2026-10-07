import type { Metadata } from "next";
import { InsightCard, RescheduleList, StaleProjectList } from "@/components/overview-ui";
import { loadLifeOverview } from "@/lib/life-overview-server";

export const metadata: Metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const overview = await loadLifeOverview(90);
  const weak = overview.weakRoutines.slice(0, 5);
  const strong = overview.strongRoutines.slice(0, 5);
  const declaredArea = topDeclaredPriorityArea(overview.activeGoals);
  const activityArea = [...overview.current.areas]
    .filter((area) => area.completed > 0)
    .sort((a, b) => b.completed - a.completed)[0]?.lifeArea ?? null;
  const delta = overview.current.rate !== null && overview.previous.rate !== null
    ? overview.current.rate - overview.previous.rate
    : null;

  return (
    <div className="grid gap-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Ce que tes données révèlent</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Insights</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">LifeOS signale les écarts récurrents et les tendances fortes. Il n’invente pas de diagnostic et ne modifie jamais une priorité sans ton choix.</p>
      </header>

      <section className="grid gap-4 xl:grid-cols-2">
        {strong.length
          ? strong.map((routine) => <InsightCard key={routine.id} tone="good" title={`${routine.name} tient bien`} body={`${routine.completed}/${routine.expected} occurrences réalisées sur la période (${routine.rate ?? 0} %).`} />)
          : <InsightCard tone="neutral" title="Pas encore de routine solidement établie" body="Il faut davantage d’occurrences mesurables pour identifier une vraie régularité." />}
        {weak.length
          ? weak.map((routine) => <InsightCard key={routine.id} tone="warn" title={`${routine.name} est rarement réalisée`} body={`${routine.completed}/${routine.expected} occurrences réalisées (${routine.rate ?? 0} %). Cela mérite une décision : simplifier, replanifier, réduire ou abandonner.`} />)
          : <InsightCard tone="good" title="Aucune routine faible détectée" body="Aucune routine avec au moins trois occurrences attendues n’est sous 50 % sur la période." />}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Tâches reportées à répétition</h2>
          <p className="mt-1 text-sm text-slate-600">Deux reports ou plus sur la période de 90 jours.</p>
          <div className="mt-4"><RescheduleList items={overview.repeatedlyRescheduled} /></div>
        </div>
        <div className="card">
          <h2 className="font-bold">Projets actifs qui stagnent</h2>
          <p className="mt-1 text-sm text-slate-600">Aucune activité enregistrée depuis au moins 14 jours.</p>
          <div className="mt-4"><StaleProjectList items={overview.inactiveProjects} today={overview.today} /></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          tone={delta !== null && delta < -10 ? "warn" : delta !== null && delta > 10 ? "good" : "neutral"}
          title="Exécution globale"
          body={`Période actuelle : ${overview.current.rate === null ? "non mesurable" : `${overview.current.rate}%`}. Période précédente : ${overview.previous.rate === null ? "non mesurable" : `${overview.previous.rate}%`}.${delta === null ? "" : ` Écart : ${delta > 0 ? "+" : ""}${delta} points.`}`}
        />
        <InsightCard tone={overview.repeatedlyRescheduled.length >= 3 ? "warn" : "neutral"} title="Stabilité d’exécution" body={`${overview.repeatedlyRescheduled.length} tâche(s) ouverte(s) sont reportées à répétition.`} />
        <InsightCard tone={overview.inactiveProjects.length >= 2 ? "warn" : "neutral"} title="Dispersion projets" body={`${overview.inactiveProjects.length} projet(s) actif(s) sont sans activité récente.`} />
        {declaredArea && activityArea
          ? <InsightCard
              tone={declaredArea === activityArea ? "good" : "neutral"}
              title="Priorités vs activité"
              body={declaredArea === activityArea
                ? `${declaredArea.toUpperCase()} concentre à la fois tes objectifs les plus prioritaires et le plus grand volume d’occurrences réalisées.`
                : `Tes objectifs les plus prioritaires sont surtout ${declaredArea.toUpperCase()}, alors que le plus grand volume d’occurrences réalisées est ${activityArea.toUpperCase()}. C’est un écart à examiner, pas automatiquement un problème.`}
            />
          : <InsightCard tone="neutral" title="Priorités vs activité" body="Pas encore assez de données structurées pour comparer tes priorités déclarées à ton activité réelle." />}
      </section>
    </div>
  );
}

function topDeclaredPriorityArea(goals: readonly Record<string, unknown>[]): "pro" | "perso" | "religion" | null {
  const weights = { critical: 4, high: 3, medium: 2, low: 1, unset: 0 } as const;
  const scores = { pro: 0, perso: 0, religion: 0 };
  for (const goal of goals) {
    const area = goal.life_area;
    const priority = goal.priority;
    if (area !== "pro" && area !== "perso" && area !== "religion") continue;
    const weight = priority === "critical" || priority === "high" || priority === "medium" || priority === "low" || priority === "unset" ? weights[priority] : 0;
    scores[area] += weight;
  }
  const ranked = (Object.entries(scores) as Array<["pro" | "perso" | "religion", number]>).sort((a, b) => b[1] - a[1]);
  return ranked[0] && ranked[0][1] > 0 ? ranked[0][0] : null;
}
