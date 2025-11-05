import { z } from "zod";

// Shared helpers
const nz = z
  .union([z.string(), z.number()])
  .transform((v) =>
    v === null || v === undefined || v === "" ? null : String(v)
  )
  .nullable();

// ---- WorkoutLog (container) ----
export const CreateWorkoutLogDto = z.object({
  sessionBlockId: z.string().uuid().nullable().optional(),
  workoutId: z.string().uuid(),
  plannedWorkoutId: z.string().uuid().nullable().optional(),
  workoutVersionId: z.string().uuid().nullable().optional(),
  resultRaw: z.string().trim().nullable().optional(),
  resultPrimary: nz,
  asRx: z.boolean().optional(),
  isDraft: z.boolean().optional(),
});
export type CreateWorkoutLogDto = z.infer<typeof CreateWorkoutLogDto>;

export const UpdateWorkoutLogDto = CreateWorkoutLogDto.partial();
export type UpdateWorkoutLogDto = z.infer<typeof UpdateWorkoutLogDto>;

// ---- WorkoutLogEntry (sequence inside workout) ----
export const CreateWorkoutLogEntryDto = z.object({
  exerciseId: z.string().uuid(),
  sequenceIndex: z.coerce.number().int().min(0).optional(), // auto if missing
  reps: z.coerce.number().int().min(0).nullable().optional(),
  loadKg: nz,
  scaled: z.boolean().optional(),
  scaledToExerciseId: z.string().uuid().nullable().optional(),
  actualPrescription: z.any().optional(),
  equipmentExtra: z.any().optional(),
});
export type CreateWorkoutLogEntryDto = z.infer<typeof CreateWorkoutLogEntryDto>;

export const UpdateWorkoutLogEntryDto = CreateWorkoutLogEntryDto.partial();
export type UpdateWorkoutLogEntryDto = z.infer<typeof UpdateWorkoutLogEntryDto>;

// ---- WorkoutRoundLog (round aggregates for AMRAP/intervals) ----
export const CreateRoundDto = z.object({
  roundIndex: z.coerce.number().int().min(0).optional(), // auto if missing
  durationS: nz,
  repsTotal: z.coerce.number().int().min(0).nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});
export type CreateRoundDto = z.infer<typeof CreateRoundDto>;

export const UpdateRoundDto = CreateRoundDto.partial();
export type UpdateRoundDto = z.infer<typeof UpdateRoundDto>;
