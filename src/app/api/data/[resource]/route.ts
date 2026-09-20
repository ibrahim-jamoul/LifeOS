import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { getResourceConfig } from "@/lib/resources";
import { attachProjectGoals, hydrateProjects, recordActivity, toDatabasePayload, verifyRelations } from "@/lib/resource-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ resource: string }> };

function safeSearch(value: string): string {
  return value.replace(/[,%()]/g, " ").trim().slice(0, 120);
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { resource } = await routeContext.params;
  const config = getResourceConfig(resource);
  if (!config) return apiError("NOT_FOUND", "Ressource inconnue.", 404);

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1) || 1);
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 50) || 50;
  const limit = Math.min(Math.max(requestedLimit, 1), 200);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase.from(config.table).select("*", { count: "exact" });
  query = config.table === "profiles" ? query.eq("id", auth.userId) : query.eq("user_id", auth.userId);
  for (const [key, value] of Object.entries(config.fixedValues ?? {})) query = query.eq(key, value);

  const search = safeSearch(request.nextUrl.searchParams.get("q") ?? "");
  if (search && config.searchFields?.length) {
    query = query.or(config.searchFields.map((field) => `${field}.ilike.%${search}%`).join(","));
  }
  for (const field of config.filterFields ?? []) {
    const value = request.nextUrl.searchParams.get(field);
    if (value !== null && value !== "") query = query.eq(field, value);
  }

  const view = request.nextUrl.searchParams.get("view");
  const now = new Date();
  if (config.key === "tasks" && view) {
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);
    const endWeek = new Date(endToday);
    endWeek.setDate(endWeek.getDate() + ((7 - endWeek.getDay()) % 7));
    query = query.not("status", "in", "(done,cancelled)").not("due_at", "is", null);
    if (view === "today") query = query.gte("due_at", new Date(now.setHours(0, 0, 0, 0)).toISOString()).lte("due_at", endToday.toISOString());
    if (view === "week") query = query.gte("due_at", new Date(now.setHours(0, 0, 0, 0)).toISOString()).lte("due_at", endWeek.toISOString());
    if (view === "overdue") query = query.lt("due_at", new Date().toISOString());
  }
  if (config.key === "quran_items" && view === "revision") {
    query = query.not("next_revision_at", "is", null).lte("next_revision_at", new Date().toISOString()).neq("status", "paused");
  }

  const { data, error, count } = await query
    .order(config.orderBy, { ascending: config.ascending ?? false, nullsFirst: false })
    .range(from, to);
  if (error) return databaseError(error);

  let items = (data ?? []) as Record<string, unknown>[];
  if (config.key === "projects") items = await hydrateProjects(auth, items);
  return apiData({ items, page, limit, count: count ?? items.length, totalPages: Math.max(1, Math.ceil((count ?? items.length) / limit)) });
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { resource } = await routeContext.params;
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
      const { data, error } = await auth.supabase.rpc("create_financial_transfer", {
        p_source_account_id: parsed.account_id,
        p_destination_account_id: parsed.destination_account_id,
        p_occurred_on: parsed.occurred_on,
        p_amount: parsed.amount,
        p_currency: parsed.currency,
        p_description: parsed.description,
        p_notes: parsed.notes,
      });
      if (error) return databaseError(error);
      await recordActivity(auth, config, null, "created");
      return apiData(data, { status: 201 });
    }

    const payload = { ...toDatabasePayload(config, parsed), ...(config.fixedValues ?? {}) };
    if (config.key === "tasks") payload.completed_at = parsed.status === "done" ? new Date().toISOString() : null;
    const ownedPayload = config.table === "profiles"
      ? { ...payload, id: auth.userId }
      : { ...payload, user_id: auth.userId };

    let mutation;
    if (config.upsertConflict) {
      mutation = auth.supabase.from(config.table).upsert(ownedPayload as never, { onConflict: config.upsertConflict }).select().single();
    } else {
      mutation = auth.supabase.from(config.table).insert(ownedPayload as never).select().single();
    }
    const { data, error } = await mutation;
    if (error || !data) return databaseError(error);

    if (config.key === "projects" && typeof data.id === "string") {
      const goalIds = Array.isArray(parsed.goal_ids) ? parsed.goal_ids.filter((id): id is string => typeof id === "string") : [];
      const linkError = await attachProjectGoals(auth, data.id, goalIds, false);
      if (linkError) {
        await auth.supabase.from("projects").delete().eq("id", data.id).eq("user_id", auth.userId);
        return linkError;
      }
      data.goal_ids = goalIds;
    }

    await recordActivity(auth, config, typeof data.id === "string" ? data.id : null, "created", payload);
    return apiData(data, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return apiError("VALIDATION_ERROR", "Corrigez les champs signalés.", 400, error.flatten().fieldErrors);
    return apiError("INVALID_INPUT", "Le formulaire est invalide.", 400);
  }
}
