import { z } from "zod";

export const OrgParam = z.object({ id: z.string().uuid() });
export const LocationParam = z.object({
  id: z.string().uuid(),
  locationId: z.string().uuid(),
});
export const LocationEquipmentParam = z.object({
  id: z.string().uuid(),
  locationId: z.string().uuid(),
  tleId: z.string().uuid(),
});

export const ListLocationsQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListLocationsQueryT = z.infer<typeof ListLocationsQuery>;

export const ListLocationEquipmentQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListLocationEquipmentQueryT = z.infer<
  typeof ListLocationEquipmentQuery
>;

export const CreateLocationDto = z.object({
  name: z.string().min(1).max(120),
  address: z.string().optional(),
  type: z.enum(["gym", "home", "outdoor"]).optional(),
  isActive: z.boolean().optional(),
});
export type CreateLocationInput = z.infer<typeof CreateLocationDto>;

export const UpdateLocationDto = z.object({
  name: z.string().min(1).max(120).optional(),
  address: z.string().optional().nullable(),
  type: z.enum(["gym", "home", "outdoor"]).optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateLocationInput = z.infer<typeof UpdateLocationDto>;

export const CreateLocationEquipmentDto = z.object({
  name: z.string().min(1).max(120),
  variant: z.string().min(1).max(120).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
export type CreateLocationEquipmentInput = z.infer<
  typeof CreateLocationEquipmentDto
>;

export const UpdateLocationEquipmentDto = z.object({
  name: z.string().min(1).max(120).optional(),
  variant: z.string().min(1).max(120).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLocationEquipmentInput = z.infer<
  typeof UpdateLocationEquipmentDto
>;

export const LocationResponse = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable(),
  type: z.enum(["gym", "home", "outdoor"]).nullable(),
  isActive: z.boolean(),
});
export type LocationResponseT = z.infer<typeof LocationResponse>;

export const LocationEquipmentResponse = z.object({
  id: z.string().uuid(),
  trainingLocationId: z.string().uuid(),
  name: z.string(),
  variant: z.string().nullable(),
  specs: z.record(z.string(), z.unknown()).nullable(),
  isActive: z.boolean(),
});
export type LocationEquipmentResponseT = z.infer<
  typeof LocationEquipmentResponse
>;
