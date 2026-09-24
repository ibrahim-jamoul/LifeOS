import type { Metadata } from "next";
import { BookMarked, BookOpenText, CheckCircle2, Clock3, RefreshCcw, SunMedium } from "lucide-react";
import { addCalendarDays, calendarDateInTimeZone } from "@/lib/domain/routines";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Progression · Apprentissage" };
export const dynamic = "force-dynamic";

type StudySession = { duration_minutes: number; occurred_at: string };
type QuranSession = { duration_minutes: number | null; occurred_at: string; confidence: number | null };
type ReligionLog = { occurred_on: string; count: number };
type Topic = { status: string; progress_percent: number };
type Point = { status: string };

export default async function LearningProgressPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);
  const weekStart = addCalendarDays(today, -6);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [studyR, quranR, logsR, topicsR, pointsR] = await Promise.all([
    supabase.from("study_sessions").select("duration_minutes,occurred_at").eq("user_id", userId).eq("domain_slug", "religion").gte("occurred_at", `${monthStart}T00:00:00Z`).limit(2000),
    supabase.from("quran_sessions").select("duration_minutes,occurred_at,confidence").eq("user_id", userId).gte("occurred_at", `${monthStart}T00:00:00Z`).limit(2000),
    supabase.from("religion_logs").select("occurred_on,count").eq("user_id", userId).gte("occurred_on", monthStart).lte("occurred_on", today).limit(5000),
    supabase.from("study_topics").select("status,progress_percent").eq("user_id", userId).eq("domain_slug", "religion").limit(1000),
    supabase.from("quran_revision_points").select("status").eq("user_id", userId).limit(1000),
  ]);

  const study = (studyR.data ?? []) as StudySession[];
  const quran = (quranR.data ?? []) as QuranSession[];
  const logs = (logsR.data ?? []) as ReligionLog[];
  const topics = (topicsR.data ?? []) as Topic[];
  const points = (pointsR.data ?? []) as Point[];

  const weeklyStudy = study.filter((row) => dateOnly(row.occurred_at, timezone) >= weekStart);
  const weeklyQuran = quran.filter((row) => dateOnly(row.occurred_at, timezone) >= weekStart);
  const weeklyLogs = logs.filter((row) => row.occurred_on >= weekStart && row.count > 0);
  const monthMinutes = sumMinutes(study) + sumMinutes(quran);
  const weekMinutes = sumMinutes(weeklyStudy) + sumMinutes(weeklyQuran);
  const completedTopics = topics.filter((topic) => topic.status === "completed").length;
  const activePoints = points.filter((point) => point.status === "active").length;
  const resolvedPoints = points.filter((point) => point.status === "resolved").length;
  const avgConfidence = average(quran.map((row) => row.confidence).filter((value): value is number => typeof value === "number"));

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="rounded-[2rem] border border-[#e6ddd0] bg-[#fffdf8] p-5 shadow-sm sm:p-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Apprentissage · Religion</p><h1 className="mt-1 text-4xl font-black tracking-[-0.045em]">Progression</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Une vue statistique séparée du quotidien. Les chiffres proviennent uniquement de vos sessions, routines et révisions enregistrées.</p></section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Clock3 size={20} />} label="Temps · 7 jours" value={formatMinutes(weekMinutes)} note={`${formatMinutes(monthMinutes)} ce mois`} />
        <Metric icon={<BookOpenText size={20} />} label="Sessions d’étude · 7 j" value={weeklyStudy.length} note={`${study.length} ce mois`} />
        <Metric icon={<BookMarked size={20} />} label="Sessions Coran · 7 j" value={weeklyQuran.length} note={avgConfidence === null ? "Confiance non mesurée" : `Confiance moyenne ${avgConfidence.toFixed(1)}/5`} />
        <Metric icon={<SunMedium size={20} />} label="Routines cochées · 7 j" value={weeklyLogs.length} note={`${logs.filter((row) => row.count > 0).length} ce mois`} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#e6ddd0] bg-[#fffdf8] p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><CheckCircle2 size={20} /></span><div><h2 className="text-xl font-black">Apprentissages</h2><p className="text-sm text-slate-500">État réel des sujets créés.</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><SmallMetric label="Sujets maîtrisés" value={completedTopics} /><SmallMetric label="Sujets actifs" value={topics.filter((topic) => topic.status === "active").length} /><SmallMetric label="Progression moyenne" value={`${Math.round(average(topics.map((topic) => Number(topic.progress_percent)).filter(Number.isFinite)) ?? 0)}%`} /><SmallMetric label="Sessions du mois" value={study.length} /></div></article>
        <article className="rounded-[2rem] border border-[#e6ddd0] bg-[#fffdf8] p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><RefreshCcw size={20} /></span><div><h2 className="text-xl font-black">Consolidation Coran</h2><p className="text-sm text-slate-500">Les points fragiles restent visibles jusqu’à maîtrise.</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><SmallMetric label="Points actifs" value={activePoints} /><SmallMetric label="Points maîtrisés" value={resolvedPoints} /><SmallMetric label="Révisions ce mois" value={quran.filter((row) => row.occurred_at).length} /><SmallMetric label="Temps Coran" value={formatMinutes(sumMinutes(quran))} /></div></article>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note: string }) { return <article className="rounded-[1.6rem] border border-[#e6ddd0] bg-[#fffdf8] p-5 shadow-sm"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">{icon}</span><span className="mt-4 block text-xs font-semibold text-slate-500">{label}</span><strong className="mt-1 block text-3xl tracking-[-0.04em]">{value}</strong><span className="mt-1 block text-xs text-slate-500">{note}</span></article>; }
function SmallMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-[#f4efe7] p-4"><span className="block text-xs text-slate-500">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
function sumMinutes(rows: readonly { duration_minutes: number | null }[]) { return rows.reduce((sum, row) => sum + (typeof row.duration_minutes === "number" ? row.duration_minutes : 0), 0); }
function average(values: readonly number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function formatMinutes(minutes: number) { if (minutes < 60) return `${minutes} min`; const h = Math.floor(minutes / 60); const m = minutes % 60; return m ? `${h} h ${m}` : `${h} h`; }
function dateOnly(value: string, timezone: string) { return calendarDateInTimeZone(new Date(value), timezone); }
