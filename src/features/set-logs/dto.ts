import { z } from "zod";

export const CreateSetDto = z.object({
  sessionBlockId: z.string().uuid().nullable().optional(),
  exerciseId: z.string().uuid(),
  setIndex: z.coerce.number().int().min(0).optional(),
  reps: z.coerce.number().int().min(0).nullable().optional(),
  loadKg: z
    .union([z.string(), z.number()])
    .transform((v) => (v === null || v === undefined ? null : String(v)))
    .nullable()
    .optional(),
  durationS: z
    .union([z.string(), z.number()])
    .transform((v) => (v === null || v === undefined ? null : String(v)))
    .nullable()
    .optional(),
  distanceM: z
    .union([z.string(), z.number()])
    .transform((v) => (v === null || v === undefined ? null : String(v)))
    .nullable()
    .optional(),
  rpe: z
    .union([z.string(), z.number()])
    .transform((v) => (v === null || v === undefined ? null : String(v)))
    .nullable()
    .optional(),
  toFailure: z.boolean().optional(),
});
export type CreateSetDto = z.infer<typeof CreateSetDto>;

export const UpdateSetDto = CreateSetDto.partial();
export type UpdateSetDto = z.infer<typeof UpdateSetDto>;
