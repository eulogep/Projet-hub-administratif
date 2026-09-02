import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";
import { projectStatuses, projectStatusLabels } from "@/modules/projects/schemas/project.schema";
import { listProjects } from "@/modules/projects/services/project.service";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams; const workspace = await getActiveWorkspace();
  const archive = params.archive === "archived" ? "archived" : "active";
  const organizationId = typeof params.organization === "string" ? params.organization : undefined;
  const status = typeof params.status === "string" && projectStatuses.includes(params.status as never) ? params.status : undefined;
  const [projects, organizations] = await Promise.all([listProjects(workspace.id, { archive, organizationId, status }), listOrganizations(workspace.id)]);
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Travail</p><h1 className="mt-1 text-2xl font-semibold">Projets</h1><p className="mt-1 text-sm text-muted-foreground">Regroupez vos missions par contexte organisationnel.</p></div><Link href="/projects/new" className={buttonVariants()}>Nouveau projet</Link></div>
    <Card><CardHeader><CardTitle>Filtres</CardTitle></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select name="archive" defaultValue={archive} aria-label="État d’archivage" className="h-11 rounded-md border bg-background px-3"><option value="active">Actifs</option><option value="archived">Archivés</option></select><select name="organization" defaultValue={organizationId ?? ""} aria-label="Organisation" className="h-11 rounded-md border bg-background px-3"><option value="">Toutes les organisations</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select><select name="status" defaultValue={status ?? ""} aria-label="Statut du projet" className="h-11 rounded-md border bg-background px-3"><option value="">Tous les statuts</option>{projectStatuses.map((value) => <option key={value} value={value}>{projectStatusLabels[value]}</option>)}</select><button className={buttonVariants({ variant: "outline" })}>Appliquer</button></form></CardContent></Card>
    {projects.length ? <ul className="grid gap-4 md:grid-cols-2">{projects.map((project) => <li key={project.id}><Card className="h-full"><CardHeader><CardTitle><Link href={`/projects/${project.id}`} className="text-primary hover:underline">{project.name}</Link></CardTitle></CardHeader><CardContent><p className="text-sm">{project.organization?.name ?? "Organisation archivée"}</p><p className="text-sm text-muted-foreground">{projectStatusLabels[project.status]}{project.target_ends_on ? ` · cible ${project.target_ends_on}` : ""}</p></CardContent></Card></li>)}</ul> : <div className="rounded-xl border border-dashed p-10 text-center"><h2 className="text-lg font-semibold">Aucun projet</h2><p className="mt-2 text-sm text-muted-foreground">Créez votre premier projet ou modifiez les filtres.</p></div>}
  </main>;
}
