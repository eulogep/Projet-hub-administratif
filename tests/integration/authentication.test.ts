import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getTestSupabaseEnv } from "../helpers/test-env";
import { createTestUser } from "../helpers/supabase-user";

describe("email and password authentication", () => {
  it("signs out and signs back in using a publishable client", async () => {
    const user = await createTestUser("auth");
    expect((await user.client.auth.getUser()).data.user?.id).toBe(user.userId);

    expect((await user.client.auth.signOut()).error).toBeNull();
    expect((await user.client.auth.getSession()).data.session).toBeNull();

    const { url, publishableKey } = getTestSupabaseEnv();
    const freshClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signIn = await freshClient.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    expect(signIn.error).toBeNull();
    expect(signIn.data.user?.id).toBe(user.userId);
  });
});
