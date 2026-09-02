import { z } from "zod";

const nullableText = (max: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().min(1).max(max).nullable(),
);
const nullableDate = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.iso.date().nullable(),
);

export const missionStatuses = ["draft", "active", "on_hold", "completed"] as const;
export const missionStatusSchema = z.enum(missionStatuses);
export const missionStatusLabels: Record<(typeof missionStatuses)[number], string> = {
  draft: "Brouillon",
  active: "Active",
  on_hold: "En pause",
  completed: "Terminée",
};

export const missionInputSchema = z.object({
  organization_id: z.uuid("Sélectionnez une organisation."),
  project_id: z.preprocess((value) => value == null || typeof value === "string" && value.trim() === "" ? null : value, z.uuid().nullable()),
  title: z.string().trim().min(1, "Le titre est requis.").max(180),
  description: nullableText(4000),
  status: missionStatusSchema,
  starts_on: nullableDate,
  target_ends_on: nullableDate,
}).superRefine((mission, context) => {
  if (mission.starts_on && mission.target_ends_on && mission.target_ends_on < mission.starts_on) {
    context.addIssue({ code: "custom", path: ["target_ends_on"], message: "La date de fin doit suivre la date de début." });
  }
});

export const missionSchema = z.object({
  id: z.uuid(), workspace_id: z.uuid(), organization_id: z.uuid(), project_id: z.uuid().nullable(), title: z.string(),
  description: z.string().nullable(), status: missionStatusSchema,
  starts_on: z.string().nullable(), target_ends_on: z.string().nullable(),
  completed_at: z.string().nullable(), archived_at: z.string().nullable(),
});

export const missionArchiveFilterSchema = z.enum(["active", "archived"]);
export type Mission = z.infer<typeof missionSchema>;
export type MissionInput = z.infer<typeof missionInputSchema>;
export type MissionStatus = z.infer<typeof missionStatusSchema>;
