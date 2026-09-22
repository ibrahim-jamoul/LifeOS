import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await params;
  const completedAt = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from("tasks")
    .update({ status: "done", completed_at: completedAt })
    .eq("id", id)
    .eq("user_id", auth.userId)
    .not("status", "in", "(done,cancelled)")
    .select("id,title,project_id,planned_on,due_on,due_at")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("NOT_FOUND", "Tâche introuvable ou déjà clôturée.", 404);

  if (typeof data.project_id === "string") {
    const { error: projectActivityError } = await auth.supabase
      .from("projects")
      .update({ last_activity_at: completedAt })
      .eq("id", data.project_id)
      .eq("user_id", auth.userId);
    if (projectActivityError) console.error("LifeOS project activity refresh failed", { code: projectActivityError.code });
  }

  const { error: logError } = await auth.supabase.from("activity_log").insert({
    user_id: auth.userId,
    entity_type: "tasks",
    entity_id: id,
    action: "completed",
    summary: String(data.title).slice(0, 160),
  });
  if (logError) console.error("LifeOS task completion activity log failed", { code: logError.code });

  return apiData({ ...data, completed_at: completedAt });
}
