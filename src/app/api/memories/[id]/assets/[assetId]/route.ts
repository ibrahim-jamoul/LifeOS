import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";
import { isOwnedStoragePath, MEMORIES_BUCKET } from "@/lib/file-workflows";
import { recordFileActivity } from "@/lib/private-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; assetId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id: memoryId, assetId } = await context.params;
  const { data: asset, error: lookupError } = await auth.supabase
    .from("memory_assets")
    .select("id,storage_path")
    .eq("id", assetId)
    .eq("memory_id", memoryId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (lookupError) return databaseError(lookupError);
  if (!asset) return apiError("NOT_FOUND", "Média introuvable.", 404);
  if (!isOwnedStoragePath(asset.storage_path, auth.userId)) {
    return apiError("INVALID_STORAGE_PATH", "Le chemin privé enregistré est invalide; suppression interrompue.", 409);
  }

  const { error: storageError } = await auth.supabase.storage.from(MEMORIES_BUCKET).remove([asset.storage_path]);
  if (storageError) {
    console.error("LifeOS memory asset storage delete failed", { code: storageError.name });
    return apiError("STORAGE_DELETE_FAILED", "Le média n’a pas pu être supprimé; ses métadonnées ont été conservées.", 503);
  }
  const { data, error } = await auth.supabase
    .from("memory_assets")
    .delete()
    .eq("id", assetId)
    .eq("memory_id", memoryId)
    .eq("user_id", auth.userId)
    .select("id")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("DELETE_INCOMPLETE", "Le média est supprimé, mais ses métadonnées doivent être nettoyées lors d’un nouvel essai.", 409);
  await recordFileActivity(auth, "memory_assets", assetId, "deleted");
  return apiData({ id: assetId, deleted: true });
}
