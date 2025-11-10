import { z } from "zod";

export const UUID = z.string().uuid();

export const OrgScoped = z.object({ orgId: UUID });

export const EquipmentRow = z.object({
  id: UUID,
  orgId: UUID,
  name: z.string(),
  variant: z.string().nullable(),
  specs: z.record(z.string(), z.unknown()).nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TEquipmentRow = z.infer<typeof EquipmentRow>;

export const ListEquipmentInput = OrgScoped.extend({
  q: z.string().optional(),
  includeInactive: z.boolean().optional(),
});

export const CreateEquipmentInput = OrgScoped.extend({
  name: z.string().min(1),
  variant: z.string().optional().nullable(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateEquipmentInput = OrgScoped.extend({
  equipmentId: UUID,
  name: z.string().min(1).optional(),
  variant: z.string().optional().nullable(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const DeleteEquipmentInput = OrgScoped.extend({
  equipmentId: UUID,
});

export const GetEquipmentInput = OrgScoped.extend({
  equipmentId: UUID,
});
