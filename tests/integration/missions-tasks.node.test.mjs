import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createTestUser, getTestEnv } from "../helpers/node-test-client.mjs";

async function createMissionContext(label) {
  const user = await createTestUser(label);
  const organization = await user.client.from("organizations").insert({ workspace_id: user.workspaceId, name: `Synthetic Organization ${crypto.randomUUID()}`, type: "other" }).select("id").single();
  assert.equal(organization.error, null);
  const mission = await user.client.from("missions").insert({ workspace_id: user.workspaceId, organization_id: organization.data.id, title: "Synthetic Mission", status: "active", starts_on: "2026-09-01", target_ends_on: "2026-09-30" }).select("id").single();
  assert.equal(mission.error, null);
  return { ...user, organizationId: organization.data.id, missionId: mission.data.id };
}

test("anonymous clients cannot read missions or tasks", async () => {
  const { url, key } = getTestEnv(); const anonymous = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const table of ["missions", "tasks"]) { const result = await anonymous.from(table).select("*"); assert.equal(result.error?.code, "42501"); assert.equal(result.data, null); }
});

test("mission and task completion enforce hierarchy coherence", async () => {
  const context = await createMissionContext("node-mission-coherence");
  const parent = await context.client.from("tasks").insert({ workspace_id: context.workspaceId, mission_id: context.missionId, title: "Synthetic Parent", status: "in_progress", priority: "high" }).select("id").single(); assert.equal(parent.error, null);
  const child = await context.client.from("tasks").insert({ workspace_id: context.workspaceId, mission_id: context.missionId, parent_task_id: parent.data.id, title: "Synthetic Child", status: "todo", priority: "medium", due_on: "2026-09-02" }).select("id").single(); assert.equal(child.error, null);
  const grandchild = await context.client.from("tasks").insert({ workspace_id: context.workspaceId, mission_id: context.missionId, parent_task_id: child.data.id, title: "Forbidden Grandchild", status: "todo", priority: "low" }); assert.equal(grandchild.error?.code, "23514");
  const earlyParent = await context.client.from("tasks").update({ status: "done" }).eq("id", parent.data.id); assert.equal(earlyParent.error?.code, "23514");
  const earlyMission = await context.client.from("missions").update({ status: "completed" }).eq("id", context.missionId); assert.equal(earlyMission.error?.code, "23514");
  assert.equal((await context.client.from("tasks").update({ status: "done" }).eq("id", child.data.id)).error, null);
  const completedParent = await context.client.from("tasks").update({ status: "done" }).eq("id", parent.data.id).select("completed_at").single(); assert.equal(completedParent.error, null); assert.notEqual(completedParent.data.completed_at, null);
  const completedMission = await context.client.from("missions").update({ status: "completed" }).eq("id", context.missionId).select("completed_at").single(); assert.equal(completedMission.error, null); assert.notEqual(completedMission.data.completed_at, null);
});

test("mission and task rows remain isolated between workspaces", async () => {
  const [owner, outsider] = await Promise.all([createMissionContext("node-mission-owner"), createTestUser("node-mission-outsider")]);
  const task = await owner.client.from("tasks").insert({ workspace_id: owner.workspaceId, mission_id: owner.missionId, title: "Owner-only Task", status: "todo", priority: "urgent" }).select("id").single(); assert.equal(task.error, null);
  for (const table of ["missions", "tasks"]) { const selected = await outsider.client.from(table).select("*").eq("workspace_id", owner.workspaceId); assert.equal(selected.error, null); assert.deepEqual(selected.data, []); }
  const foreignUpdate = await outsider.client.from("tasks").update({ title: "Forbidden" }).eq("id", task.data.id).select("id"); assert.equal(foreignUpdate.error, null); assert.deepEqual(foreignUpdate.data, []);
  const foreignTaskDelete = await outsider.client.from("tasks").delete().eq("id", task.data.id).select("id"); assert.equal(foreignTaskDelete.error, null); assert.deepEqual(foreignTaskDelete.data, []);
  const foreignMissionDelete = await outsider.client.from("missions").delete().eq("id", owner.missionId).select("id"); assert.equal(foreignMissionDelete.error, null); assert.deepEqual(foreignMissionDelete.data, []);
  const crossInsert = await outsider.client.from("tasks").insert({ workspace_id: outsider.workspaceId, mission_id: owner.missionId, title: "Forbidden", status: "todo", priority: "low" }); assert.notEqual(crossInsert.error, null);
  const ownerTaskDelete = await owner.client.from("tasks").delete().eq("id", task.data.id).select("id").single(); assert.equal(ownerTaskDelete.error, null);
  const ownerMissionDelete = await owner.client.from("missions").delete().eq("id", owner.missionId).select("id").single(); assert.equal(ownerMissionDelete.error, null);
});
