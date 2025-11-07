import { z } from "zod";

export const ZRouteOrg = z.object({ orgId: z.string().uuid() });
export const ZRouteSession = ZRouteOrg.extend({
  sessionId: z.string().uuid(),
});
export const ZRouteWorkoutLog = ZRouteSession.extend({
  workoutLogId: z.string().uuid(),
});

export const ZWorkoutLogRow = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  sessionBlockId: z.string().uuid().nullable(),
  workoutId: z.string().uuid(),
  plannedWorkoutId: z.string().uuid().nullable(),
  workoutVersionId: z.string().uuid().nullable(),
  resultRaw: z.string().nullable(),
  resultPrimary: z.coerce.number().nullable(),
  asRx: z.boolean(),
  isDraft: z.boolean(),
});
export type TWorkoutLogRow = z.infer<typeof ZWorkoutLogRow>;

export const ZWorkoutLogEntryRow = z.object({
  id: z.string().uuid(),
  workoutLogId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sequenceIndex: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative().nullable(),
  loadKg: z.coerce.number().nullable(),
  scaled: z.boolean(),
  scaledToExerciseId: z.string().uuid().nullable(),
  actualPrescription: z.any().nullable(),
  equipmentExtra: z.any().nullable(),
});
export type TWorkoutLogEntryRow = z.infer<typeof ZWorkoutLogEntryRow>;

export const ZWorkoutRoundRow = z.object({
  id: z.string().uuid(),
  workoutLogId: z.string().uuid(),
  roundIndex: z.number().int().nonnegative(),
  durationS: z.coerce.number().nullable(),
  repsTotal: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
});
export type TWorkoutRoundRow = z.infer<typeof ZWorkoutRoundRow>;

export const ZWorkoutRoundEntryRow = z.object({
  id: z.string().uuid(),
  workoutRoundLogId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  reps: z.number().int().nonnegative().nullable(),
  loadKg: z.coerce.number().nullable(),
  extra: z.any().nullable(),
});
export type TWorkoutRoundEntryRow = z.infer<typeof ZWorkoutRoundEntryRow>;

export const ZListLogsQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const ZCreateWorkoutLogInput = ZRouteSession.extend({
  sessionBlockId: z.string().uuid().optional(),
  workoutId: z.string().uuid(),
  plannedWorkoutId: z.string().uuid().optional(),
  workoutVersionId: z.string().uuid().optional(),
  resultRaw: z.string().optional(),
  resultPrimary: z.coerce.number().optional(),
  asRx: z.boolean().optional(),
  isDraft: z.boolean().optional(),
});

export const ZUpdateWorkoutLogInput = ZRouteWorkoutLog.extend({
  sessionBlockId: z.string().uuid().nullable().optional(),
  plannedWorkoutId: z.string().uuid().nullable().optional(),
  workoutVersionId: z.string().uuid().nullable().optional(),
  resultRaw: z.string().nullable().optional(),
  resultPrimary: z.coerce.number().nullable().optional(),
  asRx: z.boolean().optional(),
  isDraft: z.boolean().optional(),
}).refine(
  (v) => {
    const { orgId, sessionId, workoutLogId, ...rest } = v;
    return Object.keys(rest).length > 0;
  },
  { message: "No fields to update." }
);

export const ZReplaceEntriesInput = ZRouteWorkoutLog.extend({
  items: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      sequenceIndex: z.coerce.number().int().nonnegative().default(0),
      reps: z.number().int().nonnegative().nullable().optional(),
      loadKg: z.coerce.number().nullable().optional(),
      scaled: z.boolean().optional(),
      scaledToExerciseId: z.string().uuid().nullable().optional(),
      actualPrescription: z.any().optional(),
      equipmentExtra: z.any().optional(),
    })
  ),
});

export const ZReplaceRoundsInput = ZRouteWorkoutLog.extend({
  items: z.array(
    z.object({
      roundIndex: z.coerce.number().int().nonnegative().default(0),
      durationS: z.coerce.number().nullable().optional(),
      repsTotal: z.number().int().nonnegative().nullable().optional(),
      notes: z.string().nullable().optional(),
      entries: z
        .array(
          z.object({
            exerciseId: z.string().uuid(),
            reps: z.number().int().nonnegative().nullable().optional(),
            loadKg: z.coerce.number().nullable().optional(),
            extra: z.any().optional(),
          })
        )
        .optional(),
    })
  ),
});

export const ZListEntriesQuery = z.object({
  order: z.enum(["asc", "desc"]).optional(),
});

export const ZListRoundsQuery = z.object({
  order: z.enum(["asc", "desc"]).optional(),
});
