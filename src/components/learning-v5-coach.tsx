"use client";
import { useState } from "react";
import { Bot, LoaderCircle, ShieldCheck } from "lucide-react";
type Kind = "lesson" | "memo" | "quiz" | "review";
type Response = { ok: true; data: { answer: string; persisted: false } } | { ok: false; error: { message: string } };
const panel = "rounded-[1.5rem] border border-[#e5e0d7] bg-white p-4 shadow-sm sm:p-5";
export function LearningCoachV5({ pathId }: { pathId: string }) {
  const [kind,setKind] = useState<Kind>("lesson");
  const [consent,setConsent] = useState(false);
  const [question,setQuestion] = useState("");
  const [answer,setAnswer] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function run(){setBusy(true);setError("");setAnswer("");try{
    const response = await fetch("/api/learning/v5/coach",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pathId,kind,consent,question}),cache:"no-store" });
    const data: Response = await response.json();
    if(!response.ok||!data.ok)throw new Error(data.ok?"Erreur du service pédagogique":data.error.message);
    setAnswer(data.data.answer);
  }catch(e:unknown){setError(e instanceof Error?e.message:"Impossible d'interroger l'IA")}finally{setBusy(false)}}
  return <section className={panel}>
    <div className="flex items-center gap-2"><Bot size={20} className="text-emerald-800"/><h2 className="text-lg font-bold">Mon formateur IA</h2></div>
    <p className="mt-1 text-sm text-slate-500">Aide facultative. Aucun changement dans LifeOS sans votre action.</p>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['lesson','Mini-leçon'],['memo','Fiche mémo'],['quiz','Quiz proposé'],['review','Révision']] as const).map(([value,label])=><button key={value} type="button" className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${value===kind?"border-emerald-800 bg-emerald-50":"border-slate-200"}`} onClick={()=>setKind(value)} aria-pressed={kind===value}>{label}</button>)}</div>
    <textarea maxLength={500} className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Question précise (facultative)" />
    <label className="mt-3 flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)}/><span>J’autorise l’envoi au fournisseur IA du titre, modules, 20 dernières fiches et 15 dernières séances de ce parcours. Pas de documents binaires ni des autres domaines.</span></label>
    <button disabled={busy||!consent} onClick={run} type="button" className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#185b4a] px-4 font-semibold text-white disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={17}/>:<ShieldCheck size={17}/>} Générer une proposition</button>
    {error?<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">{error}</p>:null}
    {answer?<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Proposition IA non enregistrée</p><div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{answer}</div><p className="mt-3 text-xs text-slate-500">Contrôlez les sources et les réponses avant de les utiliser ou de les mémoriser.</p></div>:null}
  </section>;
}
