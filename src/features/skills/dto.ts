import { z } from "zod";

export const CreateSkillDto = z.object({
  sessionBlockId: z.string().uuid().nullable().optional(),
  exerciseId: z.string().uuid().nullable().optional(),
  attempts: z.coerce.number().int().min(0).nullable().optional(),
  successes: z.coerce.number().int().min(0).nullable().optional(),
  qualityScore: z.union([z.string(), z.number()]).nullable().optional(), // numeric in DB
  notes: z.string().trim().nullable().optional(),
});
export type CreateSkillDto = z.infer<typeof CreateSkillDto>;

export const UpdateSkillDto = CreateSkillDto.partial();
export type UpdateSkillDto = z.infer<typeof UpdateSkillDto>;
