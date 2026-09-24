"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Plus, Repeat2 } from "lucide-react";
import { TaskComposer, type GoalOption, type LifeArea, type ProjectOption } from "@/components/life-dashboard";

export type PlanningItem = {
  id: string;
  date: string | null;
  time: string | null;
  title: string;
  lifeArea: LifeArea;
  durationMinutes: number | null;
  context: string | null;
  recurring: boolean;
};

export function PlanningBoard({ today, sections, goals, projects }: { today: string; sections: { key: string; title: string; items: PlanningItem[] }[]; goals: GoalOption[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const total = useMemo(() => sections.reduce((sum, section) => sum + section.items.length, 0), [sections]);

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <header className="rounded-[2rem] border border-emerald-100 bg-white/92 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Planning</p>
            <h1 className="section-title mt-1">Planifier</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Une seule vue simple pour voir les échéances, repérer les tâches non planifiées et poser une mission sur n’importe quel jour X.</p>
          </div>
          <button className="button-primary" onClick={() => setOpen(true)}>
            <Plus size={17} /> Ajouter une tâche
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MiniStat label="Total visible" value={String(total)} tone="emerald" />
          <MiniStat label="Aujourd’hui" value={String(sections.find((section) => section.key === "today")?.items.length ?? 0)} tone="blue" />
          <MiniStat label="À planifier" value={String(sections.find((section) => section.key === "unplanned")?.items.length ?? 0)} tone="amber" />
        </div>
      </header>

      <div className="rounded-[1.75rem] border border-emerald-100 bg-white/92 p-2 shadow-sm">
        <div className="grid grid-cols-7 gap-1">
          {week.map((date, index) => {
            const active = index === 0;
            return (
              <div key={date} className={`rounded-2xl px-1 py-3 text-center ${active ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600"}`}>
                <span className="block text-[10px] font-black uppercase tracking-wide">{weekday(date)}</span>
                <strong className="mt-1 block text-base">{date.slice(8, 10)}</strong>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <section key={section.key} className="overflow-hidden rounded-[1.85rem] border border-emerald-100 bg-white/95 shadow-sm">
            <header className="flex items-center gap-3 border-b border-emerald-50 px-5 py-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CalendarDays size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black">{section.title}</h2>
                <p className="text-xs text-slate-500">{section.items.length} élément{section.items.length > 1 ? "s" : ""}</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{section.items.length}</span>
            </header>

            {section.items.length ? (
              <ul className="divide-y divide-slate-100">
                {section.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-slate-950">{item.title}</p>
                        {item.recurring ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700"><Repeat2 size={12} />Récurrente</span> : null}
                        <Area area={item.lifeArea} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.date ? formatDate(item.date) : "À planifier"}
                        {item.time ? ` · ${item.time.slice(0, 5)}` : ""}
                        {item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}
                        {item.context ? ` · ${item.context}` : ""}
                      </p>
                    </div>
                    <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">Aucune action dans cette période.</p>
            )}
          </section>
        ))}
      </div>

      {open ? <TaskComposer today={today} goals={goals} projects={projects} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} /> : null}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "blue" | "amber" }) {
  const styles = tone === "emerald" ? "bg-emerald-50 text-emerald-800" : tone === "blue" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800";
  return <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4"><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><div className="mt-2 flex items-center justify-between"><strong className="text-2xl text-slate-950">{value}</strong><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${styles}`}>{label}</span></div></div>;
}

function Area({ area }: { area: LifeArea }) {
  if (!area) return null;
  const tone = area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{area.toUpperCase()}</span>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function weekday(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
