import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getTestSupabaseEnv } from "./test-env";

export type TestUser = {
  client: SupabaseClient;
  email: string;
  password: string;
  userId: string;
  workspaceId: string;
};

export async function createTestUser(label: string): Promise<TestUser> {
  const { url, publishableKey } = getTestSupabaseEnv();
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const nonce = `${Date.now()}-${crypto.randomUUID()}`;
  const email = `${label}-${nonce}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });
  if (signUpError) throw signUpError;

  if (!signUpData.session) {
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Test user not authenticated");

  const { data: workspaceId, error: bootstrapError } = await client.rpc(
    "bootstrap_personal_workspace",
  );
  if (bootstrapError || typeof workspaceId !== "string") {
    throw bootstrapError ?? new Error("Workspace bootstrap failed");
  }

  return {
    client,
    email,
    password,
    userId: userData.user.id,
    workspaceId,
  };
}
