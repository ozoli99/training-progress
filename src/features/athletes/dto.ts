import { z } from "zod";

export const UUID = z.string().uuid();

export const OrgScoped = z.object({
  orgId: UUID,
});

export const AthleteRow = z.object({
  id: UUID,
  orgId: UUID,
  displayName: z.string(),
  email: z.string().email().nullable(),
  clerkUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TAthleteRow = z.infer<typeof AthleteRow>;

export const CreateAthleteInput = OrgScoped.extend({
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  clerkUserId: z.string().optional(),
});

export const UpdateAthleteInput = OrgScoped.extend({
  athleteId: UUID,
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
});

export const DeleteAthleteInput = OrgScoped.extend({
  athleteId: UUID,
});

export const ListAthletesInput = OrgScoped.extend({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const AthleteVisibilityRow = z.object({
  id: UUID,
  athleteId: UUID,
  userId: UUID,
  canView: z.boolean(),
  canLog: z.boolean(),
  canViewCoachNotes: z.boolean(),
});

export type TAthleteVisibilityRow = z.infer<typeof AthleteVisibilityRow>;

export const SetAthleteVisibilityInput = OrgScoped.extend({
  athleteId: UUID,
  userId: UUID,
  canView: z.boolean().optional(),
  canLog: z.boolean().optional(),
  canViewCoachNotes: z.boolean().optional(),
});

export const AthleteLocationRow = z.object({
  id: UUID, // link row id (athlete_training_location.id)
  athleteId: UUID,
  trainingLocationId: UUID,
  isDefault: z.boolean(),
  // helpful denorm for UI
  locationName: z.string().nullable(),
  locationType: z.string().nullable(),
  address: z.string().nullable(),
});

export type TAthleteLocationRow = z.infer<typeof AthleteLocationRow>;

export const LinkAthleteLocationInput = OrgScoped.extend({
  athleteId: UUID,
  trainingLocationId: UUID,
  isDefault: z.boolean().optional(), // if true, will make it default
});

export const UnlinkAthleteLocationInput = OrgScoped.extend({
  athleteId: UUID,
  trainingLocationId: UUID,
});

export const SetDefaultAthleteLocationInput = OrgScoped.extend({
  athleteId: UUID,
  trainingLocationId: UUID,
});

export const GetAthleteInput = OrgScoped.extend({
  athleteId: UUID,
});

export const ListAthleteLocationsInput = OrgScoped.extend({
  athleteId: UUID,
});

export const AthleteWithRelations = AthleteRow.extend({
  locations: z.array(AthleteLocationRow),
});

export type TAthleteWithRelations = z.infer<typeof AthleteWithRelations>;
