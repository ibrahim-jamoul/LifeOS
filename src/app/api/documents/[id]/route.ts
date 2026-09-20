import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { DOCUMENT_BUCKET, documentUpdateSchema, isOwnedStoragePath } from "@/lib/file-workflows";
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
    const parsed = documentUpdateSchema.parse(input);
    const { data, error } = await auth.supabase
      .from("documents")
      .update(parsed)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select()
      .maybeSingle();
    if (error) return databaseError(error);
    if (!data) return apiError("NOT_FOUND", "Document introuvable.", 404);
    await recordFileActivity(auth, "documents", id, "updated");
    return apiData(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Corrigez les champs signalés.", 400, error.flatten().fieldErrors);
    }
    return apiError("INVALID_INPUT", "Les métadonnées du document sont invalides.", 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { id } = await context.params;
  const { data: document, error: lookupError } = await auth.supabase
    .from("documents")
    .select("id,storage_path")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (lookupError) return databaseError(lookupError);
  if (!document) return apiError("NOT_FOUND", "Document introuvable.", 404);
  if (!isOwnedStoragePath(document.storage_path, auth.userId)) {
    return apiError("INVALID_STORAGE_PATH", "Le chemin privé enregistré est invalide; suppression interrompue.", 409);
  }

  const { error: storageError } = await auth.supabase.storage.from(DOCUMENT_BUCKET).remove([document.storage_path]);
  if (storageError) {
    console.error("LifeOS document storage delete failed", { code: storageError.name });
    return apiError("STORAGE_DELETE_FAILED", "Le fichier n’a pas pu être supprimé; les métadonnées ont été conservées.", 503);
  }

  const { data, error } = await auth.supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id")
    .maybeSingle();
  if (error) return databaseError(error);
  if (!data) return apiError("DELETE_INCOMPLETE", "Le fichier est supprimé, mais les métadonnées doivent être nettoyées lors d’un nouvel essai.", 409);
  await recordFileActivity(auth, "documents", id, "deleted");
  return apiData({ id, deleted: true });
}
