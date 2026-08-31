import { beforeAll, describe, expect, it } from "vitest";
import { createTestUser, type TestUser } from "../helpers/supabase-user";

describe("workspace RLS isolation with non-privileged clients", () => {
  let alice: TestUser;
  let bob: TestUser;
  let aliceOrganizationId: string;
  let bobOrganizationId: string;

  beforeAll(async () => {
    [alice, bob] = await Promise.all([createTestUser("alice"), createTestUser("bob")]);

    const aliceInsert = await alice.client
      .from("organizations")
      .insert({
        workspace_id: alice.workspaceId,
        name: "Demo Organization A",
        type: "company",
      })
      .select("id")
      .single();
    const bobInsert = await bob.client
      .from("organizations")
      .insert({
        workspace_id: bob.workspaceId,
        name: "Demo Organization B",
        type: "public_service",
      })
      .select("id")
      .single();

    if (aliceInsert.error || !aliceInsert.data) throw aliceInsert.error;
    if (bobInsert.error || !bobInsert.data) throw bobInsert.error;
    aliceOrganizationId = aliceInsert.data.id;
    bobOrganizationId = bobInsert.data.id;
  });

  it("allows each user to read only their own profile, workspace and organization", async () => {
    const aliceWorkspaces = await alice.client.from("workspaces").select("id, owner_user_id");
    const bobWorkspaces = await bob.client.from("workspaces").select("id, owner_user_id");
    const aliceProfiles = await alice.client.from("profiles").select("user_id");
    const bobProfiles = await bob.client.from("profiles").select("user_id");
    const aliceOrganizations = await alice.client.from("organizations").select("id, workspace_id");
    const bobOrganizations = await bob.client.from("organizations").select("id, workspace_id");

    expect(aliceWorkspaces.data).toEqual([{ id: alice.workspaceId, owner_user_id: alice.userId }]);
    expect(bobWorkspaces.data).toEqual([{ id: bob.workspaceId, owner_user_id: bob.userId }]);
    expect(aliceProfiles.data).toEqual([{ user_id: alice.userId }]);
    expect(bobProfiles.data).toEqual([{ user_id: bob.userId }]);
    expect(aliceOrganizations.data).toEqual([
      { id: aliceOrganizationId, workspace_id: alice.workspaceId },
    ]);
    expect(bobOrganizations.data).toEqual([
      { id: bobOrganizationId, workspace_id: bob.workspaceId },
    ]);
  });

  it.each([
    ["Alice", () => alice, () => bob, () => bobOrganizationId],
    ["Bob", () => bob, () => alice, () => aliceOrganizationId],
  ])("denies %s SELECT, INSERT, UPDATE and DELETE against the other workspace", async (_name, actorRef, otherRef, otherOrganizationRef) => {
    const actor = actorRef();
    const other = otherRef();
    const otherOrganizationId = otherOrganizationRef();

    const select = await actor.client
      .from("organizations")
      .select("id")
      .eq("id", otherOrganizationId);
    expect(select.error).toBeNull();
    expect(select.data).toEqual([]);

    const insert = await actor.client.from("organizations").insert({
      workspace_id: other.workspaceId,
      name: `Forbidden ${crypto.randomUUID()}`,
      type: "other",
    });
    expect(insert.error).not.toBeNull();

    const update = await actor.client
      .from("organizations")
      .update({ name: `Forbidden update ${crypto.randomUUID()}` })
      .eq("id", otherOrganizationId)
      .select("id");
    expect(update.error).toBeNull();
    expect(update.data).toEqual([]);

    const remove = await actor.client
      .from("organizations")
      .delete()
      .eq("id", otherOrganizationId)
      .select("id");
    expect(remove.error).toBeNull();
    expect(remove.data).toEqual([]);

    const ownStillExists = await other.client
      .from("organizations")
      .select("id, name")
      .eq("id", otherOrganizationId)
      .single();
    expect(ownStillExists.error).toBeNull();
    expect(ownStillExists.data?.id).toBe(otherOrganizationId);
  });
});
