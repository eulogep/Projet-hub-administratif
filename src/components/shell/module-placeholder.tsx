import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-7 outline-none sm:px-6 sm:py-9 lg:px-8">
      <div className="mb-7">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      <EmptyState icon={icon} title={`${title} — bientôt disponible`} description={description} />
    </main>
  );
}
