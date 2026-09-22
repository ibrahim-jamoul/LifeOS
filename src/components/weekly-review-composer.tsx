"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  weekStart: string;
  autoWins: string;
  autoMisses: string;
  autoRisks: string;
  existing?: { causes?: string | null; pauseOrStop?: string | null; top3?: string | null; notes?: string | null };
};

type Envelope = { ok: boolean; error?: { message?: string } };

export function WeeklyReviewComposer({ weekStart, autoWins, autoMisses, autoRisks, existing }: Props) {
  const router = useRouter();
  const [causes, setCauses] = useState(existing?.causes ?? "");
  const [pauseOrStop, setPauseOrStop] = useState(existing?.pauseOrStop ?? "");
  const [top3, setTop3] = useState(existing?.top3 ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!top3.trim()) {
      setError("Définis les trois priorités de la semaine suivante.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/data/weekly_reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart,
          wins: autoWins,
          misses: autoMisses,
          causes: causes || null,
          risks: autoRisks || null,
          pause_or_stop: pauseOrStop || null,
          next_week_top3: top3,
          notes: notes || null,
        }),
      });
      const result = await response.json() as Envelope;
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "La revue n’a pas pu être enregistrée.");
      setMessage("Revue enregistrée. Tes décisions sont maintenant historisées.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La revue n’a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card grid gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <ReadOnlyFact title="Ce qui a avancé" body={autoWins} />
        <ReadOnlyFact title="Points à traiter" body={autoMisses} />
      </div>
      <label className="field">Pourquoi cette semaine a ressemblé à ça ?<textarea className="input min-h-28" value={causes} onChange={(event) => setCauses(event.target.value)} placeholder="Uniquement ce que LifeOS ne peut pas déduire : fatigue, imprévu, mauvaise estimation…" /></label>
      <label className="field">Que faut-il arrêter, réduire ou mettre en pause ?<textarea className="input min-h-24" value={pauseOrStop} onChange={(event) => setPauseOrStop(event.target.value)} /></label>
      <label className="field">Top 3 de la semaine suivante<textarea className="input min-h-28" value={top3} onChange={(event) => setTop3(event.target.value)} placeholder={"1. …\n2. …\n3. …"} /></label>
      <label className="field">Note libre (optionnel)<textarea className="input min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      {message ? <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><Check size={17} />{message}</p> : null}
      <div><button className="button-primary" disabled={saving} onClick={() => void save()}>{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Check size={17} />}Valider ma revue</button></div>
    </section>
  );
}

function ReadOnlyFact({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><h3 className="font-bold">{title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{body}</p></div>;
}
