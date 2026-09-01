import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createTestUser, getTestEnv } from "../helpers/node-test-client.mjs";

test("anonymous clients cannot read contact tables", async () => {
  const { url, key } = getTestEnv();
  const anonymous = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const table of ["contacts", "contact_organizations", "contact_interactions"]) {
    const result = await anonymous.from(table).select("*");
    assert.equal(result.error?.code, "42501");
    assert.equal(result.data, null);
  }
});

test("contacts support accent search, organization links, timeline and follow-up", async () => {
  const user = await createTestUser("node-contacts");
  const organization = await user.client.from("organizations").insert({ workspace_id: user.workspaceId, name: `Demo Organization ${crypto.randomUUID()}`, type: "other" }).select("id").single();
  assert.equal(organization.error, null);
  const secondOrganization = await user.client.from("organizations").insert({ workspace_id: user.workspaceId, name: `Second Organization ${crypto.randomUUID()}`, type: "other" }).select("id").single();
  assert.equal(secondOrganization.error, null);
  const contact = await user.client.from("contacts").insert({
    workspace_id: user.workspaceId,
    first_name: "Élodie",
    last_name: "Exemple",
    display_name: "Élodie Exemple",
    primary_email: `contact-${crypto.randomUUID()}@example.test`,
  }).select("id, search_name").single();
  assert.equal(contact.error, null);
  assert.equal(contact.data.search_name, "elodie exemple");

  const link = await user.client.from("contact_organizations").insert({ workspace_id: user.workspaceId, contact_id: contact.data.id, organization_id: organization.data.id, is_primary: true, role_label: "Synthetic role" });
  assert.equal(link.error, null);
  const secondPrimary = await user.client.from("contact_organizations").insert({ workspace_id: user.workspaceId, contact_id: contact.data.id, organization_id: secondOrganization.data.id, is_primary: true });
  assert.equal(secondPrimary.error?.code, "23505");

  const interaction = await user.client.from("contact_interactions").insert({
    workspace_id: user.workspaceId,
    contact_id: contact.data.id,
    organization_id: organization.data.id,
    kind: "meeting",
    summary: "Synthetic meeting summary",
    occurred_at: "2026-09-01T10:00:00Z",
    follow_up_label: "Synthetic next action",
    follow_up_on: "2026-09-03",
  }).select("id").single();
  assert.equal(interaction.error, null);
  const invalidFollowUp = await user.client.from("contact_interactions").insert({ workspace_id: user.workspaceId, contact_id: contact.data.id, kind: "other", summary: "Invalid follow-up", occurred_at: "2026-09-01T11:00:00Z", follow_up_on: "2026-09-04" });
  assert.equal(invalidFollowUp.error?.code, "23514");

  const completed = await user.client.from("contact_interactions").update({ follow_up_completed_at: new Date().toISOString() }).eq("id", interaction.data.id).select("follow_up_completed_at").single();
  assert.equal(completed.error, null);
  assert.notEqual(completed.data.follow_up_completed_at, null);
});

test("contact rows, links and interactions are isolated between users", async () => {
  const [owner, outsider] = await Promise.all([createTestUser("node-contact-owner"), createTestUser("node-contact-outsider")]);
  const organization = await owner.client.from("organizations").insert({ workspace_id: owner.workspaceId, name: `Owner Organization ${crypto.randomUUID()}`, type: "other" }).select("id").single();
  const contact = await owner.client.from("contacts").insert({ workspace_id: owner.workspaceId, display_name: "Synthetic Owner Contact" }).select("id").single();
  assert.equal(contact.error, null);
  const link = await owner.client.from("contact_organizations").insert({ workspace_id: owner.workspaceId, contact_id: contact.data.id, organization_id: organization.data.id });
  assert.equal(link.error, null);
  const interaction = await owner.client.from("contact_interactions").insert({ workspace_id: owner.workspaceId, contact_id: contact.data.id, kind: "phone", summary: "Synthetic owner-only summary", occurred_at: new Date().toISOString() }).select("id").single();
  assert.equal(interaction.error, null);

  for (const table of ["contacts", "contact_organizations", "contact_interactions"]) {
    const selected = await outsider.client.from(table).select("*").eq("workspace_id", owner.workspaceId);
    assert.equal(selected.error, null);
    assert.deepEqual(selected.data, []);
  }
  const crossWorkspaceLink = await outsider.client.from("contact_organizations").insert({ workspace_id: outsider.workspaceId, contact_id: contact.data.id, organization_id: organization.data.id });
  assert.notEqual(crossWorkspaceLink.error, null);
  const attemptedUpdate = await outsider.client.from("contacts").update({ display_name: "Forbidden" }).eq("id", contact.data.id).select("id");
  assert.equal(attemptedUpdate.error, null);
  assert.deepEqual(attemptedUpdate.data, []);
});
