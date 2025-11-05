import { z } from "zod";

export const CreateOrgDto = z.object({
  name: z.string().min(1).max(200),
  ownerUserId: z.string().uuid().optional(),
  clerkOrgId: z.string().optional(),
});
export type CreateOrgInput = z.infer<typeof CreateOrgDto>;

export const UpdateOrgDto = z.object({
  name: z.string().min(1).max(200).optional(),
  ownerUserId: z.string().uuid().optional(),
  clerkOrgId: z.string().optional(),
});
export type UpdateOrgInput = z.infer<typeof UpdateOrgDto>;

export const ListOrgsQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  ownerUserId: z.string().uuid().optional(),
  clerkOrgId: z.string().optional(),
  q: z.string().optional(),
});
export type ListOrgsQueryT = z.infer<typeof ListOrgsQuery>;

export const OrgResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerUserId: z.string().uuid().nullable(),
  clerkOrgId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrgResponseT = z.infer<typeof OrgResponse>;

export const AddMemberDto = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "coach", "athlete"]),
  clerkMembershipId: z.string().optional(),
});
export type AddMemberInput = z.infer<typeof AddMemberDto>;

export const UpdateMemberDto = z.object({
  role: z.enum(["owner", "admin", "coach", "athlete"]).optional(),
});
export type UpdateMemberInput = z.infer<typeof UpdateMemberDto>;

export const OrgIdParam = z.object({ id: z.string().uuid() });
export const OrgMemberParams = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});
