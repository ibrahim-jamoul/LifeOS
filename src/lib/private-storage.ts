import type { AuthenticatedRequest } from "@/lib/api";

type StorageBucket = "documents" | "memories";

export type StorageVerification =
  | { ok: true }
  | { ok: false; code: "STORAGE_UNAVAILABLE" | "OBJECT_NOT_FOUND" | "OBJECT_MISMATCH"; message: string; status: number };

export async function verifyStoredObject(
  context: AuthenticatedRequest,
  bucket: StorageBucket,
  storagePath: string,
  expectedBytes: number,
  expectedMime: string,
): Promise<StorageVerification> {
  const lastSlash = storagePath.lastIndexOf("/");
  if (lastSlash < 1) return { ok: false, code: "OBJECT_NOT_FOUND", message: "Objet de stockage introuvable.", status: 400 };
  const folder = storagePath.slice(0, lastSlash);
  const filename = storagePath.slice(lastSlash + 1);
  const { data, error } = await context.supabase.storage.from(bucket).list(folder, { limit: 10, search: filename });
  if (error) {
    console.error("LifeOS storage lookup failed", { bucket, code: error.name });
    return { ok: false, code: "STORAGE_UNAVAILABLE", message: "Le stockage privé n’est pas disponible. Vérifiez le bucket et ses politiques.", status: 503 };
  }
  const object = data.find((candidate) => candidate.name === filename && candidate.id !== null);
  if (!object) return { ok: false, code: "OBJECT_NOT_FOUND", message: "Le fichier uploadé n’a pas été retrouvé.", status: 400 };
  if (object.metadata?.size !== expectedBytes || object.metadata?.mimetype !== expectedMime) {
    return { ok: false, code: "OBJECT_MISMATCH", message: "Les métadonnées du fichier ne correspondent pas à l’objet privé.", status: 400 };
  }
  return { ok: true };
}

export async function createSignedUrlMap(
  context: AuthenticatedRequest,
  bucket: StorageBucket,
  paths: readonly string[],
  expiresIn: number,
): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(paths)];
  const result = new Map<string, string>();
  for (let index = 0; index < uniquePaths.length; index += 100) {
    const chunk = uniquePaths.slice(index, index + 100);
    const { data, error } = await context.supabase.storage.from(bucket).createSignedUrls(chunk, expiresIn);
    if (error) {
      console.error("LifeOS signed URL batch failed", { bucket, code: error.name });
      continue;
    }
    for (const entry of data) {
      if (entry.path && entry.signedUrl) result.set(entry.path, entry.signedUrl);
    }
  }
  return result;
}

export async function recordFileActivity(
  context: AuthenticatedRequest,
  entityType: "documents" | "memories" | "memory_assets",
  entityId: string,
  action: "created" | "updated" | "deleted",
): Promise<void> {
  const { error } = await context.supabase.from("activity_log").insert({
    user_id: context.userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    summary: null,
  });
  if (error) console.error("LifeOS file activity log failed", { code: error.code });
}
