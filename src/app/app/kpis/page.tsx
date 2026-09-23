import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GaugeCircle, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "KPI" };
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;

export default async function KpiDashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const [{ data: kpis }, { data: entries }] = await Promise.all([
    supabase.from("kpis").select("id,name,life_area,unit,target_type,target_value,target_min,target_max,cadence,direction,active").eq("user_id", userId).eq("active", true).order("life_area"),
    supabase.from("kpi_entries").select("kpi_id,value,measured_at").eq("user_id", userId).order("measured_at", { ascending: false }).limit(3000),
  ]);
  const byKpi = new Map<string, Row[]>();
  for (const entry of (entries ?? []) as Row[]) if (typeof entry.kpi_id === "string") byKpi.set(entry.kpi_id, [...(byKpi.get(entry.kpi_id) ?? []), entry]);
  const groups = ["pro", "perso", "religion"] as const;
  return <div className="grid gap-7">
    <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Mesurer sans polluer Aujourd’hui</p><h1 className="mt-1 text-3xl font-bold tracking-tight">KPI Dashboard</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Valeur actuelle, cible, tendance et statut. Les mesures détaillées restent dans l’historique.</p></header>
    {groups.map((group) => {
      const rows = ((kpis ?? []) as Row[]).filter((kpi) => kpi.life_area === group);
      return <section key={group} className="grid gap-3"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{group.toUpperCase()}</h2><Link href="/app/goals/kpis" className="text-sm font-bold text-emerald-800">Configurer <ArrowRight className="inline" size={14}/></Link></div>{rows.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((kpi) => <KpiCard key={String(kpi.id)} kpi={kpi} entries={byKpi.get(String(kpi.id)) ?? []}/>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucun KPI actif dans ce domaine.</p>}</section>;
    })}
  </div>;
}

function KpiCard({ kpi, entries }: { kpi: Row; entries: Row[] }) {
  const current = number(entries[0]?.value); const previous = number(entries[1]?.value); const target = number(kpi.target_value);
  const delta = current !== null && previous !== null ? current - previous : null;
  const progress = target && current !== null && target > 0 ? Math.min(100, Math.max(0, current / target * 100)) : null;
  const good = current !== null ? targetState(String(kpi.target_type), current, target, number(kpi.target_min), number(kpi.target_max)) : null;
  const Trend = delta !== null && delta < 0 ? TrendingDown : TrendingUp;
  return <article className="card"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{String(kpi.cadence ?? "")}</p><h3 className="mt-1 font-bold">{String(kpi.name ?? "KPI")}</h3></div><GaugeCircle className="text-emerald-700" size={20}/></div><div className="mt-4 flex items-end justify-between gap-3"><strong className="text-3xl">{current ?? "—"}<span className="ml-1 text-sm font-normal text-slate-500">{String(kpi.unit ?? "")}</span></strong>{delta !== null ? <span className="flex items-center gap-1 text-xs text-slate-500"><Trend size={14}/>{delta > 0 ? "+" : ""}{delta}</span> : <span className="text-xs text-slate-400">pas assez de recul</span>}</div><p className="mt-2 text-xs text-slate-500">Cible : {target ?? targetRange(kpi) ?? "non définie"} {String(kpi.unit ?? "")}</p>{progress !== null ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }}/></div> : null}<span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs font-bold ${good === null ? "bg-slate-100 text-slate-600" : good ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{good === null ? "À mesurer" : good ? "Dans la cible" : "À surveiller"}</span></article>;
}
function number(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function targetRange(kpi: Row) { const min=number(kpi.target_min), max=number(kpi.target_max); return min !== null && max !== null ? `${min}–${max}` : null; }
function targetState(type: string, current: number, target: number|null, min: number|null, max: number|null) { if(type==="min"&&target!==null)return current>=target;if(type==="max"&&target!==null)return current<=target;if(type==="exact"&&target!==null)return current===target;if(type==="range"&&min!==null&&max!==null)return current>=min&&current<=max;return null; }
