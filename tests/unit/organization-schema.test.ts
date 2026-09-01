import { describe, expect, it } from "vitest";
import { organizationInputSchema, organizationSchema } from "@/modules/organizations/schemas/organization.schema";

describe("organizationSchema", () => {
  it("accepts the minimal scoped organization shape", () => {
    const organization = organizationSchema.parse({
      id: "c6f64f7b-7d62-4f2e-a3fc-525db1087e57",
      workspace_id: "54274fb0-12eb-4d23-80af-dbdc2f3ed845",
      name: "Demo Organization A",
      type: "employer",
      archived_at: null,
    });

    expect(organization.name).toBe("Demo Organization A");
  });

  it("rejects unsupported organization types", () => {
    expect(() =>
      organizationSchema.parse({
        id: "c6f64f7b-7d62-4f2e-a3fc-525db1087e57",
        workspace_id: "54274fb0-12eb-4d23-80af-dbdc2f3ed845",
        name: "Demo Organization",
        type: "customer_crm",
        archived_at: null,
      }),
    ).toThrow();
  });

  it("trims and validates organization input", () => {
    expect(organizationInputSchema.parse({ name: "  Demo Organization  ", type: "other" })).toEqual({
      name: "Demo Organization",
      type: "other",
    });
    expect(organizationInputSchema.safeParse({ name: "   ", type: "other" }).success).toBe(false);
  });
});
