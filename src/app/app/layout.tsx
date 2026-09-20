import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getDerivedAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!hasSupabaseEnv()) redirect("/login?setup=1");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (claimsError || !userId) redirect("/login");

  const { error: initializationError } = await supabase.rpc("initialize_lifeos");
  if (initializationError) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <section className="card max-w-xl">
          <h1 className="text-xl font-bold">Migration Supabase requise</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            La session fonctionne, mais LifeOS ne peut pas initialiser ses neuf domaines. Appliquez les migrations du dossier
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">supabase/migrations</code>, puis rechargez cette page.
          </p>
          <form action={async () => { "use server"; const client = await createClient(); await client.auth.signOut(); redirect("/login"); }} className="mt-5">
            <button className="button-secondary">Se déconnecter</button>
          </form>
        </section>
      </main>
    );
  }

  const [{ data: profile }, activeAlerts] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    getDerivedAlerts(supabase, userId).catch(() => []),
  ]);
  const activeKeys = activeAlerts.map((alert) => alert.dedupeKey);
  const notificationStates = activeKeys.length
    ? await supabase.from("notifications").select("dedupe_key,read_at").eq("user_id", userId).in("dedupe_key", activeKeys)
    : { data: [] as { dedupe_key: string; read_at: string | null }[] };
  const readByKey = new Map((notificationStates.data ?? []).map((row) => [row.dedupe_key, row.read_at]));
  const unreadAlerts = activeAlerts.filter((alert) => !readByKey.get(alert.dedupeKey)).length;
  const email = claimsData && typeof claimsData.claims.email === "string" ? claimsData.claims.email : undefined;

  return (
    <AppShell
      displayName={typeof profile?.display_name === "string" ? profile.display_name : null}
      email={email}
      unreadAlerts={unreadAlerts}
    >
      {children}
    </AppShell>
  );
}
