import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createMissionAction } from "@/modules/missions/actions/mission.actions";
import { MissionForm } from "@/modules/missions/components/mission-form";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";
export default async function NewMissionPage() { const workspace = await getActiveWorkspace(); const organizations = await listOrganizations(workspace.id); return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><div><p className="text-sm font-medium text-primary">Missions</p><h1 className="mt-1 text-2xl font-semibold">Nouvelle mission</h1></div><Card><CardHeader><CardTitle>Informations de la mission</CardTitle></CardHeader><CardContent>{organizations.length ? <MissionForm action={createMissionAction} organizations={organizations.map(({ id, name }) => ({ id, name }))} /> : <p role="alert">Créez d’abord une organisation active.</p>}</CardContent></Card></main>; }
