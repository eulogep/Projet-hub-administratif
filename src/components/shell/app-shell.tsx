import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { DesktopNavigation, MobileNavigation } from "./app-navigation";

export function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="skip-link fixed left-4 top-4 z-50 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg"
      >
        Aller au contenu principal
      </a>

      <aside className="hidden h-dvh flex-col border-r bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex">
        <div className="flex min-h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            PH
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight">Professional Hub</p>
            <p className="text-xs text-sidebar-subtle">Espace personnel</p>
          </div>
        </div>

        <DesktopNavigation />

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-hover text-xs font-semibold">
              {email?.slice(0, 1).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Mon espace</p>
              <p className="truncate text-xs text-sidebar-subtle">{email}</p>
            </div>
            <form action={logout}>
              <Button type="submit" variant="ghostInverse" size="icon" aria-label="Se déconnecter">
                <LogOut aria-hidden="true" className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-background/92 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">PH</div>
            <div>
              <p className="text-sm font-semibold leading-tight">Professional Hub</p>
              <p className="text-xs text-muted-foreground">Espace personnel</p>
            </div>
          </div>

          <button
            type="button"
            disabled
            aria-label="Recherche globale, bientôt disponible"
            className="hidden h-10 w-full max-w-md items-center gap-3 rounded-lg border bg-card px-3 text-left text-sm text-muted-foreground shadow-xs disabled:cursor-not-allowed disabled:opacity-70 lg:flex"
          >
            <Search aria-hidden="true" className="size-4" />
            <span className="flex-1">Rechercher dans le Hub</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.6875rem]">⌘ K</kbd>
          </button>

          <form action={logout} className="lg:hidden">
            <Button type="submit" variant="outline" size="icon" aria-label="Se déconnecter">
              <LogOut aria-hidden="true" className="size-4" />
            </Button>
          </form>
        </header>

        <div className="pb-20 lg:pb-0">{children}</div>
      </div>

      <MobileNavigation />
    </div>
  );
}
