import { z } from "zod";

export const CreateUserDto = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200).optional(),
  avatarUrl: z.string().url().optional(),
  clerkUserId: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserDto>;

export const UpdateUserDto = z.object({
  fullName: z.string().min(1).max(200).optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;

export const UserResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  clerkUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserResponseT = z.infer<typeof UserResponse>;

export const ListUsersQuery = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  email: z.string().email().optional(),
  clerkUserId: z.string().optional(),
});
export type ListUsersQueryT = z.infer<typeof ListUsersQuery>;
