import { createClient } from "@/lib/supabase/server";
import { projectSchema, type Project } from "../schemas/project.schema";

export type ProjectSummary = Project & { organization: { id: string; name: string; archived_at: string | null } | null };
const selection = "id, workspace_id, organization_id, name, description, status, starts_on, target_ends_on, completed_at, archived_at, organization:organizations(id, name, archived_at)";

function parse(row: unknown): ProjectSummary {
  const source = row as Record<string, unknown>;
  return { ...projectSchema.parse(source), organization: source.organization as ProjectSummary["organization"] };
}

export async function listProjects(workspaceId: string, options: { archive?: "active" | "archived"; organizationId?: string; status?: string } = {}) {
  const supabase = await createClient();
  let query = supabase.from("projects").select(selection).eq("workspace_id", workspaceId).order("target_ends_on", { ascending: true, nullsFirst: false }).order("name");
  query = options.archive === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (options.organizationId) query = query.eq("organization_id", options.organizationId);
  if (options.status) query = query.eq("status", options.status);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load projects.", { cause: error });
  return (data ?? []).map(parse);
}

export async function getProject(workspaceId: string, projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select(selection).eq("workspace_id", workspaceId).eq("id", projectId).maybeSingle();
  if (error) throw new Error("Unable to load project.", { cause: error });
  return data ? parse(data) : null;
}
