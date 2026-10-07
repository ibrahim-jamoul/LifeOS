"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Heart,
  LoaderCircle,
  MoonStar,
  Plus,
  RotateCcw,
  Target,
  X,
} from "lucide-react";
import { groupTodayItems, type TodayAreaKey, type TodayItemGroup } from "@/lib/domain/today-groups";

export type LifeArea = "pro" | "perso" | "religion" | null;

export type DashboardTodayItem = {
  id: string;
  kind: "task" | "routine" | "reminder";
  title: string;
  lifeArea: LifeArea;
  durationMinutes: number | null;
  plannedTime: string | null;
  context: string | null;
  completed: boolean;
  recurring: boolean;
  taskId: string | null;
  routineId: string | null;
  routineType: "habit" | "religion" | null;
  href?: string | null;
};

export type DashboardUpcomingItem = {
  id: string;
  date: string;
  title: string;
  lifeArea: LifeArea;
  time: string | null;
  durationMinutes: number | null;
  context: string | null;
  recurring: boolean;
  href?: string | null;
};

export type DashboardGoal = {
  id: string;
  title: string;
  lifeArea: LifeArea;
  progress: number;
  targetDate: string | null;
  status: string;
  remainingMissions: number;
};

export type GoalOption = { id: string; title: string; lifeArea: LifeArea };
export type ProjectOption = { id: string; title: string; lifeArea: LifeArea };

type ApiEnvelope = { ok: boolean; error?: { message?: string } };

export function LifeDashboard(props: {
  today: string;
  nextDayStartsAt: string;
  dateLabel: string;
  todayItems: DashboardTodayItem[];
  upcoming: DashboardUpcomingItem[];
  goals: DashboardGoal[];
  goalOptions: GoalOption[];
  projectOptions: ProjectOption[];
}) {
  const { today, nextDayStartsAt, dateLabel, todayItems, upcoming, goals, goalOptions, projectOptions } = props;
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState(today);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openAreas, setOpenAreas] = useState<Record<TodayAreaKey, boolean>>({ pro: true, perso: false, religion: false, other: false });

  const totals = useMemo(() => {
    const done = todayItems.filter((item) => item.completed).length;
    const areas = (["pro", "perso", "religion"] as const).map((area) => {
      const items = todayItems.filter((item) => item.lifeArea === area);
      return { area, done: items.filter((item) => item.completed).length, total: items.length };
    });
    return { done, total: todayItems.length, areas };
  }, [todayItems]);
  const todayGroups = useMemo(() => groupTodayItems(todayItems), [todayItems]);

  useEffect(() => {
    const boundary = Date.parse(nextDayStartsAt);
    const refreshForNewDay = () => {
      if (Date.now() >= boundary) router.refresh();
    };
    const delay = Math.max(0, Math.min(boundary - Date.now() + 250, 2_147_483_647));
    const timer = window.setTimeout(refreshForNewDay, delay);
    document.addEventListener("visibilitychange", refreshForNewDay);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshForNewDay);
    };
  }, [nextDayStartsAt, router]);

  async function post(id: string, url: string, body: unknown) {
    setPending(id);
    setError(null);
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await safeJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "L’opération n’a pas pu être enregistrée.");
      setExpanded(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’opération n’a pas pu être enregistrée.");
    } finally {
      setPending(null);
    }
  }

  async function setCompletion(item: DashboardTodayItem, completed: boolean) {
    if (item.kind === "task" && item.taskId) {
      await post(item.id, `/api/tasks/${item.taskId}/complete`, { occurredOn: today, completed });
      return;
    }
    if (item.kind === "routine" && item.routineId && item.routineType) {
      await post(item.id, "/api/routines/toggle", { routineType: item.routineType, routineId: item.routineId, occurredOn: today, completed });
    }
  }

  async function replan(item: DashboardTodayItem, plannedOn: string) {
    if (!item.taskId || item.recurring) return;
    await post(item.id, `/api/tasks/${item.taskId}/plan`, { plannedOn });
  }

  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 pb-10">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold capitalize text-slate-500">{dateLabel}</p>
            <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Aujourd’hui</h1>
          </div>
          <button className="button-primary shrink-0 rounded-2xl px-3 sm:px-4" onClick={() => setComposerOpen(true)}>
            <Plus size={18} /><span className="hidden sm:inline">Ajouter une tâche</span><span className="sm:hidden">Ajouter</span>
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4"><ProgressRing value={totals.done} total={totals.total} /><div><strong className="text-2xl">{totals.done} / {totals.total}</strong><p className="text-sm text-slate-500">actions terminées</p></div></div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[26rem]">{totals.areas.map((item) => <AreaCounter key={item.area} {...item} />)}</div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div> : null}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div className="grid size-10 place-items-center rounded-2xl bg-slate-900 text-white"><Check size={18} /></div><div><h2 className="text-xl font-black sm:text-2xl">À faire aujourd’hui</h2><p className="text-xs text-slate-500">Seulement ce qui est réellement prévu aujourd’hui.</p></div></header>
        {todayItems.length === 0 ? (
          <div className="px-5 py-10 text-center"><Check className="mx-auto text-emerald-600" /><p className="mt-2 font-bold">Aucune action prévue aujourd’hui.</p><button className="button-secondary mt-4" onClick={() => setComposerOpen(true)}><Plus size={16} />Planifier une action</button></div>
        ) : (
          <div className="grid gap-3 bg-slate-50/60 p-3 sm:p-4">
            {todayGroups.map((group) => <TodayAreaSection
              key={group.key}
              group={group}
              open={openAreas[group.key]}
              expandedItem={expanded}
              pendingItem={pending}
              today={today}
              tomorrow={tomorrow}
              nextWeek={nextWeek}
              customDate={customDate}
              onToggleArea={() => setOpenAreas((current) => ({ ...current, [group.key]: !current[group.key] }))}
              onToggleItem={(item) => { setExpanded(expanded === item.id ? null : item.id); setCustomDate(today); }}
              onCustomDateChange={setCustomDate}
              onSetCompletion={setCompletion}
              onReplan={replan}
            />)}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><CalendarDays size={22} /><h2 className="text-xl font-black sm:text-2xl">À venir</h2></div><Link href="/app/planning" className="text-sm font-bold text-emerald-800">Planning</Link></header>
        {upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map((item) => <li key={item.id}>{item.href ? <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"><UpcomingRow item={item} /></Link> : <div className="flex items-center gap-3 px-4 py-3 sm:px-5"><UpcomingRow item={item} /></div>}</li>)}</ul> : <p className="px-5 py-6 text-sm text-slate-500">Aucune action future planifiée.</p>}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><Target size={22} /><div><h2 className="text-xl font-black sm:text-2xl">Objectifs 2026</h2><p className="text-xs text-slate-500">Séparés des tâches quotidiennes.</p></div></div><Link href="/app/goals/objectives" className="text-sm font-bold text-emerald-800">Ouvrir</Link></header>
        {goals.length ? <div className="divide-y divide-slate-100">{goals.map((goal) => <Link key={goal.id} href={`/app/goals/objectives?goal=${goal.id}`} className="block px-5 py-4 hover:bg-slate-50"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{goal.title}</p><AreaBadge area={goal.lifeArea} /></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${clamp(goal.progress)}%` }} /></div><p className="mt-1 text-xs text-slate-500">{goal.progress}% · {goal.remainingMissions} mission{goal.remainingMissions > 1 ? "s" : ""} restante{goal.remainingMissions > 1 ? "s" : ""}{goal.targetDate ? ` · ${formatShortDate(goal.targetDate)}` : ""}</p></div><ChevronRight size={18} className="text-slate-400" /></div></Link>)}</div> : <p className="px-5 py-6 text-sm text-slate-500">Aucun objectif actif.</p>}
      </section>

      <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 px-5 py-4"><div className="flex items-start gap-3"><div className="grid size-10 place-items-center rounded-full bg-emerald-200 text-emerald-900"><Target size={18} /></div><div><p className="font-black text-emerald-950">Focus du jour</p><p className="text-sm text-emerald-900/80">Faire l’essentiel sans transformer les objectifs annuels en tâches.</p></div></div></div>

      {composerOpen ? <TaskComposer today={today} goals={goalOptions} projects={projectOptions} onClose={() => setComposerOpen(false)} onSaved={() => { setComposerOpen(false); router.refresh(); }} /> : null}
    </div>
  );
}

function TodayAreaSection(props: {
  group: TodayItemGroup<DashboardTodayItem>;
  open: boolean;
  expandedItem: string | null;
  pendingItem: string | null;
  today: string;
  tomorrow: string;
  nextWeek: string;
  customDate: string;
  onToggleArea: () => void;
  onToggleItem: (item: DashboardTodayItem) => void;
  onCustomDateChange: (date: string) => void;
  onSetCompletion: (item: DashboardTodayItem, completed: boolean) => Promise<void>;
  onReplan: (item: DashboardTodayItem, plannedOn: string) => Promise<void>;
}) {
  const { group, open, expandedItem, pendingItem, today, tomorrow, nextWeek, customDate, onToggleArea, onToggleItem, onCustomDateChange, onSetCompletion, onReplan } = props;
  const area = todayAreaPresentation(group.key);
  const panelId = `today-area-${group.key}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button type="button" className="grid min-h-14 w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left sm:px-5" aria-expanded={open} aria-controls={panelId} onClick={onToggleArea}>
        <span className={`rounded-xl px-2.5 py-1.5 text-xs font-black tracking-[0.08em] ${area.tone}`}>{area.label}</span>
        <span className="text-sm text-slate-500">{group.remaining} à faire · {group.completed} faite{group.completed > 1 ? "s" : ""}</span>
        <ChevronDown className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} size={18} />
      </button>

      {open ? <div id={panelId} className="border-t border-slate-100">
        {group.items.length === 0 ? <p className="px-4 py-5 text-sm text-slate-500 sm:px-5">Aucune mission dans cette catégorie aujourd’hui.</p> : <ul className="divide-y divide-slate-100">
          {group.items.map((item, index) => {
            const itemOpen = expandedItem === item.id;
            const busy = pendingItem === item.id;
            const firstCompleted = item.completed && index === group.remaining;
            return <li key={item.id} className={item.completed ? "bg-emerald-50/25" : ""}>
              {firstCompleted ? <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 sm:px-5">Terminées</div> : null}
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:px-5">
                {item.kind === "reminder" ? <div className="grid size-11 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700"><Bell size={17} /></div> :
                  <button className={`grid size-11 place-items-center rounded-xl border ${item.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400 hover:border-emerald-500"}`} disabled={busy} onClick={() => void onSetCompletion(item, !item.completed)} aria-label={item.completed ? `Annuler la validation de ${item.title}` : `Terminer ${item.title}`}>
                    {busy ? <LoaderCircle className="animate-spin" size={18} /> : item.completed ? <Check size={18} /> : <Circle size={17} />}
                  </button>}
                <div className="min-w-0 pt-0.5">
                  <p className={`whitespace-normal break-words font-bold leading-5 ${item.completed ? "text-slate-500 line-through" : "text-slate-950"}`}>{item.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-slate-500">{item.context ? <span className="whitespace-normal break-words">{item.context}</span> : null}{item.plannedTime ? <span className="inline-flex items-center gap-1"><Clock3 size={12} />{item.plannedTime.slice(0, 5)}</span> : null}{item.durationMinutes ? <span>{item.durationMinutes} min</span> : null}{item.recurring ? <span>Récurrente</span> : null}</div>
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-3 sm:row-start-1 sm:justify-end">
                  {item.kind === "reminder" && item.href ? <Link href={item.href} className="button-secondary min-h-11 px-3 py-1 sm:min-h-9"><ChevronRight size={15} />Ouvrir</Link> : item.kind !== "reminder" ? <button className={item.completed ? "button-secondary min-h-11 px-3 py-1 text-xs sm:min-h-9" : "button-primary min-h-11 px-3 py-1 text-xs sm:min-h-9"} disabled={busy} onClick={() => void onSetCompletion(item, !item.completed)}>{item.completed ? "Annuler fait" : "Fait"}</button> : null}
                  {item.kind === "task" && !item.completed ? <button className="grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 sm:size-9" onClick={() => onToggleItem(item)} aria-label={`Options de ${item.title}`} aria-expanded={itemOpen}><ChevronDown className={itemOpen ? "rotate-180" : ""} size={18} /></button> : null}
                </div>
              </div>
              {itemOpen && !item.completed && item.kind === "task" ? <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5"><div className="flex flex-wrap gap-2">
                {!item.recurring ? <>
                  <button className="button-secondary min-h-9 px-3 py-1" onClick={() => void onReplan(item, tomorrow)}><RotateCcw size={14} />Demain</button>
                  <button className="button-secondary min-h-9 px-3 py-1" onClick={() => void onReplan(item, nextWeek)}><CalendarDays size={14} />+7 jours</button>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5"><input className="bg-transparent px-1 text-sm outline-none" type="date" min={today} value={customDate} onChange={(event) => onCustomDateChange(event.target.value)} /><button className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white" onClick={() => void onReplan(item, customDate)}>Replanifier</button></div>
                </> : <Link className="button-secondary min-h-9 px-3 py-1" href="/app/goals/tasks"><CalendarDays size={14} />Modifier la récurrence</Link>}
              </div></div> : null}
            </li>;
          })}
        </ul>}
      </div> : null}
    </section>
  );
}

function todayAreaPresentation(area: TodayAreaKey): { label: string; tone: string } {
  if (area === "pro") return { label: "PRO", tone: "bg-blue-50 text-blue-700" };
  if (area === "perso") return { label: "PERSO", tone: "bg-rose-50 text-rose-700" };
  if (area === "religion") return { label: "RELIGION", tone: "bg-amber-50 text-amber-800" };
  return { label: "À CLASSER", tone: "bg-slate-100 text-slate-700" };
}

function UpcomingRow({ item }: { item: DashboardUpcomingItem }) {
  return <><DateTile date={item.date} /><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.context ?? (item.recurring ? "Occurrence récurrente" : "Action planifiée")}{item.time ? ` · ${item.time.slice(0, 5)}` : ""}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}</p></div><AreaBadge area={item.lifeArea} /><ChevronRight size={18} className="text-slate-400" /></>;
}

export function TaskComposer(props: {
  today: string;
  goals: GoalOption[];
  projects: ProjectOption[];
  onClose: () => void;
  onSaved: () => void;
  initialGoalId?: string;
  initialLifeArea?: LifeArea;
}) {
  const { today, goals, projects, onClose, onSaved, initialGoalId, initialLifeArea } = props;
  const initialGoal = goals.find((goal) => goal.id === initialGoalId);
  const [title, setTitle] = useState("");
  const [plannedOn, setPlannedOn] = useState(today);
  const [plannedTime, setPlannedTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [priority, setPriority] = useState("medium");
  const [lifeArea, setLifeArea] = useState<"" | Exclude<LifeArea, null>>((initialGoal?.lifeArea ?? initialLifeArea ?? "") as "" | Exclude<LifeArea, null>);
  const [goalId, setGoalId] = useState(initialGoalId ?? "");
  const [projectId, setProjectId] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [weekdays, setWeekdays] = useState<number[]>([isoWeekday(today)]);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = lifeArea ? projects.filter((project) => !project.lifeArea || project.lifeArea === lifeArea) : projects;

  function chooseGoal(value: string) {
    setGoalId(value);
    const goal = goals.find((item) => item.id === value);
    if (goal?.lifeArea) setLifeArea(goal.lifeArea);
  }

  function toggleWeekday(day: number) {
    setWeekdays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => a - b));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !plannedOn) return;
    if (recurrence === "weekly" && weekdays.length === 0) { setError("Choisis au moins un jour."); return; }
    const recurrenceRule = recurrence === "none" ? null : recurrence === "daily" ? "daily" : recurrence === "weekly" ? `weekly:${weekdays.join(",")}` : `monthly:${Number(plannedOn.slice(8, 10))}`;
    const payload = {
      title: title.trim(), life_area: lifeArea || null, goal_id: goalId || null, project_id: projectId || null,
      status: "todo", priority, configuration_status: "ready", planned_on: plannedOn, planned_time: plannedTime || null,
      recurrence_rule: recurrenceRule, recurrence_until: recurrence === "none" ? null : recurrenceUntil || null,
      due_on: dueOn || null, due_at: null, estimate_minutes: duration ? Number(duration) : null, actual_minutes: null, notes: null,
    };
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/data/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await safeJson(response);
      if (!response.ok || !result.ok) throw new Error(result.error?.message || "Création impossible.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Création impossible."); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/45 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
    <section className="max-h-[96vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[2rem]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Mission / tâche</p><h2 className="text-2xl font-black">Planifier une action</h2></div><button className="button-secondary size-10 px-0" onClick={onClose}><X size={18} /></button></header>
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <label className="field sm:col-span-2"><span>Titre *</span><input autoFocus className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Décrire l’action à réaliser" /></label>
        <label className="field"><span>Date planifiée *</span><input className="input" type="date" min={today} value={plannedOn} onChange={(event) => { setPlannedOn(event.target.value); if (recurrence === "weekly" && event.target.value) setWeekdays([isoWeekday(event.target.value)]); }} /></label>
        <label className="field"><span>Heure</span><input className="input" type="time" value={plannedTime} onChange={(event) => setPlannedTime(event.target.value)} /></label>
        <label className="field"><span>Durée estimée</span><input className="input" type="number" min="0" step="5" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
        <label className="field"><span>Priorité</span><select className="input" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="unset">À définir</option><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option></select></label>
        <label className="field"><span>Domaine</span><select className="input" value={lifeArea} onChange={(event) => setLifeArea(event.target.value as "" | Exclude<LifeArea, null>)}><option value="">— Aucun —</option><option value="pro">PRO</option><option value="perso">PERSO</option><option value="religion">RELIGION</option></select></label>
        <label className="field"><span>Objectif parent</span><select className="input" value={goalId} onChange={(event) => chooseGoal(event.target.value)}><option value="">— Mission indépendante —</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
        <label className="field"><span>Projet parent</span><select className="input" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">— Aucun —</option>{filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        <label className="field"><span>Récurrence</span><select className="input" value={recurrence} onChange={(event) => { const value = event.target.value as typeof recurrence; setRecurrence(value); if (value === "weekly" && plannedOn) setWeekdays([isoWeekday(plannedOn)]); }}><option value="none">Non</option><option value="daily">Tous les jours</option><option value="weekly">Chaque semaine</option><option value="monthly">Chaque mois</option></select></label>
        {recurrence !== "none" ? <label className="field"><span>Fin de récurrence</span><input className="input" type="date" min={plannedOn} value={recurrenceUntil} onChange={(event) => setRecurrenceUntil(event.target.value)} /></label> : null}
        {recurrence === "weekly" ? <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Jours</legend><div className="flex flex-wrap gap-2">{["L", "M", "M", "J", "V", "S", "D"].map((label, index) => { const day = index + 1; const active = weekdays.includes(day); return <button key={day} type="button" className={`grid size-10 place-items-center rounded-xl border text-sm font-bold ${active ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-500"}`} onClick={() => toggleWeekday(day)}>{label}</button>; })}</div></fieldset> : null}
        <label className="field sm:col-span-2"><span>Échéance réelle (facultative)</span><input className="input" type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} /><span className="text-xs font-normal text-slate-500">Planifiée = quand tu travailles dessus. Échéance = quand elle doit être finie.</span></label>
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</div> : null}
        <footer className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:col-span-2"><button type="button" className="button-secondary" onClick={onClose}>Annuler</button><button className="button-primary" disabled={saving || !title.trim() || !plannedOn}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}{saving ? "Création…" : "Créer la mission"}</button></footer>
      </form>
    </section>
  </div>;
}

function ProgressRing({ value, total }: { value: number; total: number }) { const pct = total ? Math.round(value / total * 100) : 0; return <div className="grid size-20 place-items-center rounded-full" style={{ background: `conic-gradient(#35a66f ${pct}%, #edf1ef ${pct}% 100%)` }}><div className="grid size-14 place-items-center rounded-full bg-white text-sm font-black text-emerald-800">{pct}%</div></div>; }
function AreaCounter({ area, done, total }: { area: Exclude<LifeArea, null>; done: number; total: number }) { const Icon = area === "pro" ? BriefcaseBusiness : area === "perso" ? Heart : MoonStar; return <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-2 py-3 text-xs font-bold shadow-sm"><Icon size={15} /><span className="hidden sm:inline">{area.toUpperCase()}</span><span className="text-slate-500">{done}/{total}</span></div>; }
function AreaBadge({ area }: { area: LifeArea }) { if (!area) return null; const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>; }
function DateTile({ date }: { date: string }) { const value = new Date(`${date}T12:00:00Z`); const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "UTC" }).format(value); const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(value).replace(".", "").toUpperCase(); return <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 leading-none"><span className="text-[10px] font-black text-slate-500">{month}</span><strong className="-mt-2 text-xl">{day}</strong></div>; }
function addDays(date: string, amount: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
function isoWeekday(date: string) { const day = new Date(`${date}T12:00:00Z`).getUTCDay(); return day || 7; }
function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function formatShortDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
async function safeJson(response: Response): Promise<ApiEnvelope> { try { return await response.json() as ApiEnvelope; } catch { return { ok: false, error: { message: "Réponse serveur invalide." } }; } }
