import { describe, expect, it } from "vitest";
import { documentMetadataSchema, uploadRequestSchema } from "@/modules/documents/schemas/document.schema";
import { DOCUMENT_DEFAULT_MAX_FILE_SIZE_BYTES, DOCUMENT_MULTIPART_THRESHOLD_BYTES, DOCUMENT_PART_SIZE_BYTES, hasAllowedFileIdentity } from "@/modules/documents/policy";

const base = { name: "  Document synthétique  ", category: "administrative", status: "valid", organization_id: "", project_id: "", mission_id: "", issued_on: "2026-09-01", expires_on: "2026-09-30", notes: "" };
describe("document policy and schemas", () => {
  it("normalizes optional metadata and validates dates", () => { const parsed = documentMetadataSchema.parse(base); expect(parsed.name).toBe("Document synthétique"); expect(parsed.organization_id).toBeNull(); expect(parsed.notes).toBeNull(); expect(documentMetadataSchema.safeParse({ ...base, expires_on: "2026-08-31" }).success).toBe(false); });
  it.each([["document.pdf", "application/pdf"], ["image.png", "image/png"], ["photo.jpg", "image/jpeg"], ["photo.jpeg", "image/jpeg"]])("accepts matching %s", (name, mime) => expect(hasAllowedFileIdentity(name, mime)).toBe(true));
  it.each([["document.png", "application/pdf"], ["document.pdf.exe", "application/pdf"], ["photo.jpg", "image/png"], ["sans-extension", "image/jpeg"]])("rejects mismatched %s", (name, mime) => expect(hasAllowedFileIdentity(name, mime)).toBe(false));
  it("rejects empty sizes and mismatched upload identity", () => { expect(uploadRequestSchema.safeParse({ ...base, original_file_name: "test.pdf", expected_size: 0, expected_mime: "application/pdf" }).success).toBe(false); expect(uploadRequestSchema.safeParse({ ...base, original_file_name: "test.png", expected_size: 10, expected_mime: "application/pdf" }).success).toBe(false); });
  it("keeps upload constants centralized", () => { expect(DOCUMENT_MULTIPART_THRESHOLD_BYTES).toBe(5 * 1024 * 1024); expect(DOCUMENT_PART_SIZE_BYTES).toBe(16 * 1024 * 1024); expect(DOCUMENT_DEFAULT_MAX_FILE_SIZE_BYTES).toBe(500 * 1024 * 1024); });
});
