import type { Metadata } from "next";
import Link from "next/link";
import { ProgressCharts } from "@/components/progress-charts";
import { AreaCards, ExecutionHero } from "@/components/overview-ui";
import { loadLifeOverview } from "@/lib/life-overview-server";

export const metadata: Metadata = { title: "Progression" };
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ period?: string }> };

const periods = [
  { days: 7, label: "7 j" },
  { days: 30, label: "30 j" },
  { days: 90, label: "90 j" },
  { days: 365, label: "1 an" },
] as const;

export default async function ProgressionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = Number(params.period ?? 30);
  const days = periods.some((period) => period.days === requested) ? requested : 30;
  const overview = await loadLifeOverview(days);
  const chartPoints = overview.weekly.map((week) => ({
    label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(`${week.end}T12:00:00Z`)),
    rate: week.rate,
    completed: week.completed,
    expected: week.expected,
  }));

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Progression</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Ce que tu fais réellement</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Vue agrégée sur {days} jours. LifeOS ne pénalise pas une métrique absente et ne mesure que les occurrences explicitement planifiées.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Période d’analyse">
          {periods.map((period) => <Link key={period.days} href={`/app/progression?period=${period.days}`} className={period.days === days ? "button-primary min-h-9 px-3 py-1 text-xs" : "button-secondary min-h-9 px-3 py-1 text-xs"}>{period.label}</Link>)}
        </nav>
      </header>

      <ExecutionHero current={overview.current} previous={overview.previous} />
      <AreaCards areas={overview.current.areas} previousAreas={overview.previous.areas} />

      <section className="card">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Évolution récente</h2>
          <p className="mt-1 text-sm text-slate-600">Les huit dernières fenêtres hebdomadaires permettent de voir une dégradation ou une amélioration sans inspecter chaque KPI.</p>
        </div>
        <ProgressCharts points={chartPoints} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-lg font-bold">Routines les plus solides</h2>
          <p className="mt-1 text-sm text-slate-600">Au moins trois occurrences prévues sur la période.</p>
          <div className="mt-4 grid gap-3">
            {overview.strongRoutines.length ? overview.strongRoutines.slice(0, 8).map((routine) => (
              <div key={`${routine.id}-${routine.name}`} className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2">
                <span className="text-sm font-medium">{routine.name}</span><strong className="text-sm text-emerald-900">{routine.rate}%</strong>
              </div>
            )) : <p className="text-sm text-slate-500">Pas encore assez de données pour identifier une routine solide.</p>}
          </div>
        </article>
        <article className="card">
          <h2 className="text-lg font-bold">Ce que tu fais rarement</h2>
          <p className="mt-1 text-sm text-slate-600">Éléments planifiés mais réalisés moins d’une fois sur deux.</p>
          <div className="mt-4 grid gap-3">
            {overview.weakRoutines.length ? overview.weakRoutines.slice(0, 8).map((routine) => (
              <div key={`${routine.id}-${routine.name}`} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2">
                <span className="text-sm font-medium">{routine.name}</span><strong className="text-sm text-amber-950">{routine.rate}%</strong>
              </div>
            )) : <p className="text-sm text-slate-500">Aucune routine mesurable sous 50 % sur la période.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
