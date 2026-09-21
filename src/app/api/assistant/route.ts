import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { hasAiEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const scopeTables = {
  goals: [
    ["life_vision", "one_year,three_year,five_year,quarter_focus,last_reviewed_at"],
    ["goals", "id,title,life_area,desired_outcome,status,priority,target_date,target_value,target_unit,next_action,next_review_date,configuration_status,progress_percent"],
    ["projects", "id,title,life_area,project_type,status,priority,target_date,target_window,next_action,next_milestone,configuration_status,progress_percent"],
    ["tasks", "id,title,life_area,status,priority,due_on,due_at,project_id,configuration_status"],
    ["kpis", "id,name,life_area,unit,target_type,target_value,target_min,target_max,cadence,direction,configuration_status,active"],
    ["kpi_entries", "kpi_id,value,measured_at,note"],
    ["decisions", "id,title,life_area,decision_date,question,selected_option,rationale,risks,expected_outcome,review_date,review_trigger,configuration_status,actual_outcome,lesson"],
    ["weekly_reviews", "week_start,wins,misses,causes,risks,pause_or_stop,next_week_top3,notes,completed_at"],
    ["reminders", "id,title,life_area,source_type,source_id,remind_on,reminder_time,remind_at,recurrence,configuration_status,active"],
    ["resources", "id,title,life_area,resource_type,status,provider,url,goal_id,project_id,study_topic_id,notes"],
  ],
  religion: [
    ["study_topics", "id,title,category,resource,status,target_date,progress_percent,notes"],
    ["study_sessions", "topic_id,occurred_at,duration_minutes,activity_type,resource,summary,takeaway"],
    ["religion_routines", "id,name,goal_id,project_id,kpi_id,target_frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,time_context,reminder_enabled,reminder_time,configuration_status,status,active"],
    ["religion_logs", "routine_id,occurred_on,occurred_at,count,note"],
  ],
  arabic: [
    ["arabic_profiles", "self_assessed_level,weekly_target_minutes,current_focus,vocabulary_estimate"],
    ["arabic_sessions", "occurred_at,duration_minutes,skill,resource,new_words,reviewed_words,notes"],
  ],
  quran: [
    ["quran_items", "id,surah_number,surah_name,start_ayah,end_ayah,activity,status,confidence,next_revision_at,notes"],
    ["quran_sessions", "quran_item_id,occurred_at,duration_minutes,activity,confidence,outcome,next_revision_at"],
  ],
  finances: [
    ["financial_accounts", "id,name,account_type,currency,current_balance,include_in_net_worth,is_liability,active"],
    ["financial_transactions", "account_id,occurred_on,amount,tx_type,category,description,currency,transfer_group_id"],
    ["budget_items", "month,category,target_amount,currency"],
    ["financial_goals", "name,target_amount,current_amount,currency,target_date"],
    ["net_worth_snapshots", "snapshot_date,assets,liabilities,currency,note"],
  ],
  health: [
    ["habits", "id,name,life_area,goal_id,project_id,kpi_id,frequency,target_count,target_unit,duration_minutes,schedule_weekday,schedule_day_of_month,time_context,reminder_enabled,reminder_time,configuration_status,status,active"],
    ["habit_logs", "habit_id,occurred_on,count,note"],
    ["health_metrics", "id,name,unit,active"],
    ["health_entries", "metric_id,measured_at,value,note"],
    ["workouts", "occurred_at,activity,duration_minutes,intensity,notes"],
  ],
  documents: [["documents", "id,title,category,original_filename,issuer,issued_on,expires_on,tags,notes,updated_at"]],
  memories: [["memories", "id,title,start_date,end_date,location_text,description,tags"]],
} as const;

type Scope = keyof typeof scopeTables;

const inputSchema = z.object({
  message: z.string().trim().min(2).max(2_000),
  scope: z.enum(["goals", "religion", "arabic", "quran", "finances", "health", "documents", "memories"]),
  threadId: z.uuid().optional(),
});

export async function POST(request: Request) {
  if (!hasAiEnv()) return apiError("AI_CONFIGURATION_REQUIRED", "L’assistant IA n’est pas configuré sur le serveur.", 503);
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Question ou périmètre invalide.", 400, parsed.error.flatten().fieldErrors);

  const { message, scope, threadId: requestedThreadId } = parsed.data;
  const context = await buildContext(auth, scope);
  if (context.error) return context.error;

  let threadId = requestedThreadId;
  if (threadId) {
    const { data, error } = await auth.supabase.from("ai_threads").select("id").eq("id", threadId).eq("user_id", auth.userId).maybeSingle();
    if (error) return databaseError(error);
    if (!data) return apiError("NOT_FOUND", "Conversation introuvable.", 404);
  } else {
    const { data, error } = await auth.supabase.from("ai_threads").insert({ user_id: auth.userId, scope, title: message.slice(0, 100) }).select("id").single();
    if (error || !data) return databaseError(error);
    threadId = data.id;
  }

  const { error: userMessageError } = await auth.supabase.from("ai_messages").insert({ user_id: auth.userId, thread_id: threadId, role: "user", content: message });
  if (userMessageError) return databaseError(userMessageError);

  try {
    const answer = await askProvider(message, scope, context.data);
    const { error } = await auth.supabase.from("ai_messages").insert({ user_id: auth.userId, thread_id: threadId, role: "assistant", content: answer });
    if (error) return databaseError(error);
    return apiData({ threadId, scope, answer });
  } catch (error) {
    console.error("LifeOS AI provider request failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return apiError("AI_PROVIDER_FAILED", "Le fournisseur IA n’a pas répondu correctement. Aucune donnée n’a été modifiée.", 502);
  }
}

async function buildContext(auth: Exclude<Awaited<ReturnType<typeof requireUser>>, Response>, scope: Scope) {
  const selections = scopeTables[scope] as readonly (readonly [string, string])[];
  const rows = await Promise.all(selections.map(async ([table, columns]) => {
    const { data, error } = await auth.supabase.from(table).select(columns).eq("user_id", auth.userId).limit(75);
    if (error) return { table, error };
    return { table, data: data ?? [] };
  }));
  const failed = rows.find((entry) => "error" in entry);
  if (failed && "error" in failed) return { data: "", error: databaseError(failed.error ?? null) };
  const structured = Object.fromEntries(rows.map((entry) => [entry.table, "data" in entry ? entry.data : []]));
  return { data: JSON.stringify(structured).slice(0, 60_000), error: null };
}

async function askProvider(question: string, scope: Scope, structuredContext: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  const baseUrl = (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!apiKey || !model) throw new Error("AI configuration missing");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: `Tu es l’assistant LifeOS. Réponds en français à partir des seules données structurées du périmètre « ${scope} ». Signale honnêtement toute donnée manquante. Tu es strictement en lecture seule : ne prétends jamais avoir modifié LifeOS. Ne donne pas de diagnostic médical, juridique ou financier personnalisé.` },
        { role: "user", content: `DONNÉES LIFEOS (JSON)\n${structuredContext}\n\nQUESTION\n${question}` },
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Provider status ${response.status}`);
  const payload: unknown = await response.json();
  const content = providerContent(payload);
  if (!content) throw new Error("Provider response has no content");
  return content.slice(0, 20_000);
}

function providerContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("choices" in payload) || !Array.isArray(payload.choices)) return null;
  const first = payload.choices[0];
  if (!first || typeof first !== "object" || !("message" in first) || !first.message || typeof first.message !== "object" || !("content" in first.message)) return null;
  return typeof first.message.content === "string" && first.message.content.trim() ? first.message.content.trim() : null;
}
