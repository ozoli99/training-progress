import { z } from "zod";

export const UUID = z.string().uuid();

export const ZRouteParams = z.object({
  orgId: UUID,
  athleteId: UUID,
  sessionId: UUID,
  setLogId: UUID.optional(),
});

export const ZListQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  sessionBlockId: UUID.optional(),
  exerciseId: UUID.optional(),
  plannedSetId: UUID.optional(),
  minIndex: z.coerce.number().int().nonnegative().optional(),
  maxIndex: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).default("asc").optional(),
});

export const ZSetLogCreate = z.object({
  sessionBlockId: UUID.nullable().optional(),
  exerciseId: UUID,
  plannedSetId: UUID.nullable().optional(),
  setIndex: z.coerce.number().int().nonnegative().default(0),
  reps: z.coerce.number().int().nonnegative().nullable().optional(),
  loadKg: z.coerce.number().nullable().optional(),
  durationS: z.coerce.number().nullable().optional(),
  distanceM: z.coerce.number().nullable().optional(),
  rpe: z.coerce.number().nullable().optional(),
  toFailure: z.coerce.boolean().optional(),
});

export const ZSetLogUpdate = z
  .object({
    sessionBlockId: UUID.nullable().optional(),
    exerciseId: UUID.optional(),
    plannedSetId: UUID.nullable().optional(),
    setIndex: z.coerce.number().int().nonnegative().optional(),
    reps: z.coerce.number().int().nonnegative().nullable().optional(),
    loadKg: z.coerce.number().nullable().optional(),
    durationS: z.coerce.number().nullable().optional(),
    distanceM: z.coerce.number().nullable().optional(),
    rpe: z.coerce.number().nullable().optional(),
    toFailure: z.coerce.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "No fields to update.",
  });

export const ZSetLogRow = z.object({
  id: UUID,
  sessionId: UUID,
  sessionBlockId: UUID.nullable().optional(),
  exerciseId: UUID,
  plannedSetId: UUID.nullable().optional(),
  setIndex: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative().nullable().optional(),
  loadKg: z.string().nullable().optional(),
  durationS: z.string().nullable().optional(),
  distanceM: z.string().nullable().optional(),
  rpe: z.string().nullable().optional(),
  toFailure: z.boolean().nullable().optional(),
});

export type ListQuery = z.infer<typeof ZListQuery>;

export type SetLogListInput = z.infer<typeof ZRouteParams> & ListQuery;
export type SetLogGetInput = z.infer<typeof ZRouteParams> & {
  setLogId: string;
};
export type SetLogDeleteInput = SetLogGetInput;
export type SetLogCreateInput = z.infer<typeof ZRouteParams> &
  z.infer<typeof ZSetLogCreate>;
export type SetLogUpdateInput = z.infer<typeof ZRouteParams> &
  z.infer<typeof ZSetLogUpdate> & { setLogId: string };

export type TSetLogRow = z.infer<typeof ZSetLogRow>;
