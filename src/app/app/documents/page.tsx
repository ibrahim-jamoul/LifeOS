import type { Metadata } from "next";
import { DocumentVault } from "@/components/document-vault";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  return <DocumentVault userId={userId} />;
}
