import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { calendarDateInTimeZone } from "@/lib/domain/routines";

const schema = z.object({
  title: z.string().trim().min(1).max(240),
  lifeArea: z.enum(["pro", "perso", "religion"]).nullable(),
  planToday: z.boolean().default(true),
  notes: z.string().trim().max(5_000).nullable().optional(),
}).strict();

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const raw = await readJsonObject(request);
  if (isApiResponse(raw)) return raw;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "La capture est invalide.", 400, parsed.error.flatten().fieldErrors);

  const { data: profile, error: profileError } = await auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  if (profileError) return databaseError(profileError);
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  const today = calendarDateInTimeZone(new Date(), timezone);

  const payload = {
    user_id: auth.userId,
    title: parsed.data.title,
    life_area: parsed.data.lifeArea,
    status: "todo",
    priority: "unset",
    configuration_status: parsed.data.lifeArea ? "ready" : "to_complete",
    planned_on: parsed.data.planToday ? today : null,
    notes: parsed.data.notes ?? null,
  };
  const { data, error } = await auth.supabase.from("tasks").insert(payload).select("id,title,life_area,planned_on").single();
  if (error || !data) return databaseError(error);

  const { error: logError } = await auth.supabase.from("activity_log").insert({
    user_id: auth.userId,
    entity_type: "tasks",
    entity_id: data.id,
    action: "created",
    summary: data.title.slice(0, 160),
  });
  if (logError) console.error("LifeOS quick capture activity log failed", { code: logError.code });
  return apiData(data, { status: 201 });
}
