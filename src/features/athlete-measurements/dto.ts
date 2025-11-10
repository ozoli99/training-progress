import { z } from "zod";

export const UUID = z.string().uuid();
export const ISO_DATETIME = z.string().datetime();
export const OrgScoped = z.object({ orgId: UUID });

export const AthleteMeasurementRow = z.object({
  id: UUID,
  orgId: UUID,
  athleteId: UUID,
  measuredAt: ISO_DATETIME,
  type: z.string(),
  valueNum: z.number().nullable(),
  valueJson: z.unknown().nullable(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type TAthleteMeasurementRow = z.infer<typeof AthleteMeasurementRow>;

export const ListAthleteMeasurementsInput = OrgScoped.extend({
  athleteId: UUID,
  from: ISO_DATETIME.optional(),
  to: ISO_DATETIME.optional(),
  types: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const GetAthleteMeasurementByIdInput = OrgScoped.extend({
  athleteMeasurementId: UUID,
});

export const CreateAthleteMeasurementInput = OrgScoped.extend({
  athleteId: UUID,
  measuredAt: ISO_DATETIME,
  type: z.string(),
  valueNum: z.number().nullable().optional(),
  valueJson: z.unknown().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateAthleteMeasurementInput = OrgScoped.extend({
  athleteMeasurementId: UUID,
  measuredAt: ISO_DATETIME.optional(),
  type: z.string().optional(),
  valueNum: z.number().nullable().optional(),
  valueJson: z.unknown().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const DeleteAthleteMeasurementInput = OrgScoped.extend({
  athleteMeasurementId: UUID,
});
