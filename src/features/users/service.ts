import { AppError } from "@/shared/errors";
import type { CreateUserInput, UpdateUserInput } from "./dto";
import {
  insertUser,
  getUserByEmail,
  getUserById,
  getUserByClerkId,
  listUsers,
  updateUser,
  deleteUser,
} from "./repository";

function toResponse(
  row: Awaited<ReturnType<typeof getUserById>> extends infer T
    ? NonNullable<T>
    : never
) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
    clerkUserId: row.clerkUserId,
    createdAt:
      row.createdAt.toISOString?.() ??
      new Date(row.createdAt as any).toISOString(),
    updatedAt:
      row.updatedAt.toISOString?.() ??
      new Date(row.updatedAt as any).toISOString(),
  };
}

export async function createUser(input: CreateUserInput) {
  const exists = await getUserByEmail(input.email);
  if (exists)
    throw new AppError.Conflict("User with this email already exists");

  if (input.clerkUserId) {
    const clerkExists = await getUserByClerkId(input.clerkUserId);
    if (clerkExists)
      throw new AppError.Conflict("This Clerk user is already linked");
  }

  const row = await insertUser({
    email: input.email,
    fullName: input.fullName ?? null,
    avatarUrl: input.avatarUrl ?? null,
    clerkUserId: input.clerkUserId ?? null,
  });

  return toResponse(row);
}

export async function fetchUser(id: string) {
  const row = await getUserById(id);
  if (!row) throw new AppError.NotFound("User not found");
  return toResponse(row);
}

export async function listUsersService(params: {
  limit: number;
  offset: number;
  email?: string;
  clerkUserId?: string;
}) {
  const rows = await listUsers(params);
  return rows.map(toResponse);
}

export async function patchUser(id: string, patch: UpdateUserInput) {
  const existing = await getUserById(id);
  if (!existing) throw new AppError.NotFound("User not found");

  const updated = await updateUser(id, {
    fullName: patch.fullName ?? existing.fullName,
    avatarUrl: patch.avatarUrl ?? existing.avatarUrl,
  });

  return toResponse(updated);
}

export async function removeUser(id: string) {
  const existing = await getUserById(id);
  if (!existing) throw new AppError.NotFound("User not found");
  await deleteUser(id);
}
