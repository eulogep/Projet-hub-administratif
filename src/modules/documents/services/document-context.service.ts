import "server-only";
import { listOrganizations } from "@/modules/organizations/services/list-organizations";
import { listProjects } from "@/modules/projects/services/project.service";
import { listMissions } from "@/modules/missions/services/mission.service";
export async function getDocumentContexts(workspaceId: string) { const [organizations, projects, missions] = await Promise.all([listOrganizations(workspaceId), listProjects(workspaceId), listMissions(workspaceId)]); return { organizations: organizations.map(({ id, name }) => ({ id, name })), projects: projects.map(({ id, name }) => ({ id, name })), missions: missions.map(({ id, title }) => ({ id, title })) }; }
