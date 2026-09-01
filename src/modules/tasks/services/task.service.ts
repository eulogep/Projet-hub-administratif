import { createClient } from "@/lib/supabase/server";
import { taskSchema, type Task } from "../schemas/task.schema";

export type TaskSummary = Task & {
  mission: { id: string; title: string; organization_id: string; organization: { id: string; name: string } | null } | null;
  subtasks?: TaskSummary[];
};
const selection = "id, workspace_id, mission_id, parent_task_id, title, description, status, priority, starts_on, due_on, completed_at, position, archived_at, mission:missions!inner(id, title, organization_id, organization:organizations(id, name))";
function parse(row: unknown): TaskSummary {
  const source = row as Record<string, unknown>;
  return { ...taskSchema.parse(source), mission: source.mission as TaskSummary["mission"] };
}

export async function listTasks(workspaceId: string, filters: { archive?: "active" | "archived"; missionId?: string; organizationId?: string; status?: string; priority?: string } = {}) {
  const supabase = await createClient();
  let query = supabase.from("tasks").select(selection).eq("workspace_id", workspaceId).order("due_on", { ascending: true, nullsFirst: false }).order("position").order("created_at");
  query = filters.archive === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (filters.missionId) query = query.eq("mission_id", filters.missionId);
  if (filters.organizationId) query = query.eq("mission.organization_id", filters.organizationId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load tasks.", { cause: error });
  return (data ?? []).map(parse);
}

export async function getTask(workspaceId: string, taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select(selection).eq("workspace_id", workspaceId).eq("id", taskId).maybeSingle();
  if (error) throw new Error("Unable to load task.", { cause: error });
  return data ? parse(data) : null;
}
