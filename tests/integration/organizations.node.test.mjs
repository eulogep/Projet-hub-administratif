import assert from "node:assert/strict";
import test from "node:test";
import { createTestUser } from "../helpers/node-test-client.mjs";

test("organizations support the approved types, logical archive and active-name reuse", async () => {
  const user = await createTestUser("node-organizations");
  const name = `Demo Organization ${crypto.randomUUID()}`;

  const created = await user.client
    .from("organizations")
    .insert({ workspace_id: user.workspaceId, name, type: "crous" })
    .select("id, name, type, archived_at")
    .single();
  assert.equal(created.error, null);
  assert.equal(created.data.type, "crous");
  assert.equal(created.data.archived_at, null);

  const duplicate = await user.client
    .from("organizations")
    .insert({ workspace_id: user.workspaceId, name: name.toUpperCase(), type: "other" });
  assert.equal(duplicate.error?.code, "23505");

  const archivedAt = new Date().toISOString();
  const archived = await user.client
    .from("organizations")
    .update({ archived_at: archivedAt })
    .eq("id", created.data.id)
    .select("archived_at")
    .single();
  assert.equal(archived.error, null);
  assert.notEqual(archived.data.archived_at, null);

  const replacement = await user.client
    .from("organizations")
    .insert({ workspace_id: user.workspaceId, name, type: "employer" })
    .select("id")
    .single();
  assert.equal(replacement.error, null);
  assert.notEqual(replacement.data.id, created.data.id);

  const active = await user.client
    .from("organizations")
    .select("id")
    .eq("workspace_id", user.workspaceId)
    .is("archived_at", null);
  const archivedRows = await user.client
    .from("organizations")
    .select("id")
    .eq("workspace_id", user.workspaceId)
    .not("archived_at", "is", null);
  assert.deepEqual(active.data, [{ id: replacement.data.id }]);
  assert.deepEqual(archivedRows.data, [{ id: created.data.id }]);
});

test("organization rows remain isolated after archival", async () => {
  const [owner, outsider] = await Promise.all([
    createTestUser("node-organization-owner"),
    createTestUser("node-organization-outsider"),
  ]);
  const created = await owner.client
    .from("organizations")
    .insert({ workspace_id: owner.workspaceId, name: `Demo ${crypto.randomUUID()}`, type: "administration" })
    .select("id")
    .single();
  assert.equal(created.error, null);

  const attemptedArchive = await outsider.client
    .from("organizations")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", created.data.id)
    .select("id");
  assert.equal(attemptedArchive.error, null);
  assert.deepEqual(attemptedArchive.data, []);

  const preserved = await owner.client
    .from("organizations")
    .select("archived_at")
    .eq("id", created.data.id)
    .single();
  assert.equal(preserved.error, null);
  assert.equal(preserved.data.archived_at, null);
});
