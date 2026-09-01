import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { OrganizationList } from "@/modules/organizations/components/organization-list";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";

export default async function HubPage() {
  const workspace = await getActiveWorkspace();
  const organizations = await listOrganizations(workspace.id);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 outline-none sm:px-6 sm:py-9 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Espace protégé</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{workspace.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Votre centre de pilotage personnel, sécurisé et prêt à accueillir vos prochains modules.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
          <span aria-hidden="true" className="size-2 rounded-full bg-success" />
          Fondation opérationnelle
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Organisations</CardTitle>
          <CardDescription>
            Liste minimale destinée à vérifier l’isolation du workspace. Le CRUD sera traité ultérieurement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationList organizations={organizations} />
        </CardContent>
      </Card>
    </main>
  );
}
