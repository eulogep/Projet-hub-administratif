"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectActionState } from "../actions/project.actions";
import { projectStatuses, projectStatusLabels, type ProjectInput } from "../schemas/project.schema";

const control = "mt-2 h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export function ProjectForm({ action, project, organizations, cancelHref = "/projects" }: { action: (state: ProjectActionState, formData: FormData) => Promise<ProjectActionState>; project?: ProjectInput; organizations: Array<{ id: string; name: string }>; cancelHref?: string }) {
  const [state, formAction, pending] = useActionState(action, {}); const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { ref.current?.setAttribute("data-hydrated", "true"); }, []);
  return <form ref={ref} action={formAction} data-hydrated="false" className="space-y-6" noValidate>
    <label className="block text-sm font-medium">Organisation<select name="organization_id" defaultValue={project?.organization_id ?? ""} className={control} aria-invalid={Boolean(state.fieldErrors?.organization_id)}><option value="">Sélectionner</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
    <Field label="Nom" name="name" value={project?.name ?? ""} error={state.fieldErrors?.name?.[0]} />
    <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={project?.description ?? ""} maxLength={4000} rows={4} className="mt-2 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /></label>
    <div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm font-medium">Statut<select name="status" defaultValue={project?.status ?? "planned"} className={control}>{projectStatuses.map((status) => <option key={status} value={status}>{projectStatusLabels[status]}</option>)}</select></label><Field label="Date de début" name="starts_on" type="date" value={project?.starts_on ?? ""} /><Field label="Date cible" name="target_ends_on" type="date" value={project?.target_ends_on ?? ""} error={state.fieldErrors?.target_ends_on?.[0]} /></div>
    {state.message ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.message}</p> : null}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Annuler</Link><Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button></div>
  </form>;
}
function Field({ label, name, value, type = "text", error }: { label: string; name: string; value: string; type?: string; error?: string }) { const id = `project-${name}`; return <label htmlFor={id} className="block text-sm font-medium">{label}<input id={id} name={name} type={type} defaultValue={value} className={control} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error ? <span id={`${id}-error`} className="mt-1 block text-sm text-destructive">{error}</span> : null}</label>; }
