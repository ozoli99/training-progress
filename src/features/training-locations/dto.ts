import { z } from "zod";

export const UUID = z.string().uuid();

export const OrgScoped = z.object({ orgId: UUID });

export const TrainingLocationRow = z.object({
  id: UUID,
  orgId: UUID,
  name: z.string(),
  type: z.string().nullable(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TTrainingLocationRow = z.infer<typeof TrainingLocationRow>;

export const ListTrainingLocationsInput = OrgScoped.extend({
  q: z.string().optional(),
  includeInactive: z.boolean().optional(),
});

export const CreateTrainingLocationInput = OrgScoped.extend({
  name: z.string().min(1),
  type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const UpdateTrainingLocationInput = OrgScoped.extend({
  locationId: UUID,
  name: z.string().min(1).optional(),
  type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const GetTrainingLocationInput = OrgScoped.extend({
  locationId: UUID,
});

export const TrainingLocationEquipmentRow = z.object({
  id: UUID,
  trainingLocationId: UUID,
  name: z.string(),
  variant: z.string().nullable(),
  specs: z.record(z.string(), z.unknown()).nullable().optional(), // jsonb
  isActive: z.boolean(),
});
export type TTrainingLocationEquipmentRow = z.infer<
  typeof TrainingLocationEquipmentRow
>;

export const ListLocationEquipmentInput = z.object({
  trainingLocationId: UUID,
  includeInactive: z.boolean().optional(),
});

export const AddLocationEquipmentInput = z.object({
  trainingLocationId: UUID,
  name: z.string().min(1),
  variant: z.string().optional().nullable(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateLocationEquipmentInput = z.object({
  equipmentId: UUID,
  name: z.string().min(1).optional(),
  variant: z.string().optional().nullable(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const RemoveLocationEquipmentInput = z.object({
  equipmentId: UUID,
});
