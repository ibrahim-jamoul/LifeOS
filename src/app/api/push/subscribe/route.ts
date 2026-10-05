import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }).strict(),
}).strict();

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;

  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "L’appareil ne peut pas être enregistré.", 400, parsed.error.flatten().fieldErrors);
  }

  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const { error } = await auth.supabase.from("push_subscriptions").upsert({
    user_id: auth.userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: userAgent,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });

  if (error) return databaseError(error);
  return apiData({ subscribed: true });
}
