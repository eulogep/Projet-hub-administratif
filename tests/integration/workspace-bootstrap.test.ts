import { describe, expect, it } from "vitest";
import { createTestUser } from "../helpers/supabase-user";

describe("personal workspace bootstrap", () => {
  it("is idempotent and creates exactly one profile and workspace", async () => {
    const user = await createTestUser("bootstrap");

    const first = await user.client.rpc("bootstrap_personal_workspace");
    const second = await user.client.rpc("bootstrap_personal_workspace");

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(first.data).toBe(user.workspaceId);
    expect(second.data).toBe(user.workspaceId);

    const profiles = await user.client.from("profiles").select("id", { count: "exact" });
    const workspaces = await user.client.from("workspaces").select("id", { count: "exact" });

    expect(profiles.error).toBeNull();
    expect(profiles.count).toBe(1);
    expect(workspaces.error).toBeNull();
    expect(workspaces.count).toBe(1);
  });
});
