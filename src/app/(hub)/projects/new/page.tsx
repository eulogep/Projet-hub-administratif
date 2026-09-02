import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";
import { createProjectAction } from "@/modules/projects/actions/project.actions";
import { ProjectForm } from "@/modules/projects/components/project-form";
export default async function NewProjectPage() { const workspace = await getActiveWorkspace(); const organizations = await listOrganizations(workspace.id); return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><div><p className="text-sm font-medium text-primary">Projets</p><h1 className="mt-1 text-2xl font-semibold">Nouveau projet</h1></div><Card><CardHeader><CardTitle>Informations du projet</CardTitle></CardHeader><CardContent>{organizations.length ? <ProjectForm action={createProjectAction} organizations={organizations.map(({ id, name }) => ({ id, name }))} /> : <p role="alert">Créez d’abord une organisation active.</p>}</CardContent></Card></main>; }
