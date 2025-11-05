import { z } from "zod";

const nz = z
  .union([z.string(), z.number()])
  .transform((v) =>
    v === null || v === undefined || v === "" ? null : String(v)
  )
  .nullable();

export const CreateIntervalDto = z.object({
  sessionBlockId: z.string().uuid().nullable().optional(),
  exerciseId: z.string().uuid().nullable().optional(),
  intervalIndex: z.coerce.number().int().min(0).optional(), // auto-index if omitted
  targetValue: z.any().optional(), // JSON
  actualValue: z.any().optional(), // JSON
  durationS: nz, // numeric in DB => string on wire
  notes: z.string().trim().nullable().optional(),
});
export type CreateIntervalDto = z.infer<typeof CreateIntervalDto>;

export const UpdateIntervalDto = CreateIntervalDto.partial();
export type UpdateIntervalDto = z.infer<typeof UpdateIntervalDto>;
