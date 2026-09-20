import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedRequest = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

export async function requireUser(): Promise<AuthenticatedRequest | NextResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    if (error || !userId) return apiError("UNAUTHENTICATED", "Authentification requise.", 401);
    return { supabase, userId };
  } catch {
    return apiError("CONFIGURATION_REQUIRED", "Supabase n’est pas configuré.", 503);
  }
}

export function apiData<T>(data: T, init?: ResponseInit): NextResponse {
  const response = NextResponse.json({ ok: true, data }, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function apiError(code: string, message: string, status: number, fieldErrors?: Record<string, string[]>): NextResponse {
  const response = NextResponse.json({ ok: false, error: { code, message, fieldErrors } }, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function databaseError(error: { code?: string; message?: string } | null): NextResponse {
  const code = error?.code ?? "DATABASE_ERROR";
  console.error("LifeOS database operation failed", { code });

  if (code === "23505") return apiError("CONFLICT", "Un enregistrement équivalent existe déjà.", 409);
  if (code === "23503") return apiError("INVALID_RELATION", "La relation choisie n’existe pas ou ne vous appartient pas.", 400);
  if (code === "23514") return apiError("INVALID_VALUE", "Une valeur ne respecte pas les règles métier.", 400);
  if (code === "42501" || code === "PGRST301") return apiError("FORBIDDEN", "Cette opération n’est pas autorisée.", 403);
  return apiError("DATABASE_ERROR", "L’opération n’a pas pu être enregistrée.", 500);
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | NextResponse> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 256_000) return apiError("PAYLOAD_TOO_LARGE", "Le formulaire est trop volumineux.", 413);
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return apiError("INVALID_JSON", "Le contenu du formulaire est invalide.", 400);
    }
    return value as Record<string, unknown>;
  } catch {
    return apiError("INVALID_JSON", "Le contenu du formulaire est invalide.", 400);
  }
}

export function isApiResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
