import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { navigationGroups } from "@/config/navigation";

export default function MorePage() {
  const groups = navigationGroups.filter((group) => group.label !== "Vue d’ensemble");

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-7 outline-none sm:px-6 sm:py-9 lg:px-8">
      <p className="text-sm font-medium text-primary">Navigation</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Plus</h1>
      <div className="mt-7 space-y-6">
        {groups.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <h2 id={`group-${group.label}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </h2>
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="flex min-h-14 items-center gap-3 border-b px-4 outline-none transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
