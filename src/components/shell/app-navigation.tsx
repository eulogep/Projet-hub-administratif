"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation, navigationGroups, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/more") {
    return pathname === href || pathname.startsWith("/journal") || pathname.startsWith("/settings");
  }
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLink({ item, compact = false }: { item: NavigationItem; compact?: boolean }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        compact
          ? "min-h-14 flex-1 flex-col justify-center gap-1 px-1 py-1 text-[0.6875rem]"
          : "gap-3 px-3 py-2.5",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
      )}
    >
      <Icon aria-hidden="true" className={cn("shrink-0", compact ? "size-5" : "size-4")} />
      <span className={cn(compact && "max-w-full truncate")}>{compact ? (item.shortLabel ?? item.label) : item.label}</span>
    </Link>
  );
}

export function DesktopNavigation() {
  return (
    <nav aria-label="Navigation principale" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-sidebar-subtle">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavigationLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function MobileNavigation() {
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
    >
      {mobileNavigation.map((item) => (
        <NavigationLink key={item.href} item={item} compact />
      ))}
    </nav>
  );
}
