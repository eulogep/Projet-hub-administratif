"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { organizationCreateSchema, organizationUpdateSchema } from "../schemas/organization.schema";

export type OrganizationActionState = {
  message?: string;
  fieldErrors?: { name?: string[]; type?: string[] };
};

function organizationFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    type: formData.get("type"),
  };
}

function databaseErrorMessage(code?: string) {
  return code === "23505"
    ? "Une organisation active porte déjà ce nom."
    : "L’organisation n’a pas pu être enregistrée. Réessayez.";
}

export async function createOrganizationAction(
  _previousState: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const parsed = organizationCreateSchema.safeParse(organizationFormData(formData));
  if (!parsed.success) {
    return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({ workspace_id: workspace.id, ...parsed.data })
    .select("id")
    .single();

  if (error || !data) {
    return { message: databaseErrorMessage(error?.code) };
  }

  revalidatePath("/");
  revalidatePath("/organizations");
  redirect(`/organizations/${data.id}`);
}

export async function updateOrganizationAction(
  organizationId: string,
  _previousState: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const id = z.uuid().safeParse(organizationId);
  const parsed = organizationUpdateSchema.safeParse(organizationFormData(formData));
  if (!id.success || !parsed.success) {
    return {
      message: "Corrigez les champs indiqués.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("workspace_id", workspace.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { message: databaseErrorMessage(error.code) };
  }
  if (!data) {
    return { message: "Cette organisation est introuvable." };
  }

  revalidatePath("/");
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id.data}`);
  redirect(`/organizations/${id.data}`);
}

export async function archiveOrganizationAction(organizationId: string) {
  const id = z.uuid().parse(organizationId);
  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to archive organization.", { cause: error });
  }
  if (!data) {
    throw new Error("Organization not found.");
  }

  revalidatePath("/");
  revalidatePath("/organizations");
  redirect("/organizations?status=archived");
}
