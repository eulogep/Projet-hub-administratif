import { describe, expect, it } from "vitest";
import { projectInputSchema } from "@/modules/projects/schemas/project.schema";

describe("project schema", () => {
  const organizationId = "11111111-1111-4111-8111-111111111111";
  it("trims fields and normalizes optional values", () => {
    const project = projectInputSchema.parse({ organization_id: organizationId, name: "  Synthetic project  ", description: "", status: "active", starts_on: "", target_ends_on: "" });
    expect(project.name).toBe("Synthetic project"); expect(project.description).toBeNull(); expect(project.starts_on).toBeNull();
  });
  it("rejects invalid status and reversed dates", () => {
    expect(projectInputSchema.safeParse({ organization_id: organizationId, name: "Synthetic", description: "", status: "unknown", starts_on: "", target_ends_on: "" }).success).toBe(false);
    expect(projectInputSchema.safeParse({ organization_id: organizationId, name: "Synthetic", description: "", status: "planned", starts_on: "2026-09-10", target_ends_on: "2026-09-09" }).success).toBe(false);
  });
});
