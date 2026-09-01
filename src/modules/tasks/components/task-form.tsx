"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskActionState } from "../actions/task.actions";
import { taskPriorities, taskPriorityLabels, taskStatuses, taskStatusLabels, type TaskInput } from "../schemas/task.schema";

const control = "mt-2 h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export function TaskForm({ action, task, missions, parents, cancelHref = "/tasks" }: { action: (state: TaskActionState, formData: FormData) => Promise<TaskActionState>; task?: TaskInput; missions: Array<{ id: string; title: string }>; parents: Array<{ id: string; title: string; mission_id: string }>; cancelHref?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { formRef.current?.setAttribute("data-hydrated", "true"); }, []);
  const missionId = task?.mission_id ?? "";
  return <form ref={formRef} action={formAction} className="space-y-6" data-hydrated="false" noValidate>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">Mission<select name="mission_id" defaultValue={missionId} className={control}><option value="">Sélectionner</option>{missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.title}</option>)}</select></label>
      <label className="block text-sm font-medium">Tâche parente<select name="parent_task_id" defaultValue={task?.parent_task_id ?? ""} className={control}><option value="">Aucune</option>{parents.filter((parent) => !missionId || parent.mission_id === missionId).map((parent) => <option key={parent.id} value={parent.id}>{parent.title}</option>)}</select></label>
    </div>
    <Field label="Titre" name="title" defaultValue={task?.title ?? ""} error={state.fieldErrors?.title?.[0]} />
    <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={task?.description ?? ""} maxLength={4000} rows={4} className="mt-2 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /></label>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-sm font-medium">Statut<select name="status" defaultValue={task?.status ?? "todo"} className={control}>{taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}</select></label>
      <label className="block text-sm font-medium">Priorité<select name="priority" defaultValue={task?.priority ?? "medium"} className={control}>{taskPriorities.map((priority) => <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>)}</select></label>
      <Field label="Date de début" name="starts_on" type="date" defaultValue={task?.starts_on ?? ""} />
      <Field label="Échéance" name="due_on" type="date" defaultValue={task?.due_on ?? ""} error={state.fieldErrors?.due_on?.[0]} />
    </div>
    {state.message ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.message}</p> : null}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Annuler</Link><Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "Enregistrement…" : "Enregistrer"}</Button></div>
  </form>;
}
function Field({ label, name, type = "text", defaultValue, error }: { label: string; name: string; type?: string; defaultValue: string; error?: string }) { const id = `task-${name}`; return <label htmlFor={id} className="block text-sm font-medium">{label}<input id={id} name={name} type={type} defaultValue={defaultValue} className={control} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error ? <span id={`${id}-error`} className="mt-1 block text-sm text-destructive">{error}</span> : null}</label>; }
