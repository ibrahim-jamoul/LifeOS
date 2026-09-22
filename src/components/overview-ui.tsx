import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, CircleMinus, Clock3, Repeat2 } from "lucide-react";
import type { AreaSummary, PeriodSummary } from "@/lib/domain/life-analytics";

export function ExecutionHero({ current, previous }: { current: PeriodSummary; previous: PeriodSummary }) {
  const delta = current.rate !== null && previous.rate !== null ? current.rate - previous.rate : null;
  return (
    <section className="card grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Vue globale</p>
        <div className="mt-2 flex items-end gap-3">
          <strong className="text-5xl tracking-tight">{formatRate(current.rate)}</strong>
          <TrendBadge delta={delta} />
        </div>
        <p className="mt-2 text-sm text-slate-600">Exécution des actions et routines réellement planifiées sur la période.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MiniMetric label="Attendu" value={current.expected} />
        <MiniMetric label="Réalisé" value={current.completed} />
        <MiniMetric label="Tâches finies" value={current.completedActions} />
        <MiniMetric label="Période précédente" value={formatRate(previous.rate)} />
      </div>
    </section>
  );
}

export function AreaCards({ areas, previousAreas }: { areas: readonly AreaSummary[]; previousAreas: readonly AreaSummary[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {areas.map((area) => {
        const previous = previousAreas.find((item) => item.lifeArea === area.lifeArea);
        const delta = area.rate !== null && previous?.rate !== null && previous?.rate !== undefined ? area.rate - previous.rate : null;
        return (
          <article className="card" key={area.lifeArea}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{area.lifeArea}</p>
                <strong className="mt-2 block text-3xl">{formatRate(area.rate)}</strong>
              </div>
              <TrendBadge delta={delta} compact />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(0, Math.min(area.rate ?? 0, 100))}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-500">{area.completed}/{area.expected} occurrences mesurables réalisées</p>
          </article>
        );
      })}
    </section>
  );
}

export function InsightCard({ tone, title, body, href }: { tone: "good" | "warn" | "neutral"; title: string; body: string; href?: string }) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? AlertTriangle : CircleMinus;
  const toneClass = tone === "good" ? "bg-emerald-50 text-emerald-900" : tone === "warn" ? "bg-amber-50 text-amber-950" : "bg-slate-100 text-slate-800";
  return (
    <article className="card flex items-start gap-3">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}><Icon size={19} /></span>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        {href ? <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">Voir le détail <ArrowRight size={15} /></Link> : null}
      </div>
    </article>
  );
}

export function RescheduleList({ items }: { items: readonly { id: string; title: string; count: number }[] }) {
  if (!items.length) return <EmptyFact icon={<Repeat2 size={20} />} text="Aucune tâche ouverte n’a été reportée plusieurs fois sur la période." />;
  return (
    <div className="divide-y divide-slate-100">
      {items.slice(0, 8).map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 py-3">
          <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">{item.count} reports</span>
        </div>
      ))}
    </div>
  );
}

export function StaleProjectList({ items, today }: { items: readonly { id: string; title: string; lastActivityOn: string | null }[]; today: string }) {
  if (!items.length) return <EmptyFact icon={<Clock3 size={20} />} text="Aucun projet actif sans activité depuis plus de 14 jours." />;
  return (
    <div className="divide-y divide-slate-100">
      {items.slice(0, 8).map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 py-3">
          <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
          <span className="shrink-0 text-xs text-slate-500">{item.lastActivityOn ? `${daysBetween(item.lastActivityOn, today)} j` : "aucune activité"}</span>
        </div>
      ))}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>;
}

function TrendBadge({ delta, compact = false }: { delta: number | null; compact?: boolean }) {
  if (delta === null) return <span className="text-xs text-slate-400">pas assez de recul</span>;
  if (Math.abs(delta) < 2) return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600"><CircleMinus size={compact ? 12 : 14} /> stable</span>;
  const up = delta > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${up ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}><Icon size={compact ? 12 : 14} />{up ? "+" : ""}{delta} pts</span>;
}

function EmptyFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><span className="text-slate-400">{icon}</span>{text}</div>;
}

function formatRate(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function daysBetween(start: string, end: string): number {
  return Math.max(0, Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000));
}
