import Link from "next/link";
import { CalendarDays, ChevronRight, Target } from "lucide-react";

export type UpcomingItem = {
  id: string;
  title: string;
  plannedOn: string;
  lifeArea: "pro" | "perso" | "religion" | null;
  estimateMinutes: number | null;
};

export type GoalSummary = {
  id: string;
  title: string;
  lifeArea: "pro" | "perso" | "religion" | null;
  progressPercent: number;
  targetDate: string | null;
  status: string;
  remainingMissions: number;
};

export function UpcomingPanel({ today, items }: { today: string; items: readonly UpcomingItem[] }) {
  const grouped = new Map<string, UpcomingItem[]>();
  for (const item of items) grouped.set(item.plannedOn, [...(grouped.get(item.plannedOn) ?? []), item]);
  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500"><CalendarDays size={15}/>À venir</p>
          <h2 className="mt-1 text-xl font-bold">Prochaines actions datées</h2>
          <p className="mt-1 text-sm text-slate-600">Visible ici avant la date, puis automatiquement dans Aujourd’hui le jour prévu.</p>
        </div>
        <Link href="/app/goals/tasks" className="shrink-0 text-sm font-bold text-emerald-800">Toutes les tâches <ChevronRight className="inline" size={14}/></Link>
      </div>
      {items.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucune action future planifiée.</p> : (
        <div className="mt-5 divide-y divide-slate-100">
          {[...grouped.entries()].slice(0, 6).map(([date, dayItems]) => (
            <div key={date} className="grid gap-2 py-3 sm:grid-cols-[9rem_1fr]">
              <strong className="text-sm text-slate-700">{formatDate(date, today)}</strong>
              <div className="grid gap-2">
                {dayItems.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium">{item.title}</span><span className="shrink-0 text-xs text-slate-500">{area(item.lifeArea)}{item.estimateMinutes ? ` · ${item.estimateMinutes} min` : ""}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function GoalsPanel({ goals }: { goals: readonly GoalSummary[] }) {
  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500"><Target size={15}/>Objectifs 2026</p>
          <h2 className="mt-1 text-xl font-bold">Cap long terme</h2>
          <p className="mt-1 text-sm text-slate-600">Les objectifs restent séparés des actions du jour.</p>
        </div>
        <Link href="/app/goals/objectives" className="shrink-0 text-sm font-bold text-emerald-800">Tous <ChevronRight className="inline" size={14}/></Link>
      </div>
      {goals.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucun objectif actif à afficher.</p> : (
        <div className="mt-5 grid gap-3">
          {goals.slice(0, 10).map((goal) => (
            <Link href={`/app/goals/objectives?focus=${goal.id}`} key={goal.id} className="rounded-2xl border border-slate-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/30">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-sm">{goal.title}</strong><span className="mt-1 block text-xs text-slate-500">{area(goal.lifeArea)} · {statusLabel(goal.status)}{goal.targetDate ? ` · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(`${goal.targetDate}T12:00:00`))}` : ""}</span></div><span className="shrink-0 text-sm font-bold">{Math.round(goal.progressPercent)}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(0, Math.min(goal.progressPercent, 100))}%` }}/></div>
              <p className="mt-2 text-xs text-slate-500">{goal.remainingMissions} mission{goal.remainingMissions > 1 ? "s" : ""} restante{goal.remainingMissions > 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function area(value: GoalSummary["lifeArea"] | UpcomingItem["lifeArea"]) { return value ? value.toUpperCase() : "NON CLASSÉ"; }
function statusLabel(value: string) { return ({ active: "Actif", at_risk: "À risque", draft: "Brouillon", paused: "En pause", achieved: "Atteint" } as Record<string,string>)[value] ?? value; }
function formatDate(date: string, today: string) {
  const day = new Date(`${date}T12:00:00`);
  const delta = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
  if (delta === 1) return "Demain";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).format(day);
}
