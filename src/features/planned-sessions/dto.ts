import { z } from "zod";

export const ISODate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const ListPlannedSessionsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  from: ISODate.optional(),
  to: ISODate.optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  title: z.string().trim().min(1).optional(),
});
export type ListPlannedSessionsQuery = z.infer<typeof ListPlannedSessionsQuery>;

export const CreatePlannedSessionDto = z.object({
  plannedDate: ISODate,
  title: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
});
export type CreatePlannedSessionDto = z.infer<typeof CreatePlannedSessionDto>;

export const UpdatePlannedSessionDto = z.object({
  plannedDate: ISODate.optional(),
  title: z.string().trim().min(1).optional(),
  notes: z.string().trim().optional(),
});
export type UpdatePlannedSessionDto = z.infer<typeof UpdatePlannedSessionDto>;
