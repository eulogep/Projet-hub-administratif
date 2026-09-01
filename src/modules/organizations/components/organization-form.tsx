"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type OrganizationActionState,
} from "../actions/organization.actions";
import {
  organizationTypeLabels,
  organizationTypes,
  type OrganizationInput,
} from "../schemas/organization.schema";

export function OrganizationForm({
  action,
  organization,
  cancelHref = "/organizations",
}: {
  action: (state: OrganizationActionState, formData: FormData) => Promise<OrganizationActionState>;
  organization?: OrganizationInput;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label htmlFor="organization-name" className="text-sm font-medium">Nom</label>
        <input
          id="organization-name"
          name="name"
          type="text"
          required
          maxLength={160}
          defaultValue={organization?.name}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "organization-name-error" : undefined}
          className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {state.fieldErrors?.name ? (
          <p id="organization-name-error" className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="organization-type" className="text-sm font-medium">Type</label>
        <select
          id="organization-type"
          name="type"
          required
          defaultValue={organization?.type ?? "other"}
          aria-invalid={Boolean(state.fieldErrors?.type)}
          aria-describedby={state.fieldErrors?.type ? "organization-type-error" : undefined}
          className="h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {organizationTypes.map((type) => <option key={type} value={type}>{organizationTypeLabels[type]}</option>)}
        </select>
        {state.fieldErrors?.type ? (
          <p id="organization-type-error" className="text-sm text-destructive">{state.fieldErrors.type[0]}</p>
        ) : null}
      </div>

      {state.message ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.message}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Annuler</Link>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
