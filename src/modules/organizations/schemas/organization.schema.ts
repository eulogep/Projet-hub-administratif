import { z } from "zod";

export const organizationTypes = [
  "employer",
  "crous",
  "university",
  "cfa",
  "opco",
  "administration",
  "other",
] as const;

export const organizationTypeSchema = z.enum(organizationTypes);

export const organizationTypeLabels: Record<(typeof organizationTypes)[number], string> = {
  employer: "Employeur",
  crous: "CROUS",
  university: "Université",
  cfa: "CFA",
  opco: "OPCO",
  administration: "Administration",
  other: "Autre",
};

const organizationMutableFields = {
  name: z.string().trim().min(1, "Le nom est requis.").max(160, "Le nom ne peut pas dépasser 160 caractères."),
  type: organizationTypeSchema,
};

export const organizationCreateSchema = z.object(organizationMutableFields);
export const organizationUpdateSchema = z.object(organizationMutableFields);
export const organizationInputSchema = organizationCreateSchema;
export const organizationStatusSchema = z.enum(["active", "archived"]);

export const organizationSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  name: z.string().min(1).max(160),
  type: organizationTypeSchema,
  archived_at: z.string().nullable(),
});

export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationInput = z.infer<typeof organizationInputSchema>;
export type OrganizationType = z.infer<typeof organizationTypeSchema>;
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;
