import type { Metadata } from "next";
import { BookOpen, RefreshCcw } from "lucide-react";
import { QuranAttentionManager } from "@/components/quran-attention-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Révisions · Apprentissage" };
export const dynamic = "force-dynamic";

type PointRow = {
  id: string;
  quran_item_id: string | null;
  surah_number: number;
  ayah_number: number;
  issue_type: string;
  note: string | null;
  priority: number;
  status: "active" | "resolved" | "archived";
  occurrence_count: number;
  last_seen_at: string;
  next_review_at: string | null;
  resolved_at: string | null;
};

type QuranItem = { id: string; surah_number: number; surah_name: string | null; start_ayah: number | null; end_ayah: number | null; next_revision_at: string | null; confidence: number | null; status: string };

export default async function LearningRevisionsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : "";
  const now = new Date().toISOString();

  const [pointsR, itemsR] = await Promise.all([
    supabase.from("quran_revision_points").select("id,quran_item_id,surah_number,ayah_number,issue_type,note,priority,status,occurrence_count,last_seen_at,next_review_at,resolved_at").eq("user_id", userId).neq("status", "archived").order("priority", { ascending: false }).order("last_seen_at", { ascending: false }).limit(200),
    supabase.from("quran_items").select("id,surah_number,surah_name,start_ayah,end_ayah,next_revision_at,confidence,status").eq("user_id", userId).neq("status", "paused").order("next_revision_at", { ascending: true, nullsFirst: false }).limit(200),
  ]);

  const points = ((pointsR.data ?? []) as PointRow[]).map((row) => ({
    id: row.id,
    quranItemId: row.quran_item_id,
    surahNumber: row.surah_number,
    ayahNumber: row.ayah_number,
    issueType: row.issue_type,
    note: row.note,
    priority: row.priority,
    status: row.status,
    occurrenceCount: row.occurrence_count,
    lastSeenAt: row.last_seen_at,
    nextReviewAt: row.next_review_at,
    resolvedAt: row.resolved_at,
  }));

  const items = (itemsR.data ?? []) as QuranItem[];
  const options = items.map((item) => ({ id: item.id, label: quranItemLabel(item), surahNumber: item.surah_number, startAyah: item.start_ayah, endAyah: item.end_ayah }));
  const dueItems = items.filter((item) => item.next_revision_at && item.next_revision_at <= now);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-[#e8dfd1] bg-[#fffdf8] p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Apprentissage · Religion</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-4xl font-black tracking-[-0.045em] text-slate-950">Révisions</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Les difficultés persistantes passent avant les révisions standards. Cette file appartient uniquement à l’écosystème Apprentissage.</p></div>
          <div className="rounded-2xl bg-[#efe7d9] px-4 py-3 text-sm"><strong>{dueItems.length}</strong> passage{dueItems.length > 1 ? "s" : ""} arrivé{dueItems.length > 1 ? "s" : ""} à échéance</div>
        </div>
      </section>

      <QuranAttentionManager points={points} quranItems={options} />

      <section className="rounded-[2rem] border border-[#e8dfd1] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
        <header className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><RefreshCcw size={20} /></span><div><h2 className="text-2xl font-black">Révisions standards dues</h2><p className="text-sm text-slate-500">Éléments Coran dont la prochaine révision est arrivée.</p></div></header>
        {dueItems.length === 0 ? <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Aucune échéance Coran standard pour le moment.</div> : <div className="mt-5 divide-y divide-slate-100">{dueItems.slice(0, 20).map((item) => <article key={item.id} className="flex items-center gap-3 py-4"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen size={18} /></span><div className="min-w-0 flex-1"><strong>{quranItemLabel(item)}</strong><p className="mt-0.5 text-xs text-slate-500">Confiance : {item.confidence ?? "—"}/5 · échéance {item.next_revision_at ? formatDate(item.next_revision_at) : "—"}</p></div></article>)}</div>}
      </section>
    </div>
  );
}

function quranItemLabel(item: QuranItem) {
  const range = item.start_ayah && item.end_ayah ? ` · ${item.start_ayah}-${item.end_ayah}` : item.start_ayah ? ` · v.${item.start_ayah}` : "";
  return `${item.surah_name || `Sourate ${item.surah_number}`}${range}`;
}
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)); }
