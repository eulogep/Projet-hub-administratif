import { z } from "zod";

const nullableText = (max: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().min(1).max(max).nullable(),
);
const nullableDate = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.iso.date().nullable(),
);

export const projectStatuses = ["planned", "active", "on_hold", "completed", "cancelled"] as const;
export const projectStatusSchema = z.enum(projectStatuses);
export const projectStatusLabels: Record<(typeof projectStatuses)[number], string> = {
  planned: "Planifié",
  active: "Actif",
  on_hold: "En pause",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const projectInputSchema = z.object({
  organization_id: z.uuid("Sélectionnez une organisation."),
  name: z.string().trim().min(1, "Le nom est requis.").max(180),
  description: nullableText(4000),
  status: projectStatusSchema,
  starts_on: nullableDate,
  target_ends_on: nullableDate,
}).superRefine((project, context) => {
  if (project.starts_on && project.target_ends_on && project.target_ends_on < project.starts_on) {
    context.addIssue({ code: "custom", path: ["target_ends_on"], message: "La date de fin doit suivre la date de début." });
  }
});

export const projectSchema = z.object({
  id: z.uuid(), workspace_id: z.uuid(), organization_id: z.uuid(), name: z.string(),
  description: z.string().nullable(), status: projectStatusSchema,
  starts_on: z.string().nullable(), target_ends_on: z.string().nullable(),
  completed_at: z.string().nullable(), archived_at: z.string().nullable(),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
