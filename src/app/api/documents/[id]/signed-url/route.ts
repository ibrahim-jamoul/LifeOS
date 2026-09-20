import type { NextRequest } from "next/server";
import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";
import { DOCUMENT_BUCKET, isOwnedStoragePath, SIGNED_URL_TTL_SECONDS } from "@/lib/file-workflows";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await context.params;
  const { data: document, error: lookupError } = await auth.supabase
    .from("documents")
    .select("storage_path,original_filename")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (lookupError) return databaseError(lookupError);
  if (!document) return apiError("NOT_FOUND", "Document introuvable.", 404);
  if (!isOwnedStoragePath(document.storage_path, auth.userId)) {
    return apiError("INVALID_STORAGE_PATH", "Le chemin privé enregistré est invalide.", 409);
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const { data, error } = await auth.supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(
    document.storage_path,
    SIGNED_URL_TTL_SECONDS,
    download ? { download: document.original_filename } : undefined,
  );
  if (error || !data) {
    console.error("LifeOS document signed URL failed", { code: error?.name ?? "UNKNOWN" });
    return apiError("SIGNED_URL_FAILED", "L’accès privé temporaire n’a pas pu être créé.", 503);
  }
  return apiData({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
