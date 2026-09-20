import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { getDerivedAlerts, materializeAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  try {
    const [derived, persisted] = await Promise.all([
      getDerivedAlerts(auth.supabase, auth.userId),
      auth.supabase
        .from("notifications")
        .select("*")
        .eq("user_id", auth.userId)
        .is("dismissed_at", null)
        .or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (persisted.error) return databaseError(persisted.error);
    const activeKeys = new Set(derived.map((alert) => alert.dedupeKey));
    return apiData({ derived, persisted: (persisted.data ?? []).filter((notification) => activeKeys.has(notification.dedupe_key)) });
  } catch {
    return apiError("ALERTS_UNAVAILABLE", "Impossible de charger les alertes.", 500);
  }
}

export async function POST() {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  try {
    return apiData(await materializeAlerts(auth.supabase, auth.userId));
  } catch {
    return apiError("ALERT_GENERATION_FAILED", "Impossible de mettre à jour les alertes.", 500);
  }
}

const lifecycleSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), id: z.uuid() }),
  z.object({ action: z.literal("unread"), id: z.uuid() }),
  z.object({ action: z.literal("dismiss"), id: z.uuid() }),
  z.object({ action: z.literal("snooze"), id: z.uuid(), until: z.iso.datetime({ offset: true }) }),
]);

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;
  const parsed = lifecycleSchema.safeParse(input);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Action d’alerte invalide.", 400);

  const update = parsed.data.action === "read" ? { read_at: new Date().toISOString() }
    : parsed.data.action === "unread" ? { read_at: null }
    : parsed.data.action === "dismiss" ? { dismissed_at: new Date().toISOString() }
    : { snoozed_until: parsed.data.until, read_at: new Date().toISOString() };
  const { data, error } = await auth.supabase
    .from("notifications")
    .update(update)
    .eq("id", parsed.data.id)
    .eq("user_id", auth.userId)
    .select()
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("NOT_FOUND", "Alerte introuvable.", 404);
  return apiData(data);
}
