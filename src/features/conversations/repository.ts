import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import {
  conversation,
  conversationParticipant,
  message,
  messageRead,
  userAccount,
} from "@/infrastructure/db/schema";
import { db } from "@/infrastructure/db/client";
import type {
  TConversationDetails,
  TConversationItem,
  TMessageItem,
} from "./dto";

function makeCursor(ts: Date, id: string) {
  return Buffer.from(`${ts.toISOString()}__${id}`).toString("base64");
}
function parseCursor(cursor?: string): { ts: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64").toString("utf8");
    const [iso, id] = raw.split("__");
    if (!iso || !id) return null;
    return { ts: new Date(iso), id };
  } catch {
    return null;
  }
}

export interface IConversationsRepository {
  getConvOrg(conversationId: string): Promise<{ orgId: string } | null>;

  listConversationsForUser(input: {
    orgId: string;
    userId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: TConversationItem[]; nextCursor: string | null }>;

  createConversation(input: {
    orgId: string;
    subject?: string;
    type?: string;
  }): Promise<{
    id: string;
    orgId: string;
    subject?: string;
    type?: string;
    createdAt: string;
  }>;

  upsertParticipant(input: {
    conversationId: string;
    userId: string;
    isPinned?: boolean;
  }): Promise<{ participantId: string }>;

  removeParticipant(input: {
    conversationId: string;
    userId: string;
  }): Promise<void>;

  listParticipants(conversationId: string): Promise<
    {
      participantId: string;
      userId: string;
      fullName?: string | null;
      avatarUrl?: string | null;
      isPinned: boolean;
      joinedAt: string;
    }[]
  >;

  getConversation(
    conversationId: string,
    viewerUserId: string
  ): Promise<TConversationDetails | null>;

  listMessages(input: {
    conversationId: string;
    userId: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: TMessageItem[]; nextCursor: string | null }>;

  sendMessage(input: {
    conversationId: string;
    senderUserId: string;
    body: string;
    metadata?: any;
  }): Promise<TMessageItem>;

  markMessageRead(input: {
    conversationId: string;
    userId: string;
    messageId: string;
  }): Promise<void>;

  setPinned(input: {
    conversationId: string;
    userId: string;
    isPinned: boolean;
  }): Promise<void>;

  isParticipant(conversationId: string, userId: string): Promise<boolean>;
}

class DrizzleConversationsRepository implements IConversationsRepository {
  async getConvOrg(conversationId: string) {
    const rows = await db
      .select({ orgId: conversation.orgId })
      .from(conversation)
      .where(eq(conversation.id, conversationId))
      .limit(1);
    return rows[0] ?? null;
  }

  async isParticipant(conversationId: string, userId: string) {
    const rows = await db
      .select({ id: conversationParticipant.id })
      .from(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, conversationId),
          eq(conversationParticipant.userId, userId)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async createConversation(input: {
    orgId: string;
    subject?: string;
    type?: string;
  }) {
    const rows = await db
      .insert(conversation)
      .values({
        orgId: input.orgId,
        subject: input.subject,
        type: input.type,
      })
      .returning();
    const c = rows[0];
    return {
      id: c.id,
      orgId: c.orgId,
      subject: c.subject ?? undefined,
      type: c.type ?? undefined,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async upsertParticipant(input: {
    conversationId: string;
    userId: string;
    isPinned?: boolean;
  }) {
    const found = await db
      .select({ id: conversationParticipant.id })
      .from(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, input.conversationId),
          eq(conversationParticipant.userId, input.userId)
        )
      )
      .limit(1);

    if (found.length > 0) {
      if (typeof input.isPinned === "boolean") {
        await db
          .update(conversationParticipant)
          .set({ isPinned: input.isPinned })
          .where(eq(conversationParticipant.id, found[0]!.id));
      }
      return { participantId: found[0]!.id };
    }

    const ins = await db
      .insert(conversationParticipant)
      .values({
        conversationId: input.conversationId,
        userId: input.userId,
        isPinned: input.isPinned ?? false,
      })
      .returning({ id: conversationParticipant.id });
    return { participantId: ins[0]!.id };
  }

  async removeParticipant(input: { conversationId: string; userId: string }) {
    await db
      .delete(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, input.conversationId),
          eq(conversationParticipant.userId, input.userId)
        )
      );
  }

  async listParticipants(conversationId: string) {
    const rows = await db
      .select({
        participantId: conversationParticipant.id,
        userId: conversationParticipant.userId,
        fullName: userAccount.fullName,
        avatarUrl: userAccount.avatarUrl,
        isPinned: conversationParticipant.isPinned,
        joinedAt: conversationParticipant.joinedAt,
      })
      .from(conversationParticipant)
      .leftJoin(userAccount, eq(userAccount.id, conversationParticipant.userId))
      .where(eq(conversationParticipant.conversationId, conversationId));

    return rows.map((r) => ({
      participantId: r.participantId,
      userId: r.userId,
      fullName: r.fullName ?? null,
      avatarUrl: r.avatarUrl ?? null,
      isPinned: !!r.isPinned,
      joinedAt: r.joinedAt.toISOString(),
    }));
  }

  async listConversationsForUser(input: {
    orgId: string;
    userId: string;
    limit: number;
    cursor?: string;
  }) {
    const after = parseCursor(input.cursor);

    const lastMsgAt = sql<Date | null>`(
      SELECT MAX(m.sent_at) 
      FROM ${message} m 
      WHERE m.conversation_id = ${conversation.id}
    )`.as("last_msg_at");

    const lastMsg = db
      .select({
        id: message.id,
        senderUserId: message.senderUserId,
        body: message.body,
        sentAt: message.sentAt,
      })
      .from(message)
      .where(eq(message.conversationId, conversation.id))
      .orderBy(desc(message.sentAt))
      .limit(1);

    const unreadCount = sql<number>`(
      SELECT COUNT(*)::int
      FROM ${message} m
      WHERE m.conversation_id = ${conversation.id}
      AND NOT EXISTS (
        SELECT 1 
        FROM ${conversationParticipant} cp
        JOIN ${messageRead} mr 
          ON mr.conversation_participant_id = cp.id 
         AND mr.message_id = m.id
        WHERE cp.conversation_id = ${conversation.id}
          AND cp.user_id = ${input.userId}
      )
      AND m.sender_user_id <> ${input.userId}
    )`.as("unread_count");

    const pinned = sql<boolean>`COALESCE((
      SELECT cp.is_pinned
      FROM ${conversationParticipant} cp
      WHERE cp.conversation_id = ${conversation.id}
        AND cp.user_id = ${input.userId}
      LIMIT 1
    ), false)`.as("is_pinned");

    const rows = await db
      .select({
        id: conversation.id,
        orgId: conversation.orgId,
        subject: conversation.subject,
        type: conversation.type,
        createdAt: conversation.createdAt,
        lastMsgAt,
        unreadCount,
        isPinned: pinned,
        lastMessageId: sql<string | null>`(${lastMsg}).id`,
        lastMessageSenderUserId: sql<
          string | null
        >`(${lastMsg}).sender_user_id`,
        lastMessageBody: sql<string | null>`(${lastMsg}).body`,
        lastMessageSentAt: sql<Date | null>`(${lastMsg}).sent_at`,
      })
      .from(conversation)
      .innerJoin(
        conversationParticipant,
        and(
          eq(conversationParticipant.conversationId, conversation.id),
          eq(conversationParticipant.userId, input.userId)
        )
      )
      .where(
        and(
          eq(conversation.orgId, input.orgId),
          after ? gt(conversation.createdAt, after.ts) : sql`TRUE`
        )
      )
      .orderBy(desc(pinned), desc(lastMsgAt), desc(conversation.createdAt))
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const slice = rows.slice(0, input.limit);

    const items: TConversationItem[] = slice.map((r) => ({
      id: r.id,
      orgId: r.orgId,
      subject: r.subject ?? undefined,
      type: r.type ?? undefined,
      createdAt: r.createdAt.toISOString(),
      isPinned: !!r.isPinned,
      unreadCount: Number(r.unreadCount ?? 0),
      lastMessageAt: r.lastMsgAt ? r.lastMsgAt.toISOString() : null,
      lastMessagePreview:
        r.lastMessageId && r.lastMessageSentAt
          ? {
              id: r.lastMessageId,
              senderUserId: r.lastMessageSenderUserId!,
              body: r.lastMessageBody ?? "",
              sentAt: r.lastMessageSentAt.toISOString(),
            }
          : null,
    }));

    const next =
      hasMore && slice.length > 0
        ? makeCursor(
            slice[slice.length - 1]!.createdAt
              ? new Date(slice[slice.length - 1]!.createdAt)
              : new Date(),
            slice[slice.length - 1]!.id
          )
        : null;

    return { items, nextCursor: next };
  }

  async getConversation(conversationId: string, viewerUserId: string) {
    const base = await db
      .select({
        id: conversation.id,
        orgId: conversation.orgId,
        subject: conversation.subject,
        type: conversation.type,
        createdAt: conversation.createdAt,
      })
      .from(conversation)
      .where(eq(conversation.id, conversationId))
      .limit(1);

    if (base.length === 0) return null;
    const c = base[0];

    const amIn = await this.isParticipant(conversationId, viewerUserId);
    if (!amIn) return null;

    const pinnedRow = await db
      .select({ isPinned: conversationParticipant.isPinned })
      .from(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, conversationId),
          eq(conversationParticipant.userId, viewerUserId)
        )
      )
      .limit(1);

    const unreadRow = await db
      .select({ n: count().as("n") })
      .from(message)
      .leftJoin(
        messageRead,
        and(
          eq(messageRead.messageId, message.id),
          eq(
            messageRead.conversationParticipantId,
            sql`(
          SELECT id
          FROM ${conversationParticipant}
          WHERE conversation_id = ${conversationId}
            AND user_id = ${viewerUserId}
          LIMIT 1
        )`
          )
        )
      )
      .where(eq(message.conversationId, conversationId))
      .limit(1);

    const participants = await this.listParticipants(conversationId);

    const last = await db
      .select({
        id: message.id,
        senderUserId: message.senderUserId,
        body: message.body,
        sentAt: message.sentAt,
      })
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(desc(message.sentAt))
      .limit(1);

    const details: TConversationDetails = {
      id: c.id,
      orgId: c.orgId,
      subject: c.subject ?? undefined,
      type: c.type ?? undefined,
      createdAt: c.createdAt.toISOString(),
      isPinned: Boolean(pinnedRow[0]?.isPinned),
      unreadCount: Number(unreadRow[0]?.n ?? 0),
      lastMessageAt: last[0]?.sentAt ? last[0].sentAt.toISOString() : null,
      lastMessagePreview: last[0]
        ? {
            id: last[0].id,
            senderUserId: last[0].senderUserId,
            body: last[0].body,
            sentAt: last[0].sentAt.toISOString(),
          }
        : null,
      participants,
    };

    return details;
  }

  async listMessages(input: {
    conversationId: string;
    userId: string;
    limit: number;
    cursor?: string;
  }) {
    const after = parseCursor(input.cursor);

    const rows = await db
      .select({
        id: message.id,
        conversationId: message.conversationId,
        senderUserId: message.senderUserId,
        senderName: userAccount.fullName,
        senderAvatarUrl: userAccount.avatarUrl,
        body: message.body,
        metadata: message.metadata,
        sentAt: message.sentAt,
        readId: sql<string | null>`(
          SELECT mr.id 
          FROM ${messageRead} mr
          JOIN ${conversationParticipant} cp
            ON cp.id = mr.conversation_participant_id
          WHERE mr.message_id = ${message.id}
            AND cp.user_id = ${input.userId}
          LIMIT 1
        )`,
      })
      .from(message)
      .leftJoin(userAccount, eq(userAccount.id, message.senderUserId))
      .where(
        and(
          eq(message.conversationId, input.conversationId),
          after ? gt(message.sentAt, after.ts) : sql`TRUE`
        )
      )
      .orderBy(message.sentAt)
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const slice = rows.slice(0, input.limit);

    const items: TMessageItem[] = slice.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      senderUserId: r.senderUserId,
      senderName: r.senderName ?? undefined,
      senderAvatarUrl: r.senderAvatarUrl ?? undefined,
      body: r.body,
      metadata: r.metadata ?? undefined,
      sentAt: r.sentAt.toISOString(),
      isRead: !!r.readId,
    }));

    const next =
      hasMore && slice.length > 0
        ? makeCursor(
            slice[slice.length - 1]!.sentAt,
            slice[slice.length - 1]!.id
          )
        : null;

    return { items, nextCursor: next };
  }

  async sendMessage(input: {
    conversationId: string;
    senderUserId: string;
    body: string;
    metadata?: any;
  }) {
    const ins = await db
      .insert(message)
      .values({
        conversationId: input.conversationId,
        senderUserId: input.senderUserId,
        body: input.body,
        metadata: input.metadata ?? null,
      })
      .returning();

    const m = ins[0];

    const sender = await db
      .select({
        name: userAccount.fullName,
        avatarUrl: userAccount.avatarUrl,
      })
      .from(userAccount)
      .where(eq(userAccount.id, m.senderUserId))
      .limit(1);

    return {
      id: m.id,
      conversationId: m.conversationId,
      senderUserId: m.senderUserId,
      senderName: sender[0]?.name ?? undefined,
      senderAvatarUrl: sender[0]?.avatarUrl ?? undefined,
      body: m.body,
      metadata: m.metadata ?? undefined,
      sentAt: m.sentAt.toISOString(),
      isRead: false,
    };
  }

  async markMessageRead(input: {
    conversationId: string;
    userId: string;
    messageId: string;
  }) {
    const pidRows = await db
      .select({ id: conversationParticipant.id })
      .from(conversationParticipant)
      .where(
        and(
          eq(conversationParticipant.conversationId, input.conversationId),
          eq(conversationParticipant.userId, input.userId)
        )
      )
      .limit(1);
    const pid = pidRows[0]?.id;
    if (!pid) return;

    await db
      .insert(messageRead)
      .values({
        messageId: input.messageId,
        conversationParticipantId: pid,
      })
      .onConflictDoNothing();
  }

  async setPinned(input: {
    conversationId: string;
    userId: string;
    isPinned: boolean;
  }) {
    await db
      .update(conversationParticipant)
      .set({ isPinned: input.isPinned })
      .where(
        and(
          eq(conversationParticipant.conversationId, input.conversationId),
          eq(conversationParticipant.userId, input.userId)
        )
      );
  }
}

export const conversationsRepository: IConversationsRepository =
  new DrizzleConversationsRepository();

export const conversationCursors = { makeCursor, parseCursor };
