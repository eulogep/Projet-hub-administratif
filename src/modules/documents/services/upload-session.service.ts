import "server-only";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { getR2Config } from "@/integrations/storage/r2/config";
import { createDocumentObjectKey } from "@/integrations/storage/r2/object-key";
import { getDocumentMaxFileSizeBytes } from "../policy";
import { uploadRequestSchema } from "../schemas/document.schema";

export type UploadSession = { id: string; workspace_id: string; document_id: string; upload_id: string | null; storage_bucket: string; storage_key: string; original_file_name: string; expected_size: number; expected_mime: string; state: string; expires_at: string; completed_version_id: string | null };

function displayFilename(value: string) { return value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255) || "document"; }

export async function createUploadSession(input: unknown) {
  const parsed = uploadRequestSchema.parse(input);
  if (parsed.expected_size > getDocumentMaxFileSizeBytes()) throw new Error("DOCUMENT_FILE_TOO_LARGE");
  const config = getR2Config();
  const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const metadata = { name: parsed.name, category: parsed.category, status: parsed.status, organization_id: parsed.organization_id, project_id: parsed.project_id, mission_id: parsed.mission_id, issued_on: parsed.issued_on, expires_on: parsed.expires_on, notes: parsed.notes };
  let documentId = parsed.document_id;
  if (documentId) {
    const { data, error } = await supabase.from("documents").select("id, archived_at").eq("workspace_id", workspace.id).eq("id", documentId).maybeSingle();
    if (error || !data || data.archived_at) throw new Error("DOCUMENT_NOT_AVAILABLE");
    const update = await supabase.from("documents").update(metadata).eq("workspace_id", workspace.id).eq("id", documentId).select("id").single();
    if (update.error) throw new Error("DOCUMENT_METADATA_INVALID", { cause: update.error });
  } else {
    const created = await supabase.from("documents").insert({ workspace_id: workspace.id, ...metadata }).select("id").single();
    if (created.error || !created.data) throw new Error("DOCUMENT_METADATA_INVALID", { cause: created.error });
    documentId = created.data.id;
  }
  if (!documentId) throw new Error("DOCUMENT_CREATE_FAILED");
  const storageKey = createDocumentObjectKey(workspace.id, documentId, parsed.expected_mime);
  const session = await supabase.from("document_upload_sessions").insert({ workspace_id: workspace.id, document_id: documentId, storage_bucket: config.bucket, storage_key: storageKey, original_file_name: displayFilename(parsed.original_file_name), expected_size: parsed.expected_size, expected_mime: parsed.expected_mime, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }).select("id, workspace_id, document_id, upload_id, storage_bucket, storage_key, original_file_name, expected_size, expected_mime, state, expires_at, completed_version_id").single();
  if (session.error || !session.data) throw new Error("UPLOAD_SESSION_CREATE_FAILED", { cause: session.error });
  return session.data as UploadSession;
}

export async function loadOwnedUploadSession(sessionId: string) {
  const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const { data, error } = await supabase.from("document_upload_sessions").select("id, workspace_id, document_id, upload_id, storage_bucket, storage_key, original_file_name, expected_size, expected_mime, state, expires_at, completed_version_id").eq("workspace_id", workspace.id).eq("id", sessionId).maybeSingle();
  if (error || !data) throw new Error("UPLOAD_SESSION_NOT_FOUND");
  const session = data as UploadSession; const config = getR2Config();
  const extension = session.expected_mime === "application/pdf" ? "pdf" : session.expected_mime === "image/png" ? "png" : "jpg";
  const exactScope = new RegExp(`^${session.workspace_id}/${session.document_id}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${extension}$`);
  if (session.storage_bucket !== config.bucket || !exactScope.test(session.storage_key)) throw new Error("UPLOAD_SESSION_STORAGE_SCOPE_INVALID");
  return { supabase, session };
}
