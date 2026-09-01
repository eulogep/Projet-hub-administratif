import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { cn } from "@/lib/utils";
import { OrganizationList } from "@/modules/organizations/components/organization-list";
import { organizationStatusSchema } from "@/modules/organizations/schemas/organization.schema";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const rawStatus = (await searchParams).status;
  const parsedStatus = organizationStatusSchema.safeParse(rawStatus);
  const status = parsedStatus.success ? parsedStatus.data : "active";
  const workspace = await getActiveWorkspace();
  const organizations = await listOrganizations(workspace.id, status);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Référentiel</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Organisations</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Gérez les contextes organisationnels de votre workspace personnel.</p>
        </div>
        <Link href="/organizations/new" className={cn(buttonVariants(), "w-full sm:w-auto")}>
          <Plus aria-hidden="true" className="size-4" /> Nouvelle organisation
        </Link>
      </div>

      <nav aria-label="Filtrer les organisations" className="flex gap-2">
        {(["active", "archived"] as const).map((filter) => {
          const active = status === filter;
          return (
            <Link
              key={filter}
              href={filter === "active" ? "/organizations" : "/organizations?status=archived"}
              aria-current={active ? "page" : undefined}
              className={cn(buttonVariants({ variant: active ? "default" : "outline", size: "sm" }))}
            >
              {filter === "active" ? "Actives" : "Archivées"}
            </Link>
          );
        })}
      </nav>

      <Card><CardContent>
        <OrganizationList
          organizations={organizations}
          emptyAction={status === "active" ? <Link href="/organizations/new" className={buttonVariants()}>Créer une organisation</Link> : undefined}
        />
      </CardContent></Card>
    </main>
  );
}
