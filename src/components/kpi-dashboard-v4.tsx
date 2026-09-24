"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Check, Heart, LoaderCircle, MoonStar, Plus, Sparkles, X } from "lucide-react";

export type KpiView = {
  id: string;
  name: string;
  area: "pro" | "perso" | "religion" | null;
  unit: string;
  cadence: string;
  targetType: string;
  targetValue: number | null;
  targetMin: number | null;
  targetMax: number | null;
  current: number | null;
  previous: number | null;
  progress: number | null;
  configurationStatus: string;
  measurementMode: "manual" | "derived";
  notes: string | null;
};

type Area = "all" | "pro" | "perso" | "religion";
type ApiEnvelope = { ok?: boolean; error?: { message?: string } };

export function KpiDashboardV4({ kpis }: { kpis: KpiView[] }) {
  const router = useRouter();
  const [area, setArea] = useState<Area>("all");
  const [entryKpi, setEntryKpi] = useState<KpiView | null>(null);
  const visible = useMemo(() => kpis.filter((kpi) => area === "all" || kpi.area === area), [kpis, area]);
  const summaries = (["pro", "perso", "religion"] as const).map((key) => {
    const rows = kpis.filter((kpi) => kpi.area === key && kpi.progress !== null);
    const score = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.progress ?? 0), 0) / rows.length) : null;
    return { area: key, score, measured: rows.length, total: kpis.filter((kpi) => kpi.area === key).length };
  });

  return <div className="grid gap-6">
    <header><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Mesurer sans double saisie</p><h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">Mes KPI</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Les indicateurs reliés à des routines, projets ou revues sont calculés automatiquement. Le bouton + apparaît uniquement lorsqu’une saisie manuelle est réellement nécessaire.</p></header>

    <section className="grid gap-3 md:grid-cols-3">{summaries.map((item) => <AreaSummary key={item.area} area={item.area} score={item.score} measured={item.measured} total={item.total} onClick={() => setArea(item.area)} active={area === item.area} />)}</section>

    <div className="flex flex-wrap gap-2">{(["all", "pro", "perso", "religion"] as const).map((value) => <button key={value} onClick={() => setArea(value)} className={`rounded-full px-4 py-2 text-sm font-black transition ${area === value ? filterTone(value) : "border border-slate-200 bg-white/90 text-slate-600"}`}>{value === "all" ? "Tous" : value.toUpperCase()}</button>)}</div>

    <section className="grid gap-3 xl:grid-cols-2">{visible.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} onAdd={kpi.measurementMode === "manual" ? () => setEntryKpi(kpi) : undefined} />)}</section>
    {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-blue-200 bg-white/80 p-8 text-center text-sm text-slate-500">Aucun KPI dans ce filtre.</div> : null}

    {entryKpi ? <QuickEntry kpi={entryKpi} onClose={() => setEntryKpi(null)} onSaved={() => { setEntryKpi(null); router.refresh(); }} /> : null}
  </div>;
}

function AreaSummary({ area, score, measured, total, active, onClick }: { area: "pro" | "perso" | "religion"; score: number | null; measured: number; total: number; active: boolean; onClick: () => void }) {
  const Icon = area === "pro" ? BriefcaseBusiness : area === "perso" ? Heart : MoonStar;
  return <button onClick={onClick} className={`rounded-[1.6rem] border bg-white/95 p-5 text-left shadow-sm transition ${active ? "border-blue-300 ring-2 ring-blue-100" : "border-blue-100 hover:border-blue-200"}`}><div className="flex items-center gap-3"><div className={`grid size-11 place-items-center rounded-2xl ${areaIconTone(area)}`}><Icon size={20} /></div><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{area}</p><p className="text-sm text-slate-500">{measured}/{total} KPI avec cible mesurable</p></div><strong className="ml-auto text-2xl">{score === null ? "—" : `${score}%`}</strong></div></button>;
}

function KpiCard({ kpi, onAdd }: { kpi: KpiView; onAdd?: () => void }) {
  const delta = kpi.current !== null && kpi.previous !== null ? kpi.current - kpi.previous : null;
  const target = targetLabel(kpi);
  const status = statusLabel(kpi);
  return <article className="rounded-[1.6rem] border border-blue-100 bg-white/95 p-5 shadow-sm">
    <div className="flex items-start gap-3"><div className={`grid size-10 shrink-0 place-items-center rounded-2xl ${areaIconTone(kpi.area)}`}><Activity size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{kpi.name}</h2><AreaBadge area={kpi.area} /></div><p className="mt-1 text-xs text-slate-500">{cadenceLabel(kpi.cadence)} · {kpi.measurementMode === "derived" ? "calcul automatique" : "saisie manuelle"}</p></div>{onAdd ? <button className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={onAdd} aria-label={`Ajouter une mesure pour ${kpi.name}`}><Plus size={18} /></button> : <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700" title="Calcul automatique"><Sparkles size={17} /></span>}</div>

    <div className="mt-4 flex items-end justify-between gap-4"><div><strong className="text-3xl tracking-tight">{formatValue(kpi.current)}</strong>{kpi.current !== null && kpi.unit ? <span className="ml-1 text-sm text-slate-500">{kpi.unit}</span> : null}</div>{delta !== null ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{delta > 0 ? "+" : ""}{formatValue(delta)}</span> : <span className="text-xs text-slate-400">pas encore de comparaison</span>}</div>
    <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">Cible : <strong className="text-slate-700">{target}</strong></span><span className={`rounded-full px-2 py-1 font-black ${status.tone}`}>{status.label}</span></div>
    {kpi.progress !== null ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, kpi.progress))}%` }} /></div> : null}
    {kpi.configurationStatus !== "ready" ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Configuration à préciser : {configLabel(kpi.configurationStatus)}.</p> : null}
    {kpi.notes ? <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer font-bold">Détail</summary><p className="mt-1 leading-5">{kpi.notes}</p></details> : null}
  </article>;
}

function QuickEntry({ kpi, onClose, onSaved }: { kpi: KpiView; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/data/kpi_entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kpi_id: kpi.id, measured_at: new Date().toISOString(), value: numeric, note: note.trim() || null }) });
      const result = await safeJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "Enregistrement impossible.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/45 sm:place-items-center sm:p-4" role="dialog" aria-modal="true"><section className="w-full rounded-t-[2rem] bg-white shadow-2xl sm:max-w-md sm:rounded-[2rem]"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Nouvelle mesure</p><h2 className="text-xl font-black">{kpi.name}</h2></div><button className="button-secondary size-10 px-0" onClick={onClose}><X size={18} /></button></header><form className="grid gap-4 p-5" onSubmit={submit}><label className="field"><span>Valeur{kpi.unit ? ` (${kpi.unit})` : ""}</span><input className="input" autoFocus type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} /></label><label className="field"><span>Note (facultative)</span><textarea className="input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajouter uniquement un contexte utile" /></label>{error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}<div className="flex justify-end gap-2"><button type="button" className="button-secondary" onClick={onClose}>Annuler</button><button className="button-primary" disabled={saving || value === ""}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{saving ? "Enregistrement…" : "Enregistrer"}</button></div></form></section></div>;
}

function targetLabel(kpi: KpiView) { if (kpi.targetType === "range" && kpi.targetMin !== null && kpi.targetMax !== null) return `${formatValue(kpi.targetMin)}–${formatValue(kpi.targetMax)} ${kpi.unit}`.trim(); if (kpi.targetValue !== null) { const prefix = kpi.targetType === "min" ? "≥ " : kpi.targetType === "max" ? "≤ " : ""; return `${prefix}${formatValue(kpi.targetValue)} ${kpi.unit}`.trim(); } return "non fixée"; }
function statusLabel(kpi: KpiView) { if (kpi.configurationStatus !== "ready") return { label: "À préciser", tone: "bg-amber-50 text-amber-800" }; if (kpi.current === null) return { label: "À mesurer", tone: "bg-slate-100 text-slate-600" }; if (kpi.progress === null) return { label: "Suivi actif", tone: "bg-blue-50 text-blue-700" }; if (kpi.progress >= 100) return { label: "Dans la cible", tone: "bg-emerald-50 text-emerald-700" }; return { label: "En cours", tone: "bg-blue-50 text-blue-700" }; }
function AreaBadge({ area }: { area: KpiView["area"] }) { if (!area) return null; return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${areaIconTone(area)}`}>{area.toUpperCase()}</span>; }
function areaIconTone(area: KpiView["area"] | "pro" | "perso" | "religion") { return area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : area === "religion" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"; }
function filterTone(area: Area) { if (area === "pro") return "bg-blue-600 text-white"; if (area === "perso") return "bg-rose-500 text-white"; if (area === "religion") return "bg-amber-500 text-white"; return "bg-slate-950 text-white"; }
function cadenceLabel(value: string) { return value === "daily" ? "Quotidien" : value === "weekly" ? "Hebdomadaire" : value === "monthly" ? "Mensuel" : value === "quarterly" ? "Trimestriel" : value === "adhoc" ? "Ponctuel" : "Cadence à préciser"; }
function configLabel(value: string) { return value === "to_validate" ? "valeur à valider" : value === "to_complete" ? "informations à compléter" : "paramètres à configurer"; }
function formatValue(value: number | null) { if (value === null) return "—"; return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value); }
async function safeJson(response: Response): Promise<ApiEnvelope> { try { return await response.json() as ApiEnvelope; } catch { return { ok: false, error: { message: "Réponse serveur invalide." } }; } }
