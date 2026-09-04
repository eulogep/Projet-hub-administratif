import "server-only";
import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { R2DocumentStorageProvider } from "@/integrations/storage/r2/provider";
import { loadOwnedUploadSession } from "./upload-session.service";

const SIGNATURE_BYTES = 4100;
export class DocumentFinalizationService {
  constructor(private readonly storage = new R2DocumentStorageProvider()) {}
  async finalize(sessionId: string) {
    const { supabase, session } = await loadOwnedUploadSession(sessionId);
    if (session.state === "completed" && session.completed_version_id) return { documentId: session.document_id, versionId: session.completed_version_id };
    if (!["uploading", "completing", "verifying"].includes(session.state)) throw new Error("UPLOAD_NOT_READY");
    await supabase.from("document_upload_sessions").update({ state: "verifying", last_error_code: null }).eq("id", session.id).eq("workspace_id", session.workspace_id);
    try {
      const head = await this.storage.headObject(session.storage_key);
      if (head.size !== Number(session.expected_size)) throw new Error("OBJECT_SIZE_MISMATCH");
      const signature = await this.storage.readSignature(session.storage_key, Math.min(SIGNATURE_BYTES, head.size));
      const detected = await fileTypeFromBuffer(signature);
      if (!detected || detected.mime !== session.expected_mime || !["pdf", "png", "jpg"].includes(detected.ext)) throw new Error("OBJECT_SIGNATURE_MISMATCH");
      const stream = await this.storage.streamObject(session.storage_key); const reader = stream.getReader(); const hash = createHash("sha256"); let streamed = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; streamed += value.byteLength; hash.update(value); }
      if (streamed !== head.size) throw new Error("OBJECT_STREAM_SIZE_MISMATCH");
      const sha256 = hash.digest("hex");
      const result = await supabase.rpc("finalize_document_upload", { p_session_id: session.id, p_actual_size: head.size, p_sha256: sha256, p_etag: head.etag });
      if (result.error || typeof result.data !== "string") throw new Error("DOCUMENT_VERSION_FINALIZE_FAILED", { cause: result.error });
      return { documentId: session.document_id, versionId: result.data };
    } catch (error) {
      await supabase.from("document_upload_sessions").update({ state: "failed", last_error_code: error instanceof Error ? error.message.slice(0, 80) : "FINALIZATION_FAILED" }).eq("id", session.id).eq("workspace_id", session.workspace_id);
      const referenced = await supabase.from("document_versions").select("id").eq("workspace_id", session.workspace_id).eq("storage_key", session.storage_key).maybeSingle();
      if (!referenced.data) { try { await this.storage.deleteObject(session.storage_key); } catch { /* cleanup is retryable; never widen deletion scope */ } }
      throw error;
    }
  }
}
