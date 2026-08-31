import { createClient } from "@/lib/supabase/server";

export type ActiveWorkspace = {
  id: string;
  name: string;
  owner_user_id: string;
};

export async function getActiveWorkspace(): Promise<ActiveWorkspace> {
  const supabase = await createClient();
  const { data: workspaceId, error: bootstrapError } = await supabase.rpc(
    "bootstrap_personal_workspace",
  );

  if (bootstrapError || typeof workspaceId !== "string") {
    throw new Error("Unable to initialize the personal workspace.", {
      cause: bootstrapError,
    });
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, owner_user_id")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    throw new Error("Unable to load the personal workspace.", {
      cause: workspaceError,
    });
  }

  return workspace;
}
