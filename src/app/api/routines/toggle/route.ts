import { z } from "zod";
import {
  apiData,
  apiError,
  databaseError,
  isApiResponse,
  readJsonObject,
  requireUser,
} from "@/lib/api";
import {
  calendarDateInTimeZone,
  isRoutineActionableOn,
  routineCompletionWindow,
} from "@/lib/domain/routines";

export const dynamic = "force-dynamic";

const toggleRoutineSchema = z.object({
  routineType: z.enum(["habit", "religion"]),
  routineId: z.uuid(),
  occurredOn: z.iso.date(),
  completed: z.boolean(),
}).strict();

type RoutineSource = {
  routineTable: "habits" | "religion_routines";
  logTable: "habit_logs" | "religion_logs";
  foreignKey: "habit_id" | "routine_id";
};

const routineSources: Record<z.infer<typeof toggleRoutineSchema>["routineType"], RoutineSource> = {
  habit: {
    routineTable: "habits",
    logTable: "habit_logs",
    foreignKey: "habit_id",
  },
  religion: {
    routineTable: "religion_routines",
    logTable: "religion_logs",
    foreignKey: "routine_id",
  },
};

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;

  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  const parsed = toggleRoutineSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "La validation de cette routine est invalide.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { routineType, routineId, occurredOn, completed } = parsed.data;
  const source = routineSources[routineType];
  const routineColumns = routineType === "habit"
    ? "id,name,target_count,active,status,frequency,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,paused_at,archived_at"
    : "id,name,target_count,active,status,target_frequency,schedule_weekday,schedule_day_of_month,schedule_window_weekdays,schedule_month_weeks,start_on,end_on,paused_at,archived_at";
  const { data: routine, error: routineError } = await auth.supabase
    .from(source.routineTable)
    .select(routineColumns)
    .eq("id", routineId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (routineError) return databaseError(routineError);
  if (!routine) return apiError("NOT_FOUND", "Routine introuvable.", 404);
  if (
    routine.active === false
    || routine.status !== "active"
    || routine.paused_at
    || routine.archived_at
    || (typeof routine.start_on === "string" && occurredOn < routine.start_on)
    || (typeof routine.end_on === "string" && occurredOn > routine.end_on)
  ) {
    return apiError("ROUTINE_UNAVAILABLE", "Cette routine n’est pas active à cette date.", 409);
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("timezone")
    .eq("id", auth.userId)
    .maybeSingle();
  if (profileError) return databaseError(profileError);
  const timezone = typeof profile?.timezone === "string" ? profile.timezone : "Europe/Paris";
  if (occurredOn > calendarDateInTimeZone(new Date(), timezone)) {
    return apiError("FUTURE_COMPLETION", "Une routine future ne peut pas être cochée à l’avance.", 409);
  }

  const frequency = "frequency" in routine ? routine.frequency : routine.target_frequency;
  const schedule = {
    frequency: String(frequency ?? ""),
    active: routine.active,
    scheduleWeekday: typeof routine.schedule_weekday === "number" ? routine.schedule_weekday : null,
    scheduleDayOfMonth: typeof routine.schedule_day_of_month === "number" ? routine.schedule_day_of_month : null,
    scheduleWindowWeekdays: numberArray(routine.schedule_window_weekdays),
    scheduleMonthWeeks: numberArray(routine.schedule_month_weeks),
    startOn: typeof routine.start_on === "string" ? routine.start_on : null,
    endOn: typeof routine.end_on === "string" ? routine.end_on : null,
    pausedAt: typeof routine.paused_at === "string" ? routine.paused_at : null,
    archivedAt: typeof routine.archived_at === "string" ? routine.archived_at : null,
  };
  if (!isRoutineActionableOn(schedule, occurredOn)) {
    return apiError("ROUTINE_NOT_SCHEDULED", "Cette routine n’est pas prévue à cette date.", 409);
  }

  const completionWindow = routineCompletionWindow(schedule, occurredOn);
  if (!completionWindow) {
    return apiError("ROUTINE_NOT_SCHEDULED", "Cette routine n’est pas prévue à cette date.", 409);
  }

  if (!completed) {
    const { error } = await auth.supabase
      .from(source.logTable)
      .delete()
      .eq("user_id", auth.userId)
      .eq(source.foreignKey, routineId)
      .gte("occurred_on", completionWindow.startsOn)
      .lte("occurred_on", completionWindow.endsOn);
    if (error) return databaseError(error);
    const { error: activityError } = await auth.supabase.from("activity_log").insert({
      user_id: auth.userId,
      entity_type: source.routineTable,
      entity_id: routineId,
      action: "unchecked",
      summary: String(routine.name ?? `${routineType}:${routineId}`).slice(0, 160),
    });
    if (activityError) console.error("LifeOS routine activity log failed", { code: activityError.code });
    return apiData({ routineType, routineId, occurredOn, completed: false, count: 0 });
  }

  // A multi-day execution window (for example Saturday + Sunday) represents a
  // single logical occurrence. Repeated requests inside the same window are
  // idempotent and must not create a second completion row.
  const { data: existingCompletion, error: existingError } = await auth.supabase
    .from(source.logTable)
    .select("id,count,occurred_on")
    .eq("user_id", auth.userId)
    .eq(source.foreignKey, routineId)
    .gte("occurred_on", completionWindow.startsOn)
    .lte("occurred_on", completionWindow.endsOn)
    .gt("count", 0)
    .order("occurred_on", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existingError) return databaseError(existingError);
  if (existingCompletion) {
    return apiData({
      routineType,
      routineId,
      occurredOn: existingCompletion.occurred_on,
      completed: true,
      count: existingCompletion.count,
    });
  }

  const configuredTarget = typeof routine.target_count === "number" && routine.target_count > 0
    ? routine.target_count
    : 1;
  const payload: Record<string, string | number> = {
    user_id: auth.userId,
    [source.foreignKey]: routineId,
    occurred_on: occurredOn,
    count: configuredTarget,
  };
  const { data, error } = await auth.supabase
    .from(source.logTable)
    .upsert(payload as never, { onConflict: `user_id,${source.foreignKey},occurred_on` })
    .select("id,count")
    .single();
  if (error || !data) return databaseError(error);

  const { error: activityError } = await auth.supabase.from("activity_log").insert({
    user_id: auth.userId,
    entity_type: source.routineTable,
    entity_id: routineId,
    action: "completed",
    summary: String(routine.name ?? `${routineType}:${routineId}`).slice(0, 160),
  });
  if (activityError) console.error("LifeOS routine activity log failed", { code: activityError.code });

  return apiData({
    routineType,
    routineId,
    occurredOn,
    completed: true,
    count: data.count,
  });
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : [];
}
