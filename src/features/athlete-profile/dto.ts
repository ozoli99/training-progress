import { z } from "zod";

export const UUID = z.string().uuid();
export const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const OrgScoped = z.object({ orgId: UUID });

export const AthleteProfileRow = z.object({
  id: UUID,
  orgId: UUID,
  athleteId: UUID,
  profileDate: ISO_DATE,
  strengthIndex: z.number().nullable(),
  athleteScore: z.number().nullable(),
  lastMetrics: z.record(z.string(), z.unknown()).nullable(),
});
export type TAthleteProfileRow = z.infer<typeof AthleteProfileRow>;

export const AthleteProfileMetricRow = z.object({
  id: UUID,
  orgId: UUID,
  athleteId: UUID,
  athleteProfileId: UUID,
  profileDimensionId: UUID,
  value: z.number(),
});
export type TAthleteProfileMetricRow = z.infer<typeof AthleteProfileMetricRow>;

export const ListAthleteProfilesInput = OrgScoped.extend({
  athleteId: UUID,
  from: ISO_DATE.optional(),
  to: ISO_DATE.optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const GetAthleteProfileByIdInput = OrgScoped.extend({
  athleteProfileId: UUID,
});

export const GetAthleteProfileByDayInput = OrgScoped.extend({
  athleteId: UUID,
  profileDate: ISO_DATE,
});

export const UpsertAthleteProfileInput = OrgScoped.extend({
  athleteId: UUID,
  profileDate: ISO_DATE,
  strengthIndex: z.number().nullable().optional(),
  athleteScore: z.number().nullable().optional(),
  lastMetrics: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const UpdateAthleteProfileInput = OrgScoped.extend({
  athleteProfileId: UUID,
  strengthIndex: z.number().nullable().optional(),
  athleteScore: z.number().nullable().optional(),
  lastMetrics: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const DeleteAthleteProfileInput = OrgScoped.extend({
  athleteProfileId: UUID,
});

export const ListProfileMetricsInput = OrgScoped.extend({
  athleteProfileId: UUID,
});

export const SetProfileMetricInput = OrgScoped.extend({
  athleteId: UUID,
  athleteProfileId: UUID,
  profileDimensionId: UUID,
  value: z.number(),
});
