"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronLeft, Clock3, Lightbulb, LoaderCircle, Plus, RefreshCcw, Sparkles } from "lucide-react";
import { completedRatio, domainLabel, LEARNING_ACTIVITY_TYPES, LEARNING_DOMAINS, LEARNING_TYPES } from "@/lib/domain/learning";
import { LearningPathPlus, LearningWeeklyV5, LearningSearchV5 } from "@/components/learning-v5-plus";

type Path = { id: string; title: string; domain: string; path_type: string; status: string; weekly_minutes: number; purpose?: string | null; goal_id?: string | null; project_id?: string | null };
type Module = { id: string; path_id: string; title: string; position: number };
type Activity = { id: string; module_id: string; title: string; activity_type: string; estimated_minutes: number; source_url: string | null; status: string; position: number };
type Knowledge = { id: string; path_id?: string; title: string; summary?: string | null; source_url?: string | null; next_review_on: string; review_step: number; last_assessment: string | null };
type Session = { id: string; duration_minutes: number; result: string; occurred_at: string };
type Home = { paths: Path[]; dueCount: number; sessionMinutesToday: number };
type Detail = { path: Path; modules: Module[]; activities: Activity[]; knowledge: Knowledge[]; sessions: Session[] };
type Due = { due: Knowledge[]; today: string };
type Stats = { minutes30d: number; sessions30d: number; applications30d: number; activitiesCompleted: number; activitiesTotal: number; knowledgeCount: number; dueCount: number; reviewed30d: number; activePaths: number };
type Mode = "home" | "paths" | "path" | "due" | "stats";
type Envelope<T> = { ok: true; data: T } | { ok: false; error: { message: string } };

async function api<T>(query: string, command?: object): Promise<T> {
  const response = await fetch(`/api/learning/v5${query}`, { method: command ? "POST" : "GET", headers: command ? { "Content-Type": "application/json" } : undefined, body: command ? JSON.stringify(command) : undefined, cache: "no-store" });
  const body: Envelope<T> = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.ok ? `Erreur HTTP ${response.status}` : body.error.message);
  return body.data;
}

const panel = "rounded-[1.6rem] border border-[#e6ddd0] bg-white p-4 shadow-sm sm:p-6";
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#185b4a] px-4 text-sm font-bold text-white hover:bg-[#104837] disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e3dfd5] bg-[#fffdf8] px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50";
const field = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-offset-2 focus:border-emerald-500";

export function LearningV5({ mode, pathId }: { mode: Mode; pathId?: string }) {
  const [data, setData] = useState<Home | Detail | Due | Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [domain, setDomain] = useState<(typeof LEARNING_DOMAINS)[number]["value"]>("certification");
  const [kind, setKind] = useState<(typeof LEARNING_TYPES)[number]["value"]>("strategic");
  const [weeklyMinutes, setWeeklyMinutes] = useState(90);
  const [links, setLinks] = useState<{ projects: { id: string; title: string; project_type: string }[]; goals: { id: string; title: string }[] }>({ projects: [], goals: [] });
  const [projectId, setProjectId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [activityModule, setActivityModule] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityKind, setActivityKind] = useState<(typeof LEARNING_ACTIVITY_TYPES)[number]["value"]>("lesson");
  const [activitySource, setActivitySource] = useState("");
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeSummary, setKnowledgeSummary] = useState("");
  const [knowledgeSource, setKnowledgeSource] = useState("");
  const [duration, setDuration] = useState(15);
  const [revealedKnowledgeIds, setRevealedKnowledgeIds] = useState<string[]>([]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    const query = mode === "path" ? `?view=path&id=${encodeURIComponent(pathId ?? "")}` : mode === "paths" || mode === "home" ? "?view=home" : mode === "due" ? "?view=due" : "?view=stats";
    api<Home | Detail | Due | Stats>(query).then((value) => { if (active) { setData(value); setMessage(null); } }).catch((error: unknown) => { if (active) { setData(null); setMessage(error instanceof Error ? error.message : "Impossible de charger les données."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode, pathId, tick]);

  useEffect(() => {
    if (mode !== "paths" || !creating) return;
    let active = true;
    api<typeof links>("?view=links").then((value) => { if (active) setLinks(value); }).catch(() => { /* The core creation flow remains available. */ });
    return () => { active = false; };
  }, [mode, creating]);

  async function mutate(command: object, onSuccess?: () => void) {
    setBusy(true);
    setMessage(null);
    setNotice(null);
    try {
      await api("", command);
      onSuccess?.();
      setNotice("Modification enregistrée.");
      reload();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally { setBusy(false); }
  }

  const home = mode === "home" || mode === "paths" ? (data as Home | null) : null;
  const detail = mode === "path" ? (data as Detail | null) : null;
  const due = mode === "due" ? (data as Due | null) : null;
  const stats = mode === "stats" ? (data as Stats | null) : null;
  const activePaths = home?.paths.filter((path) => path.status === "active") ?? [];

  return <div className="mx-auto grid w-full max-w-5xl gap-5 pb-8 text-slate-900">
    <header className="flex items-start justify-between gap-4">
      <div>
        {mode === "path" ? <Link className="mb-2 inline-flex items-center gap-1 text-sm text-emerald-800" href="/app/learning/paths"><ChevronLeft size={16} /> Mes parcours</Link> : null}
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">LifeOS · Apprentissage V5</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{mode === "home" ? "Qu’allez-vous apprendre ?" : mode === "paths" ? "Mes parcours" : mode === "path" ? detail?.path.title ?? "Mon parcours" : mode === "due" ? "À réviser" : "Mon bilan"}</h1>
        <p className="mt-2 text-sm text-slate-600">{mode === "home" ? "Une prochaine étape utile. Pas de liste interminable." : mode === "paths" ? "Peu de priorités, des étapes concrètes." : mode === "path" ? "Modules, activités et connaissances dans un seul endroit." : mode === "due" ? "Évaluez vos souvenirs, puis LifeOS proposera la prochaine date." : "Du temps réel, des acquis et des applications mesurables."}</p>
      </div>
      {mode === "paths" ? <button className={primary} onClick={() => setCreating(!creating)}><Plus size={16} /> Parcours</button> : null}
    </header>

    {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div> : null}
    {message ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}{message.toLowerCase().includes("base") ? " Vérifiez l’application de la migration Supabase V5." : ""}</div> : null}
    {loading ? <div className={panel}><LoaderCircle className="inline animate-spin" size={20} /> Chargement des données…</div> : null}

    {home && mode === "home" ? <>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className={panel}><span className="text-sm text-slate-500">Parcours actifs</span><strong className="mt-1 block text-3xl">{activePaths.length}</strong></div>
        <div className={panel}><span className="text-sm text-slate-500">Notions à réviser</span><strong className="mt-1 block text-3xl">{home.dueCount}</strong></div>
        <div className={panel}><span className="text-sm text-slate-500">Temps enregistré aujourd’hui</span><strong className="mt-1 block text-3xl">{home.sessionMinutesToday} min</strong></div>
      </section>
      {home.dueCount > 0 ? <Link href="/app/learning/revisions" className={`${panel} flex items-center justify-between gap-3 border-violet-200 bg-violet-50`}><span className="flex items-center gap-3"><RefreshCcw className="text-violet-600" /><span><strong className="block">{home.dueCount} notion(s) à consolider</strong><span className="text-sm text-slate-600">Quelques minutes suffisent pour commencer.</span></span></span><ArrowRight size={18} /></Link> : null}
      <section className={panel}><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Reprendre un parcours</h2><Link className="text-sm font-bold text-emerald-800" href="/app/learning/paths">Tout voir</Link></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{activePaths.length ? activePaths.slice(0, 4).map((path) => <PathCard path={path} key={path.id} />) : <div className="text-sm text-slate-500">Aucun parcours actif. Ajoutez-en un depuis Mes parcours.</div>}</div>
      </section>
      <section className={panel}><h2 className="text-lg font-black">Espaces déjà disponibles</h2><p className="mb-3 mt-1 text-sm text-slate-500">Conservez vos données et vos outils de suivi existants.</p><div className="flex flex-wrap gap-2"><Link className={secondary} href="/app/learning/religion">Programme Religion</Link><Link className={secondary} href="/app/learning/quran">Coran</Link><Link className={secondary} href="/app/learning/routines">Routines Religion</Link><Link className={secondary} href="/app/learning/lessons">Anciens sujets d’étude</Link><Link className={secondary} href="/app/learning/languages">Journal d’arabe</Link></div></section>
      <LearningSearchV5 />
    </> : null}

    {home && mode === "paths" ? <>
      {creating ? <section className={panel}><h2 className="text-lg font-black">Nouveau parcours</h2><p className="mt-1 text-sm text-slate-500">Seul le titre est à saisir.</p>
        <label className="mt-4 block text-sm font-bold" htmlFor="learning-title">Titre du parcours</label><input id="learning-title" className={`${field} mt-2`} maxLength={160} placeholder="Ex. Préparer PSM I" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
        <p className="mb-2 mt-4 text-sm font-bold">Domaine</p><div className="flex flex-wrap gap-2">{LEARNING_DOMAINS.map((option) => <button key={option.value} type="button" onClick={() => setDomain(option.value)} aria-pressed={domain === option.value} className={`${secondary} ${domain === option.value ? "border-emerald-800 bg-emerald-50" : ""}`}>{option.label}</button>)}</div>
        <p className="mb-2 mt-4 text-sm font-bold">Type</p><div className="flex flex-wrap gap-2">{LEARNING_TYPES.map((option) => <button type="button" key={option.value} onClick={() => setKind(option.value)} aria-pressed={kind === option.value} className={`${secondary} ${kind === option.value ? "border-emerald-800 bg-emerald-50" : ""}`}>{option.label}</button>)}</div>
        <p className="mb-2 mt-4 text-sm font-bold">Budget hebdomadaire</p><div className="flex flex-wrap gap-2">{[30,60,90,120,180].map((minutes) => <button type="button" key={minutes} onClick={() => setWeeklyMinutes(minutes)} aria-pressed={weeklyMinutes === minutes} className={`${secondary} ${weeklyMinutes === minutes ? "border-emerald-800 bg-emerald-50" : ""}`}>{minutes} min</button>)}</div>
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-bold">Lier un objectif ou projet LifeOS (facultatif)</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Projet existant<select aria-label="Projet LifeOS" className={`${field} mt-1`} value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">Aucun</option>{links.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label className="text-sm">Objectif existant<select aria-label="Objectif LifeOS" className={`${field} mt-1`} value={goalId} onChange={(e) => setGoalId(e.target.value)}><option value="">Aucun</option>{links.goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label></div></details>
        <div className="mt-5 flex gap-2"><button disabled={busy || !newTitle.trim()} onClick={() => mutate({ action: "create_path", title: newTitle, domain, pathType: kind, weeklyMinutes, projectId: projectId || null, goalId: goalId || null }, () => { setCreating(false); setNewTitle(""); setProjectId(""); setGoalId(""); })} className={primary}><Check size={16} /> Créer le parcours</button><button className={secondary} onClick={() => setCreating(false)}>Annuler</button></div>
      </section> : null}
      {activePaths.length >= 3 ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">{activePaths.length} parcours actifs : pour éviter la dispersion, pensez à suspendre une priorité avant d’en ajouter une autre.</p> : null}
      <section className="grid gap-3 sm:grid-cols-2">{home.paths.length ? home.paths.map((path) => <PathCard key={path.id} path={path} />) : <div className={panel}>Aucun parcours pour l’instant. Utilisez « Parcours » pour commencer.</div>}</section>
    </> : null}

    {detail ? <>
      <div className={`${panel} flex flex-wrap items-center justify-between gap-3`}><div><span className="text-xs font-bold uppercase tracking-wide text-emerald-700">{domainLabel(detail.path.domain)}</span><p className="mt-1 text-sm text-slate-600">{detail.path.weekly_minutes} min / semaine · {detail.path.path_type === "strategic" ? "Priorité" : detail.path.path_type}</p><p className="mt-1 text-sm font-bold">{completedRatio(detail.activities.filter((a) => a.status === "completed").length, detail.activities.length) === null ? "Aucune activité à évaluer" : `${completedRatio(detail.activities.filter((a) => a.status === "completed").length, detail.activities.length)} % des activités terminées`}</p></div>
        <select aria-label="État du parcours" value={detail.path.status} className={field} style={{ width: 170 }} disabled={busy} onChange={(e) => mutate({ action: "set_path_status", pathId: detail.path.id, status: e.target.value })}><option value="planned">Prévu</option><option value="active">Actif</option><option value="paused">En pause</option><option value="completed">Terminé</option><option value="abandoned">Abandonné</option><option value="archived">Archivé</option></select>
      </div>
      <section className={panel}><h2 className="text-xl font-black">Programme</h2><p className="mt-1 text-sm text-slate-500">Ajoutez vos modules et leurs activités. Aucune tâche n’est automatiquement créée dans Aujourd’hui.</p>
        {detail.modules.length === 0 ? <button className={`${primary} mt-4`} disabled={busy} onClick={() => mutate({ action: "initialize_path", pathId: detail.path.id })}><Sparkles size={16} /> Construire mon programme en un clic</button> : null}
        {detail.modules.map((module) => <article key={module.id} className="mt-4 rounded-2xl border border-slate-200 p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{module.title}</h3><button className={secondary} onClick={() => setActivityModule(activityModule === module.id ? null : module.id)}><Plus size={15} /> Activité</button></div>
          {detail.activities.filter((a) => a.module_id === module.id).map((activity) => <div key={activity.id} className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center"><div className="flex-1"><strong className="text-sm">{activity.title}</strong><p className="text-xs text-slate-500">{LEARNING_ACTIVITY_TYPES.find((kind) => kind.value === activity.activity_type)?.label} · {activity.estimated_minutes} min {activity.status === "completed" ? "· Terminée" : ""}</p>{activity.source_url ? <a className="text-xs font-bold text-emerald-800 underline" href={activity.source_url} target="_blank" rel="noopener noreferrer">Ouvrir la source</a> : null}</div>
            <div className="flex flex-wrap gap-2"><button disabled={busy} className={secondary} onClick={() => mutate({ action: "record_session", pathId: detail.path.id, activityId: activity.id, durationMinutes: activity.estimated_minutes, result: activity.activity_type === "lab" ? "practiced" : "studied" })}><Clock3 size={15} /> +{activity.estimated_minutes} min</button><button disabled={busy} className={activity.status === "completed" ? secondary : primary} onClick={() => mutate({ action: "set_activity_completion", activityId: activity.id, completed: activity.status !== "completed" })}><Check size={15} /> {activity.status === "completed" ? "Réouvrir" : "Terminer"}</button></div>
          </div>)}
          {activityModule === module.id ? <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_auto_auto]"><input className={field} placeholder="Titre de l’activité" aria-label="Titre de l’activité" maxLength={160} value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} /><select className={field} value={activityKind} aria-label="Type d’activité" onChange={(e) => setActivityKind(e.target.value as typeof activityKind)}>{LEARNING_ACTIVITY_TYPES.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select><button disabled={!activityTitle.trim() || busy} className={primary} onClick={() => mutate({ action: "create_activity", moduleId: module.id, title: activityTitle, activityType: activityKind, estimatedMinutes: 15, sourceUrl: activitySource }, () => { setActivityTitle(""); setActivitySource(""); setActivityModule(null); })}>Ajouter</button><input className={`${field} sm:col-span-3`} placeholder="Lien de la ressource (HTTPS, facultatif)" aria-label="Source de l’activité" type="url" value={activitySource} onChange={(e) => setActivitySource(e.target.value)} /></div> : null}
        </article>)}
        <div className="mt-4 flex gap-2"><input className={field} aria-label="Titre du nouveau module" placeholder="Nouveau module (titre)" value={moduleTitle} maxLength={160} onChange={(e) => setModuleTitle(e.target.value)} /><button className={primary} disabled={busy || !moduleTitle.trim()} onClick={() => mutate({ action: "create_module", pathId: detail.path.id, title: moduleTitle }, () => setModuleTitle(""))}><Plus size={16} /> Module</button></div>
      </section>
      <section className={panel}><div className="flex items-center gap-2"><Lightbulb size={19} className="text-amber-600" /><h2 className="text-xl font-black">Ce que je retiens</h2></div><p className="mt-1 text-sm text-slate-500">Une notion enregistrée apparaît automatiquement dans votre file de révision.</p>
        <div className="mt-4 grid gap-2"><input className={field} value={knowledgeTitle} maxLength={160} placeholder="Nom de la notion" aria-label="Nom de la notion" onChange={(e) => setKnowledgeTitle(e.target.value)} /><textarea className={`${field} py-3`} rows={2} maxLength={4000} value={knowledgeSummary} placeholder="Résumé facultatif" aria-label="Résumé de la notion" onChange={(e) => setKnowledgeSummary(e.target.value)} /><input className={field} type="url" value={knowledgeSource} placeholder="Source HTTPS (facultatif)" aria-label="Source de la connaissance" onChange={(e) => setKnowledgeSource(e.target.value)} /><button className={primary} disabled={busy || !knowledgeTitle.trim()} onClick={() => mutate({ action: "add_knowledge", pathId: detail.path.id, title: knowledgeTitle, summary: knowledgeSummary, sourceUrl: knowledgeSource }, () => { setKnowledgeTitle(""); setKnowledgeSummary(""); setKnowledgeSource(""); })}><Plus size={16} /> Mémoriser</button></div>
        <div className="mt-4 divide-y divide-slate-100">{detail.knowledge.slice(0, 20).map((k) => <p className="py-2 text-sm" key={k.id}><strong>{k.title}</strong><span className="ml-2 text-xs text-slate-500">Révision : {k.next_review_on}</span></p>)}</div>
      </section>
      <section className={panel}><h2 className="text-lg font-black">Séance rapide</h2><p className="mt-1 text-sm text-slate-500">Enregistrez uniquement du temps réellement effectué.</p><div className="mt-3 flex flex-wrap gap-2">{[5,15,30,60].map((m) => <button key={m} className={`${secondary} ${duration === m ? "border-emerald-800 bg-emerald-50" : ""}`} onClick={() => setDuration(m)}>{m} min</button>)}</div><div className="mt-3 flex flex-wrap gap-2"><button className={primary} disabled={busy} onClick={() => mutate({ action: "record_session", pathId: detail.path.id, durationMinutes: duration, result: "studied" })}>Étudié</button><button className={secondary} disabled={busy} onClick={() => mutate({ action: "record_session", pathId: detail.path.id, durationMinutes: duration, result: "practiced" })}>Pratiqué</button><button className={secondary} disabled={busy} onClick={() => mutate({ action: "record_session", pathId: detail.path.id, durationMinutes: duration, result: "applied" })}>Appliqué</button></div><p className="mt-3 text-xs text-slate-500">{detail.sessions.length} dernières séances enregistrées · {detail.sessions.reduce((sum, s) => sum + s.duration_minutes, 0)} minutes dans cet historique limité.</p></section>
      <LearningPathPlus pathId={detail.path.id} domain={detail.path.domain} pathTitle={detail.path.title} weeklyMinutes={detail.path.weekly_minutes} purpose={detail.path.purpose} activities={detail.activities.map((a) => ({ id: a.id, title: a.title }))} refresh={reload} />
    </> : null}

    {due ? <><section className={panel}><h2 className="text-lg font-black">{due.due.length} connaissance(s) à revoir</h2><p className="mt-1 text-sm text-slate-500">Règle simple : 1, 3, 7, 14, 30 puis 60 jours selon la maîtrise. Les oublis rapprochent la prochaine révision.</p>
      {due.due.length ? <div className="mt-4 space-y-3">{due.due.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><strong>{item.title}</strong>{item.summary ? <div className="mt-2">{revealedKnowledgeIds.includes(item.id) ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{item.summary}</p> : <button type="button" className={secondary} onClick={() => setRevealedKnowledgeIds((old) => [...old, item.id])}>Afficher la fiche après réflexion</button>}</div> : null}<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['forgot','Oublié'],['fragile','Fragile'],['correct','Correct'],['mastered','Maîtrisé']] as const).map(([answer, label]) => <button disabled={busy} className={secondary} key={answer} onClick={() => mutate({ action: "review_knowledge", knowledgeId: item.id, assessment: answer })}>{label}</button>)}</div></article>)}</div> : <p className="mt-3 text-sm text-slate-500">Aucune notion due aujourd’hui.</p>}
    </section><Link href="/app/learning/quran" className={`${panel} flex items-center justify-between gap-3`}><span className="flex items-center gap-2"><BookOpen size={19} /> Révisions spécialisées Coran et mémorisation</span><ArrowRight size={18} /></Link></> : null}

    {stats ? <><section className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Temps étudié · 30 j" value={`${stats.minutes30d} min`} /><Stat label="Séances · 30 j" value={stats.sessions30d} /><Stat label="Applications réelles · 30 j" value={stats.applications30d} /><Stat label="Activités terminées" value={`${stats.activitiesCompleted} / ${stats.activitiesTotal}`} /><Stat label="Connaissances enregistrées" value={stats.knowledgeCount} /><Stat label="Révisions réalisées · 30 j" value={stats.reviewed30d} /></section><section className={panel}><h2 className="text-lg font-black">Qualité de la progression</h2><p className="mt-2 text-sm leading-6 text-slate-600">Le temps passé n’est pas un score de maîtrise. Pour mesurer votre progression, enregistrez aussi des notions, réalisez des révisions et utilisez « Appliqué » lorsqu’une compétence a été mise en œuvre.</p><p className="mt-3 text-sm">Parcours actifs : <strong>{stats.activePaths}</strong> · Notions à revoir : <strong>{stats.dueCount}</strong></p><Link className={`${primary} mt-4`} href="/app/learning/revisions"><RefreshCcw size={16} /> Réviser maintenant</Link></section><LearningWeeklyV5 /><Link className={`${secondary} justify-self-start`} href="/app/learning/progress">Voir mes anciennes statistiques Religion / Coran</Link></> : null}

    {!loading && !data && !message ? <section className={panel}>Aucune donnée disponible.</section> : null}
  </div>;
}

function PathCard({ path }: { path: Path }) {
  return <Link href={`/app/learning/paths/${path.id}`} className="group rounded-[1.4rem] border border-[#e6ddd0] bg-[#fffdf8] p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"><span className="text-xs font-bold text-emerald-800">{domainLabel(path.domain)}</span><h3 className="mt-1 text-lg font-black">{path.title}</h3><p className="mt-2 flex items-center justify-between text-sm text-slate-500"><span>{path.status === "active" ? "Actif" : path.status === "paused" ? "En pause" : path.status === "completed" ? "Terminé" : path.status} · {path.weekly_minutes} min / sem.</span><ArrowRight size={17} className="text-emerald-700 transition group-hover:translate-x-1" /></p></Link>;
}
function Stat({ label, value }: { label: string; value: string | number }) { return <div className={panel}><p className="text-xs font-semibold text-slate-500">{label}</p><strong className="mt-2 block text-2xl font-black">{value}</strong></div>; }
