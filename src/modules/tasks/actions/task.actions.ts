"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { taskInputSchema, taskStatusSchema } from "../schemas/task.schema";

export type TaskActionState = { message?: string; fieldErrors?: Record<string, string[] | undefined> };
const values = (formData: FormData) => ({ mission_id: formData.get("mission_id"), parent_task_id: formData.get("parent_task_id"), title: formData.get("title"), description: formData.get("description"), status: formData.get("status"), priority: formData.get("priority"), starts_on: formData.get("starts_on"), due_on: formData.get("due_on") });
const databaseMessage = (code?: string) => code === "23514" ? "Cette transition est impossible tant que des sous-tâches restent ouvertes." : "La tâche n’a pas pu être enregistrée.";

async function validateContext(workspaceId: string, missionId: string, parentTaskId: string | null) {
  const supabase = await createClient();
  const mission = await supabase.from("missions").select("id").eq("workspace_id", workspaceId).eq("id", missionId).is("archived_at", null).maybeSingle();
  if (mission.error || !mission.data) return false;
  if (!parentTaskId) return true;
  const parent = await supabase.from("tasks").select("id").eq("workspace_id", workspaceId).eq("mission_id", missionId).eq("id", parentTaskId).is("parent_task_id", null).is("archived_at", null).maybeSingle();
  return !parent.error && Boolean(parent.data);
}

export async function createTaskAction(_state: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const parsed = taskInputSchema.safeParse(values(formData));
  if (!parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.error.flatten().fieldErrors };
  const workspace = await getActiveWorkspace();
  if (!await validateContext(workspace.id, parsed.data.mission_id, parsed.data.parent_task_id)) return { message: "La mission ou la tâche parente est indisponible." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").insert({ workspace_id: workspace.id, ...parsed.data }).select("id").single();
  if (error || !data) return { message: databaseMessage(error?.code) };
  revalidatePath("/tasks"); revalidatePath(`/missions/${parsed.data.mission_id}`);
  redirect(`/tasks/${data.id}`);
}

export async function updateTaskAction(taskId: string, _state: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const id = z.uuid().safeParse(taskId); const parsed = taskInputSchema.safeParse(values(formData));
  if (!id.success || !parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  if (parsed.data.parent_task_id === id.data) return { message: "Une tâche ne peut pas être sa propre parente." };
  const workspace = await getActiveWorkspace();
  if (!await validateContext(workspace.id, parsed.data.mission_id, parsed.data.parent_task_id)) return { message: "La mission ou la tâche parente est indisponible." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").update(parsed.data).eq("workspace_id", workspace.id).eq("id", id.data).select("id").maybeSingle();
  if (error) return { message: databaseMessage(error.code) };
  if (!data) return { message: "Cette tâche est introuvable." };
  revalidatePath("/tasks"); revalidatePath(`/tasks/${id.data}`); revalidatePath(`/missions/${parsed.data.mission_id}`);
  redirect(`/tasks/${id.data}`);
}

export async function transitionTaskAction(taskId: string, formData: FormData) {
  const id = z.uuid().parse(taskId); const status = taskStatusSchema.parse(formData.get("status")); const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").update({ status }).eq("workspace_id", workspace.id).eq("id", id).is("archived_at", null).select("id, mission_id").maybeSingle();
  if (error?.code === "23514") redirect("/tasks?error=open-subtasks");
  if (error || !data) throw new Error("Unable to transition task.", { cause: error });
  revalidatePath("/tasks"); revalidatePath(`/tasks/${id}`); revalidatePath(`/missions/${data.mission_id}`);
}

export async function archiveTaskAction(taskId: string) {
  const id = z.uuid().parse(taskId); const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").update({ archived_at: new Date().toISOString() }).eq("workspace_id", workspace.id).eq("id", id).is("archived_at", null).select("mission_id").maybeSingle();
  if (error || !data) throw new Error("Unable to archive task.", { cause: error });
  revalidatePath("/tasks"); revalidatePath(`/missions/${data.mission_id}`); redirect("/tasks?archive=archived");
}
