import { z } from "zod";

export const UUID = z.string().uuid();

export const UserRow = z.object({
  id: UUID,
  email: z.string().email(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  clerkUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TUserRow = z.infer<typeof UserRow>;

export const CreateUserInput = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  clerkUserId: z.string().optional(),
});

export const UpdateUserInput = z.object({
  userId: UUID,
  email: z.string().email().optional(),
  fullName: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const DeleteUserInput = z.object({
  userId: UUID,
});

export const ListUsersInput = z.object({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const SyncUserFromClerkInput = z.object({
  clerkUserId: z.string(),
  email: z.string().email(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

/** External Identities */
export const ExternalIdentityRow = z.object({
  id: UUID,
  userId: UUID,
  provider: z.string(),
  externalUserId: z.string(),
  credentials: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TExternalIdentityRow = z.infer<typeof ExternalIdentityRow>;

export const ListExternalIdentitiesInput = z.object({
  userId: UUID,
});

export const GetExternalIdentityInput = z.object({
  userId: UUID,
  id: UUID,
});

export const CreateExternalIdentityInput = z.object({
  userId: UUID,
  provider: z.string(),
  externalUserId: z.string(),
  credentials: z.unknown().optional(),
});

export const UpdateExternalIdentityInput = z.object({
  userId: UUID,
  id: UUID,
  externalUserId: z.string().optional(),
  credentials: z.unknown().optional(),
});

export const DeleteExternalIdentityInput = z.object({
  userId: UUID,
  id: UUID,
});
