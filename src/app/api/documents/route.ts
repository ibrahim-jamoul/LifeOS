import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import {
  DOCUMENT_BUCKET,
  documentCategories,
  documentCreateSchema,
  isOwnedStoragePath,
  sanitizeSearchTerm,
} from "@/lib/file-workflows";
import { recordFileActivity, verifyStoredObject } from "@/lib/private-storage";

export const dynamic = "force-dynamic";

const categoryValues = new Set(documentCategories.map((category) => category.value));

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;

  let query = auth.supabase
    .from("documents")
    .select("id,title,category,storage_path,original_filename,mime_type,file_size_bytes,issuer,issued_on,expires_on,tags,notes,created_at,updated_at")
    .eq("user_id", auth.userId);

  const search = sanitizeSearchTerm(request.nextUrl.searchParams.get("q") ?? "");
  if (search) {
    query = query.or([
      `title.ilike.%${search}%`,
      `original_filename.ilike.%${search}%`,
      `issuer.ilike.%${search}%`,
      `notes.ilike.%${search}%`,
    ].join(","));
  }

  const category = request.nextUrl.searchParams.get("category") ?? "";
  if (category && categoryValues.has(category as never)) query = query.eq("category", category);

  const expiry = request.nextUrl.searchParams.get("expiry") ?? "";
  const today = new Date().toISOString().slice(0, 10);
  if (expiry === "expired") query = query.lt("expires_on", today);
  if (expiry === "none") query = query.is("expires_on", null);
  if (["7", "30", "90"].includes(expiry)) {
    const until = new Date(`${today}T12:00:00Z`);
    until.setUTCDate(until.getUTCDate() + Number(expiry));
    query = query.gte("expires_on", today).lte("expires_on", until.toISOString().slice(0, 10));
  }

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(200);
  if (error) return databaseError(error);
  return apiData({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  try {
    const parsed = documentCreateSchema.parse(input);
    if (!isOwnedStoragePath(parsed.storage_path, auth.userId)) {
      return apiError("INVALID_STORAGE_PATH", "Le chemin du fichier privé est invalide.", 400);
    }

    const { data: existing, error: existingError } = await auth.supabase
      .from("documents")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("storage_path", parsed.storage_path)
      .maybeSingle();
    if (existingError) return databaseError(existingError);
    if (existing) return apiError("DUPLICATE_OBJECT", "Ce fichier est déjà enregistré.", 409);

    const verification = await verifyStoredObject(
      auth,
      DOCUMENT_BUCKET,
      parsed.storage_path,
      parsed.file_size_bytes,
      parsed.mime_type,
    );
    if (!verification.ok) return apiError(verification.code, verification.message, verification.status);

    const { data, error } = await auth.supabase
      .from("documents")
      .insert({ ...parsed, user_id: auth.userId })
      .select()
      .single();
    if (error || !data) {
      const { error: cleanupError } = await auth.supabase.storage.from(DOCUMENT_BUCKET).remove([parsed.storage_path]);
      if (cleanupError) console.error("LifeOS orphan document cleanup failed", { code: cleanupError.name });
      return databaseError(error);
    }
    await recordFileActivity(auth, "documents", data.id, "created");
    return apiData(data, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Corrigez les champs signalés.", 400, error.flatten().fieldErrors);
    }
    return apiError("INVALID_INPUT", "Les métadonnées du document sont invalides.", 400);
  }
}
