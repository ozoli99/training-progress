import { z } from "zod";

export const UUID = z.string().uuid();

export const OrgScoped = z.object({
  orgId: UUID,
});

export const ExerciseRow = z.object({
  id: UUID,
  orgId: UUID,
  name: z.string(),
  category: z.string().nullable(),
  modality: z.string().nullable(),
  globalExerciseId: UUID.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TExerciseRow = z.infer<typeof ExerciseRow>;

export const CreateExerciseInput = OrgScoped.extend({
  name: z.string().min(1),
  category: z.string().optional(),
  modality: z.string().optional(),
  globalExerciseId: UUID.optional(),
});

export const UpdateExerciseInput = OrgScoped.extend({
  exerciseId: UUID,
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  modality: z.string().optional().nullable(),
  globalExerciseId: UUID.optional().nullable(),
});

export const DeleteExerciseInput = OrgScoped.extend({
  exerciseId: UUID,
});

export const ListExercisesInput = OrgScoped.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  modality: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
export type TListExercisesInput = z.infer<typeof ListExercisesInput>;
