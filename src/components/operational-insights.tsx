"use client";

import { useEffect, useState } from "react";
import { Activity, CircleDollarSign, Languages, LoaderCircle } from "lucide-react";

type ArabicData = { week: { key: string }; minutes: number; targetMinutes: number; sessions: number; bySkill: Record<string, number> };
type FinanceData = { month: string; totals: { currency: string | null; income: number; expense: number; net: number; includedTransactions: number; excludedTransfers: number }[] };
type HealthData = { windowDays: number; trends: { id: string; name: string; unit: string; change: number | null; points: { measuredAt: string; value: number }[] }[] };
type KpiData = { trends: { id: string; name: string; unit: string; status: "on_track" | "watch" | "off_track" | "insufficient_data"; points: { measuredAt: string; value: number }[] }[] };
type InsightData = ArabicData | FinanceData | HealthData | KpiData;
type Envelope = { ok: true; data: InsightData } | { ok: false; error: { message: string } };

const insightByResource: Readonly<Record<string, "arabic" | "finances" | "health" | "kpis">> = {
  arabic_profile: "arabic", arabic_sessions: "arabic",
  financial_accounts: "finances", financial_transactions: "finances", budget_items: "finances", financial_goals: "finances", net_worth_snapshots: "finances",
  habits: "health", habit_logs: "health", health_metrics: "health", health_entries: "health", workouts: "health",
  kpis: "kpis", kpi_entries: "kpis",
};

export function OperationalInsights({ resourceKey, refreshToken }: { resourceKey: string; refreshToken: number }) {
  const section = insightByResource[resourceKey];
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!section) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/insights/${section}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<Envelope>)
      .then((result) => { if (!cancelled) setData(result.ok ? result.data : null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [section, refreshToken]);

  if (!section) return null;
  if (loading && !data) return <div className="flex items-center gap-2 rounded-xl bg-white p-4 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={17} />Calcul des indicateurs réels…</div>;
  if (!data) return null;
  if (section === "arabic") return <ArabicInsights data={data as ArabicData} />;
  if (section === "finances") return <FinanceInsights data={data as FinanceData} />;
  if (section === "kpis") return <KpiInsights data={data as KpiData} />;
  return <HealthInsights data={data as HealthData} />;
}

function ArabicInsights({ data }: { data: ArabicData }) {
  const progress = data.targetMinutes > 0 ? Math.min(100, Math.round(data.minutes / data.targetMinutes * 100)) : null;
  return <section className="card"><h2 className="flex items-center gap-2 font-bold"><Languages size={19} />Semaine {data.week.key}</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Minutes étudiées" value={String(data.minutes)} /><Metric label="Cible" value={data.targetMinutes ? `${data.targetMinutes} min` : "Non définie"} /><Metric label="Sessions" value={String(data.sessions)} /></div>{progress !== null ? <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-slate-600"><span>Progression hebdomadaire</span><strong>{progress} %</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-emerald-700" style={{ width: `${progress}%` }} /></div></div> : null}{Object.keys(data.bySkill).length ? <p className="mt-3 text-xs text-slate-500">Par compétence : {Object.entries(data.bySkill).map(([skill, minutes]) => `${skill} ${minutes} min`).join(" · ")}</p> : null}</section>;
}

function FinanceInsights({ data }: { data: FinanceData }) {
  return <section className="card"><h2 className="flex items-center gap-2 font-bold"><CircleDollarSign size={19} />Totaux du mois {data.month}</h2>{data.totals.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune transaction ce mois-ci.</p> : <div className="mt-4 grid gap-3 xl:grid-cols-2">{data.totals.map((total) => <article key={total.currency ?? "unknown"} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><strong>{total.currency ?? "Devise inconnue"}</strong><span className={`font-bold ${total.net < 0 ? "text-red-700" : "text-emerald-800"}`}>{money(total.net, total.currency)}</span></div><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-xs text-slate-500">Revenus</dt><dd>{money(total.income, total.currency)}</dd></div><div><dt className="text-xs text-slate-500">Dépenses</dt><dd>{money(total.expense, total.currency)}</dd></div></dl><p className="mt-3 text-xs text-slate-500">{total.excludedTransfers} ligne(s) de transfert exclue(s) des totaux.</p></article>)}</div>}</section>;
}

function HealthInsights({ data }: { data: HealthData }) {
  return <section className="card"><h2 className="flex items-center gap-2 font-bold"><Activity size={19} />Tendances réelles sur {data.windowDays} jours</h2><p className="mt-1 text-xs text-slate-500">Aucune interpolation et aucune interprétation médicale.</p>{data.trends.length === 0 ? <p className="mt-4 text-sm text-slate-500">Créez une métrique puis ajoutez des mesures.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{data.trends.map((trend) => <article key={trend.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-end justify-between gap-3"><div><strong>{trend.name}</strong><p className="text-xs text-slate-500">{trend.points.length} point(s) · {trend.change === null ? "variation insuffisante" : `variation ${signed(trend.change)} ${trend.unit}`}</p></div>{trend.points.length ? <strong>{trend.points.at(-1)?.value} {trend.unit}</strong> : null}</div>{trend.points.length > 1 ? <Sparkline values={trend.points.map((point) => point.value)} label={`Tendance ${trend.name}`} /> : <div className="mt-4 h-14 rounded-lg bg-slate-50" />}</article>)}</div>}</section>;
}

function KpiInsights({ data }: { data: KpiData }) {
  return <section className="card"><h2 className="flex items-center gap-2 font-bold"><Activity size={19} />Tendances KPI</h2><p className="mt-1 text-xs text-slate-500">Les 30 dernières mesures réelles sont affichées ; une série vide reste « insufficient data ».</p>{data.trends.length === 0 ? <p className="mt-4 text-sm text-slate-500">Créez un KPI puis ajoutez une mesure.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{data.trends.map((trend) => <article key={trend.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><strong>{trend.name}</strong><p className="text-xs text-slate-500">{trend.points.length} mesure(s)</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${trend.status === "on_track" ? "bg-emerald-100 text-emerald-800" : trend.status === "watch" ? "bg-amber-100 text-amber-900" : trend.status === "off_track" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{trend.status.replaceAll("_", " ")}</span></div>{trend.points.length > 1 ? <Sparkline values={trend.points.map((point) => point.value)} label={`Tendance KPI ${trend.name}`} /> : <div className="mt-4 h-14 rounded-lg bg-slate-50" />}{trend.points.length ? <p className="mt-2 text-right text-sm font-bold">{trend.points.at(-1)?.value} {trend.unit}</p> : null}</article>)}</div>}</section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><strong className="mt-1 block text-xl">{value}</strong></div>; }
function Sparkline({ values, label }: { values: number[]; label: string }) { const min = Math.min(...values); const max = Math.max(...values); const points = values.map((value, index) => `${values.length === 1 ? 50 : index / (values.length - 1) * 100},${max === min ? 30 : 55 - (value - min) / (max - min) * 50}`).join(" "); return <svg className="mt-4 h-16 w-full" viewBox="0 0 100 60" role="img" aria-label={label} preserveAspectRatio="none"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" className="text-emerald-700" /></svg>; }
function money(value: number, currency: string | null): string { return new Intl.NumberFormat("fr-FR", { style: currency ? "currency" : "decimal", ...(currency ? { currency } : {}) }).format(value); }
function signed(value: number): string { return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value)}`; }
