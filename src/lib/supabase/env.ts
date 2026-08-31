const LOCAL_PLACEHOLDER = "replace-with-local-publishable-key";

export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey || publishableKey === LOCAL_PLACEHOLDER) {
    throw new Error(
      "Missing Supabase public environment. Copy .env.example to .env.local and use the local publishable key.",
    );
  }

  return { url, publishableKey };
}
