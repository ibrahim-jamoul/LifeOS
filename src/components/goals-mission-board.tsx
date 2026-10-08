"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Circle, Flag, LoaderCircle, MoreHorizontal, Plus, Target, X } from "lucide-react";
import { TaskComposer, type GoalOption, type LifeArea, type ProjectOption } from "@/components/life-dashboard";
import { describeTaskRecurrence } from "@/lib/domain/task-recurrence";

export type GoalBoardGoal = {
  id: string; title: string; lifeArea: LifeArea; status: string; priority: string;
  progress: number; targetDate: string | null; desiredOutcome: string | null;
  kpiCount: number; projectCount: number;
};
export type GoalBoardMission = {
  id: string; goalId: string; title: string; status: string; priority: string; lifeArea: LifeArea;
  plannedOn: string | null; plannedTime: string | null; estimateMinutes: number | null;
  dueOn: string | null; projectTitle: string | null; recurrenceRule: string | null; recurrenceUntil: string | null; occursToday: boolean;
  occurrenceOn: string | null; completedToday: boolean;
};

type AreaFilter = "all" | Exclude<LifeArea, null>;
type DetailTab = "overview" | "missions" | "kpis" | "projects";

type ApiEnvelope = { ok?: boolean; error?: { message?: string } };

export function GoalsMissionBoard(props: { today: string; goals: GoalBoardGoal[]; missions: GoalBoardMission[]; projects: ProjectOption[]; initialGoalId?: string | null }) {
  const { today, goals, missions, projects, initialGoalId } = props;
  const router = useRouter();
  const [area, setArea] = useState<AreaFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(initialGoalId ?? null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [composerGoal, setComposerGoal] = useState<GoalBoardGoal | null>(null);
  const [goalComposerOpen, setGoalComposerOpen] = useState(false);

  const visibleGoals = useMemo(() => goals.filter((goal) => area === "all" || goal.lifeArea === area), [goals, area]);
  const todayGoalIds = useMemo(() => new Set(missions.filter((mission) => mission.occursToday && !mission.completedToday && !["done", "cancelled"].includes(mission.status)).map((mission) => mission.goalId)), [missions]);
  const todayGoals = visibleGoals.filter((goal) => todayGoalIds.has(goal.id));
  const otherGoals = visibleGoals.filter((goal) => !todayGoalIds.has(goal.id));
  const orderedGoals = [...todayGoals, ...otherGoals];
  const goalOptions: GoalOption[] = goals.map((goal) => ({ id: goal.id, title: goal.title, lifeArea: goal.lifeArea }));

  return <div className="grid gap-5">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Objectifs</p><h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">Mes objectifs</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choisis le cap, ouvre un objectif et gère directement ses missions. Les écrans avancés restent disponibles sans encombrer le parcours principal.</p></div>
      <button className="button-primary" onClick={() => setGoalComposerOpen(true)}><Plus size={17} />Nouvel objectif</button>
    </header>

    <div className="grid grid-cols-3 gap-2"><Metric value={goals.filter((goal) => goal.status === "active").length} label="Actifs" /><Metric value={todayGoalIds.size} label="Du jour" /><Metric value={goals.filter((goal) => goal.status === "at_risk").length} label="À risque" /></div>

    <div className="rounded-2xl border border-orange-100 bg-white/80 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-2">{(["all", "pro", "perso", "religion"] as const).map((value) => <button key={value} className={`rounded-full px-4 py-2 text-sm font-bold transition ${area === value ? areaTone(value) : "border border-slate-200 bg-white text-slate-600"}`} onClick={() => setArea(value)}>{value === "all" ? "Tous" : value.toUpperCase()}</button>)}</div>
    </div>

    <div className="grid gap-4">{orderedGoals.map((goal, index) => {
      const rows = missions.filter((mission) => mission.goalId === goal.id).sort(compareMissions);
      const remaining = rows.filter((mission) => !["done", "cancelled"].includes(mission.status)).length;
      const open = expanded === goal.id;
      const next = rows.find((mission) => !["done", "cancelled"].includes(mission.status));
      const sectionTitle = index === 0 ? (todayGoals.length ? "Aujourd’hui" : "Autres objectifs") : index === todayGoals.length ? "Autres objectifs" : null;
      return <Fragment key={goal.id}>{sectionTitle ? <h2 className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">{sectionTitle}</h2> : null}<section className="overflow-hidden rounded-[1.75rem] border border-orange-100/80 bg-white/95 shadow-sm">
        <button className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6" onClick={() => { setExpanded(open ? null : goal.id); setDetailTab("overview"); }}>
          <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${goalTone(goal.lifeArea)}`}><Target size={21} /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black sm:text-2xl">{goal.title}</h2><AreaBadge area={goal.lifeArea} /></div>{goal.desiredOutcome ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{goal.desiredOutcome}</p> : null}<div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} /></div><strong className="text-sm">{goal.progress}%</strong></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{remaining} mission{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</span>{next ? <span>Prochaine : {next.title}</span> : null}{goal.targetDate ? <span>Cible {formatDate(goal.targetDate)}</span> : null}</div></div>
          <ChevronDown className={`mt-2 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open ? <div className="border-t border-orange-100 bg-orange-50/25 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">{([["overview", "Vue"], ["missions", "Missions"], ["kpis", "KPI"], ["projects", "Projets"]] as const).map(([value, label]) => <button key={value} className={`rounded-lg px-2 py-2 text-xs font-black sm:text-sm ${detailTab === value ? "bg-white shadow-sm" : "text-slate-500"}`} onClick={() => setDetailTab(value)}>{label}</button>)}</div>
          {detailTab === "overview" ? <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">{goal.desiredOutcome || "Résultat et définition de DONE à compléter."}</p><div className="grid grid-cols-3 gap-2 text-center text-xs"><span className="rounded-xl bg-slate-50 p-2"><strong className="block text-lg">{remaining}</strong>Missions</span><span className="rounded-xl bg-slate-50 p-2"><strong className="block text-lg">{goal.kpiCount}</strong>KPI</span><span className="rounded-xl bg-slate-50 p-2"><strong className="block text-lg">{goal.projectCount}</strong>Projets</span></div>{next ? <button className="button-primary justify-self-start" onClick={() => setDetailTab("missions")}>Voir la prochaine mission</button> : <button className="button-primary justify-self-start" onClick={() => setComposerGoal(goal)}><Plus size={16} />Ajouter la première mission</button>}</div> : null}
          {detailTab === "missions" ? <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">Missions</h3><p className="text-xs text-slate-500">Aujourd’hui affiche uniquement les missions réellement planifiées.</p></div><button className="button-primary" onClick={() => setComposerGoal(goal)}><Plus size={16} />Ajouter une mission</button></div>{rows.length ? <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{rows.map((mission) => <MissionRow key={mission.id} mission={mission} today={today} onChanged={() => router.refresh()} />)}</ul> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center"><Flag className="mx-auto text-slate-400" /><p className="mt-2 font-bold">Aucune mission définie.</p><button className="button-primary mt-4" onClick={() => setComposerGoal(goal)}><Plus size={16} />Ajouter une mission</button></div>}</> : null}
          {detailTab === "kpis" ? <EmptyLinked count={goal.kpiCount} label="KPI" href="/app/goals/kpis" /> : null}
          {detailTab === "projects" ? <EmptyLinked count={goal.projectCount} label="projet" href="/app/goals/projects" /> : null}
          <details className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-slate-500"><MoreHorizontal size={16} />Options avancées</summary><div className="mt-2 flex flex-wrap gap-2"><Link href={`/app/goals/objectives-admin?q=${encodeURIComponent(goal.title)}`} className="button-secondary">Modifier l’objectif</Link><Link href="/app/goals/tasks" className="button-secondary">Voir toutes les tâches</Link></div></details>
        </div> : null}
      </section></Fragment>;
    })}</div>

    {visibleGoals.length === 0 ? <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-8 text-center"><Target className="mx-auto text-orange-300" /><p className="mt-3 font-black">Aucun objectif dans ce filtre.</p><p className="mt-1 text-sm text-slate-500">Change de domaine ou crée un objectif.</p></div> : null}
    {composerGoal ? <TaskComposer today={today} goals={goalOptions} projects={projects} initialGoalId={composerGoal.id} initialLifeArea={composerGoal.lifeArea} onClose={() => setComposerGoal(null)} onSaved={() => { setComposerGoal(null); router.refresh(); }} /> : null}
    {goalComposerOpen ? <GoalComposer onClose={() => setGoalComposerOpen(false)} onSaved={() => { setGoalComposerOpen(false); router.refresh(); }} /> : null}
  </div>;
}

function GoalComposer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<Exclude<LifeArea, null>>("pro");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/data/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: title.trim(), life_area: lifeArea, desired_outcome: null, definition_of_done: null,
        status: "active", priority, configuration_status: "to_complete", horizon: null, start_date: null,
        target_date: targetDate || null, target_value: null, target_unit: null, progress_percent: 0,
        next_action: null, next_review_date: null, reason: null, risk_notes: null, notes: null,
      }) });
      const result = await safeJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "Création impossible.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Création impossible."); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/45 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
    <section className="max-h-[94vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-xl sm:rounded-[2rem]">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">Objectif</p><h2 className="text-2xl font-black">Créer un objectif</h2></div><button className="button-secondary size-10 px-0" onClick={onClose}><X size={18} /></button></header>
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <label className="field sm:col-span-2"><span>Titre *</span><input autoFocus className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Décrire le résultat à atteindre" /></label>
        <fieldset><legend className="mb-2 text-sm font-semibold">Domaine</legend><div className="flex flex-wrap gap-2">{(["pro", "perso", "religion"] as const).map((value) => <button key={value} type="button" className={`rounded-full border px-3 py-2 text-sm font-bold ${lifeArea === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600"}`} onClick={() => setLifeArea(value)}>{value.toUpperCase()}</button>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Priorité</legend><div className="flex flex-wrap gap-2">{([["Basse", "low"], ["Moyenne", "medium"], ["Haute", "high"], ["Critique", "critical"]] as const).map(([label, value]) => <button key={value} type="button" className={`rounded-full border px-3 py-2 text-sm font-bold ${priority === value ? "border-orange-500 bg-orange-50 text-orange-800" : "border-slate-200 text-slate-600"}`} onClick={() => setPriority(value)}>{label}</button>)}</div></fieldset>
        <label className="field sm:col-span-2"><span>Date cible (facultative)</span><input className="input" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /><span className="text-xs font-normal text-slate-500">La définition de DONE pourra être complétée ensuite.</span></label>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p> : null}
        <footer className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="button-secondary" onClick={onClose}>Annuler</button><button className="button-primary" disabled={saving || !title.trim()}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}{saving ? "Création…" : "Créer l’objectif"}</button></footer>
      </form>
    </section>
  </div>;
}

function MissionRow({ mission, today, onChanged }: { mission: GoalBoardMission; today: string; onChanged: () => void }) {
  const recurrence = describeTaskRecurrence(mission.recurrenceRule);
  const completed = mission.status === "done" || mission.completedToday;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [customDate, setCustomDate] = useState(addDays(today, 1));

  async function post(url: string, body: unknown) {
    setPending(true); setError(null);
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await safeJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "Opération impossible.");
      onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Opération impossible."); }
    finally { setPending(false); }
  }

  const occurrenceOn = mission.recurrenceRule ? mission.occurrenceOn : undefined;
  const canActOnOccurrence = !mission.recurrenceRule || mission.occursToday;
  return <li className="px-4 py-3"><div className="flex items-start gap-3"><div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}>{completed ? <Check size={16} /> : <Circle size={15} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`font-bold ${completed ? "text-slate-500 line-through" : ""}`}>{mission.title}</p><PriorityBadge priority={mission.priority} />{mission.occursToday && !completed ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">AUJOURD’HUI</span> : null}</div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">{mission.plannedOn ? <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDate(mission.plannedOn)}{mission.plannedTime ? ` à ${mission.plannedTime.slice(0, 5)}` : ""}</span> : <span>Non planifiée</span>}{mission.dueOn ? <span>Échéance {formatDate(mission.dueOn)}</span> : null}{mission.estimateMinutes ? <span>{mission.estimateMinutes} min</span> : null}{mission.projectTitle ? <span>{mission.projectTitle}</span> : null}{recurrence ? <span>{recurrence}{mission.recurrenceUntil ? ` jusqu’au ${formatDate(mission.recurrenceUntil)}` : ""}</span> : null}</div><div className="mt-3 flex flex-wrap gap-2">{canActOnOccurrence ? <button disabled={pending} className={completed ? "button-secondary min-h-9 px-3 py-1" : "button-primary min-h-9 px-3 py-1"} onClick={() => void post(`/api/tasks/${mission.id}/complete`, { occurredOn: today, occurrenceOn, completed: !completed })}>{pending ? <LoaderCircle className="animate-spin" size={14} /> : completed ? "Rouvrir" : "Terminer"}</button> : null}<Link className="button-secondary min-h-9 px-3 py-1" href={`/app/goals/tasks?q=${encodeURIComponent(mission.title)}`}>Modifier</Link>{canActOnOccurrence && !completed ? <button className="button-secondary min-h-9 px-3 py-1" onClick={() => setReportOpen((value) => !value)}>Reporter</button> : null}{!mission.plannedOn ? <button className="button-secondary min-h-9 px-3 py-1" onClick={() => void post(`/api/tasks/${mission.id}/plan`, { plannedOn: today })}>Planifier aujourd’hui</button> : null}</div>{error ? <p className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}</div></div>{reportOpen ? <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3"><button className="button-secondary" onClick={() => void post(`/api/tasks/${mission.id}/plan`, { plannedOn: addDays(today, 1), occurrenceOn })}>Demain</button><button className="button-secondary" onClick={() => void post(`/api/tasks/${mission.id}/plan`, { plannedOn: addDays(today, 7), occurrenceOn })}>+7 jours</button><input aria-label="Date de report" className="input max-w-44" type="date" min={today} value={customDate} onChange={(event) => setCustomDate(event.target.value)} /><button className="button-primary" onClick={() => void post(`/api/tasks/${mission.id}/plan`, { plannedOn: customDate, occurrenceOn })}>Reporter</button>{mission.recurrenceRule ? <span className="self-center text-xs text-slate-500">Cette occurrence seulement</span> : null}</div> : null}</li>;
}
function Metric({ value, label }: { value: number; label: string }) { return <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm"><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-bold text-slate-500">{label}</span></div>; }
function EmptyLinked({ count, label, href }: { count: number; label: string; href: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center"><p className="font-black">{count ? `${count} ${label}${count > 1 ? "s" : ""} lié${count > 1 ? "s" : ""}` : `Aucun ${label} lié`}</p><Link className="button-secondary mt-3" href={href}>Gérer les {label}s</Link></div>; }
function AreaBadge({ area }: { area: LifeArea }) { if (!area) return null; const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>; }
function PriorityBadge({ priority }: { priority: string }) { if (!priority || priority === "unset") return null; const tone = priority === "critical" ? "bg-red-50 text-red-700" : priority === "high" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`}>{priority.toUpperCase()}</span>; }
function goalTone(area: LifeArea) { return area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : area === "religion" ? "bg-amber-50 text-amber-800" : "bg-orange-50 text-orange-700"; }
function areaTone(area: AreaFilter) { if (area === "pro") return "bg-blue-600 text-white"; if (area === "perso") return "bg-rose-500 text-white"; if (area === "religion") return "bg-amber-500 text-white"; return "bg-slate-950 text-white"; }
function formatDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
function compareMissions(a: GoalBoardMission, b: GoalBoardMission) { if (a.status === "done" && b.status !== "done") return 1; if (a.status !== "done" && b.status === "done") return -1; if (a.occursToday !== b.occursToday) return a.occursToday ? -1 : 1; return (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999") || a.title.localeCompare(b.title, "fr"); }
function addDays(date: string, amount: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
async function safeJson(response: Response): Promise<ApiEnvelope> { try { return await response.json() as ApiEnvelope; } catch { return { ok: false, error: { message: "Réponse serveur invalide." } }; } }
