import { createClient } from "@/lib/supabase/server";
import { organizationSchema, type Organization } from "../schemas/organization.schema";

export async function listOrganizations(workspaceId: string): Promise<Organization[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, workspace_id, name, type")
    .eq("workspace_id", workspaceId)
    .order("name");

  if (error) {
    throw new Error("Unable to load organizations.", { cause: error });
  }

  return organizationSchema.array().parse(data);
}
