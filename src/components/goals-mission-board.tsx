"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Circle, Flag, LoaderCircle, MoreHorizontal, Plus, Target, X } from "lucide-react";
import { TaskComposer, type GoalOption, type LifeArea, type ProjectOption } from "@/components/life-dashboard";
import { describeTaskRecurrence } from "@/lib/domain/task-recurrence";

export type GoalBoardGoal = {
  id: string; title: string; lifeArea: LifeArea; status: string; priority: string;
  progress: number; targetDate: string | null; desiredOutcome: string | null;
};
export type GoalBoardMission = {
  id: string; goalId: string; title: string; status: string; priority: string; lifeArea: LifeArea;
  plannedOn: string | null; plannedTime: string | null; estimateMinutes: number | null;
  projectTitle: string | null; recurrenceRule: string | null; recurrenceUntil: string | null; occursToday: boolean;
};

type Scope = "today" | "all";
type AreaFilter = "all" | Exclude<LifeArea, null>;

type ApiEnvelope = { ok?: boolean; error?: { message?: string } };

export function GoalsMissionBoard(props: { today: string; goals: GoalBoardGoal[]; missions: GoalBoardMission[]; projects: ProjectOption[]; initialGoalId?: string | null }) {
  const { today, goals, missions, projects, initialGoalId } = props;
  const router = useRouter();
  const [scope, setScope] = useState<Scope>(initialGoalId ? "all" : "today");
  const [area, setArea] = useState<AreaFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(initialGoalId ?? null);
  const [composerGoal, setComposerGoal] = useState<GoalBoardGoal | null>(null);
  const [goalComposerOpen, setGoalComposerOpen] = useState(false);

  const visibleGoals = useMemo(() => goals.filter((goal) => {
    if (area !== "all" && goal.lifeArea !== area) return false;
    if (scope === "all") return true;
    return missions.some((mission) => mission.goalId === goal.id && mission.occursToday && !["done", "cancelled"].includes(mission.status));
  }), [goals, missions, area, scope]);
  const goalOptions: GoalOption[] = goals.map((goal) => ({ id: goal.id, title: goal.title, lifeArea: goal.lifeArea }));

  return <div className="grid gap-5">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Objectifs</p><h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">Mes objectifs</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choisis le cap, ouvre un objectif et gère directement ses missions. Les écrans avancés restent disponibles sans encombrer le parcours principal.</p></div>
      <button className="button-primary" onClick={() => setGoalComposerOpen(true)}><Plus size={17} />Nouvel objectif</button>
    </header>

    <div className="rounded-2xl border border-orange-100 bg-white/80 p-2 shadow-sm backdrop-blur">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        <button className={`rounded-lg px-3 py-2 text-sm font-black transition ${scope === "today" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setScope("today")}>Objectifs du jour</button>
        <button className={`rounded-lg px-3 py-2 text-sm font-black transition ${scope === "all" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setScope("all")}>Tous les objectifs</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">{(["all", "pro", "perso", "religion"] as const).map((value) => <button key={value} className={`rounded-full px-4 py-2 text-sm font-bold transition ${area === value ? areaTone(value) : "border border-slate-200 bg-white text-slate-600"}`} onClick={() => setArea(value)}>{value === "all" ? "Tous" : value.toUpperCase()}</button>)}</div>
    </div>

    <div className="grid gap-4">{visibleGoals.map((goal) => {
      const rows = missions.filter((mission) => mission.goalId === goal.id).sort(compareMissions);
      const remaining = rows.filter((mission) => !["done", "cancelled"].includes(mission.status)).length;
      const open = expanded === goal.id;
      const next = rows.find((mission) => !["done", "cancelled"].includes(mission.status));
      return <section key={goal.id} className="overflow-hidden rounded-[1.75rem] border border-orange-100/80 bg-white/95 shadow-sm">
        <button className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6" onClick={() => setExpanded(open ? null : goal.id)}>
          <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${goalTone(goal.lifeArea)}`}><Target size={21} /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black sm:text-2xl">{goal.title}</h2><AreaBadge area={goal.lifeArea} /></div>{goal.desiredOutcome ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{goal.desiredOutcome}</p> : null}<div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} /></div><strong className="text-sm">{goal.progress}%</strong></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{remaining} mission{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</span>{next ? <span>Prochaine : {next.title}</span> : null}{goal.targetDate ? <span>Cible {formatDate(goal.targetDate)}</span> : null}</div></div>
          <ChevronDown className={`mt-2 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open ? <div className="border-t border-orange-100 bg-orange-50/25 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">Missions</h3><p className="text-xs text-slate-500">Une mission n’apparaît dans Aujourd’hui que lorsqu’elle est planifiée pour cette date.</p></div><button className="button-primary" onClick={() => setComposerGoal(goal)}><Plus size={16} />Ajouter une mission</button></div>
          {rows.length ? <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{rows.map((mission) => <MissionRow key={mission.id} mission={mission} />)}</ul> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center"><Flag className="mx-auto text-slate-400" /><p className="mt-2 font-bold">Aucune mission définie.</p><p className="mt-1 text-sm text-slate-500">Ajoute la prochaine action concrète qui fera avancer cet objectif.</p><button className="button-primary mt-4" onClick={() => setComposerGoal(goal)}><Plus size={16} />Ajouter une mission</button></div>}
          <details className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-slate-500"><MoreHorizontal size={16} />Options avancées</summary><div className="mt-2 flex flex-wrap gap-2"><Link href={`/app/goals/objectives-admin?q=${encodeURIComponent(goal.title)}`} className="button-secondary">Modifier l’objectif</Link><Link href="/app/goals/tasks" className="button-secondary">Voir toutes les tâches</Link></div></details>
        </div> : null}
      </section>;
    })}</div>

    {visibleGoals.length === 0 ? <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-8 text-center"><Target className="mx-auto text-orange-300" /><p className="mt-3 font-black">{scope === "today" ? "Aucun objectif n’a de mission prévue aujourd’hui." : "Aucun objectif dans ce filtre."}</p><p className="mt-1 text-sm text-slate-500">Tu peux changer de filtre ou planifier une mission depuis un objectif.</p></div> : null}
    {composerGoal ? <TaskComposer today={today} goals={goalOptions} projects={projects} initialGoalId={composerGoal.id} initialLifeArea={composerGoal.lifeArea} onClose={() => setComposerGoal(null)} onSaved={() => { setComposerGoal(null); router.refresh(); }} /> : null}
    {goalComposerOpen ? <GoalComposer onClose={() => setGoalComposerOpen(false)} onSaved={() => { setGoalComposerOpen(false); setScope("all"); router.refresh(); }} /> : null}
  </div>;
}

function GoalComposer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<Exclude<LifeArea, null>>("pro");
  const [outcome, setOutcome] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("unset");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/data/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: title.trim(), life_area: lifeArea, desired_outcome: outcome.trim() || null, definition_of_done: null,
        status: "active", priority, configuration_status: "ready", horizon: null, start_date: null,
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
        <label className="field"><span>Domaine</span><select className="input" value={lifeArea} onChange={(event) => setLifeArea(event.target.value as Exclude<LifeArea, null>)}><option value="pro">PRO</option><option value="perso">PERSO</option><option value="religion">RELIGION</option></select></label>
        <label className="field"><span>Priorité</span><select className="input" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="unset">À définir</option><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option></select></label>
        <label className="field sm:col-span-2"><span>Résultat recherché</span><textarea className="input min-h-24" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="Décrire ce qui devra être vrai lorsque l’objectif sera atteint" /></label>
        <label className="field sm:col-span-2"><span>Date cible (facultative)</span><input className="input" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p> : null}
        <footer className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="button-secondary" onClick={onClose}>Annuler</button><button className="button-primary" disabled={saving || !title.trim()}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}{saving ? "Création…" : "Créer l’objectif"}</button></footer>
      </form>
    </section>
  </div>;
}

function MissionRow({ mission }: { mission: GoalBoardMission }) {
  const recurrence = describeTaskRecurrence(mission.recurrenceRule);
  const completed = mission.status === "done";
  return <li className="flex items-start gap-3 px-4 py-3"><div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}>{completed ? <Check size={16} /> : <Circle size={15} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`font-bold ${completed ? "text-slate-500 line-through" : ""}`}>{mission.title}</p><PriorityBadge priority={mission.priority} />{mission.occursToday && !completed ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">AUJOURD’HUI</span> : null}</div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">{mission.plannedOn ? <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDate(mission.plannedOn)}{mission.plannedTime ? ` à ${mission.plannedTime.slice(0, 5)}` : ""}</span> : <span>Non planifiée</span>}{mission.estimateMinutes ? <span>{mission.estimateMinutes} min</span> : null}{mission.projectTitle ? <span>{mission.projectTitle}</span> : null}{recurrence ? <span>{recurrence}{mission.recurrenceUntil ? ` jusqu’au ${formatDate(mission.recurrenceUntil)}` : ""}</span> : null}</div></div></li>;
}
function AreaBadge({ area }: { area: LifeArea }) { if (!area) return null; const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>; }
function PriorityBadge({ priority }: { priority: string }) { if (!priority || priority === "unset") return null; const tone = priority === "critical" ? "bg-red-50 text-red-700" : priority === "high" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`}>{priority.toUpperCase()}</span>; }
function goalTone(area: LifeArea) { return area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : area === "religion" ? "bg-amber-50 text-amber-800" : "bg-orange-50 text-orange-700"; }
function areaTone(area: AreaFilter) { if (area === "pro") return "bg-blue-600 text-white"; if (area === "perso") return "bg-rose-500 text-white"; if (area === "religion") return "bg-amber-500 text-white"; return "bg-slate-950 text-white"; }
function formatDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
function compareMissions(a: GoalBoardMission, b: GoalBoardMission) { if (a.status === "done" && b.status !== "done") return 1; if (a.status !== "done" && b.status === "done") return -1; if (a.occursToday !== b.occursToday) return a.occursToday ? -1 : 1; return (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999") || a.title.localeCompare(b.title, "fr"); }
async function safeJson(response: Response): Promise<ApiEnvelope> { try { return await response.json() as ApiEnvelope; } catch { return { ok: false, error: { message: "Réponse serveur invalide." } }; } }
