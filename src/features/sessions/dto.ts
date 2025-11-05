import { z } from "zod";

export const ISODate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const ListSessionsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  from: ISODate.optional(),
  to: ISODate.optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  status: z.string().trim().min(1).optional(),
  trainingLocationId: z.string().uuid().optional(),
});
export type ListSessionsQuery = z.infer<typeof ListSessionsQuery>;

export const CreateSessionDto = z.object({
  sessionDate: ISODate,
  status: z.string().trim().optional(), // e.g. 'planned'|'in_progress'|'completed'
  completionPct: z.coerce.number().int().min(0).max(100).optional(),
  loadSource: z.string().trim().optional(),
  trainingLocationId: z.string().uuid().optional(),
  plannedSessionId: z.string().uuid().optional(), // to “materialize” inline
});
export type CreateSessionDto = z.infer<typeof CreateSessionDto>;

export const UpdateSessionDto = z.object({
  sessionDate: ISODate.optional(),
  status: z.string().trim().optional(),
  completionPct: z.coerce.number().int().min(0).max(100).optional(),
  loadSource: z.string().trim().optional(),
  trainingLocationId: z.string().uuid().optional(),
});
export type UpdateSessionDto = z.infer<typeof UpdateSessionDto>;
