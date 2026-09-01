import Link from "next/link";
import { Button } from "@/components/ui/button";
import { transitionTaskAction } from "../actions/task.actions";
import { isTaskOverdue, taskStatuses, taskStatusLabels, taskPriorityLabels } from "../schemas/task.schema";
import type { TaskSummary } from "../services/task.service";

export function TaskBoard({ tasks, view = "list" }: { tasks: TaskSummary[]; view?: "list" | "board" }) {
  const today = new Date().toISOString().slice(0, 10);
  if (!tasks.length) return <div className="rounded-xl border border-dashed p-8 text-center"><h2 className="text-lg font-semibold">Aucune tâche</h2><p className="mt-2 text-sm text-muted-foreground">Créez une tâche pour commencer le suivi.</p></div>;
  if (view === "board") return <div className="grid gap-4 xl:grid-cols-5">{taskStatuses.map((status) => <section key={status} aria-labelledby={`column-${status}`} className="min-w-0 rounded-xl border bg-muted/20 p-3"><h2 id={`column-${status}`} className="mb-3 font-semibold">{taskStatusLabels[status]}</h2><ul className="space-y-3">{tasks.filter((task) => task.status === status).map((task) => <TaskCard key={task.id} task={task} today={today} />)}</ul></section>)}</div>;
  return <ul className="space-y-3">{tasks.map((task) => <TaskCard key={task.id} task={task} today={today} />)}</ul>;
}
function TaskCard({ task, today }: { task: TaskSummary; today: string }) {
  return <li className="rounded-xl border bg-card p-4"><Link href={`/tasks/${task.id}`} className="font-semibold text-primary hover:underline">{task.title}</Link><p className="mt-1 text-xs text-muted-foreground">{task.mission?.title ?? "Mission"} · {taskPriorityLabels[task.priority]}{task.due_on ? ` · ${task.due_on}` : ""}</p>{isTaskOverdue(task, today) ? <p className="mt-2 text-sm font-medium text-destructive">En retard</p> : null}<form action={transitionTaskAction.bind(null, task.id)} className="mt-3 flex gap-2"><label className="sr-only" htmlFor={`status-${task.id}`}>Changer le statut de {task.title}</label><select id={`status-${task.id}`} name="status" defaultValue={task.status} className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm">{taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}</select><Button type="submit" size="sm" variant="outline">Mettre à jour</Button></form></li>;
}
