import { describe, expect, it } from "vitest";
import {
  buildPrivateStoragePath,
  isOwnedStoragePath,
  resolveDocumentMime,
  sanitizeFilename,
  validateDocumentFile,
  validateMemoryFiles,
} from "../../src/lib/file-workflows";

const userId = "11111111-1111-4111-8111-111111111111";

describe("private file workflows", () => {
  it("builds an owner-prefixed, normalized and unpredictable path", () => {
    const path = buildPrivateStoragePath(userId, 2026, "Mon relevé bancaire (août).PDF");
    expect(path).toMatch(new RegExp(`^${userId}/2026/[0-9a-f-]{36}-Mon-releve-bancaire-aout\\.PDF$`, "i"));
    expect(isOwnedStoragePath(path, userId)).toBe(true);
    expect(isOwnedStoragePath(path, "22222222-2222-4222-8222-222222222222")).toBe(false);
  });

  it("rejects traversal, extra folders and forged owner prefixes", () => {
    expect(isOwnedStoragePath(`${userId}/2026/../secret.pdf`, userId)).toBe(false);
    expect(isOwnedStoragePath(`${userId}/2026/nested/file.pdf`, userId)).toBe(false);
    expect(isOwnedStoragePath(`other/2026/${crypto.randomUUID()}-file.pdf`, userId)).toBe(false);
  });

  it("normalizes hostile filenames without losing a safe extension", () => {
    expect(sanitizeFilename("../../résumé final?.pdf")).toBe("resume-final.pdf");
  });

  it("validates document MIME, extension and size together", () => {
    expect(resolveDocumentMime({ name: "preuve.pdf", type: "application/pdf" })).toBe("application/pdf");
    expect(validateDocumentFile({ name: "preuve.pdf", type: "application/pdf", size: 1_024 })).toBeNull();
    expect(validateDocumentFile({ name: "malware.exe", type: "application/pdf", size: 1_024 })).toMatch(/Format/);
    expect(validateDocumentFile({ name: "huge.pdf", type: "application/pdf", size: 26 * 1024 * 1024 })).toMatch(/25 Mo/);
  });

  it("enforces memory batch count and aggregate size", () => {
    const image = { name: "photo.jpg", type: "image/jpeg", size: 13 * 1024 * 1024 };
    expect(validateMemoryFiles([image, image])).toBeNull();
    expect(validateMemoryFiles(Array.from({ length: 13 }, () => image))).toMatch(/12 fichiers/);
    expect(validateMemoryFiles(Array.from({ length: 12 }, () => image))).toMatch(/150 Mo/);
  });
});
