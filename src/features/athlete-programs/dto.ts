import { z } from "zod";

const ISODate = z
  .string()
  .date()
  .or(z.coerce.date())
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v));

export const ListAthleteProgramsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().optional(),
  programId: z.string().uuid().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAthleteProgramsQuery = z.infer<typeof ListAthleteProgramsQuery>;

export const CreateAthleteProgramDto = z.object({
  programId: z.string().uuid(),
  startDate: ISODate,
  currentWeek: z.coerce.number().int().min(1).default(1),
  isActive: z.coerce.boolean().default(true),
});
export type CreateAthleteProgramDto = z.infer<typeof CreateAthleteProgramDto>;

export const UpdateAthleteProgramDto = z.object({
  startDate: ISODate.optional(),
  currentWeek: z.coerce.number().int().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type UpdateAthleteProgramDto = z.infer<typeof UpdateAthleteProgramDto>;
