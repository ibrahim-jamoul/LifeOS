"use client";

import { useState } from "react";
import { Bot, LoaderCircle, Send, ShieldCheck } from "lucide-react";

type Scope = "goals" | "religion" | "arabic" | "quran" | "finances" | "health" | "documents" | "memories";
type Envelope = { ok: true; data: { threadId: string; scope: Scope; answer: string } } | { ok: false; error: { message: string } };

const scopes: { value: Scope; label: string }[] = [
  { value: "goals", label: "Objectifs, projets & KPI" }, { value: "religion", label: "Religion" },
  { value: "arabic", label: "Arabe" }, { value: "quran", label: "Coran" }, { value: "finances", label: "Finances" },
  { value: "health", label: "Santé & habitudes" }, { value: "documents", label: "Métadonnées documents" }, { value: "memories", label: "Souvenirs" },
];

export function AssistantConsole({ enabled }: { enabled: boolean }) {
  const [scope, setScope] = useState<Scope>("goals");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!enabled || question.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question.trim(), scope, ...(threadId ? { threadId } : {}) }) });
      const result = await response.json() as Envelope;
      if (!result.ok) throw new Error(result.error.message);
      setAnswer(result.data.answer);
      setThreadId(result.data.threadId);
      setQuestion("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Réponse IA impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Lecture seule</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Assistant IA</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Choisissez explicitement les données à transmettre. Aucun fichier binaire ni outil d’écriture n’est fourni au modèle.</p></header>
      {!enabled ? <section className="card flex items-start gap-4 border-amber-200 bg-amber-50"><Bot className="mt-0.5 shrink-0 text-amber-800" /><div><h2 className="font-bold text-amber-950">Configuration serveur requise</h2><p className="mt-2 text-sm leading-6 text-amber-900">LifeOS reste entièrement utilisable sans IA. Pour activer cette page, renseignez <code>AI_API_KEY</code>, <code>AI_MODEL</code> et éventuellement <code>AI_BASE_URL</code> dans l’environnement serveur.</p></div></section> : (
        <form className="card grid gap-4" onSubmit={submit}>
          <label className="field"><span>Périmètre transmis</span><select className="input" value={scope} onChange={(event) => { setScope(event.target.value as Scope); setThreadId(null); setAnswer(null); }}>{scopes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="field"><span>Question</span><textarea className="input min-h-32" value={question} onChange={(event) => setQuestion(event.target.value)} minLength={2} maxLength={2000} required placeholder="Que dois-je prioriser cette semaine à partir de mes données ?" /></label>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={16} />Requête serveur, lecture seule, contexte limité.</p><button className="button-primary" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}{loading ? "Analyse…" : "Demander"}</button></div>
        </form>
      )}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div> : null}
      {answer ? <section className="card"><h2 className="flex items-center gap-2 font-bold"><Bot size={19} />Réponse</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{answer}</div><p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500">Réponse générée à vérifier; aucune écriture LifeOS n’a été effectuée.</p></section> : null}
    </div>
  );
}
