"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Plus, Repeat2 } from "lucide-react";
import { TaskComposer, type GoalOption, type LifeArea, type ProjectOption } from "@/components/life-dashboard";

export type PlanningItem = { id: string; date: string | null; time: string | null; title: string; lifeArea: LifeArea; durationMinutes: number | null; context: string | null; recurring: boolean };

export function PlanningBoard({ today, sections, goals, projects }: { today: string; sections: { key: string; title: string; items: PlanningItem[] }[]; goals: GoalOption[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  return <div className="mx-auto grid max-w-5xl gap-5">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Planning</p><h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">Planifier simplement</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Une seule vue pour voir les échéances et placer une tâche sur le jour exact où tu veux la faire.</p></div><button className="button-primary" onClick={() => setOpen(true)}><Plus size={17} />Ajouter une tâche</button></header>

    <div className="grid grid-cols-7 gap-1 rounded-2xl border border-emerald-100 bg-white/90 p-2 shadow-sm">{week.map((date, index) => <div key={date} className={`rounded-xl px-1 py-2 text-center ${index === 0 ? "bg-emerald-600 text-white" : "text-slate-500"}`}><span className="block text-[10px] font-black uppercase">{weekday(date)}</span><strong className="mt-1 block text-sm">{date.slice(8, 10)}</strong></div>)}</div>

    <div className="grid gap-4">{sections.map((section) => <section key={section.key} className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white/95 shadow-sm"><header className="flex items-center gap-3 border-b border-emerald-50 px-5 py-4"><div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays size={18} /></div><h2 className="text-lg font-black">{section.title}</h2><span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{section.items.length}</span></header>{section.items.length ? <ul className="divide-y divide-slate-100">{section.items.map((item) => <li key={item.id} className="flex items-start gap-3 px-5 py-3.5"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-bold">{item.title}</p>{item.recurring ? <Repeat2 size={13} className="text-emerald-700" /> : null}</div><p className="mt-1 text-xs text-slate-500">{item.date ? formatDate(item.date) : "À planifier"}{item.time ? ` · ${item.time.slice(0, 5)}` : ""}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}{item.context ? ` · ${item.context}` : ""}</p></div><Area area={item.lifeArea} /></li>)}</ul> : <p className="px-5 py-6 text-sm text-slate-500">Aucune action dans cette période.</p>}</section>)}</div>
    {open ? <TaskComposer today={today} goals={goals} projects={projects} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} /> : null}
  </div>;
}
function Area({ area }: { area: LifeArea }) { if (!area) return null; const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
function weekday(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(".", ""); }
function addDays(date: string, amount: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
