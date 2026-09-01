import { z } from "zod";

const nullableTrimmed = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().min(1).max(maximum).nullable(),
  );

const contactMutableFields = {
  first_name: nullableTrimmed(120),
  last_name: nullableTrimmed(120),
  display_name: nullableTrimmed(180),
  primary_email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().toLowerCase().email("L’adresse e-mail est invalide.").max(254).nullable(),
  ),
  primary_phone: nullableTrimmed(40),
  category: nullableTrimmed(80),
  notes: nullableTrimmed(4000),
};

export const contactCreateSchema = z.object(contactMutableFields).superRefine((contact, context) => {
  if (!contact.display_name && !contact.first_name && !contact.last_name) {
    context.addIssue({ code: "custom", path: ["display_name"], message: "Indiquez au moins un nom." });
  }
});
export const contactUpdateSchema = contactCreateSchema;
export const contactStatusSchema = z.enum(["active", "archived"]);

export const contactSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  display_name: z.string().min(1).max(180),
  primary_email: z.string().nullable(),
  primary_phone: z.string().nullable(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  archived_at: z.string().nullable(),
});

export const contactOrganizationLinkSchema = z.object({
  organization_id: z.uuid(),
  job_title: nullableTrimmed(160),
  role_label: nullableTrimmed(160),
  is_primary: z.boolean(),
});

export const interactionKinds = ["email", "phone", "meeting", "message", "other"] as const;
export const interactionKindSchema = z.enum(interactionKinds);
export const interactionKindLabels: Record<(typeof interactionKinds)[number], string> = {
  email: "E-mail",
  phone: "Appel",
  meeting: "Réunion",
  message: "Message",
  other: "Autre",
};

export const contactInteractionCreateSchema = z.object({
  kind: interactionKindSchema,
  summary: z.string().trim().min(1, "Le résumé est requis.").max(2000),
  occurred_at: z.string().datetime({ local: true }),
  organization_id: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.uuid().nullable(),
  ),
  follow_up_label: nullableTrimmed(240),
  follow_up_on: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.iso.date().nullable(),
  ),
}).superRefine((interaction, context) => {
  if (interaction.follow_up_on && !interaction.follow_up_label) {
    context.addIssue({ code: "custom", path: ["follow_up_label"], message: "Ajoutez un libellé de relance." });
  }
});

export const contactInteractionSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  contact_id: z.uuid(),
  organization_id: z.uuid().nullable(),
  kind: interactionKindSchema,
  summary: z.string(),
  occurred_at: z.string(),
  follow_up_label: z.string().nullable(),
  follow_up_on: z.string().nullable(),
  follow_up_completed_at: z.string().nullable(),
});

export function deriveDisplayName(input: {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
}) {
  return input.display_name ?? [input.first_name, input.last_name].filter(Boolean).join(" ");
}

export function normalizeContactSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export type Contact = z.infer<typeof contactSchema>;
export type ContactInput = z.infer<typeof contactCreateSchema>;
export type ContactStatus = z.infer<typeof contactStatusSchema>;
export type ContactOrganizationLinkInput = z.infer<typeof contactOrganizationLinkSchema>;
export type ContactInteraction = z.infer<typeof contactInteractionSchema>;
