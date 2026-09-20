import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { isOwnedStoragePath, MAX_MEMORY_ASSETS, MEMORIES_BUCKET, memoryAssetSchema } from "@/lib/file-workflows";
import { recordFileActivity, verifyStoredObject } from "@/lib/private-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id: memoryId } = await context.params;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  try {
    const parsed = memoryAssetSchema.parse(input);
    if (!isOwnedStoragePath(parsed.storage_path, auth.userId)) {
      return apiError("INVALID_STORAGE_PATH", "Le chemin du média privé est invalide.", 400);
    }
    const { data: memory, error: memoryError } = await auth.supabase
      .from("memories")
      .select("id")
      .eq("id", memoryId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (memoryError) return databaseError(memoryError);
    if (!memory) return apiError("NOT_FOUND", "Souvenir introuvable.", 404);

    const [{ count, error: countError }, { data: existing, error: existingError }] = await Promise.all([
      auth.supabase.from("memory_assets").select("id", { count: "exact", head: true }).eq("memory_id", memoryId).eq("user_id", auth.userId),
      auth.supabase.from("memory_assets").select("id").eq("user_id", auth.userId).eq("storage_path", parsed.storage_path).maybeSingle(),
    ]);
    if (countError) return databaseError(countError);
    if (existingError) return databaseError(existingError);
    if (existing) return apiError("DUPLICATE_OBJECT", "Ce média est déjà rattaché à un souvenir.", 409);
    if ((count ?? 0) >= MAX_MEMORY_ASSETS) {
      return apiError("ASSET_LIMIT", `Un souvenir accepte au maximum ${MAX_MEMORY_ASSETS} médias.`, 409);
    }

    const verification = await verifyStoredObject(
      auth,
      MEMORIES_BUCKET,
      parsed.storage_path,
      parsed.file_size_bytes,
      parsed.mime_type,
    );
    if (!verification.ok) return apiError(verification.code, verification.message, verification.status);

    const { data, error } = await auth.supabase
      .from("memory_assets")
      .insert({ ...parsed, user_id: auth.userId, memory_id: memoryId, sort_order: count ?? 0 })
      .select()
      .single();
    if (error || !data) {
      const { error: cleanupError } = await auth.supabase.storage.from(MEMORIES_BUCKET).remove([parsed.storage_path]);
      if (cleanupError) console.error("LifeOS orphan memory asset cleanup failed", { code: cleanupError.name });
      return databaseError(error);
    }
    await recordFileActivity(auth, "memory_assets", data.id, "created");
    return apiData(data, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Corrigez le média signalé.", 400, error.flatten().fieldErrors);
    }
    return apiError("INVALID_INPUT", "Les métadonnées du média sont invalides.", 400);
  }
}
