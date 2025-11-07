import { z } from "zod";

export const UUID = z.string().uuid();

export const ZRouteOrg = z.object({ orgId: UUID });
export const ZRouteWorkout = ZRouteOrg.extend({ workoutId: UUID });
export const ZRouteVersion = ZRouteWorkout.extend({ versionId: UUID });

export const ZListWorkoutsQuery = z.object({
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).default("asc").optional(),
});

export const ZCreateWorkoutInput = ZRouteOrg.extend({
  name: z.string().min(1),
  type: z.string().optional(),
});

export const ZUpdateWorkoutInput = ZRouteWorkout.extend({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
}).refine((v) => "name" in v || "type" in v, {
  message: "No fields to update.",
});

export const ZWorkoutRow = z.object({
  id: UUID,
  orgId: UUID,
  name: z.string(),
  type: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ZCreateVersionInput = ZRouteWorkout.extend({
  createdBy: UUID.optional(),
  status: z.enum(["active", "archived"]).optional(),
  cloneFromVersionId: UUID.optional(),
});

export const ZWorkoutVersionRow = z.object({
  id: UUID,
  workoutId: UUID,
  versionNumber: z.number().int().nonnegative(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string(),
  createdBy: UUID.nullable(),
});

export const ZListVersionsQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(["asc", "desc"]).default("asc").optional(),
});

export const ZPartItem = z.object({
  exerciseId: UUID,
  blockIndex: z.coerce.number().int().nonnegative().default(0),
  prescription: z.string().optional(),
});

export const ZReplaceVersionPartsInput = ZRouteVersion.extend({
  items: z.array(ZPartItem).min(0),
});

export const ZWorkoutPartVersionRow = z.object({
  id: UUID,
  workoutVersionId: UUID,
  exerciseId: UUID,
  blockIndex: z.number().int().nonnegative(),
  prescription: z.string().nullable(),
});

export type ListWorkoutsQuery = z.infer<typeof ZListWorkoutsQuery>;
export type CreateWorkoutInput = z.infer<typeof ZCreateWorkoutInput>;
export type UpdateWorkoutInput = z.infer<typeof ZUpdateWorkoutInput>;
export type CreateVersionInput = z.infer<typeof ZCreateVersionInput>;
export type ReplaceVersionPartsInput = z.infer<
  typeof ZReplaceVersionPartsInput
>;
export type ListVersionsQuery = z.infer<typeof ZListVersionsQuery>;

export type TWorkoutRow = z.infer<typeof ZWorkoutRow>;
export type TWorkoutVersionRow = z.infer<typeof ZWorkoutVersionRow>;
export type TWorkoutPartVersionRow = z.infer<typeof ZWorkoutPartVersionRow>;
