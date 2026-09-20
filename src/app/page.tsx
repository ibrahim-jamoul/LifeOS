import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!hasSupabaseEnv()) redirect("/login?setup=1");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  redirect(data?.claims?.sub ? "/app/dashboard" : "/login");
}
