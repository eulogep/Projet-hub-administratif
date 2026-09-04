import { randomUUID } from "node:crypto";
import { extensionForMime } from "@/modules/documents/policy";

export function createDocumentObjectKey(workspaceId: string, documentId: string, mime: string) {
  const extension = extensionForMime(mime);
  if (!extension) throw new Error("Unsupported document MIME type.");
  return `${workspaceId}/${documentId}/${randomUUID()}.${extension}`;
}
