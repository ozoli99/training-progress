import { z } from "zod";

export const OrgIdParam = z.object({ id: z.string().uuid() });
export const ExerciseIdParam = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
});
export const ExerciseMovementGroupParam = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  movementGroupId: z.string().uuid(),
});

export const ListExercisesQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
  category: z.string().optional(),
  modality: z.string().optional(),
});
export type ListExercisesQueryT = z.infer<typeof ListExercisesQuery>;

export const CreateExerciseDto = z.object({
  name: z.string().min(1).max(200),
  category: z.string().optional(),
  modality: z.string().optional(),
  globalExerciseId: z.string().uuid().optional(),
});
export type CreateExerciseInput = z.infer<typeof CreateExerciseDto>;

export const UpdateExerciseDto = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  modality: z.string().optional(),
  globalExerciseId: z.string().uuid().nullable().optional(),
});
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseDto>;

export const AddMovementGroupDto = z.object({
  movementGroupId: z.string().uuid(),
});
export type AddMovementGroupInput = z.infer<typeof AddMovementGroupDto>;

export const ExerciseResponse = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  category: z.string().nullable(),
  modality: z.string().nullable(),
  globalExerciseId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ExerciseResponseT = z.infer<typeof ExerciseResponse>;

export const MovementGroupResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});
