import { NextResponse } from "next/server";
import { R2DocumentStorageProvider } from "@/integrations/storage/r2/provider";
import { loadOwnedUploadSession } from "@/modules/documents/services/upload-session.service";

export const runtime = "nodejs";
export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try { const { sessionId } = await params; const { supabase, session } = await loadOwnedUploadSession(sessionId); if (session.upload_id) await new R2DocumentStorageProvider().abortMultipartUpload(session.storage_key, session.upload_id); await supabase.from("document_upload_sessions").update({ state: "aborted" }).eq("workspace_id", session.workspace_id).eq("id", session.id); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "UPLOAD_ABORT_FAILED" }, { status: 400 }); }
}
