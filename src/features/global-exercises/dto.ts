import { z } from "zod";

export const UUID = z.string().uuid();

export const GlobalExerciseRow = z.object({
  id: UUID,
  name: z.string(),
  category: z.string().nullable(),
  modality: z.string().nullable(),
  description: z.string().nullable(),
  standards: z.unknown().nullable(),
  isPublic: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TGlobalExerciseRow = z.infer<typeof GlobalExerciseRow>;

export const ListGlobalExercisesInput = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  modality: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
export type TListGlobalExercisesInput = z.infer<
  typeof ListGlobalExercisesInput
>;

export const GetGlobalExerciseInput = z.object({
  id: UUID,
});

export const CreateGlobalExerciseInput = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  modality: z.string().optional(),
  description: z.string().optional(),
  standards: z.unknown().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateGlobalExerciseInput = z.object({
  id: UUID,
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  modality: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  standards: z.unknown().optional().nullable(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const DeleteGlobalExerciseInput = z.object({
  id: UUID,
});

export const GlobalExerciseMediaRow = z.object({
  id: UUID,
  globalExerciseId: UUID,
  mediaType: z.string(),
  url: z.string().min(1),
  title: z.string().nullable(),
  displayOrder: z.number().int(),
  createdAt: z.string(),
});
export type TGlobalExerciseMediaRow = z.infer<typeof GlobalExerciseMediaRow>;

export const ListGlobalExerciseMediaInput = z.object({
  globalExerciseId: UUID,
});

export const CreateGlobalExerciseMediaInput = z.object({
  globalExerciseId: UUID,
  mediaType: z.string().min(1),
  url: z.string().min(1),
  title: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export const UpdateGlobalExerciseMediaInput = z.object({
  id: UUID,
  title: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
});

export const DeleteGlobalExerciseMediaInput = z.object({
  id: UUID,
});
