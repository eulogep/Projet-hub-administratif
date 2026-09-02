import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createTestUser, getTestEnv } from "../helpers/node-test-client.mjs";

async function createContext(label) {
  const user = await createTestUser(label);
  const organization = await user.client.from("organizations").insert({ workspace_id: user.workspaceId, name: `Synthetic Organization ${crypto.randomUUID()}`, type: "other" }).select("id").single(); assert.equal(organization.error, null);
  return { ...user, organizationId: organization.data.id };
}

test("projects deny anonymous access and isolate workspaces", async () => {
  const { url, key } = getTestEnv(); const anonymous = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const denied = await anonymous.from("projects").select("*"); assert.equal(denied.error?.code, "42501");
  const [owner, outsider] = await Promise.all([createContext("node-project-owner"), createContext("node-project-outsider")]);
  const project = await owner.client.from("projects").insert({ workspace_id: owner.workspaceId, organization_id: owner.organizationId, name: "Synthetic Project", status: "active" }).select("id").single(); assert.equal(project.error, null);
  assert.deepEqual((await outsider.client.from("projects").select("id").eq("id", project.data.id)).data, []);
  assert.notEqual((await outsider.client.from("projects").insert({ workspace_id: outsider.workspaceId, organization_id: owner.organizationId, name: "Forbidden", status: "active" })).error, null);
  assert.deepEqual((await outsider.client.from("projects").update({ name: "Forbidden" }).eq("id", project.data.id).select("id")).data, []);
  assert.deepEqual((await outsider.client.from("projects").delete().eq("id", project.data.id).select("id")).data, []);
});

test("project constraints and mission association preserve organization boundaries", async () => {
  const context = await createContext("node-project-constraints");
  const otherOrganization = await context.client.from("organizations").insert({ workspace_id: context.workspaceId, name: `Other ${crypto.randomUUID()}`, type: "other" }).select("id").single(); assert.equal(otherOrganization.error, null);
  const project = await context.client.from("projects").insert({ workspace_id: context.workspaceId, organization_id: context.organizationId, name: "Synthetic Project", status: "active", starts_on: "2026-09-01", target_ends_on: "2026-09-30" }).select("id, completed_at").single(); assert.equal(project.error, null);
  assert.equal((await context.client.from("projects").insert({ workspace_id: context.workspaceId, organization_id: context.organizationId, name: "synthetic project", status: "planned" })).error?.code, "23505");
  assert.equal((await context.client.from("projects").insert({ workspace_id: context.workspaceId, organization_id: context.organizationId, name: "Bad dates", status: "planned", starts_on: "2026-10-02", target_ends_on: "2026-10-01" })).error?.code, "23514");
  const mission = await context.client.from("missions").insert({ workspace_id: context.workspaceId, organization_id: context.organizationId, project_id: project.data.id, title: "Linked mission", status: "active" }).select("id").single(); assert.equal(mission.error, null);
  assert.notEqual((await context.client.from("missions").insert({ workspace_id: context.workspaceId, organization_id: otherOrganization.data.id, project_id: project.data.id, title: "Wrong organization", status: "active" })).error, null);
  assert.equal((await context.client.from("missions").insert({ workspace_id: context.workspaceId, organization_id: context.organizationId, title: "Legacy-compatible mission", status: "draft" })).error, null);
  const completed = await context.client.from("projects").update({ status: "completed" }).eq("id", project.data.id).select("completed_at").single(); assert.equal(completed.error, null); assert.notEqual(completed.data.completed_at, null);
  const archived = await context.client.from("projects").update({ archived_at: new Date().toISOString() }).eq("id", project.data.id); assert.equal(archived.error, null);
  assert.equal((await context.client.from("missions").select("project_id").eq("id", mission.data.id).single()).data.project_id, project.data.id);
});
