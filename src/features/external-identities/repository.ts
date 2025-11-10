import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { externalIdentity } from "@/infrastructure/db/schema";
import type { InferModel } from "drizzle-orm";
import type { TExternalIdentityItem } from "./dto";

/** Cursor helpers (createdAt,id) to prevent duplicates on same timestamp */
function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id })
  ).toString("base64");
}
function decodeCursor(cursor?: string | null) {
  if (!cursor) return null;
  try {
    const v = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    return { createdAt: new Date(v.createdAt), id: String(v.id) };
  } catch {
    return null;
  }
}

export interface IExternalIdentitiesRepository {
  listByUser(input: {
    userId: string;
    provider?: string;
    limit: number;
    cursor?: string | null;
  }): Promise<{ items: TExternalIdentityItem[]; nextCursor: string | null }>;

  getById(id: string): Promise<TExternalIdentityItem | null>;
  getByProviderKey(
    provider: string,
    externalUserId: string
  ): Promise<TExternalIdentityItem | null>;

  /** If an identity with same (provider,externalUserId) exists:
   *  - If userId differs => conflict (return null and let service throw)
   *  - If same user => update credentials
   *  Else create new.
   */
  upsert(input: {
    userId: string;
    provider: string;
    externalUserId: string;
    credentials?: unknown;
  }): Promise<TExternalIdentityItem | null /* null -> conflict */>;

  updateCredentials(input: { id: string; credentials: unknown }): Promise<void>;

  remove(input: { id: string }): Promise<void>;
}

function toItem(
  row: InferModel<typeof externalIdentity, "select">
): TExternalIdentityItem {
  return {
    id: row.id,
    userId: row.userId,
    provider: row.provider,
    externalUserId: row.externalUserId,
    credentials: (row as any).credentials ?? null,
    createdAt: row.createdAt.toISOString?.() ?? String(row.createdAt),
    updatedAt: row.updatedAt.toISOString?.() ?? String(row.updatedAt),
  };
}

export const externalIdentitiesRepository: IExternalIdentitiesRepository = {
  async listByUser({ userId, provider, limit, cursor }) {
    const c = decodeCursor(cursor);

    const where = and(
      eq(externalIdentity.userId, userId),
      provider ? eq(externalIdentity.provider, provider) : sql`true`,
      c
        ? sql`${externalIdentity.createdAt} < ${c.createdAt} OR (${externalIdentity.createdAt} = ${c.createdAt} AND ${externalIdentity.id} < ${c.id})`
        : sql`true`
    );

    const rows = await db
      .select()
      .from(externalIdentity)
      .where(where)
      .orderBy(desc(externalIdentity.createdAt), desc(externalIdentity.id))
      .limit(limit + 1);

    const hasNext = rows.length > limit;
    const items = (hasNext ? rows.slice(0, limit) : rows).map(toItem);
    const nextCursor = hasNext
      ? encodeCursor(
          items[items.length - 1].createdAt
            ? new Date(items[items.length - 1].createdAt)
            : new Date(),
          items[items.length - 1].id
        )
      : null;

    return { items, nextCursor };
  },

  async getById(id) {
    const [row] = await db
      .select()
      .from(externalIdentity)
      .where(eq(externalIdentity.id, id))
      .limit(1);
    return row ? toItem(row) : null;
  },

  async getByProviderKey(provider, externalUserId) {
    const [row] = await db
      .select()
      .from(externalIdentity)
      .where(
        and(
          eq(externalIdentity.provider, provider),
          eq(externalIdentity.externalUserId, externalUserId)
        )
      )
      .limit(1);
    return row ? toItem(row) : null;
  },

  async upsert({ userId, provider, externalUserId, credentials }) {
    // Check existing by unique (provider, externalUserId)
    const existing = await this.getByProviderKey(provider, externalUserId);
    if (existing) {
      if (existing.userId !== userId) {
        // conflict: the identity is already linked to another user
        return null;
      }
      // Same user => update credentials if provided
      if (typeof credentials !== "undefined") {
        await db
          .update(externalIdentity)
          .set({ credentials: credentials as any })
          .where(eq(externalIdentity.id, existing.id));
        const updated = await this.getById(existing.id);
        return updated!;
      }
      return existing;
    }

    // Insert new
    const [row] = await db
      .insert(externalIdentity)
      .values({
        userId,
        provider,
        externalUserId,
        credentials: (credentials ?? null) as any,
      })
      .returning();
    return toItem(row);
  },

  async updateCredentials({ id, credentials }) {
    await db
      .update(externalIdentity)
      .set({ credentials: credentials as any })
      .where(eq(externalIdentity.id, id));
  },

  async remove({ id }) {
    await db.delete(externalIdentity).where(eq(externalIdentity.id, id));
  },
};
