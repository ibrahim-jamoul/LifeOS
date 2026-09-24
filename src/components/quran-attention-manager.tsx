"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CircleAlert, LoaderCircle, Plus, RotateCcw, X } from "lucide-react";

type RevisionPoint = {
  id: string;
  quranItemId: string | null;
  surahNumber: number;
  ayahNumber: number;
  issueType: string;
  note: string | null;
  priority: number;
  status: "active" | "resolved" | "archived";
  occurrenceCount: number;
  lastSeenAt: string;
  nextReviewAt: string | null;
  resolvedAt: string | null;
};

type QuranItemOption = { id: string; label: string; surahNumber: number; startAyah: number | null; endAyah: number | null };
type ApiEnvelope = { ok: boolean; error?: { message?: string } };

const issueOptions = [
  ["memorization", "Mémorisation"], ["hesitation", "Hésitation"], ["confusion", "Confusion"],
  ["pronunciation", "Prononciation"], ["tajwid", "Tajwid"], ["other", "Autre"],
] as const;

export function QuranAttentionManager({ points, quranItems }: { points: readonly RevisionPoint[]; quranItems: readonly QuranItemOption[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [quranItemId, setQuranItemId] = useState("");
  const [surahNumber, setSurahNumber] = useState("");
  const [ayahNumber, setAyahNumber] = useState("");
  const [issueType, setIssueType] = useState("memorization");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("1");
  const [nextReviewOn, setNextReviewOn] = useState("");

  const visiblePoints = useMemo(() => points.filter((point) => showResolved ? point.status !== "archived" : point.status === "active"), [points, showResolved]);
  const activeCount = points.filter((point) => point.status === "active").length;
  const resolvedCount = points.filter((point) => point.status === "resolved").length;

  function selectItem(value: string) {
    setQuranItemId(value);
    const item = quranItems.find((entry) => entry.id === value);
    if (item) {
      setSurahNumber(String(item.surahNumber));
      if (item.startAyah) setAyahNumber(String(item.startAyah));
    }
  }

  async function createPoint(event: React.FormEvent) {
    event.preventDefault();
    setPending("create");
    setError(null);
    try {
      const nextReviewAt = nextReviewOn ? new Date(`${nextReviewOn}T08:00:00`).toISOString() : null;
      const response = await fetch("/api/learning/quran-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quranItemId: quranItemId || null, surahNumber, ayahNumber, issueType, note, priority, nextReviewAt }),
      });
      const result = await readEnvelope(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? "Création impossible.");
      setDrawerOpen(false);
      setQuranItemId(""); setSurahNumber(""); setAyahNumber(""); setIssueType("memorization"); setNote(""); setPriority("1"); setNextReviewOn("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible.");
    } finally {
      setPending(null);
    }
  }

  async function act(point: RevisionPoint, action: "fragile" | "mastered" | "reopen") {
    setPending(`${point.id}:${action}`);
    setError(null);
    try {
      const response = await fetch(`/api/learning/quran-points/${point.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await readEnvelope(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? "Mise à jour impossible.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-[#ead9cc] bg-[#fffdf8] shadow-sm">
      <header className="flex flex-col gap-4 border-b border-[#eee4d8] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">À surveiller</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Points d’attention Coran</h2>
          <p className="mt-1 text-sm text-slate-600">{activeCount} actif{activeCount > 1 ? "s" : ""} · {resolvedCount} maîtrisé{resolvedCount > 1 ? "s" : ""}</p>
        </div>
        <button className="button-primary" onClick={() => setDrawerOpen(true)}><Plus size={17} /> Signaler une difficulté</button>
      </header>

      <div className="flex items-center gap-2 px-5 pt-4 sm:px-6">
        <button className={`rounded-full px-3 py-1.5 text-xs font-bold ${!showResolved ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setShowResolved(false)}>Actifs</button>
        <button className={`rounded-full px-3 py-1.5 text-xs font-bold ${showResolved ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setShowResolved(true)}>Avec maîtrisés</button>
      </div>

      {error ? <p className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:mx-6">{error}</p> : null}

      {visiblePoints.length === 0 ? (
        <div className="p-8 text-center"><Check className="mx-auto text-emerald-700" /><p className="mt-2 font-bold">Aucun point d’attention actif.</p><p className="mt-1 text-sm text-slate-500">Signalez seulement les passages qui nécessitent réellement une révision ciblée.</p></div>
      ) : (
        <div className="divide-y divide-[#eee4d8] p-5 sm:p-6">
          {visiblePoints.map((point) => (
            <article key={point.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><strong className="text-lg">Sourate {point.surahNumber} · verset {point.ayahNumber}</strong><PriorityBadge value={point.priority} />{point.status === "resolved" ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Maîtrisé</span> : null}</div>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{issueLabel(point.issueType)} · {point.occurrenceCount} occurrence{point.occurrenceCount > 1 ? "s" : ""}</p>
                  {point.note ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{point.note}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">Dernière occurrence : {formatDate(point.lastSeenAt)}{point.nextReviewAt ? ` · prochaine révision : ${formatDate(point.nextReviewAt)}` : ""}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {point.status === "active" ? <>
                    <button className="button-secondary min-h-9 px-3 py-1.5" disabled={pending?.startsWith(point.id)} onClick={() => void act(point, "fragile")}>{pending === `${point.id}:fragile` ? <LoaderCircle className="animate-spin" size={15} /> : <CircleAlert size={15} />} Toujours fragile</button>
                    <button className="button-primary min-h-9 px-3 py-1.5" disabled={pending?.startsWith(point.id)} onClick={() => void act(point, "mastered")}>{pending === `${point.id}:mastered` ? <LoaderCircle className="animate-spin" size={15} /> : <Check size={15} />} Maîtrisé</button>
                  </> : point.status === "resolved" ? <button className="button-secondary min-h-9 px-3 py-1.5" disabled={pending?.startsWith(point.id)} onClick={() => void act(point, "reopen")}><RotateCcw size={15} /> Réouvrir</button> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40" role="dialog" aria-modal="true" aria-label="Nouveau point d’attention">
          <button className="absolute inset-0" onClick={() => setDrawerOpen(false)} aria-label="Fermer" />
          <form className="relative z-10 h-full w-full max-w-xl overflow-y-auto bg-[#fffdf8] p-5 shadow-2xl sm:p-7" onSubmit={createPoint}>
            <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Coran</p><h3 className="mt-1 text-2xl font-black">Nouveau point d’attention</h3><p className="mt-1 text-sm text-slate-600">Un ticket persistant pour retrouver ce passage pendant vos révisions.</p></div><button type="button" className="button-secondary size-10 px-0" onClick={() => setDrawerOpen(false)}><X size={18} /></button></header>
            <div className="mt-6 grid gap-4">
              <label className="field">Élément Coran lié (optionnel)<select className="input" value={quranItemId} onChange={(event) => selectItem(event.target.value)}><option value="">Aucun élément lié</option>{quranItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="field">Sourate<input className="input" type="number" min="1" max="114" required value={surahNumber} onChange={(event) => setSurahNumber(event.target.value)} /></label><label className="field">Verset<input className="input" type="number" min="1" required value={ayahNumber} onChange={(event) => setAyahNumber(event.target.value)} /></label></div>
              <label className="field">Type de difficulté<select className="input" value={issueType} onChange={(event) => setIssueType(event.target.value)}>{issueOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="field">Note personnelle<textarea className="input min-h-28 resize-y" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex. Je confonds le début avec le verset précédent." /></label>
              <label className="field">Priorité<select className="input" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="1">Normale</option><option value="2">Haute</option><option value="3">Très haute</option></select></label>
              <label className="field">Prochaine révision (optionnel)<input className="input" type="date" value={nextReviewOn} onChange={(event) => setNextReviewOn(event.target.value)} /></label>
              {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
              <button className="button-primary mt-2" disabled={pending === "create"}>{pending === "create" ? <LoaderCircle className="animate-spin" size={17} /> : <AlertTriangle size={17} />} Enregistrer le point</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function issueLabel(value: string) { return issueOptions.find(([key]) => key === value)?.[1] ?? value; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)); }
function PriorityBadge({ value }: { value: number }) { const cls = value >= 3 ? "bg-red-100 text-red-800" : value === 2 ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{value >= 3 ? "Très haute" : value === 2 ? "Haute" : "Normale"}</span>; }
async function readEnvelope(response: Response): Promise<ApiEnvelope> { try { return await response.json() as ApiEnvelope; } catch { return { ok: false, error: { message: "Réponse serveur invalide." } }; } }
