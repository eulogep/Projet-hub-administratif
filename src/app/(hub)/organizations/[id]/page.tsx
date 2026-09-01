import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { cn } from "@/lib/utils";
import { archiveOrganizationAction } from "@/modules/organizations/actions/organization.actions";
import { organizationTypeLabels } from "@/modules/organizations/schemas/organization.schema";
import { getOrganization } from "@/modules/organizations/services/list-organizations";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  const organization = await getOrganization(workspace.id, id);
  if (!organization) notFound();
  const archiveAction = archiveOrganizationAction.bind(null, organization.id);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9">
      <div><Link href="/organizations" className="text-sm font-medium text-primary underline-offset-4 hover:underline">← Organisations</Link><h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{organization.name}</h1></div>
      <Card>
        <CardHeader><CardTitle>Détails</CardTitle><CardDescription>{organization.archived_at ? "Organisation archivée" : "Organisation active"}</CardDescription></CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Nom</dt><dd className="mt-1 font-medium">{organization.name}</dd></div><div><dt className="text-sm text-muted-foreground">Type</dt><dd className="mt-1 font-medium">{organizationTypeLabels[organization.type]}</dd></div></dl>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/organizations/${organization.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}><Pencil aria-hidden="true" className="size-4" /> Modifier</Link>
        {!organization.archived_at ? <form action={archiveAction}><Button type="submit" variant="destructive" className="w-full sm:w-auto"><Archive aria-hidden="true" className="size-4" /> Archiver</Button></form> : null}
      </div>
    </main>
  );
}
