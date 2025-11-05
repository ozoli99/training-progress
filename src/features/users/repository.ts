import { db } from "@/infrastructure/db/client";
import { userAccount } from "@/infrastructure/db/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";

export type UserRow = InferSelectModel<typeof userAccount>;
export type NewUserRow = InferInsertModel<typeof userAccount>;

export async function insertUser(values: NewUserRow): Promise<UserRow> {
  const [row] = await db.insert(userAccount).values(values).returning();
  return row;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(userAccount)
    .where(eq(userAccount.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(userAccount)
    .where(eq(userAccount.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserByClerkId(
  clerkUserId: string
): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(userAccount)
    .where(eq(userAccount.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listUsers(opts: {
  limit: number;
  offset: number;
  email?: string;
  clerkUserId?: string;
}): Promise<UserRow[]> {
  const { limit, offset, email, clerkUserId } = opts;

  const where = email
    ? eq(userAccount.email, email)
    : clerkUserId
      ? eq(userAccount.clerkUserId, clerkUserId)
      : undefined;

  return db
    .select()
    .from(userAccount)
    .where(where as any)
    .limit(limit)
    .offset(offset)
    .orderBy(userAccount.createdAt);
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<UserRow, "fullName" | "avatarUrl">>
): Promise<UserRow> {
  const [row] = await db
    .update(userAccount)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(userAccount.id, id))
    .returning();
  return row!;
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(userAccount).where(eq(userAccount.id, id));
}
