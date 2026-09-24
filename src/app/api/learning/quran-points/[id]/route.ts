import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

const actionSchema = z.object({ action: z.enum(["fragile", "mastered", "reopen"]) });

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await context.params;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Action invalide.", 400);

  const { data: point, error: lookupError } = await auth.supabase
    .from("quran_revision_points")
    .select("id,status,occurrence_count,next_review_at")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (lookupError) return databaseError(lookupError);
  if (!point) return apiError("NOT_FOUND", "Point d’attention introuvable.", 404);

  const now = new Date().toISOString();
  const action = parsed.data.action;
  const changes = action === "mastered"
    ? { status: "resolved", resolved_at: now, last_seen_at: now }
    : action === "reopen"
      ? { status: "active", resolved_at: null, last_seen_at: now, next_review_at: now }
      : { status: "active", resolved_at: null, last_seen_at: now, occurrence_count: Math.max(1, Number(point.occurrence_count) || 1) + 1 };

  const { data, error } = await auth.supabase
    .from("quran_revision_points")
    .update(changes)
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select()
    .single();
  if (error || !data) return databaseError(error);
  return apiData(data);
}
