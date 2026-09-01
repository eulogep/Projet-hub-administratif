import { describe, expect, it } from "vitest";
import { missionInputSchema } from "@/modules/missions/schemas/mission.schema";

describe("mission schema", () => {
  const organizationId = "11111111-1111-4111-8111-111111111111";
  it("trims fields and normalizes empty optional values", () => {
    const mission = missionInputSchema.parse({ organization_id: organizationId, title: "  Synthetic mission  ", description: "", status: "active", starts_on: "", target_ends_on: "" });
    expect(mission.title).toBe("Synthetic mission"); expect(mission.description).toBeNull(); expect(mission.starts_on).toBeNull();
  });
  it("rejects a target date before the start", () => {
    expect(missionInputSchema.safeParse({ organization_id: organizationId, title: "Synthetic mission", description: "", status: "draft", starts_on: "2026-09-10", target_ends_on: "2026-09-09" }).success).toBe(false);
  });
});
