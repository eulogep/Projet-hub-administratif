import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { organizationTypeLabels, type Organization } from "../schemas/organization.schema";

export function OrganizationList({
  organizations,
  emptyAction,
}: {
  organizations: Organization[];
  emptyAction?: React.ReactNode;
}) {
  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aucune organisation"
        description="Aucune organisation ne correspond à ce filtre."
        action={emptyAction}
        className="min-h-48"
      />
    );
  }

  return (
    <ul className="grid gap-3" aria-label="Organisations">
      {organizations.map((organization) => (
        <li key={organization.id}>
          <Link
            href={`/organizations/${organization.id}`}
            className="group flex min-h-16 items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3 shadow-xs outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{organization.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {organizationTypeLabels[organization.type]}
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
