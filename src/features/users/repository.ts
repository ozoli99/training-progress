import { and, ilike, eq, or, sql } from "drizzle-orm";
import { db as defaultDatabase } from "@/infrastructure/db/client";
import {
  userAccount,
  externalIdentity,
  type userAccount as UserTbl,
} from "@/infrastructure/db/schema";
import type { TUserRow, TExternalIdentityRow } from "./dto";

export interface UsersRepository {
  list(input: {
    search?: string;
    limit: number;
    offset: number;
  }): Promise<TUserRow[]>;
  get(input: { userId: string }): Promise<TUserRow | null>;
  create(input: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    clerkUserId?: string;
  }): Promise<TUserRow>;
  update(input: {
    userId: string;
    email?: string;
    fullName?: string | null;
    avatarUrl?: string | null;
  }): Promise<TUserRow>;
  delete(input: { userId: string }): Promise<void>;

  upsertFromClerk(input: {
    clerkUserId: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  }): Promise<TUserRow>;

  listExternalIdentities(input: {
    userId: string;
  }): Promise<TExternalIdentityRow[]>;
  getExternalIdentity(input: {
    userId: string;
    id: string;
  }): Promise<TExternalIdentityRow | null>;
  createExternalIdentity(input: {
    userId: string;
    provider: string;
    externalUserId: string;
    credentials?: unknown;
  }): Promise<TExternalIdentityRow>;
  updateExternalIdentity(input: {
    userId: string;
    id: string;
    externalUserId?: string;
    credentials?: unknown;
  }): Promise<TExternalIdentityRow>;
  deleteExternalIdentity(input: { userId: string; id: string }): Promise<void>;
}

export function makeUsersRepository(
  database = defaultDatabase
): UsersRepository {
  return {
    async list({ search, limit, offset }) {
      const where =
        search && search.trim()
          ? or(
              ilike(userAccount.email, `%${search}%`),
              ilike(userAccount.fullName, `%${search}%`)
            )
          : sql`true`;

      const rows = await database
        .select()
        .from(userAccount)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(userAccount.createdAt);

      return rows.map(mapUserRow);
    },

    async get({ userId }) {
      const [row] = await database
        .select()
        .from(userAccount)
        .where(eq(userAccount.id, userId))
        .limit(1);
      return row ? mapUserRow(row) : null;
    },

    async create({ email, fullName, avatarUrl, clerkUserId }) {
      const [created] = await database
        .insert(userAccount)
        .values({
          email,
          fullName: fullName ?? null,
          avatarUrl: avatarUrl ?? null,
          clerkUserId: clerkUserId ?? null,
        })
        .returning();
      return mapUserRow(created);
    },

    async update({ userId, email, fullName, avatarUrl }) {
      const [updated] = await database
        .update(userAccount)
        .set({
          email: email === undefined ? sql`${userAccount.email}` : email,
          fullName:
            fullName === undefined
              ? sql`${userAccount.fullName}`
              : (fullName as any),
          avatarUrl:
            avatarUrl === undefined
              ? sql`${userAccount.avatarUrl}`
              : (avatarUrl as any),
          updatedAt: sql`now()`,
        })
        .where(eq(userAccount.id, userId))
        .returning();
      return mapUserRow(updated!);
    },

    async delete({ userId }) {
      await database.delete(userAccount).where(eq(userAccount.id, userId));
    },

    async upsertFromClerk({ clerkUserId, email, fullName, avatarUrl }) {
      const [row] = await database
        .insert(userAccount)
        .values({
          clerkUserId,
          email,
          fullName: fullName ?? null,
          avatarUrl: avatarUrl ?? null,
        })
        .onConflictDoUpdate({
          target: userAccount.email,
          set: {
            clerkUserId,
            fullName: fullName ?? sql`${userAccount.fullName}`,
            avatarUrl: avatarUrl ?? sql`${userAccount.avatarUrl}`,
            updatedAt: sql`now()`,
          },
        })
        .returning();

      return mapUserRow(row!);
    },

    async listExternalIdentities({ userId }) {
      const rows = await database
        .select()
        .from(externalIdentity)
        .where(eq(externalIdentity.userId, userId));
      return rows.map(mapExternalIdentityRow);
    },

    async getExternalIdentity({ userId, id }) {
      const [row] = await database
        .select()
        .from(externalIdentity)
        .where(
          and(eq(externalIdentity.userId, userId), eq(externalIdentity.id, id))
        )
        .limit(1);
      return row ? mapExternalIdentityRow(row) : null;
    },

    async createExternalIdentity({
      userId,
      provider,
      externalUserId,
      credentials,
    }) {
      const [created] = await database
        .insert(externalIdentity)
        .values({
          userId,
          provider,
          externalUserId,
          credentials: credentials ?? null,
        })
        .returning();
      return mapExternalIdentityRow(created);
    },

    async updateExternalIdentity({ userId, id, externalUserId, credentials }) {
      const [updated] = await database
        .update(externalIdentity)
        .set({
          externalUserId:
            externalUserId === undefined
              ? sql`${externalIdentity.externalUserId}`
              : externalUserId,
          credentials:
            credentials === undefined
              ? sql`${externalIdentity.credentials}`
              : (credentials as any),
          updatedAt: sql`now()`,
        })
        .where(
          and(eq(externalIdentity.userId, userId), eq(externalIdentity.id, id))
        )
        .returning();
      return mapExternalIdentityRow(updated!);
    },

    async deleteExternalIdentity({ userId, id }) {
      await database
        .delete(externalIdentity)
        .where(
          and(eq(externalIdentity.userId, userId), eq(externalIdentity.id, id))
        );
    },
  };
}

function mapUserRow(r: typeof UserTbl.$inferSelect): TUserRow {
  return {
    id: r.id,
    email: r.email,
    fullName: r.fullName ?? null,
    avatarUrl: r.avatarUrl ?? null,
    clerkUserId: r.clerkUserId ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

function mapExternalIdentityRow(
  r: typeof externalIdentity.$inferSelect
): TExternalIdentityRow {
  return {
    id: r.id,
    userId: r.userId,
    provider: r.provider,
    externalUserId: r.externalUserId,
    credentials: (r as any).credentials ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

export const usersRepository = makeUsersRepository();
export type { UsersRepository as TUsersRepository };
