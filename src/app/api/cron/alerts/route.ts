import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { apiData, apiError } from "@/lib/api";
import { materializeAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return apiError("UNAUTHORIZED", "Accès refusé.", 401);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return apiError("CONFIGURATION_REQUIRED", "Clé serveur Supabase absente.", 503);

  const admin = createAdminClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profiles, error } = await admin.from("profiles").select("id").limit(10_000);
  if (error) return apiError("DATABASE_ERROR", "Impossible de lire les profils.", 500);

  let generated = 0;
  for (const profile of profiles ?? []) {
    if (typeof profile.id !== "string") continue;
    const result = await materializeAlerts(admin, profile.id);
    generated += result.generated;
  }
  return apiData({ users: profiles?.length ?? 0, generated });
}
