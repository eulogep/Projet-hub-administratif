"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { missionInputSchema } from "../schemas/mission.schema";

export type MissionActionState = { message?: string; fieldErrors?: Record<string, string[] | undefined> };
const values = (formData: FormData) => ({
  organization_id: formData.get("organization_id"), title: formData.get("title"),
  description: formData.get("description"), status: formData.get("status"),
  starts_on: formData.get("starts_on"), target_ends_on: formData.get("target_ends_on"),
});
const errorMessage = (code?: string) => code === "23514" ? "La mission ne peut pas être terminée tant que des tâches restent ouvertes." : "La mission n’a pas pu être enregistrée.";

async function organizationIsAvailable(workspaceId: string, organizationId: string, activeOnly = true) {
  const supabase = await createClient();
  let query = supabase.from("organizations").select("id").eq("workspace_id", workspaceId).eq("id", organizationId);
  if (activeOnly) query = query.is("archived_at", null);
  const result = await query.maybeSingle();
  return !result.error && Boolean(result.data);
}

export async function createMissionAction(_state: MissionActionState, formData: FormData): Promise<MissionActionState> {
  const parsed = missionInputSchema.safeParse(values(formData));
  if (!parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.error.flatten().fieldErrors };
  const workspace = await getActiveWorkspace();
  if (!await organizationIsAvailable(workspace.id, parsed.data.organization_id)) return { message: "Cette organisation est indisponible." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("missions").insert({ workspace_id: workspace.id, ...parsed.data }).select("id").single();
  if (error || !data) return { message: errorMessage(error?.code) };
  revalidatePath("/missions"); revalidatePath("/tasks");
  redirect(`/missions/${data.id}`);
}

export async function updateMissionAction(missionId: string, _state: MissionActionState, formData: FormData): Promise<MissionActionState> {
  const id = z.uuid().safeParse(missionId);
  const parsed = missionInputSchema.safeParse(values(formData));
  if (!id.success || !parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const current = await supabase.from("missions").select("organization_id").eq("workspace_id", workspace.id).eq("id", id.data).maybeSingle();
  if (current.error || !current.data) return { message: "Cette mission est introuvable." };
  const organizationChanged = current.data.organization_id !== parsed.data.organization_id;
  if (!await organizationIsAvailable(workspace.id, parsed.data.organization_id, organizationChanged)) return { message: "Cette organisation est indisponible." };
  const { data, error } = await supabase.from("missions").update(parsed.data).eq("workspace_id", workspace.id).eq("id", id.data).select("id").maybeSingle();
  if (error) return { message: errorMessage(error.code) };
  if (!data) return { message: "Cette mission est introuvable." };
  revalidatePath("/missions"); revalidatePath("/tasks"); revalidatePath(`/missions/${id.data}`);
  redirect(`/missions/${id.data}`);
}

export async function archiveMissionAction(missionId: string) {
  const id = z.uuid().parse(missionId); const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const { data, error } = await supabase.from("missions").update({ archived_at: new Date().toISOString() }).eq("workspace_id", workspace.id).eq("id", id).is("archived_at", null).select("id").maybeSingle();
  if (error || !data) throw new Error("Unable to archive mission.", { cause: error });
  revalidatePath("/missions"); revalidatePath("/tasks"); redirect("/missions?archive=archived");
}
