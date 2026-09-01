import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { updateContactAction } from "@/modules/contacts/actions/contact.actions";
import { ContactForm } from "@/modules/contacts/components/contact-form";
import { getContact } from "@/modules/contacts/services/contact.service";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const workspace = await getActiveWorkspace();
  const [contact, organizations] = await Promise.all([getContact(workspace.id, id), listOrganizations(workspace.id)]);
  if (!contact) notFound();
  const action = updateContactAction.bind(null, contact.id);
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><div><p className="text-sm font-medium text-primary">Contacts</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Modifier {contact.display_name}</h1></div><Card><CardHeader><CardTitle>Informations du contact</CardTitle><CardDescription>Mettez à jour les coordonnées et rattachements utiles.</CardDescription></CardHeader><CardContent><ContactForm action={action} contact={{ first_name: contact.first_name, last_name: contact.last_name, display_name: contact.display_name, primary_email: contact.primary_email, primary_phone: contact.primary_phone, category: contact.category, notes: contact.notes }} organizations={organizations.map(({ id: organizationId, name }) => ({ id: organizationId, name }))} existingLinks={contact.contact_organizations} cancelHref={`/contacts/${contact.id}`} /></CardContent></Card></main>;
}
