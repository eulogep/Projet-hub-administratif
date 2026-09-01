import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { updateOrganizationAction } from "@/modules/organizations/actions/organization.actions";
import { OrganizationForm } from "@/modules/organizations/components/organization-form";
import { getOrganization } from "@/modules/organizations/services/list-organizations";

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  const organization = await getOrganization(workspace.id, id);
  if (!organization) notFound();
  const updateAction = updateOrganizationAction.bind(null, organization.id);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9">
      <div><p className="text-sm font-medium text-primary">Organisations</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Modifier {organization.name}</h1></div>
      <Card>
        <CardHeader><CardTitle>Informations générales</CardTitle><CardDescription>Mettez à jour le nom ou le type de l’organisation.</CardDescription></CardHeader>
        <CardContent><OrganizationForm action={updateAction} organization={{ name: organization.name, type: organization.type }} cancelHref={`/organizations/${organization.id}`} /></CardContent>
      </Card>
    </main>
  );
}
