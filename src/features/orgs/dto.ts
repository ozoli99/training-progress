import { z } from "zod";

export const UUID = z.string().uuid();

export const OrgIdInput = z.object({
  orgId: UUID,
});

export const EnsureUserAccountInput = z.object({
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const UpsertOrgFromClerkInput = z.object({
  clerkOrgId: z.string().min(1),
  name: z.string().min(1),
  ownerUserId: UUID.optional(),
});

export const CreateOrgInput = z.object({
  name: z.string().min(1),
  ownerUserId: UUID.optional(),
  clerkOrgId: z.string().optional(),
});

export const ListUserOrgsInput = z
  .object({
    userId: UUID.optional(),
    clerkUserId: z.string().optional(),
  })
  .refine((v) => v.userId || v.clerkUserId, {
    message: "Provide either userId or clerkUserId",
  });

export const OrgRow = z.object({
  id: UUID,
  name: z.string(),
  clerkOrgId: z.string().nullish(),
  ownerUserId: UUID.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OrgSettingsRow = z.object({
  orgId: UUID,
  units: z.enum(["metric", "imperial"]).default("metric"),
  timezone: z.string().default("UTC"),
  defaultTrainingLocationId: UUID.nullable().default(null),
  preferences: z.unknown().nullable().default({}),
  updatedAt: z.string(),
});

export const OrgWithSettings = OrgRow.extend({
  settings: OrgSettingsRow.nullable(),
});

export const OrgMemberRow = z.object({
  id: UUID,
  orgId: UUID,
  userId: UUID,
  role: z.enum(["owner", "admin", "coach", "athlete"]),
  clerkMembershipId: z.string().nullish(),
  email: z.string().email().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OrgMembersResponse = z.object({
  items: z.array(OrgMemberRow),
});

export const SetOrgSettingsInput = OrgIdInput.extend({
  units: z.enum(["metric", "imperial"]).optional(),
  timezone: z.string().optional(),
  defaultTrainingLocationId: UUID.nullable().optional(),
  preferences: z.unknown().optional(),
});

export const AddMemberInput = z.object({
  orgId: UUID,
  userId: UUID,
  role: z.enum(["owner", "admin", "coach", "athlete"]),
  clerkMembershipId: z.string().optional(),
});

export const RemoveMemberInput = z.object({
  orgId: UUID,
  userId: UUID,
});

export const ChangeMemberRoleInput = z.object({
  orgId: UUID,
  userId: UUID,
  role: z.enum(["owner", "admin", "coach", "athlete"]),
});

export type TOrgRow = z.infer<typeof OrgRow>;
export type TOrgWithSettings = z.infer<typeof OrgWithSettings>;
export type TOrgSettingsRow = z.infer<typeof OrgSettingsRow>;
export type TOrgMemberRow = z.infer<typeof OrgMemberRow>;
