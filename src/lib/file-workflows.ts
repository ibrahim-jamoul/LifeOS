import { z } from "zod";

export const DOCUMENT_BUCKET = "documents";
export const MEMORIES_BUCKET = "memories";

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_MEMORY_ASSET_BYTES = 50 * 1024 * 1024;
export const MAX_MEMORY_BATCH_BYTES = 150 * 1024 * 1024;
export const MAX_MEMORY_ASSETS = 20;
export const MAX_MEMORY_UPLOAD_BATCH = 12;
export const SIGNED_URL_TTL_SECONDS = 300;

export const documentCategories = [
  { value: "identity", label: "Identité" },
  { value: "administrative", label: "Administratif" },
  { value: "finance", label: "Finance" },
  { value: "health", label: "Santé" },
  { value: "education", label: "Formation" },
  { value: "vehicle", label: "Véhicule" },
  { value: "other", label: "Autre" },
] as const;

export type DocumentCategory = (typeof documentCategories)[number]["value"];

const documentMimeByExtension: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const memoryMimeByExtension: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export const documentMimeTypes = new Set(Object.values(documentMimeByExtension));
export const memoryMimeTypes = new Set(Object.values(memoryMimeByExtension));

const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
);

const optionalText = (max: number) => z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().trim().max(max).nullable(),
);

const tags = z.preprocess(
  (value) => typeof value === "string" ? parseTags(value) : value ?? [],
  z.array(z.string().trim().min(1).max(60)).max(30).transform((values) => [...new Set(values)]),
);

const documentFields = {
  title: z.string().trim().min(1, "Le titre est requis.").max(240),
  category: z.enum(["identity", "administrative", "finance", "health", "education", "vehicle", "other"]),
  issuer: optionalText(240),
  issued_on: optionalDate,
  expires_on: optionalDate,
  tags,
  notes: optionalText(5_000),
};

export const documentCreateSchema = z.object({
  ...documentFields,
  storage_path: z.string().trim().min(1).max(500),
  original_filename: z.string().trim().min(1).max(255),
  mime_type: z.string().trim().min(1).max(200),
  file_size_bytes: z.coerce.number().int().positive().max(MAX_DOCUMENT_BYTES),
}).superRefine((value, context) => {
  if (value.issued_on && value.expires_on && value.issued_on > value.expires_on) {
    context.addIssue({ code: "custom", path: ["expires_on"], message: "L’expiration doit suivre la date d’émission." });
  }
  if (!documentMimeTypes.has(value.mime_type)) {
    context.addIssue({ code: "custom", path: ["mime_type"], message: "Type de fichier non pris en charge." });
  }
});

export const documentUpdateSchema = z.object(documentFields).superRefine((value, context) => {
  if (value.issued_on && value.expires_on && value.issued_on > value.expires_on) {
    context.addIssue({ code: "custom", path: ["expires_on"], message: "L’expiration doit suivre la date d’émission." });
  }
});

const memoryFields = {
  title: z.string().trim().min(1, "Le titre est requis.").max(240),
  start_date: optionalDate,
  end_date: optionalDate,
  location_text: optionalText(300),
  description: optionalText(5_000),
  tags,
};

export const memorySchema = z.object(memoryFields).superRefine((value, context) => {
  if (value.start_date && value.end_date && value.start_date > value.end_date) {
    context.addIssue({ code: "custom", path: ["end_date"], message: "La fin doit suivre le début du souvenir." });
  }
});

export const memoryAssetSchema = z.object({
  storage_path: z.string().trim().min(1).max(500),
  original_filename: z.string().trim().min(1).max(255),
  mime_type: z.string().trim().min(1).max(200),
  file_size_bytes: z.coerce.number().int().positive().max(MAX_MEMORY_ASSET_BYTES),
}).superRefine((value, context) => {
  if (!memoryMimeTypes.has(value.mime_type)) {
    context.addIssue({ code: "custom", path: ["mime_type"], message: "Seules les images et vidéos prises en charge sont acceptées." });
  }
});

export type DocumentInput = z.infer<typeof documentUpdateSchema>;
export type MemoryInput = z.infer<typeof memorySchema>;

export function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 30);
}

export function sanitizeSearchTerm(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s._-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function extensionOf(filename: string): string {
  const extension = filename.split(".").pop();
  return extension && extension !== filename ? extension.toLowerCase() : "";
}

export function resolveDocumentMime(file: Pick<File, "name" | "type">): string | null {
  const fromExtension = documentMimeByExtension[extensionOf(file.name)];
  if (!fromExtension) return null;
  if (!file.type || file.type === "application/octet-stream") return fromExtension;
  return documentMimeTypes.has(file.type) ? file.type : null;
}

export function resolveMemoryMime(file: Pick<File, "name" | "type">): string | null {
  const fromExtension = memoryMimeByExtension[extensionOf(file.name)];
  if (!fromExtension) return null;
  if (!file.type || file.type === "application/octet-stream") return fromExtension;
  return memoryMimeTypes.has(file.type) ? file.type : null;
}

export function validateDocumentFile(file: Pick<File, "name" | "size" | "type">): string | null {
  if (file.size <= 0) return "Le fichier est vide.";
  if (file.size > MAX_DOCUMENT_BYTES) return "Le fichier dépasse la limite de 25 Mo.";
  if (!resolveDocumentMime(file)) return "Format non pris en charge (PDF, image ou document Office attendu).";
  return null;
}

export function validateMemoryFiles(files: readonly Pick<File, "name" | "size" | "type">[]): string | null {
  if (files.length === 0) return "Sélectionnez au moins une photo ou vidéo.";
  if (files.length > MAX_MEMORY_UPLOAD_BATCH) return `Ajoutez au maximum ${MAX_MEMORY_UPLOAD_BATCH} fichiers à la fois.`;
  let total = 0;
  for (const file of files) {
    if (file.size <= 0) return `${file.name} est vide.`;
    if (file.size > MAX_MEMORY_ASSET_BYTES) return `${file.name} dépasse la limite de 50 Mo.`;
    if (!resolveMemoryMime(file)) return `${file.name} n’est pas une image ou vidéo prise en charge.`;
    total += file.size;
  }
  return total > MAX_MEMORY_BATCH_BYTES ? "La sélection dépasse la limite totale de 150 Mo." : null;
}

export function sanitizeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/-+\./g, ".")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-120);
  return normalized || "fichier";
}

export function buildPrivateStoragePath(userId: string, year: string | number, filename: string): string {
  const normalizedYear = String(year).match(/^\d{4}$/)?.[0] ?? String(new Date().getUTCFullYear());
  return `${userId}/${normalizedYear}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

export function isOwnedStoragePath(path: string, userId: string): boolean {
  const [owner, year, filename, ...rest] = path.split("/");
  if (rest.length > 0 || owner !== userId || !/^\d{4}$/.test(year ?? "")) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-.+/i.test(filename ?? "");
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes < 1) return "Taille inconnue";
  const units = ["o", "Ko", "Mo", "Go"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: unitIndex === 0 ? 0 : 1 }).format(bytes / 1024 ** unitIndex)} ${units[unitIndex]}`;
}
