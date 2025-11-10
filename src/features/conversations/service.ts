import { AppError } from "@/shared/errors";
import type { AuthContext } from "@/features/auth/context";
import type { IConversationsRepository } from "./repository";
import {
  AddParticipantInput,
  ConversationDetails,
  ConversationItem,
  CreateConversationInput,
  GetConversationInput,
  ListConversationsInput,
  ListMessagesInput,
  MarkMessageReadInput,
  MessageItem,
  Page,
  RemoveParticipantInput,
  SendMessageInput,
  TogglePinInput,
  type TConversationDetails,
  type TConversationItem,
  type TMessageItem,
} from "./dto";
import { conversationsRepository } from "./repository";

function ensureOrg(ctx: AuthContext, orgId: string) {
  if (!ctx.orgId) throw new AppError.Forbidden("Organization not selected.");
  if (ctx.orgId !== orgId)
    throw new AppError.Forbidden("Cross-org access denied.");
}

async function ensureConvAccess(
  repo: IConversationsRepository,
  ctx: AuthContext,
  conversationId: string
) {
  const org = await repo.getConvOrg(conversationId);
  if (!org) throw new AppError.NotFound("Conversation not found.");
  ensureOrg(ctx, org.orgId);

  const isMember = await repo.isParticipant(conversationId, ctx.userId);
  if (!isMember)
    throw new AppError.Forbidden("Not a participant of this conversation.");
  return org.orgId;
}

export function makeConversationsService(repo: IConversationsRepository) {
  return {
    async listConversations(ctx: AuthContext, input: unknown) {
      const data = ListConversationsInput.parse(input);
      ensureOrg(ctx, data.orgId);

      const page = await repo.listConversationsForUser({
        orgId: data.orgId,
        userId: ctx.userId,
        limit: data.limit,
        cursor: data.cursor ?? undefined,
      });

      return Page(ConversationItem).parse(page);
    },

    async createConversation(
      ctx: AuthContext,
      input: unknown
    ): Promise<TConversationItem> {
      const data = CreateConversationInput.parse(input);
      ensureOrg(ctx, data.orgId);

      const base = await repo.createConversation({
        orgId: data.orgId,
        subject: data.subject,
        type: data.type,
      });

      await repo.upsertParticipant({
        conversationId: base.id,
        userId: ctx.userId,
      });

      const others = (data.participantUserIds ?? []).filter(
        (u) => u !== ctx.userId
      );
      for (const uid of others) {
        await repo.upsertParticipant({ conversationId: base.id, userId: uid });
      }

      if (data.firstMessage) {
        await repo.sendMessage({
          conversationId: base.id,
          senderUserId: ctx.userId,
          body: data.firstMessage.body,
          metadata: data.firstMessage.metadata,
        });
      }

      const details = await repo.getConversation(base.id, ctx.userId);
      if (!details) throw new AppError.Internal("Failed to load conversation.");
      const item: TConversationItem = {
        id: details.id,
        orgId: details.orgId,
        subject: details.subject,
        type: details.type,
        createdAt: details.createdAt,
        isPinned: details.isPinned,
        unreadCount: details.unreadCount,
        lastMessageAt: details.lastMessageAt ?? null,
        lastMessagePreview: details.lastMessagePreview ?? null,
      };
      return ConversationItem.parse(item);
    },

    async getConversation(
      ctx: AuthContext,
      input: unknown
    ): Promise<TConversationDetails> {
      const data = GetConversationInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);

      const details = await repo.getConversation(
        data.conversationId,
        ctx.userId
      );
      if (!details) throw new AppError.NotFound("Conversation not found.");
      return ConversationDetails.parse(details);
    },

    async listMessages(ctx: AuthContext, input: unknown) {
      const data = ListMessagesInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);

      const page = await repo.listMessages({
        conversationId: data.conversationId,
        userId: ctx.userId,
        limit: data.limit,
        cursor: data.cursor ?? undefined,
      });
      return Page(MessageItem).parse(page);
    },

    async sendMessage(ctx: AuthContext, input: unknown): Promise<TMessageItem> {
      const data = SendMessageInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);

      const msg = await repo.sendMessage({
        conversationId: data.conversationId,
        senderUserId: ctx.userId,
        body: data.body,
        metadata: data.metadata,
      });
      return MessageItem.parse(msg);
    },

    async markMessageRead(ctx: AuthContext, input: unknown): Promise<void> {
      const data = MarkMessageReadInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);

      await repo.markMessageRead({
        conversationId: data.conversationId,
        userId: ctx.userId,
        messageId: data.messageId,
      });
    },

    async togglePin(ctx: AuthContext, input: unknown): Promise<void> {
      const data = TogglePinInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);
      await repo.setPinned({
        conversationId: data.conversationId,
        userId: ctx.userId,
        isPinned: data.isPinned,
      });
    },

    async listParticipants(ctx: AuthContext, input: unknown) {
      const data = GetConversationInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);
      const list = await repo.listParticipants(data.conversationId);
      return list;
    },

    async addParticipant(ctx: AuthContext, input: unknown): Promise<void> {
      const data = AddParticipantInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);
      await repo.upsertParticipant({
        conversationId: data.conversationId,
        userId: data.userId,
      });
    },

    async removeParticipant(ctx: AuthContext, input: unknown): Promise<void> {
      const data = RemoveParticipantInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);

      await repo.removeParticipant({
        conversationId: data.conversationId,
        userId: data.userId,
      });
    },

    async upsertParticipant(ctx: AuthContext, input: unknown): Promise<void> {
      const base = AddParticipantInput.parse(input);
      await ensureConvAccess(repo, ctx, base.conversationId);
      const isPinned = (input as any)?.isPinned as boolean | undefined;
      await repo.upsertParticipant({
        conversationId: base.conversationId,
        userId: base.userId,
        isPinned,
      });
    },

    async setPinned(ctx: AuthContext, input: unknown): Promise<void> {
      const data = TogglePinInput.parse(input);
      await ensureConvAccess(repo, ctx, data.conversationId);
      await repo.setPinned({
        conversationId: data.conversationId,
        userId: ctx.userId,
        isPinned: data.isPinned,
      });
    },
  };
}

export const conversationsService = makeConversationsService(
  conversationsRepository
);
