import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const config = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  emailA: process.env.SUPABASE_TEST_USER_A_EMAIL,
  passwordA: process.env.SUPABASE_TEST_USER_A_PASSWORD,
  emailB: process.env.SUPABASE_TEST_USER_B_EMAIL,
  passwordB: process.env.SUPABASE_TEST_USER_B_PASSWORD,
};
const live = Object.values(config).every(Boolean);

describe.runIf(live)("live Supabase tenant isolation", () => {
  let a: SupabaseClient;
  let b: SupabaseClient;
  let userA = "";
  let userB = "";
  let goalId = "";
  let storagePath = "";

  beforeAll(async () => {
    a = createClient(config.url!, config.key!, { auth: { persistSession: false, autoRefreshToken: false } });
    b = createClient(config.url!, config.key!, { auth: { persistSession: false, autoRefreshToken: false } });
    const [loginA, loginB] = await Promise.all([
      a.auth.signInWithPassword({ email: config.emailA!, password: config.passwordA! }),
      b.auth.signInWithPassword({ email: config.emailB!, password: config.passwordB! }),
    ]);
    expect(loginA.error).toBeNull();
    expect(loginB.error).toBeNull();
    userA = loginA.data.user!.id;
    userB = loginB.data.user!.id;
  });

  afterAll(async () => {
    if (goalId) await a.from("goals").delete().eq("id", goalId);
    if (storagePath) await a.storage.from("documents").remove([storagePath]);
    await Promise.all([a?.auth.signOut(), b?.auth.signOut()]);
  });

  it("initializes exactly the nine branches idempotently", async () => {
    const first = await a.rpc("initialize_lifeos");
    const second = await a.rpc("initialize_lifeos");
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    const { data, error } = await a.from("domains").select("slug").eq("user_id", userA).order("position");
    expect(error).toBeNull();
    expect(data?.map((row) => row.slug)).toEqual(["religion", "arabic", "quran", "goals", "assistant", "finances", "health", "documents", "memories"]);
  });

  it("blocks cross-user row reads, updates, deletes and forged ownership", async () => {
    const inserted = await a.from("goals").insert({ user_id: userA, title: `RLS ${crypto.randomUUID()}`, definition_of_done: "Isolation verified" }).select("id").single();
    expect(inserted.error).toBeNull();
    goalId = inserted.data!.id;

    const readByB = await b.from("goals").select("id,title").eq("id", goalId);
    expect(readByB.error).toBeNull();
    expect(readByB.data).toEqual([]);
    const updateByB = await b.from("goals").update({ title: "forged" }).eq("id", goalId).select("id");
    expect(updateByB.error).toBeNull();
    expect(updateByB.data).toEqual([]);
    const deleteByB = await b.from("goals").delete().eq("id", goalId).select("id");
    expect(deleteByB.error).toBeNull();
    expect(deleteByB.data).toEqual([]);

    const forged = await a.from("goals").insert({ user_id: userB, title: "forged owner", definition_of_done: "must fail" });
    expect(forged.error).not.toBeNull();
    const ownerStillReads = await a.from("goals").select("id").eq("id", goalId).single();
    expect(ownerStillReads.error).toBeNull();
  });

  it("keeps private Storage objects unreadable by another authenticated user", async () => {
    storagePath = `${userA}/2026/${crypto.randomUUID()}-rls-test.txt`;
    const upload = await a.storage.from("documents").upload(storagePath, new Blob(["private LifeOS test"], { type: "text/plain" }));
    expect(upload.error).toBeNull();
    const ownerDownload = await a.storage.from("documents").download(storagePath);
    expect(ownerDownload.error).toBeNull();
    const otherDownload = await b.storage.from("documents").download(storagePath);
    expect(otherDownload.error).not.toBeNull();
    const wrongPrefixUpload = await a.storage.from("documents").upload(`${userB}/2026/${crypto.randomUUID()}-forged.txt`, new Blob(["forged"]));
    expect(wrongPrefixUpload.error).not.toBeNull();
  });
});

describe.skipIf(live)("live Supabase tenant isolation", () => {
  it("requires two dedicated test accounts", () => {
    expect(live, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_TEST_USER_A/B_* to run live RLS tests.").toBe(false);
  });
});
