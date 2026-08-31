import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const separator = line.indexOf("=");
      if (separator <= 0 || line.trimStart().startsWith("#")) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      process.env[key] ??= value;
    }
  } catch {
    // CI provides environment variables directly.
  }
}

export function getTestEnv() {
  loadLocalEnv();
  if (Object.keys(process.env).some((key) => key.includes("SERVICE_ROLE"))) {
    throw new Error("Database tests refuse service-role environment variables.");
  }
  const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_TEST_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key === "replace-with-local-publishable-key") {
    throw new Error("Missing non-privileged Supabase test environment.");
  }
  return { url, key };
}

export async function createTestUser(label) {
  const { url, key } = getTestEnv();
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `${label}-${Date.now()}-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const signUp = await client.auth.signUp({ email, password });
  if (signUp.error) throw signUp.error;
  if (!signUp.data.session) {
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;
  }
  const userResult = await client.auth.getUser();
  if (userResult.error || !userResult.data.user) {
    throw userResult.error ?? new Error("User authentication failed");
  }
  const bootstrap = await client.rpc("bootstrap_personal_workspace");
  if (bootstrap.error || typeof bootstrap.data !== "string") {
    throw bootstrap.error ?? new Error("Workspace bootstrap failed");
  }
  return {
    client,
    email,
    password,
    userId: userResult.data.user.id,
    workspaceId: bootstrap.data,
  };
}
