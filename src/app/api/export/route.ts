import { apiError, isApiResponse, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const userTables = [
  "life_vision", "domains", "goals", "kpis", "kpi_entries", "projects", "goal_projects", "tasks",
  "reminders", "notifications", "decisions", "weekly_reviews", "study_topics", "study_sessions",
  "religion_routines", "religion_logs", "arabic_profiles", "arabic_sessions", "quran_items", "quran_sessions",
  "financial_accounts", "financial_transactions", "budget_items", "financial_goals", "net_worth_snapshots",
  "habits", "habit_logs", "health_metrics", "health_entries", "workouts", "documents", "memories",
  "memory_assets", "ai_threads", "ai_messages", "activity_log",
] as const;

export async function GET() {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;

  try {
    const profileResult = await auth.supabase.from("profiles").select("*").eq("id", auth.userId).maybeSingle();
    if (profileResult.error) throw profileResult.error;

    const entries = await Promise.all(userTables.map(async (table) => {
      const rows: Record<string, unknown>[] = [];
      const pageSize = 1_000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await auth.supabase
          .from(table)
          .select("*")
          .eq("user_id", auth.userId)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...((data ?? []) as Record<string, unknown>[]));
        if ((data?.length ?? 0) < pageSize) break;
      }
      return [table, rows] as const;
    }));

    const exportedAt = new Date().toISOString();
    const payload = {
      format: "lifeos-export",
      version: 1,
      exported_at: exportedAt,
      owner_id: auth.userId,
      data: { profiles: profileResult.data ? [profileResult.data] : [], ...Object.fromEntries(entries) },
      files: {
        included: false,
        note: "Le JSON contient les métadonnées et chemins privés, pas les fichiers binaires des buckets Supabase.",
      },
    };
    const filename = `lifeos-export-${exportedAt.slice(0, 10)}.json`;
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("LifeOS export failed", { code: error && typeof error === "object" && "code" in error ? String(error.code) : "UNKNOWN" });
    return apiError("EXPORT_FAILED", "L’export n’a pas pu être généré.", 500);
  }
}
