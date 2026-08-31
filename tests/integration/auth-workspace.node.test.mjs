import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createTestUser, getTestEnv } from "../helpers/node-test-client.mjs";

test("email/password auth and workspace bootstrap are idempotent", async () => {
  const user = await createTestUser("node-integration");
  const first = await user.client.rpc("bootstrap_personal_workspace");
  const second = await user.client.rpc("bootstrap_personal_workspace");
  assert.equal(first.error, null);
  assert.equal(second.error, null);
  assert.equal(first.data, user.workspaceId);
  assert.equal(second.data, user.workspaceId);

  const profiles = await user.client.from("profiles").select("id", { count: "exact" });
  const workspaces = await user.client.from("workspaces").select("id", { count: "exact" });
  assert.equal(profiles.count, 1);
  assert.equal(workspaces.count, 1);

  assert.equal((await user.client.auth.signOut()).error, null);
  const { url, key } = getTestEnv();
  const freshClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await freshClient.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  assert.equal(signIn.error, null);
  assert.equal(signIn.data.user?.id, user.userId);
});
