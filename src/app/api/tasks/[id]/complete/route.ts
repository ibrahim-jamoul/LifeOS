import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id,title")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("NOT_FOUND", "Tâche introuvable.", 404);
  return apiData(data);
}
