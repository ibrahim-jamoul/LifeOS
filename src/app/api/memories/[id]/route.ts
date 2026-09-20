import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { isOwnedStoragePath, MEMORIES_BUCKET, memorySchema } from "@/lib/file-workflows";
import { recordFileActivity } from "@/lib/private-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await context.params;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  try {
    const parsed = memorySchema.parse(input);
    const { data, error } = await auth.supabase
      .from("memories")
      .update(parsed)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select()
      .maybeSingle();
    if (error) return databaseError(error);
    if (!data) return apiError("NOT_FOUND", "Souvenir introuvable.", 404);
    await recordFileActivity(auth, "memories", id, "updated");
    return apiData(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Corrigez les champs signalés.", 400, error.flatten().fieldErrors);
    }
    return apiError("INVALID_INPUT", "Les informations du souvenir sont invalides.", 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await context.params;
  const { data: memory, error: memoryError } = await auth.supabase
    .from("memories")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (memoryError) return databaseError(memoryError);
  if (!memory) return apiError("NOT_FOUND", "Souvenir introuvable.", 404);

  const { data: assets, error: assetError } = await auth.supabase
    .from("memory_assets")
    .select("storage_path")
    .eq("memory_id", id)
    .eq("user_id", auth.userId);
  if (assetError) return databaseError(assetError);
  const paths = (assets ?? []).map((asset) => asset.storage_path);
  if (paths.some((path) => !isOwnedStoragePath(path, auth.userId))) {
    return apiError("INVALID_STORAGE_PATH", "Un chemin privé enregistré est invalide; suppression interrompue.", 409);
  }
  if (paths.length > 0) {
    const { error: storageError } = await auth.supabase.storage.from(MEMORIES_BUCKET).remove(paths);
    if (storageError) {
      console.error("LifeOS memory storage delete failed", { code: storageError.name });
      return apiError("STORAGE_DELETE_FAILED", "Les médias n’ont pas tous pu être supprimés; le souvenir a été conservé.", 503);
    }
  }

  const { data, error } = await auth.supabase
    .from("memories")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("DELETE_INCOMPLETE", "Les médias sont supprimés, mais le souvenir doit être nettoyé lors d’un nouvel essai.", 409);
  await recordFileActivity(auth, "memories", id, "deleted");
  return apiData({ id, deleted: true });
}
