import { describe, expect, it } from "vitest";
import { isTaskOverdue, taskInputSchema } from "@/modules/tasks/schemas/task.schema";

describe("task schema", () => {
  const missionId = "11111111-1111-4111-8111-111111111111";
  it("validates dates and normalizes optional values", () => {
    const task = taskInputSchema.parse({ mission_id: missionId, parent_task_id: "", title: " Synthetic task ", description: "", status: "todo", priority: "high", starts_on: "2026-09-01", due_on: "2026-09-02" });
    expect(task.title).toBe("Synthetic task"); expect(task.parent_task_id).toBeNull();
  });
  it("calculates overdue only for open tasks", () => {
    expect(isTaskOverdue({ due_on: "2026-08-31", status: "in_progress" }, "2026-09-01")).toBe(true);
    expect(isTaskOverdue({ due_on: "2026-08-31", status: "done" }, "2026-09-01")).toBe(false);
  });
  it("rejects an invalid date order", () => {
    expect(taskInputSchema.safeParse({ mission_id: missionId, parent_task_id: "", title: "Synthetic task", description: "", status: "todo", priority: "medium", starts_on: "2026-09-03", due_on: "2026-09-02" }).success).toBe(false);
  });
});
