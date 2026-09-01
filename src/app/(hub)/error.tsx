"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HubError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[65dvh] w-full max-w-3xl items-center px-4 py-10 outline-none sm:px-6">
      <section role="alert" className="w-full rounded-2xl border bg-card p-6 text-center shadow-xs sm:p-10">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Impossible d’afficher cette page</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Une erreur inattendue est survenue. Aucune donnée technique sensible n’est affichée.
        </p>
        <Button type="button" onClick={reset} className="mt-6">
          Réessayer
        </Button>
      </section>
    </main>
  );
}
