import { config } from "dotenv";

config({ path: ".env.test.local", quiet: true });
config({ path: ".env.local", quiet: true });

export function getTestSupabaseEnv() {
  const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_TEST_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey || publishableKey === "replace-with-local-publishable-key") {
    throw new Error(
      "Missing non-privileged Supabase test environment. Configure .env.test.local or .env.local.",
    );
  }

  if (Object.keys(process.env).some((key) => key.includes("SERVICE_ROLE"))) {
    throw new Error("RLS tests must not run with a service-role environment variable.");
  }

  return { url, publishableKey };
}
