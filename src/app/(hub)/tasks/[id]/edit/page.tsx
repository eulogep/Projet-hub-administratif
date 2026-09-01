import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { listMissions } from "@/modules/missions/services/mission.service";
import { updateTaskAction } from "@/modules/tasks/actions/task.actions";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { getTask, listTasks } from "@/modules/tasks/services/task.service";
export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const workspace = await getActiveWorkspace(); const [task, missions, tasks] = await Promise.all([getTask(workspace.id, id), listMissions(workspace.id), listTasks(workspace.id)]); if (!task) notFound(); return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><h1 className="text-2xl font-semibold">Modifier la tâche</h1><Card><CardHeader><CardTitle>Informations</CardTitle></CardHeader><CardContent><TaskForm action={updateTaskAction.bind(null, id)} task={task} missions={missions.map(({ id, title }) => ({ id, title }))} parents={tasks.filter((candidate) => !candidate.parent_task_id && candidate.id !== id).map(({ id, title, mission_id }) => ({ id, title, mission_id }))} cancelHref={`/tasks/${id}`} /></CardContent></Card></main>; }
