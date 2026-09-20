import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { getResourceConfig } from "@/lib/resources";
import { attachProjectGoals, recordActivity, toDatabasePayload, verifyRelations } from "@/lib/resource-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: Request, routeContext: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { resource, id } = await routeContext.params;
  const config = getResourceConfig(resource);
  if (!config) return apiError("NOT_FOUND", "Ressource inconnue.", 404);
  if (config.readOnly) return apiError("READ_ONLY", "Cette ressource est en lecture seule.", 405);

  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  try {
    const parsed = config.schema.parse(input) as Record<string, unknown>;
    const relationError = await verifyRelations(auth, config, parsed);
    if (relationError) return relationError;
    if (config.key === "financial_transactions" && parsed.tx_type === "transfer") {
      return apiError("RECREATE_TRANSFER", "Pour préserver la paire comptable, supprimez puis recréez ce transfert.", 409);
    }

    const payload = { ...toDatabasePayload(config, parsed), ...(config.fixedValues ?? {}) };
    if (config.key === "tasks") payload.completed_at = parsed.status === "done" ? new Date().toISOString() : null;
    let query = auth.supabase.from(config.table).update(payload).eq("id", id);
    query = config.table === "profiles" ? query.eq("id", auth.userId) : query.eq("user_id", auth.userId);
    const { data, error } = await query.select().maybeSingle();
    if (error) return databaseError(error);
    if (!data) return apiError("NOT_FOUND", "Enregistrement introuvable.", 404);

    if (config.key === "projects" && typeof data.id === "string") {
      const goalIds = Array.isArray(parsed.goal_ids) ? parsed.goal_ids.filter((goalId): goalId is string => typeof goalId === "string") : [];
      const linkError = await attachProjectGoals(auth, data.id, goalIds, true);
      if (linkError) return linkError;
      data.goal_ids = goalIds;
    }

    const archived = config.archive && parsed[config.archive.field] === config.archive.value;
    await recordActivity(auth, config, typeof data.id === "string" ? data.id : null, archived ? "archived" : "updated", payload);
    return apiData(data);
  } catch (error) {
    if (error instanceof ZodError) return apiError("VALIDATION_ERROR", "Corrigez les champs signalés.", 400, error.flatten().fieldErrors);
    return apiError("INVALID_INPUT", "Le formulaire est invalide.", 400);
  }
}

export async function DELETE(_request: Request, routeContext: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { resource, id } = await routeContext.params;
  const config = getResourceConfig(resource);
  if (!config) return apiError("NOT_FOUND", "Ressource inconnue.", 404);
  if (config.readOnly || config.singleton) return apiError("READ_ONLY", "Cette ressource ne peut pas être supprimée ici.", 405);

  if (config.key === "financial_transactions") {
    const { data: transaction, error: lookupError } = await auth.supabase
      .from("financial_transactions")
      .select("transfer_group_id")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (lookupError) return databaseError(lookupError);
    if (!transaction) return apiError("NOT_FOUND", "Transaction introuvable.", 404);
    if (transaction.transfer_group_id) {
      const { error } = await auth.supabase
        .from("financial_transactions")
        .delete()
        .eq("user_id", auth.userId)
        .eq("transfer_group_id", transaction.transfer_group_id);
      if (error) return databaseError(error);
      await recordActivity(auth, config, id, "deleted");
      return apiData({ id, deleted: true });
    }
  }

  const { data, error } = await auth.supabase
    .from(config.table)
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("NOT_FOUND", "Enregistrement introuvable.", 404);
  await recordActivity(auth, config, id, "deleted");
  return apiData({ id, deleted: true });
}
