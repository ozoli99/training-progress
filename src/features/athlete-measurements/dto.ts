import { z } from "zod";

const ISODateTime = z
  .string()
  .datetime({ offset: true })
  .or(z.date())
  .transform((v) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  });

export const ListMeasurementsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.string().min(1).optional(),
  from: ISODateTime.optional(),
  to: ISODateTime.optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListMeasurementsQuery = z.infer<typeof ListMeasurementsQuery>;

export const CreateMeasurementDto = z
  .object({
    measuredAt: ISODateTime,
    type: z.string().min(1),
    valueNum: z.coerce.number().optional(),
    valueJson: z.record(z.string(), z.any()).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.valueNum !== undefined || d.valueJson !== undefined, {
    message: "Provide valueNum or valueJson",
    path: ["valueNum"],
  });

export type CreateMeasurementDto = z.infer<typeof CreateMeasurementDto>;

export const UpdateMeasurementDto = z
  .object({
    measuredAt: ISODateTime.optional(),
    type: z.string().min(1).optional(),
    valueNum: z.coerce.number().nullable().optional(),
    valueJson: z.record(z.string(), z.any()).nullable().optional(),
    source: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((d) => {
    return true;
  });

export type UpdateMeasurementDto = z.infer<typeof UpdateMeasurementDto>;
