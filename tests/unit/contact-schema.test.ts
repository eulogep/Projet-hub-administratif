import { describe, expect, it } from "vitest";
import {
  contactCreateSchema,
  contactInteractionCreateSchema,
  deriveDisplayName,
  normalizeContactSearch,
} from "@/modules/contacts/schemas/contact.schema";

describe("contact schemas", () => {
  it("derives a display name and normalizes optional values", () => {
    const parsed = contactCreateSchema.parse({
      first_name: "  Élodie ",
      last_name: " Exemple ",
      display_name: "",
      primary_email: " DEMO.CONTACT@EXAMPLE.TEST ",
      primary_phone: "",
      category: "",
      notes: "",
    });
    expect(deriveDisplayName(parsed)).toBe("Élodie Exemple");
    expect(parsed.primary_email).toBe("demo.contact@example.test");
    expect(parsed.primary_phone).toBeNull();
  });

  it("requires at least one meaningful name", () => {
    const result = contactCreateSchema.safeParse({
      first_name: "", last_name: "", display_name: "", primary_email: "",
      primary_phone: "", category: "", notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes accents and case for search", () => {
    expect(normalizeContactSearch("  ÉLODIE Àçcentuée  ")).toBe("elodie accentuee");
  });

  it("requires a label when a follow-up date is provided", () => {
    const result = contactInteractionCreateSchema.safeParse({
      kind: "email",
      summary: "Synthetic follow-up summary",
      occurred_at: "2026-09-01T10:00",
      organization_id: "",
      follow_up_label: "",
      follow_up_on: "2026-09-02",
    });
    expect(result.success).toBe(false);
  });
});
