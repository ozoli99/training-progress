import { and, eq, gt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/infrastructure/db/client";
import {
  comment,
  commentThread,
  userAccount,
} from "@/infrastructure/db/schema";
import type { TCommentItem, TCommentThreadItem } from "./dto";

/** Opaque base64 cursor helpers: `${createdAt.toISOString()}__${id}` */
function makeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}__${id}`).toString("base64");
}
function parseCursor(cursor?: string): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf8");
    const [iso, id] = raw.split("__");
    if (!iso || !id) return null;
    return { createdAt: new Date(iso), id };
  } catch {
    return null;
  }
}

/** Repository interface */
export interface ICommentsRepository {
  ensureThread(input: {
    orgId: string;
    entityType: string;
    entityId: string;
  }): Promise<TCommentThreadItem>;

  getThreadById(threadId: string): Promise<TCommentThreadItem | null>;

  listThreadsByEntity(input: {
    orgId: string;
    entityType: string;
    entityId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: TCommentThreadItem[]; nextCursor: string | null }>;

  listComments(input: {
    threadId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: TCommentItem[]; nextCursor: string | null }>;

  createComment(input: {
    threadId: string;
    authorUserId: string;
    content: string;
    visibility: "public" | "org" | "private";
  }): Promise<TCommentItem>;

  getCommentById(commentId: string): Promise<TCommentItem | null>;

  updateComment(input: {
    commentId: string;
    content: string;
    visibility?: "public" | "org" | "private";
  }): Promise<TCommentItem | null>;

  deleteComment(commentId: string): Promise<void>;

  getThreadOrg(threadId: string): Promise<{ orgId: string } | null>;
}

/** Drizzle implementation */
class DrizzleCommentsRepository implements ICommentsRepository {
  async ensureThread(input: {
    orgId: string;
    entityType: string;
    entityId: string;
  }): Promise<TCommentThreadItem> {
    const existing = await db
      .select({
        id: commentThread.id,
        orgId: commentThread.orgId,
        entityType: commentThread.entityType,
        entityId: commentThread.entityId,
        createdAt: commentThread.createdAt,
      })
      .from(commentThread)
      .where(
        and(
          eq(commentThread.orgId, input.orgId),
          eq(commentThread.entityType, input.entityType),
          eq(commentThread.entityId, input.entityId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const t = existing[0];
      return {
        id: t.id,
        orgId: t.orgId,
        entityType: t.entityType,
        entityId: t.entityId,
        createdAt: t.createdAt.toISOString(),
        commentsCount: 0,
        lastCommentAt: undefined,
      };
    }

    const inserted = await db
      .insert(commentThread)
      .values({
        orgId: input.orgId,
        entityType: input.entityType,
        entityId: input.entityId,
      })
      .returning();

    const t = inserted[0];
    return {
      id: t.id,
      orgId: t.orgId,
      entityType: t.entityType,
      entityId: t.entityId,
      createdAt: t.createdAt.toISOString(),
      commentsCount: 0,
      lastCommentAt: undefined,
    };
  }

  async getThreadById(threadId: string): Promise<TCommentThreadItem | null> {
    const c = alias(comment, "c");

    const rows = await db
      .select({
        id: commentThread.id,
        orgId: commentThread.orgId,
        entityType: commentThread.entityType,
        entityId: commentThread.entityId,
        createdAt: commentThread.createdAt,
        commentsCount: sql<number>`COALESCE(COUNT(c.id),0)`.as(
          "comments_count"
        ),
        lastCommentAt: sql<Date | null>`MAX(c.created_at)`.as(
          "last_comment_at"
        ),
      })
      .from(commentThread)
      .leftJoin(c, eq(commentThread.id, sql`c.thread_id`))
      .where(eq(commentThread.id, threadId))
      .groupBy(
        commentThread.id,
        commentThread.orgId,
        commentThread.entityType,
        commentThread.entityId,
        commentThread.createdAt
      )
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      orgId: r.orgId,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt.toISOString(),
      commentsCount: Number(r.commentsCount ?? 0),
      lastCommentAt: r.lastCommentAt
        ? r.lastCommentAt.toISOString()
        : undefined,
    };
  }

  async listThreadsByEntity(input: {
    orgId: string;
    entityType: string;
    entityId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: TCommentThreadItem[]; nextCursor: string | null }> {
    const after = parseCursor(input.cursor);
    const c = alias(comment, "c");

    const rows = await db
      .select({
        id: commentThread.id,
        orgId: commentThread.orgId,
        entityType: commentThread.entityType,
        entityId: commentThread.entityId,
        createdAt: commentThread.createdAt,
        commentsCount: sql<number>`COALESCE(COUNT(c.id),0)`.as(
          "comments_count"
        ),
        lastCommentAt: sql<Date | null>`MAX(c.created_at)`.as(
          "last_comment_at"
        ),
      })
      .from(commentThread)
      .leftJoin(c, eq(commentThread.id, sql`c.thread_id`))
      .where(
        and(
          eq(commentThread.orgId, input.orgId),
          eq(commentThread.entityType, input.entityType),
          eq(commentThread.entityId, input.entityId),
          after ? gt(commentThread.createdAt, after.createdAt) : sql`TRUE`
        )
      )
      .groupBy(
        commentThread.id,
        commentThread.orgId,
        commentThread.entityType,
        commentThread.entityId,
        commentThread.createdAt
      )
      .orderBy(commentThread.createdAt)
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const slice = rows.slice(0, input.limit);
    const items: TCommentThreadItem[] = slice.map((r) => ({
      id: r.id,
      orgId: r.orgId,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt.toISOString(),
      commentsCount: Number(r.commentsCount ?? 0),
      lastCommentAt: r.lastCommentAt
        ? r.lastCommentAt.toISOString()
        : undefined,
    }));
    const next =
      hasMore && slice.length > 0
        ? makeCursor(
            slice[slice.length - 1]!.createdAt,
            slice[slice.length - 1]!.id
          )
        : null;

    return { items, nextCursor: next };
  }

  async listComments(input: {
    threadId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: TCommentItem[]; nextCursor: string | null }> {
    const after = parseCursor(input.cursor);

    const rows = await db
      .select({
        id: comment.id,
        threadId: comment.threadId,
        authorUserId: comment.authorUserId,
        authorName: userAccount.fullName,
        authorAvatarUrl: userAccount.avatarUrl,
        content: comment.content,
        visibility: comment.visibility,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })
      .from(comment)
      .leftJoin(userAccount, eq(userAccount.id, comment.authorUserId))
      .where(
        and(
          eq(comment.threadId, input.threadId),
          after ? gt(comment.createdAt, after.createdAt) : sql`TRUE`
        )
      )
      .orderBy(comment.createdAt)
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const slice = rows.slice(0, input.limit);
    const items: TCommentItem[] = slice.map((r) => ({
      id: r.id,
      threadId: r.threadId,
      authorUserId: r.authorUserId,
      authorName: r.authorName ?? undefined,
      authorAvatarUrl: r.authorAvatarUrl ?? undefined,
      content: r.content,
      visibility: (r.visibility as TCommentItem["visibility"]) ?? "org",
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    const next =
      hasMore && slice.length > 0
        ? makeCursor(
            slice[slice.length - 1]!.createdAt,
            slice[slice.length - 1]!.id
          )
        : null;

    return { items, nextCursor: next };
  }

  async createComment(input: {
    threadId: string;
    authorUserId: string;
    content: string;
    visibility: "public" | "org" | "private";
  }): Promise<TCommentItem> {
    const rows = await db
      .insert(comment)
      .values({
        threadId: input.threadId,
        authorUserId: input.authorUserId,
        content: input.content,
        visibility: input.visibility,
      })
      .returning();

    const c = rows[0];
    const author = await db
      .select({
        name: userAccount.fullName,
        avatarUrl: userAccount.avatarUrl,
      })
      .from(userAccount)
      .where(eq(userAccount.id, c.authorUserId))
      .limit(1);

    return {
      id: c.id,
      threadId: c.threadId,
      authorUserId: c.authorUserId,
      authorName: author[0]?.name ?? undefined,
      authorAvatarUrl: author[0]?.avatarUrl ?? undefined,
      content: c.content,
      visibility: (c.visibility as TCommentItem["visibility"]) ?? "org",
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async getCommentById(commentId: string): Promise<TCommentItem | null> {
    const rows = await db
      .select({
        id: comment.id,
        threadId: comment.threadId,
        authorUserId: comment.authorUserId,
        authorName: userAccount.fullName,
        authorAvatarUrl: userAccount.avatarUrl,
        content: comment.content,
        visibility: comment.visibility,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })
      .from(comment)
      .leftJoin(userAccount, eq(userAccount.id, comment.authorUserId))
      .where(eq(comment.id, commentId))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      threadId: r.threadId,
      authorUserId: r.authorUserId,
      authorName: r.authorName ?? undefined,
      authorAvatarUrl: r.authorAvatarUrl ?? undefined,
      content: r.content,
      visibility: (r.visibility as TCommentItem["visibility"]) ?? "org",
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  async updateComment(input: {
    commentId: string;
    content: string;
    visibility?: "public" | "org" | "private";
  }): Promise<TCommentItem | null> {
    const rows = await db
      .update(comment)
      .set({
        content: input.content,
        ...(input.visibility ? { visibility: input.visibility } : {}),
        updatedAt: new Date(),
      })
      .where(eq(comment.id, input.commentId))
      .returning();

    if (rows.length === 0) return null;
    const c = rows[0];

    const author = await db
      .select({
        name: userAccount.fullName,
        avatarUrl: userAccount.avatarUrl,
      })
      .from(userAccount)
      .where(eq(userAccount.id, c.authorUserId))
      .limit(1);

    return {
      id: c.id,
      threadId: c.threadId,
      authorUserId: c.authorUserId,
      authorName: author[0]?.name ?? undefined,
      authorAvatarUrl: author[0]?.avatarUrl ?? undefined,
      content: c.content,
      visibility: (c.visibility as TCommentItem["visibility"]) ?? "org",
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    await db.delete(comment).where(eq(comment.id, commentId));
  }

  async getThreadOrg(threadId: string): Promise<{ orgId: string } | null> {
    const rows = await db
      .select({ orgId: commentThread.orgId })
      .from(commentThread)
      .where(eq(commentThread.id, threadId))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const commentsRepository: ICommentsRepository =
  new DrizzleCommentsRepository();

export const commentCursors = { makeCursor, parseCursor };
