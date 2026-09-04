import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { R2DocumentStorageProvider } from "@/integrations/storage/r2/provider";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try { const { id, versionId } = await params; const workspace = await getActiveWorkspace(); const supabase = await createClient(); const result = await supabase.from("document_versions").select("storage_key, original_file_name").eq("workspace_id", workspace.id).eq("document_id", id).eq("id", versionId).maybeSingle(); if (result.error || !result.data) return new NextResponse("Not found", { status: 404 }); const url = await new R2DocumentStorageProvider().createDownloadUrl(result.data.storage_key, result.data.original_file_name); return NextResponse.redirect(url, { status: 303, headers: { "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" } }); }
  catch { return new NextResponse("Download unavailable", { status: 503 }); }
}
