"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LearningCoachV5 } from "@/components/learning-v5-coach";
import { ArrowRight, CalendarDays, Check, ChevronDown, FileQuestion, FlaskConical, LoaderCircle, Plus, Search, TrendingUp } from "lucide-react";

const card = "rounded-[1.5rem] border border-[#e5e0d7] bg-white p-4 shadow-sm sm:p-5";
const action = "min-h-11 rounded-xl bg-[#185b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const ghost = "min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50";
const input = "min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
type ResponseData<T> = { ok: true; data: T } | { ok: false; error: { message: string } };
async function call<T>(command: object | null, query = ""): Promise<T> {
  const response = await fetch(`/api/learning/v5/advanced${query}`, { method: command ? "POST" : "GET", headers: command ? { "Content-Type": "application/json" } : undefined, body: command ? JSON.stringify(command) : undefined, cache: "no-store" });
  const json: ResponseData<T> = await response.json();
  if (!response.ok || !json.ok) throw new Error(json.ok ? `HTTP ${response.status}` : json.error.message);
  return json.data;
}
const day = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const SKILLS: Record<string, readonly string[]> = {
  arabic: ["Texte avec voyelles", "Compréhension", "Lecture sans voyelles", "Vocabulaire", "Écriture"],
  english: ["Écoute", "Entretien", "Réunion", "Présentation", "Rédaction"],
  certification: ["Théorie", "Lab", "Examen blanc", "Projet concret"],
  professional: ["Cours", "Mise en pratique", "Livrable", "Présentation"],
  religion: ["Seerah", "Tafsir", "Fiqh", "Hadith", "Dua"],
  reading: ["Lire", "Idée importante", "Synthèse", "Application"],
  finance: ["Comprendre", "Analyser", "Mettre en pratique"],
  business: ["Étude", "Décision", "Test", "Livrable"],
};
const CATEGORY: Record<string, "general" | "lab" | "arabic" | "english" | "quran" | "certification" | "reading" | "business"> = {
  arabic: "arabic", english: "english", certification: "certification", religion: "general", reading: "reading", business: "business", finance: "business", professional: "lab",
};

type QuizItem = { id: string; title: string; mode: "practice" | "mock"; published: boolean };
type QuizList = { quizzes: QuizItem[] };
export function LearningPathPlus({ pathId, domain, pathTitle, weeklyMinutes, purpose, activities, refresh }: { pathId: string; domain: string; pathTitle: string; weeklyMinutes: number; purpose?: string | null; activities: { id: string; title: string }[]; refresh: () => void }) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizMode, setQuizMode] = useState<"practice" | "mock">("practice");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [skill, setSkill] = useState((SKILLS[domain] || ["Découvrir", "Pratiquer", "Appliquer"])[0]);
  const [arabicStages, setArabicStages] = useState<string[]>(["Texte avec voyelles"]);
  const [editedTitle, setEditedTitle] = useState(pathTitle);
  const [editedMinutes, setEditedMinutes] = useState(weeklyMinutes);
  const [editedPurpose, setEditedPurpose] = useState(purpose ?? "");
  const [result, setResult] = useState<"studied" | "practiced" | "applied" | "blocked">("studied");
  const [confidence, setConfidence] = useState(3);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [plannedOn, setPlannedOn] = useState(day());
  const [planningActivity, setPlanningActivity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(() => { call<QuizList>(null, `?view=quiz_list&pathId=${encodeURIComponent(pathId)}`).then((response) => setQuizzes(response.quizzes)).catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur des quiz")); }, [pathId]);
  useEffect(() => { load(); }, [load]);
  async function save(command: object, done?: (value: unknown) => void) {
    setBusy(true); setError(""); setNotice("");
    try { const response: unknown = await call(command); done?.(response); setNotice("Enregistré."); load(); refresh(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Échec d'enregistrement"); }
    finally { setBusy(false); }
  }
  const skills = SKILLS[domain] || ["Découvrir", "Pratiquer", "Appliquer"];
  return <div className="mt-5 grid gap-4">
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p> : null}
    {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}
    <section className={card}>
      <div className="flex items-center gap-2"><FlaskConical size={20} className="text-emerald-800"/><h2 className="text-lg font-bold">Ma séance</h2></div>
      <p className="mt-1 text-sm text-slate-500">Une saisie rapide, adaptée à votre parcours. Enregistrez uniquement une séance réellement faite.</p>
      <p className="mt-4 text-sm font-semibold">J’ai travaillé…</p>
      <div className="mt-2 flex flex-wrap gap-2">{skills.map((option) => <button type="button" key={option} className={`${ghost} ${(domain === "arabic" ? arabicStages.includes(option) : skill===option) ? "border-emerald-700 bg-emerald-50" : ""}`} onClick={() => domain === "arabic" ? setArabicStages((old) => old.includes(option) ? old.filter((s) => s !== option) : [...old,option]) : setSkill(option)} aria-pressed={domain === "arabic" ? arabicStages.includes(option) : skill===option}>{option}</button>)}</div>{domain === "arabic" ? <p className="mt-1 text-xs text-slate-500">Cochez les étapes réellement réalisées (plusieurs possibles).</p> : null}
      {activities.length ? <label className="mt-4 block text-sm">Activité concernée (facultatif)
        <select className={`${input} mt-1 w-full`} value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}><option value="">Séance libre</option>{activities.map((activity)=><option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label> : null}
      <div className="mt-4 flex flex-wrap gap-2">{[5,15,30,45,60].map((time) => <button type="button" key={time} className={`${ghost} ${minutes===time ? "border-emerald-700 bg-emerald-50" : ""}`} aria-pressed={minutes===time} onClick={()=>setMinutes(time)}>{time} min</button>)}</div>
      <p className="mt-4 text-sm font-semibold">Résultat de la séance</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['studied','Étudié'],['practiced','Pratiqué'],['applied','Appliqué'],['blocked','Bloqué']] as const).map(([value,label])=><button type="button" key={value} className={`${ghost} ${result===value ? "border-emerald-700 bg-emerald-50" : ""}`} onClick={()=>setResult(value)} aria-pressed={result===value}>{label}</button>)}</div>
      <p className="mt-4 text-sm font-semibold">Confiance</p><div className="mt-2 flex gap-2">{[1,2,3,4].map((level)=><button type="button" key={level} className={`${ghost} flex-1 ${level===confidence ? "border-emerald-700 bg-emerald-50" : ""}`} onClick={()=>setConfidence(level)} aria-pressed={confidence===level}>{level}/4</button>)}</div>
      <button className="mt-3 flex items-center gap-1 text-sm text-slate-600" type="button" onClick={()=>setShowNote(!showNote)}><ChevronDown size={15}/> Ajouter une note facultative</button>
      {showNote ? <textarea className={`${input} mt-2 min-h-20 w-full`} maxLength={2500} placeholder="Erreur, point à reprendre, enseignement…" value={note} onChange={(e)=>setNote(e.target.value)}/> : null}
      <button type="button" disabled={busy || (domain === "arabic" && arabicStages.length === 0)} className={`${action} mt-4 w-full`} onClick={()=>save({ action: "record_detailed_session", pathId, activityId: selectedActivity || null, durationMinutes: minutes, confidence, result, sessionKind: CATEGORY[domain] || "general", details: domain === "arabic" ? { stages: arabicStages.join(" | ") } : { skill }, note }, () => { setNote(""); setShowNote(false); })}><Check className="inline" size={17}/> Enregistrer cette séance</button>
    </section>
    <section className={card}>
      <div className="flex items-center gap-2"><FileQuestion size={20} className="text-emerald-800"/><h2 className="text-lg font-bold">Quiz & examens blancs</h2></div>
      <p className="mt-1 text-sm text-slate-500">Questions vérifiables, scores conservés. Aucun résultat inventé : les questions sont créées à partir de vos supports.</p>
      {quizzes.length ? <div className="mt-3 grid gap-2">{quizzes.map((quiz)=><Link key={quiz.id} href={`/app/learning/quizzes/${quiz.id}`} className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"><span><strong>{quiz.title}</strong><span className="ml-2 text-slate-500">{quiz.mode === "mock" ? "Examen blanc" : "Entraînement"} · {quiz.published ? "Disponible" : "Brouillon"}</span></span><ArrowRight size={17}/></Link>)}</div> : <p className="mt-3 text-sm text-slate-500">Aucun quiz pour ce parcours.</p>}
      {createOpen ? <div className="mt-3 grid gap-2"><input className={`${input} w-full`} aria-label="Titre du quiz" value={quizTitle} onChange={(e)=>setQuizTitle(e.target.value)} placeholder="Titre du quiz" maxLength={160}/><div className="flex gap-2"><button type="button" className={quizMode === "practice" ? action : ghost} onClick={()=>setQuizMode("practice")}>Entraînement</button><button type="button" className={quizMode === "mock" ? action : ghost} onClick={()=>setQuizMode("mock")}>Examen blanc</button></div><button disabled={busy || !quizTitle.trim()} className={action} onClick={()=>save({action:"create_quiz",pathId,title:quizTitle,mode:quizMode},()=>{setQuizTitle("");setCreateOpen(false);})}>Créer le quiz</button></div> : <button className={`${ghost} mt-3`} type="button" onClick={()=>setCreateOpen(true)}><Plus className="inline" size={16}/> Ajouter un quiz</button>}
    </section>
    <details className={card}>
      <summary className="cursor-pointer text-sm font-semibold">Réglages du parcours (facultatif)</summary>
      <div className="mt-4 grid gap-2">
        <label className="text-sm">Titre<input className={`${input} mt-1 w-full`} maxLength={160} value={editedTitle} onChange={(e)=>setEditedTitle(e.target.value)}/></label>
        <label className="text-sm">Budget de temps hebdomadaire<select className={`${input} mt-1 w-full`} value={editedMinutes} onChange={(e)=>setEditedMinutes(Number(e.target.value))}>{[0,30,60,90,120,180,240,360].map((m)=><option key={m} value={m}>{m} min</option>)}</select></label>
        <label className="text-sm">Pourquoi ce parcours ? (facultatif)<textarea className={`${input} mt-1 min-h-20 w-full`} maxLength={1200} value={editedPurpose} onChange={(e)=>setEditedPurpose(e.target.value)}/></label>
        <button className={action} disabled={busy || !editedTitle.trim()} onClick={()=>save({action:"edit_path",pathId,title:editedTitle,weeklyMinutes:editedMinutes,purpose:editedPurpose})}>Enregistrer les réglages</button>
      </div>
    </details>
    <LearningCoachV5 pathId={pathId} />
    <section className={card}>
      <div className="flex items-center gap-2"><CalendarDays size={20} className="text-emerald-800"/><h2 className="text-lg font-bold">Planifier dans Aujourd’hui</h2></div>
      <p className="mt-1 text-sm text-slate-500">Uniquement sur demande explicite. Replanifier la même activité met à jour sa mission existante, sans doublon.</p>
      {activities.length ? <div className="mt-3 grid gap-2"><select aria-label="Activité à planifier" className={`${input} w-full`} value={planningActivity} onChange={(e)=>setPlanningActivity(e.target.value)}><option value="">Choisir une activité</option>{activities.map((activity)=><option key={activity.id} value={activity.id}>{activity.title}</option>)}</select><input type="date" aria-label="Date de planification" className={`${input} w-full`} value={plannedOn} onChange={(e)=>setPlannedOn(e.target.value)}/><button type="button" className={action} disabled={busy||!planningActivity||!plannedOn} onClick={()=>save({action:"plan_activity",activityId:planningActivity,plannedOn})}>Planifier cette activité</button></div> : <p className="mt-3 text-sm text-slate-500">Créez une activité avant de la planifier.</p>}
    </section>
  </div>;
}

type Quiz = { quiz: { id: string; path_id: string; title: string; published: boolean; mode: string }; questions: { id: string; prompt: string; choices: string[]; position: number; source_url?: string | null }[]; attempts: { id: string; score_percent: number; correct: number; total: number; submitted_at: string }[] };
type QuizResult = { attemptId: string; scorePercent: number; correct: number; total: number; results: { questionId: string; correctIndex: number; givenIndex: number | null; correct: boolean; explanation: string | null; sourceUrl: string | null }[] };
export function LearningQuizV5({ id }: { id: string }) {
  const [data, setData] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const load = useCallback(async () => { const value = await call<Quiz>(null, `?view=quiz&id=${encodeURIComponent(id)}`); setData(value); }, [id]);
  useEffect(()=>{ let active = true; load().catch((e:unknown)=>{if(active)setError(e instanceof Error?e.message:"Erreur")}).finally(()=>{if(active)setLoading(false)}); return ()=>{active=false}; }, [load]);
  async function submit(command: object, onSuccess?: (response: unknown) => void) { setBusy(true); setError(""); try { const r: unknown = await call(command); onSuccess?.(r); await load(); } catch (e:unknown) { setError(e instanceof Error?e.message:"Échec"); } finally { setBusy(false); } }
  if (loading) return <div className={card}><LoaderCircle className="inline animate-spin" size={16}/> Chargement…</div>;
  if (!data) return <p role="alert" className={card}>{error || "Quiz introuvable"}</p>;
  return <div className="mx-auto grid max-w-3xl gap-4 pb-10 text-slate-900">
    <Link className="text-sm font-semibold text-emerald-800" href={`/app/learning/paths/${data.quiz.path_id}`}>← Retour au parcours</Link>
    <header><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{data.quiz.mode === "mock" ? "Examen blanc" : "Quiz d’entraînement"}</p><h1 className="mt-1 text-3xl font-black">{data.quiz.title}</h1></header>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    {!data.quiz.published ? <section className={card}><h2 className="text-lg font-bold">Construire le quiz</h2><p className="mb-3 mt-1 text-sm text-slate-500">Ajoutez une question et sa réponse vérifiée. Après publication, les questions sont figées.</p>
      <label className="text-sm font-semibold">Question<textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} maxLength={1200} className={`${input} mt-1 min-h-20 w-full`} placeholder="Énoncé"/></label>
      <p className="mb-2 mt-4 text-sm font-semibold">Choix (sélectionner la bonne réponse)</p>{choices.map((choice, index)=><div className="mb-2 flex items-center gap-2" key={index}><input type="radio" name="correct-answer" checked={correctIndex===index} onChange={()=>setCorrectIndex(index)} aria-label={`Bonne réponse ${index+1}`}/><input className={`${input} min-w-0 flex-1`} value={choice} onChange={(e)=>setChoices(choices.map((x,i)=>i===index?e.target.value:x))} maxLength={500} placeholder={`Choix ${index+1}`}/></div>)}
      <input className={`${input} mt-2 w-full`} value={explanation} onChange={(e)=>setExplanation(e.target.value)} placeholder="Explication (facultative)" maxLength={2000}/><input className={`${input} mt-2 w-full`} value={sourceUrl} onChange={(e)=>setSourceUrl(e.target.value)} placeholder="Source HTTPS (facultative)" maxLength={1500}/>
      <button className={`${action} mt-3 w-full`} disabled={busy || prompt.trim().length<3 || choices.some((c)=>!c.trim())} onClick={()=>submit({action:"add_question",quizId:id,prompt,choices,correctIndex,explanation,sourceUrl},()=>{setPrompt("");setChoices(["","","",""]);setCorrectIndex(0);setExplanation("");setSourceUrl("")})}><Plus className="inline" size={16}/> Ajouter la question</button>
      <p className="mt-3 text-sm text-slate-500">{data.questions.length} question(s) créées</p>{data.questions.map((question,i)=><p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm" key={question.id}>{i+1}. {question.prompt}</p>)}
      <button className={`${action} mt-4 w-full`} disabled={busy||!data.questions.length} onClick={()=>submit({action:"publish_quiz",quizId:id})}>Publier le quiz</button>
    </section> : <>
      {!result ? <section className="grid gap-3">{data.questions.map((question,i)=><article key={question.id} className={card}><p className="text-xs text-slate-500">Question {i+1} / {data.questions.length}</p><h2 className="mb-3 mt-1 font-bold">{question.prompt}</h2><div className="grid gap-2">{question.choices.map((choice,j)=><button type="button" key={j} className={`min-h-12 rounded-xl border p-3 text-left text-sm ${answers[question.id]===j?"border-emerald-700 bg-emerald-50":"border-slate-200"}`} aria-pressed={answers[question.id]===j} onClick={()=>setAnswers((old)=>({...old,[question.id]:j}))}><span className="mr-2 font-bold">{String.fromCharCode(65+j)}.</span>{choice}</button>)}</div></article>)}</section> : <section className={card}><h2 className="text-2xl font-black">{result.scorePercent} % de réponses correctes</h2><p className="mt-1 text-sm text-slate-600">{result.correct} / {result.total}. Ce résultat est conservé dans l’historique, sans déclarer les connaissances maîtrisées automatiquement.</p><div className="mt-4 grid gap-3">{result.results.map((r,i)=><article key={r.questionId} className="rounded-xl border border-slate-200 p-3"><p className="font-semibold">{i+1}. {data.questions.find((q)=>q.id===r.questionId)?.prompt}</p><p className={`mt-1 text-sm ${r.correct?"text-emerald-800":"text-red-700"}`}>{r.correct?"Réponse correcte":"À revoir"} · Réponse attendue : {data.questions.find((q)=>q.id===r.questionId)?.choices[r.correctIndex]}</p>{r.explanation?<p className="mt-1 text-sm text-slate-600">{r.explanation}</p>:null}{r.sourceUrl?<a className="mt-1 inline-block text-sm text-emerald-800 underline" href={r.sourceUrl} rel="noopener noreferrer" target="_blank">Vérifier la source</a>:null}</article>)}</div></section>}
      {!result ? <button disabled={busy || !data.questions.length || Object.keys(answers).length !== data.questions.length} className={action} onClick={()=>submit({action:"submit_quiz",quizId:id,answers},(value)=>setResult(value as QuizResult))}>Valider mes réponses</button> : <button className={ghost} onClick={()=>{setAnswers({});setResult(null)}}>Refaire le quiz</button>}
      <section className={card}><h2 className="font-bold">Historique des passages</h2>{data.attempts.length?<div className="mt-2 space-y-2">{data.attempts.map((a)=><p key={a.id} className="flex justify-between text-sm"><span>{new Date(a.submitted_at).toLocaleDateString("fr-FR")}</span><strong>{a.score_percent}% ({a.correct}/{a.total})</strong></p>)}</div>:<p className="mt-2 text-sm text-slate-500">Aucun examen passé.</p>}</section>
    </>}
  </div>;
}

type Weekly = { from: string; to: string; minutes: number; sessions: number; applications: number; blocked: number; revisions: number; fragile: number; quizzes: number; averageQuizScore: number | null; pathsWorked: { id: string; title: string; minutes: number }[]; pathsUntouched: { id: string; title: string }[] };
export function LearningWeeklyV5() {
  const [data,setData] = useState<Weekly|null>(null);
  const [error,setError] = useState("");
  useEffect(()=>{call<Weekly>(null,"?view=weekly").then(setData).catch((e:unknown)=>setError(e instanceof Error?e.message:"Erreur"));},[]);
  return <section className={card}><div className="flex items-center gap-2"><TrendingUp size={19} className="text-emerald-800"/><h2 className="text-lg font-bold">Mes 7 derniers jours</h2></div>
    {error?<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>:null}
    {data?<><p className="mt-1 text-xs text-slate-500">Période glissante depuis le {data.from} · date locale {data.to}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{[["Temps réel",`${data.minutes} min`],["Séances",data.sessions],["Révisions",data.revisions],["Applications",data.applications],["Quiz",data.quizzes],["Score moyen",data.averageQuizScore===null?"Non mesuré":`${data.averageQuizScore}%`]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><strong className="text-lg">{value}</strong></div>)}</div>
    {data.fragile>0?<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">{data.fragile} révision(s) oubliées ou fragiles : à consolider.</p>:null}
    {data.pathsWorked.length?<div className="mt-4"><h3 className="font-semibold">Parcours travaillés</h3>{data.pathsWorked.map((p)=><Link className="mt-2 flex justify-between text-sm text-emerald-800" href={`/app/learning/paths/${p.id}`} key={p.id}>{p.title}<span>{p.minutes} min</span></Link>)}</div>:null}
    {data.pathsUntouched.length?<div className="mt-4"><h3 className="font-semibold">Actifs sans séance enregistrée</h3><p className="mt-1 text-sm text-slate-500">{data.pathsUntouched.map((p)=>p.title).join(" · ")}</p></div>:null}
    <p className="mt-4 text-xs text-slate-500">Les séances Coran et arabe historiques conservent leur propre suivi ; ce bilan couvre le nouveau moteur V5.</p></>:!error?<p className="mt-2 text-sm text-slate-500">Chargement du bilan…</p>:null}
  </section>;
}
export function LearningSearchV5(){
  type Results = { paths: {id:string;title:string;domain:string}[]; knowledge:{id:string;path_id:string;title:string}[];resources:{id:string;title:string;url:string|null;resource_type:string}[] };
  const [q,setQ] = useState("");const [data,setData]=useState<Results|null>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  return <section className={card}><div className="flex items-center gap-2"><Search size={19} className="text-emerald-800"/><h2 className="text-lg font-bold">Retrouver un apprentissage</h2></div><form className="mt-3 flex gap-2" onSubmit={async(e)=>{e.preventDefault();setError("");setBusy(true);try{setData(await call<Results>(null,`?view=search&q=${encodeURIComponent(q.trim())}`))}catch(e:unknown){setError(e instanceof Error?e.message:"Échec recherche")}finally{setBusy(false)}}}><input className={`${input} min-w-0 flex-1`} aria-label="Rechercher dans mes apprentissages" minLength={2} maxLength={80} value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Notion, ressource, parcours…"/><button className={action} disabled={busy||q.trim().length<2} type="submit">Chercher</button></form>{error?<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>:null}{data?<div className="mt-3 grid gap-2">{data.paths.map((p)=><Link className="text-sm text-emerald-800 underline" key={`p${p.id}`} href={`/app/learning/paths/${p.id}`}>Parcours · {p.title}</Link>)}{data.knowledge.map((k)=><Link className="text-sm text-emerald-800 underline" key={`k${k.id}`} href={`/app/learning/paths/${k.path_id}`}>Notion · {k.title}</Link>)}{data.resources.map((r)=>r.url?.startsWith("https://")?<a className="text-sm text-emerald-800 underline" key={`r${r.id}`} target="_blank" rel="noopener noreferrer" href={r.url}>Ressource · {r.title}</a>:<p className="text-sm" key={`r${r.id}`}>Ressource · {r.title}</p>)}{data.paths.length+data.knowledge.length+data.resources.length===0?<p className="text-sm text-slate-500">Aucun résultat.</p>:null}</div>:null}</section>;
}
