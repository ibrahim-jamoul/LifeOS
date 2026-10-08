import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { calendarDateInTimeZone } from "@/lib/domain/routines";
import { taskOccursOn } from "@/lib/domain/task-recurrence";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const planTaskSchema = z.object({
  plannedOn: z.iso.date().nullable(),
  occurrenceOn: z.iso.date().optional(),
}).strict();

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;

  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;
  const parsed = planTaskSchema.safeParse(input);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "La date de planification est invalide.", 400, parsed.error.flatten().fieldErrors);
  }

  const { id } = await params;
  const { data: task, error: taskError } = await auth.supabase
    .from("tasks")
    .select("id,title,status,planned_on,recurrence_rule,recurrence_until")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (taskError) return databaseError(taskError);
  if (!task) return apiError("NOT_FOUND", "Tâche introuvable.", 404);
  if (task.status === "done" || task.status === "cancelled") {
    return apiError("TASK_CLOSED", "Cette tâche est déjà clôturée.", 409);
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("timezone")
    .eq("id", auth.userId)
    .maybeSingle();
  if (profileError) return databaseError(profileError);

  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);
  if (parsed.data.plannedOn && parsed.data.plannedOn < today) {
    return apiError("PAST_PLAN", "Une tâche ne peut pas être replanifiée dans le passé.", 409);
  }

  const recurring = typeof task.recurrence_rule === "string" && task.recurrence_rule.length > 0;
  if (recurring) {
    const occurrenceOn = parsed.data.occurrenceOn;
    if (!occurrenceOn || !parsed.data.plannedOn) {
      return apiError("OCCURRENCE_REQUIRED", "Choisis l’occurrence et sa nouvelle date.", 400);
    }
    const recurrenceUntil = typeof task.recurrence_until === "string" ? task.recurrence_until : null;
    const plannedOn = typeof task.planned_on === "string" ? task.planned_on : null;
    if (!taskOccursOn({ plannedOn, recurrenceRule: task.recurrence_rule, recurrenceUntil, date: occurrenceOn })) {
      return apiError("NOT_SCHEDULED", "Cette occurrence n’appartient pas à la récurrence.", 409);
    }
    const { data: existing, error: existingError } = await auth.supabase.from("task_occurrences").select("id,completed_at").eq("user_id", auth.userId).eq("task_id", id).eq("occurrence_on", occurrenceOn).maybeSingle();
    if (existingError) return databaseError(existingError);
    if (existing?.completed_at) return apiError("OCCURRENCE_CLOSED", "Rouvre cette occurrence avant de la reporter.", 409);
    const planQuery = existing
      ? auth.supabase.from("task_occurrences").update({ rescheduled_on: parsed.data.plannedOn }).eq("user_id", auth.userId).eq("task_id", id).eq("occurrence_on", occurrenceOn)
      : auth.supabase.from("task_occurrences").insert({ user_id: auth.userId, task_id: id, occurrence_on: occurrenceOn, rescheduled_on: parsed.data.plannedOn } as never);
    const { data, error } = await planQuery.select("id,occurrence_on,rescheduled_on,completed_at").single();
    if (error || !data) return databaseError(error);
    await logReschedule(auth.supabase, auth.userId, id, `${task.title} · occurrence ${occurrenceOn} reportée au ${parsed.data.plannedOn}`);
    return apiData({ ...data, recurring: true });
  }

  const previous = typeof task.planned_on === "string" ? task.planned_on : null;
  const { data, error } = await auth.supabase
    .from("tasks")
    .update({ planned_on: parsed.data.plannedOn })
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id,title,status,planned_on,due_on,due_at")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("NOT_FOUND", "Tâche introuvable.", 404);

  const summary = parsed.data.plannedOn
    ? `${task.title} · planifiée ${parsed.data.plannedOn}${previous ? ` (anciennement ${previous})` : ""}`
    : `${task.title} · planification retirée`;
  await logReschedule(auth.supabase, auth.userId, id, summary);

  return apiData(data);
}

async function logReschedule(supabase: SupabaseClient, userId: string, id: string, summary: string) {
  const { error } = await supabase.from("activity_log").insert({ user_id: userId, entity_type: "tasks", entity_id: id, action: "rescheduled", summary: summary.slice(0, 160) });
  if (error) console.error("LifeOS task rescheduling activity log failed", { code: error.code });
}
