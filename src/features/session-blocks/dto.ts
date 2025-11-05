import { z } from "zod";

export const CreateBlockDto = z.object({
  blockType: z.string().trim().optional(),
  title: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type CreateBlockDto = z.infer<typeof CreateBlockDto>;

export const UpdateBlockDto = z.object({
  blockType: z.string().trim().optional(),
  title: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  blockIndex: z.coerce.number().int().min(0).optional(),
});
export type UpdateBlockDto = z.infer<typeof UpdateBlockDto>;
