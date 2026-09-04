import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DocumentRow = { id: string; workspace_id: string; organization_id: string | null; project_id: string | null; mission_id: string | null; name: string; category: string; status: string; issued_on: string | null; expires_on: string | null; notes: string | null; current_version_number: number | null; archived_at: string | null; created_at: string; updated_at: string };
export type DocumentVersionRow = { id: string; version_number: number; original_file_name: string; mime_type: string; size_bytes: number; sha256: string; created_at: string };
export async function listDocuments(workspaceId: string, filters: { archive?: string; organization?: string; project?: string; category?: string; status?: string; expiration?: string } = {}) {
  const supabase = await createClient();
  // Supabase's ungenerated schema type recurses through the two intentional version/session foreign keys.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("documents") as any).select().eq("workspace_id", workspaceId).not("current_version_number", "is", null).order("updated_at", { ascending: false });
  if (filters.archive === "archived") query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  if (filters.organization) query = query.eq("organization_id", filters.organization); if (filters.project) query = query.eq("project_id", filters.project); if (filters.category) query = query.eq("category", filters.category); if (filters.status) query = query.eq("status", filters.status);
  const today = new Date().toISOString().slice(0, 10); if (filters.expiration === "expired") query = query.lt("expires_on", today); if (filters.expiration === "valid") query = query.gte("expires_on", today); if (filters.expiration === "none") query = query.is("expires_on", null);
  const { data, error } = await query; if (error) throw new Error("Unable to load documents.", { cause: error }); return (data ?? []) as DocumentRow[];
}
export async function getDocument(workspaceId: string, documentId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const document = await (supabase.from("documents") as any).select().eq("workspace_id", workspaceId).eq("id", documentId).not("current_version_number", "is", null).maybeSingle();
  if (document.error) throw new Error("Unable to load document.", { cause: document.error }); if (!document.data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versions = await (supabase.from("document_versions") as any).select().eq("workspace_id", workspaceId).eq("document_id", documentId).order("version_number", { ascending: false });
  if (versions.error) throw new Error("Unable to load versions.", { cause: versions.error }); return { ...(document.data as DocumentRow), versions: (versions.data ?? []) as DocumentVersionRow[] };
}
