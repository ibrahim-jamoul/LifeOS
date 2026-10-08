import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { calendarDateInTimeZone } from "@/lib/domain/routines";
import { totalLearningMinutes, learningMinutesByPath, evidenceOfApplication } from "@/lib/domain/learning-metrics";

export const dynamic = "force-dynamic";
const uuid = z.uuid();
const title = z.string().trim().min(1).max(160);
const httpsUrl = z.string().url().max(1500).refine((value) => value.startsWith("https://"), "Source HTTPS obligatoire");
const date = z.iso.date();
const detailValues = z.record(z.string().max(40), z.string().trim().max(500)).refine((item) => Object.keys(item).length <= 12, "Trop de champs");
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_quiz"), pathId: uuid, activityId: uuid.nullish(), title, mode: z.enum(["practice", "mock"]).default("practice") }),
  z.object({ action: z.literal("add_question"), quizId: uuid, prompt: z.string().trim().min(3).max(1200), choices: z.array(z.string().trim().min(1).max(500)).min(2).max(6), correctIndex: z.number().int().min(0).max(5), explanation: z.string().trim().max(2000).optional(), sourceUrl: httpsUrl.or(z.literal("")).optional() }).refine((value) => value.correctIndex < value.choices.length, "Réponse hors plage"),
  z.object({ action: z.literal("publish_quiz"), quizId: uuid }),
  z.object({ action: z.literal("submit_quiz"), quizId: uuid, answers: z.record(z.uuid(), z.number().int().min(0).max(5)).refine((value) => Object.keys(value).length <= 100, "Trop de réponses") }),
  z.object({ action: z.literal("record_detailed_session"), pathId: uuid, activityId: uuid.nullish(), durationMinutes: z.number().int().min(1).max(480), confidence: z.number().int().min(1).max(4).nullish(), result: z.enum(["studied", "practiced", "applied", "blocked"]), sessionKind: z.enum(["general", "lab", "arabic", "english", "quran", "certification", "reading", "business"]), details: detailValues.default({}), note: z.string().trim().max(2500).optional() }),
  z.object({ action: z.literal("edit_path"), pathId: uuid, title, weeklyMinutes: z.number().int().min(0).max(1680), purpose: z.string().trim().max(1200).optional() }),
  z.object({ action: z.literal("edit_activity"), activityId: uuid, title, instructions: z.string().trim().max(4000).optional(), estimatedMinutes: z.number().int().min(1).max(480), sourceUrl: httpsUrl.or(z.literal("")).optional() }),
  z.object({ action: z.literal("plan_activity"), activityId: uuid, plannedOn: date }),
]);

function fail(error: { code?: string; message?: string } | null) {
  return ["42P01", "PGRST205", "42883", "PGRST202"].includes(error?.code ?? "")
    ? apiError("MIGRATION_REQUIRED", "Appliquez la migration Supabase V5 lot 2 sur staging.", 503)
    : databaseError(error);
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "weekly";
  const db = auth.supabase;
  const userId = auth.userId;
  if (view === "quiz_list") {
    const pathId = url.searchParams.get("pathId");
    if (!pathId || !uuid.safeParse(pathId).success) return apiError("INVALID_PATH", "Parcours invalide", 400);
    const { data: owned, error: ownedError } = await db.from("learning_paths").select("id").eq("id", pathId).eq("user_id", userId).maybeSingle();
    if (ownedError) return fail(ownedError);
    if (!owned) return apiError("NOT_FOUND", "Parcours introuvable", 404);
    const { data, error } = await db.from("learning_quizzes").select("id,title,mode,published,created_at").eq("path_id", pathId).eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    return error ? fail(error) : apiData({ quizzes: data ?? [] });
  }
  if (view === "quiz") {
    const quizId = url.searchParams.get("id");
    if (!quizId || !uuid.safeParse(quizId).success) return apiError("INVALID_QUIZ", "Quiz invalide", 400);
    const { data: quiz, error: quizError } = await db.from("learning_quizzes").select("id,path_id,title,mode,published").eq("id", quizId).eq("user_id", userId).maybeSingle();
    if (quizError) return fail(quizError);
    if (!quiz) return apiError("NOT_FOUND", "Quiz introuvable", 404);
    // Never send the answer key before a submission. Even the browser that created the quiz only sees its questions.
    const [questions, attempts] = await Promise.all([
      db.from("learning_questions").select("id,prompt,choices,position,source_url").eq("quiz_id", quizId).eq("user_id", userId).order("position").limit(100),
      db.from("learning_quiz_attempts").select("id,score_percent,correct,total,submitted_at").eq("quiz_id", quizId).eq("user_id", userId).order("submitted_at", { ascending: false }).limit(10),
    ]);
    if (questions.error || attempts.error) return fail(questions.error || attempts.error);
    return apiData({ quiz, questions: questions.data ?? [], attempts: attempts.data ?? [] });
  }
  if (view === "search") {
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2 || q.length > 80) return apiError("INVALID_SEARCH", "Saisissez entre 2 et 80 caractères", 400);
    // Escaping special LIKE characters prevents accidental unbounded wildcard queries.
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const [paths, knowledge, resources] = await Promise.all([
      db.from("learning_paths").select("id,title,domain").eq("user_id", userId).ilike("title", pattern).limit(20),
      db.from("learning_knowledge").select("id,path_id,title,summary").eq("user_id", userId).ilike("title", pattern).limit(20),
      db.from("resources").select("id,title,url,resource_type").eq("user_id", userId).ilike("title", pattern).limit(20),
    ]);
    if (paths.error || knowledge.error || resources.error) return fail(paths.error || knowledge.error || resources.error);
    return apiData({ paths: paths.data ?? [], knowledge: knowledge.data ?? [], resources: resources.data ?? [] });
  }
  if (view === "weekly") {
    const { data: profile } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
    const timezone = profile?.timezone || "Europe/Paris";
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [sessions, reviews, attempts, paths] = await Promise.all([
      db.from("learning_sessions").select("duration_minutes,result,session_kind,occurred_at,path_id").eq("user_id", userId).gte("occurred_at", since).limit(1000),
      db.from("learning_reviews").select("assessment,reviewed_at").eq("user_id", userId).gte("reviewed_at", since).limit(1000),
      db.from("learning_quiz_attempts").select("score_percent,submitted_at").eq("user_id", userId).gte("submitted_at", since).limit(1000),
      db.from("learning_paths").select("id,title,domain,status").eq("user_id", userId).eq("status", "active").limit(200),
    ]);
    if (sessions.error || reviews.error || attempts.error || paths.error) return fail(sessions.error || reviews.error || attempts.error || paths.error);
    const actual = sessions.data ?? [];
    const perPath = learningMinutesByPath(actual);
    const active = paths.data ?? [];
    return apiData({
      from: since.slice(0, 10), to: calendarDateInTimeZone(new Date(), timezone),
      minutes: totalLearningMinutes(actual), sessions: actual.length,
      applications: evidenceOfApplication(actual),
      blocked: actual.filter((s) => s.result === "blocked").length,
      revisions: reviews.data?.length ?? 0,
      fragile: reviews.data?.filter((r) => r.assessment === "forgot" || r.assessment === "fragile").length ?? 0,
      quizzes: attempts.data?.length ?? 0,
      averageQuizScore: attempts.data?.length ? Math.round(attempts.data.reduce((sum, a) => sum + a.score_percent, 0) / attempts.data.length) : null,
      pathsWorked: active.flatMap((p) => {
        const minutes = perPath[p.id] ?? 0;
        return minutes > 0 ? [{ id: p.id, title: p.title, minutes }] : [];
      }),
      pathsUntouched: active.flatMap((p) => (perPath[p.id] ? [] : [{ id: p.id, title: p.title }])),
    });
  }
  return apiError("INVALID_VIEW", "Vue inconnue", 400);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Données d'apprentissage invalides", 400, parsed.error.flatten().fieldErrors);
  const v = parsed.data;
  const db = auth.supabase;
  const uid = auth.userId;
  if (v.action === "create_quiz") {
    const { data: path, error: pathError } = await db.from("learning_paths").select("id").eq("id", v.pathId).eq("user_id", uid).maybeSingle();
    if (pathError) return fail(pathError);
    if (!path) return apiError("NOT_FOUND", "Parcours introuvable", 404);
    const { data, error } = await db.from("learning_quizzes").insert({ user_id: uid, path_id: v.pathId, activity_id: v.activityId ?? null, title: v.title, mode: v.mode }).select("id").single();
    return error ? fail(error) : apiData(data, { status: 201 });
  }
  if (v.action === "add_question") {
    const { data: quiz, error: quizError } = await db.from("learning_quizzes").select("id,published").eq("id", v.quizId).eq("user_id", uid).maybeSingle();
    if (quizError) return fail(quizError);
    if (!quiz) return apiError("NOT_FOUND", "Quiz introuvable", 404);
    if (quiz.published) return apiError("QUIZ_PUBLISHED", "Les questions d'un quiz publié sont figées", 409);
    const { count, error: countError } = await db.from("learning_questions").select("id", { count: "exact", head: true }).eq("quiz_id", v.quizId).eq("user_id", uid);
    if (countError) return fail(countError);
    if ((count ?? 0) >= 100) return apiError("QUESTION_LIMIT", "Maximum 100 questions par quiz", 400);
    const { data, error } = await db.from("learning_questions").insert({ user_id: uid, quiz_id: v.quizId, prompt: v.prompt, choices: v.choices, correct_index: v.correctIndex, explanation: v.explanation ?? null, source_url: v.sourceUrl || null, position: count ?? 0 }).select("id").single();
    return error ? fail(error) : apiData(data, { status: 201 });
  }
  if (v.action === "publish_quiz") {
    const { count, error: countError } = await db.from("learning_questions").select("id", { head: true, count: "exact" }).eq("quiz_id", v.quizId).eq("user_id", uid);
    if (countError) return fail(countError);
    if (!count) return apiError("EMPTY_QUIZ", "Ajoutez au moins une question", 400);
    const { data, error } = await db.from("learning_quizzes").update({ published: true }).eq("id", v.quizId).eq("user_id", uid).select("id").maybeSingle();
    return error ? fail(error) : data ? apiData(data) : apiError("NOT_FOUND", "Quiz introuvable", 404);
  }
  if (v.action === "submit_quiz") {
    const { data, error } = await db.rpc("submit_learning_quiz", { p_quiz_id: v.quizId, p_answers: v.answers });
    return error ? fail(error) : apiData(data);
  }
  if (v.action === "edit_path") {
    const { data, error } = await db.from("learning_paths").update({ title: v.title, weekly_minutes: v.weeklyMinutes, purpose: v.purpose || null }).eq("id", v.pathId).eq("user_id", uid).select("id").maybeSingle();
    return error ? fail(error) : data ? apiData(data) : apiError("NOT_FOUND", "Parcours introuvable", 404);
  }
  if (v.action === "edit_activity") {
    const { data, error } = await db.from("learning_activities").update({ title: v.title, instructions: v.instructions || null, estimated_minutes: v.estimatedMinutes, source_url: v.sourceUrl || null }).eq("id", v.activityId).eq("user_id", uid).select("id").maybeSingle();
    return error ? fail(error) : data ? apiData(data) : apiError("NOT_FOUND", "Activité introuvable", 404);
  }
  if (v.action === "plan_activity") {
    const { data, error } = await db.rpc("plan_learning_activity", { p_activity_id: v.activityId, p_planned_on: v.plannedOn });
    return error ? fail(error) : apiData(data);
  }
  // This table is not a mirror of historic arabic_sessions or quran_sessions: legacy histories are preserved.
  const { data: path, error: pathError } = await db.from("learning_paths").select("id").eq("id", v.pathId).eq("user_id", uid).maybeSingle();
  if (pathError) return fail(pathError);
  if (!path) return apiError("NOT_FOUND", "Parcours introuvable", 404);
  if (v.activityId) {
    const { data: activity, error } = await db.from("learning_activities").select("module_id").eq("id", v.activityId).eq("user_id", uid).maybeSingle();
    if (error) return fail(error);
    if (!activity) return apiError("INVALID_ACTIVITY", "Activité introuvable", 404);
    const { data: module, error: moduleError } = await db.from("learning_modules").select("path_id").eq("id", activity.module_id).eq("user_id", uid).maybeSingle();
    if (moduleError) return fail(moduleError);
    if (module?.path_id !== v.pathId) return apiError("INVALID_RELATION", "Cette activité appartient à un autre parcours", 400);
  }
  const { data, error } = await db.from("learning_sessions").insert({ user_id: uid, path_id: v.pathId, activity_id: v.activityId || null, duration_minutes: v.durationMinutes, confidence: v.confidence ?? null, result: v.result, session_kind: v.sessionKind, details: v.details, note: v.note || null }).select("id").single();
  return error ? fail(error) : apiData(data, { status: 201 });
}
