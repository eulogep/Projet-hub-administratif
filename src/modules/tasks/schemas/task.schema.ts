import { z } from "zod";

const nullableText = (max: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().min(1).max(max).nullable(),
);
const nullableDate = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.iso.date().nullable(),
);

export const taskStatuses = ["todo", "in_progress", "blocked", "done", "cancelled"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export const taskStatusSchema = z.enum(taskStatuses);
export const taskPrioritySchema = z.enum(taskPriorities);
export const taskStatusLabels: Record<(typeof taskStatuses)[number], string> = {
  todo: "À faire", in_progress: "En cours", blocked: "Bloquée", done: "Terminée", cancelled: "Annulée",
};
export const taskPriorityLabels: Record<(typeof taskPriorities)[number], string> = {
  low: "Basse", medium: "Normale", high: "Haute", urgent: "Urgente",
};

export const taskInputSchema = z.object({
  mission_id: z.uuid("Sélectionnez une mission."),
  parent_task_id: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.uuid().nullable()),
  title: z.string().trim().min(1, "Le titre est requis.").max(240),
  description: nullableText(4000),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  starts_on: nullableDate,
  due_on: nullableDate,
}).superRefine((task, context) => {
  if (task.starts_on && task.due_on && task.due_on < task.starts_on) {
    context.addIssue({ code: "custom", path: ["due_on"], message: "L’échéance doit suivre la date de début." });
  }
});

export const taskSchema = z.object({
  id: z.uuid(), workspace_id: z.uuid(), mission_id: z.uuid(), parent_task_id: z.uuid().nullable(),
  title: z.string(), description: z.string().nullable(), status: taskStatusSchema, priority: taskPrioritySchema,
  starts_on: z.string().nullable(), due_on: z.string().nullable(), completed_at: z.string().nullable(),
  position: z.number().int().nonnegative(), archived_at: z.string().nullable(),
});

export function isTaskOverdue(task: { due_on: string | null; status: z.infer<typeof taskStatusSchema> }, today: string) {
  return Boolean(task.due_on && task.due_on < today && !["done", "cancelled"].includes(task.status));
}

export type Task = z.infer<typeof taskSchema>;
export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
