import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/35 px-6 py-10 text-center", className)}>
      <div className="mb-4 grid size-11 place-items-center rounded-xl border bg-card shadow-xs">
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

