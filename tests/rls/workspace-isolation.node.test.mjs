import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createTestUser, getTestEnv } from "../helpers/node-test-client.mjs";

test("anonymous clients cannot read identity or workspace tables", async () => {
  const { url, key } = getTestEnv();
  const anonymous = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const table of ["profiles", "workspaces", "organizations"]) {
    const result = await anonymous.from(table).select("*");
    assert.equal(result.error?.code, "42501");
    assert.equal(result.data, null);
  }
});

test("User A and User B are isolated for SELECT, INSERT, UPDATE and DELETE", async () => {
  const [alice, bob] = await Promise.all([
    createTestUser("node-alice"),
    createTestUser("node-bob"),
  ]);

  async function createOrganization(user, name) {
    const result = await user.client
      .from("organizations")
      .insert({ workspace_id: user.workspaceId, name, type: "other" })
      .select("id")
      .single();
    if (result.error) throw result.error;
    return result.data.id;
  }

  const aliceOrganizationId = await createOrganization(alice, "Demo Organization A");
  const bobOrganizationId = await createOrganization(bob, "Demo Organization B");

  async function assertCrossWorkspaceDenied(actor, other, otherOrganizationId) {
    const select = await actor.client
      .from("organizations")
      .select("id")
      .eq("id", otherOrganizationId);
    assert.equal(select.error, null);
    assert.deepEqual(select.data, []);

    const insert = await actor.client.from("organizations").insert({
      workspace_id: other.workspaceId,
      name: `Forbidden ${crypto.randomUUID()}`,
      type: "other",
    });
    assert.notEqual(insert.error, null);

    const update = await actor.client
      .from("organizations")
      .update({ name: `Forbidden update ${crypto.randomUUID()}` })
      .eq("id", otherOrganizationId)
      .select("id");
    assert.equal(update.error, null);
    assert.deepEqual(update.data, []);

    const remove = await actor.client
      .from("organizations")
      .delete()
      .eq("id", otherOrganizationId)
      .select("id");
    assert.equal(remove.error, null);
    assert.deepEqual(remove.data, []);

    const preserved = await other.client
      .from("organizations")
      .select("id")
      .eq("id", otherOrganizationId)
      .single();
    assert.equal(preserved.error, null);
    assert.equal(preserved.data.id, otherOrganizationId);
  }

  await assertCrossWorkspaceDenied(alice, bob, bobOrganizationId);
  await assertCrossWorkspaceDenied(bob, alice, aliceOrganizationId);

  const aliceVisible = await alice.client.from("organizations").select("id");
  const bobVisible = await bob.client.from("organizations").select("id");
  assert.deepEqual(aliceVisible.data, [{ id: aliceOrganizationId }]);
  assert.deepEqual(bobVisible.data, [{ id: bobOrganizationId }]);
});
