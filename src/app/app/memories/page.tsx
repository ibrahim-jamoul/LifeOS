import type { Metadata } from "next";
import { MemoryTimeline } from "@/components/memory-timeline";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Souvenirs" };
export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  return <MemoryTimeline userId={userId} />;
}
