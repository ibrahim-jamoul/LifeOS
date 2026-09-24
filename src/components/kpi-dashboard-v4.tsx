"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Check, Heart, LoaderCircle, MoonStar, Plus, Sparkles, Target, X } from "lucide-react";

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

  const global = useMemo(() => {
    const measured = kpis.filter((kpi) => kpi.progress !== null);
    const configured = kpis.filter((kpi) => kpi.configurationStatus === "ready").length;
    const manual = kpis.filter((kpi) => kpi.measurementMode === "manual").length;
    const score = measured.length ? Math.round(measured.reduce((sum, kpi) => sum + (kpi.progress ?? 0), 0) / measured.length) : null;
    return { configured, total: kpis.length, manual, score };
  }, [kpis]);

  const summaries = (["pro", "perso", "religion"] as const).map((key) => {
    const rows = kpis.filter((kpi) => kpi.area === key && kpi.progress !== null);
    const score = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.progress ?? 0), 0) / rows.length) : null;
    return {
      area: key,
      score,
      measured: rows.length,
      total: kpis.filter((kpi) => kpi.area === key).length,
      automatic: kpis.filter((kpi) => kpi.area === key && kpi.measurementMode === "derived").length,
    };
  });

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-blue-100 bg-white/92 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker text-blue-700">KPI · pilotage</p>
            <h1 className="section-title mt-1">Mes KPI</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Une lecture simple : ce qui est déjà mesuré automatiquement, ce qui est bien configuré, et ce qui demande encore une saisie manuelle ou une précision.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="bg-blue-50 text-blue-700">{global.configured}/{global.total} prêts</Pill>
              <Pill tone="bg-emerald-50 text-emerald-700">{global.total - global.manual} automatiques</Pill>
              <Pill tone="bg-slate-100 text-slate-700">{global.manual} manuels</Pill>
            </div>
          </div>
          <div className="grid min-w-[18rem] gap-3 sm:grid-cols-2 lg:w-[24rem] lg:grid-cols-1 xl:grid-cols-2">
            <StatBox label="Score global" value={global.score === null ? "—" : `${global.score}%`} hint="moyenne des KPI mesurables" tone="bg-blue-50 text-blue-800" />
            <StatBox label="KPI prêts" value={`${global.configured}`} hint="configuration finalisée" tone="bg-emerald-50 text-emerald-800" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3 md:grid-cols-3">
          {summaries.map((item) => <AreaSummary key={item.area} {...item} onClick={() => setArea(item.area)} active={area === item.area} />)}
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Filtrer</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "pro", "perso", "religion"] as const).map((value) => (
              <button key={value} onClick={() => setArea(value)} className={area === value ? filterTone(value) : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"}>
                {value === "all" ? "Tous" : value.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">Le bouton <strong>+</strong> n’apparaît que lorsqu’une mesure manuelle reste pertinente.</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {visible.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} onAdd={kpi.measurementMode === "manual" ? () => setEntryKpi(kpi) : undefined} />)}
      </section>
      {visible.length === 0 ? <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-8 text-center text-sm text-slate-500 shadow-sm">Aucun KPI dans ce filtre.</div> : null}

      {entryKpi ? <QuickEntry kpi={entryKpi} onClose={() => setEntryKpi(null)} onSaved={() => { setEntryKpi(null); router.refresh(); }} /> : null}
    </div>
  );
}

function AreaSummary({ area, score, measured, total, automatic, active, onClick }: { area: "pro" | "perso" | "religion"; score: number | null; measured: number; total: number; automatic: number; active: boolean; onClick: () => void }) {
  const Icon = area === "pro" ? BriefcaseBusiness : area === "perso" ? Heart : MoonStar;
  return (
    <button onClick={onClick} className={`rounded-[1.75rem] border bg-white/95 p-5 text-left shadow-sm transition ${active ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid size-12 place-items-center rounded-2xl ${areaIconTone(area)}`}><Icon size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{area}</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">{score === null ? "—" : `${score}%`}</h2>
            </div>
            <MiniRing progress={score} tone={area} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <MetricTile label="Mesurés" value={`${measured}/${total}`} />
            <MetricTile label="Automatiques" value={`${automatic}`} />
          </div>
        </div>
      </div>
    </button>
  );
}

function KpiCard({ kpi, onAdd }: { kpi: KpiView; onAdd?: () => void }) {
  const delta = kpi.current !== null && kpi.previous !== null ? kpi.current - kpi.previous : null;
  const target = targetLabel(kpi);
  const status = statusLabel(kpi);
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${areaIconTone(kpi.area)}`}><Activity size={18} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-slate-950">{kpi.name}</h2>
            <AreaBadge area={kpi.area} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{cadenceLabel(kpi.cadence)} · {kpi.measurementMode === "derived" ? "calcul automatique" : "saisie manuelle"}</p>
        </div>
        {onAdd ? (
          <button className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={onAdd} aria-label={`Ajouter une mesure pour ${kpi.name}`}><Plus size={18} /></button>
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700" title="Calcul automatique"><Sparkles size={17} /></span>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="flex items-end gap-2">
            <strong className="text-4xl tracking-[-0.05em] text-slate-950">{formatValue(kpi.current)}</strong>
            {kpi.current !== null && kpi.unit ? <span className="pb-1 text-sm text-slate-500">{kpi.unit}</span> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">Cible : <strong className="text-slate-800">{target}</strong></span>
            <span className={`rounded-full px-2.5 py-1 font-black ${status.tone}`}>{status.label}</span>
          </div>
        </div>
        <div className="sm:text-right">
          {delta !== null ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{delta > 0 ? "+" : ""}{formatValue(delta)}</span> : <span className="text-xs text-slate-400">pas encore de comparaison</span>}
        </div>
      </div>

      {kpi.progress !== null ? (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>Progression</span><strong className="text-slate-700">{Math.max(0, Math.min(100, Math.round(kpi.progress)))}%</strong></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, kpi.progress))}%` }} /></div>
        </div>
      ) : null}
      {kpi.configurationStatus !== "ready" ? <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Configuration à préciser : {configLabel(kpi.configurationStatus)}.</p> : null}
      {kpi.notes ? <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer font-bold">Détail</summary><p className="mt-1 leading-5">{kpi.notes}</p></details> : null}
    </article>
  );
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
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/data/kpi_entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kpi_id: kpi.id, measured_at: new Date().toISOString(), value: numeric, note: note.trim() || null }) });
      const result = await safeJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "Enregistrement impossible.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/45 sm:place-items-center sm:p-4" role="dialog" aria-modal="true"><section className="w-full rounded-t-[2rem] bg-white shadow-2xl sm:max-w-md sm:rounded-[2rem]"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Nouvelle mesure</p><h2 className="text-xl font-black">{kpi.name}</h2></div><button className="button-secondary size-10 px-0" onClick={onClose}><X size={18} /></button></header><form className="grid gap-4 p-5" onSubmit={submit}><label className="field"><span>Valeur{kpi.unit ? ` (${kpi.unit})` : ""}</span><input className="input" autoFocus type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} /></label><label className="field"><span>Note (facultative)</span><textarea className="input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajouter uniquement un contexte utile" /></label>{error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}<div className="flex justify-end gap-2"><button type="button" className="button-secondary" onClick={onClose}>Annuler</button><button className="button-primary" disabled={saving || value === ""}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{saving ? "Enregistrement…" : "Enregistrer"}</button></div></form></section></div>;
}

function StatBox({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  return <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</h2><p className="mt-1 text-xs text-slate-500">{hint}</p></div><div className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Target size={18} /></div></div></div>;
}
function MetricTile({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="block text-base font-black text-slate-950">{value}</span><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span></div>; }
function MiniRing({ progress, tone }: { progress: number | null; tone: "pro" | "perso" | "religion" }) { const degree = progress === null ? 0 : Math.max(0, Math.min(100, progress)); const color = tone === "pro" ? "#2563eb" : tone === "perso" ? "#e11d48" : "#d97706"; return <div className="grid size-12 place-items-center rounded-full bg-slate-50" style={{ background: `conic-gradient(${color} ${degree}%, #e5e7eb 0)` }}><div className="grid size-9 place-items-center rounded-full bg-white text-[10px] font-black text-slate-700">{progress === null ? "—" : `${Math.round(progress)}%`}</div></div>; }
function Pill({ children, tone }: { children: React.ReactNode; tone: string }) { return <span className={`rounded-full px-3 py-1.5 text-xs font-black ${tone}`}>{children}</span>; }
function targetLabel(kpi: KpiView) { if (kpi.targetType === "range" && kpi.targetMin !== null && kpi.targetMax !== null) return `${formatValue(kpi.targetMin)}–${formatValue(kpi.targetMax)} ${kpi.unit}`.trim(); if (kpi.targetValue !== null) { const prefix = kpi.targetType === "min" ? "≥ " : kpi.targetType === "max" ? "≤ " : ""; return `${prefix}${formatValue(kpi.targetValue)} ${kpi.unit}`.trim(); } return "non fixée"; }
function statusLabel(kpi: KpiView) { if (kpi.configurationStatus !== "ready") return { label: "À préciser", tone: "bg-amber-50 text-amber-800" }; if (kpi.current === null) return { label: "À mesurer", tone: "bg-slate-100 text-slate-600" }; if (kpi.progress === null) return { label: "Suivi actif", tone: "bg-blue-50 text-blue-700" }; if (kpi.progress >= 100) return { label: "Dans la cible", tone: "bg-emerald-50 text-emerald-700" }; return { label: "En cours", tone: "bg-blue-50 text-blue-700" }; }
function AreaBadge({ area }: { area: KpiView["area"] }) { if (!area) return null; return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${areaIconTone(area)}`}>{area.toUpperCase()}</span>; }
function areaIconTone(area: KpiView["area"] | "pro" | "perso" | "religion") { return area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : area === "religion" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"; }
function filterTone(area: Area) { if (area === "pro") return "rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white"; if (area === "perso") return "rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white"; if (area === "religion") return "rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white"; return "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"; }
function cadenceLabel(value: string) { return value === "daily" ? "Quotidien" : value === "weekly" ? "Hebdomadaire" : value === "monthly" ? "Mensuel" : value === "quarterly" ? "Trimestriel" : value === "adhoc" ? "Ponctuel" : "Cadence à préciser"; }
function configLabel(value: string) { return value === "to_validate" ? "valeur à valider" : value === "to_complete" ? "informations à compléter" : "paramètres à configurer"; }
function formatValue(value: number | null) { if (value === null) return "—"; return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value); }
async function safeJson(response: Response): Promise<ApiEnvelope> { try { return await response.json() as ApiEnvelope; } catch { return { ok: false, error: { message: "Réponse serveur invalide." } }; } }
