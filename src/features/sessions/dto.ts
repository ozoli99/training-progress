import { z } from "zod";

export const SessionRow = z.object({
  id: z.string(),
  orgId: z.string(),
  athleteId: z.string(),
  plannedSessionId: z.string().nullable(),
  trainingLocationId: z.string().nullable(),
  sessionDate: z.string(),
  status: z.string().nullable(),
  completionPct: z.number(),
  loadSource: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TSessionRow = z.infer<typeof SessionRow>;

export const ListSessionsInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  plannedSessionId: z.string().optional(),
  trainingLocationId: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional(),
});
export type TListSessionsInput = z.infer<typeof ListSessionsInput>;

export const GetSessionInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
});
export type TGetSessionInput = z.infer<typeof GetSessionInput>;

export const CreateSessionInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionDate: z.string(),
  status: z.string().optional(),
  plannedSessionId: z.string().optional(),
  trainingLocationId: z.string().optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  loadSource: z.string().optional(),
});
export type TCreateSessionInput = z.infer<typeof CreateSessionInput>;

export const UpdateSessionInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
  sessionDate: z.string().optional(),
  status: z.string().nullable().optional(),
  plannedSessionId: z.string().nullable().optional(),
  trainingLocationId: z.string().nullable().optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  loadSource: z.string().nullable().optional(),
});
export type TUpdateSessionInput = z.infer<typeof UpdateSessionInput>;

export const DeleteSessionInput = z.object({
  orgId: z.string(),
  athleteId: z.string(),
  sessionId: z.string(),
});
export type TDeleteSessionInput = z.infer<typeof DeleteSessionInput>;
