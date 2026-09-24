import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookMarked, BookOpenText, CheckCircle2, Clock3, Library, RefreshCcw, Sparkles, SunMedium } from "lucide-react";
import { RoutinesToday, type RoutineTodayItem } from "@/components/routines-today";
import { addCalendarDays, calendarDateInTimeZone, isRoutineActionableOn, routineCompletionWindow, type RoutineSchedule } from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Apprentissage" };
export const dynamic = "force-dynamic";

type RoutineRow = {
  id: string; name: string; target_frequency: string; target_count: number | null; target_unit: string | null; duration_minutes: number | null;
  schedule_weekday: number | null; schedule_day_of_month: number | null; schedule_window_weekdays: number[] | null; schedule_month_weeks: number[] | null;
  start_on: string | null; end_on: string | null; paused_at: string | null; archived_at: string | null; active: boolean; status: string; time_context: string | null; configuration_status: RoutineTodayItem["configurationStatus"];
};
type LogRow = { routine_id: string; occurred_on: string; count: number };
type TopicRow = { id: string; title: string; category: string | null; status: string; target_date: string | null; progress_percent: number; resource: string | null };
type QuranRow = { id: string; surah_number: number; surah_name: string | null; start_ayah: number | null; end_ayah: number | null; next_revision_at: string | null; confidence: number | null };
type PointRow = { id: string; surah_number: number; ayah_number: number; priority: number; next_review_at: string | null; status: string; note: string | null };

export default async function LearningHomePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const now = new Date();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(now, timezone);
  const weekStart = addCalendarDays(today, -6);

  const [routinesR, logsR, topicsR, quranR, pointsR, sessionsR] = await Promise.all([
    supabase.from("religion_routines").select("id,name,target_frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,paused_at,archived_at,active,status,time_context,configuration_status").eq("user_id", userId).eq("active", true).eq("status", "active").limit(300),
    supabase.from("religion_logs").select("routine_id,occurred_on,count").eq("user_id", userId).gte("occurred_on", weekStart).lte("occurred_on", today).limit(2000),
    supabase.from("study_topics").select("id,title,category,status,target_date,progress_percent,resource").eq("user_id", userId).eq("domain_slug", "religion").not("status", "in", "(archived,paused)").order("updated_at", { ascending: false }).limit(100),
    supabase.from("quran_items").select("id,surah_number,surah_name,start_ayah,end_ayah,next_revision_at,confidence").eq("user_id", userId).neq("status", "paused").order("next_revision_at", { ascending: true, nullsFirst: false }).limit(100),
    supabase.from("quran_revision_points").select("id,surah_number,ayah_number,priority,next_review_at,status,note").eq("user_id", userId).eq("status", "active").order("priority", { ascending: false }).limit(100),
    supabase.from("study_sessions").select("id,duration_minutes,occurred_at").eq("user_id", userId).eq("domain_slug", "religion").gte("occurred_at", `${weekStart}T00:00:00Z`).limit(500),
  ]);

  const logs = (logsR.data ?? []) as LogRow[];
  const logMap = new Map(logs.map((log) => [`${log.routine_id}:${log.occurred_on}`, log.count]));
  const routines = ((routinesR.data ?? []) as RoutineRow[]).flatMap((row): RoutineTodayItem[] => {
    const schedule: RoutineSchedule = {
      frequency: row.target_frequency, active: row.active && row.status === "active", scheduleWeekday: row.schedule_weekday, scheduleDayOfMonth: row.schedule_day_of_month,
      scheduleWindowWeekdays: row.schedule_window_weekdays ?? [], scheduleMonthWeeks: row.schedule_month_weeks ?? [], startOn: row.start_on, endOn: row.end_on, pausedAt: row.paused_at, archivedAt: row.archived_at,
    };
    if (!isRoutineActionableOn(schedule, today)) return [];
    const window = routineCompletionWindow(schedule, today);
    const completedOn = window ? findCompletionDate(logMap, row.id, window.startsOn, window.endsOn) : null;
    return [{ id: row.id, routineType: "religion", name: row.name, completed: Boolean(completedOn), completedOn, completedCount: completedOn ? logMap.get(`${row.id}:${completedOn}`) ?? 1 : 0, targetCount: row.target_count, targetUnit: row.target_unit, durationMinutes: row.duration_minutes, lifeArea: "religion", timeContext: row.time_context, periodLabel: window?.label ?? null, configurationStatus: row.configuration_status }];
  });

  const topics = (topicsR.data ?? []) as TopicRow[];
  const quran = (quranR.data ?? []) as QuranRow[];
  const points = (pointsR.data ?? []) as PointRow[];
  const lessonsToday = topics.filter((topic) => topic.target_date === today);
  const dueQuran = quran.filter((item) => item.next_revision_at && calendarDateInTimeZone(new Date(item.next_revision_at), timezone) <= today);
  const duePoints = points.filter((point) => !point.next_review_at || calendarDateInTimeZone(new Date(point.next_review_at), timezone) <= today);
  const weekMinutes = (sessionsR.data ?? []).reduce((sum, row) => sum + (typeof row.duration_minutes === "number" ? row.duration_minutes : 0), 0);
  const programCount = routines.length + lessonsToday.length + dueQuran.length + duePoints.length;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#e6ddd0] bg-[#fffdf8] shadow-sm">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Apprentissage · Religion</p><h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">Apprendre. Réviser. Grandir.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Ici, aucune mission annuelle ni tâche générale de LifeOS. Cet espace ne contient que votre apprentissage religieux et les données nécessaires pour le faire progresser.</p></div>
          <div className="grid grid-cols-2 gap-3"><Metric label="Programme du jour" value={programCount} /><Metric label="Temps étudié · 7 j" value={`${weekMinutes} min`} /><Metric label="Points actifs" value={points.length} /><Metric label="Sujets en cours" value={topics.filter((topic) => topic.status === "active").length} /></div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#e6ddd0] bg-[#fffdf8] shadow-sm">
        <header className="flex items-center gap-3 border-b border-[#eee5d9] px-5 py-4 sm:px-6"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><Sparkles size={20} /></span><div><h2 className="text-2xl font-black">Aujourd’hui dans Apprentissage</h2><p className="text-sm text-slate-500">Uniquement les éléments d’apprentissage réellement prévus ou arrivés à échéance aujourd’hui.</p></div></header>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><SunMedium size={18} className="text-amber-600" /><h3 className="font-black">Routines dues</h3></div><RoutinesToday date={today} items={routines} /></div>
          <div className="grid content-start gap-3">
            <ProgramGroup title="Leçons planifiées" icon={<BookOpenText size={17} />} empty="Aucune leçon datée aujourd’hui." items={lessonsToday.map((topic) => ({ id: topic.id, title: topic.title, subtitle: [categoryLabel(topic.category), topic.resource].filter(Boolean).join(" · "), href: "/app/learning/lessons" }))} />
            <ProgramGroup title="Révisions Coran" icon={<BookMarked size={17} />} empty="Aucune révision Coran arrivée à échéance." items={dueQuran.slice(0, 5).map((item) => ({ id: item.id, title: quranLabel(item), subtitle: `Confiance ${item.confidence ?? "—"}/5`, href: "/app/learning/revisions" }))} />
            <ProgramGroup title="Points d’attention" icon={<AlertTriangle size={17} />} empty="Aucun point d’attention à revoir aujourd’hui." items={duePoints.slice(0, 5).map((point) => ({ id: point.id, title: `Sourate ${point.surah_number} · verset ${point.ayah_number}`, subtitle: point.note ?? `Priorité ${point.priority}`, href: "/app/learning/revisions" }))} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/app/learning/lessons" icon={<BookOpenText size={20} />} title="Leçons" body="Sujets et sessions d’étude" />
        <QuickLink href="/app/learning/revisions" icon={<RefreshCcw size={20} />} title="Révisions" body="File Coran et difficultés" />
        <QuickLink href="/app/learning/resources" icon={<Library size={20} />} title="Ressources" body="Bibliothèque religieuse" />
        <QuickLink href="/app/learning/progress" icon={<CheckCircle2 size={20} />} title="Progression" body="Données réelles, séparées du quotidien" />
      </section>

      {topics.filter((topic) => topic.status === "active").length > 0 ? <section className="rounded-[2rem] border border-[#e6ddd0] bg-[#fffdf8] p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Continuité</p><h2 className="mt-1 text-2xl font-black">En cours d’apprentissage</h2></div><Link href="/app/learning/lessons" className="button-secondary">Tout voir <ArrowRight size={16} /></Link></div><div className="mt-4 grid gap-3 md:grid-cols-2">{topics.filter((topic) => topic.status === "active").slice(0, 4).map((topic) => <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><strong>{topic.title}</strong><p className="mt-1 text-xs text-slate-500">{categoryLabel(topic.category)}</p></div><span className="text-sm font-black text-emerald-800">{Math.round(Number(topic.progress_percent) || 0)}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(0, Math.min(Number(topic.progress_percent) || 0, 100))}%` }} /></div></article>)}</div></section> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-[#f3eee5] p-4"><span className="block text-xs font-semibold text-slate-500">{label}</span><strong className="mt-1 block text-2xl text-slate-950">{value}</strong></div>; }
function QuickLink({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) { return <Link href={href} className="rounded-[1.5rem] border border-[#e6ddd0] bg-[#fffdf8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">{icon}</span><strong className="mt-4 block">{title}</strong><span className="mt-1 block text-sm text-slate-500">{body}</span></Link>; }
function ProgramGroup({ title, icon, empty, items }: { title: string; icon: React.ReactNode; empty: string; items: readonly { id: string; title: string; subtitle: string; href: string }[] }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="flex items-center gap-2 font-black">{icon}{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-slate-500">{empty}</p> : <div className="mt-2 divide-y divide-slate-100">{items.map((item) => <Link href={item.href} key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><strong className="block truncate text-sm">{item.title}</strong>{item.subtitle ? <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span> : null}</div><ArrowRight size={15} className="shrink-0 text-slate-400" /></Link>)}</div>}</div>; }
function findCompletionDate(map: Map<string, number>, routineId: string, start: string, end: string) { for (const [key, count] of map) { if (count <= 0 || !key.startsWith(`${routineId}:`)) continue; const date = key.slice(-10); if (date >= start && date <= end) return date; } return null; }
function quranLabel(item: QuranRow) { const range = item.start_ayah && item.end_ayah ? ` · ${item.start_ayah}-${item.end_ayah}` : item.start_ayah ? ` · v.${item.start_ayah}` : ""; return `${item.surah_name || `Sourate ${item.surah_number}`}${range}`; }
function categoryLabel(value: string | null) { const labels: Record<string,string> = { islamic_history: "Histoire islamique", aqeedah: "Aqeedah", fiqh: "Fiqh", seerah: "Sîra", hadith_sciences: "Sciences du hadith", other: "Autre" }; return value ? labels[value] ?? value : "Sujet religieux"; }
