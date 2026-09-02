import { createClient } from "@/lib/supabase/server";
import { missionSchema, type Mission } from "../schemas/mission.schema";

export type MissionSummary = Mission & { organization: { id: string; name: string; archived_at: string | null } | null; project: { id: string; name: string; archived_at: string | null } | null };
const selection = "id, workspace_id, organization_id, project_id, title, description, status, starts_on, target_ends_on, completed_at, archived_at, organization:organizations(id, name, archived_at), project:projects(id, name, archived_at)";

function parse(row: unknown): MissionSummary {
  const source = row as Record<string, unknown>;
  return { ...missionSchema.parse(source), organization: source.organization as MissionSummary["organization"], project: source.project as MissionSummary["project"] };
}

export async function listMissions(workspaceId: string, archive: "active" | "archived" = "active", organizationId?: string, status?: string, projectId?: string) {
  const supabase = await createClient();
  let query = supabase.from("missions").select(selection).eq("workspace_id", workspaceId).order("target_ends_on", { ascending: true, nullsFirst: false }).order("title");
  query = archive === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (organizationId) query = query.eq("organization_id", organizationId);
  if (status) query = query.eq("status", status);
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load missions.", { cause: error });
  return (data ?? []).map(parse);
}

export async function getMission(workspaceId: string, missionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("missions").select(selection).eq("workspace_id", workspaceId).eq("id", missionId).maybeSingle();
  if (error) throw new Error("Unable to load mission.", { cause: error });
  return data ? parse(data) : null;
}
