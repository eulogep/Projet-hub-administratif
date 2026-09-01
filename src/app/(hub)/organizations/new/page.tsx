import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createOrganizationAction } from "@/modules/organizations/actions/organization.actions";
import { OrganizationForm } from "@/modules/organizations/components/organization-form";

export default function NewOrganizationPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9">
      <div><p className="text-sm font-medium text-primary">Organisations</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Nouvelle organisation</h1></div>
      <Card>
        <CardHeader><CardTitle>Informations générales</CardTitle><CardDescription>Renseignez uniquement les informations nécessaires au contexte organisationnel.</CardDescription></CardHeader>
        <CardContent><OrganizationForm action={createOrganizationAction} /></CardContent>
      </Card>
    </main>
  );
}
