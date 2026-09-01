import { createClient } from "@/lib/supabase/server";
import {
  contactInteractionSchema,
  contactSchema,
  normalizeContactSearch,
  type Contact,
  type ContactInteraction,
  type ContactStatus,
} from "../schemas/contact.schema";

export type ContactOrganizationLink = {
  organization_id: string;
  job_title: string | null;
  role_label: string | null;
  is_primary: boolean;
  organization: { id: string; name: string; type: string; archived_at: string | null } | null;
};

export type ContactSummary = Contact & { contact_organizations: ContactOrganizationLink[] };
export type ContactDetail = ContactSummary & { interactions: ContactInteraction[] };

const contactSelection = `
  id, workspace_id, first_name, last_name, display_name, primary_email, primary_phone,
  category, notes, archived_at,
  contact_organizations (
    organization_id, job_title, role_label, is_primary,
    organization:organizations (id, name, type, archived_at)
  )
`;

function parseContactSummary(row: unknown): ContactSummary {
  const source = row as Record<string, unknown>;
  return {
    ...contactSchema.parse(source),
    contact_organizations: (source.contact_organizations ?? []) as ContactOrganizationLink[],
  };
}

export async function listContacts(
  workspaceId: string,
  status: ContactStatus = "active",
  search = "",
): Promise<ContactSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select(contactSelection)
    .eq("workspace_id", workspaceId)
    .order("search_name");

  query = status === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const safeSearch = normalizeContactSearch(search).replace(/[%_,()]/g, "");
  if (safeSearch) {
    query = query.or(`search_name.ilike.%${safeSearch}%,primary_email.ilike.%${safeSearch}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("Unable to load contacts.", { cause: error });
  return (data ?? []).map(parseContactSummary);
}

export async function getContact(workspaceId: string, contactId: string): Promise<ContactDetail | null> {
  const supabase = await createClient();
  const contactResult = await supabase
    .from("contacts")
    .select(contactSelection)
    .eq("workspace_id", workspaceId)
    .eq("id", contactId)
    .maybeSingle();
  if (contactResult.error) throw new Error("Unable to load contact.", { cause: contactResult.error });
  if (!contactResult.data) return null;

  const interactionResult = await supabase
    .from("contact_interactions")
    .select("id, workspace_id, contact_id, organization_id, kind, summary, occurred_at, follow_up_label, follow_up_on, follow_up_completed_at")
    .eq("workspace_id", workspaceId)
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false });
  if (interactionResult.error) throw new Error("Unable to load contact timeline.", { cause: interactionResult.error });

  return {
    ...parseContactSummary(contactResult.data),
    interactions: contactInteractionSchema.array().parse(interactionResult.data),
  };
}

export async function findDuplicateContacts(
  workspaceId: string,
  displayName: string,
  email: string | null,
  excludeId?: string,
) {
  const supabase = await createClient();
  const normalizedName = normalizeContactSearch(displayName).replace(/[%_,()]/g, "");
  const filters = [`search_name.eq.${normalizedName}`];
  if (email) filters.push(`primary_email.eq.${email}`);
  let query = supabase
    .from("contacts")
    .select("id, display_name, primary_email")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .or(filters.join(","))
    .limit(5);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error("Unable to check contact duplicates.", { cause: error });
  return data ?? [];
}
