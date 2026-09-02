import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";
import { updateProjectAction } from "@/modules/projects/actions/project.actions";
import { ProjectForm } from "@/modules/projects/components/project-form";
import { getProject } from "@/modules/projects/services/project.service";
export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const workspace = await getActiveWorkspace(); const [project, organizations] = await Promise.all([getProject(workspace.id, id), listOrganizations(workspace.id)]); if (!project) notFound(); const options = organizations.map(({ id, name }) => ({ id, name })); if (project.organization && !options.some((option) => option.id === project.organization_id)) options.push({ id: project.organization_id, name: `${project.organization.name} (archivée)` }); return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><h1 className="text-2xl font-semibold">Modifier le projet</h1><Card><CardHeader><CardTitle>Informations</CardTitle></CardHeader><CardContent><ProjectForm action={updateProjectAction.bind(null, id)} project={project} organizations={options} cancelHref={`/projects/${id}`} /></CardContent></Card></main>; }
