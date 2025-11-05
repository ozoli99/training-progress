import { z } from "zod";

export const OrgParam = z.object({ id: z.string().uuid() });
export const MovementGroupParam = z.object({
  id: z.string().uuid(),
  movementGroupId: z.string().uuid(),
});

export const ListMovementGroupsQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListMovementGroupsQueryT = z.infer<typeof ListMovementGroupsQuery>;

export const CreateMovementGroupDto = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type CreateMovementGroupInput = z.infer<typeof CreateMovementGroupDto>;

export const UpdateMovementGroupDto = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateMovementGroupInput = z.infer<typeof UpdateMovementGroupDto>;

export const MovementGroupResponse = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});
export type MovementGroupResponseT = z.infer<typeof MovementGroupResponse>;
