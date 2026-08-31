import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Organization } from "../schemas/organization.schema";

export function OrganizationList({ organizations }: { organizations: Organization[] }) {
  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aucune organisation"
        description="Les organisations seront ajoutées manuellement lors du prochain ticket, sans donnée personnelle dans les seeds."
        className="min-h-48"
      />
    );
  }

  return (
    <ul className="divide-y rounded-lg border" aria-label="Organisations">
      {organizations.map((organization) => (
        <li key={organization.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="font-medium">{organization.name}</span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {organization.type.replace("_", " ")}
          </span>
        </li>
      ))}
    </ul>
  );
}
