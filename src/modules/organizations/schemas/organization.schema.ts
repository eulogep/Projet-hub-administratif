import { z } from "zod";

export const organizationSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  name: z.string().min(1).max(160),
  type: z.enum(["company", "public_service", "school", "cfa", "other"]),
});

export type Organization = z.infer<typeof organizationSchema>;
