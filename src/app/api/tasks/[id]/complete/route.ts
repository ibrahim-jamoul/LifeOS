import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";
import { calendarDateInTimeZone } from "@/lib/domain/routines";
import { taskOccursOn } from "@/lib/domain/task-recurrence";

type RouteContext = { params: Promise<{ id: string }> };
const schema = z.object({ occurredOn: z.iso.date().optional(), completed: z.boolean().optional() }).strict();

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await params;
  let occurredOn: string | undefined;
  let completed = true;
  try {
    const text = await request.text();
    if (text) {
      const parsed = schema.safeParse(JSON.parse(text));
      if (!parsed.success) return apiError("VALIDATION_ERROR", "La date de validation est invalide.", 400);
      occurredOn = parsed.data.occurredOn;
      completed = parsed.data.completed ?? true;
    }
  } catch { return apiError("INVALID_INPUT", "La validation est invalide.", 400); }

  const { data: profile, error: profileError } = await auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  if (profileError) return databaseError(profileError);
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);
  const completionDate = occurredOn ?? today;
  if (completionDate > today) return apiError("FUTURE_COMPLETION", "Une tâche future ne peut pas être cochée à l’avance.", 409);

  const { data: task, error: taskError } = await auth.supabase.from("tasks").select("id,title,status,project_id,goal_id,planned_on,planned_time,due_on,due_at,recurrence_rule,recurrence_until,completed_at").eq("id", id).eq("user_id", auth.userId).maybeSingle();
  if (taskError) return databaseError(taskError);
  if (!task) return apiError("NOT_FOUND", "Tâche introuvable.", 404);
  if (task.status === "cancelled") return apiError("TASK_CLOSED", "Cette tâche est annulée.", 409);

  const recurring = typeof task.recurrence_rule === "string" && task.recurrence_rule.length > 0;
  const completedAt = new Date().toISOString();
  if (recurring) {
    const plannedOn = typeof task.planned_on === "string" ? task.planned_on : null;
    const recurrenceUntil = typeof task.recurrence_until === "string" ? task.recurrence_until : null;
    if (!taskOccursOn({ plannedOn, recurrenceRule: task.recurrence_rule, recurrenceUntil, date: completionDate })) return apiError("NOT_SCHEDULED", "Cette mission récurrente n’est pas prévue à cette date.", 409);
    if (!completed) {
      const { error } = await auth.supabase.from("task_occurrences").delete().eq("user_id", auth.userId).eq("task_id", id).eq("occurrence_on", completionDate);
      if (error) return databaseError(error);
      await logActivity(auth.supabase, auth.userId, id, String(task.title), "unchecked_occurrence");
      return apiData({ ...task, occurrence_on: completionDate, completed_at: null, recurring: true });
    }
    const { data, error } = await auth.supabase.from("task_occurrences").upsert({ user_id: auth.userId, task_id: id, occurrence_on: completionDate, completed_at: completedAt } as never, { onConflict: "user_id,task_id,occurrence_on" }).select("id,occurrence_on,completed_at").single();
    if (error || !data) return databaseError(error);
    await refreshProject(auth.supabase, auth.userId, task.project_id, completedAt);
    await logActivity(auth.supabase, auth.userId, id, String(task.title), "completed_occurrence");
    return apiData({ ...task, occurrence_on: completionDate, completed_at: completedAt, recurring: true });
  }

  if (!completed) {
    if (task.status !== "done" || typeof task.completed_at !== "string") return apiData({ ...task, completed_at: null, recurring: false });
    const completedOn = calendarDateInTimeZone(new Date(task.completed_at), timezone);
    if (completedOn !== completionDate) return apiError("COMPLETION_MISMATCH", "Seule une mission validée aujourd’hui peut être décochée depuis Aujourd’hui.", 409);
    const { data, error } = await auth.supabase.from("tasks").update({ status: "todo", completed_at: null }).eq("id", id).eq("user_id", auth.userId).eq("status", "done").select("id,title,project_id,goal_id,planned_on,planned_time,due_on,due_at").maybeSingle();
    if (error) return databaseError(error);
    if (!data) return apiError("NOT_FOUND", "Tâche introuvable ou déjà rouverte.", 404);
    await logActivity(auth.supabase, auth.userId, id, String(data.title), "unchecked");
    return apiData({ ...data, completed_at: null, recurring: false });
  }

  if (task.status === "done") return apiError("TASK_CLOSED", "Cette tâche est déjà terminée.", 409);
  const { data, error } = await auth.supabase.from("tasks").update({ status: "done", completed_at: completedAt }).eq("id", id).eq("user_id", auth.userId).select("id,title,project_id,goal_id,planned_on,planned_time,due_on,due_at").maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("NOT_FOUND", "Tâche introuvable ou déjà clôturée.", 404);
  await refreshProject(auth.supabase, auth.userId, data.project_id, completedAt);
  await logActivity(auth.supabase, auth.userId, id, String(data.title), "completed");
  return apiData({ ...data, completed_at: completedAt, recurring: false });
}

async function refreshProject(supabase: SupabaseClient, userId: string, projectId: unknown, completedAt: string) { if (typeof projectId !== "string") return; const { error } = await supabase.from("projects").update({ last_activity_at: completedAt }).eq("id", projectId).eq("user_id", userId); if (error) console.error("LifeOS project activity refresh failed", { code: error.code }); }
async function logActivity(supabase: SupabaseClient, userId: string, id: string, title: string, action: string) { const { error } = await supabase.from("activity_log").insert({ user_id: userId, entity_type: "tasks", entity_id: id, action, summary: title.slice(0, 160) }); if (error) console.error("LifeOS task completion activity log failed", { code: error.code }); }
