import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { updateMissionAction } from "@/modules/missions/actions/mission.actions";
import { MissionForm } from "@/modules/missions/components/mission-form";
import { getMission } from "@/modules/missions/services/mission.service";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";
export default async function EditMissionPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const workspace = await getActiveWorkspace(); const [mission, organizations] = await Promise.all([getMission(workspace.id, id), listOrganizations(workspace.id)]); if (!mission) notFound(); const options = organizations.map(({ id, name }) => ({ id, name })); if (mission.organization && !options.some((option) => option.id === mission.organization_id)) options.push({ id: mission.organization_id, name: `${mission.organization.name} (archivée)` }); return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><h1 className="text-2xl font-semibold">Modifier la mission</h1><Card><CardHeader><CardTitle>Informations</CardTitle></CardHeader><CardContent><MissionForm action={updateMissionAction.bind(null, id)} mission={mission} organizations={options} cancelHref={`/missions/${id}`} /></CardContent></Card></main>; }
