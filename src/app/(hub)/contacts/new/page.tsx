import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createContactAction } from "@/modules/contacts/actions/contact.actions";
import { ContactForm } from "@/modules/contacts/components/contact-form";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";

export default async function NewContactPage() {
  const workspace = await getActiveWorkspace();
  const organizations = await listOrganizations(workspace.id);
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><div><p className="text-sm font-medium text-primary">Contacts</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Nouveau contact</h1></div><Card><CardHeader><CardTitle>Informations du contact</CardTitle><CardDescription>Conservez uniquement les informations utiles à votre suivi professionnel.</CardDescription></CardHeader><CardContent><ContactForm action={createContactAction} organizations={organizations.map(({ id, name }) => ({ id, name }))} /></CardContent></Card></main>;
}
