import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabaseBrowserEnv();
  return createBrowserClient(url, publishableKey);
}
