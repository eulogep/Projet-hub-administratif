import "server-only";
import { R2DocumentStorageProvider } from "@/integrations/storage/r2/provider";
import type { UploadOperation } from "@/integrations/storage/document-storage-provider";
import { signRequestSchema } from "../schemas/document.schema";
import { loadOwnedUploadSession } from "./upload-session.service";

const activeStates = new Set(["initiated", "uploading", "completing"]);
export async function signUploadOperation(sessionId: string, input: unknown) {
  const request = signRequestSchema.parse(input); const { supabase, session } = await loadOwnedUploadSession(sessionId);
  if (request.key !== session.storage_key || !activeStates.has(session.state) || new Date(session.expires_at) <= new Date()) throw new Error("UPLOAD_OPERATION_DENIED");
  if (session.upload_id && request.uploadId !== session.upload_id) throw new Error("UPLOAD_ID_MISMATCH");
  if (!session.upload_id && request.uploadId) {
    const bound = await supabase.from("document_upload_sessions").update({ upload_id: request.uploadId, state: "uploading" }).eq("id", session.id).eq("workspace_id", session.workspace_id).is("upload_id", null).select("id").maybeSingle();
    if (bound.error || !bound.data) throw new Error("UPLOAD_ID_BIND_FAILED");
  } else if (session.state === "initiated") await supabase.from("document_upload_sessions").update({ state: "uploading" }).eq("id", session.id).eq("workspace_id", session.workspace_id);
  if (request.method === "POST" && request.uploadId) await supabase.from("document_upload_sessions").update({ state: "completing" }).eq("id", session.id).eq("workspace_id", session.workspace_id);
  if (request.method === "DELETE") await supabase.from("document_upload_sessions").update({ state: "aborted" }).eq("id", session.id).eq("workspace_id", session.workspace_id);
  const operation: UploadOperation = { method: request.method, uploadId: request.uploadId, partNumber: request.partNumber };
  return new R2DocumentStorageProvider().presignUploadOperation({ key: session.storage_key, mime: session.expected_mime, operation });
}
