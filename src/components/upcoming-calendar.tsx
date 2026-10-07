"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Repeat2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { DashboardUpcomingItem, LifeArea } from "@/components/life-dashboard";
import { calendarMonthGrid, groupCalendarItems, shiftCalendarMonth } from "@/lib/domain/upcoming-calendar";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function UpcomingCalendar({ today, items }: { today: string; items: DashboardUpcomingItem[] }) {
  const groupedItems = useMemo(() => groupCalendarItems(items), [items]);
  const firstDate = items[0]?.date ?? today;
  const lastDate = items.at(-1)?.date ?? today;
  const [selectedDate, setSelectedDate] = useState(firstDate);
  const [visibleMonth, setVisibleMonth] = useState(firstDate.slice(0, 7));
  const gridDays = useMemo(() => calendarMonthGrid(visibleMonth), [visibleMonth]);
  const selectedItems = groupedItems.get(selectedDate) ?? [];
  const minMonth = today.slice(0, 7);
  const maxMonth = lastDate.slice(0, 7);

  function selectDate(date: string) {
    setSelectedDate(date);
    setVisibleMonth(date.slice(0, 7));
  }

  function showMonth(month: string) {
    setVisibleMonth(month);
    const firstEvent = items.find((item) => item.date.startsWith(month));
    setSelectedDate(firstEvent?.date ?? `${month}-01`);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3"><CalendarDays size={22} /><div><h2 className="text-xl font-black sm:text-2xl">À venir</h2><p className="text-xs text-slate-500">Calendrier des prochaines missions.</p></div></div>
        <Link href="/app/planning" className="text-sm font-bold text-emerald-800">Planning</Link>
      </header>

      {items.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">Aucune action future planifiée.</p> : <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
        <div className="border-b border-slate-100 p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black capitalize">{formatMonth(visibleMonth)}</h3>
            <div className="flex items-center gap-1">
              <button type="button" className="button-secondary min-h-11 px-3 text-xs sm:min-h-9" onClick={() => showMonth(minMonth)}>Ce mois</button>
              <button type="button" className="grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 sm:size-9" disabled={visibleMonth <= minMonth} onClick={() => showMonth(shiftCalendarMonth(visibleMonth, -1))} aria-label="Mois précédent"><ChevronLeft size={19} /></button>
              <button type="button" className="grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 sm:size-9" disabled={visibleMonth >= maxMonth} onClick={() => showMonth(shiftCalendarMonth(visibleMonth, 1))} aria-label="Mois suivant"><ChevronRight size={19} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-black uppercase text-slate-400">{WEEKDAYS.map((day, index) => <span key={`${day}-${index}`} className="py-2">{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-y-1">
            {gridDays.map((date) => {
              const dayItems = groupedItems.get(date) ?? [];
              const inMonth = date.startsWith(visibleMonth);
              const selected = date === selectedDate;
              const isToday = date === today;
              const available = date >= today && date.slice(0, 7) >= minMonth && date.slice(0, 7) <= maxMonth;
              return <button key={date} type="button" disabled={!available} onClick={() => selectDate(date)} className={`relative grid min-h-14 place-items-center rounded-2xl px-1 py-1.5 transition sm:min-h-16 ${selected ? "bg-slate-950 text-white shadow-sm" : isToday ? "bg-red-50 text-red-700" : inMonth ? "text-slate-800 hover:bg-slate-100" : "text-slate-300"}`} aria-label={`${formatLongDate(date)}${dayItems.length ? `, ${dayItems.length} mission${dayItems.length > 1 ? "s" : ""}` : ""}`} aria-pressed={selected}>
                <span className={`text-sm font-bold ${isToday && !selected ? "grid size-7 place-items-center rounded-full bg-red-500 text-white" : ""}`}>{Number(date.slice(8, 10))}</span>
                <span className="flex h-2 items-center justify-center gap-0.5" aria-hidden="true">{calendarDots(dayItems)}</span>
              </button>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500"><Legend area="pro" label="PRO" /><Legend area="perso" label="PERSO" /><Legend area="religion" label="RELIGION" /></div>
        </div>

        <aside className="min-w-0 bg-slate-50/55">
          <div className="border-b border-slate-100 px-5 py-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Agenda</p><h3 className="mt-1 text-lg font-black capitalize">{formatLongDate(selectedDate)}</h3><p className="text-xs text-slate-500">{selectedItems.length} mission{selectedItems.length > 1 ? "s" : ""}</p></div>
          {selectedItems.length ? <ul className="divide-y divide-slate-100">{selectedItems.map((item) => <li key={item.id}><AgendaItem item={item} /></li>)}</ul> : <div className="px-5 py-8 text-center"><CalendarDays className="mx-auto text-slate-300" size={28} /><p className="mt-2 text-sm font-semibold text-slate-500">Aucune mission ce jour-là.</p></div>}
        </aside>
      </div>}
    </section>
  );
}

function AgendaItem({ item }: { item: DashboardUpcomingItem }) {
  const content = <div className="flex min-h-20 items-start gap-3 px-5 py-4">
    <span className={`mt-1 h-12 w-1 shrink-0 rounded-full ${areaTone(item.lifeArea)}`} />
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="whitespace-normal break-words font-bold leading-5 text-slate-950">{item.title}</p><AreaPill area={item.lifeArea} /></div><p className="mt-1 whitespace-normal break-words text-xs leading-5 text-slate-500">{item.context ?? (item.recurring ? "Occurrence récurrente" : "Action planifiée")}</p><div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">{item.time ? <span className="inline-flex items-center gap-1"><Clock3 size={13} />{item.time.slice(0, 5)}</span> : null}{item.durationMinutes ? <span>{item.durationMinutes} min</span> : null}{item.recurring ? <span className="inline-flex items-center gap-1"><Repeat2 size={13} />Récurrente</span> : null}</div></div>
    {item.href ? <ChevronRight className="mt-2 shrink-0 text-slate-400" size={18} /> : null}
  </div>;
  return item.href ? <Link href={item.href} className="block hover:bg-white">{content}</Link> : content;
}

function Legend({ area, label }: { area: Exclude<LifeArea, null>; label: string }) { return <span className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${areaTone(area)}`} />{label}</span>; }
function AreaPill({ area }: { area: LifeArea }) { return area ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${areaPillTone(area)}`}>{area.toUpperCase()}</span> : null; }
function areaTone(area: LifeArea) { return area === "pro" ? "bg-blue-500" : area === "perso" ? "bg-rose-500" : area === "religion" ? "bg-amber-500" : "bg-slate-400"; }
function areaPillTone(area: Exclude<LifeArea, null>) { return area === "pro" ? "bg-blue-50 text-blue-700" : area === "perso" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"; }
function calendarDots(items: DashboardUpcomingItem[]) { return [...new Set(items.map((item) => item.lifeArea ?? "other"))].slice(0, 4).map((area) => <span key={area} className={`size-1.5 rounded-full ${areaTone(area === "other" ? null : area as LifeArea)}`} />); }
function formatMonth(month: string) { return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T12:00:00Z`)); }
function formatLongDate(date: string) { return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)); }
