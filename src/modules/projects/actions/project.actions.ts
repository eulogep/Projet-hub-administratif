"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { projectInputSchema } from "../schemas/project.schema";

export type ProjectActionState = { message?: string; fieldErrors?: Record<string, string[] | undefined> };
const values = (formData: FormData) => ({
  organization_id: formData.get("organization_id"), name: formData.get("name"),
  description: formData.get("description"), status: formData.get("status"),
  starts_on: formData.get("starts_on"), target_ends_on: formData.get("target_ends_on"),
});
const errorMessage = (code?: string) => code === "23505" ? "Un projet actif porte déjà ce nom dans cette organisation." : "Le projet n’a pas pu être enregistré.";

async function organizationIsAvailable(workspaceId: string, organizationId: string, activeOnly = true) {
  const supabase = await createClient();
  let query = supabase.from("organizations").select("id").eq("workspace_id", workspaceId).eq("id", organizationId);
  if (activeOnly) query = query.is("archived_at", null);
  const result = await query.maybeSingle();
  return !result.error && Boolean(result.data);
}

export async function createProjectAction(_state: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const parsed = projectInputSchema.safeParse(values(formData));
  if (!parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.error.flatten().fieldErrors };
  const workspace = await getActiveWorkspace();
  if (!await organizationIsAvailable(workspace.id, parsed.data.organization_id)) return { message: "Cette organisation est indisponible." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").insert({ workspace_id: workspace.id, ...parsed.data }).select("id").single();
  if (error || !data) return { message: errorMessage(error?.code) };
  revalidatePath("/projects"); revalidatePath(`/organizations/${parsed.data.organization_id}`);
  redirect(`/projects/${data.id}`);
}

export async function updateProjectAction(projectId: string, _state: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const id = z.uuid().safeParse(projectId); const parsed = projectInputSchema.safeParse(values(formData));
  if (!id.success || !parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const current = await supabase.from("projects").select("organization_id").eq("workspace_id", workspace.id).eq("id", id.data).maybeSingle();
  if (current.error || !current.data) return { message: "Ce projet est introuvable." };
  const organizationChanged = current.data.organization_id !== parsed.data.organization_id;
  if (!await organizationIsAvailable(workspace.id, parsed.data.organization_id, organizationChanged)) return { message: "Cette organisation est indisponible." };
  const { data, error } = await supabase.from("projects").update(parsed.data).eq("workspace_id", workspace.id).eq("id", id.data).select("id").maybeSingle();
  if (error) return { message: errorMessage(error.code) };
  if (!data) return { message: "Ce projet est introuvable." };
  revalidatePath("/projects"); revalidatePath("/missions"); revalidatePath(`/projects/${id.data}`);
  redirect(`/projects/${id.data}`);
}

export async function archiveProjectAction(projectId: string) {
  const id = z.uuid().parse(projectId); const workspace = await getActiveWorkspace(); const supabase = await createClient();
  const { data, error } = await supabase.from("projects").update({ archived_at: new Date().toISOString() }).eq("workspace_id", workspace.id).eq("id", id).is("archived_at", null).select("id, organization_id").maybeSingle();
  if (error || !data) throw new Error("Unable to archive project.", { cause: error });
  revalidatePath("/projects"); revalidatePath("/missions"); revalidatePath(`/organizations/${data.organization_id}`);
  redirect("/projects?archive=archived");
}
