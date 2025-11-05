import { z } from "zod";

export const OrgParam = z.object({ id: z.string().uuid() });
export const EquipmentParam = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
});

export const ListEquipmentQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListEquipmentQueryT = z.infer<typeof ListEquipmentQuery>;

export const CreateEquipmentDto = z.object({
  name: z.string().min(1).max(120),
  variant: z.string().min(1).max(120).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
export type CreateEquipmentInput = z.infer<typeof CreateEquipmentDto>;

export const UpdateEquipmentDto = z.object({
  name: z.string().min(1).max(120).optional(),
  variant: z.string().min(1).max(120).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEquipmentInput = z.infer<typeof UpdateEquipmentDto>;

export const EquipmentResponse = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  variant: z.string().nullable(),
  specs: z.record(z.string(), z.unknown()).nullable(),
  isActive: z.boolean(),
});
export type EquipmentResponseT = z.infer<typeof EquipmentResponse>;
