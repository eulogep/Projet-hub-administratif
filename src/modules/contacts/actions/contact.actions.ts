"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import {
  contactCreateSchema,
  contactInteractionCreateSchema,
  contactOrganizationLinkSchema,
  contactUpdateSchema,
  deriveDisplayName,
  type ContactInput,
  type ContactOrganizationLinkInput,
} from "../schemas/contact.schema";
import { findDuplicateContacts } from "../services/contact.service";

export type ContactActionState = {
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  duplicates?: Array<{ id: string; display_name: string; primary_email: string | null }>;
  submitted?: {
    contact: ContactInput;
    links: ContactOrganizationLinkInput[];
  };
};

function contactFormData(formData: FormData) {
  return {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    display_name: formData.get("display_name"),
    primary_email: formData.get("primary_email"),
    primary_phone: formData.get("primary_phone"),
    category: formData.get("category"),
    notes: formData.get("notes"),
  };
}

function nullableFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function parseAndValidateLinks(formData: FormData, workspaceId: string) {
  const organizationIds = [...new Set(formData.getAll("organization_ids").filter((value): value is string => typeof value === "string"))];
  const ids = z.uuid().array().max(50).safeParse(organizationIds);
  const primaryId = nullableFormValue(formData, "primary_organization_id");
  if (!ids.success || (primaryId && !organizationIds.includes(primaryId))) {
    return { error: "Les rattachements sélectionnés sont invalides." } as const;
  }

  const supabase = await createClient();
  if (organizationIds.length) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .in("id", organizationIds);
    if (error || data?.length !== organizationIds.length) {
      return { error: "Une organisation sélectionnée est indisponible." } as const;
    }
  }

  const links: ContactOrganizationLinkInput[] = [];
  for (const organizationId of organizationIds) {
    const parsed = contactOrganizationLinkSchema.safeParse({
      organization_id: organizationId,
      job_title: formData.get(`job_title_${organizationId}`),
      role_label: formData.get(`role_label_${organizationId}`),
      is_primary: primaryId === organizationId,
    });
    if (!parsed.success) return { error: "Corrigez les informations de rattachement." } as const;
    links.push(parsed.data);
  }
  return { links } as const;
}

async function replaceLinks(
  contactId: string,
  workspaceId: string,
  links: ContactOrganizationLinkInput[],
) {
  const supabase = await createClient();
  const removed = await supabase
    .from("contact_organizations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("contact_id", contactId);
  if (removed.error) return removed.error;
  if (!links.length) return null;
  const inserted = await supabase.from("contact_organizations").insert(
    links.map((link) => ({ workspace_id: workspaceId, contact_id: contactId, ...link })),
  );
  return inserted.error;
}

export async function createContactAction(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactCreateSchema.safeParse(contactFormData(formData));
  if (!parsed.success) {
    return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const workspace = await getActiveWorkspace();
  const linkResult = await parseAndValidateLinks(formData, workspace.id);
  if ("error" in linkResult) return { message: linkResult.error };

  const displayName = deriveDisplayName(parsed.data);
  const duplicates = await findDuplicateContacts(workspace.id, displayName, parsed.data.primary_email);
  if (duplicates.length && formData.get("confirm_duplicates") !== "yes") {
    return {
      message: "Des contacts similaires existent déjà. Vérifiez-les avant de confirmer.",
      duplicates,
      submitted: { contact: parsed.data, links: linkResult.links },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({ workspace_id: workspace.id, ...parsed.data, display_name: displayName })
    .select("id")
    .single();
  if (error || !data) return { message: "Le contact n’a pas pu être enregistré. Réessayez." };

  const linkError = await replaceLinks(data.id, workspace.id, linkResult.links);
  if (linkError) {
    await supabase.from("contacts").delete().eq("workspace_id", workspace.id).eq("id", data.id);
    return { message: "Les rattachements n’ont pas pu être enregistrés." };
  }

  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}`);
}

export async function updateContactAction(
  contactId: string,
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const id = z.uuid().safeParse(contactId);
  const parsed = contactUpdateSchema.safeParse(contactFormData(formData));
  if (!id.success || !parsed.success) {
    return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  }
  const workspace = await getActiveWorkspace();
  const linkResult = await parseAndValidateLinks(formData, workspace.id);
  if ("error" in linkResult) return { message: linkResult.error };
  const displayName = deriveDisplayName(parsed.data);
  const duplicates = await findDuplicateContacts(workspace.id, displayName, parsed.data.primary_email, id.data);
  if (duplicates.length && formData.get("confirm_duplicates") !== "yes") {
    return {
      message: "Des contacts similaires existent déjà. Vérifiez-les avant de confirmer.",
      duplicates,
      submitted: { contact: parsed.data, links: linkResult.links },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update({ ...parsed.data, display_name: displayName })
    .eq("workspace_id", workspace.id)
    .eq("id", id.data)
    .select("id")
    .maybeSingle();
  if (error) return { message: "Le contact n’a pas pu être enregistré. Réessayez." };
  if (!data) return { message: "Ce contact est introuvable." };

  const linkError = await replaceLinks(id.data, workspace.id, linkResult.links);
  if (linkError) return { message: "Les rattachements n’ont pas pu être enregistrés." };

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id.data}`);
  redirect(`/contacts/${id.data}`);
}

export async function archiveContactAction(contactId: string) {
  const id = z.uuid().parse(contactId);
  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id)
    .eq("id", id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("Unable to archive contact.", { cause: error });
  revalidatePath("/contacts");
  redirect("/contacts?status=archived");
}

export async function createInteractionAction(
  contactId: string,
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const id = z.uuid().safeParse(contactId);
  const parsed = contactInteractionCreateSchema.safeParse({
    kind: formData.get("kind"),
    summary: formData.get("summary"),
    occurred_at: formData.get("occurred_at"),
    organization_id: formData.get("organization_id"),
    follow_up_label: formData.get("follow_up_label"),
    follow_up_on: formData.get("follow_up_on"),
  });
  if (!id.success || !parsed.success) {
    return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  }
  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const contact = await supabase.from("contacts").select("id").eq("workspace_id", workspace.id).eq("id", id.data).maybeSingle();
  if (contact.error || !contact.data) return { message: "Ce contact est introuvable." };
  if (parsed.data.organization_id) {
    const organization = await supabase.from("organizations").select("id").eq("workspace_id", workspace.id).eq("id", parsed.data.organization_id).maybeSingle();
    if (organization.error || !organization.data) return { message: "Cette organisation est indisponible." };
  }

  const occurredAt = new Date(parsed.data.occurred_at).toISOString();
  const { error } = await supabase.from("contact_interactions").insert({
    workspace_id: workspace.id,
    contact_id: id.data,
    ...parsed.data,
    occurred_at: occurredAt,
  });
  if (error) return { message: "L’interaction n’a pas pu être enregistrée." };
  revalidatePath(`/contacts/${id.data}`);
  redirect(`/contacts/${id.data}`);
}

export async function completeFollowUpAction(contactId: string, interactionId: string) {
  const ids = z.object({ contactId: z.uuid(), interactionId: z.uuid() }).parse({ contactId, interactionId });
  const workspace = await getActiveWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_interactions")
    .update({ follow_up_completed_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id)
    .eq("contact_id", ids.contactId)
    .eq("id", ids.interactionId)
    .is("follow_up_completed_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("Unable to complete follow-up.", { cause: error });
  revalidatePath(`/contacts/${ids.contactId}`);
}
