import { createClient } from "@/lib/supabase/server";
import { organizationSchema, type Organization, type OrganizationStatus } from "../schemas/organization.schema";

export type { OrganizationStatus } from "../schemas/organization.schema";

export async function listOrganizations(
  workspaceId: string,
  status: OrganizationStatus = "active",
): Promise<Organization[]> {
  const supabase = await createClient();
  let query = supabase
    .from("organizations")
    .select("id, workspace_id, name, type, archived_at")
    .eq("workspace_id", workspaceId)
    .order("name");

  query = status === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load organizations.", { cause: error });
  }

  return organizationSchema.array().parse(data);
}

export async function getOrganization(
  workspaceId: string,
  organizationId: string,
): Promise<Organization | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, workspace_id, name, type, archived_at")
    .eq("workspace_id", workspaceId)
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load organization.", { cause: error });
  }

  return data ? organizationSchema.parse(data) : null;
}
