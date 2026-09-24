"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Inbox, LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Envelope = { ok: boolean; error?: { message?: string } };
type LifeArea = "pro" | "perso" | "religion" | "";

export function QuickCapture({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<LifeArea>("");
  const [planToday, setPlanToday] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function open() {
    setError(null);
    setSaved(false);
    dialogRef.current?.showModal();
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }

  function close() {
    dialogRef.current?.close();
  }

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), lifeArea: lifeArea || null, planToday, notes: null }),
      });
      const result = await response.json() as Envelope;
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "La capture n’a pas pu être enregistrée.");
      setSaved(true);
      setTitle("");
      router.refresh();
      window.setTimeout(() => close(), 500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La capture n’a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className={compact ? "button-secondary size-10 px-0" : "button-primary w-full"} onClick={open} aria-label="Capture rapide">
        <Plus size={18} />{compact ? null : <span>Capture</span>}
      </button>
      <dialog ref={dialogRef} className="m-auto w-[min(92vw,36rem)] rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40" onClose={() => setError(null)}>
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Capture rapide</p><h2 className="mt-1 text-xl font-bold">Vide ta tête, classe en quelques secondes.</h2></div>
            <button className="button-secondary size-9 px-0" onClick={close} aria-label="Fermer"><X size={17} /></button>
          </div>
        </div>
        <form className="grid gap-4 p-5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <label className="field">À retenir / faire<input ref={inputRef} className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Écrire ce que tu veux retenir ou planifier" maxLength={240} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">Domaine<select className="input" value={lifeArea} onChange={(event) => setLifeArea(event.target.value as LifeArea)}><option value="">À classer plus tard</option><option value="pro">PRO</option><option value="perso">PERSO</option><option value="religion">RELIGION</option></select></label>
            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-medium sm:mt-6"><input type="checkbox" checked={planToday} onChange={(event) => setPlanToday(event.target.checked)} />Afficher aujourd’hui</label>
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Inbox size={16} className="mt-0.5 shrink-0" />La V2 capture volontairement une tâche simple et sûre. Les captures ambiguës restent à classer plus tard plutôt que d’être interprétées automatiquement de travers.</p>
          {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          {saved ? <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><Check size={17} />Enregistré.</p> : null}
          <div className="flex justify-end"><button className="button-primary" disabled={saving || !title.trim()} type="submit">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />}Ajouter</button></div>
        </form>
      </dialog>
    </>
  );
}
