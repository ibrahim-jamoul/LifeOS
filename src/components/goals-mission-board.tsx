"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Circle, Flag, Plus, Target } from "lucide-react";
import { TaskComposer, type GoalOption, type LifeArea, type ProjectOption } from "@/components/life-dashboard";
import { describeTaskRecurrence } from "@/lib/domain/task-recurrence";

export type GoalBoardGoal = {
  id: string; title: string; lifeArea: LifeArea; status: string; priority: string;
  progress: number; targetDate: string | null; desiredOutcome: string | null;
};
export type GoalBoardMission = {
  id: string; goalId: string; title: string; status: string; priority: string; lifeArea: LifeArea;
  plannedOn: string | null; plannedTime: string | null; estimateMinutes: number | null;
  projectTitle: string | null; recurrenceRule: string | null; recurrenceUntil: string | null;
};

export function GoalsMissionBoard(props: { today: string; goals: GoalBoardGoal[]; missions: GoalBoardMission[]; projects: ProjectOption[]; initialGoalId?: string | null }) {
  const { today, goals, missions, projects, initialGoalId } = props;
  const router = useRouter();
  const [area, setArea] = useState<"all" | Exclude<LifeArea, null>>("all");
  const [expanded, setExpanded] = useState<string | null>(initialGoalId ?? goals[0]?.id ?? null);
  const [composerGoal, setComposerGoal] = useState<GoalBoardGoal | null>(null);
  const visibleGoals = useMemo(() => goals.filter((goal) => area === "all" || goal.lifeArea === area), [goals, area]);
  const goalOptions: GoalOption[] = goals.map((goal) => ({ id: goal.id, title: goal.title, lifeArea: goal.lifeArea }));

  return <div className="grid gap-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Vision → Objectifs → Missions</p><h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">Objectifs & sous-missions</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Un objectif décrit le résultat. Les actions concrètes sont des missions datées, rattachées directement à cet objectif.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/app/goals/vision" className="button-secondary">Vision</Link><Link href="/app/goals/objectives-admin" className="button-secondary">Gérer les objectifs</Link><Link href="/app/goals/tasks" className="button-secondary">Toutes les tâches</Link></div>
    </header>

    <div className="flex flex-wrap gap-2">{(["all", "pro", "perso", "religion"] as const).map((value) => <button key={value} className={`rounded-full px-4 py-2 text-sm font-bold ${area === value ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`} onClick={() => setArea(value)}>{value === "all" ? "Tous" : value.toUpperCase()}</button>)}</div>

    <div className="grid gap-4">{visibleGoals.map((goal) => {
      const rows = missions.filter((mission) => mission.goalId === goal.id).sort(compareMissions);
      const remaining = rows.filter((mission) => !["done", "cancelled"].includes(mission.status)).length;
      const done = rows.filter((mission) => mission.status === "done").length;
      const open = expanded === goal.id;
      return <section key={goal.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <button className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6" onClick={() => setExpanded(open ? null : goal.id)}>
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Target size={21} /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black sm:text-2xl">{goal.title}</h2><AreaBadge area={goal.lifeArea} /><StatusBadge status={goal.status} /></div>{goal.desiredOutcome ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{goal.desiredOutcome}</p> : null}<div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} /></div><strong className="text-sm">{goal.progress}%</strong></div><div className="mt-2 flex flex-wrap gap-x-4 text-xs text-slate-500"><span>{remaining} mission{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</span><span>{done} terminée{done > 1 ? "s" : ""}</span>{goal.targetDate ? <span>Échéance {formatDate(goal.targetDate)}</span> : null}</div></div>
          <ChevronDown className={`mt-2 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open ? <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">Missions de cet objectif</h3><p className="text-xs text-slate-500">Elles apparaissent dans Aujourd’hui uniquement à leur date.</p></div><button className="button-primary" onClick={() => setComposerGoal(goal)}><Plus size={16} />Ajouter une mission</button></div>
          {rows.length ? <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{rows.map((mission) => <MissionRow key={mission.id} mission={mission} />)}</ul> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center"><Flag className="mx-auto text-slate-400" /><p className="mt-2 font-bold">Aucune mission définie.</p><p className="mt-1 text-sm text-slate-500">Découpe cet objectif en prochaines actions concrètes.</p><button className="button-primary mt-4" onClick={() => setComposerGoal(goal)}><Plus size={16} />Créer la première mission</button></div>}
        </div> : null}
      </section>;
    })}</div>

    {visibleGoals.length === 0 ? <div className="card text-center text-sm text-slate-500">Aucun objectif dans ce filtre.</div> : null}
    {composerGoal ? <TaskComposer today={today} goals={goalOptions} projects={projects} initialGoalId={composerGoal.id} initialLifeArea={composerGoal.lifeArea} onClose={() => setComposerGoal(null)} onSaved={() => { setComposerGoal(null); router.refresh(); }} /> : null}
  </div>;
}

function MissionRow({ mission }: { mission: GoalBoardMission }) {
  const recurrence = describeTaskRecurrence(mission.recurrenceRule);
  const completed = mission.status === "done";
  return <li className="flex items-start gap-3 px-4 py-3"><div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}>{completed ? <Check size={16} /> : <Circle size={15} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`font-bold ${completed ? "text-slate-500 line-through" : ""}`}>{mission.title}</p><PriorityBadge priority={mission.priority} /></div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">{mission.plannedOn ? <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{formatDate(mission.plannedOn)}{mission.plannedTime ? ` à ${mission.plannedTime.slice(0, 5)}` : ""}</span> : <span>Non planifiée</span>}{mission.estimateMinutes ? <span>{mission.estimateMinutes} min</span> : null}{mission.projectTitle ? <span>{mission.projectTitle}</span> : null}{recurrence ? <span>{recurrence}{mission.recurrenceUntil ? ` jusqu’au ${formatDate(mission.recurrenceUntil)}` : ""}</span> : null}</div></div><Link href="/app/goals/tasks" className="grid size-8 place-items-center text-slate-400"><ChevronDown className="-rotate-90" size={17} /></Link></li>;
}
function AreaBadge({ area }: { area: LifeArea }) { if (!area) return null; const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>; }
function StatusBadge({ status }: { status: string }) { const tone = status === "at_risk" ? "bg-red-50 text-red-700" : status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{status.replaceAll("_", " ")}</span>; }
function PriorityBadge({ priority }: { priority: string }) { if (!priority || priority === "unset") return null; const tone = priority === "critical" ? "bg-red-50 text-red-700" : priority === "high" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`}>{priority.toUpperCase()}</span>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
function compareMissions(a: GoalBoardMission, b: GoalBoardMission) { if (a.status === "done" && b.status !== "done") return 1; if (a.status !== "done" && b.status === "done") return -1; return (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999") || a.title.localeCompare(b.title, "fr"); }
