"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Plus, Repeat2 } from "lucide-react";
import { TaskComposer, type GoalOption, type LifeArea, type ProjectOption } from "@/components/life-dashboard";

export type PlanningItem = { id: string; date: string | null; time: string | null; title: string; lifeArea: LifeArea; durationMinutes: number | null; context: string | null; recurring: boolean };

export function PlanningBoard({ today, sections, goals, projects }: { today: string; sections: { key: string; title: string; items: PlanningItem[] }[]; goals: GoalOption[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return <div className="grid gap-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Planning orienté action</p><h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">Calendrier LifeOS</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Aujourd’hui, demain, cette semaine, plus tard. Les objectifs n’apparaissent ici que lorsqu’une mission est planifiée.</p></div><button className="button-primary" onClick={() => setOpen(true)}><Plus size={17} />Planifier une tâche</button></header>
    <div className="grid gap-4 lg:grid-cols-2">{sections.map((section) => <section key={section.key} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"><header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><CalendarDays size={20} /><h2 className="text-xl font-black">{section.title}</h2><span className="ml-auto text-sm text-slate-500">{section.items.length}</span></header>{section.items.length ? <ul className="divide-y divide-slate-100">{section.items.map((item) => <li key={item.id} className="flex items-start gap-3 px-5 py-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-bold">{item.title}</p>{item.recurring ? <Repeat2 size={13} className="text-emerald-700" /> : null}</div><p className="mt-1 text-xs text-slate-500">{item.date ? formatDate(item.date) : "À planifier"}{item.time ? ` · ${item.time.slice(0, 5)}` : ""}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}{item.context ? ` · ${item.context}` : ""}</p></div><Area area={item.lifeArea} /></li>)}</ul> : <p className="px-5 py-6 text-sm text-slate-500">Aucune action dans cette période.</p>}</section>)}</div>
    {open ? <TaskComposer today={today} goals={goals} projects={projects} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} /> : null}
  </div>;
}
function Area({ area }: { area: LifeArea }) { if (!area) return null; const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
