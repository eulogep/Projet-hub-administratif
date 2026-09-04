export const DOCUMENT_ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const DOCUMENT_ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"] as const;
export const DOCUMENT_DEFAULT_MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const DOCUMENT_MULTIPART_THRESHOLD_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_PART_SIZE_BYTES = 16 * 1024 * 1024;
export const DOCUMENT_RETRY_DELAYS = [0, 1000, 3000, 7000] as const;

export function getDocumentMaxFileSizeBytes() {
  const configured = Number(process.env.DOCUMENT_MAX_FILE_SIZE_BYTES ?? DOCUMENT_DEFAULT_MAX_FILE_SIZE_BYTES);
  if (!Number.isSafeInteger(configured) || configured <= 0) throw new Error("Invalid DOCUMENT_MAX_FILE_SIZE_BYTES configuration.");
  return configured;
}

export function extensionForMime(mime: string) {
  return mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : null;
}

export function fileExtension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function hasAllowedFileIdentity(name: string, mime: string) {
  const extension = fileExtension(name);
  return (mime === "application/pdf" && extension === "pdf") ||
    (mime === "image/png" && extension === "png") ||
    (mime === "image/jpeg" && (extension === "jpg" || extension === "jpeg"));
}
