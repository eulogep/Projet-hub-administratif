export default function HubLoading() {
  return (
    <main id="main-content" aria-busy="true" aria-label="Chargement de la page" className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="animate-pulse space-y-7 motion-reduce:animate-none">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-9 w-64 max-w-full rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-xl rounded bg-muted" />
        </div>
        <div className="h-72 rounded-2xl border bg-card shadow-xs" />
      </div>
    </main>
  );
}

