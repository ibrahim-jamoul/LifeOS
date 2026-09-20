import { NextResponse } from "next/server";
import type { AuthenticatedRequest } from "@/lib/api";
import { apiError, databaseError } from "@/lib/api";
import type { ResourceConfig } from "@/lib/resources";
import { getResourceConfig } from "@/lib/resources";

const virtualFields = new Set(["goal_ids", "destination_account_id"]);
const summaryLogResources = new Set(["goals", "projects", "decisions", "weekly_reviews"]);

export function toDatabasePayload(config: ResourceConfig, parsed: unknown): Record<string, unknown> {
  const object = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !virtualFields.has(key) && config.fields.some((field) => field.key === key)),
  );
}

export async function verifyRelations(
  context: AuthenticatedRequest,
  config: ResourceConfig,
  payload: Record<string, unknown>,
): Promise<NextResponse | null> {
  for (const relation of config.relations ?? []) {
    const rawValue = payload[relation.field];
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;
    const ids = relation.multiple ? rawValue : [rawValue];
    if (!Array.isArray(ids)) return apiError("INVALID_RELATION", "Relation invalide.", 400);

    const parent = getResourceConfig(relation.parentResource);
    if (!parent) return apiError("INVALID_RELATION", "Relation non configurée.", 500);

    for (const id of ids) {
      if (typeof id !== "string") return apiError("INVALID_RELATION", "Relation invalide.", 400);
      let query = context.supabase.from(parent.table).select("id").eq("id", id);
      query = parent.table === "profiles" ? query.eq("id", context.userId) : query.eq("user_id", context.userId);
      for (const [key, value] of Object.entries(parent.fixedValues ?? {})) query = query.eq(key, value);
      const { data, error } = await query.maybeSingle();
      if (error || !data) return apiError("INVALID_RELATION", "La relation choisie n’existe pas ou ne vous appartient pas.", 400);
    }
  }
  return null;
}

export async function attachProjectGoals(
  context: AuthenticatedRequest,
  projectId: string,
  goalIds: readonly string[],
  replace: boolean,
): Promise<NextResponse | null> {
  if (replace) {
    const { error } = await context.supabase
      .from("goal_projects")
      .delete()
      .eq("user_id", context.userId)
      .eq("project_id", projectId);
    if (error) return databaseError(error);
  }
  if (goalIds.length === 0) return null;
  const rows = goalIds.map((goalId) => ({ user_id: context.userId, project_id: projectId, goal_id: goalId }));
  const { error } = await context.supabase.from("goal_projects").upsert(rows, { onConflict: "user_id,goal_id,project_id" });
  return error ? databaseError(error) : null;
}

export async function hydrateProjects(
  context: AuthenticatedRequest,
  rows: readonly Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const projectIds = rows.map((row) => row.id).filter((id): id is string => typeof id === "string");
  if (projectIds.length === 0) return [...rows];
  const { data } = await context.supabase
    .from("goal_projects")
    .select("project_id,goal_id")
    .eq("user_id", context.userId)
    .in("project_id", projectIds);
  const goalsByProject = new Map<string, string[]>();
  for (const link of data ?? []) {
    if (typeof link.project_id !== "string" || typeof link.goal_id !== "string") continue;
    goalsByProject.set(link.project_id, [...(goalsByProject.get(link.project_id) ?? []), link.goal_id]);
  }
  return rows.map((row) => ({ ...row, goal_ids: typeof row.id === "string" ? goalsByProject.get(row.id) ?? [] : [] }));
}

export async function recordActivity(
  context: AuthenticatedRequest,
  config: ResourceConfig,
  entityId: string | null,
  action: "created" | "updated" | "archived" | "deleted",
  payload?: Record<string, unknown>,
): Promise<void> {
  const rawSummary = summaryLogResources.has(config.key) ? payload?.[config.primaryField] : null;
  const summary = typeof rawSummary === "string" ? rawSummary.slice(0, 160) : null;
  const { error } = await context.supabase.from("activity_log").insert({
    user_id: context.userId,
    entity_type: config.key,
    entity_id: entityId,
    action,
    summary,
  });
  if (error) console.error("LifeOS activity log failed", { code: error.code });
}
