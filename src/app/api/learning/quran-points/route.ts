import { z } from "zod";
import { apiData, apiError, databaseError, isApiResponse, readJsonObject, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  quranItemId: z.preprocess((value) => value === "" || value === undefined ? null : value, z.uuid().nullable()),
  surahNumber: z.coerce.number().int().min(1).max(114),
  ayahNumber: z.coerce.number().int().min(1).max(500),
  issueType: z.enum(["hesitation", "confusion", "memorization", "pronunciation", "tajwid", "other"]),
  note: z.preprocess((value) => value === "" || value === undefined ? null : value, z.string().trim().max(2_000).nullable()),
  priority: z.coerce.number().int().min(1).max(3),
  nextReviewAt: z.preprocess((value) => value === "" || value === undefined ? null : value, z.iso.datetime({ offset: true }).nullable()),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const input = await readJsonObject(request);
  if (isApiResponse(input)) return input;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Le point d’attention est invalide.", 400, parsed.error.flatten().fieldErrors);

  const value = parsed.data;
  if (value.quranItemId) {
    const { data: item, error } = await auth.supabase
      .from("quran_items")
      .select("id,surah_number,start_ayah,end_ayah")
      .eq("id", value.quranItemId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (error) return databaseError(error);
    if (!item) return apiError("INVALID_RELATION", "L’élément Coran sélectionné est introuvable.", 400);
    if (item.surah_number !== value.surahNumber) return apiError("INVALID_AYAH", "La sourate ne correspond pas à l’élément Coran sélectionné.", 400);
    if (typeof item.start_ayah === "number" && value.ayahNumber < item.start_ayah) return apiError("INVALID_AYAH", "Ce verset est en dehors de la plage de l’élément sélectionné.", 400);
    if (typeof item.end_ayah === "number" && value.ayahNumber > item.end_ayah) return apiError("INVALID_AYAH", "Ce verset est en dehors de la plage de l’élément sélectionné.", 400);
  }

  const { data, error } = await auth.supabase.from("quran_revision_points").insert({
    user_id: auth.userId,
    quran_item_id: value.quranItemId,
    surah_number: value.surahNumber,
    ayah_number: value.ayahNumber,
    issue_type: value.issueType,
    note: value.note,
    priority: value.priority,
    next_review_at: value.nextReviewAt,
  }).select().single();
  if (error || !data) return databaseError(error);
  return apiData(data, { status: 201 });
}
