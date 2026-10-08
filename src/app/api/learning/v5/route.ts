import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { calendarDateInTimeZone } from "@/lib/domain/routines";
import { LEARNING_ACTIVITY_TYPES, LEARNING_DOMAINS, LEARNING_TYPES } from "@/lib/domain/learning";
import { totalLearningMinutes } from "@/lib/domain/learning-metrics";

export const dynamic = "force-dynamic";

const uuid = z.uuid();
const title = z.string().trim().min(1).max(160);
const httpsUrl = z.string().url().max(1500).refine((url) => url.startsWith("https://"), "Lien HTTPS requis");
const optionalUrl = z.union([httpsUrl, z.literal("")]).optional();

function learningDatabaseError(error: { code?: string; message?: string } | null) {
  if (["42P01", "PGRST205", "42883", "PGRST202"].includes(error?.code ?? "")) {
    return apiError("MIGRATION_REQUIRED", "La migration Supabase Apprentissage V5 doit être appliquée avant utilisation.", 503);
  }
  return databaseError(error);
}
const commands = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_path"), title, domain: z.enum(LEARNING_DOMAINS.map((d) => d.value) as [typeof LEARNING_DOMAINS[number]["value"], ...Array<typeof LEARNING_DOMAINS[number]["value"]>]), pathType: z.enum(LEARNING_TYPES.map((t) => t.value) as [typeof LEARNING_TYPES[number]["value"], ...Array<typeof LEARNING_TYPES[number]["value"]>]).default("strategic"), weeklyMinutes: z.number().int().min(0).max(1680).default(90), projectId: uuid.nullish(), goalId: uuid.nullish() }),
  z.object({ action: z.literal("set_path_status"), pathId: uuid, status: z.enum(["planned", "active", "paused", "completed", "abandoned", "archived"]) }),
  z.object({ action: z.literal("create_module"), pathId: uuid, title }),
  z.object({ action: z.literal("initialize_path"), pathId: uuid }),
  z.object({ action: z.literal("create_activity"), moduleId: uuid, title, activityType: z.enum(LEARNING_ACTIVITY_TYPES.map((t) => t.value) as [typeof LEARNING_ACTIVITY_TYPES[number]["value"], ...Array<typeof LEARNING_ACTIVITY_TYPES[number]["value"]>]).default("lesson"), estimatedMinutes: z.number().int().min(1).max(480).default(15), sourceUrl: optionalUrl }),
  z.object({ action: z.literal("set_activity_completion"), activityId: uuid, completed: z.boolean() }),
  z.object({ action: z.literal("record_session"), pathId: uuid, activityId: uuid.nullish(), durationMinutes: z.number().int().min(1).max(480), confidence: z.number().int().min(1).max(4).nullish(), result: z.enum(["studied", "practiced", "applied", "blocked"]).default("studied") }),
  z.object({ action: z.literal("add_knowledge"), pathId: uuid, title, summary: z.string().trim().max(4000).optional(), sourceUrl: optionalUrl }),
  z.object({ action: z.literal("review_knowledge"), knowledgeId: uuid, assessment: z.enum(["forgot", "fragile", "correct", "mastered"]) }),
]);

async function authenticated() { return requireUser(); }

export async function GET(request: Request) {
  const auth = await authenticated();
  if (isApiResponse(auth)) return auth;
  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "home";
  if (!["home", "path", "due", "stats", "links"].includes(view)) return apiError("INVALID_VIEW", "Vue inconnue.", 400);
  const db = auth.supabase;
  const userId = auth.userId;
  const { data: profile, error: profileError } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  if (profileError) return learningDatabaseError(profileError);
  const today = calendarDateInTimeZone(new Date(), profile?.timezone || "Europe/Paris");

  if (view === "links") {
    const [projects, goals] = await Promise.all([
      db.from("projects").select("id,title,project_type").eq("user_id", userId).neq("status", "archived").order("updated_at", { ascending: false }).limit(100),
      db.from("goals").select("id,title").eq("user_id", userId).neq("status", "archived").order("updated_at", { ascending: false }).limit(100),
    ]);
    if (projects.error || goals.error) return learningDatabaseError(projects.error || goals.error);
    return apiData({ projects: projects.data ?? [], goals: goals.data ?? [] });
  }

  if (view === "home") {
    const [paths, sessions] = await Promise.all([
      db.from("learning_paths").select("id,title,domain,path_type,status,weekly_minutes,updated_at,goal_id,project_id").eq("user_id", userId).neq("status", "archived").order("updated_at", { ascending: false }).limit(100),
      db.from("learning_sessions").select("duration_minutes,occurred_at").eq("user_id", userId).gte("occurred_at", new Date(Date.now() - 48 * 3600_000).toISOString()).limit(300),
    ]);
    if (paths.error || sessions.error) return learningDatabaseError(paths.error || sessions.error);
    // Paused/abandoned paths are excluded from the daily review queue; completed
    // paths remain revisable to retain acquired knowledge over time.
    const reviewableIds = (paths.data ?? []).filter((path) => ["active", "completed"].includes(path.status)).map((path) => path.id);
    const due = reviewableIds.length ? await db.from("learning_knowledge").select("id", { count: "exact", head: true }).eq("user_id", userId).in("path_id", reviewableIds).lte("next_review_on", today) : null;
    if (due?.error) return learningDatabaseError(due.error);
    return apiData({ paths: paths.data ?? [], dueCount: due?.count ?? 0, sessionMinutesToday: (sessions.data ?? []).filter((s) => calendarDateInTimeZone(new Date(s.occurred_at), profile?.timezone || "Europe/Paris") === today).reduce((sum, s) => sum + s.duration_minutes, 0) });
  }

  if (view === "path") {
    const pathId = url.searchParams.get("id");
    if (!pathId || !uuid.safeParse(pathId).success) return apiError("INVALID_PATH", "Parcours invalide.", 400);
    const { data: path, error } = await db.from("learning_paths").select("*").eq("id", pathId).eq("user_id", userId).maybeSingle();
    if (error) return learningDatabaseError(error);
    if (!path) return apiError("NOT_FOUND", "Parcours introuvable.", 404);
    const [modules, knowledge, sessions] = await Promise.all([
      db.from("learning_modules").select("id,title,position,path_id").eq("path_id", pathId).eq("user_id", userId).order("position").limit(100),
      db.from("learning_knowledge").select("id,title,summary,source_url,next_review_on,last_assessment,review_step").eq("path_id", pathId).eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      db.from("learning_sessions").select("id,activity_id,duration_minutes,confidence,result,occurred_at").eq("path_id", pathId).eq("user_id", userId).order("occurred_at", { ascending: false }).limit(100),
    ]);
    if (modules.error || knowledge.error || sessions.error) return learningDatabaseError(modules.error || knowledge.error || sessions.error);
    const ids = (modules.data ?? []).map((item) => item.id);
    const activities = ids.length ? await db.from("learning_activities").select("id,module_id,title,activity_type,estimated_minutes,source_url,status,position").eq("user_id", userId).in("module_id", ids).order("position").limit(300) : null;
    if (activities?.error) return learningDatabaseError(activities.error);
    return apiData({ path, modules: modules.data ?? [], activities: activities?.data ?? [], knowledge: knowledge.data ?? [], sessions: sessions.data ?? [] });
  }

  if (view === "due") {
    const { data: reviewablePaths, error: pathError } = await db.from("learning_paths").select("id").eq("user_id", userId).in("status", ["active", "completed"]).limit(500);
    if (pathError) return learningDatabaseError(pathError);
    const reviewableIds = (reviewablePaths ?? []).map((path) => path.id);
    if (reviewableIds.length === 0) return apiData({ due: [], today });
    const { data, error } = await db.from("learning_knowledge").select("id,path_id,title,summary,source_url,review_step,last_assessment,next_review_on").eq("user_id", userId).in("path_id", reviewableIds).lte("next_review_on", today).order("next_review_on").limit(100);
    if (error) return learningDatabaseError(error);
    return apiData({ due: data ?? [], today });
  }

  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [sessions, activities, knowledge, paths, reviews] = await Promise.all([
    db.from("learning_sessions").select("id,path_id,duration_minutes,result,occurred_at").eq("user_id", userId).gte("occurred_at", since).limit(1000),
    db.from("learning_activities").select("id,status,activity_type").eq("user_id", userId).limit(1000),
    db.from("learning_knowledge").select("id,path_id,last_assessment,next_review_on").eq("user_id", userId).limit(1000),
    db.from("learning_paths").select("id,status,domain").eq("user_id", userId).limit(1000),
    db.from("learning_reviews").select("id,assessment,reviewed_at").eq("user_id", userId).gte("reviewed_at", since).limit(1000),
  ]);
  if (sessions.error || activities.error || knowledge.error || paths.error || reviews.error) return learningDatabaseError(sessions.error || activities.error || knowledge.error || paths.error || reviews.error);
  return apiData({
    minutes30d: totalLearningMinutes(sessions.data ?? []),
    sessions30d: sessions.data?.length ?? 0,
    applications30d: sessions.data?.filter((s) => s.result === "applied").length ?? 0,
    activitiesCompleted: activities.data?.filter((a) => a.status === "completed").length ?? 0,
    activitiesTotal: activities.data?.length ?? 0,
    knowledgeCount: knowledge.data?.length ?? 0,
    dueCount: knowledge.data?.filter((k) => k.next_review_on <= today && (paths.data ?? []).some((p) => p.id === k.path_id && ["active", "completed"].includes(p.status))).length ?? 0,
    reviewed30d: reviews.data?.length ?? 0,
    activePaths: paths.data?.filter((p) => p.status === "active").length ?? 0,
  });
}

export async function POST(request: Request) {
  const auth = await authenticated();
  if (isApiResponse(auth)) return auth;
  const body = await readJsonObject(request);
  if (isApiResponse(body)) return body;
  const parsed = commands.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Les données saisies sont invalides.", 400, parsed.error.flatten().fieldErrors);
  const value = parsed.data;
  const db = auth.supabase;
  const userId = auth.userId;
  if (value.action === "create_path") {
    const { data, error } = await db.from("learning_paths").insert({ user_id: userId, title: value.title, domain: value.domain, path_type: value.pathType, weekly_minutes: value.weeklyMinutes, goal_id: value.goalId ?? null, project_id: value.projectId ?? null }).select("id").single();
    if (error) return learningDatabaseError(error);
    return apiData(data, { status: 201 });
  }
  if (value.action === "set_path_status") {
    const { data, error } = await db.from("learning_paths").update({ status: value.status }).eq("id", value.pathId).eq("user_id", userId).select("id,status").maybeSingle();
    if (error) return learningDatabaseError(error);
    return data ? apiData(data) : apiError("NOT_FOUND", "Parcours introuvable.", 404);
  }
  if (value.action === "create_module") {
    const { data: path } = await db.from("learning_paths").select("id").eq("id", value.pathId).eq("user_id", userId).maybeSingle();
    if (!path) return apiError("INVALID_RELATION", "Parcours introuvable.", 404);
    const { data, error } = await db.from("learning_modules").insert({ user_id: userId, path_id: value.pathId, title: value.title }).select("id").single();
    return error ? databaseError(error) : apiData(data, { status: 201 });
  }
  if (value.action === "initialize_path") {
    const { data, error } = await db.rpc("initialize_learning_path", { p_path_id: value.pathId });
    return error ? databaseError(error) : apiData({ createdModules: data });
  }
  if (value.action === "create_activity") {
    const { data: module } = await db.from("learning_modules").select("id").eq("id", value.moduleId).eq("user_id", userId).maybeSingle();
    if (!module) return apiError("INVALID_RELATION", "Module introuvable.", 404);
    const { data, error } = await db.from("learning_activities").insert({ user_id: userId, module_id: value.moduleId, title: value.title, activity_type: value.activityType, estimated_minutes: value.estimatedMinutes, source_url: value.sourceUrl || null }).select("id").single();
    return error ? databaseError(error) : apiData(data, { status: 201 });
  }
  if (value.action === "set_activity_completion") {
    const { data, error } = await db.from("learning_activities").update({ status: value.completed ? "completed" : "planned", completed_at: value.completed ? new Date().toISOString() : null }).eq("id", value.activityId).eq("user_id", userId).select("id,status").maybeSingle();
    if (error) return learningDatabaseError(error);
    return data ? apiData(data) : apiError("NOT_FOUND", "Activité introuvable.", 404);
  }
  if (value.action === "record_session") {
    const { data: path, error: pathError } = await db.from("learning_paths").select("id").eq("id", value.pathId).eq("user_id", userId).maybeSingle();
    if (pathError) return learningDatabaseError(pathError);
    if (!path) return apiError("INVALID_RELATION", "Parcours introuvable.", 404);
    if (value.activityId) {
      const { data: activity, error } = await db.from("learning_activities").select("module_id").eq("id", value.activityId).eq("user_id", userId).maybeSingle();
      if (error) return learningDatabaseError(error);
      if (!activity) return apiError("INVALID_RELATION", "Activité introuvable.", 404);
      const { data: module } = await db.from("learning_modules").select("path_id").eq("id", activity.module_id).eq("user_id", userId).maybeSingle();
      if (module?.path_id !== value.pathId) return apiError("INVALID_RELATION", "L’activité appartient à un autre parcours.", 400);
    }
    const { data, error } = await db.from("learning_sessions").insert({ user_id: userId, path_id: value.pathId, activity_id: value.activityId ?? null, duration_minutes: value.durationMinutes, confidence: value.confidence ?? null, result: value.result }).select("id").single();
    return error ? databaseError(error) : apiData(data, { status: 201 });
  }
  if (value.action === "add_knowledge") {
    const { data: path, error: pathError } = await db.from("learning_paths").select("id").eq("id", value.pathId).eq("user_id", userId).maybeSingle();
    if (pathError) return learningDatabaseError(pathError);
    if (!path) return apiError("INVALID_RELATION", "Parcours introuvable.", 404);
    const { data: profile } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
    const today = calendarDateInTimeZone(new Date(), profile?.timezone || "Europe/Paris");
    const { data, error } = await db.from("learning_knowledge").insert({ user_id: userId, path_id: value.pathId, title: value.title, summary: value.summary ?? null, source_url: value.sourceUrl || null, next_review_on: today }).select("id").single();
    return error ? databaseError(error) : apiData(data, { status: 201 });
  }
  const { data: profile, error: profileError } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  if (profileError) return learningDatabaseError(profileError);
  const today = calendarDateInTimeZone(new Date(), profile?.timezone || "Europe/Paris");
  const { data, error } = await db.rpc("complete_learning_review", { p_knowledge_id: value.knowledgeId, p_assessment: value.assessment, p_today: today });
  if (error) return learningDatabaseError(error);
  return apiData(data);
}
