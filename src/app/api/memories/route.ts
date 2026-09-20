import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";
import { isOwnedStoragePath, MEMORIES_BUCKET, memorySchema, sanitizeSearchTerm, SIGNED_URL_TTL_SECONDS } from "@/lib/file-workflows";
import { createSignedUrlMap, recordFileActivity } from "@/lib/private-storage";

export const dynamic = "force-dynamic";

type MemoryAssetRow = {
  id: string;
  memory_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  sort_order: number;
  created_at: string;
};

type MemoryRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  location_text: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  memory_assets: MemoryAssetRow[] | null;
};

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;

  let query = auth.supabase
    .from("memories")
    .select("id,title,start_date,end_date,location_text,description,tags,created_at,updated_at,memory_assets(id,memory_id,storage_path,original_filename,mime_type,file_size_bytes,sort_order,created_at)")
    .eq("user_id", auth.userId);

  const search = sanitizeSearchTerm(request.nextUrl.searchParams.get("q") ?? "");
  if (search) {
    query = query.or([
      `title.ilike.%${search}%`,
      `location_text.ilike.%${search}%`,
      `description.ilike.%${search}%`,
    ].join(","));
  }
  const tag = sanitizeSearchTerm(request.nextUrl.searchParams.get("tag") ?? "").slice(0, 60);
  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return databaseError(error);

  const rows = (data ?? []) as unknown as MemoryRow[];
  const validPaths = rows.flatMap((memory) => (memory.memory_assets ?? [])
    .map((asset) => asset.storage_path)
    .filter((path) => isOwnedStoragePath(path, auth.userId)));
  const signedUrls = await createSignedUrlMap(auth, MEMORIES_BUCKET, validPaths, SIGNED_URL_TTL_SECONDS);
  const items = rows.map(({ memory_assets: rawAssets, ...memory }) => ({
    ...memory,
    assets: (rawAssets ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((asset) => ({ ...asset, signed_url: signedUrls.get(asset.storage_path) ?? null })),
  }));
  return apiData({ items, signedUrlTtlSeconds: SIGNED_URL_TTL_SECONDS });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  try {
    const parsed = memorySchema.parse(input);
    const { data, error } = await auth.supabase
      .from("memories")
      .insert({ ...parsed, user_id: auth.userId })
      .select()
      .single();
    if (error || !data) return databaseError(error);
    await recordFileActivity(auth, "memories", data.id, "created");
    return apiData({ ...data, assets: [] }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Corrigez les champs signalés.", 400, error.flatten().fieldErrors);
    }
    return apiError("INVALID_INPUT", "Les informations du souvenir sont invalides.", 400);
  }
}
