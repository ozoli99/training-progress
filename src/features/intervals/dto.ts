import { z } from "zod";

export const UUID = z.string().uuid();

export const OrgAthleteSessionScoped = z.object({
  orgId: UUID,
  athleteId: UUID,
  sessionId: UUID,
});

const JsonValue = z.unknown();

export const IntervalRow = z.object({
  id: UUID,
  sessionId: UUID,
  sessionBlockId: UUID.nullable(),
  exerciseId: UUID.nullable(),
  intervalIndex: z.number().int().min(0),
  targetValue: JsonValue.optional().nullable(),
  actualValue: JsonValue.optional().nullable(),
  durationS: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
});
export type TIntervalRow = z.infer<typeof IntervalRow>;

export const ListIntervalsInput = OrgAthleteSessionScoped.extend({
  sessionBlockId: UUID.optional(),
});
export type TListIntervalsInput = z.infer<typeof ListIntervalsInput>;

export const GetIntervalInput = OrgAthleteSessionScoped.extend({
  intervalLogId: UUID,
});

export const CreateIntervalInput = OrgAthleteSessionScoped.extend({
  sessionBlockId: UUID.optional(),
  exerciseId: UUID.optional(),
  intervalIndex: z.number().int().min(0),
  targetValue: JsonValue.optional(),
  durationS: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const UpdateIntervalInput = OrgAthleteSessionScoped.extend({
  intervalLogId: UUID,
  sessionBlockId: UUID.optional().nullable(),
  exerciseId: UUID.optional().nullable(),
  intervalIndex: z.number().int().min(0).optional(),
  targetValue: JsonValue.optional().nullable(),
  actualValue: JsonValue.optional().nullable(),
  durationS: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const DeleteIntervalInput = OrgAthleteSessionScoped.extend({
  intervalLogId: UUID,
});
