import { z } from "zod";

export const OrgParam = z.object({ id: z.string().uuid() });
export const AthleteParam = z.object({ athleteId: z.string().uuid() });
export const AthleteLocationParam = z.object({
  athleteId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export const ListAthletesQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
});
export type ListAthletesQueryT = z.infer<typeof ListAthletesQuery>;

export const CreateAthleteDto = z.object({
  displayName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  clerkUserId: z.string().optional(),
});
export type CreateAthleteInput = z.infer<typeof CreateAthleteDto>;

export const UpdateAthleteDto = z.object({
  displayName: z.string().min(1).max(120).optional(),
  email: z.string().email().nullable().optional(),
  clerkUserId: z.string().nullable().optional(),
});
export type UpdateAthleteInput = z.infer<typeof UpdateAthleteDto>;

export const UpsertVisibilityDto = z.object({
  userId: z.string().uuid(),
  canView: z.boolean().optional(),
  canLog: z.boolean().optional(),
  canViewCoachNotes: z.boolean().optional(),
});
export type UpsertVisibilityInput = z.infer<typeof UpsertVisibilityDto>;

export const LinkLocationDto = z.object({
  trainingLocationId: z.string().uuid(),
  isDefault: z.boolean().optional(),
});
export type LinkLocationInput = z.infer<typeof LinkLocationDto>;

export const SetDefaultLocationDto = z.object({
  trainingLocationId: z.string().uuid(),
});
export type SetDefaultLocationInput = z.infer<typeof SetDefaultLocationDto>;

export const AthleteResponse = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  displayName: z.string(),
  email: z.string().nullable(),
  clerkUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AthleteResponseT = z.infer<typeof AthleteResponse>;

export const AthleteWithDefaultLocation = AthleteResponse.extend({
  defaultTrainingLocationId: z.string().uuid().nullable(),
  defaultTrainingLocationName: z.string().nullable(),
});
export type AthleteWithDefaultLocationT = z.infer<
  typeof AthleteWithDefaultLocation
>;

export const AthleteVisibilityResponse = z.object({
  id: z.string().uuid(),
  athleteId: z.string().uuid(),
  userId: z.string().uuid(),
  canView: z.boolean(),
  canLog: z.boolean(),
  canViewCoachNotes: z.boolean(),
});
export type AthleteVisibilityResponseT = z.infer<
  typeof AthleteVisibilityResponse
>;
