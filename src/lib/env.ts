const requiredPublicEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

export function hasSupabaseEnv(): boolean {
  return requiredPublicEnv.every((name) => Boolean(process.env[name]?.trim()));
}

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured. Copy .env.example to .env.local and add the project URL and publishable key.");
  }

  return { url, publishableKey };
}

export function hasAiEnv(): boolean {
  return Boolean(process.env.AI_API_KEY?.trim() && process.env.AI_MODEL?.trim());
}
