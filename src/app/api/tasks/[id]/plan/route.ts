import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { calendarDateInTimeZone } from "@/lib/domain/routines";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const planTaskSchema = z.object({
  plannedOn: z.iso.date().nullable(),
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
    .select("id,title,status,planned_on")
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
  const { error: logError } = await auth.supabase.from("activity_log").insert({
    user_id: auth.userId,
    entity_type: "tasks",
    entity_id: id,
    action: "rescheduled",
    summary: summary.slice(0, 160),
  });
  if (logError) console.error("LifeOS task planning activity log failed", { code: logError.code });

  return apiData(data);
}
